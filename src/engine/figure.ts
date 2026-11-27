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
/** `frontal`: the pose is drawn facing the camera, where the far limbs' own side is the negative one. */
export function lerpFigure(a: Figure, b: Figure, t: number, frontal = false): Figure {
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
  // Legs move like joints, not like clock hands: the shortest turn of a thigh can swing it up
  // behind the back (plank → crouch) and of a shin can bend the knee backwards. So the hip is
  // interpolated as flexion relative to the trunk (−90…270, through the front) and the knee as
  // bend relative to the thigh (−190…170, folding the shin back), each the way the joint can go.
  if (a.length >= 10 && b.length >= 10) {
    const wrapTo = (v: number, lo: number) => ((((v - lo) % 360) + 360) % 360) + lo;
    for (const [th, sh] of [[6, 7], [8, 9]] as const) {
      const m = frontal && th === 6 ? -1 : 1;
      const ha = wrapTo(m * (a[th] - (a[0] - 180)), -90);
      const hb = wrapTo(m * (b[th] - (b[0] - 180)), -90);
      out[th] = out[0] - 180 + m * (ha + (hb - ha) * t);
      const ka = wrapTo(m * (a[sh] - a[th]), -190);
      const kb = wrapTo(m * (b[sh] - b[th]), -190);
      out[sh] = out[th] + m * (ka + (kb - ka) * t);
    }
    // arms the same way: the shoulder moves through the front (−120…240 from hanging down) and the
    // elbow only folds (−20…340): an arm going overhead never sweeps across or through the chest
    for (const [ua, fa] of [[2, 3], [4, 5]] as const) {
      const m = frontal && ua === 2 ? -1 : 1;
      const sa = wrapTo(m * (a[ua] - (a[0] - 180)), -120);
      const sb = wrapTo(m * (b[ua] - (b[0] - 180)), -120);
      out[ua] = out[0] - 180 + m * (sa + (sb - sa) * t);
      const ea = wrapTo(m * (a[fa] - a[ua]), -20);
      const eb = wrapTo(m * (b[fa] - b[ua]), -20);
      out[fa] = out[ua] + m * (ea + (eb - ea) * t);
    }
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

export type FigureModel = 'female' | 'male';

export interface DrawTheme {
  body: string;
  far: string;
  floor: string;
  accent: string;
  /** Which instructor to draw; defaults to the female model. */
  model?: FigureModel;
  /** Floor line position as a fraction of the height (default 0.84); the body fits above it. */
  floorAt?: number;
  /** Draw only the floor, mat and shadow (the 3D figure is drawn on top). */
  floorOnly?: boolean;
}

// ───────── human figure ─────────
type Palette = { skin: string; hair: string; top: string; bottom: string; shoe: string; sole: string };
const PALETTE: Record<FigureModel, Palette> = {
  female: { skin: '#e9b997', hair: '#3a2519', top: '#3b7be0', bottom: '#222b40', shoe: '#f1f2f4', sole: '#c9ccd3' },
  male: { skin: '#d8a07a', hair: '#24170f', top: '#2f8f6f', bottom: '#2a2e38', shoe: '#ecedf0', sole: '#c4c7ce' },
};

/** Body proportions (radii in skeleton units) for each model. */
const BUILD: Record<FigureModel, {
  neck: number; upperArm: [number, number]; foreArm: [number, number]; hand: number; thigh: [number, number]; shin: [number, number];
  front: number[]; back: number[]; sleeve: number; shortsTo: number; legging: boolean; topFrom: number; topTo: number;
}> = {
  // torso profile: half-thickness in front of / behind the spine at t = 0 (hip) … 1 (shoulder)
  female: {
    neck: 3.5, upperArm: [4.6, 3.3], foreArm: [3.2, 2.3], hand: 3.0, thigh: [8.0, 4.8], shin: [4.8, 2.7],
    front: [8.5, 7.2, 6.2, 6.6, 9.8, 10.4, 7.0], back: [10.5, 9.0, 6.4, 6.2, 7.4, 8.0, 7.0],
    sleeve: 0, shortsTo: 1, legging: true, topFrom: 0.62, topTo: 0.93,
  },
  male: {
    neck: 4.4, upperArm: [5.6, 4.0], foreArm: [4.0, 3.0], hand: 3.4, thigh: [8.0, 5.2], shin: [5.4, 3.0],
    front: [8.6, 8.6, 8.4, 8.8, 10.4, 10.0, 8.6], back: [9.4, 8.2, 7.8, 8.2, 9.8, 10.2, 8.8],
    sleeve: 0.45, shortsTo: 0.72, legging: false, topFrom: 0.16, topTo: 1.02,
  },
};

const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
const sub = (a: P, b: P) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: P, b: P, k = 1) => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const len = (a: P) => Math.hypot(a.x, a.y) || 1;
const unit = (a: P) => ({ x: a.x / len(a), y: a.y / len(a) });
const lerp = (a: P, b: P, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
/** Perpendicular pointing to the figure's front (the figure faces right when upright). */
const frontOf = (dirUp: P) => ({ x: -dirUp.y, y: dirUp.x });
const sampleProfile = (arr: number[], t: number) => {
  const x = Math.max(0, Math.min(1, t)) * (arr.length - 1);
  const i = Math.min(arr.length - 2, Math.floor(x));
  return arr[i] + (arr[i + 1] - arr[i]) * (x - i);
};

/** Draw the figure grounded on a floor line, centred horizontally. `breath` 0..1 adds a subtle chest rise. */
export function drawFigure(ctx: CanvasRenderingContext2D, f: Figure, w: number, h: number, theme: DrawTheme, breath = 0) {
  const s = skeleton(f);
  const b = bounds(s);
  const floorAt = theme.floorAt ?? 0.84;
  // fixed scale for a consistent size, shrunk only when a pose is taller (arms overhead) or wider
  const scale = Math.min((h * (floorAt - 0.08)) / Math.max(170, b.maxY - b.minY + 14), (w * 0.8) / Math.max(200, b.maxX - b.minX + 20));
  const floorY = h * floorAt;
  const cx = w / 2 - ((b.minX + b.maxX) / 2) * scale;
  const cy = floorY - (b.maxY + 3) * scale;
  const T = (p: P) => ({ x: cx + p.x * scale, y: cy + p.y * scale });
  const model = theme.model ?? 'female';
  const pal = PALETTE[model];
  const bd = BUILD[model];

  ctx.clearRect(0, 0, w, h);
  // floor + mat
  ctx.strokeStyle = theme.floor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, floorY + 4);
  ctx.lineTo(w * 0.92, floorY + 4);
  ctx.stroke();
  ctx.fillStyle = theme.accent;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(w * 0.2, floorY + 1, w * 0.6, 6);
  ctx.globalAlpha = 1;
  // soft contact shadow
  const shadowX = T({ x: (b.minX + b.maxX) / 2, y: 0 }).x;
  const grd = ctx.createRadialGradient(shadowX, floorY + 2, 2, shadowX, floorY + 2, ((b.maxX - b.minX) / 2 + 12) * scale);
  grd.addColorStop(0, 'rgba(0,0,0,0.28)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, floorY - 10, w, 16);
  if (theme.floorOnly) return;

  /** Tapered limb segment: circles of radius ra at a and rb at b joined by tangents. */
  const capsule = (a: P, bb: P, ra: number, rb: number, color: string) => {
    const A = T(a);
    const B = T(bb);
    const RA = ra * scale;
    const RB = rb * scale;
    const d = unit(sub(B, A));
    const n = { x: -d.y, y: d.x };
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(A.x + n.x * RA, A.y + n.y * RA);
    ctx.lineTo(B.x + n.x * RB, B.y + n.y * RB);
    ctx.arc(B.x, B.y, RB, Math.atan2(n.y, n.x), Math.atan2(-n.y, -n.x), true);
    ctx.lineTo(A.x - n.x * RA, A.y - n.y * RA);
    ctx.arc(A.x, A.y, RA, Math.atan2(-n.y, -n.x), Math.atan2(n.y, n.x), true);
    ctx.closePath();
    ctx.fill();
  };
  const ellipse = (c: P, rx: number, ry: number, rot: number, color: string) => {
    const C = T(c);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(C.x, C.y, rx * scale, ry * scale, rot, 0, Math.PI * 2);
    ctx.fill();
  };

  const leg = (hip: P, knee: P, foot: P, far: boolean) => {
    const k = far ? 0.72 : 1;
    const skin = shade(pal.skin, k);
    const cloth = shade(pal.bottom, k);
    const [t0, t1] = bd.thigh;
    const [s0, s1] = bd.shin;
    capsule(hip, knee, t0, t1, skin);
    capsule(knee, foot, s0 * 0.98, s1, skin);
    // calf muscle bulge at the back of the shin
    const shinDir = unit(sub(foot, knee));
    const calf = add(lerp(knee, foot, 0.3), { x: shinDir.y, y: -shinDir.x }, -1.2);
    ellipse(calf, s0 * 1.05, s0 * 0.75, Math.atan2(shinDir.y, shinDir.x), skin);
    // clothing: leggings to the ankle, or shorts over the upper thigh
    if (bd.legging) {
      capsule(hip, knee, t0 + 0.25, t1 + 0.25, cloth);
      capsule(knee, lerp(knee, foot, 0.9), s0 + 0.2, s1 + 0.35, cloth);
    } else capsule(hip, lerp(hip, knee, bd.shortsTo), t0 + 0.6, t0 * 0.85, cloth);
    // shoe: points to the front of the shin
    const toe = { x: shinDir.y, y: -shinDir.x };
    const heel = add(foot, toe, -2.2);
    const tip = add(foot, toe, 8.5);
    capsule(heel, tip, 2.9, 2.2, shade(pal.shoe, k));
    capsule(add(heel, shinDir, 1.6), add(tip, shinDir, 1.4), 1.1, 1, shade(pal.sole, k));
  };

  const arm = (shoulder: P, elbow: P, hand: P, far: boolean) => {
    const k = far ? 0.72 : 1;
    const skin = shade(pal.skin, k);
    capsule(shoulder, elbow, bd.upperArm[0], bd.upperArm[1], skin);
    capsule(elbow, hand, bd.foreArm[0], bd.foreArm[1], skin);
    if (bd.sleeve > 0) capsule(shoulder, lerp(shoulder, elbow, bd.sleeve), bd.upperArm[0] + 0.7, bd.upperArm[0] * 0.92, shade(pal.top, k));
    const hd = unit(sub(hand, elbow));
    ellipse(add(hand, hd, 1.6), bd.hand * 1.15, bd.hand * 0.85, Math.atan2(hd.y, hd.x), skin);
  };

  // ── torso outline from the spine curve ──
  const bez = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * s.hip.x + 2 * u * t * s.spineCtrl.x + t * t * s.shoulder.x,
      y: u * u * s.hip.y + 2 * u * t * s.spineCtrl.y + t * t * s.shoulder.y,
    };
  };
  const tangent = (t: number) => unit({
    x: 2 * (1 - t) * (s.spineCtrl.x - s.hip.x) + 2 * t * (s.shoulder.x - s.spineCtrl.x),
    y: 2 * (1 - t) * (s.spineCtrl.y - s.hip.y) + 2 * t * (s.shoulder.y - s.spineCtrl.y),
  });
  const edge = (t: number, side: 1 | -1) => {
    const p = bez(t);
    const fr = frontOf(tangent(t));
    const r = side > 0 ? sampleProfile(bd.front, t) * (1 + breath * 0.06 * (t > 0.5 ? 1 : 0.3)) : sampleProfile(bd.back, t);
    return add(p, fr, r * side * 1.14);
  };
  const band = (t0: number, t1: number, color: string) => {
    const N = 10;
    const pts: P[] = [];
    for (let i = 0; i <= N; i++) pts.push(edge(t0 + ((t1 - t0) * i) / N, 1));
    for (let i = N; i >= 0; i--) pts.push(edge(t0 + ((t1 - t0) * i) / N, -1));
    ctx.fillStyle = color;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const q = T(p);
      if (i) ctx.lineTo(q.x, q.y);
      else ctx.moveTo(q.x, q.y);
    });
    ctx.closePath();
    ctx.fill();
  };

  // far side first
  leg(s.hip, s.fKnee, s.fFoot, true);
  arm(s.shoulder, s.fElbow, s.fHand, true);

  // torso: skin, then clothing bands; rounded ends at hip and shoulder
  const up0 = tangent(0);
  const up1 = tangent(1);
  ellipse(add(s.hip, frontOf(up0), (bd.front[0] - bd.back[0]) / 2), (bd.front[0] + bd.back[0]) / 2, 7, Math.atan2(up0.y, up0.x), pal.bottom);
  band(0, 1, pal.skin);
  const sh = (bd.front[6] + bd.back[6]) / 2;
  ellipse(add(s.shoulder, frontOf(up1), (bd.front[6] - bd.back[6]) / 2), 5, sh, Math.atan2(up1.y, up1.x), bd.sleeve ? pal.top : pal.skin);
  band(0, model === 'female' ? 0.3 : 0.2, pal.bottom);
  band(bd.topFrom, Math.min(1, bd.topTo), pal.top);
  // waistband accent
  band(model === 'female' ? 0.27 : 0.17, model === 'female' ? 0.31 : 0.21, shade(pal.bottom, 1.45));

  // neck + head
  const headDir = unit(sub(s.headC, s.shoulder));
  const neckTop = add(s.shoulder, headDir, L.neck + 2);
  capsule(add(s.shoulder, headDir, 2), neckTop, bd.neck, bd.neck * 0.92, shade(pal.skin, 0.93));
  const face = frontOf(headDir);
  const rot = Math.atan2(headDir.y, headDir.x);
  // head shape: slightly egg-shaped, jaw toward the front
  ellipse(s.headC, L.head * 1.05, L.head * 0.88, rot, pal.skin);
  ellipse(add(add(s.headC, face, 3.2), headDir, -3.6), 5.6, 4.2, rot, pal.skin);
  // nose + ear + eye
  ellipse(add(add(s.headC, face, 9.4), headDir, -0.8), 1.7, 1.2, rot, shade(pal.skin, 0.95));
  ellipse(add(s.headC, face, -1.2), 1.9, 2.5, rot, shade(pal.skin, 0.86));
  ellipse(add(add(s.headC, face, 5.6), headDir, 1.3), 0.95, 0.75, rot, '#2b1d16');
  // hair
  const hairC = add(add(s.headC, face, -2.2), headDir, 2.2);
  if (model === 'female') {
    ellipse(hairC, L.head * 0.98, L.head * 0.8, rot, pal.hair);
    // ponytail: a tapered tail from the back of the head
    const knot = add(add(s.headC, face, -8.5), headDir, 3.5);
    ellipse(knot, 2.6, 2.6, 0, pal.hair);
    const tailEnd = add(add(knot, face, -6), headDir, -9 + breath * 0.5);
    capsule(knot, lerp(knot, tailEnd, 0.5), 2.6, 2.4, pal.hair);
    capsule(lerp(knot, tailEnd, 0.5), tailEnd, 2.4, 0.9, pal.hair);
  } else {
    ellipse(add(hairC, headDir, 1.2), L.head * 0.96, L.head * 0.62, rot, pal.hair);
    ellipse(add(add(s.headC, face, -6.5), headDir, -1.5), 3.2, 4.2, rot, pal.hair);
  }

  // near side on top
  leg(s.hip, s.nKnee, s.nFoot, false);
  arm(s.shoulder, s.nElbow, s.nHand, false);
}

