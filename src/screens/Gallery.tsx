import { useEffect, useRef } from 'react';
import { getState } from '../store/store';
import { drawAnyFigure, onFigureUpgrade } from '../engine/drawAny';
import { HIIT, PILATES } from '../engine/library/fitness';
import { YOGA } from '../engine/library/yoga';
import type { Move } from '../engine/types';
import { stillView } from '../engine/animate';
import { moveName } from '../engine/cues';
import { useLang } from '../i18n';

/** Pose library: every move with its generated figure (open with #gallery). */
export function Gallery() {
  const lang = useLang();
  return (
    <div className="gallery">
      {[...YOGA, ...PILATES, ...HIIT].map((m) => (
        <Thumb key={m.discipline + m.id} m={m} label={moveName(m, { lang, sanskrit: false })} />
      ))}
    </div>
  );
}

function Thumb({ m, label }: { m: Move; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    const cs = getComputedStyle(c);
    const theme = { body: cs.getPropertyValue('--fig-body'), far: cs.getPropertyValue('--fig-far'), floor: cs.getPropertyValue('--line'), accent: cs.getPropertyValue('--accent'), model: getState().figure };
    c.width = 320;
    c.height = 240;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    const draw = () => drawAnyFigure(ctx, m.frames[m.frames.length > 1 ? 1 : 0], 160, 120, theme, 0, stillView(m, m.frames[m.frames.length > 1 ? 1 : 0]));
    // hundreds of thumbnails: draw only when on screen, and again once the 3D figure is ready
    let visible = false;
    const io = new IntersectionObserver((e) => {
      visible = e.some((x) => x.isIntersecting);
      if (visible) draw();
    }, { rootMargin: '200px' });
    io.observe(c);
    const off = onFigureUpgrade(() => visible && draw());
    return () => {
      io.disconnect();
      off();
    };
  }, [m]);
  return (
    <figure>
      <canvas ref={ref} style={{ width: 160, height: 120 }} />
      <figcaption>{label}<br /><small>{m.discipline} · L{m.level}</small></figcaption>
    </figure>
  );
}
