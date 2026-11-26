import { useMemo, useState } from 'react';
import { AudioSettings } from '../components/AudioSettings';
import { Preview } from '../components/Preview';
import { Card, Field, Segmented, Slider } from '../components/ui';
import { generateMeditation, type MeditationConfig } from '../engine/mind';
import { newSeed } from '../engine/rng';
import type { Session } from '../engine/types';
import { useLang, useT } from '../i18n';
import { setState, useStore } from '../store/store';

const GOAL_ICON = { sleep: '🌙', stress: '🫧', focus: '🎯', breath: '🌬️', timer: '⏱️' } as const;

export function MeditationSetup({ onStart }: { onStart: (s: Session) => void }) {
  const t = useT();
  const lang = useLang();
  const cfg = useStore((s) => s.meditation);
  const [seed, setSeed] = useState(newSeed);
  const set = (p: Partial<MeditationConfig>) => setState((s) => ({ meditation: { ...s.meditation, ...p } }));
  const session = useMemo(() => generateMeditation({ ...cfg, lang }, seed), [cfg, lang, seed]);

  return (
    <div className="setup">
      <Card title={t('goal')}>
        <div className="style-grid small">
          {(['sleep', 'stress', 'focus', 'breath', 'timer'] as const).map((g) => (
            <button key={g} className={`style-card ${cfg.goal === g ? 'on' : ''}`} onClick={() => set({ goal: g })}>
              <span className="icon">{GOAL_ICON[g]}</span>
              <strong>{t(`m_${g}`)}</strong>
            </button>
          ))}
        </div>
      </Card>
      <Card title={t('duration')}>
        <Field label={t('duration')}>
          <Slider value={cfg.minutes} min={1} max={60} onChange={(v) => set({ minutes: v })} format={(v) => `${v} ${t('min')}`} />
        </Field>
        {['sleep', 'stress', 'focus'].includes(cfg.goal) && (
          <Field label={t('silence')}>
            <Slider value={cfg.silence} min={5} max={180} step={5} onChange={(v) => set({ silence: v })} format={(v) => `${v}${t('sec')}`} />
          </Field>
        )}
        {cfg.goal === 'breath' && (
          <Field label={t('pattern')}>
            <Segmented value={cfg.pattern} onChange={(v) => set({ pattern: v })} options={(['box', '478', 'coherent', 'calm'] as const).map((v) => ({ value: v, label: t(`p_${v}`) }))} />
          </Field>
        )}
        {cfg.goal === 'timer' && (
          <Field label={t('bell')}>
            <Slider value={cfg.bellMinutes} min={0} max={15} onChange={(v) => set({ bellMinutes: v })} format={(v) => (v ? `${v} ${t('min')}` : t('none'))} />
          </Field>
        )}
        {lang !== 'it' && lang !== 'en' && cfg.goal !== 'timer' && <p className="hint">{t('scriptNote')}</p>}
      </Card>
      <Card title={t('voiceAudio')}>
        <AudioSettings />
      </Card>
      <Card className="sticky-preview">
        <Preview session={session} poolSize={0} onStart={() => onStart(session)} onRegenerate={() => setSeed(newSeed())} />
      </Card>
    </div>
  );
}
