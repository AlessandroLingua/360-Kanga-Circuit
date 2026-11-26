import { Card, fmt } from '../components/ui';
import type { Session } from '../engine/types';
import { useLang, useT } from '../i18n';
import { variantLabel } from '../i18n/variant';
import { setState, useStore } from '../store/store';

export function Offline({ onStart }: { onStart: (s: Session) => void }) {
  const t = useT();
  const lang = useLang();
  const downloads = useStore((s) => s.downloads);
  return (
    <div className="setup">
      <Card title={t('downloads')}>
        <p className="hint">{t('offlineReady')}</p>
        {downloads.length === 0 ? (
          <p>{t('noDownloads')}</p>
        ) : (
          <ul className="journal">
            {downloads.map((d) => (
              <li key={d.id}>
                <div className="j-head">
                  <strong>{t(d.discipline)} · {variantLabel(d.discipline, d.variant, lang)}</strong>
                  <span>{fmt(d.totalSeconds)}</span>
                </div>
                <div className="hint">{new Date(d.createdAt).toLocaleString()} · {d.segments.length} seg · #{d.seed.toString(36)}</div>
                <div className="row-actions">
                  <button className="primary" onClick={() => onStart({ ...d, id: `${d.id}-${Date.now()}` })}>▶ {t('play')}</button>
                  <button className="ghost" onClick={() => setState((s) => ({ downloads: s.downloads.filter((x) => x.id !== d.id) }))}>{t('delete')}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
