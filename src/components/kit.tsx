import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getMove } from '../engine/animate';
import { drawFigure } from '../engine/figure';
import { useT } from '../i18n';

// ───────── icons (stroke icons, inherit currentColor) ─────────
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  close: 'M6 6l12 12M18 6 6 18',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  timer: 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 10v4l2 2M9 2h6',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  left: 'M15 18l-6-6 6-6',
  right: 'M9 18l6-6-6-6',
  down: 'M6 9l6 6 6-6',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  plus: 'M12 5v14M5 12h14',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  people: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M22 21a7 7 0 0 0-4-6.3',
  check: 'M5 12l5 5L20 7',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  arm: 'M4 15c2-1 3-4 5-6s5-3 7-1 1 5-2 6l-3 1M4 15l2 4h7c3 0 5-2 5-5',
  legs: 'M9 3v8l-2 10M15 3v8l2 10M9 11h6',
  core: 'M12 3v18M7 7h10M6 12h12M7 17h10',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  flame: 'M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3 0-5 1-8z',
  leaf: 'M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l8-8',
  alarm: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M5 3 2 6M19 3l3 3',
  play: 'M7 4v16l13-8z',
  skip: 'M5 4v16l10-8zM19 5v14',
  stop: 'M6 6h12v12H6z',
  heart: 'M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.5-9 9-9 9z',
  ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8',
  thumbUp: 'M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 16.8 20H7',
  thumbDown: 'M17 13V4h3v9zM17 13l-4 8a2 2 0 0 1-2-2v-4H6a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 7.2 4H17',
  gauge: 'M12 14l4-4M3.5 17a9 9 0 1 1 17 0',
  moon: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z',
  bolt2: 'M13 2 4 14h7l-1 8 9-12h-7z',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
} as const;
export type IconName = keyof typeof P;

export function Icon({ name, size = 20, stroke = 2 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === 'dots' ? 3.5 : stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={P[name]} />
    </svg>
  );
}

// ───────── full-screen sheet ─────────
export function Sheet({ title, sub, onClose, children, footer, className }: { title?: string; sub?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; className?: string }) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [onClose]);
  return createPortal(
    <div className={`sheet ${className ?? ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-inner">
        <header className="sheet-head">
          <button className="icon-btn" onClick={onClose} aria-label={t('close')}><Icon name="close" /></button>
          {title && <h1>{title}</h1>}
          {sub && <p>{sub}</p>}
        </header>
        <div className="sheet-body">{children}</div>
        {footer && <footer className="sheet-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

// ───────── switch ─────────
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

// ───────── static figure thumbnail ─────────
export function MoveThumb({ moveId, className }: { moveId: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const mv = getMove(moveId);
    if (!c || !mv) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      const ctx = c.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cs = getComputedStyle(c);
      const v = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
      const frame = mv.frames[mv.frames.length > 1 ? 1 : 0];
      drawFigure(ctx, frame, w, h, { body: v('--fig-body', '#fff'), far: v('--fig-far', '#888'), floor: v('--fig-floor', '#444'), accent: v('--accent', '#4aa3ff') });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [moveId]);
  return <canvas ref={ref} className={className ?? 'thumb'} aria-hidden />;
}

// ───────── minutes dial ─────────
const R = 112;
const C = 130;
export function Dial({ value, min, max, onChange, unit }: { value: number; min: number; max: number; onChange: (v: number) => void; unit: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const last = useRef(value);
  last.current = value;
  const frac = Math.min(1, value / max);
  const a = frac * 2 * Math.PI;
  const kx = C + R * Math.sin(a);
  const ky = C - R * Math.cos(a);
  const circ = 2 * Math.PI * R;

  const fromPointer = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    let ang = Math.atan2(x, -y);
    if (ang < 0) ang += 2 * Math.PI;
    let v = Math.round((ang / (2 * Math.PI)) * max);
    // no wrap-around: dragging past the top clamps at the end you came from
    const prev = last.current;
    if (prev > max * 0.75 && v < max * 0.25) v = max;
    else if (prev < max * 0.25 + min && v > max * 0.75) v = min;
    v = Math.max(min, Math.min(max, v));
    if (v !== prev) onChange(v);
  };

  return (
    <div className="dial">
      <svg
        ref={ref}
        viewBox="0 0 260 260"
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit}`}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={(e) => e.buttons && fromPointer(e)}
        onKeyDown={(e) => {
          const d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0;
          if (d) {
            e.preventDefault();
            onChange(Math.max(min, Math.min(max, value + d)));
          }
        }}
      >
        <circle cx={C} cy={C} r={R} className="dial-track" />
        <circle cx={C} cy={C} r={R} className="dial-arc" strokeDasharray={`${circ * frac} ${circ}`} transform={`rotate(-90 ${C} ${C})`} />
        <circle cx={kx} cy={ky} r={15} className="dial-knob" />
        <circle cx={kx} cy={ky} r={6} className="dial-knob-dot" />
      </svg>
      <div className="dial-label" aria-hidden>
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
    </div>
  );
}

