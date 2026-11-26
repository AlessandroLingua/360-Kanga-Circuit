import { moveCues, moveName } from './cues';
import { YOGA, YOGA_BY_ID } from './library/yoga';
import { ph } from './phrases';
import { Rng } from './rng';
import {
  FOCUS_AREAS,
  PACE_BREATH_SECONDS,
  type FocusArea,
  type InstructionLevel,
  type Lang,
  type Level,
  type Move,
  type Pace,
  type PhaseLength,
  type Position,
  type Segment,
  type Session,
  type YogaStyle,
} from './types';

export interface YogaConfig {
  style: YogaStyle;
  minutes: number;
  savasanaMin: number;
  warmup: PhaseLength;
  cooldown: PhaseLength;
  level: Level;
  pace: Pace;
  focusPrimary: FocusArea | 'auto' | 'none';
  focusSecondary: FocusArea | 'none';
  instruction: InstructionLevel;
  sanskrit: boolean;
  lang: Lang;
  likes: string[];
  dislikes: string[];
  /** Yoga Nidra only: end asleep, without the wake-up section. */
  nidraSleep?: boolean;
  /** 0 (none) … 4 (super extended), 2 = default; replaces `warmup` / `cooldown` when set. */
  warmupStep?: number;
  cooldownStep?: number;
  /** 0 (shortest holds) … 4 (longest), 2 = default. */
  holdStep?: number;
}

/** Phase-length multiplier and hold multiplier for each 0…4 step of the settings sliders. */
export const PHASE_STEP = [0, 0.5, 1, 1.8, 2.6];
export const HOLD_STEP = [0.6, 0.8, 1, 1.3, 1.6];

export const DEFAULT_YOGA: YogaConfig = {
  style: 'vinyasa',
  minutes: 30,
  savasanaMin: 3,
  warmup: 'standard',
  cooldown: 'standard',
  level: 2,
  pace: 3,
  focusPrimary: 'auto',
  focusSecondary: 'none',
  instruction: 'default',
  sanskrit: false,
  lang: 'it',
  likes: [],
  dislikes: [],
};

type Phase = 'centering' | 'warmup' | 'salutations' | 'standing' | 'floor' | 'cooldown';

const SPLIT: Record<Exclude<YogaStyle, 'nidra'>, Record<Phase, number>> = {
  vinyasa: { centering: 0.04, warmup: 0.12, salutations: 0.18, standing: 0.38, floor: 0.16, cooldown: 0.12 },
  hatha: { centering: 0.05, warmup: 0.12, salutations: 0.06, standing: 0.37, floor: 0.25, cooldown: 0.15 },
  gentle: { centering: 0.06, warmup: 0.18, salutations: 0, standing: 0.26, floor: 0.32, cooldown: 0.18 },
  ashtanga: { centering: 0.03, warmup: 0, salutations: 0.27, standing: 0.33, floor: 0.27, cooldown: 0.1 },
  sunSalutation: { centering: 0.05, warmup: 0.06, salutations: 0.72, standing: 0.07, floor: 0, cooldown: 0.1 },
  yin: { centering: 0.06, warmup: 0.06, salutations: 0, standing: 0, floor: 0.78, cooldown: 0.1 },
  restorative: { centering: 0.08, warmup: 0, salutations: 0, standing: 0, floor: 0.82, cooldown: 0.1 },
};

const POS_ORDER: Position[] = ['standing', 'armBalance', 'kneeling', 'prone', 'seated', 'inverted', 'supine'];

interface Draft {
  move: Move;
  side?: 'right' | 'left';
  dur: number;
  phase: Phase;
  flow?: boolean;
  flex: boolean;
  pre?: string;
  title?: string;
}

