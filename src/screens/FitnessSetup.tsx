import { useMemo, useState } from 'react';
import { AudioSettings } from '../components/AudioSettings';
import { Preview } from '../components/Preview';
import { Card, Field, Segmented, Slider } from '../components/ui';
import { FITNESS_FOCUS, generateFitness, type FitnessConfig } from '../engine/fitness';
import { HIIT, PILATES } from '../engine/library/fitness';
import { newSeed } from '../engine/rng';
import type { Session } from '../engine/types';
import { useLang, useT } from '../i18n';
import { setState, useStore } from '../store/store';

export function FitnessSetup({ discipline, onStart }: { discipline: 'pilates' | 'hiit'; onStart: (s: Session) => void }) {
  const t = useT();
  const lang = useLang();
  const cfg = useStore((s) => s[discipline]);
  const likes = useStore((s) => s.likes);
  const dislikes = useStore((s) => s.dislikes);
  const [seed, setSeed] = useState(newSeed);
  const set = (p: Partial<FitnessConfig>) => setState((s) => ({ [discipline]: { ...s[discipline], ...p } }));
  const session = useMemo(() => generateFitness({ ...cfg, discipline, lang, likes, dislikes }, seed), [cfg, discipline, lang, likes, dislikes, seed]);
  const lib = discipline === 'hiit' ? HIIT : PILATES;
  const poolSize = lib.filter((m) => m.level <= cfg.level && !dislikes.includes(m.id)).length;

  return (
    <div className="setup">
      <Card title={`${t(discipline)} · ${t('duration')}`}>
        <Field label={t('duration')}>
          <Slider value={cfg.minutes} min={5} max={60} step={5} onChange={(v) => set({ minutes: v })} format={(v) => `${v} ${t('min')}`} />
        </Field>
        <div className="two">
          <Field label={t('warmup')}>
            <Segmented value={cfg.warmup} onChange={(v) => set({ warmup: v })} options={(['none', 'standard', 'extended'] as const).map((v) => ({ value: v, label: t(v) }))} />
          </Field>
          <Field label={t('cooldown')}>
            <Segmented value={cfg.cooldown} onChange={(v) => set({ cooldown: v })} options={(['none', 'standard', 'extended'] as const).map((v) => ({ value: v, label: t(v) }))} />
          </Field>
        </div>
        {discipline === 'hiit' && (
          <div className="two">
            <Field label={t('work')}>
              <Slider value={cfg.workSec} min={20} max={60} step={5} onChange={(v) => set({ workSec: v })} format={(v) => `${v}${t('sec')}`} />
            </Field>
            <Field label={t('rest')}>
              <Slider value={cfg.restSec} min={10} max={45} step={5} onChange={(v) => set({ restSec: v })} format={(v) => `${v}${t('sec')}`} />
            </Field>
          </div>
        )}
      </Card>
      <Card title={`${t('level')} & ${t('focus')}`}>
        <Field label={t('level')}>
          <Segmented value={cfg.level} onChange={(v) => set({ level: v })} options={([1, 2, 3, 4, 5] as const).map((v) => ({ value: v, label: t(`level${v}`) }))} />
        </Field>
        <Field label={t('pace')}>
          <Segmented value={cfg.pace} onChange={(v) => set({ pace: v })} options={([1, 2, 3, 4, 5] as const).map((v) => ({ value: v, label: t(`pace${v}`) }))} />
        </Field>
        <Field label={t('focus')}>
          <div className="genre-grid">
            {FITNESS_FOCUS.filter((f) => discipline === 'hiit' || f !== 'cardio').map((f) => (
              <button key={f} className={`chip ${cfg.focus === f ? 'on' : ''}`} onClick={() => set({ focus: f })}>
                {t(`f_${f}`)}
              </button>
            ))}
          </div>
        </Field>
      </Card>
      <Card title={t('voiceAudio')}>
        <AudioSettings instruction={cfg.instruction} onInstruction={(v) => set({ instruction: v })} />
      </Card>
      <Card className="sticky-preview">
        <Preview session={session} poolSize={poolSize} onStart={() => onStart(session)} onRegenerate={() => setSeed(newSeed())} />
      </Card>
    </div>
  );
}
