import { Card } from '../components/ui';
import { useLang, useT } from '../i18n';
import { periodStats, streaks, useStore } from '../store/store';

export type Route = 'home' | 'yoga' | 'pilates' | 'hiit' | 'meditation' | 'progress' | 'offline' | 'settings';

export function Home({ go }: { go: (r: Route) => void }) {
  const t = useT();
  const lang = useLang();
  const history = useStore((s) => s.history);
  const goals = useStore((s) => s.goals);
  const st = streaks(history);
  const ps = periodStats(history);
  const days = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(lang, { weekday: 'narrow' }));
  const maxDay = Math.max(goals.dailyMin, ...ps.weekDays);

  return (
    <div className="home">
      <header className="hero">
        <h1>{t('appName')}</h1>
        <p>{t('tagline')}</p>
      </header>

      <div className="home-stats">
        <Card>
          <div className="stat-big">🔥 {st.current} <small>{t('days')}</small></div>
          <div className="hint">{t('streak')}</div>
        </Card>
        <Card>
          <div className="stat-big">{ps.weekSessions}/{goals.weeklySessions}</div>
          <div className="hint">{t('thisWeek')} · {t('sessionsGoal')}</div>
          <div className="week-bars" aria-hidden>
            {ps.weekDays.map((m, i) => (
              <div key={i} className="bar-col">
                <div className="bar" style={{ height: `${(m / maxDay) * 100}%` }} />
                <span>{days[i]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <h2 className="section-title">{t('chooseDiscipline')}</h2>
      <div className="discipline-grid">
        {([
          ['yoga', '🧘', 'yogaDesc'],
          ['meditation', '🪷', 'meditationDesc'],
          ['pilates', '🤸', 'pilatesDesc'],
          ['hiit', '⚡', 'hiitDesc'],
        ] as const).map(([r, icon, desc]) => (
          <button key={r} className={`discipline d-${r}`} onClick={() => go(r)}>
            <span className="icon">{icon}</span>
            <strong>{t(r)}</strong>
            <small>{t(desc)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
