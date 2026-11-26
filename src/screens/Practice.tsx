import { useState } from 'react';
import { Dial, Icon, MoveThumb, Sheet, StepSlider } from '../components/kit';
import { Field, Slider } from '../components/ui';
import { moveName } from '../engine/cues';
import { HIIT, PILATES } from '../engine/library/fitness';
import { allowed, CATALOG, CATEGORIES, categoryOf, disciplineOf, MIX_GROUPS, MIX_PRESETS, moveGroups, POPULAR, PRACTICE_THUMB, PRACTICE_TYPES, practiceOfEntry, surpriseOfDay, usesBoosts, usesMix, usesTheme, type PracticeCategory, type PracticeType } from '../engine/practice';
import { newSeed } from '../engine/rng';
import type { Session } from '../engine/types';
import { fill, useLang, useT } from '../i18n';
import { STYLE_LABEL, pickRow } from '../i18n/labels';
import { BOOST_LABEL, MIX_GROUP_LABEL, MIX_LABEL, PRACTICE_LABEL, THEME_LABEL } from '../i18n/practice';
import { challengeProgress } from '../store/challenge';
import { getState, periodStats, setState, useStore } from '../store/store';
import { PracticeSettings, type SubSheet } from './PracticeSettings';
import { BoostSheet, ThemeSheet } from './PracticeSheets';
import { buildPractice, currentType, minutesOf, RANGE, selectPractice, setMinutes } from './practiceSession';

type Sheet = null | SubSheet | 'settings' | 'goal';


export function Practice({ onStart, openChallenge }: { onStart: (s: Session) => void; openChallenge: () => void }) {
  const t = useT();
  const lang = useLang();
  const state = useStore((s) => s);
  const type = currentType(state);
  const { mixId } = state.practice;
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sub, setSub] = useState<null | SubSheet>(null);
  const minutes = minutesOf(state, type);
  const [lo, hi] = RANGE[disciplineOf(type)];
  const ch = state.challenge.active;
  const prog = ch ? challengeProgress(ch, state.history) : null;

  // second selector: the Mix for workouts, the style or goal for yoga and meditation
  const cat = categoryOf(type);
  const med = state.meditation;
  const boosts = (cat === 'yoga' ? state.practice.boostsYoga : state.practice.boostsPilates) ?? [];
  const second: { label: string; value: string; open: Sheet } = usesMix(type)
    ? { label: t('mix'), value: mixId === 'custom' ? t('custom') : pickRow(MIX_LABEL[mixId] ?? MIX_LABEL.fullBody, lang), open: 'mix' }
    : usesBoosts(type)
      ? { label: t('boostArea'), value: boosts.length ? boosts.map((b) => pickRow(BOOST_LABEL[b], lang)).join(', ') : t('noneF'), open: 'boost' }
      : usesTheme(type)
        ? { label: t('theme'), value: pickRow(THEME_LABEL[state.practice.medTheme ?? 'any'], lang), open: 'theme' }
        : type === 'nidra'
          ? { label: t('style'), value: pickRow(STYLE_LABEL.nidra.name, lang), open: 'settings' }
          : type === 'breathwork'
            ? { label: t('pattern'), value: t(`p_${med.pattern}`), open: 'settings' }
            : type === 'medTimer'
              ? { label: t('bell'), value: med.bellMinutes ? `${med.bellMinutes} ${t('min')}` : t('noneF'), open: 'settings' }
              : cat === 'pilates'
                ? { label: t('level'), value: t(`level${state.pilates.level}`), open: 'settings' }
                : { label: t('pace'), value: t(`pace${state.hiit.pace}`), open: 'settings' };

  const typeName = pickRow(PRACTICE_LABEL[type].name, lang);
  const surprise = type === 'hiitAny' ? pickRow(PRACTICE_LABEL[surpriseOfDay()].name, lang) : '';

  return (
    <div className="practice">
      <div className="practice-bg" aria-hidden>
        <MoveThumb moveId={PRACTICE_THUMB[type]} className="hero-figure" />
      </div>
      <header className="practice-top">
        <button className="habit" onClick={openChallenge}>
          <img src="./icon.svg" alt="" width={36} height={36} />
          <span>
            <small>{ch ? t('yourChallenge') : t('makeHabit')}</small>
            <strong>
              {ch && prog
                ? prog.started
                  ? fill(t('weekCount'), { d: prog.counts[prog.week], n: ch.perWeek })
                  : fill(t('startsOn'), { day: new Date(ch.start).toLocaleDateString(lang, { weekday: 'long' }) })
                : t('startChallenge')}
            </strong>
          </span>
        </button>
        <button className="pill" onClick={() => setSheet('goal')}>{t('setGoal')}</button>
      </header>

      <Dial value={minutes} min={lo} max={hi} onChange={(v) => setMinutes(type, v)} unit={t('minutes')} />
      {surprise && <p className="surprise">{t('today')}: {surprise}</p>}

      <div className="practice-bottom">
        <div className="selectors">
          <button className="selector" onClick={() => setSheet('type')}>
            <small>{t('practiceType')}</small>
            <strong>{typeName}</strong>
          </button>
          <button className="selector" onClick={() => setSheet(second.open)}>
            <small>{second.label}</small>
            <strong>{second.value}</strong>
          </button>
          <button className="selector gear" onClick={() => setSheet('settings')} aria-label={t('practiceSettings')}>
            <Icon name="gear" size={22} />
          </button>
        </div>
        <button className="cta" onClick={() => onStart(buildPractice(getState(), newSeed()))}>{t('startPractice')}</button>
      </div>

      {sheet === 'settings' && <PracticeSettings onClose={() => setSheet(null)} onStart={onStart} openSub={setSub} />}
      {(sheet === 'boost' || sub === 'boost') && <BoostSheet onClose={() => (sub ? setSub(null) : setSheet(null))} />}
      {(sheet === 'theme' || sub === 'theme') && <ThemeSheet onClose={() => (sub ? setSub(null) : setSheet(null))} />}
      {sheet === 'goal' && <GoalSheet onClose={() => setSheet(null)} />}
      {/* type and mix open from the home screen or on top of the settings sheet */}
      {(sheet === 'type' || sub === 'type') && <TypeSheet onClose={() => (sub ? setSub(null) : setSheet(null))} />}
      {(sheet === 'mix' || sub === 'mix') && <MixSheet onClose={() => (sub ? setSub(null) : setSheet(null))} />}
    </div>
  );
}

