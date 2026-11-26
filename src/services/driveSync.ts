/**
 * Keeps the user profile in one JSON file inside the Google Drive app-data folder
 * (scope drive.appdata: hidden from the user's Drive, no access to their other files).
 *
 * On sign-in and on "Sync now": download → merge into local state → upload if anything changed.
 * After local edits the same round runs again with a debounce. Offline or with an expired token,
 * changes stay pending and go out when the connection is back or after the user signs in again.
 */
import { useSyncExternalStore } from 'react';
import { getState, replaceState, subscribe } from '../store/store';
import { mergeProfile, parseProfile, toProfile, type SyncProfile } from '../store/profile';
import { AuthCancelled, googleSignIn, googleSignOut, googleUnavailableReason, ScopeDenied, type GoogleToken, type GoogleUser } from './googleAuth';

const FILE_NAME = 'kanga360-profile.json';
const ACCOUNT_KEY = 'kanga360-google-v1';
const TOKEN_KEY = 'kanga360-google-token';
const DEBOUNCE_MS = 4000;

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'offline' | 'reauth' | 'denied' | 'error';

export interface GoogleAccount extends GoogleUser {
  lastSync?: number;
  fileId?: string;
}
export interface DriveSyncState {
  account: GoogleAccount | null;
  status: SyncStatus;
  pending: boolean;
}

// ───────── tiny store for the account (kept out of AppState so it never bumps updatedAt) ─────────
const readJson = <T,>(storage: Storage | undefined, key: string): T | null => {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const writeJson = (storage: Storage | undefined, key: string, v: unknown) => {
  try {
    if (v == null) storage?.removeItem(key);
    else storage?.setItem(key, JSON.stringify(v));
  } catch {
    /* storage blocked */
  }
};
const local = typeof localStorage === 'undefined' ? undefined : localStorage;
// The access token lives for about an hour; keep it for this tab only.
const session = typeof sessionStorage === 'undefined' ? undefined : sessionStorage;

let ds: DriveSyncState = { account: readJson<GoogleAccount>(local, ACCOUNT_KEY), status: 'idle', pending: false };
let token: GoogleToken | null = readJson<GoogleToken>(session, TOKEN_KEY);
const listeners = new Set<() => void>();

function patch(p: Partial<DriveSyncState>) {
  ds = { ...ds, ...p };
  if ('account' in p) writeJson(local, ACCOUNT_KEY, ds.account);
  listeners.forEach((l) => l());
}
function setToken(t: GoogleToken | null) {
  token = t;
  writeJson(session, TOKEN_KEY, t);
}

export function useDriveSync(): DriveSyncState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => ds,
  );
}

// ───────── Drive REST ─────────
class NeedsAuth extends Error {}
class Offline extends Error {}
class NewerFormat extends Error {}

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

async function drive(url: string, init: RequestInit = {}): Promise<Response> {
  if (!token || token.expiresAt - 60_000 < Date.now()) throw new NeedsAuth();
  let r: Response;
  try {
    r = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token.accessToken}` } });
  } catch {
    throw new Offline();
  }
  if (r.status === 401) {
    setToken(null);
    throw new NeedsAuth();
  }
  if (r.status === 403) {
    const body = await r.text();
    if (/insufficient|scope/i.test(body)) throw new NeedsAuth();
    throw new Error(`drive 403`);
  }
  return r;
}

async function findFile(): Promise<string | undefined> {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const r = await drive(`${API}/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc`);
  if (!r.ok) throw new Error(`drive list ${r.status}`);
  const { files } = (await r.json()) as { files?: { id: string }[] };
  return files?.[0]?.id;
}

/** undefined = file gone, null = unreadable content. */
async function download(id: string): Promise<SyncProfile | null | undefined> {
  const r = await drive(`${API}/files/${encodeURIComponent(id)}?alt=media`);
  if (r.status === 404) return undefined;
  if (!r.ok) throw new Error(`drive get ${r.status}`);
  let raw: unknown;
  try {
    raw = await r.json();
  } catch {
    return null;
  }
  const v = (raw as { v?: unknown } | null)?.v;
  if (typeof v === 'number' && v > 1) throw new NewerFormat();
  return parseProfile(raw);
}

async function upload(body: string, id?: string): Promise<string> {
  if (id) {
    const r = await drive(`${UPLOAD}/files/${encodeURIComponent(id)}?uploadType=media&fields=id`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (r.ok) return ((await r.json()) as { id: string }).id;
    if (r.status !== 404) throw new Error(`drive update ${r.status}`);
  }
  const boundary = `kanga${Math.random().toString(36).slice(2)}`;
  const meta = JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' });
  const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  const r = await drive(`${UPLOAD}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
  if (!r.ok) throw new Error(`drive create ${r.status}`);
  return ((await r.json()) as { id: string }).id;
}

