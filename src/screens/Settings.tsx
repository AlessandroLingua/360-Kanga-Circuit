import { useEffect, useState } from 'react';
import { addLocalTracks, getLocalTracks, removeLocalTrack, type LocalTrack } from '../audio/localLibrary';
import { Card, Field, Segmented, Select, Slider } from '../components/ui';
import { getMove } from '../engine/animate';
import { moveName } from '../engine/cues';
import { LANGS, type Lang } from '../engine/types';
import { LANG_NAMES, useLang, useT } from '../i18n';
import { googleSyncUnavailable, signInWithGoogle, signOutOfGoogle, syncWithDrive, useDriveSync } from '../services/driveSync';
import { connectHealth, healthSupported } from '../services/health';
import { exportData, importData, newAccountCode, syncNow } from '../services/sync';
import { clearPref, resetState, setState, useStore } from '../store/store';

function GoogleSyncCard() {
  const t = useT();
  const { account, status, pending } = useDriveSync();
  const unavailable = googleSyncUnavailable();
  const busy = status === 'syncing';
  const statusMsg =
    status === 'syncing' ? t('syncing')
    : status === 'offline' ? t('syncOffline')
    : status === 'reauth' ? t('syncReauth')
    : status === 'denied' ? t('syncDenied')
    : status === 'error' ? t('syncDriveError')
    : pending ? t('syncPending')
    : '';
  const warn = status === 'error' || status === 'denied';

  return (
    <Card title={t('accountAndSync')}>
      <p className="hint">{t('googleSyncDesc')}</p>
      {unavailable ? (
        <p className="hint">{unavailable === 'noClientId' ? t('googleNotConfigured') : t('googleUnsupported')}</p>
      ) : !account ? (
        <>
          <button className="primary" disabled={busy} onClick={() => void signInWithGoogle()}>{t('signInGoogle')}</button>
          {statusMsg && <p className={warn ? 'hint warn' : 'hint'}>{statusMsg}</p>}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
            {account.picture ? (
              <img src={account.picture} alt="" width={40} height={40} referrerPolicy="no-referrer" style={{ borderRadius: '50%', flex: 'none' }} />
            ) : (
              <span aria-hidden style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--accent, #3a6)', color: '#fff', fontWeight: 600, flex: 'none' }}>
                {(account.name || account.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              {account.name && <div style={{ fontWeight: 600 }}>{account.name}</div>}
              <div className="hint" style={{ margin: 0, overflowWrap: 'anywhere' }}>{account.email}</div>
            </div>
          </div>
          <p className="hint">
            {t('lastSync')}: {account.lastSync ? new Date(account.lastSync).toLocaleString() : t('neverSynced')}
          </p>
          {statusMsg && <p className={warn ? 'hint warn' : 'hint'} role="status">{statusMsg}</p>}
          <div className="row-actions">
            <button className="primary" disabled={busy} onClick={() => void syncWithDrive()}>{busy ? t('syncing') : t('syncNow')}</button>
            <button className="ghost" onClick={() => void signOutOfGoogle()}>{t('signOut')}</button>
          </div>
        </>
      )}
    </Card>
  );
}

export function Settings() {
  const t = useT();
  const lang = useLang();
  const weight = useStore((s) => s.weightKg);
  const figure = useStore((s) => s.figure ?? 'female');
  const health = useStore((s) => s.health);
  const sync = useStore((s) => s.sync);
  const likes = useStore((s) => s.likes);
  const dislikes = useStore((s) => s.dislikes);
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [syncMsg, setSyncMsg] = useState('');
  const refreshTracks = () => getLocalTracks().then(setTracks);
  useEffect(() => {
    refreshTracks();
  }, []);

  const changeLang = (l: Lang) =>
    setState((s) => ({
      lang: l,
      yoga: { ...s.yoga, lang: l },
      pilates: { ...s.pilates, lang: l },
      hiit: { ...s.hiit, lang: l },
      meditation: { ...s.meditation, lang: l },
      audio: { ...s.audio, teacherIdx: 0 },
    }));

  return (
    <div className="setup">
      <GoogleSyncCard />
      <Card title={t('figureModel')}>
        <p className="hint">{t('figureModelSub')}</p>
        <Segmented value={figure} onChange={(v) => setState({ figure: v })} options={[{ value: 'female' as const, label: t('female') }, { value: 'male' as const, label: t('male') }]} />
      </Card>
      <Card title={t('language')}>
        <Select value={lang} onChange={changeLang} options={LANGS.map((l) => ({ value: l, label: LANG_NAMES[l] }))} />
        <Field label={t('weight')}>
          <Slider value={weight} min={35} max={160} onChange={(v) => setState({ weightKg: v })} format={(v) => `${v} kg`} />
        </Field>
      </Card>

      <Card title={t('health')}>
        <p className="hint">{t('healthDesc')}</p>
        {healthSupported() ? (
          <button
            className={health.enabled ? 'secondary' : 'primary'}
            onClick={async () => {
              if (health.enabled) return setState({ health: { enabled: false } });
              const ok = await connectHealth();
              setState({ health: { enabled: ok } });
            }}
          >
            {health.enabled ? `✓ ${t('connected')}` : t('connect')}
          </button>
        ) : (
          <p className="hint">{t('healthUnavailable')}</p>
        )}
      </Card>

      <Card title={t('sync')}>
        <p className="hint">{t('syncDesc')}</p>
        <Field label={t('serverUrl')}>
          <input type="url" placeholder="https://sync.example.com" value={sync.server} onChange={(e) => setState({ sync: { ...sync, server: e.target.value.trim() } })} />
        </Field>
        <Field label={t('syncCode')}>
          <div className="teacher-row">
            <input value={sync.code} onChange={(e) => setState({ sync: { ...sync, code: e.target.value.trim() } })} />
            <button className="ghost" onClick={() => setState({ sync: { ...sync, code: newAccountCode() } })}>＋</button>
          </div>
        </Field>
        <div className="row-actions">
          <button className="primary" onClick={async () => {
            const r = await syncNow();
            setSyncMsg(r === 'ok' ? `✓ ${t('syncOk')}` : r === 'error' ? `✕ ${t('syncError')}` : t('syncMissing'));
          }}>{t('syncNow')}</button>
          <button className="ghost" onClick={exportData}>{t('exportData')}</button>
          <label className="ghost file-btn">
            {t('importData')}
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </label>
        </div>
        {(syncMsg || sync.lastSync) && <p className="hint">{syncMsg} {sync.lastSync ? new Date(sync.lastSync).toLocaleString() : ''}</p>}
      </Card>

      <Card title={t('localMusic')}>
        <label className="secondary file-btn">
          ＋ {t('addMusic')}
          <input type="file" accept="audio/*" multiple hidden onChange={async (e) => { if (e.target.files) { await addLocalTracks(e.target.files); refreshTracks(); } }} />
        </label>
        <ul className="rate-list">
          {tracks.map((tr) => (
            <li key={tr.id}>
              <span>♪ {tr.name}</span>
              <button className="chip" onClick={async () => { await removeLocalTrack(tr.id); refreshTracks(); }}>✕</button>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t('poseFilters')}>
        {likes.length + dislikes.length === 0 && <p className="hint">{t('noPrefs')}</p>}
        <ul className="rate-list">
          {[...likes.map((id) => [id, 'like'] as const), ...dislikes.map((id) => [id, 'dislike'] as const)].map(([id, kind]) => {
            const m = getMove(id);
            return (
              <li key={id}>
                <span>{kind === 'like' ? '♥' : '⊘'} {m ? moveName(m, { lang, sanskrit: false }) : id}</span>
                <button className="chip" onClick={() => clearPref(id)}>{t('restore')}</button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title={t('cast')}>
        <p className="hint">{t('castHelp')}</p>
      </Card>

      <button className="danger" onClick={() => confirm(t('confirmReset')) && resetState()}>{t('resetData')}</button>
    </div>
  );
}
