/**
 * Optional HD video clips. Drop files in public/clips/ and list them in public/clips/manifest.json:
 *   { "downDog": "clips/downDog.mp4", "downDog@left": "clips/downDog-left.mp4", ... }
 * When a clip exists for a move it is played instead of the generated figure animation.
 * Clips are cached by the service worker and when a session is downloaded for offline use.
 */
import type { Session } from '../engine/types';

let manifest: Record<string, string> = {};

export async function loadClipManifest() {
  try {
    const r = await fetch('clips/manifest.json');
    if (r.ok) manifest = await r.json();
  } catch {
    manifest = {};
  }
}

export const clipFor = (moveId?: string, side?: string) =>
  moveId ? (manifest[`${moveId}@${side}`] ?? manifest[moveId]) : undefined;

export async function cacheSessionClips(s: Session) {
  if (!('caches' in window)) return;
  const urls = [...new Set(s.segments.map((g) => clipFor(g.moveId, g.side)).filter(Boolean) as string[])];
  if (!urls.length) return;
  const c = await caches.open('kanga-clips');
  await Promise.allSettled(urls.map((u) => c.add(u)));
}
