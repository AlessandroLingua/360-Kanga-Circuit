/**
 * Draws the exercise figure: the realistic 3D model when it is ready, otherwise the flat one.
 * three.js and the models are loaded lazily (separate chunk) the first time a figure is drawn.
 */
import { drawFigure, type DrawTheme, type FigureModel } from './figure';
import type { Figure } from './types';

type Mod = typeof import('./figure3d');
let mod: Mod | null = null;
let loading: Promise<void> | null = null;
const waiting = new Set<() => void>();

function ensure() {
  loading ??= import('./figure3d')
    .then((m) => {
      mod = m;
      m.onFigure3DReady(() => waiting.forEach((cb) => cb()));
      waiting.forEach((cb) => cb());
    })
    .catch(() => {
      /* flat figure only */
    });
}

/** Called when the 3D figure becomes available, so static thumbnails can redraw. */
export function onFigureUpgrade(cb: () => void) {
  waiting.add(cb);
  return () => waiting.delete(cb);
}

export function preloadFigure(model: FigureModel) {
  ensure();
  mod?.preloadFigure3D(model);
}

export function drawAnyFigure(ctx: CanvasRenderingContext2D, f: Figure, w: number, h: number, theme: DrawTheme, breath = 0, view?: { yaw?: number; orbit?: number; elev?: number; wall?: boolean }) {
  ensure();
  const model = theme.model ?? 'female';
  if (mod?.figure3DReady(model)) {
    // the 3D scene has its own floor and mat
    ctx.clearRect(0, 0, w, h);
    if (mod.drawFigure3D(ctx, f, w, h, model, breath, theme.floorAt, view)) return;
  } else mod?.preloadFigure3D(model);
  drawFigure(ctx, f, w, h, theme, breath);
}
