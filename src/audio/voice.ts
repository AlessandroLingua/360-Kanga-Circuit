/**
 * Voice guidance. Uses the device's speech engine (works offline):
 * - Web / desktop / iOS Safari: Web Speech API
 * - Android & iOS native shells: @capacitor-community/text-to-speech
 *
 * Voice choice matters: browsers fall back to the *system default* voice (often English)
 * when no voice is set, which makes Italian text sound English. We therefore always pin a
 * voice whose language matches, rank native-quality voices first, and skip Apple's
 * "Eloquence"/novelty synths (Eddy, Flo, Grandma…) that sound robotic and foreign.
 */
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import type { Lang } from '../engine/types';
import { neuralVoices, pauseNeural, sayNeural, stopNeural, unlockNeural } from './neural';

export interface Teacher {
  id: string;
  label: string;
  lang: string;
  /** web voiceURI or native voice index */
  voice?: string | number;
  voiceName?: string;
  pitch: number;
  rate: number;
  /** true if the best voice available is a low-quality one */
  lowQuality?: boolean;
  /** Pre-recorded natural voice (Gemini TTS); the device voice above covers anything not recorded. */
  neural?: { voice: string; lang: Lang };
}

export const LOCALE: Record<Lang, string> = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT' };
const NAMES = ['Aria', 'Leo', 'Maya', 'Noah', 'Sofia', 'Elio'];
// subtle variations only: strong pitch shifts make any voice sound unnatural
const CHARACTER = [
  { pitch: 1, rate: 0.95 },
  { pitch: 0.94, rate: 0.9 },
  { pitch: 1.05, rate: 0.97 },
  { pitch: 0.9, rate: 0.88 },
  { pitch: 1.08, rate: 0.93 },
  { pitch: 0.97, rate: 0.86 },
];
const ELOQUENCE = /^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|kathy)\b/i;

const native = () => Capacitor.isNativePlatform();

export function voiceScore(name: string, lang: string, wanted: string, local = true) {
  const n = name.toLowerCase();
  if (NOVELTY.test(name)) return -100;
  let s = 0;
  if (ELOQUENCE.test(name)) s -= 50;
  if (/premium|enhanced|neural|natural|siri/.test(n)) s += 30;
  if (/google|microsoft/.test(n)) s += 15;
  if (lang.replace('_', '-').toLowerCase() === wanted.toLowerCase()) s += 5; // it-IT over it-CH
  if (local) s += 1;
  return s;
}

function webVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  const v = speechSynthesis.getVoices();
  if (v.length) return Promise.resolve(v);
  return new Promise((res) => {
    const done = () => res(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

interface V {
  id: string | number;
  name: string;
  lang: string;
  score: number;
}

async function voicesFor(lang: Lang): Promise<V[]> {
  const wanted = LOCALE[lang];
  let list: V[] = [];
  if (native()) {
    try {
      const { voices } = await TextToSpeech.getSupportedVoices();
      list = voices.map((v, i) => ({ id: i, name: v.name, lang: v.lang, score: voiceScore(v.name, v.lang, wanted, v.localService) }));
    } catch {
      list = [];
    }
  } else {
    list = (await webVoices()).map((v) => ({ id: v.voiceURI, name: v.name, lang: v.lang, score: voiceScore(v.name, v.lang, wanted, v.localService) }));
  }
  return list
    .filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang) && v.score > -100)
    .sort((a, b) => b.score - a.score);
}

/**
 * Recorded natural voices first, then up to 6 device teachers for English and 4 for other languages.
 * Good device voices are reused (with a different character) rather than falling back to robotic ones.
 */
export async function listTeachers(lang: Lang): Promise<Teacher[]> {
  const [device, recorded] = await Promise.all([deviceTeachers(lang), neuralVoices(lang)]);
  const best = device[0];
  const natural: Teacher[] = recorded.map((v) => ({
    lang: best?.lang ?? LOCALE[lang],
    voice: best?.voice,
    voiceName: best?.voiceName,
    id: `${lang}-gemini-${v.voice}`,
    label: `${v.voice} · HD ${v.gender === 'male' ? '♂' : '♀'}`,
    pitch: 1,
    rate: 0.95,
    neural: { voice: v.voice, lang },
  }));
  return [...natural, ...device];
}

async function deviceTeachers(lang: Lang): Promise<Teacher[]> {
  const max = lang === 'en' ? 6 : 4;
  const all = await voicesFor(lang);
  const good = all.filter((v) => v.score > -20);
  const pool = good.length ? good : all;
  const out: Teacher[] = [];
  for (let i = 0; i < max; i++) {
    const v = pool.length ? pool[i % pool.length] : undefined;
    const short = v?.name.split(/[(-]/)[0].trim();
    out.push({
      id: `${lang}-${i}`,
      label: v ? `${NAMES[i]} · ${short}${pool.length < max && i >= pool.length ? ` ${Math.floor(i / pool.length) + 1}` : ''}` : NAMES[i],
      lang: LOCALE[lang],
      voice: v?.id,
      voiceName: v?.name,
      lowQuality: !good.length,
      ...CHARACTER[i],
    });
  }
  return out;
}

/** True when the device has no natural-sounding voice for the language. */
export async function hasGoodVoice(lang: Lang) {
  return (await neuralVoices(lang)).length > 0 || (await voicesFor(lang)).some((v) => v.score >= 0);
}

let speaking = false;
let generation = 0;
export const isSpeaking = () => speaking || ('speechSynthesis' in window && speechSynthesis.speaking && !native());

/**
 * Speak text. With `interrupt`, anything still being said is cut so the voice never lags
 * behind the session (new pose = new instruction).
 */
export async function speak(text: string, t: Teacher, hooks: { onStart?: () => void; onEnd?: () => void; interrupt?: boolean } = {}) {
  if (!text.trim()) return;
  const my = ++generation;
  if (hooks.interrupt) stopSpeaking();
  hooks.onStart?.();
  speaking = true;
  const end = () => {
    if (my === generation) speaking = false;
    hooks.onEnd?.();
  };
  if (t.neural) {
    const done = await sayNeural(text, t.neural.lang, t.neural.voice, (piece) => (my === generation ? deviceSay(piece, t, false) : Promise.resolve()));
    if (!done && my === generation) await deviceSay(text, t, !!hooks.interrupt);
  } else await deviceSay(text, t, !!hooks.interrupt);
  end();
}

/** Says text with the device engine and resolves when it has finished. */
async function deviceSay(text: string, t: Teacher, interrupt: boolean): Promise<void> {
  if (native()) {
    try {
      await TextToSpeech.speak({
        text,
        lang: t.lang,
        rate: t.rate,
        pitch: t.pitch,
        volume: 1,
        voice: typeof t.voice === 'number' ? t.voice : undefined,
        category: 'playback',
        queueStrategy: interrupt ? 0 : 1,
      });
    } catch {
      /* interrupted or unavailable */
    }
    return;
  }
  if (!('speechSynthesis' in window)) return;
  const voices = await webVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = t.lang;
  u.pitch = t.pitch;
  u.rate = t.rate;
  // pin a matching voice; never let the engine fall back to the (English) default
  const v =
    voices.find((x) => x.voiceURI === t.voice) ??
    voices
      .filter((x) => x.lang.toLowerCase().startsWith(t.lang.slice(0, 2)))
      .sort((a, b) => voiceScore(b.name, b.lang, t.lang) - voiceScore(a.name, a.lang, t.lang))[0];
  if (v) u.voice = v;
  await new Promise<void>((resolve) => {
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  speaking = false;
  stopNeural();
  if (native()) TextToSpeech.stop().catch(() => {});
  else if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export function pauseSpeaking(p: boolean) {
  pauseNeural(p);
  if (native() || !('speechSynthesis' in window)) {
    if (p) stopSpeaking();
    return;
  }
  if (p) speechSynthesis.pause();
  else speechSynthesis.resume();
}

/**
 * Must run synchronously inside the "Start" tap: iOS Safari only allows speech
 * (and audio) after a call made directly from a user gesture.
 */
export function unlockSpeech() {
  unlockNeural();
  if (native() || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
}