class Builder {
  rng: Rng;
  breath: number;
  used = new Map<string, number>();
  drafts: Draft[] = [];
  focusP: FocusArea | null;
  focusS: FocusArea | null;
  constructor(public cfg: YogaConfig, seed: number) {
    this.rng = new Rng(seed);
    this.breath = PACE_BREATH_SECONDS[cfg.pace];
    this.focusP =
      cfg.focusPrimary === 'auto' ? this.rng.pick(FOCUS_AREAS) : cfg.focusPrimary === 'none' ? null : cfg.focusPrimary;
    this.focusS = cfg.focusSecondary === 'none' ? null : cfg.focusSecondary;
  }
  get style() {
    return this.cfg.style as Exclude<YogaStyle, 'nidra'>;
  }
  time(phase?: Phase) {
    return this.drafts.filter((d) => !phase || d.phase === phase).reduce((a, d) => a + d.dur, 0);
  }
  allowed(m: Move) {
    if (m.id === 'savasana') return false;
    if (this.cfg.dislikes.includes(m.id)) return false;
    if (m.level > this.cfg.level) return false;
    const st = this.style === 'sunSalutation' ? ['sunSalutation', 'vinyasa'] : [this.style];
    return !!m.styles?.some((s) => st.includes(s));
  }
  weight(m: Move, targetIntensity: number) {
    if (!this.allowed(m)) return 0;
    let w = 1;
    if (this.focusP && m.focus.includes(this.focusP)) w *= 4;
    if (this.focusS && m.focus.includes(this.focusS)) w *= 2.5;
    if (this.cfg.likes.includes(m.id)) w *= 2.5;
    w *= Math.pow(0.12, this.used.get(m.id) ?? 0);
    w *= Math.exp(-Math.abs(m.intensity - targetIntensity) / 1.4);
    return w;
  }
  pick(pool: Move[], target: number) {
    const m = this.rng.weighted(pool, (x) => this.weight(x, target));
    if (m) this.used.set(m.id, (this.used.get(m.id) ?? 0) + 1);
    return m;
  }
  holdSeconds(m: Move, phase: Phase) {
    return this.rawHold(m, phase) * HOLD_STEP[this.cfg.holdStep ?? 2];
  }
  rawHold(m: Move, phase: Phase) {
    const b = this.breath;
    const paceMul = [0, 1.35, 1.15, 1, 0.85, 0.72][this.cfg.pace];
    switch (this.style) {
      case 'yin':
        return phase === 'floor' ? this.rng.int(150, 270) * paceMul : this.rng.int(45, 75) * paceMul;
      case 'restorative':
        return phase === 'floor' ? this.rng.int(200, 360) * paceMul : this.rng.int(60, 90) * paceMul;
      case 'hatha':
        return b * this.rng.int(7, 10);
      case 'gentle':
        return b * this.rng.int(5, 7);
      case 'sunSalutation':
        return b * this.rng.int(3, 4);
      default:
        return b * (m.frames.length > 1 ? 6 : this.rng.int(4, 6));
    }
  }
  add(m: Move | string, dur: number, phase: Phase, o: Partial<Draft> = {}) {
    const move = typeof m === 'string' ? YOGA_BY_ID[m] : m;
    if (!move || this.cfg.dislikes.includes(move.id)) return;
    this.drafts.push({ move, dur, phase, flex: true, ...o });
  }
  addHeld(m: Move, phase: Phase, o: Partial<Draft> = {}) {
    const d = this.holdSeconds(m, phase);
    if (m.bilateral) {
      this.add(m, d, phase, { ...o, side: 'right' });
      this.add(m, d, phase, { side: 'left', pre: ph('repeatOther', this.cfg.lang) });
    } else this.add(m, d, phase, o);
  }
  flowStep(id: string, phase: Phase, breaths = 1, side?: 'right' | 'left') {
    const m = YOGA_BY_ID[id];
    if (!m || !this.allowedFlow(m)) return;
    this.add(m, this.breath * breaths, phase, { flow: breaths === 1, flex: false, side });
  }
  allowedFlow(m: Move) {
    return m.level <= this.cfg.level || ['plank', 'downDog', 'cobra'].includes(m.id);
  }
  /** plank → chaturanga → up dog → down dog (simplified for beginners). */
  vinyasaLink(phase: Phase) {
    const lvl = this.cfg.level;
    const easy = this.style === 'gentle' || lvl === 1 || this.cfg.dislikes.includes('chaturanga');
    this.flowStep('plank', phase);
    if (!easy) this.flowStep('chaturanga', phase);
    this.flowStep(easy || this.cfg.dislikes.includes('upDog') ? 'cobra' : 'upDog', phase);
    this.flowStep('downDog', phase, 2);
  }
  sunSalutation(phase: Phase, variant: 'A' | 'B' | 'gentle') {
    const s = (id: string, br = 1, side?: 'right' | 'left') => this.flowStep(id, phase, br, side);
    const first = this.drafts.length;
    s('tadasana');
    if (variant === 'B') s('chair');
    else s('urdhvaHastasana');
    s('uttanasana');
    s('ardhaUttanasana');
    if (variant === 'gentle') {
      s('lowLunge', 1, 'right');
      s('downDog', 2);
      s('child', 2);
      s('downDog', 1);
      s('lowLunge', 1, 'left');
    } else {
      this.vinyasaLink(phase);
      if (variant === 'B') {
        s('warrior1', 2, 'right');
        this.vinyasaLink(phase);
        s('warrior1', 2, 'left');
        this.vinyasaLink(phase);
      }
    }
    s('ardhaUttanasana');
    s('uttanasana');
    s(variant === 'B' ? 'chair' : 'urdhvaHastasana');
    s('tadasana');
    if (this.drafts[first]) {
      this.drafts[first].title = ph('sunSal', this.cfg.lang) + (variant === 'gentle' ? '' : ` ${variant}`);
      this.drafts[first].pre = ph('sunSal', this.cfg.lang) + (variant === 'gentle' ? '.' : ` ${variant}.`);
    }
  }
  sunSalDuration(variant: 'A' | 'B' | 'gentle') {
    const start = this.drafts.length;
    this.sunSalutation('salutations', variant);
    const d = this.drafts.slice(start).reduce((a, x) => a + x.dur, 0);
    this.drafts.length = start;
    return d;
  }
}

