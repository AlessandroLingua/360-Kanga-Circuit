import type { Session } from '../engine/types';
import { useT } from '../i18n';
import { cacheSessionClips } from '../services/clips';
import { setState } from '../store/store';
import { fmt } from './ui';
import { useState } from 'react';

/** Shows the freshly generated sequence, with Start / Regenerate / Download. */
export function Preview({ session, poolSize, onStart, onRegenerate }: { session: Session; poolSize: number; onStart: () => void; onRegenerate: () => void }) {
  const t = useT();
  const [saved, setSaved] = useState(false);
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
        <button className="ghost" onClick={() => { onRegenerate(); setSaved(false); }}>↻ {t('regenerate')}</button>
      </div>
      <ol className="seq">
        {session.segments.map((s, i) => (
          <li key={i} className={`k-${s.kind} p-${s.phase}`}>
            <span>{s.title}{s.side ? (s.side === 'right' ? ' →' : ' ←') : ''}</span>
            <span className="dur">{fmt(s.duration)}</span>
          </li>
        ))}
      </ol>
      <div className="preview-actions">
        <button className="primary wide" onClick={onStart}>{t('start')}</button>
        <button className="secondary" onClick={download} disabled={saved}>{saved ? `✓ ${t('saved')}` : `⤓ ${t('saveOffline')}`}</button>
      </div>
    </div>
  );
}
