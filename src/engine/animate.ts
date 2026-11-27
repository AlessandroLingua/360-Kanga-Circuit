import { ease, lerpFigure, skeleton, swapSides } from './figure';
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
  return m.frames.map((f) => (seg.side === 'left' ? swapSides(f) : f));
}

function loop(fr: Figure[], t: number, period: number): Figure {
  if (fr.length === 1) return fr[0];
  const u = ((t / period) % 1) * fr.length;
  const i = Math.floor(u);
  return lerpFigure(fr[i], fr[(i + 1) % fr.length], ease(u - i));
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

export function figureAt(session: Session, idx: number, segElapsed: number): FigureFrame | null {
  const seg = session.segments[idx];
  const v = segView(session, idx);
  if (!seg || !v) return null;
  const target = loop(v.fr, segElapsed, periodOf(seg));
  const breath = (Math.sin((2 * Math.PI * segElapsed) / 9) + 1) / 2;
  const cam = cameraFor(idx, v.fr[0], v.yaw, segElapsed, seg.duration);
  // transition from previous pose (body, facing and camera glide together)
  let prevFig: Figure | null = null;
  let prevYaw = v.yaw;
  let prevCam = cam;
  for (let j = idx - 1; j >= 0 && !prevFig; j--) {
    const ps = session.segments[j];
    const pv = segView(session, j);
    if (pv) {
      prevFig = loop(pv.fr, ps.duration, periodOf(ps));
      prevYaw = pv.yaw;
      prevCam = cameraFor(j, pv.fr[0], pv.yaw, ps.duration, ps.duration);
    }
  }
  const tr = Math.min(2.2, seg.duration * 0.35);
  if (prevFig && segElapsed < tr) {
    const k = ease(segElapsed / tr);
    const mix = (x: number, y: number) => x + (y - x) * k;
    return { fig: lerpFigure(prevFig, target, k), breath, yaw: mix(prevYaw, v.yaw), orbit: mix(prevCam.orbit, cam.orbit), elev: mix(prevCam.elev, cam.elev), wall: v.wall };
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