// ───────── sync round ─────────
let lastUploaded = '';
let running: Promise<SyncStatus> | null = null;
let again = false;

async function round(): Promise<SyncStatus> {
  const acc = ds.account;
  if (!acc) return 'idle';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Offline();
  let fileId = acc.fileId ?? (await findFile());
  let remote = fileId ? await download(fileId) : undefined;
  if (remote === undefined && acc.fileId) {
    // cached id no longer valid (file deleted, or the user revoked and re-granted access)
    fileId = await findFile();
    remote = fileId ? await download(fileId) : undefined;
  }
  if (ds.account?.email !== acc.email) return 'idle'; // signed out meanwhile
  const before = getState();
  const merged = remote ? mergeProfile(before, remote) : before;
  if (merged !== before && JSON.stringify(toProfile(merged)) !== JSON.stringify(toProfile(before))) replaceState(merged);
  const body = JSON.stringify(toProfile(getState()));
  if (!remote || body !== JSON.stringify(remote)) fileId = await upload(body, fileId);
  lastUploaded = body;
  if (!ds.account) return 'idle';
  patch({ account: { ...ds.account, fileId, lastSync: Date.now() }, pending: false });
  return 'ok';
}

async function runSync(): Promise<SyncStatus> {
  if (running) {
    again = true;
    return running;
  }
  patch({ status: 'syncing' });
  running = (async () => {
    let status: SyncStatus;
    do {
      again = false;
      try {
        status = await round();
      } catch (e) {
        status = e instanceof Offline ? 'offline' : e instanceof NeedsAuth ? 'reauth' : 'error';
        if (!(e instanceof Offline) && !(e instanceof NeedsAuth)) console.warn('[drive sync]', e);
        patch({ pending: true });
        again = false;
      }
    } while (again);
    return status;
  })();
  try {
    const status = await running;
    patch({ status });
    return status;
  } finally {
    running = null;
  }
}

// ───────── public actions ─────────
export const googleSyncUnavailable = googleUnavailableReason;

/** Sign in (interactive) and run the first sync, which merges Drive and this device. */
export async function signInWithGoogle(): Promise<SyncStatus> {
  try {
    const { token: t, user } = await googleSignIn(ds.account?.email || undefined);
    setToken(t);
    const prev = ds.account && (!user.email || ds.account.email === user.email) ? ds.account : null;
    patch({ account: { ...prev, ...user, email: user.email || prev?.email || '' } });
  } catch (e) {
    if (e instanceof AuthCancelled) return ds.status;
    const status: SyncStatus = e instanceof ScopeDenied ? 'denied' : e instanceof TypeError ? 'offline' : 'error';
    if (!(e instanceof TypeError)) console.warn('[google sign-in]', e);
    patch({ status });
    return status;
  }
  return runSync();
}

/** "Sync now": refreshes the token with a popup when it expired (needs the user's tap). */
export async function syncWithDrive(): Promise<SyncStatus> {
  if (!ds.account) return 'idle';
  if (!token || token.expiresAt - 60_000 < Date.now()) return signInWithGoogle();
  return runSync();
}

export async function signOutOfGoogle() {
  const t = token?.accessToken;
  clearTimeout(timer);
  setToken(null);
  lastUploaded = '';
  patch({ account: null, status: 'idle', pending: false });
  await googleSignOut(t);
}

// ───────── background: debounce after edits, retry when back online ─────────
let timer: ReturnType<typeof setTimeout> | undefined;
let started = false;

function schedule(delay = DEBOUNCE_MS) {
  if (!ds.account) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!ds.account) return;
    if (JSON.stringify(toProfile(getState())) === lastUploaded && !ds.pending) return;
    if (!token || token.expiresAt - 60_000 < Date.now()) return patch({ status: 'reauth', pending: true });
    void runSync();
  }, delay);
}

/** Call once at startup. */
export function startDriveSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  subscribe(() => schedule());
  window.addEventListener('online', () => ds.pending && schedule(500));
  window.addEventListener('offline', () => ds.account && patch({ status: 'offline' }));
  document.addEventListener('visibilitychange', () => {
    // leaving the app: push pending edits right away instead of waiting for the debounce
    if (document.visibilityState === 'hidden' && timer) schedule(0);
  });
  if (ds.account && !googleUnavailableReason()) {
    if (token && token.expiresAt - 60_000 > Date.now()) void runSync();
    else patch({ status: 'reauth' });
  }
}
