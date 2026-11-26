import { moveName } from './cues';
import { HIIT, PILATES } from './library/fitness';
import { YOGA_BY_ID } from './library/yoga';
import { allowed, mixWeight, MIX_GROUPS, type Constraints, type HiitStructure, type MixGroup, type MixValues } from './practice';
import { ph, tr, hasLang } from './phrases';
import { Rng } from './rng';
import type { Cue, FocusArea, InstructionLevel, Lang, Level, Move, Pace, PhaseLength, Segment, Session } from './types';
import { PACE_BREATH_SECONDS } from './types';
import { HOLD_STEP, PHASE_STEP } from './yoga';

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
  /** HIIT structure from "Tipo di pratica"; plain interval circuit when absent. */
  structure?: HiitStructure;
  /** When set, replaces `focus` with per-group weights. */
  mix?: MixValues;
  constraints?: Constraints;
  /** Difficulty per body area, 0 (easiest) … 3: caps the level of moves that train that area. */
  regions?: RegionLevels;
  /** Fixed warm-up / cool-down length in minutes; `undefined` = chosen from the session length. */
  warmupMin?: number;
  cooldownMin?: number;
  /** 0…4 steps of the Pilates / Yoga settings sliders (2 = default). */
  warmupStep?: number;
  cooldownStep?: number;
  holdStep?: number;
  /** Final relaxation in minutes. */
  savasanaMin?: number;
}

export type BodyRegion = 'upper' | 'lower' | 'core';
export type RegionLevels = Record<BodyRegion, number>;
/** Highest move level allowed for each region level. */
export const REGION_CAP = [1, 2, 3, 5] as const;
export const regionsFromLevel = (level: number): RegionLevels => {
  const r = Math.round(((level - 1) * 3) / 4);
  return { upper: r, lower: r, core: r };
};
/** Overall level (drives target intensity) matching the per-region levels. */
export const levelFromRegions = (r: RegionLevels) => Math.max(1, Math.min(5, Math.round(1 + ((r.upper + r.lower + r.core) / 3) * (4 / 3)))) as Level;
const REGION_FOCUS: Record<BodyRegion, FocusArea[]> = {
  upper: ['armStrength', 'shoulders', 'chestOpening'],
  lower: ['legStrength', 'quads', 'glutes', 'hamstrings'],
  core: ['core', 'twists'],
};
function levelOk(m: Move, cfg: FitnessConfig) {
  if (!cfg.regions) return m.level <= cfg.level;
  const caps = (Object.keys(REGION_FOCUS) as BodyRegion[]).filter((g) => REGION_FOCUS[g].some((f) => m.focus.includes(f))).map((g) => REGION_CAP[cfg.regions![g]] ?? 5);
  return m.level <= (caps.length ? Math.min(...caps) : Math.max(...Object.values(cfg.regions).map((x) => REGION_CAP[x] ?? 5)));
}

/** Auto warm-up / cool-down length in seconds, as used when no fixed minutes are set. */
export const autoPhaseSec = (minutes: number, phase: 'warmup' | 'cooldown') => Math.max(5, minutes) * 60 * (phase === 'warmup' ? 0.12 : 0.1);

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
const LONG_STRETCHES = [...STRETCHES, 'happyBaby', 'lizard', 'headToKnee', 'seatedSideBend', 'sphinx', 'recliningBound', 'kneesToChest', 'prasarita', 'dragon', 'sleepingSwan'];
const STANDING_STRETCHES = ['uttanasana', 'prasarita', 'triangle', 'pyramid', 'urdhvaHastasana', 'goddess', 'tree', 'warrior2', 'reverseWarrior', 'tadasana'];
const YOGA_WARMUP =['catCow', 'tableTop', 'downDog', 'lowLunge', 'tadasana', 'urdhvaHastasana', 'uttanasana', 'chair', 'warrior2', 'goddess'];