// ───────── stepped slider with a value bubble and end captions ─────────
export function RangeSlider({ value, min, max, step, onChange, label, format, minLabel, maxLabel, disabled }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string;
  format: (v: number) => string; minLabel: string; maxLabel: string; disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const steps = Math.round((max - min) / step);
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const set = (clientX: number) => {
    if (disabled) return;
    const r = ref.current!.getBoundingClientRect();
    const v = clamp(min + Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * steps) * step);
    if (v !== value) onChange(v);
  };
  const pct = ((clamp(value) - min) / (max - min)) * 100;
  return (
    <div className={`range ${disabled ? 'disabled' : ''}`}>
      <div className="range-bubble-row">
        <span className="range-bubble" style={{ left: `${pct}%` }}>{format(value)}</span>
      </div>
      <div
        ref={ref}
        className={`step-slider ${value === min ? 'off' : ''}`}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onPointerDown={(e) => {
          if (disabled) return;
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          set(e.clientX);
        }}
        onPointerMove={(e) => e.buttons && set(e.clientX)}
        onKeyDown={(e) => {
          const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
          if (d && !disabled) {
            e.preventDefault();
            onChange(clamp(value + d * step));
          }
        }}
      >
        <div className="ss-track" />
        <div className="ss-fill" style={{ width: `${pct}%` }} />
        {steps <= 20 && Array.from({ length: steps + 1 }, (_, i) => (i / steps) * 100 > pct ? <i key={i} className="ss-dot" style={{ left: `${(i / steps) * 100}%` }} /> : null)}
        <div className="ss-knob" style={{ left: `${pct}%` }} />
      </div>
      <div className="range-caps"><span>{minLabel}</span><span>{maxLabel}</span></div>
    </div>
  );
}

// ───────── stepped slider (0…5) used by the Mix ─────────
export function StepSlider({ value, onChange, label, steps = 5 }: { value: number; onChange: (v: number) => void; label: string; steps?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const v = Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * steps);
    if (v !== value) onChange(v);
  };
  const pct = (value / steps) * 100;
  return (
    <div
      ref={ref}
      className={`step-slider ${value === 0 ? 'off' : ''}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={steps}
      aria-valuenow={value}
      onPointerDown={(e) => {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        set(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && set(e.clientX)}
      onKeyDown={(e) => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
        if (d) {
          e.preventDefault();
          onChange(Math.max(0, Math.min(steps, value + d)));
        }
      }}
    >
      <div className="ss-track" />
      <div className="ss-fill" style={{ width: `${pct}%` }} />
      {Array.from({ length: steps + 1 }, (_, i) => (i > value ? <i key={i} className="ss-dot" style={{ left: `${(i / steps) * 100}%` }} /> : null))}
      <div className="ss-knob" style={{ left: `${pct}%` }} />
    </div>
  );
}
