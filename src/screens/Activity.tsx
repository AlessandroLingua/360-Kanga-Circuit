import { useState } from 'react';
import { Icon } from '../components/kit';
import { fill, useLang, useT } from '../i18n';
import { variantLabel } from '../i18n/variant';
import { addDays, challengeProgress, dayKey, midnight, weekdayMon } from '../store/challenge';
import { useStore, type Challenge, type HistoryEntry } from '../store/store';

type Period = 'all' | 'year' | 'month';
const PERIODS: Period[] = ['all', 'year', 'month'];

export function Activity({ openChallenge }: { openChallenge: () => void }) {
  const t = useT();
  const [tab, setTab] = useState<'dash' | 'history'>('dash');
  return (
    <div className="activity">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'dash'} className={tab === 'dash' ? 'on' : ''} onClick={() => setTab('dash')}>{t('dashboard')}</button>
        <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>{t('practiceHistory')}</button>
      </div>
      {tab === 'dash' ? <Dashboard openChallenge={openChallenge} /> : <History />}
    </div>
  );
}

function inPeriod(h: HistoryEntry, p: Period, now = new Date()) {
  const d = new Date(h.date);
  if (p === 'year') return d.getFullYear() === now.getFullYear();
  if (p === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  return true;
}

function StatCard({ icon, value, label, period, onPeriod }: { icon: 'bolt' | 'timer'; value: string; label: string; period: Period; onPeriod: () => void }) {
  const t = useT();
  const pl = { all: t('allTime'), year: t('thisYear'), month: t('thisMonth') }[period];
  return (
    <div className="stat-card">
      <button className="stat-more" onClick={onPeriod} aria-label={`${t('period')}: ${pl}`}><Icon name="dots" size={18} /></button>
      <Icon name={icon} size={22} />
      <strong>{value}</strong>
      <span>{label}</span>
      {period !== 'all' && <small>{pl}</small>}
    </div>
  );
}

function Dashboard({ openChallenge }: { openChallenge: () => void }) {
  const t = useT();
  const history = useStore((s) => s.history);
  const challenge = useStore((s) => s.challenge);
  const [pCount, setPCount] = useState<Period>('all');
  const [pTime, setPTime] = useState<Period>('all');
  const next = (p: Period) => PERIODS[(PERIODS.indexOf(p) + 1) % PERIODS.length];
  const count = history.filter((h) => inPeriod(h, pCount)).length;
  const mins = history.filter((h) => inPeriod(h, pTime)).reduce((a, h) => a + h.minutes, 0);
  const time = mins >= 60 ? `${Math.round(mins / 60)} ${t('hoursShort')}` : `${Math.round(mins)} ${t('min')}`;

  return (
    <>
      <h2 className="block-title">{t('yourData')}</h2>
      <div className="stat-row">
        <StatCard icon="bolt" value={String(count)} label={t('practicesDone')} period={pCount} onPeriod={() => setPCount(next(pCount))} />
        <StatCard icon="timer" value={time} label={t('totalTime')} period={pTime} onPeriod={() => setPTime(next(pTime))} />
      </div>
      <Calendar history={history} />

      <h2 className="block-title">{t('challenges')}</h2>
      <div className="challenge-list">
        {challenge.active ? <ChallengeCard ch={challenge.active} history={history} onClick={openChallenge} /> : (
          <button className="challenge-card add" onClick={openChallenge}>
            <span className="flag"><Icon name="plus" size={26} /></span>
            <span><small>{t('makeHabit')}</small><strong>{t('startChallenge')}</strong></span>
          </button>
        )}
        {challenge.past.filter((c) => c.result !== 'left').map((c) => <ChallengeCard key={c.id} ch={c} history={history} />)}
      </div>
    </>
  );
}

function ChallengeCard({ ch, history, onClick }: { ch: Challenge; history: HistoryEntry[]; onClick?: () => void }) {
  const t = useT();
  const lang = useLang();
  const fmt = (d: Date) => d.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
  const p = challengeProgress(ch, history);
  const start = new Date(ch.start);
  const end = addDays(start, ch.weeks * 7 - 1);
  const status = ch.result === 'done'
    ? `${t('completedOn')} ${fmt(start)} – ${fmt(new Date(ch.endedAt ?? end))}`
    : ch.result === 'missed'
      ? `${t('notCompleted')} · ${fmt(start)} – ${fmt(end)}`
      : p.started
        ? `${t('inProgress')} · ${fill(t('weekOf'), { i: p.week + 1, w: ch.weeks })}`
        : fill(t('startsOn'), { day: start.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'short' }) });
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`challenge-card ${ch.result ?? 'active'}`} onClick={onClick}>
      <span className="flag"><Icon name={ch.result === 'done' ? 'trophy' : 'flag'} size={26} /></span>
      <span className="cc-text">
        <small>{status}</small>
        <strong>{fill(t('challengeLabel'), { n: ch.perWeek, w: ch.weeks })}</strong>
        {!ch.result && (
          <span className="weeks-bar" aria-hidden>
            {p.counts.map((c, i) => <i key={i} className={c >= ch.perWeek ? 'ok' : i === p.week ? 'now' : ''} style={{ ['--f' as string]: Math.min(1, c / ch.perWeek) }} />)}
          </span>
        )}
      </span>
    </Tag>
  );
}

