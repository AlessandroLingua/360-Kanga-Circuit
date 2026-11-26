import type { MeditationGoal } from './mind';
import type { FocusArea, Move, YogaStyle } from './types';

/** Everything the user can pick under "Tipo di pratica", grouped by the tab it lives in. */
export const CATALOG = {
  yoga: ['vinyasa', 'hatha', 'gentle', 'restorative', 'yin', 'ashtanga', 'sunSalutation', 'wakeUp', 'nidra'],
  pilates: ['pilates', 'pilatesCore', 'pilatesGlutes', 'yogaPilates'],
  meditation: ['medGuided', 'medSleep', 'medBreathRest', 'medSleepBreath', 'breathwork', 'medFocus', 'medTimer'],
  hiit: ['circuits', 'progression', 'cycles', 'tabata', 'hiitAny', 'hiitYoga', 'stretch'],
} as const;
export type PracticeCategory = keyof typeof CATALOG;
export const CATEGORIES = Object.keys(CATALOG) as PracticeCategory[];
export type PracticeType = (typeof CATALOG)[PracticeCategory][number];
export const PRACTICE_TYPES = CATEGORIES.flatMap((c) => CATALOG[c]) as PracticeType[];
export const isPracticeType = (x: string): x is PracticeType => (PRACTICE_TYPES as string[]).includes(x);

/** HIIT structures the engine can build. `hiitAny` resolves to one of these each day. */
export type HiitStructure = 'circuits' | 'progression' | 'cycles' | 'tabata' | 'hiitYoga' | 'stretch';

export const categoryOf = (t: PracticeType): PracticeCategory => CATEGORIES.find((c) => (CATALOG[c] as readonly string[]).includes(t)) ?? 'hiit';
/** The engine/config that generates this practice (category names match disciplines). */
export const disciplineOf = categoryOf;
export const usesMix = (t: PracticeType) => categoryOf(t) === 'hiit' && t !== 'stretch';
/** Yoga and Pilates pick up to two "Incrementa" areas instead of a Mix. */
export const usesBoosts = (t: PracticeType) => (categoryOf(t) === 'yoga' ? t !== 'nidra' : t === 'pilates' || t === 'yogaPilates');
/** Guided meditations take a theme; breathwork and the timer don't. */
export const usesTheme = (t: PracticeType) => ['medGuided', 'medSleep', 'medFocus', 'medBreathRest', 'medSleepBreath'].includes(t);

export const YOGA_STYLE_OF: Record<(typeof CATALOG)['yoga'][number], YogaStyle> = {
  vinyasa: 'vinyasa', hatha: 'hatha', gentle: 'gentle', restorative: 'restorative', yin: 'yin', ashtanga: 'ashtanga', sunSalutation: 'sunSalutation', wakeUp: 'vinyasa', nidra: 'nidra',
};
export const MED_GOAL_OF: Record<(typeof CATALOG)['meditation'][number], MeditationGoal> = {
  medGuided: 'stress', medSleep: 'sleep', medBreathRest: 'breath', medSleepBreath: 'breath', breathwork: 'breath', medFocus: 'focus', medTimer: 'timer',
};

/** Practice a history entry belongs to, including entries saved before the catalog existed. */
export function practiceOfEntry(discipline: string, variant: string): PracticeType {
  if (isPracticeType(variant)) return variant;
  if (discipline === 'meditation') return ({ stress: 'medGuided', sleep: 'medSleep', breath: 'breathwork', focus: 'medFocus', timer: 'medTimer' } as const)[variant as MeditationGoal] ?? 'medGuided';
  if (discipline === 'yoga') return 'vinyasa';
  if (discipline === 'pilates') return 'pilates';
  return 'hiitAny';
}

