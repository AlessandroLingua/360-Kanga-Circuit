export type Lang = 'it' | 'en' | 'es' | 'fr' | 'de' | 'pt';
export const LANGS: Lang[] = ['it', 'en', 'es', 'fr', 'de', 'pt'];

/** Localised string. `en` is always present and used as fallback. */
export type L10n = { en: string } & Partial<Record<Lang, string>>;

/**
 * Side-view stick figure, facing right. Absolute segment angles in degrees:
 * 0 = pointing down, 90 = forward (right), 180 = up, -90 = backward (left).
 * [torso, head, farUpperArm, farForearm, nearUpperArm, nearForearm,
 *  farThigh, farShin, nearThigh, nearShin, spineCurve?]
 */
export type Figure = number[];

export type Discipline = 'yoga' | 'pilates' | 'hiit' | 'meditation';

export type YogaStyle =
  | 'vinyasa'
  | 'hatha'
  | 'gentle'
  | 'restorative'
  | 'yin'
  | 'ashtanga'
  | 'sunSalutation'
  | 'nidra';

export const FOCUS_AREAS = [
  'hipOpeners',
  'hipFlexors',
  'hamstrings',
  'core',
  'lowerBack',
  'backbends',
  'shoulders',
  'twists',
  'flexibility',
  'balance',
  'armStrength',
  'legStrength',
  'quads',
  'chestOpening',
  'neckUpperBack',
  'glutes',
  'spineMobility',
  'inversions',
  'armBalances',
] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];

export type Level = 1 | 2 | 3 | 4 | 5;
export type Pace = 1 | 2 | 3 | 4 | 5;
export type PhaseLength = 'none' | 'standard' | 'extended';
export type InstructionLevel = 'full' | 'default' | 'defaultSilence' | 'least';
export type MusicGenre =
  | 'ambient'
  | 'pianoStrings'
  | 'acoustic'
  | 'altBeats'
  | 'electronic'
  | 'hipHop'
  | 'rock'
  | 'lofi'
  | 'brainWaves'
  | 'nature'
  | 'silent'
  | 'local';

export type Position = 'standing' | 'kneeling' | 'seated' | 'prone' | 'supine' | 'inverted' | 'armBalance';
export type MoveTag = 'jump' | 'knee' | 'wrist';

export interface Move {
  id: string;
  discipline: Exclude<Discipline, 'meditation'>;
  name: L10n;
  sanskrit?: string;
  /** Alignment cue used with "Full explanation". */
  cue?: L10n;
  /** Short cue used with "Default". */
  short?: L10n;
  position: Position;
  /** Minimum level at which the move may appear. */
  level: Level;
  /** 1 (very calm) .. 5 (very intense). */
  intensity: number;
  focus: FocusArea[];
  bilateral?: boolean;
  /** Keyframes. One = static hold; two or more = looping movement (reps). */
  frames: Figure[];
  /** Load flags used by the Mix filters (no jumping / knee- / wrist-friendly). */
  tags?: MoveTag[];
  /** Styles in which this pose is appropriate (yoga only). */
  styles?: YogaStyle[];
  /** Estimated MET for calorie calculations. */
  met: number;
  /** Optional HD clip (from clip manifest). */
  clip?: string;
}

export type SegmentKind = 'move' | 'transition' | 'rest' | 'savasana' | 'audio' | 'breath';

export interface Cue {
  /** seconds from segment start */
  at: number;
  text: string;
  /** subtitle only, not spoken */
  silent?: boolean;
}

export interface Segment {
  kind: SegmentKind;
  moveId?: string;
  side?: 'right' | 'left';
  /** seconds */
  duration: number;
  phase: string;
  /** 0..1, drives adaptive music */
  intensity: number;
  title: string;
  cues: Cue[];
  /** seconds per movement rep for animated moves */
  repSeconds?: number;
  /** breathing pattern [inhale, hold, exhale, hold] for breath segments */
  pattern?: number[];
  /** seconds between bells for meditation timer segments */
  bellEvery?: number;
}

export interface Session {
  id: string;
  seed: number;
  createdAt: number;
  discipline: Discipline;
  title: string;
  /** For yoga: the style. For other disciplines: a sub-type. */
  variant: string;
  lang: Lang;
  segments: Segment[];
  totalSeconds: number;
  audioOnly?: boolean;
  config: unknown;
}

export const PACE_BREATH_SECONDS: Record<Pace, number> = { 1: 6.5, 2: 5.5, 3: 4.5, 4: 3.8, 5: 3.2 };
