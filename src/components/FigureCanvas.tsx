import { useEffect, useRef } from 'react';
import { getState } from '../store/store';
import type { DrawTheme } from '../engine/figure';
import { drawAnyFigure } from '../engine/drawAny';
import type { FigureFrame } from '../engine/animate';

/** Canvas that redraws whenever `getFrame` changes output; driven by the parent's animation loop via `frameRef`. */
export function FigureCanvas({ frameRef, className, floorAt }: { frameRef: React.RefObject<FigureFrame | null>; className?: string; floorAt?: number }) {
  const floorRef = useRef(floorAt);
  floorRef.current = floorAt;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    let theme: DrawTheme | null = null;
    const readTheme = () => {
      const cs = getComputedStyle(c);
      theme = {
        body: cs.getPropertyValue('--fig-body').trim() || '#f3efe6',
        far: cs.getPropertyValue('--fig-far').trim() || '#9fb3a8',
        floor: cs.getPropertyValue('--line').trim() || '#3a4a44',
        accent: cs.getPropertyValue('--accent').trim() || '#e8b86b',
        model: getState().figure,
      };
    };
    readTheme();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', readTheme);
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const f = frameRef.current;
      if (f && theme) drawAnyFigure(ctx, f.fig, w, h, { ...theme, floorAt: floorRef.current }, f.breath, { yaw: f.yaw, orbit: f.orbit, elev: f.elev, wall: f.wall });
      else ctx.clearRect(0, 0, w, h);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener('change', readTheme);
    };
  }, [frameRef]);
  return <canvas ref={ref} className={className ?? 'figure-canvas'} />;
}
