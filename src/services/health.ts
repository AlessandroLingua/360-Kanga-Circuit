/**
 * Health sync: Health Connect (Android, the successor of Google Fit) and Apple HealthKit (iOS)
 * through @capgo/capacitor-health. Not available on web/desktop.
 */
import { Capacitor } from '@capacitor/core';
import type { Session } from '../engine/types';
import { FITNESS_BY_ID } from '../engine/library/fitness';
import { YOGA_BY_ID } from '../engine/library/yoga';

export const healthSupported = () => Capacitor.isNativePlatform();

async function plugin() {
  const { Health } = await import('@capgo/capacitor-health');
  return Health;
}

export async function connectHealth(): Promise<boolean> {
  if (!healthSupported()) return false;
  try {
    const H = await plugin();
    const a = await H.isAvailable();
    if (!a.available) return false;
    await H.requestAuthorization({ read: [], write: ['calories', 'mindfulness'] });
    return true;
  } catch {
    return false;
  }
}

export async function logToHealth(s: Session, start: Date, end: Date, kcal: number) {
  if (!healthSupported()) return;
  try {
    const H = await plugin();
    const startDate = start.toISOString();
    const endDate = end.toISOString();
    if (kcal > 0) await H.saveSample({ dataType: 'calories', value: Math.round(kcal), startDate, endDate });
    if (s.discipline === 'meditation' || s.variant === 'nidra') {
      await H.saveSample({ dataType: 'mindfulness', value: Math.round((end.getTime() - start.getTime()) / 60000), startDate, endDate });
    }
  } catch (e) {
    console.warn('health sync failed', e);
  }
}

/** kcal ≈ Σ MET × kg × hours, using the seconds actually practised in each segment. */
export function estimateCalories(s: Session, secondsBySeg: number[], weightKg: number) {
  let kcal = 0;
  s.segments.forEach((seg, i) => {
    const d = secondsBySeg[i] ?? 0;
    if (!d) return;
    const m = seg.moveId ? (YOGA_BY_ID[seg.moveId] ?? FITNESS_BY_ID[seg.moveId]) : undefined;
    const met = seg.kind === 'rest' ? 3 : (m?.met ?? 1.3);
    kcal += met * weightKg * (d / 3600);
  });
  return Math.round(kcal);
}
