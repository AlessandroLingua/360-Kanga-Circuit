import { ease, lerpFigure, mirrorFrontal, skeleton, swapSides } from './figure';
import { FITNESS_BY_ID } from './library/fitness';
import { YOGA_BY_ID } from './library/yoga';
import type { Figure, Move, Segment, Session } from './types';
import { yawFor } from './facing';

export const getMove = (id?: string): Move | undefined => (id ? (YOGA_BY_ID[id] ?? FITNESS_BY_ID[id]) : undefined);

const STAND: Figure = [180, 180, 2, 0, -2, 0, 0, 0, 0, 0];

function frames(seg: Segment): Figure[] | null {
  const m = getMove(seg.moveId);
  // during a rest we demo the upcoming exercise (rest segments carry the next move's id)
  if (seg.kind === 'rest' && !m) return [STAND, [180, 180, 8, 0, -8, 0, 0, 0, 0, 0]];
  if (!m) return null;
  const facing = yawFor(m) > 45;
  return m.frames.map((f) => (seg.side === 'left' ? (facing ? mirrorFrontal(f) : swapSides(f)) : f));
}

function loop(fr: Figure[], t: number, period: number, frontal = false): Figure {
  if (fr.length === 1) return fr[0];
  const u = ((t / period) % 1) * fr.length;
  const i = Math.floor(u);
  return lerpFigure(fr[i], fr[(i + 1) % fr.length], ease(u - i), frontal);
}

export interface FigureFrame {
  fig: Figure;
  breath: number;
  /** 3D only: body turn (0 profile, 90 facing the camera), camera orbit and tilt, in degrees. */
  yaw?: number;
  orbit?: number;
  elev?: number;
  /** 3D only: draw a wall behind the back (wall sit). */
  wall?: boolean;
}

/** Exercises done leaning on a wall. */
export const needsWall = (m: Move | undefined) => !!m && (/wall/i.test(m.id) || /wall/i.test(m.name.en ?? ''));

/** A pose done on the floor (lying, kneeling, plank…): the figure is less than ~2/3 of standing height. */
export const isFloorPose = (f: Figure) => {
  const s = skeleton(f);
  const ys = Object.values(s).map((p) => p.y);
  // low overall, and the pelvis close to the floor: a warrior III or a deep fold is short but still
  // stands on its feet, so it keeps the standing camera
  return Math.max(...ys) - Math.min(...ys) < 120 && Math.max(...ys) - s.hip.y < 60;
};

/**
 * Camera for an exercise, the way a filmed class is shot: mostly three-quarter front views
 * (rarely a strict profile), a different angle for each exercise like a cut between cameras,
 * higher and looking down for floor work, and a slow drift during long holds.
 */
export function cameraFor(segIdx: number, f: Figure, yaw: number, t = 0, duration = 0): { orbit: number; elev: number } {
  const floor = isFloorPose(f);
  // profile poses: 25–60° towards the front; poses facing the camera: front or slightly off
  const angles = yaw > 45 ? [0, 18, -18, 28] : floor ? [35, 50, 25, 60] : [40, 25, 55, 32];
  const base = angles[segIdx % angles.length];
  const drift = duration >= 12 ? 9 * Math.sin((2 * Math.PI * t) / 24) : 0;
  return { orbit: base + drift, elev: floor ? 24 : 9 };
}

/** View for still pictures (thumbnails, previews). */
export const stillView = (m: Move | undefined, f: Figure) => {
  const yaw = yawFor(m);
  return { yaw, ...cameraFor(0, f, yaw), wall: needsWall(m) };
};

/** Figure to draw at `segElapsed` seconds into segment `idx`, with a smooth transition from the previous segment. */
/**
 * What a rest looks like: the teacher waits the way the last exercise left them, sitting cross-legged
 * on the mat after floor work, standing at ease after standing work, facing the camera and breathing.
 */
const SEATED_REST: Figure[] = [[180, 180, 25, 55, 25, 55, 95, -90, 95, -90, 0, 0, 0, 55, -75], [182, 176, 25, 55, 25, 55, 95, -90, 95, -90, 0, 0, 0, 55, -75]];
const STANDING_REST: Figure[] = [STAND, [180, 178, 6, 0, -6, 0, 0, 0, 0, 0]];

