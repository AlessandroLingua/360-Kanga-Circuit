import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MusicEngine, unlockAudio } from '../audio/music';
import { listTeachers, speak, type Teacher } from '../audio/voice';
import { Icon, RangeSlider, Sheet, type IconName } from '../components/kit';
import { Preview } from '../components/Preview';
import { autoPhaseSec, levelFromRegions, regionsFromLevel, type RegionLevels } from '../engine/fitness';
import { HIIT, PILATES } from '../engine/library/fitness';
import { autoLongSilence, type BreathPattern } from '../engine/mind';
import { categoryOf, surpriseOfDay, usesBoosts, usesMix, usesTheme } from '../engine/practice';
import { newSeed } from '../engine/rng';
import type { InstructionLevel, Level, MusicGenre, Pace, PhaseLength, Session } from '../engine/types';
import { fill, useLang, useT } from '../i18n';
import { pickRow } from '../i18n/labels';
import { BOOST_LABEL, MIX_LABEL, PRACTICE_LABEL, THEME_LABEL } from '../i18n/practice';
import type { StrKey } from '../i18n/strings';
import { setState, useStore, type AppState } from '../store/store';
import { ExercisesSheet } from './PracticeSheets';
import { buildPractice, currentType } from './practiceSession';

const GENRES: MusicGenre[] = ['ambient', 'pianoStrings', 'acoustic', 'lofi', 'altBeats', 'electronic', 'hipHop', 'rock', 'brainWaves', 'nature', 'local', 'silent'];
const ROMAN = ['0', 'I', 'II', 'III'];
const PHASE_TO_STEP: Record<PhaseLength, number> = { none: 0, standard: 2, extended: 3 };

export type SubSheet = 'type' | 'mix' | 'boost' | 'theme';
type Slice = 'hiit' | 'pilates' | 'yoga' | 'nidra' | 'meditation' | 'audio';
type Patch = { [K in Slice]?: Partial<AppState[K]> };

