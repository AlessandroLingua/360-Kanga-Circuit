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
}

/** A pose done on the floor (lying, kneeling, plank…): the figure is less than ~2/3 of standing height. */
export const isFloorPose = (f: Figure) => {
  const s = skeleton(f);
  const ys = Object.values(s).map((p) => p.y);
  return Math.max(...ys) - Math.min(...ys) < 120;
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
  return { yaw, ...cameraFor(0, f, yaw) };
};

/** Figure to draw at `segElapsed` seconds into segment `idx`, with a smooth transition from the previous segment. */
export function figureAt(session: Session, idx: number, segElapsed: number): FigureFrame | null {
  const seg = session.segments[idx];
  if (!seg) return null;
  const fr = frames(seg);
  if (!fr) return null;
  const period = seg.kind === 'rest' ? Math.max(3, fr.length * 1.5) : (seg.repSeconds ?? 4);
  const target = loop(fr, segElapsed, period);
  const breath = (Math.sin((2 * Math.PI * segElapsed) / 9) + 1) / 2;
  const yaw = seg.kind === 'rest' && !getMove(seg.moveId) ? 0 : yawFor(getMove(seg.moveId));
  const cam = cameraFor(idx, fr[0], yaw, segElapsed, seg.duration);
  // transition from previous pose (body, facing and camera glide together)
  let prevFig: Figure | null = null;
  let prevYaw = yaw;
  let prevCam = cam;
  for (let j = idx - 1; j >= 0 && !prevFig; j--) {
    const ps = session.segments[j];
    const pf = frames(ps);
    if (pf) {
      prevFig = loop(pf, ps.duration, ps.repSeconds ?? 4);
      prevYaw = yawFor(getMove(ps.moveId));
      prevCam = cameraFor(j, pf[0], prevYaw, ps.duration, ps.duration);
    }
  }
  const tr = Math.min(2.2, seg.duration * 0.35);
  if (prevFig && segElapsed < tr) {
    const k = ease(segElapsed / tr);
    const mix = (x: number, y: number) => x + (y - x) * k;
    return { fig: lerpFigure(prevFig, target, k), breath, yaw: mix(prevYaw, yaw), orbit: mix(prevCam.orbit, cam.orbit), elev: mix(prevCam.elev, cam.elev) };
  }
  return { fig: target, breath, yaw, ...cam };
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
