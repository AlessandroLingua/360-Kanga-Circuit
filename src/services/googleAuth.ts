/**
 * Google sign-in that yields an OAuth access token for the Drive app-data folder.
 * Web/PWA: Google Identity Services token client. Android/iOS: @capgo/capacitor-social-login.
 * The client IDs come from Vite env vars (see .env.example); nothing is hard-coded.
 */
import { Capacitor } from '@capacitor/core';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const SCOPES = ['openid', 'email', 'profile', DRIVE_SCOPE];

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();
const IOS_CLIENT_ID = (import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID ?? '').trim();

export interface GoogleToken {
  accessToken: string;
  /** epoch ms */
  expiresAt: number;
}
export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

export class AuthCancelled extends Error {}
export class ScopeDenied extends Error {}

const isNative = () => Capacitor.isNativePlatform();

/** Why Google sign-in cannot run here, or null when it can. */
export function googleUnavailableReason(): 'noClientId' | 'unsupported' | null {
  if (!CLIENT_ID) return 'noClientId';
  if (isNative()) return Capacitor.getPlatform() === 'ios' && !IOS_CLIENT_ID ? 'noClientId' : null;
  // GIS only works from an http(s) origin registered in the Cloud Console (not Electron's file://).
  return typeof location !== 'undefined' && location.protocol.startsWith('http') ? null : 'unsupported';
}

// ───────── web: Google Identity Services ─────────
interface GisTokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
}
interface GisTokenClient {
  requestAccessToken(o?: { prompt?: string; login_hint?: string }): void;
}
interface GisOauth2 {
  initTokenClient(c: {
    client_id: string;
    scope: string;
    callback: (r: GisTokenResponse) => void;
    error_callback?: (e: { type?: string }) => void;
  }): GisTokenClient;
  hasGrantedAllScopes(r: GisTokenResponse, ...scopes: string[]): boolean;
  revoke(token: string, done?: () => void): void;
}
declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GisOauth2 } };
  }
}

let gisLoading: Promise<GisOauth2> | null = null;
function loadGis(): Promise<GisOauth2> {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google.accounts.oauth2);
  gisLoading ??= new Promise<GisOauth2>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (window.google?.accounts?.oauth2 ? resolve(window.google.accounts.oauth2) : reject(new Error('gis')));
    s.onerror = () => {
      gisLoading = null;
      s.remove();
      reject(new TypeError('network'));
    };
    document.head.appendChild(s);
  });
  return gisLoading;
}

async function webToken(hint?: string): Promise<GoogleToken> {
  const oauth2 = await loadGis();
  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES.join(' '),
      callback: (r) => {
        if (r.error || !r.access_token) return reject(r.error === 'access_denied' ? new AuthCancelled(r.error) : new Error(r.error ?? 'token'));
        if (!oauth2.hasGrantedAllScopes(r, DRIVE_SCOPE)) return reject(new ScopeDenied('drive.appdata'));
        resolve({ accessToken: r.access_token, expiresAt: Date.now() + Number(r.expires_in ?? 3600) * 1000 });
      },
      error_callback: (e) => reject(new AuthCancelled(e.type ?? 'popup')),
    });
    // With a known account Google can skip the chooser; otherwise let the user pick one.
    client.requestAccessToken(hint ? { prompt: '', login_hint: hint } : { prompt: 'select_account' });
  });
}

// ───────── native: Capacitor plugin ─────────
let nativeReady: Promise<typeof import('@capgo/capacitor-social-login').SocialLogin> | null = null;
function nativePlugin() {
  nativeReady ??= import('@capgo/capacitor-social-login').then(async ({ SocialLogin }) => {
    await SocialLogin.initialize({ google: { webClientId: CLIENT_ID, iOSClientId: IOS_CLIENT_ID || undefined, mode: 'online' } });
    return SocialLogin;
  });
  return nativeReady;
}

async function nativeSignIn(): Promise<{ token: GoogleToken; user: GoogleUser }> {
  const plugin = await nativePlugin();
  const res = await plugin.login({ provider: 'google', options: { scopes: SCOPES.filter((s) => s !== 'openid') } });
  const r = res.result;
  if (r.responseType !== 'online' || !r.accessToken?.token) throw new ScopeDenied('drive.appdata');
  const exp = r.accessToken.expires ? Date.parse(r.accessToken.expires) : NaN;
  return {
    token: { accessToken: r.accessToken.token, expiresAt: Number.isFinite(exp) ? exp : Date.now() + 3500_000 },
    user: { email: r.profile.email ?? '', name: r.profile.name ?? '', picture: r.profile.imageUrl ?? '' },
  };
}

// ───────── public API ─────────
async function fetchUser(token: string): Promise<GoogleUser> {
  const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return { email: '', name: '', picture: '' };
  const u = (await r.json()) as Partial<GoogleUser>;
  return { email: u.email ?? '', name: u.name ?? '', picture: u.picture ?? '' };
}

/** Interactive sign-in (must run from a user gesture on the web, popups are blocked otherwise). */
export async function googleSignIn(hint?: string): Promise<{ token: GoogleToken; user: GoogleUser }> {
  if (isNative()) return nativeSignIn();
  const token = await webToken(hint);
  return { token, user: await fetchUser(token.accessToken) };
}

/** Forget the session on this device and revoke the app's Drive access on the web. */
export async function googleSignOut(accessToken?: string) {
  try {
    if (isNative()) await (await nativePlugin()).logout({ provider: 'google' });
    else if (accessToken && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(accessToken);
  } catch {
    /* already signed out or offline: the local session is dropped anyway */
  }
}