export function generateFitness(cfg: FitnessConfig, seed: number): Session {
  const r = new Rng(seed);
  const L = cfg.lang;
  const st = cfg.structure;
  const base = cfg.discipline === 'hiit' ? HIIT : PILATES;
  const fits = (m: Move) => allowed(m, cfg.constraints) && levelOk(m, cfg) && !cfg.dislikes.includes(m.id);
  // strict filters (only standing, no wrists…) can leave very few moves: borrow compatible ones from the other library
  const lib = base.filter(fits).length >= 5 ? base : [...base, ...(base === HIIT ? PILATES : HIIT).filter(fits)];
  const sav = Math.min((cfg.savasanaMin ?? 0) * 60, Math.max(5, cfg.minutes) * 60 * 0.3);
  // everything below fits the time before savasana
  const T = Math.max(5, cfg.minutes) * 60 - sav;
  const segs: Segment[] = [];
  const breath = PACE_BREATH_SECONDS[cfg.pace];
  const used = new Map<string, number>();
  const focus = FOCUS_MAP[cfg.focus];
  const ok = (m: Move) => levelOk(m, cfg) && !cfg.dislikes.includes(m.id) && allowed(m, cfg.constraints);
  /** When set, picks favour moves that train this Mix group (circuits / progression). */
  let only: MixGroup | undefined;
  const weight = (m: Move, target: number) => {
    if (!ok(m)) return 0;
    let w = 1;
    if (cfg.mix) w *= mixWeight(m, cfg.mix, only);
    else {
      if (focus.some((f) => m.focus.includes(f))) w *= 3.5;
      if (cfg.focus === 'cardio') w *= m.met / 5;
    }
    if (cfg.likes.includes(m.id)) w *= 2.5;
    w *= Math.pow(0.15, used.get(m.id) ?? 0);
    if (segs[segs.length - 1]?.moveId === m.id) w *= 0.02; // never the same move twice in a row
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
    if (cfg.discipline === 'hiit' && m.discipline !== 'yoga') {
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
      repSeconds: m.frames.length > 1 ? (cfg.discipline === 'hiit' && m.discipline !== 'yoga' ? [0, 2.2, 1.8, 1.4, 1.1, 0.9][cfg.pace] : breath * 1.6) * (m.frames.length > 2 ? m.frames.length / 2 : 1) : undefined,
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
  const yogaMoves = (ids: string[]) => ids.map((id) => YOGA_BY_ID[id]).filter((m) => m && !cfg.dislikes.includes(m.id) && allowed(m, cfg.constraints));

  const wm = { none: 0, standard: 1, extended: 1.8 } as const;
  const stretchOnly = st === 'stretch';
  const fusion = st === 'hiitYoga';
  // fixed minutes win over the proportional default, but never eat more than 40% of the session
  const fixed = (min: number | undefined) => (min === undefined ? undefined : Math.min(min * 60, T * 0.4));
  const warmMul = cfg.warmupStep !== undefined ? PHASE_STEP[cfg.warmupStep] : wm[cfg.warmup];
  const coolMul = cfg.cooldownStep !== undefined ? PHASE_STEP[cfg.cooldownStep] : wm[cfg.cooldown];
  const warmBudget = stretchOnly ? 0 : fixed(cfg.warmupMin) ?? T * (fusion ? 0.2 * Math.max(1, warmMul) : 0.12 * warmMul);
  const coolBudget = stretchOnly ? T : fixed(cfg.cooldownMin) ?? T * (fusion ? 0.16 * Math.max(1, coolMul) : 0.1 * coolMul);
  const mainBudget = T - warmBudget - coolBudget;

  // warm-up: low intensity moves (a short yoga flow for the HIIT + Yoga fusion)
  let first = true;
  if (fusion) {
    for (const m of yogaMoves(r.shuffle(YOGA_WARMUP))) {
      if (total() >= warmBudget - 10) break;
      const d = Math.min(40, Math.max(20, warmBudget / 6));
      const pre = first ? `${ph('welcomeWorkout', L)} ${ph('warmup', L)}.` : undefined;
      if (m.bilateral) {
        push(m, d / 2, 'warmup', 'right', pre);
        push(m, d / 2, 'warmup', 'left');
      } else push(m, d, 'warmup', undefined, pre);
      first = false;
    }
  } else {
    const warmPool = lib.filter((m) => m.intensity <= 3.5);
    while (total() < warmBudget - 10) {
      const m = pick(warmPool, 2.5);
      if (!m) break;
      const d = Math.min(45, Math.max(25, warmBudget / 4));
      push(m, d, 'warmup', undefined, first ? `${ph('welcomeWorkout', L)} ${ph('warmup', L)}.` : undefined);
      first = false;
    }
  }

  // main
  const mainStart = total();
  if (stretchOnly) {
    // nothing here: the whole session is the stretching block below
  } else if (cfg.discipline === 'hiit') {
    const tabata = st === 'tabata';
    const work = tabata ? 20 : cfg.workSec;
    const restS = tabata ? 10 : cfg.restSec;
    const perRound = tabata ? 8 : cfg.level >= 3 ? 5 : 4;
    const roundRest = tabata ? 60 : 0;
    const target = 3 + cfg.level * 0.4;
    // groups the Mix asks for, strongest first: circuits alternate them, progression works them one at a time
    const active = cfg.mix ? MIX_GROUPS.filter((g) => cfg.mix![g] > 0).sort((a, b) => cfg.mix![b] - cfg.mix![a]) : [];
    // plan all work blocks first, so every rest can announce what comes next
    const plan: { m: Move; round: number; first: boolean }[] = [];
    let t = 0;
    let slot = 0;
    for (let round = 1; round <= 40 && t < mainBudget - (work + restS) * (tabata ? 4 : 1); round++) {
      let set: Move[] = [];
      if (st === 'cycles' && round % 2 === 0) {
        // cycles: every set of moves is repeated twice
        set = plan.filter((p) => p.round === round - 1).map((p) => p.m);
      } else if (tabata) {
        // tabata: two moves alternated over eight 20/10 intervals
        const a = pick(lib, target + 0.5);
        const b = pick(lib, target + 0.5) ?? a;
        if (a && b) set = Array.from({ length: perRound }, (_, i) => (i % 2 ? b : a));
      } else {
        for (let i = 0; i < perRound; i++) {
          if (st === 'progression' && active.length) only = active[(round - 1) % active.length];
          else if (st === 'circuits' && active.length) only = active[slot++ % active.length];
          const m = pick(lib, st === 'progression' ? target - 0.6 + Math.min(1.2, round * 0.2) : target);
          only = undefined;
          if (m) set.push(m);
        }
      }
      if (!set.length) break;
      for (let i = 0; i < set.length && t < mainBudget - work; i++) {
        plan.push({ m: set[i], round, first: i === 0 });
        t += work + restS;
      }
      t += roundRest;
    }
    plan.forEach((p, k) => {
      push(p.m, work, `round${p.round}`, undefined, p.first ? `${ph('round', L)} ${p.round}. ${ph('go', L)}` : ph('go', L));
      const nx = plan[k + 1];
      if (st === undefined) rest(restS, nx?.m);
      // between tabata rounds the rest lengthens; the last rest before the cool-down is dropped
      else if (nx) rest(nx.round !== p.round && roundRest ? roundRest : restS, nx.m);
    });
  } else {
    const target = 2.2 + cfg.level * 0.4;
    while (total() - mainStart < mainBudget - 30) {
      const m = pick(lib, target);
      if (!m) break;
      const d = breath * (m.frames.length > 1 ? 10 : 6) * (1 + (cfg.level - 1) * 0.08) * HOLD_STEP[cfg.holdStep ?? 2];
      if (m.bilateral) {
        push(m, d, 'main', 'right');
        push(m, d, 'main', 'left', ph('repeatOther', L));
      } else push(m, d, 'main');
    }
  }

  // cool-down stretches (borrowed from yoga); with a structure they also fill whatever time the main block left
  const coolStart = total();
  const coolOff = cfg.cooldownMin !== undefined ? cfg.cooldownMin === 0 : cfg.cooldownStep !== undefined ? cfg.cooldownStep === 0 : cfg.cooldown === "none";
  const coolTarget = st && (!coolOff || stretchOnly || fusion) ? Math.max(coolBudget, T - coolStart) : coolBudget;
  const longList = stretchOnly || coolTarget > 400;
  const stretches = yogaMoves(r.shuffle(cfg.constraints?.standingOnly ? STANDING_STRETCHES : longList ? LONG_STRETCHES : STRETCHES));
  const hold = stretchOnly ? Math.max(30, Math.min(60, 25 + (6 - cfg.pace) * 6)) : Math.max(20, Math.min(40, coolTarget / 4));
  for (let i = 0; stretches.length && total() - coolStart < coolTarget - 10 && (longList || i < stretches.length) && i < 200; i++) {
    const m = stretches[i % stretches.length];
    const pre = i === 0 ? (stretchOnly ? ph('welcomeWorkout', L) : `${ph('cooldown', L)}.`) : undefined;
    // the session must end on time: shorten the last hold(s) to what is left
    const left = Math.max(coolTarget, T - coolStart) - (total() - coolStart);
    const h = Math.min(hold, left / (m.bilateral ? 2 : 1));
    if (h < 12) break;
    if (m.bilateral) {
      push(m, h, 'cooldown', 'right', pre);
      push(m, h, 'cooldown', 'left');
    } else push(m, h, 'cooldown', undefined, pre);
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
  // absorb the remainder in the final stretch so the session lasts exactly what was asked
  const tail = [...segs].reverse().find((x) => x.kind === 'move');
  const drift = T - total();
  if (tail && tail.duration + drift >= 10 && Math.abs(drift) < 120) tail.duration += drift;
  // final relaxation
  if (sav > 0 && !cfg.dislikes.includes('savasana')) push(YOGA_BY_ID.savasana, sav, 'savasana');
  const last = segs[segs.length - 1];
  last?.cues.push({ at: Math.max(0, last.duration - 5), text: ph('wellDone', L) });

  return {
    id: `${cfg.discipline}-${seed}-${Date.now()}`,
    seed,
    createdAt: Date.now(),
    discipline: cfg.discipline,
    variant: st ?? cfg.focus,
    title: cfg.discipline,
    lang: L,
    segments: segs,
    totalSeconds: total(),
    config: cfg,
  };
}
