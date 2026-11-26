import { useState } from 'react';
import { Icon, MoveThumb, Sheet } from '../components/kit';
import { moveName } from '../engine/cues';
import { HIIT, PILATES } from '../engine/library/fitness';
import { YOGA } from '../engine/library/yoga';
import { categoryOf, MAX_BOOSTS, PILATES_BOOSTS, YOGA_BOOSTS, YOGA_STYLE_OF } from '../engine/practice';
import { MED_THEMES, type MedThemeChoice } from '../engine/themes';
import { fill, useLang, useT } from '../i18n';
import { pickRow } from '../i18n/labels';
import { BOOST_LABEL, THEME_LABEL } from '../i18n/practice';
import { clearPref, dislikeMove, likeMove, setState, useStore } from '../store/store';
import { currentType } from './practiceSession';

function LearnMore({ text }: { text: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="learn">
      <button className="more-pill big" onClick={() => setOpen(!open)} aria-expanded={open}><Icon name="bolt2" size={12} /> {t('learnMore')}</button>
      {open && <p>{text}</p>}
    </div>
  );
}

// ───────── "Incrementa": up to two areas ─────────
export function BoostSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const type = useStore(currentType);
  const yoga = categoryOf(type) === 'yoga';
  const stored = useStore((s) => (yoga ? s.practice.boostsYoga : s.practice.boostsPilates) ?? []);
  const [sel, setSel] = useState<string[]>(stored);
  const groups: { title: string; icon: 'arm' | 'leaf'; ids: string[] }[] = yoga
    ? [{ title: t('strengthG'), icon: 'arm', ids: Object.keys(YOGA_BOOSTS.strength) }, { title: t('stretchG'), icon: 'leaf', ids: Object.keys(YOGA_BOOSTS.stretch) }]
    : [{ title: t('strengthG'), icon: 'arm', ids: Object.keys(PILATES_BOOSTS) }];
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-MAX_BOOSTS)));
  const save = () => {
    setState((s) => ({ practice: { ...s.practice, [yoga ? 'boostsYoga' : 'boostsPilates']: sel } }));
    onClose();
  };
  return (
    <Sheet title={fill(t('boostTitle'), { d: t(yoga ? 'boostWithYoga' : 'boostWithPilates') })} sub={t('boostSub')} onClose={onClose} footer={<button className="cta" onClick={save}>{t('save')}</button>}>
      <LearnMore text={t('boostMore')} />
      {groups.map((g) => (
        <section key={g.title} className="chip-group">
          <h3><Icon name={g.icon} size={18} /> {g.title}</h3>
          <div className="mix-chips flat">
            {g.ids.map((id) => {
              const k = sel.indexOf(id);
              return (
                <button key={id} className={`mix-chip ${k >= 0 ? 'on' : ''}`} onClick={() => toggle(id)} aria-pressed={k >= 0}>
                  {k >= 0 && <span className="chip-n">{k + 1}</span>}
                  {pickRow(BOOST_LABEL[id], lang)}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </Sheet>
  );
}

// ───────── meditation theme ─────────
export function ThemeSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const stored = useStore((s) => s.practice.medTheme ?? 'any');
  const [sel, setSel] = useState<MedThemeChoice>(stored);
  const all: MedThemeChoice[] = ['any', ...MED_THEMES, 'none'];
  const save = () => {
    setState((s) => ({ practice: { ...s.practice, medTheme: sel } }));
    onClose();
  };
  return (
    <Sheet title={t('chooseTheme')} sub={t('themeSub')} onClose={onClose} footer={<button className="cta" onClick={save}>{t('save')}</button>}>
      <LearnMore text={t('themeMore')} />
      <div className="mix-chips flat">
        {all.map((id) => (
          <button key={id} className={`mix-chip ${sel === id ? 'on' : ''}`} onClick={() => setSel(id)} aria-pressed={sel === id}>{pickRow(THEME_LABEL[id], lang)}</button>
        ))}
      </div>
    </Sheet>
  );
}

// ───────── exercises / poses in the practice, with like / dislike ─────────
export function ExercisesSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const type = useStore(currentType);
  const yogaLevel = useStore((s) => s.yoga.level);
  const likes = useStore((s) => s.likes);
  const dislikes = useStore((s) => s.dislikes);
  const [filter, setFilter] = useState<'search' | 'all' | 'liked' | 'disliked'>('all');
  const [q, setQ] = useState('');
  const cat = categoryOf(type);
  const yoga = cat === 'yoga';
  const style = yoga ? YOGA_STYLE_OF[type as keyof typeof YOGA_STYLE_OF] : null;
  const lib = yoga ? YOGA.filter((m) => m.id !== 'savasana' && m.level <= yogaLevel && (!style || style === 'nidra' || (m.styles ?? []).includes(style === 'sunSalutation' ? 'vinyasa' : style))) : cat === 'pilates' ? PILATES : HIIT;
  const name = (m: (typeof lib)[number]) => moveName(m, { lang, sanskrit: false });
  const list = [...lib]
    .sort((a, b) => name(a).localeCompare(name(b), lang))
    .filter((m) => (filter === 'liked' ? likes.includes(m.id) : filter === 'disliked' ? dislikes.includes(m.id) : filter === 'search' ? name(m).toLowerCase().includes(q.trim().toLowerCase()) : true));
  return (
    <Sheet title={t(yoga ? 'posesInPractice' : 'exercisesInPractice')} onClose={onClose} footer={<button className="cta" onClick={onClose}>{t('continue')}</button>}>
      <div className="cat-tabs">
        {filter === 'search' ? (
          <label className="cat-search">
            <Icon name="search" size={16} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchExercise')} aria-label={t('searchExercise')} />
            <button onClick={() => (setQ(''), setFilter('all'))} aria-label={t('close')}><Icon name="close" size={16} /></button>
          </label>
        ) : (
          <button className="cat-tab icon" onClick={() => setFilter('search')} aria-label={t('searchExercise')}><Icon name="search" size={16} /></button>
        )}
        {(['all', 'liked', 'disliked'] as const).map((f) => (
          <button key={f} className={`cat-tab ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{t(f === 'all' ? 'allFem' : f === 'liked' ? 'likedFem' : 'dislikedFem')}</button>
        ))}
      </div>
      {list.length === 0 && <p className="hint center">{filter === 'search' ? t('noResults') : t('noPrefs')}</p>}
      <ul className="ex-list">
        {list.map((m) => {
          const liked = likes.includes(m.id);
          const bad = dislikes.includes(m.id);
          return (
            <li key={m.id} className={bad ? 'bad' : ''}>
              <MoveThumb moveId={m.id} />
              <div className="ex-body">
                <strong>{name(m)}</strong>
                <div className="ex-actions">
                  <button className={`mini-round big ${liked ? 'liked' : ''}`} onClick={() => (liked ? clearPref(m.id) : likeMove(m.id))} aria-pressed={liked} aria-label={t('like')}><Icon name="thumbUp" size={14} /></button>
                  <button className={`mini-round big ${bad ? 'banned' : ''}`} onClick={() => (bad ? clearPref(m.id) : dislikeMove(m.id))} aria-pressed={bad} aria-label={t('dislike')}><Icon name="thumbDown" size={14} /></button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
