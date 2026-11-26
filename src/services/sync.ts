/**
 * Multi-device account sync. Talks to a tiny REST server (server/sync-server.mjs, self-hostable)
 * and merges: settings → last writer wins, history/downloads → union by id, likes/dislikes → union.
 */
import { getState, replaceState, type AppState } from '../store/store';

const union = <T extends { id: string }>(a: T[], b: T[]) => {
  const m = new Map<string, T>();
  [...a, ...b].forEach((x) => m.set(x.id, x));
  return [...m.values()];
};

export function merge(local: AppState, remote: AppState): AppState {
  const newer = remote.updatedAt > local.updatedAt ? remote : local;
  const dislikes = [...new Set([...local.dislikes, ...remote.dislikes])];
  return {
    ...newer,
    history: union(local.history, remote.history).sort((x, y) => y.date.localeCompare(x.date)),
    downloads: union(local.downloads, remote.downloads),
    dislikes,
    likes: [...new Set([...local.likes, ...remote.likes])].filter((x) => !dislikes.includes(x)),
    sync: local.sync,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  };
}

export const newAccountCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

export async function syncNow(): Promise<'ok' | 'error' | 'unconfigured'> {
  const s = getState();
  if (!s.sync.server || !s.sync.code) return 'unconfigured';
  const url = `${s.sync.server.replace(/\/$/, '')}/profile/${encodeURIComponent(s.sync.code)}`;
  try {
    const r = await fetch(url);
    let merged = s;
    if (r.ok) {
      const remote = (await r.json()) as AppState;
      merged = merge(s, remote);
    }
    const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...merged, sync: undefined }) });
    if (!put.ok) return 'error';
    replaceState({ ...merged, sync: { ...s.sync, lastSync: Date.now() } });
    return 'ok';
  } catch {
    return 'error';
  }
}

export function exportData() {
  const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kanga360-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importData(file: File) {
  const remote = JSON.parse(await file.text()) as AppState;
  replaceState(merge(getState(), remote));
}
