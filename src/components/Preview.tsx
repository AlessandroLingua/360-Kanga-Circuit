import { useEffect, useMemo, useState } from 'react';
import type { Segment, Session } from '../engine/types';
import { useT } from '../i18n';
import { cacheSessionClips } from '../services/clips';
import { setState, useStore } from '../store/store';
import { fmt } from './ui';

interface Row {
  title: string;
  duration: number;
  kind: Segment['kind'];
  flow: boolean;
}

/** Collapse runs of quick flow steps (one breath each) into a single readable row. */
function rows(segs: Segment[]): Row[] {
  const out: Row[] = [];
  let run: Segment[] = [];
  const label = (s: Segment) => `${s.title}${s.side ? (s.side === 'right' ? ' →' : ' ←') : ''}`;
  const flush = () => {
    if (run.length >= 3) {
      const names = run.map(label);
      out.push({ title: names.length > 4 ? `${names.slice(0, 3).join(' · ')} … (${names.length})` : names.join(' · '), duration: run.reduce((a, s) => a + s.duration, 0), kind: 'move', flow: true });
    } else run.forEach((s) => out.push({ title: label(s), duration: s.duration, kind: s.kind, flow: false }));
    run = [];
  };
  for (const s of segs) {
    if (s.kind === 'move' && s.duration <= 10) run.push(s);
    else {
      flush();
      out.push({ title: label(s), duration: s.duration, kind: s.kind, flow: false });
    }
  }
  flush();
  return out;
}

/** Shows the freshly generated sequence, with Start / Regenerate / Download. */
export function Preview({ session, poolSize, onStart, onRegenerate }: { session: Session; poolSize: number; onStart: () => void; onRegenerate: () => void }) {
  const t = useT();
  const downloads = useStore((s) => s.downloads);
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(downloads.some((d) => d.id === session.id)), [session.id, downloads]);
  const list = useMemo(() => rows(session.segments), [session]);
  const distinct = new Set(session.segments.map((s) => s.moveId).filter(Boolean)).size;
  // log10 of ordered selections of `distinct` moves from the pool: a conservative lower bound on variety
  let lg = 0;
  for (let i = 0; i < Math.min(distinct, poolSize); i++) lg += Math.log10(poolSize - i);
  const combos = lg > 6 ? `10^${Math.floor(lg)}` : Math.round(10 ** lg).toLocaleString();

  const download = async () => {
    setState((s) => ({ downloads: [session, ...s.downloads.filter((d) => d.id !== session.id)].slice(0, 50) }));
    await cacheSessionClips(session);
    setSaved(true);
  };

  return (
    <div className="preview">
      <div className="preview-head">
        <div>
          <div className="eyebrow">{t('generatedNow')} · #{session.seed.toString(36)}</div>
          <div className="big">{fmt(session.totalSeconds)}</div>
          {poolSize > 0 && <div className="hint">≈ {combos} {t('combinations')}</div>}
        </div>
        <button className="ghost" onClick={onRegenerate}>↻ {t('regenerate')}</button>
      </div>
      <ol className="seq">
        {list.map((r, i) => (
          <li key={i} className={`k-${r.kind} ${r.flow ? 'flow' : ''}`}>
            <span>{r.flow ? '〰 ' : ''}{r.title}</span>
            <span className="dur">{fmt(r.duration)}</span>
          </li>
        ))}
      </ol>
      <div className="preview-actions">
        <button className="primary wide" onClick={onStart}>▶ {t('start')}</button>
        <button className="secondary" onClick={download} disabled={saved}>{saved ? `✓ ${t('saved')}` : `⤓ ${t('saveOffline')}`}</button>
      </div>
      {/* always-reachable Start on phones and tablets */}
      <div className="start-bar">
        <div>
          <strong>{fmt(session.totalSeconds)}</strong>
          <button className="ghost" onClick={onRegenerate} aria-label={t('regenerate')}>↻</button>
        </div>
        <button className="primary" onClick={onStart}>▶ {t('start')}</button>
      </div>
    </div>
  );
}