function restFrames(session: Session, idx: number): Figure[] {
  // the exercise before the rest (or, for a rest that opens the session, the one after it)
  let ref: Move | undefined;
  for (let j = idx - 1; j >= 0 && !ref; j--) if (session.segments[j].kind !== 'rest') ref = getMove(session.segments[j].moveId);
  ref ??= getMove(session.segments[idx].moveId);
  // judged on the starting position: a squat dips low but starts and ends standing
  return ref && isFloorPose(ref.frames[0]) ? SEATED_REST : STANDING_REST;
}

/** Keyframes, body turn and props of a segment as the main view shows it. */
function segView(session: Session, idx: number): { fr: Figure[]; yaw: number; wall: boolean } | null {
  const seg = session.segments[idx];
  if (!seg) return null;
  if (seg.kind === 'rest') {
    // cross-legged is drawn from the side (the knees open sideways); standing faces the camera
    const fr = restFrames(session, idx);
    return { fr, yaw: fr === SEATED_REST ? 0 : 90, wall: false };
  }
  const fr = frames(seg);
  if (!fr) return null;
  const m = getMove(seg.moveId);
  return { fr, yaw: yawFor(m), wall: needsWall(m) };
}

const periodOf = (seg: Segment) => (seg.kind === 'rest' ? 8 : (seg.repSeconds ?? 4));

/**
 * Body levels: standing (pelvis high), low (sitting, kneeling, on all fours, deep squat) and lying.
 * Straight interpolation between a lying and a standing pose tips the body up like a plank; a real
 * person rolls up to sit, comes onto the feet in a crouch, then stands. These are the stops.
 */
// on hands and knees
const TABLE: Figure = [105, 110, 0, 0, 0, 0, 0, -90, 0, -90];
// squatting on the feet, hands on the mat in front
const CROUCH: Figure = [118, 135, 2, 0, 2, 0, 138, -22, 138, -22];
const SIT_UP: Figure = [175, 175, 40, 80, 40, 80, 100, -60, 100, -60];
function handsOnFloor(f: Figure) {
  const s = skeleton(f);
  const floor = Math.max(...Object.values(s).map((p) => p.y));
  return Math.min(floor - s.fHand.y, floor - s.nHand.y) < 15;
}

/**
 * Putting the hands on the mat (lunge → down dog, kneeling → plank) the upper body goes first and
 * then the legs step; taking them off (down dog → lunge, crouch → lunge) the legs step first and
 * then the trunk rises. Returns the pair with that stop in between when the hands change.
 */
function handsOrder(a: Figure, b: Figure): Figure[] {
  const ha = handsOnFloor(a);
  const hb = handsOnFloor(b);
  if (hb && !ha) return [a, [...b.slice(0, 6), ...a.slice(6, 10), ...a.slice(10)], b];
  if (ha && !hb && level(b) !== 'stand') return [a, [...a.slice(0, 6), ...b.slice(6, 10), ...b.slice(10)], b];
  return [a, b];
}

function level(f: Figure): 'stand' | 'low' | 'supine' | 'prone' {
  const s = skeleton(f);
  const floor = Math.max(...Object.values(s).map((p) => p.y));
  const hip = floor - s.hip.y;
  const shoulder = floor - s.shoulder.y;
  // standing on the feet; with the hands down on the mat too (down dog, a deep fold) the body
  // already reaches the floor, so flows like plank → down dog go straight through
  const handsDown = Math.min(floor - s.fHand.y, floor - s.nHand.y) < 15;
  if (hip > 62) return handsDown ? 'low' : 'stand';
  // lying on the back (or the side): trunk pointing back along the floor, shoulders down
  const t = ((((f[0] + 180) % 360) + 360) % 360) - 180;
  if ((shoulder < 25 && t < -55 && t > -125) || f[12]) return 'supine';
  // on the belly: trunk pointing forward along the floor (the head at the other end of the mat)
  return shoulder < 25 && t > 55 && t < 125 && hip < 25 ? 'prone' : 'low';
}

