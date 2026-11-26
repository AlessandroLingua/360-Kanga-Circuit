import { useSyncExternalStore } from 'react';
import { DEFAULT_FITNESS, type FitnessConfig } from '../engine/fitness';
import { DEFAULT_MEDITATION, type MeditationConfig } from '../engine/mind';
import { DEFAULT_MIX, type Constraints, type MixValues, type PracticeType } from '../engine/practice';
import type { MedThemeChoice } from '../engine/themes';
import type { Discipline, Lang, MusicGenre, Session } from '../engine/types';
import { DEFAULT_YOGA, type YogaConfig } from '../engine/yoga';
import { detectLang } from '../i18n';

export interface HistoryEntry {
  id: string;
  date: string; // ISO
  discipline: Discipline;
  variant: string;
  minutes: number;
  kcal: number;
  notes: string;
}

export interface Challenge {
  id: string;
  perWeek: number;
  weeks: number;
  /** 0 = Monday … 6 = Sunday */
  startDay: number;
  /** local midnight of the first day, ISO */
  start: string;
  endedAt?: string;
  result?: 'done' | 'missed' | 'left';
}

export interface Reminder {
  id: string;
  time: string; // HH:MM
  /** 0 = Monday … 6 = Sunday */
  days: number[];
}

export interface AppState {
  lang: Lang;
  weightKg: number;
  yoga: YogaConfig;
  nidra: { minutes: number; sleep: boolean };
  pilates: FitnessConfig;
  hiit: FitnessConfig;
  meditation: MeditationConfig;
  audio: { teacherIdx: number; genre: MusicGenre; musicVolume: number; subtitles: boolean };
  likes: string[];
  dislikes: string[];
  history: HistoryEntry[];
  goals: { dailyMin: number; weeklySessions: number; monthlyMin: number };
  downloads: Session[];
  health: { enabled: boolean };
  sync: { server: string; code: string; lastSync?: number };
  practice: { type: PracticeType; mixId: string; mix: MixValues; constraints: Constraints; boostsYoga: string[]; boostsPilates: string[]; medTheme: MedThemeChoice };
  challenge: { active: Challenge | null; past: Challenge[] };
  /** lastFired: reminder id → day key, so each reminder fires once a day */
  reminders: { enabled: boolean; items: Reminder[]; lastFired?: Record<string, string> };
  updatedAt: number;
}

const KEY = 'kanga360-state-v1';

const initial = (): AppState => {
  const lang = detectLang();
  return {
    lang,
    weightKg: 65,
    yoga: { ...DEFAULT_YOGA, lang },
    nidra: { minutes: 20, sleep: false },
    pilates: { ...DEFAULT_FITNESS('pilates'), lang },
    hiit: { ...DEFAULT_FITNESS('hiit'), lang },
    meditation: { ...DEFAULT_MEDITATION, lang },
    audio: { teacherIdx: 0, genre: 'ambient', musicVolume: 0.55, subtitles: true },
    likes: [],
    dislikes: [],
    history: [],
    goals: { dailyMin: 15, weeklySessions: 4, monthlyMin: 400 },
    downloads: [],
    health: { enabled: false },
    sync: { server: '', code: '' },
    practice: { type: 'hiitAny', mixId: DEFAULT_MIX.id, mix: { ...DEFAULT_MIX.mix }, constraints: {}, boostsYoga: [], boostsPilates: [], medTheme: 'any' },
    challenge: { active: null, past: [] },
    reminders: { enabled: false, items: [{ id: 'r1', time: '09:00', days: [0, 1, 2, 3, 4, 5, 6] }] },
    updatedAt: Date.now(),
  };
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const base = initial();
      const s = JSON.parse(raw) as Partial<AppState>;
      return {
        ...base,
        ...s,
        yoga: { ...base.yoga, ...s.yoga },
        pilates: { ...base.pilates, ...s.pilates },
        hiit: { ...base.hiit, ...s.hiit },
        meditation: { ...base.meditation, ...s.meditation },
        audio: { ...base.audio, ...s.audio },
        goals: { ...base.goals, ...s.goals },
        practice: { ...base.practice, ...s.practice },
        challenge: { ...base.challenge, ...s.challenge },
        reminders: { ...base.reminders, ...s.reminders },
      };
    }
  } catch {
    /* corrupted or unavailable storage: start fresh */
  }
  return initial();
}

let state = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked */
  }
}

export function getState() {
  return state;
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p, updatedAt: Date.now() };
  persist();
  listeners.forEach((l) => l());
}

export function replaceState(s: AppState) {
  state = s;
  persist();
  listeners.forEach((l) => l());
}

export function resetState() {
  state = initial();
  persist();
  listeners.forEach((l) => l());
}

export function useStore<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sel(state),
  );
}

// ───────── preference helpers ─────────
export function likeMove(id: string) {
  setState((s) => ({ likes: s.likes.includes(id) ? s.likes : [...s.likes, id], dislikes: s.dislikes.filter((x) => x !== id) }));
}
export function dislikeMove(id: string) {
  setState((s) => ({ dislikes: s.dislikes.includes(id) ? s.dislikes : [...s.dislikes, id], likes: s.likes.filter((x) => x !== id) }));
}
export function clearPref(id: string) {
  setState((s) => ({ likes: s.likes.filter((x) => x !== id), dislikes: s.dislikes.filter((x) => x !== id) }));
}

// ───────── stats ─────────
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export function streaks(history: HistoryEntry[]) {
  const days = new Set(history.map((h) => dayKey(new Date(h.date))));
  let current = 0;
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // today not done yet: streak still alive from yesterday
  while (days.has(dayKey(d))) {
    current++;
    d.setDate(d.getDate() - 1);
  }
  const sorted = [...days].map((k) => {
    const [y, m, dd] = k.split('-').map(Number);
    return new Date(y, m - 1, dd).getTime();
  }).sort((a, b) => a - b);
  let best = 0,
    run = 0,
    prev = 0;
  for (const t of sorted) {
    run = prev && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return { current, best: Math.max(best, current) };
}

export function periodStats(history: HistoryEntry[]) {
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const wd = (now.getDay() + 6) % 7;
  const startWeek = startDay - wd * 86400000;
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const sum = (from: number) => history.filter((h) => new Date(h.date).getTime() >= from);
  return {
    todayMin: sum(startDay).reduce((a, h) => a + h.minutes, 0),
    weekSessions: sum(startWeek).length,
    weekMin: sum(startWeek).reduce((a, h) => a + h.minutes, 0),
    monthMin: sum(startMonth).reduce((a, h) => a + h.minutes, 0),
    totalMin: history.reduce((a, h) => a + h.minutes, 0),
    totalKcal: history.reduce((a, h) => a + h.kcal, 0),
    weekDays: Array.from({ length: 7 }, (_, i) => {
      const from = startWeek + i * 86400000;
      return history.filter((h) => {
        const t = new Date(h.date).getTime();
        return t >= from && t < from + 86400000;
      }).reduce((a, h) => a + h.minutes, 0);
    }),
  };
}
