import { useEffect, useState } from 'react';
import type { Session } from './engine/types';
import { LangCtx, translate } from './i18n';
import { loadClipManifest } from './services/clips';
import { syncNow } from './services/sync';
import { useStore } from './store/store';
import { checkReminders, settleChallenge } from './store/challenge';
import { unlockAudio } from './audio/music';
import { unlockSpeech } from './audio/voice';
import { Icon, type IconName } from './components/kit';
import { Activity } from './screens/Activity';
import { ChallengeSheet } from './screens/ChallengeSheet';
import { Offline } from './screens/Offline';
import { Player } from './screens/Player';
import { Practice } from './screens/Practice';
import { Settings } from './screens/Settings';
import { Tv } from './screens/Tv';
import { Gallery } from './screens/Gallery';

export type Route = 'practice' | 'activity' | 'account';

const NAV: { r: Route; icon: IconName; label: 'tabPractice' | 'tabActivity' | 'tabAccount' }[] = [
  { r: 'practice', icon: 'home', label: 'tabPractice' },
  { r: 'activity', icon: 'trend', label: 'tabActivity' },
  { r: 'account', icon: 'user', label: 'tabAccount' },
];

// old links keep working
const LEGACY: Record<string, Route> = { home: 'practice', yoga: 'practice', pilates: 'practice', hiit: 'practice', meditation: 'practice', progress: 'activity', settings: 'account', offline: 'account' };

const routeFromHash = (): Route | 'tv' | 'gallery' => {
  const h = location.hash.slice(1);
  if (h === 'tv' || h === 'gallery') return h;
  if (NAV.some((n) => n.r === h)) return h as Route;
  return LEGACY[h] ?? 'practice';
};

export function App() {
  const lang = useStore((s) => s.lang);
  const history = useStore((s) => s.history);
  const [route, setRoute] = useState<Route | 'tv' | 'gallery'>(routeFromHash);
  const [session, setSessionRaw] = useState<Session | null>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const setSession = (s: Session | null) => {
    // runs inside the Start tap: unlock sound and speech for iOS/Safari
    if (s) {
      unlockAudio();
      unlockSpeech();
    }
    window.scrollTo(0, 0);
    setSessionRaw(s);
  };

  useEffect(() => {
    loadClipManifest();
    syncNow().catch(() => {});
    const onHash = () => setRoute(routeFromHash());
    addEventListener('hashchange', onHash);
    checkReminders();
    const tick = setInterval(() => checkReminders(), 20000);
    return () => {
      removeEventListener('hashchange', onHash);
      clearInterval(tick);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => settleChallenge(), [history]);

  const go = (r: Route) => {
    location.hash = r;
    setRoute(r);
    window.scrollTo(0, 0);
  };
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);

  if (route === 'tv') return <Tv />;
  if (route === 'gallery') return <LangCtx.Provider value={lang}><Gallery /></LangCtx.Provider>;

  if (session)
    return (
      <LangCtx.Provider value={lang}>
        <Player session={session} onExit={() => { setSession(null); syncNow().catch(() => {}); }} />
      </LangCtx.Provider>
    );

  return (
    <LangCtx.Provider value={lang}>
      <div className={`app route-${route}`}>
        <main>
          {route === 'practice' && <Practice onStart={setSession} openChallenge={() => setChallengeOpen(true)} />}
          {route === 'activity' && <Activity openChallenge={() => setChallengeOpen(true)} />}
          {route === 'account' && (
            <div className="account">
              <h1 className="page-title">{t('tabAccount')}</h1>
              <Settings />
              <Offline onStart={setSession} />
            </div>
          )}
        </main>
        <nav className="tabbar">
          {NAV.map((n) => (
            <button key={n.r} className={route === n.r ? 'on' : ''} onClick={() => go(n.r)} aria-current={route === n.r ? 'page' : undefined}>
              <Icon name={n.icon} size={20} />
              <span>{t(n.label)}</span>
            </button>
          ))}
        </nav>
        {challengeOpen && <ChallengeSheet onClose={() => setChallengeOpen(false)} />}
      </div>
    </LangCtx.Provider>
  );
}