/**
 * Keyframes from one pose to the next. Moves between floor poses interpolate directly (they
 * already look like rolling, folding or lying down); only getting up to standing, or down from it,
 * goes through the stops a body really passes: sit up from lying, crouch on the feet, stand.
 */
function transitionPath(a: Figure, b: Figure): Figure[] {
  // crossed legs (cross-legged, bound angle) open forward into a long-legged sit before anything
  // else, and cross from there: uncrossing straight to another pose sends the feet through the hips
  const crossed = (f: Figure) => (f[14] ?? 0) < -30;
  if (crossed(a) !== crossed(b)) {
    const c = crossed(a) ? a : b;
    const stop = [...c];
    stop[6] = stop[8] = 90;
    stop[7] = stop[9] = 90;
    stop[13] = stop[14] = 0;
    return crossed(a) ? [a, ...transitionPath(stop, b)] : [...transitionPath(a, stop), b];
  }
  const la = level(a);
  const lb = level(b);
  // from the back to the belly (or back): through sitting up and hands and knees, never flipping
  if ((la === 'supine' && lb === 'prone') || (la === 'prone' && lb === 'supine')) {
    const via = [SIT_UP, TABLE];
    return la === 'supine' ? [a, ...via, b] : [a, ...via.reverse(), b];
  }
  // turning over between facing the floor and facing the ceiling (all fours ↔ reverse table):
  // sit down in between rather than swinging the trunk through standing
  const turn = (f: Figure) => ((((f[0] + 180) % 360) + 360) % 360) - 180;
  if (la !== 'stand' && lb !== 'stand' && turn(a) * turn(b) < 0 && Math.abs(turn(a)) < 135 && Math.abs(turn(b)) < 135 && Math.abs(turn(a) - turn(b)) > 150)
    return [...handsOrder(a, SIT_UP), ...handsOrder(SIT_UP, b).slice(1)];
  // from lying on the back onto the hands (all fours, plank) or back down: sit up on the way
  // (only up on the hands and knees or feet: someone already sitting just lies back or rolls up)
  const raised = (f: Figure) => { const sk = skeleton(f); return Math.max(...Object.values(sk).map((p) => p.y)) - sk.hip.y > 25; };
  if (la === 'supine' && lb === 'low' && handsOnFloor(b) && raised(b)) return [a, ...handsOrder(SIT_UP, b)];
  if (lb === 'supine' && la === 'low' && handsOnFloor(a) && raised(a)) return [...handsOrder(a, SIT_UP), b];
  if ((la === 'stand') === (lb === 'stand')) return handsOrder(a, b);
  const [ground, gl] = la === 'stand' ? [b, lb] : [a, la];
  // a fold or a down dog keeps the pelvis high: rolling up to standing needs no crouch
  const sk = skeleton(ground);
  if (gl === 'low' && Math.max(...Object.values(sk).map((p) => p.y)) - sk.hip.y >= 50) return [a, b];
  const stops = gl === 'supine' ? [SIT_UP, CROUCH] : gl === 'prone' ? [TABLE, CROUCH] : [CROUCH];
  const coarse = la === 'stand' ? [a, ...stops.reverse(), b] : [a, ...stops, b];
  return coarse.slice(1).reduce<Figure[]>((p, nxt) => [...p, ...handsOrder(p[p.length - 1], nxt).slice(1)], [a]);
}

/** Position `k` (0…1) along a list of keyframes, spending the same time on each leg. */
function alongPath(path: Figure[], k: number, frontal = false): Figure {
  if (path.length === 2) return lerpFigure(path[0], path[1], k, frontal);
  const n = path.length - 1;
  const u = Math.min(n - 1e-6, k * n);
  const i = Math.floor(u);
  return lerpFigure(path[i], path[i + 1], u - i, frontal);
}

