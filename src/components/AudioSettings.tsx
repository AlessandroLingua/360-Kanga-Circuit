import { useEffect, useState } from 'react';
import { listTeachers, speak, type Teacher } from '../audio/voice';
import type { InstructionLevel, MusicGenre } from '../engine/types';
import { useLang, useT } from '../i18n';
import { setState, useStore } from '../store/store';
import { Field, Segmented, Select, Slider } from './ui';

const GENRES: MusicGenre[] = ['ambient', 'pianoStrings', 'acoustic', 'altBeats', 'brainWaves', 'nature', 'silent', 'local'];

export function AudioSettings({
  instruction,
  onInstruction,
  sanskrit,
  onSanskrit,
}: {
  instruction?: InstructionLevel;
  onInstruction?: (v: InstructionLevel) => void;
  sanskrit?: boolean;
  onSanskrit?: (v: boolean) => void;
}) {
  const t = useT();
  const lang = useLang();
  const audio = useStore((s) => s.audio);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  useEffect(() => {
    listTeachers(lang).then(setTeachers);
  }, [lang]);
  const setAudio = (p: Partial<typeof audio>) => setState((s) => ({ audio: { ...s.audio, ...p } }));

  return (
    <>
      <Field label={t('teacher')}>
        <div className="teacher-row">
          <Select
            value={String(teachers.length ? audio.teacherIdx % teachers.length : 0)}
            options={teachers.map((tc, i) => ({ value: String(i), label: tc.label }))}
            onChange={(v) => setAudio({ teacherIdx: +v })}
          />
          <button className="ghost" aria-label="▶" onClick={() => teachers[audio.teacherIdx % teachers.length] && speak(t('tagline'), teachers[audio.teacherIdx % teachers.length], { interrupt: true })}>▶︎</button>
        </div>
        {teachers.length > 0 && teachers[0].voice === undefined && <div className="hint warn">{t('noVoice')}</div>}
        {teachers.length > 0 && teachers[0].voice !== undefined && (teachers[0].lowQuality || new Set(teachers.map((x) => x.voice)).size < 2) && <div className="hint">{t('voiceHint')}</div>}
      </Field>
      {instruction && onInstruction && (
        <Field label={t('instruction')}>
          <Segmented
            value={instruction}
            onChange={onInstruction}
            options={(['full', 'default', 'defaultSilence', 'least'] as const).map((v) => ({ value: v, label: t(`instr_${v}`) }))}
          />
        </Field>
      )}
      {onSanskrit && (
        <Field label={t('nomenclature')}>
          <Segmented value={sanskrit ? 'sa' : 'local'} onChange={(v) => onSanskrit(v === 'sa')} options={[{ value: 'local', label: t('localNames') }, { value: 'sa', label: t('sanskrit') }]} />
        </Field>
      )}
      <label className="toggle">
        <input type="checkbox" checked={audio.subtitles} onChange={(e) => setAudio({ subtitles: e.target.checked })} /> {t('subtitles')}
      </label>
      <Field label={t('music')} hint={t('adaptiveNote')}>
        <div className="genre-grid">
          {GENRES.map((g) => (
            <button key={g} className={`chip ${audio.genre === g ? 'on' : ''}`} onClick={() => setAudio({ genre: g })}>
              {t(`g_${g}`)}
            </button>
          ))}
        </div>
      </Field>
      <Field label={t('musicVolume')}>
        <Slider value={audio.musicVolume} min={0} max={1} step={0.05} onChange={(v) => setAudio({ musicVolume: v })} format={(v) => `${Math.round(v * 100)}%`} />
      </Field>
    </>
  );
}
