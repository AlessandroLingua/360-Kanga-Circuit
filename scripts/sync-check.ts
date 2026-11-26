// Checks for the Google Drive profile merge (src/store/profile.ts).
import { mergeProfile, parseProfile, settingsChanged, toProfile } from '../src/store/profile.ts';
import type { AppState, HistoryEntry } from '../src/store/store.ts';

let fail = 0;
const ok = (label: string, cond: boolean) => {
  if (!cond) fail++;
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
};

const h = (id: string, date: string): HistoryEntry => ({ id, date, discipline: 'yoga', variant: 'vinyasa', minutes: 20, kcal: 80, notes: '' });

const base = (over: Partial<AppState> = {}): AppState =>
  ({
    lang: 'it',
    weightKg: 65,
    yoga: { lang: 'it', minutes: 30 },
    nidra: { minutes: 20, sleep: false },
    pilates: { lang: 'it' },
    hiit: { lang: 'it' },
    meditation: { lang: 'it' },
    audio: { teacherIdx: 0, genre: 'ambient', musicVolume: 0.5, subtitles: true },
    likes: [],
    dislikes: [],
    history: [],
    goals: { dailyMin: 15, weeklySessions: 4, monthlyMin: 400 },
    downloads: [],
    health: { enabled: false },
    sync: { server: '', code: '' },
    practice: { type: 'hiitAny', mixId: 'x', mix: {}, constraints: {}, boostsYoga: [], boostsPilates: [], medTheme: 'any' },
    challenge: { active: null, past: [] },
    reminders: { enabled: false, items: [] },
    figure: 'female',
    settingsAt: 0,
    updatedAt: 0,
    ...over,
  }) as unknown as AppState;

// newer settings win, history is a union
{
  const local = base({ settingsAt: 100, figure: 'female', weightKg: 70, history: [h('a', '2026-01-01T10:00:00Z'), h('b', '2026-01-02T10:00:00Z')] });
  const remoteState = base({ settingsAt: 200, figure: 'male', lang: 'en', weightKg: 80, history: [h('b', '2026-01-02T10:00:00Z'), h('c', '2026-01-03T10:00:00Z')] });
  const m = mergeProfile(local, toProfile(remoteState));
  ok('remote newer → remote figure', m.figure === 'male');
  ok('remote newer → remote lang', m.lang === 'en');
  ok('remote newer → remote weight', m.weightKg === 80);
  ok('history union by id', m.history.map((x) => x.id).join() === 'c,b,a');
  ok('settingsAt is the max', m.settingsAt === 200);
}
{
  const local = base({ settingsAt: 300, figure: 'female', history: [h('a', '2026-01-01T10:00:00Z')] });
  const remoteState = base({ settingsAt: 200, figure: 'male', history: [h('c', '2026-01-03T10:00:00Z')] });
  const m = mergeProfile(local, toProfile(remoteState));
  ok('local newer → local figure kept', m.figure === 'female');
  ok('local newer → history still merged', m.history.length === 2);
}
// fresh device (defaults, settingsAt 0) takes everything from Drive
{
  const m = mergeProfile(base(), toProfile(base({ settingsAt: 5, goals: { dailyMin: 30, weeklySessions: 5, monthlyMin: 600 } })));
  ok('fresh device adopts remote goals', m.goals.dailyMin === 30);
}
// device-local fields are untouched
{
  const local = base({ settingsAt: 1, audio: { teacherIdx: 3, genre: 'ambient', musicVolume: 0.5, subtitles: true }, health: { enabled: true } });
  const remoteState = base({ settingsAt: 9, audio: { teacherIdx: 0, genre: 'piano' as never, musicVolume: 0.2, subtitles: false } });
  const m = mergeProfile(local, toProfile(remoteState));
  ok('voice stays per device', m.audio.teacherIdx === 3);
  ok('music genre synced', m.audio.genre === ('piano' as never));
  ok('health permission stays local', m.health.enabled === true);
  ok('profile has no downloads/sync/health', !('downloads' in toProfile(local)) && !('sync' in toProfile(local)) && !('health' in toProfile(local)));
}
// challenges: past union, active dropped if the other device closed it
{
  const ch = { id: 'ch1', perWeek: 3, weeks: 4, startDay: 0, start: '2026-01-05T00:00:00Z' };
  const local = base({ settingsAt: 50, challenge: { active: ch, past: [] } });
  const remoteState = base({ settingsAt: 40, challenge: { active: null, past: [{ ...ch, endedAt: '2026-02-01T00:00:00Z', result: 'done' }] } });
  const m = mergeProfile(local, toProfile(remoteState));
  ok('closed challenge comes in', m.challenge.past.length === 1 && m.challenge.past[0].result === 'done');
  ok('stale active challenge dropped', m.challenge.active === null);
}
// reminders sync, but not the per-device "already fired" marks
{
  const local = base({ settingsAt: 1, reminders: { enabled: false, items: [], lastFired: { r1: '2026-1-1' } } });
  const remoteState = base({ settingsAt: 2, reminders: { enabled: true, items: [{ id: 'r9', time: '07:30', days: [0, 2, 4] }] } });
  const m = mergeProfile(local, toProfile(remoteState));
  ok('reminders synced', m.reminders.enabled && m.reminders.items[0]?.id === 'r9');
  ok('lastFired stays local', m.reminders.lastFired?.r1 === '2026-1-1');
  ok('lastFired change is not a settings change', !settingsChanged(local, { ...local, reminders: { ...local.reminders, lastFired: { r1: 'x' } } }));
  ok('figure change is a settings change', settingsChanged(local, { ...local, figure: 'male' }));
}
// parsing
ok('parse rejects junk', parseProfile({ hello: 1 }) === null && parseProfile(null) === null);
ok('parse rejects future version', parseProfile({ ...toProfile(base()), v: 2 }) === null);
ok('parse round-trips', parseProfile(JSON.parse(JSON.stringify(toProfile(base())))) !== null);

process.exit(fail ? 1 : 0);