function Panel({ icon, title, sub, action, children }: { icon: IconName; title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel ps-panel">
      <div className="ps-head">
        <div>
          <h3><Icon name={icon} size={18} /> {title}</h3>
          {sub && <p>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button className="ps-row" onClick={onClick}>
      <span><small>{label}</small><strong>{value}</strong></span>
      <Icon name="right" size={20} />
    </button>
  );
}

function useMore({ text }: { text: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return { pill: <button className="more-pill" onClick={() => setOpen(!open)} aria-expanded={open}>{t('learnMore')}</button>, body: open ? <p className="ps-more">{text}</p> : null };
}

function Choices<T extends string | number>({ value, options, onChange, cols = 1 }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; cols?: 1 | 2 | 4 }) {
  return (
    <div className={`ps-choices ${cols === 2 ? 'two' : cols === 4 ? 'four' : ''}`} role="radiogroup">
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={value === o.v} className={`ps-choice ${value === o.v ? 'on' : ''}`} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

/** "Impostazioni di pratica": edits are kept as a patch and stored on Salva; the rows open sheets that save on their own. */
export function PracticeSettings({ onClose, onStart, openSub }: { onClose: () => void; onStart: (s: Session) => void; openSub: (s: SubSheet) => void }) {
  const t = useT();
  const lang = useLang();
  const state = useStore((s) => s);
  const type = currentType(state);
  const cat = categoryOf(type);
  const [sub, setSub] = useState<null | 'exercises' | 'preview'>(null);
  const [patch, setPatch] = useState<Patch>({});
  const view = <K extends Slice>(k: K) => ({ ...state[k], ...patch[k] }) as AppState[K];
  const set = <K extends Slice>(k: K, p: Partial<AppState[K]>) => setPatch((x) => ({ ...x, [k]: { ...x[k], ...p } }));
  const audio = view('audio');

  const save = () => {
    setState((s) => {
      const out: Partial<AppState> = {};
      for (const k of Object.keys(patch) as Slice[]) (out as Record<string, unknown>)[k] = { ...s[k], ...patch[k] };
      if (out.hiit?.regions) out.hiit = { ...out.hiit, level: levelFromRegions(out.hiit.regions) };
      return out;
    });
    onClose();
  };

  const boosts = (cat === 'yoga' ? state.practice.boostsYoga : state.practice.boostsPilates) ?? [];
  const yoga = cat === 'yoga';
  return (
    <>
      <Sheet title={t('practiceSettings')} onClose={onClose} className="ps-sheet" footer={<button className="cta" onClick={save}>{t('save')}</button>}>
        <div className="ps-rows">
          <Row label={t('practiceType')} value={pickRow(PRACTICE_LABEL[type].name, lang)} onClick={() => openSub('type')} />
          {usesMix(type) && <Row label={t('mix')} value={state.practice.mixId === 'custom' ? t('custom') : pickRow(MIX_LABEL[state.practice.mixId] ?? MIX_LABEL.fullBody, lang)} onClick={() => openSub('mix')} />}
          {usesBoosts(type) && <Row label={t('boostArea')} value={boosts.length ? boosts.map((b) => pickRow(BOOST_LABEL[b], lang)).join(', ') : t('noneF')} onClick={() => openSub('boost')} />}
          {usesTheme(type) && <Row label={t('theme')} value={pickRow(THEME_LABEL[state.practice.medTheme ?? 'any'], lang)} onClick={() => openSub('theme')} />}
          {cat !== 'meditation' && type !== 'nidra' && <Row label={t(yoga ? 'viewAllPoses' : 'viewAllExercises')} value={t(yoga ? 'likedDislikedPoses' : 'likedDisliked')} onClick={() => setSub('exercises')} />}
          {cat !== 'meditation' && <Row label={t('sequencePreview')} value={t('generatedNow')} onClick={() => setSub('preview')} />}
        </div>

        {cat === 'hiit' && <HiitBody type={type} audio={audio} setAudio={(p) => set('audio', p)} cfg={view('hiit')} set={(p) => set('hiit', p)} />}
        {(cat === 'pilates' || (yoga && type !== 'nidra')) && (
          <MatBody kind={yoga ? 'yoga' : 'pilates'} audio={audio} setAudio={(p) => set('audio', p)} cfg={yoga ? view('yoga') : view('pilates')} set={(p) => (yoga ? set('yoga', p) : set('pilates', p as Partial<AppState['pilates']>))} />
        )}
        {type === 'nidra' && (
          <>
            <VoicePanel audio={audio} setAudio={(p) => set('audio', p)} />
            <MusicPanel audio={audio} setAudio={(p) => set('audio', p)} />
            <Panel icon="moon" title={t('sleepMode')}>
              <label className="ps-check"><input type="checkbox" checked={view('nidra').sleep} onChange={(e) => set('nidra', { sleep: e.target.checked })} /> {t('sleepMode')}</label>
            </Panel>
          </>
        )}
        {cat === 'meditation' && <MeditationBody type={type} audio={audio} setAudio={(p) => set('audio', p)} cfg={view('meditation')} set={(p) => set('meditation', p)} />}
      </Sheet>
      {sub === 'exercises' && <ExercisesSheet onClose={() => setSub(null)} />}
      {sub === 'preview' && <PreviewSheet onClose={() => setSub(null)} onStart={onStart} />}
    </>
  );
}

type AudioProps = { audio: AppState['audio']; setAudio: (p: Partial<AppState['audio']>) => void };

// ───────── HIIT ─────────
function HiitBody({ type, cfg, set, audio, setAudio }: AudioProps & { type: string; cfg: AppState['hiit']; set: (p: Partial<AppState['hiit']>) => void }) {
  const t = useT();
  const lang = useLang();
  const st = type === 'hiitAny' ? surpriseOfDay() : type;
  const regions = cfg.regions ?? regionsFromLevel(cfg.level);
  const more = useMore({ text: t('explanationMore') });
  const sec = (v: number) => `${v} ${t('seconds')}`;
  const minLabel = (v: number) => (v === 0 ? t('none') : `${v.toLocaleString(lang)} ${t('minutesShort')}`);
  const autoWarm = Math.round(autoPhaseSec(cfg.minutes, 'warmup') / 30) / 2;
  const autoCool = Math.round(autoPhaseSec(cfg.minutes, 'cooldown') / 60);
  const INSTR: { v: InstructionLevel; label: string }[] = [
    { v: 'least', label: t('instrLeast') }, { v: 'defaultSilence', label: t('instrLess') }, { v: 'default', label: t('instrStd') }, { v: 'full', label: t('instrFull') },
  ];
  return (
    <>
      <MusicPanel audio={audio} setAudio={setAudio} />
      <Panel icon="list" title={t('explanation')} sub={t('explanationSub')} action={more.pill}>
        {more.body}
        <Choices value={cfg.instruction} options={INSTR.map((o) => ({ v: o.v, label: o.label }))} onChange={(v) => set({ instruction: v })} cols={4} />
        <label className="ps-check"><input type="checkbox" checked={audio.subtitles} onChange={(e) => setAudio({ subtitles: e.target.checked })} /> {t('subtitles')}</label>
      </Panel>
      {([['upper', 'arm', 'upperBody'], ['lower', 'legs', 'lowerBody'], ['core', 'core', 'coreBody']] as const).map(([g, icon, k]) => (
        <Panel key={g} icon={icon} title={t(k)}>
          <RangeSlider label={t(k)} value={regions[g]} min={0} max={3} step={1} onChange={(v) => set({ regions: { ...regions, [g]: v } as RegionLevels })} format={(v) => fill(t('levelN'), { n: ROMAN[v] })} minLabel={fill(t('levelN'), { n: ROMAN[0] })} maxLabel={fill(t('levelN'), { n: ROMAN[3] })} />
        </Panel>
      ))}
      <VoicePanel audio={audio} setAudio={setAudio} />
      <ModelPanel />
      {st !== 'stretch' && (
        <>
          <Panel icon="flame" title={t('warmup')} sub={t('warmupNote')}>
            <label className="ps-check"><input type="checkbox" checked={cfg.warmupMin === undefined} onChange={(e) => set({ warmupMin: e.target.checked ? undefined : autoWarm, warmup: 'standard' })} /> {t('autoPick')}</label>
            <RangeSlider label={t('warmup')} value={cfg.warmupMin ?? Math.min(5, autoWarm)} min={0} max={5} step={0.5} onChange={(v) => set({ warmupMin: v })} format={minLabel} minLabel={t('none')} maxLabel={minLabel(5)} disabled={cfg.warmupMin === undefined} />
          </Panel>
          <Panel icon="leaf" title={t('cooldown')} sub={t('cooldownNote')}>
            <label className="ps-check"><input type="checkbox" checked={cfg.cooldownMin === undefined} onChange={(e) => set({ cooldownMin: e.target.checked ? undefined : autoCool, cooldown: 'standard' })} /> {t('autoPick')}</label>
            <RangeSlider label={t('cooldown')} value={cfg.cooldownMin ?? Math.min(10, autoCool)} min={0} max={10} step={1} onChange={(v) => set({ cooldownMin: v })} format={minLabel} minLabel={t('none')} maxLabel={minLabel(10)} disabled={cfg.cooldownMin === undefined} />
          </Panel>
          {st === 'tabata' ? (
            <Panel icon="alarm" title={t('intervals')} sub={t('tabataFixed')}><span /></Panel>
          ) : (
            <>
              <Panel icon="alarm" title={t('intervals')} sub={t('intervalsQ')}>
                <RangeSlider label={t('intervals')} value={cfg.workSec} min={20} max={60} step={5} onChange={(v) => set({ workSec: v })} format={sec} minLabel={sec(20)} maxLabel={sec(60)} />
              </Panel>
              <Panel icon="alarm" title={t('rest')} sub={t('restQ')}>
                <RangeSlider label={t('rest')} value={cfg.restSec} min={5} max={30} step={5} onChange={(v) => set({ restSec: v })} format={sec} minLabel={sec(5)} maxLabel={sec(30)} />
              </Panel>
            </>
          )}
        </>
      )}
    </>
  );
}

// ───────── Yoga & Pilates ─────────
type MatCfg = {
  level: Level; pace: Pace; instruction: InstructionLevel; warmup: PhaseLength; cooldown: PhaseLength;
  warmupStep?: number; cooldownStep?: number; holdStep?: number; savasanaMin?: number; sanskrit?: boolean;
};
function MatBody({ kind, cfg, set, audio, setAudio }: AudioProps & { kind: 'yoga' | 'pilates'; cfg: MatCfg; set: (p: Partial<MatCfg>) => void }) {
  const t = useT();
  const lvl = useMore({ text: t('levelMore') });
  const ins = useMore({ text: t('instrMore2') });
  const PHASE: StrKey[] = ['stepNone', 'stepShort', 'stepDefault', 'stepExtended', 'stepSuper'];
  const HOLD: StrKey[] = ['holdShortest', 'holdShort', 'stepDefault', 'holdLong', 'holdLongest'];
  const step = (k: StrKey[], v: number) => t(k[v]);
  const mins = (v: number) => (v === 0 ? t('stepNone') : `${v} ${t('minutesShort')}`);
  return (
    <>
      <Panel icon="flag" title={t('level')} sub={t('levelSub')} action={lvl.pill}>
        {lvl.body}
        <Choices value={cfg.level} options={([1, 2, 3, 4, 5] as const).map((v) => ({ v, label: t(`level${v}`) }))} onChange={(v) => set({ level: v })} />
      </Panel>
      <VoicePanel audio={audio} setAudio={setAudio} />
      <ModelPanel />
      <MusicPanel audio={audio} setAudio={setAudio} />
      <Panel icon="list" title={t('instructions')} sub={t('explanationSub')} action={ins.pill}>
        {ins.body}
        <Choices value={cfg.instruction === 'full' ? 'full' : 'default'} options={[{ v: 'default', label: t('instrLess') }, { v: 'full', label: t('instrComplete') }]} onChange={(v) => set({ instruction: v as InstructionLevel })} cols={2} />
        <label className="ps-check"><input type="checkbox" checked={audio.subtitles} onChange={(e) => setAudio({ subtitles: e.target.checked })} /> {t('subtitles')}</label>
        {kind === 'yoga' && <label className="ps-check"><input type="checkbox" checked={!!cfg.sanskrit} onChange={(e) => set({ sanskrit: e.target.checked })} /> {t('nomenclature')}: {t('sanskrit')}</label>}
      </Panel>
      <Panel icon="flame" title={t('warmup')} sub={t(kind === 'yoga' ? 'warmupYogaNote' : 'warmupPilatesNote')}>
        <RangeSlider label={t('warmup')} value={cfg.warmupStep ?? PHASE_TO_STEP[cfg.warmup]} min={0} max={4} step={1} onChange={(v) => set({ warmupStep: v })} format={(v) => step(PHASE, v)} minLabel={t('stepNone')} maxLabel={t('stepSuper')} />
      </Panel>
      <Panel icon="leaf" title={t('cooldown')} sub={t('cooldownYogaNote')}>
        <RangeSlider label={t('cooldown')} value={cfg.cooldownStep ?? PHASE_TO_STEP[cfg.cooldown]} min={0} max={4} step={1} onChange={(v) => set({ cooldownStep: v })} format={(v) => step(PHASE, v)} minLabel={t('stepNone')} maxLabel={t('stepSuper')} />
      </Panel>
      <Panel icon="alarm" title={t(kind === 'yoga' ? 'holdYoga' : 'holdPilates')} sub={t(kind === 'yoga' ? 'holdYogaQ' : 'holdPilatesQ')}>
        <RangeSlider label={t('holdYoga')} value={cfg.holdStep ?? 2} min={0} max={4} step={1} onChange={(v) => set({ holdStep: v })} format={(v) => step(HOLD, v)} minLabel={t('holdShortest')} maxLabel={t('holdLongest')} />
      </Panel>
      <Panel icon="gauge" title={t('speed')} sub={t('speedQ')}>
        <RangeSlider label={t('speed')} value={cfg.pace} min={1} max={5} step={1} onChange={(v) => set({ pace: v as Pace })} format={(v) => (v === 3 ? t('stepDefault') : t(`pace${v as Pace}`))} minLabel={t('speedSlowest')} maxLabel={t('speedFastest')} />
      </Panel>
      <Panel icon="moon" title={t('savasana')} sub={t('savasanaNote')}>
        <RangeSlider label={t('savasana')} value={cfg.savasanaMin ?? 0} min={0} max={15} step={1} onChange={(v) => set({ savasanaMin: v })} format={mins} minLabel={t('stepNone')} maxLabel={mins(15)} />
      </Panel>
    </>
  );
}

// ───────── Meditation ─────────
function MeditationBody({ type, cfg, set, audio, setAudio }: AudioProps & { type: string; cfg: AppState['meditation']; set: (p: Partial<AppState['meditation']>) => void }) {
  const t = useT();
  const lang = useLang();
  const GUIDE: StrKey[] = ['guidanceLess', 'guidanceLow', 'guidanceNormal', 'guidanceHigh', 'guidanceMost'];
  const dur = (s: number) => (s < 60 ? `${s} ${t('seconds')}` : `${(s / 60).toLocaleString(lang)} ${t('minutesShort')}`);
  const auto = autoLongSilence(cfg.minutes);
  const breath = type === 'breathwork' || type === 'medBreathRest';
  return (
    <>
      <VoicePanel audio={audio} setAudio={setAudio} />
      <MusicPanel audio={audio} setAudio={setAudio} />
      {breath && (
        <Panel icon="leaf" title={t('pattern')}>
          <Choices<BreathPattern> value={cfg.pattern} options={(['box', '478', 'coherent', 'calm'] as const).map((v) => ({ v, label: t(`p_${v}`) }))} onChange={(v) => set({ pattern: v })} cols={2} />
        </Panel>
      )}
      {type === 'medTimer' && (
        <Panel icon="alarm" title={t('bell')}>
          <RangeSlider label={t('bell')} value={cfg.bellMinutes} min={0} max={15} step={1} onChange={(v) => set({ bellMinutes: v })} format={(v) => (v ? `${v} ${t('minutesShort')}` : t('noneF'))} minLabel={t('noneF')} maxLabel={`15 ${t('minutesShort')}`} />
        </Panel>
      )}
      {usesTheme(type as never) && (
        <>
          <Panel icon="list" title={t('guidanceProp')}>
            <RangeSlider label={t('guidanceProp')} value={cfg.guidance ?? 2} min={0} max={4} step={1} onChange={(v) => set({ guidance: v })} format={(v) => t(GUIDE[v])} minLabel={t('guidanceLess')} maxLabel={t('guidanceMost')} />
          </Panel>
          <Panel icon="alarm" title={t('longSilence')}>
            <label className="ps-check"><input type="checkbox" checked={cfg.longSilence === undefined} onChange={(e) => set({ longSilence: e.target.checked ? undefined : auto, guidance: cfg.guidance ?? 2 })} /> {t('autoPick')}</label>
            <RangeSlider label={t('longSilence')} value={cfg.longSilence ?? auto} min={30} max={900} step={30} onChange={(v) => set({ longSilence: v })} format={dur} minLabel={dur(30)} maxLabel={dur(900)} disabled={cfg.longSilence === undefined} />
          </Panel>
        </>
      )}
    </>
  );
}

// ───────── music with live preview ─────────
function MusicPanel({ audio, setAudio }: AudioProps) {
  const t = useT();
  const engine = useRef<MusicEngine | null>(null);
  const [playing, setPlaying] = useState<MusicGenre | null>(null);
  useEffect(() => () => engine.current?.dispose(), []);
  const play = async (g: MusicGenre) => {
    unlockAudio();
    if (!engine.current) engine.current = new MusicEngine();
    engine.current.setVolume(audio.musicVolume);
    await engine.current.start(g);
    engine.current.setIntensity(0.7);
    setPlaying(g);
  };
  const stop = () => {
    engine.current?.stop();
    setPlaying(null);
  };
  const pick = (g: MusicGenre) => {
    setAudio({ genre: g });
    if (playing) (g === 'silent' ? stop() : play(g));
  };
  return (
    <Panel icon="music" title={t('music')}>
      <p className="ps-now"><Icon name="music" size={14} /> {playing ? fill(t('playingNow'), { g: t(`g_${playing}`) }) : t('musicGenerated')}</p>
      <div className="ps-choices">
        {GENRES.map((g) => {
          const on = audio.genre === g;
          return (
            <div key={g} className={`ps-choice genre ${on ? 'on' : ''}`} role="radio" aria-checked={on} tabIndex={0} onClick={() => pick(g)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(g))}>
              {on && g !== 'silent' && <span className={`eq ${playing === g ? 'live' : ''}`} aria-hidden><i /><i /><i /></span>}
              <span>{t(`g_${g}`)}</span>
              {on && g !== 'silent' && (
                <span className="genre-ctrl">
                  <button className="mini-round dark" onClick={(e) => (e.stopPropagation(), playing === g ? stop() : play(g))} aria-label={playing === g ? t('stopPreview') : t('preview')}>
                    <Icon name={playing === g ? 'stop' : 'play'} size={12} />
                  </button>
                  <button className="mini-round" onClick={(e) => (e.stopPropagation(), play(g))} aria-label={t('newVariation')}>
                    <Icon name="skip" size={12} />
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>
      {audio.genre !== 'silent' && (
        <RangeSlider label={t('musicVolume')} value={Math.round(audio.musicVolume * 100)} min={0} max={100} step={5} onChange={(v) => { setAudio({ musicVolume: v / 100 }); engine.current?.setVolume(v / 100); }} format={(v) => `${v}%`} minLabel={t('musicVolume')} maxLabel="100%" />
      )}
    </Panel>
  );
}

// ───────── voice (the app animates a figure, so there is no video model to pick) ─────────
function VoicePanel({ audio, setAudio }: AudioProps) {
  const t = useT();
  const lang = useLang();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  useEffect(() => {
    listTeachers(lang).then(setTeachers);
  }, [lang]);
  if (!teachers.length) return null;
  const cur = audio.teacherIdx % teachers.length;
  const sample = (tc: Teacher) => speak(t('tagline'), tc, { interrupt: true });
  return (
    <Panel icon="mic" title={t('voice')} sub={t('voiceSub')}>
      {teachers[0].voice === undefined && <p className="hint warn">{t('noVoice')}</p>}
      <div className="ps-choices two">
        {teachers.slice(0, 6).map((tc, i) => (
          <div key={i} role="radio" aria-checked={cur === i} tabIndex={0} className={`ps-choice genre ${cur === i ? 'on' : ''}`} onClick={() => setAudio({ teacherIdx: i })} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setAudio({ teacherIdx: i }))}>
            {cur === i && <span className="eq" aria-hidden><i /><i /><i /></span>}
            <span className="voice-name">{tc.label.split(' · ')[0]}</span>
            {cur === i && (
              <span className="genre-ctrl">
                <button className="mini-round dark" onClick={(e) => (e.stopPropagation(), sample(tc))} aria-label={t('preview')}><Icon name="play" size={12} /></button>
              </span>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ───────── sequence preview (download for offline) ─────────
function PreviewSheet({ onClose, onStart }: { onClose: () => void; onStart: (s: Session) => void }) {
  const t = useT();
  const state = useStore((s) => s);
  const [seed, setSeed] = useState(newSeed);
  const session = useMemo(() => buildPractice(state, seed), [state, seed]);
  const d = categoryOf(currentType(state)) === 'pilates' ? 'pilates' : 'hiit';
  const pool = (d === 'hiit' ? HIIT : PILATES).filter((m) => m.level <= state[d].level && !state.dislikes.includes(m.id)).length;
  return (
    <Sheet title={t('sequencePreview')} onClose={onClose}>
      <Preview session={session} poolSize={pool} onStart={() => onStart(session)} onRegenerate={() => setSeed(newSeed())} />
    </Sheet>
  );
}


// ───────── instructor model (drawn figure): saved immediately ─────────
function ModelPanel() {
  const t = useT();
  const model = useStore((s) => s.figure ?? 'female');
  return (
    <Panel icon="user" title={t('figureModel')} sub={t('figureModelSub')}>
      <Choices value={model} options={[{ v: 'female', label: t('female') }, { v: 'male', label: t('male') }]} onChange={(v) => setState({ figure: v })} cols={2} />
    </Panel>
  );
}
