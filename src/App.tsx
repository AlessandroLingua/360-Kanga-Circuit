import { useEffect, useState } from 'react';
import type { Session } from './engine/types';
import { LangCtx, translate } from './i18n';
import { loadClipManifest } from './services/clips';
import { syncNow } from './services/sync';
import { useStore } from './store/store';
import { unlockAudio } from './audio/music';
import { unlockSpeech } from './audio/voice';
import { FitnessSetup } from './screens/FitnessSetup';
import { Home, type Route } from './screens/Home';
import { MeditationSetup } from './screens/MeditationSetup';
import { Offline } from './screens/Offline';
import { Player } from './screens/Player';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { Tv } from './screens/Tv';
import { Gallery } from './screens/Gallery';
import { YogaSetup } from './screens/YogaSetup';

const NAV: { r: Route; icon: string; mobile: boolean }[] = [
  { r: 'home', icon: '⌂', mobile: true },
  { r: 'yoga', icon: '🧘', mobile: true },
  { r: 'pilates', icon: '🤸', mobile: false },
  { r: 'hiit', icon: '⚡', mobile: false },
  { r: 'meditation', icon: '🪷', mobile: true },
  { r: 'progress', icon: '📈', mobile: true },
  { r: 'offline', icon: '⤓', mobile: false },
  { r: 'settings', icon: '⚙︎', mobile: true },
];

const routeFromHash = (): Route | 'tv' | 'gallery' => {
  const h = location.hash.slice(1);
  return (h === 'tv' || h === 'gallery' || NAV.some((n) => n.r === h) ? h : 'home') as Route | 'tv' | 'gallery';
};

export function App() {
  const lang = useStore((s) => s.lang);
  const [route, setRoute] = useState<Route | 'tv' | 'gallery'>(routeFromHash);
  const [session, setSessionRaw] = useState<Session | null>(null);
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
    return () => removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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
      <div className="shell">
        <nav className="sidenav">
          <div className="brand">◎ <span>Kanga 360</span></div>
          {NAV.map((n) => (
            <button key={n.r} className={route === n.r ? 'on' : ''} onClick={() => go(n.r)}>
              <span className="ni">{n.icon}</span>
              <span>{t(n.r)}</span>
            </button>
          ))}
        </nav>
        <main>
          {route !== 'home' && (
            <h1 className="page-title">
              {!NAV.find((n) => n.r === route)?.mobile && <button className="back" onClick={() => go('home')} aria-label={t('home')}>‹</button>}
              {t(route)}
            </h1>
          )}
          {route === 'home' && <Home go={go} />}
          {route === 'yoga' && <YogaSetup onStart={setSession} />}
          {route === 'pilates' && <FitnessSetup key="pilates" discipline="pilates" onStart={setSession} />}
          {route === 'hiit' && <FitnessSetup key="hiit" discipline="hiit" onStart={setSession} />}
          {route === 'meditation' && <MeditationSetup onStart={setSession} />}
          {route === 'progress' && <Progress />}
          {route === 'offline' && <Offline onStart={setSession} />}
          {route === 'settings' && <Settings />}
        </main>
        <nav className="bottomnav">
          {NAV.filter((n) => n.mobile).map((n) => (
            <button key={n.r} className={route === n.r ? 'on' : ''} onClick={() => go(n.r)}>
              <span className="ni">{n.icon}</span>
              <span>{t(n.r)}</span>
            </button>
          ))}
        </nav>
      </div>
    </LangCtx.Provider>
  );
}
