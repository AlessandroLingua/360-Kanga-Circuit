// Translations of the extended exercise catalogs.
import { HIIT_TR_1 } from './hiit1';
import { HIIT_TR_2 } from './hiit2';
import { HIIT_TR_3 } from './hiit3';
import { HIIT_TR_4 } from './hiit4';

/** English HIIT name → [it, es, fr, de, pt] */
export const HIIT_NAME_TR: Record<string, [string, string, string, string, string]> = { ...HIIT_TR_1, ...HIIT_TR_2, ...HIIT_TR_3, ...HIIT_TR_4 };
export { YOGA_NAME_TR } from './yoga';
export { PILATES_NAME_TR } from './pilates';

type Tr5 = [string, string, string, string, string];
/** Italian catalog name → L10n using a [en, es, fr, de, pt] table (lookup is case-insensitive). */
export function itName(it: string, table: Record<string, Tr5>): { en: string; it: string; es?: string; fr?: string; de?: string; pt?: string } {
  const tr = table[it.toLowerCase()];
  return tr ? { en: tr[0], it, es: tr[1], fr: tr[2], de: tr[3], pt: tr[4] } : { en: it, it };
}

import { CUES_1 } from './cues1';
import { CUES_2 } from './cues2';
import { CUES_3 } from './cues3';
import { CUES_4 } from './cues4';
/** English voice cue → [es, fr, de, pt] */
export const CUE_TR: Record<string, [string, string, string, string]> = { ...CUES_1, ...CUES_2, ...CUES_3, ...CUES_4 };

type Loc = { en: string; es?: string; fr?: string; de?: string; pt?: string };
/** Fills missing es/fr/de/pt on each move's cue and short cue (in place). */
export function translateCues<T extends { cue?: Loc; short?: Loc }>(moves: T[]): T[] {
  for (const m of moves) for (const v of [m.cue, m.short]) {
    const tr = v && CUE_TR[v.en];
    if (!v || !tr) continue;
    v.es ??= tr[0]; v.fr ??= tr[1]; v.de ??= tr[2]; v.pt ??= tr[3];
  }
  return moves;
}
