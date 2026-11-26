import { useMemo, useState } from 'react';
import { AudioSettings } from '../components/AudioSettings';
import { Preview } from '../components/Preview';
import { Card, Field, Segmented, Select, Slider } from '../components/ui';
import { YOGA } from '../engine/library/yoga';
import { generateNidra } from '../engine/mind';
import { newSeed } from '../engine/rng';
import { FOCUS_AREAS, type FocusArea, type Session, type YogaStyle } from '../engine/types';
import { generateYoga, type YogaConfig } from '../engine/yoga';
import { useLang, useT } from '../i18n';
import { FOCUS_LABEL, STYLE_LABEL, pickRow } from '../i18n/labels';
import { setState, useStore } from '../store/store';

const STYLES: YogaStyle[] = ['vinyasa', 'hatha', 'gentle', 'restorative', 'yin', 'ashtanga', 'sunSalutation', 'nidra'];
const STYLE_ICON: Record<YogaStyle, string> = { vinyasa: '🌊', hatha: '⛰️', gentle: '🍃', restorative: '🛏️', yin: '🌙', ashtanga: '🔥', sunSalutation: '☀️', nidra: '💤' };

export function YogaSetup({ onStart }: { onStart: (s: Session) => void }) {
  const t = useT();
  const lang = useLang();
  const cfg = useStore((s) => s.yoga);
  const nidra = useStore((s) => s.nidra);
  const likes = useStore((s) => s.likes);
  const dislikes = useStore((s) => s.dislikes);
  const [seed, setSeed] = useState(newSeed);
  const set = (p: Partial<YogaConfig>) => setState((s) => ({ yoga: { ...s.yoga, ...p } }));

  const session = useMemo(
    () =>
      cfg.style === 'nidra'
        ? generateNidra(nidra.minutes, nidra.sleep, lang, seed)
        : generateYoga({ ...cfg, lang, likes, dislikes }, seed),
    [cfg, nidra, lang, likes, dislikes, seed],
  );
  const poolSize = cfg.style === 'nidra' ? 0 : YOGA.filter((m) => m.level <= cfg.level && !dislikes.includes(m.id) && (m.styles ?? []).includes(cfg.style)).length;
  const focusOpts = FOCUS_AREAS.map((f) => ({ value: f, label: pickRow(FOCUS_LABEL[f], lang) }));

  return (
    <div className="setup">
      <Card title={t('style')}>
        <div className="style-grid">
          {STYLES.map((s) => (
            <button key={s} className={`style-card ${cfg.style === s ? 'on' : ''}`} onClick={() => set({ style: s })}>
              <span className="icon">{STYLE_ICON[s]}</span>
              <strong>{pickRow(STYLE_LABEL[s].name, lang)}</strong>
              <small>{pickRow(STYLE_LABEL[s].desc, lang)}</small>
            </button>
          ))}
        </div>
      </Card>

      {cfg.style === 'nidra' ? (
        <Card title={t('duration')}>
          <Field label={t('duration')}>
            <Slider value={nidra.minutes} min={8} max={60} step={1} onChange={(v) => setState({ nidra: { ...nidra, minutes: v } })} format={(v) => `${v} ${t('min')}`} />
          </Field>
          <label className="toggle">
            <input type="checkbox" checked={nidra.sleep} onChange={(e) => setState({ nidra: { ...nidra, sleep: e.target.checked } })} /> {t('sleepMode')}
          </label>
          {lang !== 'it' && lang !== 'en' && <p className="hint">{t('scriptNote')}</p>}
        </Card>
      ) : (
        <>
          <Card title={t('duration')}>
            <Field label={t('duration')}>
              <Slider value={cfg.minutes} min={5} max={90} step={5} onChange={(v) => set({ minutes: v, savasanaMin: Math.min(cfg.savasanaMin, Math.floor(v * 0.4)) })} format={(v) => `${v} ${t('min')}`} />
            </Field>
            <Field label={t('savasana')}>
              <Slider value={cfg.savasanaMin} min={0} max={15} onChange={(v) => set({ savasanaMin: Math.min(v, Math.floor(cfg.minutes * 0.4)) })} format={(v) => `${v} ${t('min')}`} />
            </Field>
            <div className="two">
              <Field label={t('warmup')}>
                <Segmented value={cfg.warmup} onChange={(v) => set({ warmup: v })} options={(['none', 'standard', 'extended'] as const).map((v) => ({ value: v, label: t(v) }))} />
              </Field>
              <Field label={t('cooldown')}>
                <Segmented value={cfg.cooldown} onChange={(v) => set({ cooldown: v })} options={(['none', 'standard', 'extended'] as const).map((v) => ({ value: v, label: t(v) }))} />
              </Field>
            </div>
          </Card>

          <Card title={`${t('level')} & ${t('pace')}`}>
            <Field label={t('level')}>
              <Segmented value={cfg.level} onChange={(v) => set({ level: v })} options={([1, 2, 3, 4, 5] as const).map((v) => ({ value: v, label: t(`level${v}`) }))} />
            </Field>
            <Field label={t('pace')}>
              <Segmented value={cfg.pace} onChange={(v) => set({ pace: v })} options={([1, 2, 3, 4, 5] as const).map((v) => ({ value: v, label: t(`pace${v}`) }))} />
            </Field>
          </Card>

          <Card title={`${t('boost')} · 19`}>
            <div className="two">
              <Field label={t('primaryFocus')}>
                <Select
                  value={cfg.focusPrimary}
                  onChange={(v) => set({ focusPrimary: v as FocusArea | 'auto' | 'none' })}
                  options={[{ value: 'auto', label: `⟳ ${t('autoRotate')}` }, { value: 'none', label: t('none') }, ...focusOpts]}
                />
              </Field>
              <Field label={t('secondaryFocus')}>
                <Select value={cfg.focusSecondary} onChange={(v) => set({ focusSecondary: v as FocusArea | 'none' })} options={[{ value: 'none', label: t('none') }, ...focusOpts]} />
              </Field>
            </div>
          </Card>
        </>
      )}

      <Card title={t('voiceAudio')}>
        <AudioSettings
          instruction={cfg.style === 'nidra' ? undefined : cfg.instruction}
          onInstruction={(v) => set({ instruction: v })}
          sanskrit={cfg.sanskrit}
          onSanskrit={cfg.style === 'nidra' ? undefined : (v) => set({ sanskrit: v })}
        />
      </Card>

      <Card className="sticky-preview">
        <Preview session={session} poolSize={poolSize} onStart={() => onStart(session)} onRegenerate={() => setSeed(newSeed())} />
      </Card>
    </div>
  );
}
