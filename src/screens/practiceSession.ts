import { generateFitness } from '../engine/fitness';
import { generateMeditation, generateNidra } from '../engine/mind';
import { categoryOf, disciplineOf, isPracticeType, MED_GOAL_OF, MIX_PRESETS, pilatesMix, practiceOfEntry, surpriseOfDay, usesTheme, YOGA_STYLE_OF, yogaBoostFocus, type HiitStructure, type PracticeType, type YogaBoost } from '../engine/practice';
import type { Session } from '../engine/types';
import { generateYoga } from '../engine/yoga';
import { setState, type AppState } from '../store/store';

export const RANGE: Record<ReturnType<typeof disciplineOf>, [number, number]> = { hiit: [5, 60], pilates: [5, 60], yoga: [5, 90], meditation: [3, 60] };

/** The selected practice; older saves stored a whole discipline ('yoga' / 'meditation') instead of a catalog entry. */
export function currentType(s: AppState): PracticeType {
  const t = s.practice.type as string;
  if (isPracticeType(t)) return t;
  if (t === 'yoga') return isPracticeType(s.yoga.style) ? s.yoga.style : 'vinyasa';
  if (t === 'meditation') return practiceOfEntry('meditation', s.meditation.goal);
  return 'hiitAny';
}

export function minutesOf(s: AppState, type: PracticeType) {
  const d = disciplineOf(type);
  if (d === 'yoga') return type === 'nidra' ? s.nidra.minutes : s.yoga.minutes;
  return s[d].minutes;
}
export function setMinutes(type: PracticeType, v: number) {
  const d = disciplineOf(type);
  setState((s) => {
    if (d === 'yoga') return type === 'nidra' ? { nidra: { ...s.nidra, minutes: v } } : { yoga: { ...s.yoga, minutes: v } };
    return { [d]: { ...s[d], minutes: v } } as Partial<AppState>;
  });
}

/** Store the practice and align the yoga style / meditation goal its settings screen shows. */
export function selectPractice(type: PracticeType) {
  setState((s) => {
    const c = categoryOf(type);
    if (c === 'yoga') return { practice: { ...s.practice, type }, yoga: { ...s.yoga, style: YOGA_STYLE_OF[type as keyof typeof YOGA_STYLE_OF] } };
    if (c === 'meditation') return { practice: { ...s.practice, type }, meditation: { ...s.meditation, goal: MED_GOAL_OF[type as keyof typeof MED_GOAL_OF] } };
    return { practice: { ...s.practice, type } };
  });
}

const PRESET = (id: string) => MIX_PRESETS.find((p) => p.id === id)!;

/** Build the session for the current practice settings. */
export function buildPractice(s: AppState, seed: number): Session {
  const type = currentType(s);
  const { mix, constraints } = s.practice;
  const { lang, likes, dislikes } = s;
  const cat = categoryOf(type);
  let session: Session;
  if (cat === 'yoga') {
    session = type === 'nidra'
      ? generateNidra(s.nidra.minutes, s.nidra.sleep, lang, seed)
      : generateYoga({ ...s.yoga, style: YOGA_STYLE_OF[type as keyof typeof YOGA_STYLE_OF], ...yogaFocus(s), ...(type === 'wakeUp' ? { warmup: 'extended' as const, warmupStep: Math.max(s.yoga.warmupStep ?? 2, 3), pace: Math.min(s.yoga.pace, 2) as 1 | 2 } : {}), lang, likes, dislikes }, seed);
  } else if (cat === 'meditation') {
    const cfg = { ...s.meditation, lang, guidance: s.meditation.guidance ?? 2, theme: usesTheme(type) ? s.practice.medTheme ?? 'any' : ('none' as const) };
    if (type === 'medBreathRest' || type === 'medSleepBreath') {
      // breathing first, then a guided meditation (relaxation or sleep)
      const b = Math.max(1, Math.round(cfg.minutes * 0.4));
      const a = generateMeditation({ ...cfg, goal: 'breath', minutes: b, pattern: type === 'medSleepBreath' ? 'calm' : cfg.pattern }, seed);
      const z = generateMeditation({ ...cfg, goal: type === 'medSleepBreath' ? 'sleep' : 'stress', minutes: Math.max(1, cfg.minutes - b) }, seed + 1);
      session = { ...z, segments: [...a.segments, ...z.segments], totalSeconds: a.totalSeconds + z.totalSeconds };
    } else session = generateMeditation({ ...cfg, goal: MED_GOAL_OF[type as keyof typeof MED_GOAL_OF] }, seed);
  } else if (cat === 'pilates') {
    const fixed = type === 'pilatesCore' ? PRESET('coreDay').mix : type === 'pilatesGlutes' ? PRESET('perfectGlutes').mix : undefined;
    session = generateFitness({ ...s.pilates, discipline: 'pilates', lang, likes, dislikes, structure: type === 'yogaPilates' ? 'hiitYoga' : undefined, mix: fixed ?? pilatesMix(s.practice.boostsPilates ?? []) }, seed);
  } else {
    const structure = type === 'hiitAny' ? surpriseOfDay() : (type as HiitStructure);
    session = generateFitness({ ...s.hiit, discipline: 'hiit', lang, likes, dislikes, structure, mix: structure === 'stretch' ? undefined : mix, constraints: structure === 'stretch' ? undefined : constraints }, seed);
  }
  // the journal, "Recent" and "Most used" key on the catalog entry
  return { ...session, variant: type };
}

/** "Incrementa" areas become the yoga engine's primary / secondary focus. */
function yogaFocus(s: AppState) {
  const b = (s.practice.boostsYoga ?? []) as YogaBoost[];
  if (!b.length) return {};
  return { focusPrimary: yogaBoostFocus(b[0]), focusSecondary: b[1] ? yogaBoostFocus(b[1]) : ('none' as const) };
}
