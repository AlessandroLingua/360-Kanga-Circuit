import { useState } from 'react';
import { Icon, Sheet, Switch } from '../components/kit';
import { fill, useLang, useT } from '../i18n';
import { addDays, challengeProgress, midnight, nextStart, weekdayMon } from '../store/challenge';
import { setState, useStore, type Reminder } from '../store/store';

const FREQ = [1, 2, 3, 4, 5, 6, 7];
const WEEKS = [2, 3, 4, 6, 8, 12];

export function ChallengeSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const active = useStore((s) => s.challenge.active);
  const history = useStore((s) => s.history);
  const [perWeek, setPerWeek] = useState(3);
  const [weeks, setWeeks] = useState(4);
  const [startDay, setStartDay] = useState(weekdayMon(new Date()));
  const [edit, setEdit] = useState<null | 'freq' | 'weeks' | 'start'>(null);

  const today = midnight(new Date());
  const dayName = (wd: number) => {
    const d = nextStart(wd);
    return d.getTime() === today.getTime() ? t('today').toLowerCase() : d.toLocaleDateString(lang, { weekday: 'long' });
  };
  const join = () => {
    const start = nextStart(startDay);
    setState((s) => ({ challenge: { active: { id: `ch-${Date.now()}`, perWeek, weeks, startDay, start: start.toISOString() }, past: s.challenge.past } }));
  };
  const leave = () => setState((s) => ({ challenge: { active: null, past: s.challenge.active ? [{ ...s.challenge.active, endedAt: new Date().toISOString(), result: 'left' as const }, ...s.challenge.past] : s.challenge.past } }));

  const p = active ? challengeProgress(active, history) : null;
  const rows: { key: 'freq' | 'weeks' | 'start'; label: string; value: string; opts: { v: number; l: string }[]; cur: number; set: (v: number) => void }[] = [
    { key: 'freq', label: t('frequency'), value: fill(t('perWeekN'), { n: active?.perWeek ?? perWeek }), opts: FREQ.map((v) => ({ v, l: String(v) })), cur: perWeek, set: setPerWeek },
    { key: 'weeks', label: t('duration'), value: fill(t('weeksN'), { n: active?.weeks ?? weeks }), opts: WEEKS.map((v) => ({ v, l: String(v) })), cur: weeks, set: setWeeks },
    {
      key: 'start',
      label: t('startDay'),
      value: active ? new Date(active.start).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'short' }) : dayName(startDay),
      opts: Array.from({ length: 7 }, (_, i) => {
        const wd = (weekdayMon(today) + i) % 7;
        return { v: wd, l: i === 0 ? t('today') : addDays(today, i).toLocaleDateString(lang, { weekday: 'short' }) };
      }),
      cur: startDay,
      set: setStartDay,
    },
  ];

  return (
    <Sheet title={t('challenges')} onClose={onClose} className="challenge-sheet">
      <div className="ch-hero">
        <Icon name="trophy" size={64} stroke={1.8} />
        <h2>{t('challengeTitle')}</h2>
        <p>{t('challengeDesc')}</p>
        <p className="ch-people"><Icon name="people" size={18} /> {t('challengeHint')}</p>
      </div>

      <section className="panel">
        {rows.map((r) => (
          <div key={r.key} className="ch-row-wrap">
            <div className="ch-row">
              <span className="ch-label">{r.label}</span>
              <span className="ch-value">{r.value}</span>
              {!active && (
                <button className="round-btn small" onClick={() => setEdit(edit === r.key ? null : r.key)} aria-label={`${t('edit')} ${r.label}`} aria-expanded={edit === r.key}>
                  <Icon name={edit === r.key ? 'check' : 'pencil'} size={16} />
                </button>
              )}
            </div>
            {!active && edit === r.key && (
              <div className="ch-opts">
                {r.opts.map((o) => (
                  <button key={o.v} className={`mix-chip ${r.cur === o.v ? 'on' : ''}`} onClick={() => r.set(o.v)}>{o.l}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {active && p ? (
          <>
            <div className="ch-progress">
              <span>{p.started ? fill(t('weekOf'), { i: p.week + 1, w: active.weeks }) : fill(t('startsOn'), { day: dayName(active.startDay) })}</span>
              {p.started && <strong>{fill(t('weekCount'), { d: p.counts[p.week], n: active.perWeek })}</strong>}
            </div>
            <button className="ghost-btn danger-text" onClick={leave}>{t('leaveChallenge')}</button>
          </>
        ) : (
          <button className="ghost-btn accent-text" onClick={join}>{t('join')}</button>
        )}
      </section>

      <Reminders />
    </Sheet>
  );
}

function Reminders() {
  const t = useT();
  const lang = useLang();
  const rem = useStore((s) => s.reminders);
  const [openDays, setOpenDays] = useState<string | null>(null);
  const [perm, setPerm] = useState(typeof Notification === 'undefined' ? 'denied' : Notification.permission);
  const upd = (items: Reminder[]) => setState((s) => ({ reminders: { ...s.reminders, items } }));
  const toggle = async (on: boolean) => {
    if (on && typeof Notification !== 'undefined' && Notification.permission === 'default') setPerm(await Notification.requestPermission());
    setState((s) => ({ reminders: { ...s.reminders, enabled: on } }));
  };
  const wd = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(lang, { weekday: 'short' }).replace('.', '').slice(0, 2));

  return (
    <>
      <h2 className="block-title center">{t('notifications')}</h2>
      <section className="panel">
        <div className="ch-row plain">
          <span className="ch-value left">{t('practiceReminders')}</span>
          <Switch on={rem.enabled} onChange={toggle} label={t('practiceReminders')} />
        </div>
        {rem.enabled && perm === 'denied' && <p className="hint warn">{t('notifBlocked')}</p>}
        {rem.enabled && (
          <>
            {rem.items.map((r) => (
              <div key={r.id} className="reminder">
                <div className="ch-row">
                  <Icon name="clock" size={18} />
                  <input type="time" value={r.time} onChange={(e) => upd(rem.items.map((x) => (x.id === r.id ? { ...x, time: e.target.value || x.time } : x)))} aria-label={t('practiceReminders')} />
                  <button className="days" onClick={() => setOpenDays(openDays === r.id ? null : r.id)} aria-expanded={openDays === r.id}>
                    {r.days.length ? [...r.days].sort().map((d) => wd[d]).join(', ') : '—'}
                  </button>
                  <button className="round-btn small" onClick={() => upd(rem.items.filter((x) => x.id !== r.id))} aria-label={t('delete')}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
                {openDays === r.id && (
                  <div className="ch-opts">
                    {wd.map((l, i) => (
                      <button key={i} className={`mix-chip ${r.days.includes(i) ? 'on' : ''}`} onClick={() => upd(rem.items.map((x) => (x.id === r.id ? { ...x, days: x.days.includes(i) ? x.days.filter((d) => d !== i) : [...x.days, i] } : x)))}>{l}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button className="add-row" onClick={() => upd([...rem.items, { id: `r${Date.now()}`, time: '18:00', days: [0, 1, 2, 3, 4, 5, 6] }])}>
              <span className="round-btn small"><Icon name="plus" size={16} /></span>
              {t('addReminder')}
            </button>
            <p className="hint">{t('notifNote')}</p>
          </>
        )}
      </section>
    </>
  );
}
