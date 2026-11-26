/** User's own music files, stored in IndexedDB so they persist and work offline. */
export interface LocalTrack {
  id: string;
  name: string;
  blob: Blob;
}

const DB = 'kanga-music';
const STORE = 'tracks';

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function getLocalTracks(): Promise<LocalTrack[]> {
  try {
    return await tx('readonly', (s) => s.getAll() as IDBRequest<LocalTrack[]>);
  } catch {
    return [];
  }
}

export async function addLocalTracks(files: FileList | File[]) {
  for (const f of Array.from(files)) {
    if (!f.type.startsWith('audio/')) continue;
    await tx('readwrite', (s) => s.put({ id: `${f.name}-${f.size}`, name: f.name, blob: f }));
  }
}

export async function removeLocalTrack(id: string) {
  await tx('readwrite', (s) => s.delete(id));
}