function Calendar({ history }: { history: HistoryEntry[] }) {
  const t = useT();
  const lang = useLang();
  const today = midnight(new Date());
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [sel, setSel] = useState<string | null>(null);
  const byDay = new Map<string, HistoryEntry[]>();
  for (const h of history) {
    const k = dayKey(new Date(h.date));
    byDay.set(k, [...(byDay.get(k) ?? []), h]);
  }
  const lead = weekdayMon(month);
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const heads = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(lang, { weekday: 'short' }).replace('.', '').slice(0, 2));
  const shift = (n: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
    setSel(null);
  };
  const selList = sel ? byDay.get(sel) ?? [] : [];

  return (
    <section className="calendar">
      <div className="cal-head">
        <h3>{month.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}</h3>
        <div className="cal-nav">
          <button className="round-btn" onClick={() => shift(-1)} aria-label={t('prevMonth')}><Icon name="left" /></button>
          <button className="round-btn" onClick={() => shift(1)} aria-label={t('nextMonth')}><Icon name="right" /></button>
        </div>
      </div>
      <div className="cal-grid">
        {heads.map((h, i) => <span key={i} className="cal-wd">{h}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const k = dayKey(d);
          const done = byDay.has(k);
          const cls = ['cal-day', done && 'done', d.getTime() === today.getTime() && 'today', d > today && 'future', sel === k && 'sel'].filter(Boolean).join(' ');
          return (
            <button key={i} className={cls} onClick={() => setSel(sel === k ? null : k)} aria-pressed={sel === k} aria-label={d.toLocaleDateString(lang, { day: 'numeric', month: 'long' })}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
      {sel && (
        <div className="cal-detail">
          {selList.length ? selList.map((h) => (
            <div key={h.id} className="cal-entry">
              <strong>{t(h.discipline)} · {variantLabel(h.discipline, h.variant, lang)}</strong>
              <span>{h.minutes} {t('min')} · {h.kcal} {t('calories')}</span>
            </div>
          )) : <p className="hint">{t('noPracticeDay')}</p>}
        </div>
      )}
    </section>
  );
}

function History() {
  const t = useT();
  const lang = useLang();
  const history = useStore((s) => s.history);
  if (!history.length) return <p className="hint center empty">{t('noSessions')}</p>;
  return (
    <ul className="history">
      {history.map((h) => (
        <li key={h.id}>
          <div className="h-date">
            <strong>{new Date(h.date).getDate()}</strong>
            <small>{new Date(h.date).toLocaleDateString(lang, { month: 'short' })}</small>
          </div>
          <div className="h-body">
            <strong>{t(h.discipline)} · {variantLabel(h.discipline, h.variant, lang)}</strong>
            <span>{new Date(h.date).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })} · {h.minutes} {t('min')} · {h.kcal} {t('calories')}</span>
            {h.notes && <p>{h.notes}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