// ───────── practice type ─────────
type Tab = 'search' | 'recent' | 'mostUsed' | PracticeCategory;

function TypeSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const current = useStore(currentType);
  const history = useStore((s) => s.history);
  const [sel, setSel] = useState(current);
  const [more, setMore] = useState<PracticeType | null>(null);
  const [query, setQuery] = useState('');

  // history newest first → unique practices; counts for "Most used"
  const done = history.map((h) => practiceOfEntry(h.discipline, h.variant));
  const recent = [...new Set([current, ...done])].slice(0, 8);
  const counts = new Map<PracticeType, number>();
  done.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1));
  const ranked = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
  const mostUsed = [...new Set([...ranked, ...POPULAR])].slice(0, Math.max(7, ranked.length));
  const [tab, setTab] = useState<Tab>(history.length ? 'recent' : categoryOf(current));

  const name = (p: PracticeType) => pickRow(PRACTICE_LABEL[p].name, lang);
  const q = query.trim().toLowerCase();
  const list: PracticeType[] =
    tab === 'search' ? PRACTICE_TYPES.filter((p) => !q || `${name(p)} ${pickRow(PRACTICE_LABEL[p].desc, lang)}`.toLowerCase().includes(q))
    : tab === 'recent' ? recent
    : tab === 'mostUsed' ? mostUsed
    : [...CATALOG[tab]];
  const tabs: { id: Tab; label: string }[] = [
    { id: 'recent', label: t('recent') },
    { id: 'mostUsed', label: t('mostUsed') },
    ...CATEGORIES.map((c) => ({ id: c as Tab, label: t(c) })),
  ];

  const save = () => {
    selectPractice(sel);
    onClose();
  };
  return (
    <Sheet
      title={t('selectPracticeType')}
      onClose={onClose}
      footer={<button className="cta" onClick={save}>{t('save')} {name(sel)}</button>}
    >
      <div className="cat-tabs" role="tablist">
        {tab === 'search' ? (
          <label className="cat-search">
            <Icon name="search" size={16} />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchPractice')} aria-label={t('searchPractice')} />
            <button onClick={() => (setQuery(''), setTab('recent'))} aria-label={t('close')}><Icon name="close" size={16} /></button>
          </label>
        ) : (
          <button className="cat-tab icon" onClick={() => setTab('search')} aria-label={t('searchPractice')}><Icon name="search" size={16} /></button>
        )}
        {tabs.map((x) => (
          <button key={x.id} ref={tab === x.id ? (el) => el?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' }) : undefined} role="tab" aria-selected={tab === x.id} className={`cat-tab ${tab === x.id ? 'on' : ''}`} onClick={() => setTab(x.id)}>{x.label}</button>
        ))}
      </div>
      {list.length === 0 && <p className="hint center">{t('noResults')}</p>}
      <ul className="type-list">
        {list.map((p) => {
          const L = PRACTICE_LABEL[p];
          return (
            <li key={p}>
              <div className={`type-item ${sel === p ? 'on' : ''}`} role="radio" aria-checked={sel === p} tabIndex={0} onClick={() => setSel(p)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(p))}>
                <MoveThumb moveId={PRACTICE_THUMB[p]} />
                <div className="type-text">
                  <div className="type-row">
                    <strong>{pickRow(L.name, lang)}</strong>
                    <button className="more-pill" onClick={(e) => (e.stopPropagation(), setMore(more === p ? null : p))} aria-expanded={more === p}>{t('learnMore')}</button>
                  </div>
                  <span>{pickRow(L.desc, lang)}</span>
                  {more === p && <p className="type-more">{pickRow(L.more, lang)}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

// ───────── mix ─────────
function MixSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const practice = useStore((s) => s.practice);
  const level = useStore((s) => s.hiit.level);
  const [draft, setDraft] = useState(practice);
  const [open, setOpen] = useState<string | null>(null);
  const lib = disciplineOf(currentType(getState())) === 'pilates' ? PILATES : HIIT;
  const save = () => {
    setState((s) => ({ practice: { ...s.practice, mixId: draft.mixId, mix: draft.mix, constraints: draft.constraints } }));
    onClose();
  };
  return (
    <Sheet title={t('chooseMix')} sub={t('mixSub')} onClose={onClose} footer={<button className="cta" onClick={save}>{t('save')}</button>}>
      <div className="mix-chips">
        {MIX_PRESETS.map((p) => (
          <button key={p.id} className={`mix-chip ${draft.mixId === p.id ? 'on' : ''}`} onClick={() => setDraft({ ...draft, mixId: p.id, mix: { ...p.mix }, constraints: { ...p.constraints } })}>
            {pickRow(MIX_LABEL[p.id], lang)}
          </button>
        ))}
      </div>
      <div className="mix-groups">
        {MIX_GROUPS.map((g) => {
          const moves = lib.filter((m) => m.level <= level && moveGroups(m)[g] >= 0.5 && allowed(m, draft.constraints));
          return (
            <div key={g} className={`mix-group ${draft.mix[g] === 0 ? 'off' : ''}`}>
              <div className="mix-row">
                <button className={`mix-label ${open === g ? 'open' : ''}`} onClick={() => setOpen(open === g ? null : g)} aria-expanded={open === g}>
                  <Icon name="down" size={18} />
                  {pickRow(MIX_GROUP_LABEL[g], lang)}
                </button>
                <StepSlider label={pickRow(MIX_GROUP_LABEL[g], lang)} value={draft.mix[g]} onChange={(v) => setDraft({ ...draft, mixId: 'custom', constraints: {}, mix: { ...draft.mix, [g]: v } })} />
              </div>
              {open === g && <p className="mix-moves">{moves.length ? moves.map((m) => moveName(m, { lang, sanskrit: false })).join(' · ') : '—'}</p>}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

// ───────── goals ─────────
function Ring({ value, max, label }: { value: number; max: number; label: string }) {
  const p = Math.min(1, max ? value / max : 0);
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring">
      <svg viewBox="0 0 80 80" width="92" height="92">
        <circle cx="40" cy="40" r={r} className="ring-bg" />
        <circle cx="40" cy="40" r={r} className="ring-fg" strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 40 40)" />
      </svg>
      <div className="ring-text"><strong>{Math.round(value)}</strong><small>/{max}</small></div>
      <div className="hint">{label}</div>
    </div>
  );
}

function GoalSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const history = useStore((s) => s.history);
  const goals = useStore((s) => s.goals);
  const ps = periodStats(history);
  const setGoal = (p: Partial<typeof goals>) => setState((s) => ({ goals: { ...s.goals, ...p } }));
  return (
    <Sheet title={t('goals')} onClose={onClose}>
      <div className="rings">
        <Ring value={ps.todayMin} max={goals.dailyMin} label={`${t('daily')} · ${t('min')}`} />
        <Ring value={ps.weekSessions} max={goals.weeklySessions} label={`${t('weekly')} · ${t('sessionsGoal')}`} />
        <Ring value={ps.monthMin} max={goals.monthlyMin} label={`${t('monthly')} · ${t('min')}`} />
      </div>
      <Field label={`${t('daily')} (${t('min')})`}>
        <Slider value={goals.dailyMin} min={5} max={120} step={5} onChange={(v) => setGoal({ dailyMin: v })} />
      </Field>
      <Field label={`${t('weekly')} (${t('sessionsGoal')})`}>
        <Slider value={goals.weeklySessions} min={1} max={14} onChange={(v) => setGoal({ weeklySessions: v })} />
      </Field>
      <Field label={`${t('monthly')} (${t('min')})`}>
        <Slider value={goals.monthlyMin} min={30} max={3000} step={30} onChange={(v) => setGoal({ monthlyMin: v })} />
      </Field>
    </Sheet>
  );
}