/** Thumbnail move shown next to each practice type. */
export const PRACTICE_THUMB: Record<PracticeType, string> = {
  vinyasa: 'upDog', hatha: 'triangle', gentle: 'catCow', restorative: 'child', yin: 'butterfly', ashtanga: 'chaturanga', sunSalutation: 'urdhvaHastasana', wakeUp: 'tadasana', nidra: 'savasana',
  pilates: 'hundred', pilatesCore: 'crissCross', pilatesGlutes: 'gluteBridge', yogaPilates: 'boat',
  medGuided: 'easySeat', medSleep: 'savasana', medBreathRest: 'easySeat', medSleepBreath: 'savasana', breathwork: 'easySeat', medFocus: 'easySeat', medTimer: 'easySeat',
  circuits: 'lunges', progression: 'squat', cycles: 'jumpSquat', tabata: 'highKnees', hiitAny: 'burpee', hiitYoga: 'warrior2', stretch: 'pigeon',
};
// ───────── "Incrementa": up to two areas to boost ─────────
export const MAX_BOOSTS = 2;
/** Yoga boosts map onto the engine's primary / secondary focus. */
export const YOGA_BOOSTS = {
  strength: { aerobic: 'legStrength', core: 'core', standingBalance: 'balance', glutes: 'glutes', backStrength: 'lowerBack' },
  stretch: {
    hips: 'hipOpeners', neck: 'neckUpperBack', flexibility: 'flexibility', hipFlexors: 'hipFlexors', innerThighs: 'hipOpeners', hamstrings: 'hamstrings', sideBody: 'flexibility',
    handsWristsArms: 'armStrength', chestShoulders: 'chestOpening', feetAnkles: 'balance', backbends: 'backbends', lowerBack: 'lowerBack', twists: 'twists',
  },
} as const satisfies Record<string, Record<string, FocusArea>>;
export type YogaBoost = keyof (typeof YOGA_BOOSTS)['strength'] | keyof (typeof YOGA_BOOSTS)['stretch'];
export const yogaBoostFocus = (b: YogaBoost): FocusArea => ({ ...YOGA_BOOSTS.strength, ...YOGA_BOOSTS.stretch })[b];

/** Pilates boosts raise one Mix group each. */
export const PILATES_BOOSTS = { upperAbs: 'core', lowerAbs: 'core', aerobic: 'aerobic', glutes: 'glutes', innerThighs: 'legs', upperBody: 'upper', obliques: 'core', backStrength: 'upper' } as const satisfies Record<string, MixGroup>;
export type PilatesBoost = keyof typeof PILATES_BOOSTS;
export function pilatesMix(boosts: string[]): MixValues {
  const mix: MixValues = { aerobic: 1, legs: 2, upper: 2, core: 4, glutes: 2 };
  for (const b of boosts) if (b in PILATES_BOOSTS) mix[PILATES_BOOSTS[b as PilatesBoost]] = 5;
  return mix;
}

/** Suggestions for "Più usate" before there is enough history. */
export const POPULAR: PracticeType[] = ['vinyasa', 'restorative', 'yin', 'medGuided', 'medSleep', 'wakeUp', 'pilates', 'hiitAny'];

// ───────── Mix ─────────
export const MIX_GROUPS = ['aerobic', 'legs', 'upper', 'core', 'glutes'] as const;
export type MixGroup = (typeof MIX_GROUPS)[number];
/** 0 (off) … 5 (max) per group. */
export type MixValues = Record<MixGroup, number>;

export interface Constraints {
  noJump?: boolean;
  noKnee?: boolean;
  noWrist?: boolean;
  standingOnly?: boolean;
  noStanding?: boolean;
}

export interface MixPreset {
  id: string;
  mix: MixValues;
  constraints?: Constraints;
}

const m = (aerobic: number, legs: number, upper: number, core: number, glutes: number): MixValues => ({ aerobic, legs, upper, core, glutes });