/** Poses that only make sense as single-breath steps inside a flow. */
const FLOW_ONLY = new Set(['chaturanga', 'upDog', 'ardhaUttanasana', 'urdhvaHastasana', 'tadasana']);

const pool = (b: Builder, positions: Position[], minI: number, maxI: number) =>
  YOGA.filter((m) => !FLOW_ONLY.has(m.id) && positions.includes(m.position) && m.intensity >= minI && m.intensity <= maxI && b.allowed(m));

function fillPhase(b: Builder, phase: Phase, budget: number, positions: Position[], minI: number, maxI: number, target: number) {
  const p = pool(b, positions, minI, maxI);
  const picks: Move[] = [];
  let t = 0;
  let guard = 0;
  while (t < budget * 0.92 && guard++ < 60) {
    // each pose at most once per phase while there are alternatives left
    // pool exhausted: stop here, the remaining time is given to longer holds
    const fresh = p.filter((x) => !picks.includes(x));
    const m = b.pick(fresh, target);
    if (!m) break;
    const d = b.holdSeconds(m, phase) * (m.bilateral ? 2 : 1);
    if (t + d > budget * 1.25 && picks.length > 0) break;
    picks.push(m);
    t += d;
  }
  picks.sort((x, y) => POS_ORDER.indexOf(x.position) - POS_ORDER.indexOf(y.position));
  for (const m of picks) b.addHeld(m, phase);
}

function standingPhase(b: Builder, budget: number) {
  const st = b.style;
  const flowing = st === 'vinyasa' || st === 'ashtanga';
  const standingPool = pool(b, ['standing', 'armBalance'], 2, 5);
  const start = b.time();
  let guard = 0;
  while (b.time() - start < budget * 0.9 && guard++ < 40) {
    if (flowing) {
      // mini-flow of 2–3 poses on the right, vinyasa, same on the left, vinyasa
      const n = b.rng.int(2, 3);
      const block: Move[] = [];
      for (let i = 0; i < n; i++) {
        const fresh = standingPool.filter((x) => x.bilateral && !b.used.has(x.id) && !block.includes(x));
        const m = b.pick(fresh.length ? fresh : standingPool.filter((x) => x.bilateral && !block.includes(x)), 3.3 + b.cfg.level * 0.2);
        if (m) block.push(m);
      }
      if (!block.length) break;
      const holds = block.map(() => b.breath * b.rng.int(3, 5));
      for (const side of ['right', 'left'] as const) {
        block.forEach((m, i) =>
          b.add(m, holds[i], 'standing', {
            side,
            pre: side === 'left' && i === 0 ? ph('repeatOther', b.cfg.lang) : undefined,
          }),
        );
        if (b.cfg.level >= 2 || side === 'left') b.vinyasaLink('standing');
        else b.flowStep('downDog', 'standing', 2);
      }
      // sometimes a non-bilateral peak pose
      const solo = b.pick(standingPool.filter((x) => !x.bilateral), 3.5);
      if (solo && b.rng.chance(0.5)) b.addHeld(solo, 'standing');
    } else {
      const m = b.pick(standingPool.filter((x) => !b.used.has(x.id)), st === 'gentle' ? 2.6 : 3.3);
      if (!m) break;
      b.addHeld(m, 'standing');
      if (st === 'hatha' && b.rng.chance(0.4)) b.flowStep('tadasana', 'standing', 2);
    }
  }
}

