import { useEffect, useRef, useState } from 'react';
import { FigureCanvas } from '../components/FigureCanvas';
import { figureAt } from '../engine/animate';
import type { Figure, Session } from '../engine/types';
import { onTvState, type TvState } from '../services/cast';

/** Receiver page for Chromecast / external displays: mirrors the player's state. */
export function Tv() {
  const [session, setSession] = useState<Session | null>(null);
  const [st, setSt] = useState<TvState | null>(null);
  const frameRef = useRef<{ fig: Figure; breath: number } | null>(null);
  const recv = useRef<{ s: TvState; at: number } | null>(null);

  useEffect(
    () =>
      onTvState((s) => {
        if (s.session) setSession(s.session);
        recv.current = { s, at: performance.now() };
        setSt(s);
      }),
    [],
  );

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const r = recv.current;
      if (session && r) {
        const se = r.s.segElapsed + (r.s.paused ? 0 : (performance.now() - r.at) / 1000);
        frameRef.current = figureAt(session, r.s.index, se);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [session]);

  const seg = session && st ? session.segments[st.index] : null;
  return (
    <div className="tv">
      {!session ? (
        <div className="tv-wait">Kanga Circuit 360 · TV</div>
      ) : (
        <>
          <FigureCanvas frameRef={frameRef} />
          <div className="tv-title">{seg?.title}</div>
          {st?.subtitle && <div className="subtitle">{st.subtitle}</div>}
        </>
      )}
    </div>
  );
}
