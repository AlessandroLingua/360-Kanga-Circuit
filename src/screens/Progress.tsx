import { Card, Field, Slider } from '../components/ui';
import { useLang, useT } from '../i18n';
import { variantLabel } from '../i18n/variant';
import { periodStats, setState, streaks, useStore } from '../store/store';

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

export function Progress() {
  const t = useT();
  const lang = useLang();
  const history = useStore((s) => s.history);
  const goals = useStore((s) => s.goals);
  const st = streaks(history);
  const ps = periodStats(history);
  const setGoal = (p: Partial<typeof goals>) => setState((s) => ({ goals: { ...s.goals, ...p } }));

  return (
    <div className="setup">
      <Card title={t('goals')}>
        <div className="rings">
          <Ring value={ps.todayMin} max={goals.dailyMin} label={`${t('daily')} · ${t('min')}`} />
          <Ring value={ps.weekSessions} max={goals.weeklySessions} label={`${t('weekly')} · ${t('sessionsGoal')}`} />
          <Ring value={ps.monthMin} max={goals.monthlyMin} label={`${t('monthly')} · ${t('min')}`} />
        </div>
        <div className="three">
          <Field label={`${t('daily')} (${t('min')})`}>
            <Slider value={goals.dailyMin} min={5} max={120} step={5} onChange={(v) => setGoal({ dailyMin: v })} />
          </Field>
          <Field label={`${t('weekly')} (${t('sessionsGoal')})`}>
            <Slider value={goals.weeklySessions} min={1} max={14} onChange={(v) => setGoal({ weeklySessions: v })} />
          </Field>
          <Field label={`${t('monthly')} (${t('min')})`}>
            <Slider value={goals.monthlyMin} min={30} max={3000} step={30} onChange={(v) => setGoal({ monthlyMin: v })} />
          </Field>
        </div>
      </Card>
      <div className="home-stats">
        <Card><div className="stat-big">🔥 {st.current}</div><div className="hint">{t('currentStreak')}</div></Card>
        <Card><div className="stat-big">🏆 {st.best}</div><div className="hint">{t('bestStreak')}</div></Card>
        <Card><div className="stat-big">{Math.round(ps.totalMin)}</div><div className="hint">{t('totalTime')} ({t('min')})</div></Card>
        <Card><div className="stat-big">{ps.totalKcal}</div><div className="hint">{t('calories')}</div></Card>
      </div>
      <Card title={t('journal')}>
        {history.length === 0 ? (
          <p className="hint">{t('noSessions')}</p>
        ) : (
          <ul className="journal">
            {history.map((h) => (
              <li key={h.id}>
                <div className="j-head">
                  <strong>{t(h.discipline)} · {variantLabel(h.discipline, h.variant, lang)}</strong>
                  <span>{new Date(h.date).toLocaleString()}</span>
                </div>
                <div className="hint">{h.minutes} {t('min')} · {h.kcal} {t('calories')}</div>
                {h.notes && <p>{h.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