function ashtangaStanding(b: Builder, budget: number) {
  const order = ['uttanasana', 'triangle', 'sideAngle', 'prasarita', 'pyramid', 'tree', 'chair', 'warrior1', 'warrior2', 'warrior3', 'halfMoon'];
  const start = b.time();
  for (const id of order) {
    if (b.time() - start > budget) break;
    const m = YOGA_BY_ID[id];
    if (m && b.allowed(m)) b.addHeld(m, 'standing');
  }
}

function ashtangaFloor(b: Builder, budget: number) {
  const order = ['staff', 'seatedFold', 'headToKnee', 'seatedTwist', 'boat', 'boat', 'bridge', 'wheel', 'shoulderStand', 'plow', 'headstand', 'child'];
  const start = b.time();
  let i = 0;
  for (const id of order) {
    if (b.time() - start > budget) break;
    const m = YOGA_BY_ID[id];
    if (!m || !b.allowed(m)) continue;
    b.addHeld(m, 'floor');
    if (i++ % 2 === 1 && b.time() - start < budget * 0.7 && ['seatedFold', 'headToKnee', 'seatedTwist', 'boat'].includes(id))
      b.vinyasaLink('floor');
  }
}

export function generateYoga(cfg: YogaConfig, seed: number): Session {
  if (cfg.style === 'nidra') throw new Error('use generateNidra');
  const b = new Builder(cfg, seed);
  const L = cfg.lang;
  const total = Math.max(5, cfg.minutes) * 60;
  const sav = Math.min(cfg.savasanaMin * 60, total * 0.4);
  const body = total - sav;

  const split = { ...SPLIT[b.style] };
  const wm = { none: 0, standard: 1, extended: 1.8 } as const;
  split.warmup *= cfg.warmupStep !== undefined ? PHASE_STEP[cfg.warmupStep] : wm[cfg.warmup];
  split.cooldown *= cfg.cooldownStep !== undefined ? PHASE_STEP[cfg.cooldownStep] : wm[cfg.cooldown];
  if (cfg.warmupStep !== undefined ? cfg.warmupStep === 0 : cfg.warmup === "none") split.centering *= 0.5;
  const sum = Object.values(split).reduce((a, x) => a + x, 0);
  const budget = (p: Phase) => (split[p] / sum) * body;

  // centering
  const centerPose = b.style === 'sunSalutation' ? 'tadasana' : b.style === 'restorative' ? 'recliningBound' : 'easySeat';
  b.add(centerPose, Math.max(20, Math.min(budget('centering'), 120)), 'centering', {
    pre: `${ph('welcome', L)} ${ph('arrive', L)}`,
  });

  // warm-up
  if (budget('warmup') > 15) {
    const soft = ['yin', 'restorative'].includes(b.style);
    fillPhase(b, 'warmup', budget('warmup'), soft ? ['seated', 'supine', 'kneeling'] : ['kneeling', 'seated', 'supine', 'standing'], 0.5, 2.5, 1.5);
  }

  // salutations
  if (budget('salutations') > 20) {
    const variants: ('A' | 'B' | 'gentle')[] =
      b.style === 'gentle' || cfg.level === 1 ? ['gentle'] : cfg.level >= 3 ? ['A', 'A', 'B'] : ['gentle', 'A', 'A'];
    const start = b.time();
    let k = 0;
    while (true) {
      const v = b.style === 'ashtanga' ? (k < 3 ? 'A' : 'B') : variants[k % variants.length];
      const d = b.sunSalDuration(v);
      if (b.time() - start + d > budget('salutations') * 1.1 && k > 0) break;
      b.sunSalutation('salutations', v);
      k++;
      if (k > 12) break;
    }
  }

  // standing
  if (budget('standing') > 20) {
    if (b.style === 'ashtanga') ashtangaStanding(b, budget('standing'));
    else standingPhase(b, budget('standing'));
  }

  // floor
  if (budget('floor') > 20) {
    if (b.style === 'ashtanga') ashtangaFloor(b, budget('floor'));
    else if (b.style === 'yin' || b.style === 'restorative')
      fillPhase(b, 'floor', budget('floor'), ['kneeling', 'prone', 'seated', 'supine'], 0, 2, 1);
    else fillPhase(b, 'floor', budget('floor'), ['kneeling', 'prone', 'seated', 'supine', 'inverted', 'armBalance'], b.style === 'gentle' ? 1 : 1.5, 5, 2.4 + cfg.level * 0.3);
  }

  // cool-down
  if (budget('cooldown') > 15) fillPhase(b, 'cooldown', budget('cooldown'), ['seated', 'supine'], 0.5, 2, 1);

  // fit to exact duration by scaling flexible holds
  const sums = () => ({
    fixed: b.drafts.filter((d) => !d.flex).reduce((a, d) => a + d.dur, 0),
    flex: b.drafts.filter((d) => d.flex).reduce((a, d) => a + d.dur, 0),
  });
  // drop drafts from the end of the main phases if hopelessly over budget
  while (sums().fixed + sums().flex * 0.55 > body && b.drafts.length > 2) {
    const idx = findLastIndex(b.drafts, (d) => d.phase === 'standing' || d.phase === 'floor' || d.phase === 'salutations');
    if (idx < 0) break;
    b.drafts.splice(idx, 1);
  }
  const { fixed, flex } = sums();
  const factor = flex > 0 ? Math.max(0.4, (body - fixed) / flex) : 1;
  for (const d of b.drafts) if (d.flex) d.dur = Math.max(b.breath * 2, d.dur * factor);

  // merge consecutive identical poses (e.g. down dog ending a link + down dog starting a flow)
  for (let i = b.drafts.length - 1; i > 0; i--) {
    const a = b.drafts[i - 1],
      c = b.drafts[i];
    if (a.move.id === c.move.id && a.side === c.side) {
      a.dur += c.dur;
      a.flow = false;
      a.pre = a.pre ?? c.pre;
      b.drafts.splice(i, 1);
    }
  }

  // finalize segments
  const opts = { lang: L, instruction: cfg.instruction, sanskrit: cfg.sanskrit, breathSec: b.breath };
  const segments: Segment[] = b.drafts.map((d) => {
    const cues = moveCues(d.move, d.dur, opts, d.side, d.flow);
    if (d.pre) cues.unshift({ at: 0, text: d.pre });
    const name = moveName(d.move, opts);
    return {
      kind: 'move',
      moveId: d.move.id,
      side: d.side,
      duration: Math.round(d.dur * 10) / 10,
      phase: d.phase,
      intensity: Math.min(1, d.move.intensity / 5 + (d.flow ? 0.1 : 0)),
      title: d.title ?? name,
      cues: mergeCues(cues),
      repSeconds: d.move.frames.length > 1 ? b.breath * 2 : undefined,
    };
  });

  // absorb rounding so the session lasts exactly what was asked
  const drift = body - segments.reduce((a, x) => a + x.duration, 0);
  const lastHold = [...segments].reverse().find((x) => x.duration > 15);
  if (lastHold && Math.abs(drift) < lastHold.duration / 2) lastHold.duration = Math.round((lastHold.duration + drift) * 10) / 10;

  if (sav >= 10) {
    segments.push({
      kind: 'savasana',
      moveId: 'savasana',
      duration: Math.round(sav),
      phase: 'savasana',
      intensity: 0,
      title: moveName(YOGA_BY_ID.savasana, opts),
      cues: [
        { at: 0, text: ph('savasanaIntro', L) },
        ...(sav >= 60 ? [{ at: sav - 28, text: ph('wakeUp', L) }] : []),
        { at: Math.max(sav - 8, 1), text: ph('namaste', L) },
      ],
    });
  } else {
    const last = segments[segments.length - 1];
    last.cues.push({ at: Math.max(0, last.duration - 6), text: ph('namaste', L) });
  }

  const totalSeconds = segments.reduce((a, s) => a + s.duration, 0);
  return {
    id: `yoga-${seed}-${Date.now()}`,
    seed,
    createdAt: Date.now(),
    discipline: 'yoga',
    variant: cfg.style,
    title: cfg.style,
    lang: L,
    segments,
    totalSeconds,
    config: { ...cfg, resolvedFocus: b.focusP },
  };
}

/** Merge cues that start at the same moment into one utterance. */
function mergeCues(cues: Segment['cues']) {
  const out: Segment['cues'] = [];
  for (const c of cues) {
    const prev = out[out.length - 1];
    if (prev && Math.abs(prev.at - c.at) < 0.5) prev.text = `${prev.text} ${c.text}`;
    else out.push({ ...c });
  }
  return out;
}

function findLastIndex<T>(a: T[], f: (x: T) => boolean) {
  for (let i = a.length - 1; i >= 0; i--) if (f(a[i])) return i;
  return -1;
}