/** Mirror isn't needed for a side view: "left side" is shown by swapping near/far limbs. */
export function swapSides(f: Figure): Figure {
  const [t, h, fua, ffa, nua, nfa, fth, fsh, nth, nsh, c = 0, ...rest] = f;
  // head turn and tilt (figure[17], [18]) and the trunk twist (figure[22]) go the other way
  if (rest[11]) rest[11] = -rest[11];
  if (rest[6]) rest[6] = -rest[6];
  if (rest[7]) rest[7] = -rest[7];
  // a crossed leg (figure[19], [20]) stays the crossing one: only the arms change sides
  if (rest[8] || rest[9]) return [t, h, nua, nfa, fua, ffa, fth, fsh, nth, nsh, c, ...rest];
  // (side-lying extras stay: the body keeps lying on the same side)
  // legs dropped to one side (figure[15]) go to the other side
  if (rest[4]) rest[4] = -rest[4];
  return [t, h, nua, nfa, fua, ffa, nth, nsh, fth, fsh, c, ...rest];
}

/**
 * The other side of a pose drawn facing the camera (warrior II, side plank, triangle…). There the
 * drawing is the frontal plane, so the other side is its mirror image: left and right limbs trade
 * places and every angle flips. Only swapping the limbs (as for side views) would send each arm
 * across the chest to the other side during the change.
 */
export function mirrorFrontal(f: Figure): Figure {
  const m = swapSides(f);
  for (let i = 0; i < 2; i++) m[i] = -m[i];
  // limb pairs drawn alike are already symmetric (the far one is mirrored when posed): they stay;
  // only pairs that differ (one arm up, one down; front and back leg) change sides
  const same = (a: number, b: number) => Math.abs((((a - b + 540) % 360) - 180)) < 20;
  for (const [x, y] of [[2, 4], [3, 5], [6, 8], [7, 9]] as const) {
    if (same(f[x], f[y])) {
      m[x] = f[x];
      m[y] = f[y];
    } else {
      m[x] = -m[x];
      m[y] = -m[y];
    }
  }
  return m;
}
