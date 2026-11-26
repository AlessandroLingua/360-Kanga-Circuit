/**
 * Recorded music library (generated with Google Lyria, scripts/music-generate.ts).
 *
 * public/music/library.json lists the tracks with genre, energy and BPM. Tracks are served by the
 * app, or from another host when VITE_MUSIC_BASE is set, and fetched whole so the service worker
 * can keep them for offline use.
 */
import type { Discipline } from '../engine/types';

export type Energy = 'low' | 'mid' | 'high';
export interface Track {
  id: string;
  genre: string;
  energy: Energy;
  bpm: number;
  duration: number;
  file: string;
}

const BASE = (import.meta.env.VITE_MUSIC_BASE as string | undefined)?.replace(/\/?$/, '/') ?? `${import.meta.env.BASE_URL}music/`;

let libP: Promise<Track[]> | null = null;
export function musicLibrary(): Promise<Track[]> {
  libP ??= fetch(`${BASE}library.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Track[]>) : []))
    .catch(() => []);
  return libP;
}

export const trackUrl = (t: Track) => `${BASE}${t.file}`;

/** Which energies suit a practice, best first. */
const ENERGY: Record<Discipline | 'any', Energy[]> = {
  meditation: ['low'],
  yoga: ['low', 'mid'],
  pilates: ['mid', 'low', 'high'],
  hiit: ['high', 'mid'],
  any: ['mid', 'low', 'high'],
};

/** Shuffled playlist for a genre, preferring tracks whose energy fits the practice. */
export async function playlist(genre: string, discipline: Discipline | 'any' = 'any'): Promise<Track[]> {
  const all = (await musicLibrary()).filter((t) => t.genre === genre);
  if (!all.length) return [];
  const order = ENERGY[discipline];
  const shuffle = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const fit = order.flatMap((e) => shuffle(all.filter((t) => t.energy === e)));
  // a genre without fitting tracks (e.g. calm genre in HIIT) still plays, rather than going silent
  return fit.length ? fit : shuffle(all);
}

export async function hasRecordedGenre(genre: string) {
  return (await musicLibrary()).some((t) => t.genre === genre);
}
