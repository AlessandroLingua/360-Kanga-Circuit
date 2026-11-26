/**
 * The part of the app state that follows the user across devices (Google Drive sync), and how two
 * copies are merged. Pure functions only, so they can be tested without a browser.
 *
 * Left out on purpose (device-local or transient): offline downloads, health permission, the old
 * server-sync config, the selected TTS voice, and which reminders already fired today.
 */
import type { AppState, Challenge, HistoryEntry } from './store';

export const PROFILE_VERSION = 1;

export interface SyncSettings {
  lang: AppState['lang'];
  weightKg: number;
  yoga: AppState['yoga'];
  nidra: AppState['nidra'];
  pilates: AppState['pilates'];
  hiit: AppState['hiit'];
  meditation: AppState['meditation'];
  audio: Omit<AppState['audio'], 'teacherIdx'>;
  likes: string[];
  dislikes: string[];
  goals: AppState['goals'];
  practice: AppState['practice'];
  reminders: { enabled: boolean; items: AppState['reminders']['items'] };
  figure: AppState['figure'];
  activeChallenge: Challenge | null;
}

export interface SyncProfile {
  v: number;
  app: 'kanga360';
  /** When the settings block last changed (the most recent copy wins). */
  settingsAt: number;
  settings: SyncSettings;
  /** Merged by id, never overwritten. */
  history: HistoryEntry[];
  pastChallenges: Challenge[];
}

export function settingsOf(s: AppState): SyncSettings {
  const { teacherIdx: _voice, ...audio } = s.audio;
  return {
    lang: s.lang,
    weightKg: s.weightKg,
    yoga: s.yoga,
    nidra: s.nidra,
    pilates: s.pilates,
    hiit: s.hiit,
    meditation: s.meditation,
    audio,
    likes: s.likes,
    dislikes: s.dislikes,
    goals: s.goals,
    practice: s.practice,
    reminders: { enabled: s.reminders.enabled, items: s.reminders.items },
    figure: s.figure,
    activeChallenge: s.challenge.active,
  };
}

/** Did a state change touch anything in the synced settings? */
export const settingsChanged = (a: AppState, b: AppState) => JSON.stringify(settingsOf(a)) !== JSON.stringify(settingsOf(b));

export function toProfile(s: AppState): SyncProfile {
  return { v: PROFILE_VERSION, app: 'kanga360', settingsAt: s.settingsAt, settings: settingsOf(s), history: s.history, pastChallenges: s.challenge.past };
}

/** Light shape check on a downloaded file; returns null when it is not a profile we understand. */
export function parseProfile(raw: unknown): SyncProfile | null {
  const p = raw as Partial<SyncProfile> | null;
  if (!p || typeof p !== 'object' || p.app !== 'kanga360' || p.v !== PROFILE_VERSION) return null;
  if (typeof p.settingsAt !== 'number' || !p.settings || typeof p.settings !== 'object') return null;
  if (!Array.isArray(p.history) || !Array.isArray(p.pastChallenges)) return null;
  return p as SyncProfile;
}

const unionById = <T extends { id: string }>(local: T[], remote: T[]) => {
  const m = new Map<string, T>();
  for (const x of remote) if (x && typeof x.id === 'string') m.set(x.id, x);
  for (const x of local) m.set(x.id, x); // same id on both sides: keep this device's copy
  return [...m.values()];
};

/**
 * Merge a downloaded profile into the local state.
 * Settings: the copy with the newer `settingsAt` wins as a whole. History and finished challenges:
 * union by id. An active challenge that the other device already closed is dropped.
 */
export function mergeProfile(local: AppState, remote: SyncProfile): AppState {
  const remoteWins = remote.settingsAt > local.settingsAt;
  const st = remoteWins ? remote.settings : settingsOf(local);
  const history = unionById(local.history, remote.history).sort((a, b) => b.date.localeCompare(a.date));
  const past = unionById(local.challenge.past, remote.pastChallenges)
    .sort((a, b) => (b.endedAt ?? b.start).localeCompare(a.endedAt ?? a.start))
    .slice(0, 30);
  const active = st.activeChallenge && !past.some((c) => c.id === st.activeChallenge!.id) ? st.activeChallenge : null;
  return {
    ...local,
    lang: st.lang,
    weightKg: st.weightKg,
    yoga: { ...local.yoga, ...st.yoga },
    nidra: { ...local.nidra, ...st.nidra },
    pilates: { ...local.pilates, ...st.pilates },
    hiit: { ...local.hiit, ...st.hiit },
    meditation: { ...local.meditation, ...st.meditation },
    audio: { ...local.audio, ...st.audio },
    likes: st.likes,
    dislikes: st.dislikes,
    goals: { ...local.goals, ...st.goals },
    practice: { ...local.practice, ...st.practice },
    reminders: { ...local.reminders, enabled: st.reminders.enabled, items: st.reminders.items },
    figure: st.figure,
    history,
    challenge: { active, past },
    settingsAt: Math.max(local.settingsAt, remote.settingsAt),
  };
}
