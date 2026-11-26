import { moveName } from './cues';
import { HIIT, PILATES } from './library/fitness';
import { YOGA_BY_ID } from './library/yoga';
import { ph, tr, hasLang } from './phrases';
import { Rng } from './rng';
import type { Cue, FocusArea, InstructionLevel, Lang, Level, Move, Pace, PhaseLength, Segment, Session } from './types';
import { PACE_BREATH_SECONDS } from './types';

export type FitnessFocus = 'full' | 'core' | 'lower' | 'upper' | 'posture' | 'cardio' | 'flexibility';
export const FITNESS_FOCUS: FitnessFocus[] = ['full', 'core', 'lower', 'upper', 'posture', 'cardio', 'flexibility'];

const FOCUS_MAP: Record<FitnessFocus, FocusArea[]> = {
  full: [],
  core: ['core', 'twists'],
  lower: ['legStrength', 'glutes', 'quads'],
  upper: ['armStrength', 'shoulders', 'chestOpening'],
  posture: ['lowerBack', 'spineMobility', 'neckUpperBack', 'backbends'],
  cardio: ['legStrength', 'core'],
  flexibility: ['flexibility', 'hamstrings', 'hipOpeners', 'spineMobility'],
};

export interface FitnessConfig {
  discipline: 'pilates' | 'hiit';
  minutes: number;
  level: Level;
  pace: Pace;
  focus: FitnessFocus;
  warmup: PhaseLength;
  cooldown: PhaseLength;
  /** HIIT */
  workSec: number;
  restSec: number;
  instruction: InstructionLevel;
  lang: Lang;
  likes: string[];
  dislikes: string[];
}

export const DEFAULT_FITNESS = (discipline: 'pilates' | 'hiit'): FitnessConfig => ({
  discipline,
  minutes: discipline === 'hiit' ? 20 : 30,
  level: 2,
  pace: 3,
  focus: 'full',
  warmup: 'standard',
  cooldown: 'standard',
  workSec: 40,
  restSec: 20,
  instruction: 'default',
  lang: 'it',
  likes: [],
  dislikes: [],
});

const STRETCHES = ['uttanasana', 'lowLunge', 'pigeon', 'seatedFold', 'supineTwist', 'child', 'catCow', 'threadNeedle', 'butterfly'];

