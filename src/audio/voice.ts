/**
 * Voice guidance. Uses the device's speech engine (works offline):
 * - Web / desktop / iOS: Web Speech API
 * - Android & iOS native shells: @capacitor-community/text-to-speech
 * "Teachers" are distinct voices of the chosen language, each with its own pitch/rate character.
 */
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import type { Lang } from '../engine/types';

export interface Teacher {
  id: string;
  label: string;
  lang: string;
  /** web voiceURI or native voice index */
  voice?: string | number;
  pitch: number;
  rate: number;
}

const LOCALE: Record<Lang, string> = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT' };
const NAMES = ['Aria', 'Leo', 'Maya', 'Noah', 'Sofia', 'Elio'];
const CHARACTER = [
  { pitch: 1, rate: 0.92 },
  { pitch: 0.9, rate: 0.9 },
  { pitch: 1.08, rate: 0.95 },
  { pitch: 0.85, rate: 0.86 },
  { pitch: 1.15, rate: 0.93 },
  { pitch: 0.95, rate: 0.84 },
];
const native = () => Capacitor.isNativePlatform();

function webVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  const v = speechSynthesis.getVoices();
  if (v.length) return Promise.resolve(v);
  return new Promise((res) => {
    const done = () => res(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1200);
  });
}

/** Up to 6 teachers for English, up to 4 for the other languages. */
export async function listTeachers(lang: Lang): Promise<Teacher[]> {
  const max = lang === 'en' ? 6 : 4;
  const prefix = lang;
  let voices: { id: string | number; name: string }[] = [];
  if (native()) {
    try {
      const { voices: nv } = await TextToSpeech.getSupportedVoices();
      voices = nv.map((v, i) => ({ id: i, name: v.name, lang: v.lang })).filter((v) => v.lang.toLowerCase().startsWith(prefix));
    } catch {
      voices = [];
    }
  } else {
    const wv = await webVoices();
    const filtered = wv.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    // prefer higher-quality voices first
    filtered.sort((a, b) => score(b) - score(a));
    voices = filtered.map((v) => ({ id: v.voiceURI, name: v.name }));
  }
  const out: Teacher[] = [];
  for (let i = 0; i < max; i++) {
    const v = voices.length ? voices[i % voices.length] : undefined;
    out.push({
      id: `${lang}-${i}`,
      label: `${NAMES[i]}${v ? ` · ${v.name.split(/[(-]/)[0].trim()}` : ''}`,
      lang: LOCALE[lang],
      voice: v?.id,
      ...CHARACTER[i],
    });
  }
  return out;
}

function score(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase();
  return (n.includes('premium') || n.includes('enhanced') || n.includes('natural') ? 3 : 0) + (n.includes('google') ? 1 : 0) + (v.localService ? 1 : 0);
}

let speaking = false;
export const isSpeaking = () => speaking;

export async function speak(text: string, t: Teacher, hooks: { onStart?: () => void; onEnd?: () => void } = {}) {
  if (!text.trim()) return;
  hooks.onStart?.();
  speaking = true;
  const end = () => {
    speaking = false;
    hooks.onEnd?.();
  };
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
        queueStrategy: 1,
      });
    } catch {
      /* ignore */
    }
    end();
    return;
  }
  if (!('speechSynthesis' in window)) return end();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = t.lang;
  u.pitch = t.pitch;
  u.rate = t.rate;
  const voices = await webVoices();
  const v = voices.find((x) => x.voiceURI === t.voice);
  if (v) u.voice = v;
  u.onend = end;
  u.onerror = end;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  speaking = false;
  if (native()) TextToSpeech.stop().catch(() => {});
  else if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export function pauseSpeaking(p: boolean) {
  if (native() || !('speechSynthesis' in window)) {
    if (p) stopSpeaking();
    return;
  }
  if (p) speechSynthesis.pause();
  else speechSynthesis.resume();
}
