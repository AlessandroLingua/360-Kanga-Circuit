import { useEffect, useMemo, useRef, useState } from 'react';
import { HIIT, PILATES } from '../engine/library/fitness';
import { YOGA } from '../engine/library/yoga';
import { yawFor } from '../engine/facing';
import type { Move } from '../engine/types';

/**
 * Developer screen (#audit): every distinct pose drawn in 3D from the side and from a
 * three-quarter front view, to check that all exercises are anatomically possible.
 * ?p=<page> picks the page, ?f=<frame index> a different keyframe.
 */
export function PoseAudit() {
  const list = useMemo(() => {
    const seen = new Set<string>();
    const out: Move[] = [];
    for (const m of [...YOGA, ...PILATES, ...HIIT]) {
      const k = JSON.stringify(m.frames);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(m);
      }
    }
    return out;
  }, []);
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const [page, setPage] = useState(Number(q.get('p') ?? 0));
  const frameIdx = q.get('f');
  const per = 8;
  const pages = Math.ceil(list.length / per);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1b1b20', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: 4, color: '#fff', alignItems: 'center' }}>
        <button onClick={() => setPage((p) => Math.max(0, p - 1))}>◀</button>
        <span>{page + 1}/{pages}</span>
        <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>▶</button>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridAutoRows: '1fr', gap: 3, padding: 3, minHeight: 0 }}>
        {list.slice(page * per, page * per + per).map((m) => (
          <Cell key={m.id + page} m={m} frameIdx={frameIdx === null ? undefined : Number(frameIdx)} />
        ))}
      </div>
    </div>
  );
}

function Cell({ m, frameIdx }: { m: Move; frameIdx?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    import('../engine/figure3d').then(async (f3) => {
      f3.preloadFigure3D('female');
      while (alive && !f3.figure3DReady('female')) await new Promise((r) => setTimeout(r, 200));
      const c = ref.current;
      if (!alive || !c) return;
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = w * 2;
      c.height = h * 2;
      const ctx = c.getContext('2d')!;
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      const fr = m.frames[frameIdx ?? (m.frames.length > 1 ? 1 : 0)] ?? m.frames[0];
      const yaw = yawFor(m);
      const half = w / 2;
      const tmp = document.createElement('canvas');
      tmp.width = half * 2;
      tmp.height = h * 2;
      const t = tmp.getContext('2d')!;
      t.setTransform(2, 0, 0, 2, 0, 0);
      [0, 60].forEach((orbit, i) => {
        t.clearRect(0, 0, half, h);
        f3.drawFigure3D(t, fr, half, h, 'female', 0, 0.9, { yaw, orbit });
        ctx.drawImage(tmp, 0, 0, half * 2, h * 2, i * half, 0, half, h);
      });
      ctx.fillStyle = '#fff';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${m.id.slice(0, 40)}${yaw ? ' (yaw 90)' : ''}`, 4, 12);
      ctx.fillStyle = '#9ab';
      ctx.fillText(JSON.stringify(fr.map(Math.round)), 4, 25);
    });
    return () => {
      alive = false;
    };
  }, [m, frameIdx]);
  return <canvas ref={ref} style={{ width: '100%', height: '100%', background: '#25252b', display: 'block' }} />;
}
