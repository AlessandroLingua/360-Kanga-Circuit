import type { Figure } from './types';

const L = { torso: 60, neck: 9, head: 10, ua: 30, fa: 28, th: 42, sh: 40 };
type P = { x: number; y: number };

const rad = (d: number) => (d * Math.PI) / 180;
const step = (p: P, angle: number, len: number): P => ({
  x: p.x + Math.sin(rad(angle)) * len,
  y: p.y + Math.cos(rad(angle)) * len,
});

export interface Skeleton {
  hip: P;
  shoulder: P;
  spineCtrl: P;
  headC: P;
  fElbow: P;
  fHand: P;
  nElbow: P;
  nHand: P;
  fKnee: P;
  fFoot: P;
  nKnee: P;
  nFoot: P;
}

export function skeleton(f: Figure): Skeleton {
  const [torso, head, fua, ffa, nua, nfa, fth, fsh, nth, nsh, curve = 0] = f;
  const hip = { x: 0, y: 0 };
  const shoulder = step(hip, torso, L.torso);
  const mid = { x: (hip.x + shoulder.x) / 2, y: (hip.y + shoulder.y) / 2 };
  // curve > 0 rounds the back (convex up/back), < 0 arches it
  const spineCtrl = step(mid, torso - 90, -curve * 2);
  const headC = step(shoulder, head, L.neck + L.head);
  const fElbow = step(shoulder, fua, L.ua);
  const fHand = step(fElbow, ffa, L.fa);
  const nElbow = step(shoulder, nua, L.ua);
  const nHand = step(nElbow, nfa, L.fa);
  const fKnee = step(hip, fth, L.th);
  const fFoot = step(fKnee, fsh, L.sh);
  const nKnee = step(hip, nth, L.th);
  const nFoot = step(nKnee, nsh, L.sh);
  return { hip, shoulder, spineCtrl, headC, fElbow, fHand, nElbow, nHand, fKnee, fFoot, nKnee, nFoot };
}

/** Shortest-path angle interpolation. */
export function lerpFigure(a: Figure, b: Figure, t: number): Figure {
  const n = Math.max(a.length, b.length);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (i === 10) {
      out.push(x + (y - x) * t);
      continue;
    }
    let d = ((y - x + 540) % 360) - 180;
    out.push(x + d * t);
  }
  return out;
}

export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function bounds(s: Skeleton) {
  const pts = Object.values(s) as P[];
  let minX = Infinity,
    maxX = -Infinity,
    maxY = -Infinity,
    minY = Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  // head is a circle
  maxY = Math.max(maxY, s.headC.y + L.head);
  minY = Math.min(minY, s.headC.y - L.head);
  minX = Math.min(minX, s.headC.x - L.head);
  maxX = Math.max(maxX, s.headC.x + L.head);
  return { minX, maxX, minY, maxY };
}

export interface DrawTheme {
  body: string;
  far: string;
  floor: string;
  accent: string;
}

/** Draw the figure grounded on a floor line, centred horizontally. `breath` 0..1 adds a subtle chest rise. */
export function drawFigure(ctx: CanvasRenderingContext2D, f: Figure, w: number, h: number, theme: DrawTheme, breath = 0) {
  const s = skeleton(f);
  const b = bounds(s);
  const scale = Math.min((h * 0.72) / 170, (w * 0.8) / 200);
  const floorY = h * 0.84;
  const cx = w / 2 - ((b.minX + b.maxX) / 2) * scale;
  const cy = floorY - b.maxY * scale;
  const T = (p: P) => ({ x: cx + p.x * scale, y: cy + p.y * scale });

  ctx.clearRect(0, 0, w, h);
  // floor
  ctx.strokeStyle = theme.floor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, floorY + 4);
  ctx.lineTo(w * 0.92, floorY + 4);
  ctx.stroke();
  // mat
  ctx.fillStyle = theme.accent;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(w * 0.2, floorY + 1, w * 0.6, 6);
  ctx.globalAlpha = 1;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const limb = (pts: P[], color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width * scale;
    ctx.beginPath();
    const p0 = T(pts[0]);
    ctx.moveTo(p0.x, p0.y);
    for (const p of pts.slice(1)) {
      const q = T(p);
      ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
  };
  // far limbs first
  limb([s.hip, s.fKnee, s.fFoot], theme.far, 9);
  limb([s.shoulder, s.fElbow, s.fHand], theme.far, 7.5);
  // torso as curve
  const hp = T(s.hip),
    sp = T(s.shoulder),
    cp = T(s.spineCtrl);
  ctx.strokeStyle = theme.body;
  ctx.lineWidth = (13 + breath * 1.6) * scale;
  ctx.beginPath();
  ctx.moveTo(hp.x, hp.y);
  ctx.quadraticCurveTo(cp.x, cp.y, sp.x, sp.y);
  ctx.stroke();
  // neck + head
  limb([s.shoulder, step(s.shoulder, angleOf(s.shoulder, s.headC), L.neck)], theme.body, 6);
  const hc = T(s.headC);
  ctx.fillStyle = theme.body;
  ctx.beginPath();
  ctx.arc(hc.x, hc.y, L.head * scale, 0, Math.PI * 2);
  ctx.fill();
  // near limbs
  limb([s.hip, s.nKnee, s.nFoot], theme.body, 9.5);
  limb([s.shoulder, s.nElbow, s.nHand], theme.body, 8);
}

function angleOf(a: P, b: P) {
  return (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;
}

/** Mirror isn't needed for a side view: "left side" is shown by swapping near/far limbs. */
export function swapSides(f: Figure): Figure {
  const [t, h, fua, ffa, nua, nfa, fth, fsh, nth, nsh, c = 0] = f;
  return [t, h, nua, nfa, fua, ffa, nth, nsh, fth, fsh, c];
}
