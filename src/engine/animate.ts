import { ease, lerpFigure, swapSides } from './figure';
import { FITNESS_BY_ID } from './library/fitness';
import { YOGA_BY_ID } from './library/yoga';
import type { Figure, Move, Segment, Session } from './types';

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

/** Figure to draw at `segElapsed` seconds into segment `idx`, with a smooth transition from the previous segment. */
export function figureAt(session: Session, idx: number, segElapsed: number): { fig: Figure; breath: number } | null {
  const seg = session.segments[idx];
  if (!seg) return null;
  const fr = frames(seg);
  if (!fr) return null;
  const period = seg.kind === 'rest' ? Math.max(3, fr.length * 1.5) : (seg.repSeconds ?? 4);
  const target = loop(fr, segElapsed, period);
  const breath = (Math.sin((2 * Math.PI * segElapsed) / 9) + 1) / 2;
  // transition from previous pose
  let prevFig: Figure | null = null;
  for (let j = idx - 1; j >= 0 && !prevFig; j--) {
    const pf = frames(session.segments[j]);
    if (pf) prevFig = loop(pf, session.segments[j].duration, session.segments[j].repSeconds ?? 4);
  }
  const tr = Math.min(2.2, seg.duration * 0.35);
  if (prevFig && segElapsed < tr) return { fig: lerpFigure(prevFig, target, ease(segElapsed / tr)), breath };
  return { fig: target, breath };
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
