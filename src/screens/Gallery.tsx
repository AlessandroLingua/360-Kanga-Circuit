import { useEffect, useRef } from 'react';
import { drawFigure } from '../engine/figure';
import { HIIT, PILATES } from '../engine/library/fitness';
import { YOGA } from '../engine/library/yoga';
import type { Move } from '../engine/types';
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
    const theme = { body: cs.getPropertyValue('--fig-body'), far: cs.getPropertyValue('--fig-far'), floor: cs.getPropertyValue('--line'), accent: cs.getPropertyValue('--accent') };
    c.width = 320;
    c.height = 240;
    ctx.scale(2, 2);
    drawFigure(ctx, m.frames[m.frames.length > 1 ? 1 : 0], 160, 120, theme);
  }, [m]);
  return (
    <figure>
      <canvas ref={ref} style={{ width: 160, height: 120 }} />
      <figcaption>{label}<br /><small>{m.discipline} · L{m.level}</small></figcaption>
    </figure>
  );
}
