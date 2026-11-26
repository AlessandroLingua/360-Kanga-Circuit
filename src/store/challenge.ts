import { translate } from '../i18n';
import { getState, setState, type Challenge, type HistoryEntry } from './store';

export const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** 0 = Monday … 6 = Sunday */
export const weekdayMon = (d: Date) => (d.getDay() + 6) % 7;
export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** First date on or after today that falls on `startDay`. */
export function nextStart(startDay: number, from = new Date()) {
  const m = midnight(from);
  return addDays(m, (startDay - weekdayMon(m) + 7) % 7);
}

export function challengeProgress(ch: Challenge, history: HistoryEntry[], now = new Date()) {
  const start = new Date(ch.start);
  const bounds = Array.from({ length: ch.weeks + 1 }, (_, i) => addDays(start, i * 7).getTime());
  const counts = Array.from({ length: ch.weeks }, (_, i) => history.filter((h) => {
    const t = new Date(h.date).getTime();
    return t >= bounds[i] && t < bounds[i + 1];
  }).length);
  const t = now.getTime();
  const started = t >= bounds[0];
  const finished = t >= bounds[ch.weeks];
  const week = !started ? -1 : finished ? ch.weeks - 1 : bounds.findIndex((b) => b > t) - 1;
  const success = counts.every((c) => c >= ch.perWeek);
  // a past week that fell short ends the challenge
  const failed = counts.some((c, i) => (i < week || finished) && c < ch.perWeek);
  return { counts, week, started, finished, success, failed, end: new Date(bounds[ch.weeks] - 1) };
}

/** Close the active challenge once it is won or lost. */
export function settleChallenge(now = new Date()) {
  const s = getState();
  const ch = s.challenge.active;
  if (!ch) return;
  const p = challengeProgress(ch, s.history, now);
  if (!p.success && !p.failed) return;
  const done: Challenge = { ...ch, endedAt: (p.success ? now : p.end).toISOString(), result: p.success ? 'done' : 'missed' };
  setState((st) => ({ challenge: { active: null, past: [done, ...st.challenge.past].slice(0, 30) } }));
}

// ───────── practice reminders (delivered while the app is open) ─────────
async function notify(title: string, body: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(title, { body, icon: './icon.svg', tag: 'practice-reminder' }));
  } catch {
    /* fall back to the page notification */
  }
  try {
    new Notification(title, { body, icon: './icon.svg' });
  } catch {
    /* not supported (e.g. some mobile browsers without a service worker) */
  }
}

export function checkReminders(now = new Date()) {
  const s = getState();
  if (!s.reminders.enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = dayKey(now);
  const wd = weekdayMon(now);
  const due = s.reminders.items.filter((r) => r.time === hm && r.days.includes(wd) && s.reminders.lastFired?.[r.id] !== today);
  if (!due.length) return;
  setState((st) => ({ reminders: { ...st.reminders, lastFired: { ...st.reminders.lastFired, ...Object.fromEntries(due.map((r) => [r.id, today])) } } }));
  notify(translate(s.lang, 'appName'), translate(s.lang, 'reminderBody'));
}