export function generateFitness(cfg: FitnessConfig, seed: number): Session {
  const r = new Rng(seed);
  const L = cfg.lang;
  const lib = cfg.discipline === 'hiit' ? HIIT : PILATES;
  const T = Math.max(5, cfg.minutes) * 60;
  const segs: Segment[] = [];
  const breath = PACE_BREATH_SECONDS[cfg.pace];
  const used = new Map<string, number>();
  const focus = FOCUS_MAP[cfg.focus];
  const ok = (m: Move) => m.level <= cfg.level && !cfg.dislikes.includes(m.id);
  const weight = (m: Move, target: number) => {
    if (!ok(m)) return 0;
    let w = 1;
    if (focus.some((f) => m.focus.includes(f))) w *= 3.5;
    if (cfg.focus === 'cardio') w *= m.met / 5;
    if (cfg.likes.includes(m.id)) w *= 2.5;
    w *= Math.pow(0.15, used.get(m.id) ?? 0);
    w *= Math.exp(-Math.abs(m.intensity - target) / 1.6);
    return w;
  };
  const pick = (pool: Move[], target: number) => {
    const m = r.weighted(pool, (x) => weight(x, target));
    if (m) used.set(m.id, (used.get(m.id) ?? 0) + 1);
    return m;
  };
  const name = (m: Move) => moveName(m, { lang: L, sanskrit: false });
  const cueFor = (m: Move, dur: number, side?: 'right' | 'left'): Cue[] => {
    const sideTxt = side ? `, ${ph(side === 'right' ? 'rightSide' : 'leftSide', L)}` : '';
    const full = hasLang(m.cue, L) ? tr(m.cue, L) : ph('keepMoving', L);
    const cues: Cue[] = [];
    if (cfg.instruction === 'full') cues.push({ at: 0, text: `${name(m)}${sideTxt}. ${full}` });
    else if (cfg.instruction === 'least') cues.push({ at: 0, text: `${name(m)}${sideTxt}` });
    else cues.push({ at: 0, text: `${name(m)}${sideTxt}. ${hasLang(m.short, L) ? tr(m.short, L) : ''}`.trim() });
    if (cfg.discipline === 'hiit') {
      if (cfg.instruction !== 'defaultSilence' && dur >= 30) cues.push({ at: dur / 2, text: ph('halfway', L) });
      if (dur >= 10) cues.push({ at: dur - 4, text: ph('three', L) });
    } else if (cfg.instruction === 'full' && dur > 30) cues.push({ at: dur * 0.55, text: ph('keepMoving', L) });
    return cues;
  };
  const push = (m: Move, dur: number, phase: string, side?: 'right' | 'left', pre?: string) => {
    const cues = cueFor(m, dur, side);
    if (pre) cues[0].text = `${pre} ${cues[0].text}`;
    segs.push({
      kind: 'move',
      moveId: m.id,
      side,
      duration: Math.round(dur),
      phase,
      intensity: Math.min(1, m.intensity / 5),
      title: name(m),
      cues,
      repSeconds: m.frames.length > 1 ? (cfg.discipline === 'hiit' ? [0, 2.2, 1.8, 1.4, 1.1, 0.9][cfg.pace] : breath * 1.6) * (m.frames.length > 2 ? m.frames.length / 2 : 1) : undefined,
    });
  };
  const rest = (dur: number, nextM?: Move) =>
    segs.push({
      kind: 'rest',
      moveId: nextM?.id,
      duration: Math.round(dur),
      phase: 'rest',
      intensity: 0.25,
      title: ph('rest', L),
      cues: [{ at: 0, text: nextM ? `${ph('rest', L)}. ${ph('nextUp', L)}: ${name(nextM)}` : ph('rest', L) }],
    });
  const total = () => segs.reduce((a, s) => a + s.duration, 0);

  const wm = { none: 0, standard: 1, extended: 1.8 } as const;
  const warmBudget = T * 0.12 * wm[cfg.warmup];
  const coolBudget = T * 0.1 * wm[cfg.cooldown];
  const mainBudget = T - warmBudget - coolBudget;

  // warm-up: low intensity moves
  let first = true;
  const warmPool = lib.filter((m) => m.intensity <= 3.5);
  while (total() < warmBudget - 10) {
    const m = pick(warmPool, 2.5);
    if (!m) break;
    const d = Math.min(45, Math.max(25, warmBudget / 4));
    push(m, d, 'warmup', undefined, first ? `${ph('welcomeWorkout', L)} ${ph('warmup', L)}.` : undefined);
    first = false;
  }

  // main
  const mainStart = total();
  if (cfg.discipline === 'hiit') {
    const perRound = cfg.level >= 3 ? 5 : 4;
    const target = 3 + cfg.level * 0.4;
    let round = 1;
    while (total() - mainStart < mainBudget - (cfg.workSec + cfg.restSec)) {
      const circuit: Move[] = [];
      for (let i = 0; i < perRound; i++) {
        const m = pick(lib, target);
        if (m) circuit.push(m);
      }
      for (let i = 0; i < circuit.length; i++) {
        if (total() - mainStart > mainBudget - cfg.workSec) break;
        push(circuit[i], cfg.workSec, `round${round}`, undefined, i === 0 ? `${ph('round', L)} ${round}. ${ph('go', L)}` : ph('go', L));
        rest(cfg.restSec, circuit[i + 1]);
      }
      round++;
      if (round > 30) break;
    }
  } else {
    const target = 2.2 + cfg.level * 0.4;
    while (total() - mainStart < mainBudget - 30) {
      const m = pick(lib, target);
      if (!m) break;
      const d = breath * (m.frames.length > 1 ? 10 : 6) * (1 + (cfg.level - 1) * 0.08);
      if (m.bilateral) {
        push(m, d, 'main', 'right');
        push(m, d, 'main', 'left', ph('repeatOther', L));
      } else push(m, d, 'main');
    }
  }

  // cool-down stretches (borrowed from yoga)
  const coolStart = total();
  const stretches = r.shuffle(STRETCHES).map((id) => YOGA_BY_ID[id]).filter((m) => m && !cfg.dislikes.includes(m.id));
  let i = 0;
  while (total() - coolStart < coolBudget - 10 && i < stretches.length) {
    const m = stretches[i++];
    const d = Math.max(20, Math.min(40, coolBudget / 4));
    if (m.bilateral) {
      push(m, d, 'cooldown', 'right', i === 1 ? `${ph('cooldown', L)}.` : undefined);
      push(m, d, 'cooldown', 'left');
    } else push(m, d, 'cooldown', undefined, i === 1 ? `${ph('cooldown', L)}.` : undefined);
  }

  // fit exactly to T by scaling non-rest segments
  const restSum = segs.filter((s) => s.kind === 'rest').reduce((a, s) => a + s.duration, 0);
  const moveSum = total() - restSum;
  const f = moveSum > 0 ? (T - restSum) / moveSum : 1;
  if (f > 0.5 && f < 1.6 && cfg.discipline === 'pilates') {
    for (const s of segs) if (s.kind !== 'rest') {
      const nd = Math.round(s.duration * f);
      s.cues = s.cues.map((c) => ({ ...c, at: c.at * (nd / s.duration) }));
      s.duration = nd;
    }
  }
  const last = segs[segs.length - 1];
  last?.cues.push({ at: Math.max(0, last.duration - 5), text: ph('wellDone', L) });

  return {
    id: `${cfg.discipline}-${seed}-${Date.now()}`,
    seed,
    createdAt: Date.now(),
    discipline: cfg.discipline,
    variant: cfg.focus,
    title: cfg.discipline,
    lang: L,
    segments: segs,
    totalSeconds: total(),
    config: cfg,
  };
}