export const MIX_PRESETS: MixPreset[] = [
  { id: 'fullBody', mix: m(5, 5, 1, 1, 0) },
  { id: 'noJumps', mix: m(2, 4, 3, 3, 2), constraints: { noJump: true } },
  { id: 'fatBurn', mix: m(5, 3, 2, 2, 1) },
  { id: 'coreDay', mix: m(1, 0, 0, 5, 0) },
  { id: 'sculptedAbs', mix: m(0, 0, 1, 5, 0) },
  { id: 'armDay', mix: m(1, 0, 5, 1, 0) },
  { id: 'legDay', mix: m(1, 5, 0, 0, 3) },
  { id: 'backDay', mix: m(0, 0, 3, 2, 3) },
  { id: 'upperBody', mix: m(2, 0, 5, 0, 0) },
  { id: 'noCardio', mix: m(0, 3, 3, 3, 3) },
  { id: 'noKnee', mix: m(2, 1, 4, 4, 2), constraints: { noKnee: true } },
  { id: 'noWrist', mix: m(3, 4, 0, 3, 3), constraints: { noWrist: true } },
  { id: 'perfectGlutes', mix: m(1, 2, 0, 1, 5) },
  { id: 'hourglass', mix: m(2, 1, 1, 5, 4) },
  { id: 'beachBody', mix: m(3, 2, 3, 4, 2) },
  { id: 'cardioKiller', mix: m(5, 2, 0, 1, 0) },
  { id: 'allStanding', mix: m(5, 5, 1, 1, 0), constraints: { standingOnly: true } },
  { id: 'noStanding', mix: m(1, 0, 3, 5, 3), constraints: { noStanding: true } },
  { id: 'sculptedBack', mix: m(0, 0, 4, 2, 2) },
  { id: 'hopping', mix: m(5, 3, 0, 1, 0), constraints: { standingOnly: true } },
  { id: 'plankHell', mix: m(1, 0, 4, 5, 0), constraints: { noStanding: true } },
  { id: 'dancerLegs', mix: m(2, 5, 0, 1, 4) },
  { id: 'cardioAbs', mix: m(5, 0, 0, 5, 0) },
];
export const DEFAULT_MIX = MIX_PRESETS[0];

// ───────── move classification ─────────
const JUMPS = new Set(['jumpingJacks', 'jumpSquat', 'burpee', 'plankJacks', 'skaters', 'highKnees', 'buttKicks', 'sprint']);
const KNEE = new Set(['jumpSquat', 'lunges', 'skaters', 'wallSit', 'burpee', 'squat']);
const WRIST = new Set(['tricepDips', 'burpee']);
const BACK = new Set(['superman', 'gluteBridge']);

/** How much a move serves each Mix group (0..1). */
export function moveGroups(mv: Move): MixValues {
  const f = mv.focus;
  return {
    aerobic: Math.max(0, Math.min(1, (mv.met - 4) / 5)),
    legs: f.includes('legStrength') || f.includes('quads') ? 1 : 0,
    upper: f.includes('armStrength') || f.includes('shoulders') || f.includes('chestOpening') || BACK.has(mv.id) ? 1 : 0,
    core: f.includes('core') || f.includes('twists') ? 1 : 0,
    glutes: f.includes('glutes') ? 1 : 0,
  };
}

export function allowed(mv: Move, c: Constraints | undefined) {
  if (!c) return true;
  if (c.noJump && JUMPS.has(mv.id)) return false;
  if (c.noKnee && (KNEE.has(mv.id) || mv.position === 'kneeling')) return false;
  if (c.noWrist && (WRIST.has(mv.id) || mv.position === 'armBalance')) return false;
  if (c.standingOnly && mv.position !== 'standing') return false;
  if (c.noStanding && mv.position === 'standing') return false;
  return true;
}

/** Weight multiplier of a move under a Mix: groups at 0 contribute nothing, so a move only serving them is rare. */
export function mixWeight(mv: Move, mix: MixValues, only?: MixGroup) {
  const g = moveGroups(mv);
  if (only) return 0.05 + g[only] * 3;
  let w = 0.08;
  for (const k of MIX_GROUPS) w += (mix[k] / 5) * g[k];
  return w;
}

/** The day's surprise for "HIIT – any kind": stable for the whole day, different from yesterday. */
export function surpriseOfDay(d = new Date()): HiitStructure {
  const day = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
  const opts: HiitStructure[] = ['circuits', 'tabata', 'progression', 'cycles', 'hiitYoga'];
  return opts[((day * 7) % opts.length + opts.length) % opts.length];
}