export function figureAt(session: Session, idx: number, segElapsed: number): FigureFrame | null {
  const seg = session.segments[idx];
  const v = segView(session, idx);
  if (!seg || !v) return null;
  const target = loop(v.fr, segElapsed, periodOf(seg), v.yaw > 45);
  const breath = (Math.sin((2 * Math.PI * segElapsed) / 9) + 1) / 2;
  const cam = cameraFor(idx, v.fr[0], v.yaw, segElapsed, seg.duration);
  // transition from previous pose (body, facing and camera glide together)
  let prevFig: Figure | null = null;
  let prevYaw = v.yaw;
  let prevCam = cam;
  let prevSide: Segment['side'] | undefined;
  for (let j = idx - 1; j >= 0 && !prevFig; j--) {
    const ps = session.segments[j];
    const pv = segView(session, j);
    if (pv) {
      prevFig = loop(pv.fr, ps.duration, periodOf(ps), pv.yaw > 45);
      prevYaw = pv.yaw;
      prevCam = cameraFor(j, pv.fr[0], pv.yaw, ps.duration, ps.duration);
      prevSide = ps.side;
    }
  }
  // getting up from the floor or down to it goes through the positions a person passes through;
  // turning between a side view and facing the camera (or switching sides of a pose that faces
  // the camera) while on the feet goes back to standing, turns there, and goes on
  const hipHigh = (f: Figure) => { const sk = skeleton(f); return Math.max(...Object.values(sk).map((p) => p.y)) - sk.hip.y > 55; };
  const switching = v.yaw > 45 && prevSide !== seg.side && !!prevSide && !!seg.side;
  const turning = prevFig && (Math.abs(prevYaw - v.yaw) > 30 || switching);
  const path = !prevFig ? [] : turning && level(prevFig) !== 'supine' && (level(prevFig) === 'stand' || level(target) === 'stand' || (switching && hipHigh(prevFig) && hipHigh(target)))
    ? [...transitionPath(prevFig, STAND), ...transitionPath(STAND, target).slice(1)]
    : transitionPath(prevFig, target);
  const tr = path.length > 3 ? Math.min(3.2, seg.duration * 0.6) : path.length > 2 ? Math.min(2.8, seg.duration * 0.5) : Math.min(2.2, seg.duration * 0.35);
  if (prevFig && segElapsed < tr) {
    const k = ease(segElapsed / tr);
    const mix = (x: number, y: number) => x + (y - x) * k;
    // the body turns while standing at the stop, not while it bends
    const at = path.indexOf(STAND);
    const kt = at > 0 ? Math.min(1, Math.max(0, (k - at / (path.length - 1) + 0.12) / 0.24)) : k;
    return { fig: alongPath(path, k, prevYaw > 45 && v.yaw > 45), breath, yaw: prevYaw + (v.yaw - prevYaw) * kt, orbit: mix(prevCam.orbit, cam.orbit), elev: mix(prevCam.elev, cam.elev), wall: v.wall };
  }
  return { fig: target, breath, yaw: v.yaw, ...cam, wall: v.wall };
}

/** During a rest: the exercise coming next, playing on a loop in the corner preview. */
export function nextPreviewAt(session: Session, idx: number, segElapsed: number): FigureFrame | null {
  const seg = session.segments[idx];
  if (seg?.kind !== 'rest') return null;
  const nextIdx = session.segments.findIndex((s, j) => j > idx && s.kind !== 'rest' && !!getMove(s.moveId));
  const next = session.segments[nextIdx];
  const m = getMove(next?.moveId);
  const fr = next && frames(next);
  if (!m || !fr) return null;
  const view = stillView(m, fr[0]);
  return { fig: loop(fr, segElapsed, periodOf(next)), breath: 0.5, ...view, orbit: view.orbit + 6 * Math.sin(segElapsed / 3), wall: needsWall(m) };
}

export function offsets(s: Session) {
  const o: number[] = [];
  let t = 0;
  for (const seg of s.segments) {
    o.push(t);
    t += seg.duration;
  }
  return o;
}

export function indexAt(offs: number[], t: number) {
  let i = 0;
  while (i + 1 < offs.length && offs[i + 1] <= t) i++;
  return i;
}
