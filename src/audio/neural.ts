/**
 * Natural voices pre-recorded with Gemini TTS (scripts/tts-generate.ts).
 *
 * public/voice/voices.json lists the recorded voices per language; each voice folder has an
 * index.json ({ sentence: clipId }) and one MP3 per sentence. A cue is split into recorded
 * pieces (AtomIndex) and played in sequence; pieces that were never recorded are handed to
 * the device voice, so guidance never goes silent.
 *
 * Clips are served from the app (public/voice) or, when VITE_VOICE_BASE is set, from another
 * host such as the website, and the service worker keeps them for offline use.
 */
import { AtomIndex, type Piece } from './atoms';

export interface NeuralVoice {
  voice: string;
  gender: 'female' | 'male' | string;
  count: number;
}

const BASE = (import.meta.env.VITE_VOICE_BASE as string | undefined)?.replace(/\/?$/, '/') ?? `${import.meta.env.BASE_URL}voice/`;

let voicesP: Promise<Record<string, NeuralVoice[]>> | null = null;
export function neuralVoices(lang: string): Promise<NeuralVoice[]> {
  voicesP ??= fetch(`${BASE}voices.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return voicesP.then((all) => (all[lang] ?? []).filter((v) => v.count > 0));
}

interface Loaded {
  ids: Record<string, string>;
  atoms: AtomIndex;
}
const indexes = new Map<string, Promise<Loaded | null>>();
function loadIndex(lang: string, voice: string) {
  const k = `${lang}/${voice}`;
  let p = indexes.get(k);
  if (!p) {
    p = fetch(`${BASE}${k}/index.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : null))
      .then((ids) => (ids ? { ids, atoms: new AtomIndex(Object.keys(ids)) } : null))
      .catch(() => null);
    indexes.set(k, p);
  }
  return p;
}

const clipUrl = (lang: string, voice: string, id: string) => `${BASE}${lang}/${voice}/${id}.mp3`;

/** One element reused for every clip: iOS only lets an element play after it was unlocked by a tap. */
let el: HTMLAudioElement | null = null;
const audio = () => (el ??= Object.assign(new Audio(), { preload: 'auto' }));
const SILENT = `${import.meta.env.BASE_URL}silence.mp3`;

export function unlockNeural() {
  const a = audio();
  a.src = SILENT;
  a.play().catch(() => {});
}

let voiceVolume = 1;
/** Loudness of the recorded voice (0–1), set by the music/voice balance. */
export function setNeuralVolume(v: number) {
  voiceVolume = v;
  if (el) el.volume = v;
}

let token = 0;
export function stopNeural() {
  token++;
  finishCurrent?.();
  const a = el;
  if (a) {
    a.pause();
    a.removeAttribute('src');
  }
}
export function pauseNeural(p: boolean) {
  if (!el?.src || el.src.endsWith('silence.mp3')) return;
  if (p) el.pause();
  else el.play().catch(() => {});
}

/** Resolves the clip that is playing now; stopNeural() calls it so the sequence can exit. */
let finishCurrent: (() => void) | null = null;

function playClip(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const a = audio();
    const done = () => {
      a.onended = a.onerror = null;
      finishCurrent = null;
      resolve();
    };
    finishCurrent = done;
    a.onended = done;
    a.onerror = () => {
      a.onended = a.onerror = null;
      finishCurrent = null;
      reject(new Error('clip failed'));
    };
    a.src = url;
    a.volume = voiceVolume;
    a.play().catch((e) => {
      finishCurrent = null;
      reject(e);
    });
  });
}

/**
 * Says `text` with a recorded voice. Returns false when no recording exists for this voice,
 * so the caller can use the device voice instead.
 */
export async function sayNeural(text: string, lang: string, voice: string, device: (piece: string) => Promise<void>): Promise<boolean> {
  const idx = await loadIndex(lang, voice);
  if (!idx) return false;
  const my = ++token;
  const pieces: Piece[] = idx.atoms.segment(text);
  if (!pieces.some((p) => p.known)) return false;
  for (const p of pieces) {
    if (my !== token) return true;
    const id = p.known ? idx.ids[p.text] : undefined;
    if (id) {
      try {
        await playClip(clipUrl(lang, voice, id));
      } catch {
        await device(p.text);
      }
    } else await device(p.text);
  }
  return true;
}

/** Warms the cache with the clips a session will need (call when a session starts). */
export async function prefetchNeural(texts: string[], lang: string, voice: string, max = 60) {
  const idx = await loadIndex(lang, voice);
  if (!idx) return;
  const urls = new Set<string>();
  for (const t of texts) for (const p of idx.atoms.segment(t)) if (p.known && idx.ids[p.text]) urls.add(clipUrl(lang, voice, idx.ids[p.text]));
  for (const u of [...urls].slice(0, max)) fetch(u).catch(() => {});
}
