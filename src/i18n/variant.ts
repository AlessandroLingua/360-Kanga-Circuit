import type { Discipline, Lang, YogaStyle } from '../engine/types';
import { translate } from '.';
import { STYLE_LABEL, pickRow } from './labels';
import type { StrKey } from './strings';

/** Human label for a session variant (yoga style, meditation goal, fitness focus). */
export function variantLabel(discipline: Discipline, variant: string, lang: Lang) {
  if (discipline === 'yoga' && variant in STYLE_LABEL) return pickRow(STYLE_LABEL[variant as YogaStyle].name, lang);
  const key = (discipline === 'meditation' ? `m_${variant}` : `f_${variant}`) as StrKey;
  try {
    return translate(lang, key) ?? variant;
  } catch {
    return variant;
  }
}

const PHASE_KEYS: Record<string, StrKey> = { warmup: 'warmup', cooldown: 'cooldown', savasana: 'savasana', rest: 'rest', main: 'focus' };
export function phaseLabel(phase: string, lang: Lang) {
  if (phase.startsWith('round')) return `Round ${phase.slice(5)}`;
  const k = PHASE_KEYS[phase];
  return k ? translate(lang, k) : '';
}
