/**
 * Builds the list of sentences ("atoms") the voice can say, per language, for pre-recording with Gemini TTS.
 *
 *   npx tsx scripts/tts-corpus.ts            → writes scripts/tts/corpus-<lang>.json for all 6 languages
 *
 * Atoms start from move names, instructions and fixed phrases. Then every practice type is generated
 * with many settings and seeds; any part of a spoken cue that does not split into known atoms
 * (meditation lines, yoga flow intros…) is added as an atom too. The report shows how much of the
 * spoken text is covered.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { AtomIndex } from '../src/audio/atoms.ts';
import { HIIT, PILATES } from '../src/engine/library/fitness.ts';
import { YOGA } from '../src/engine/library/yoga.ts';
import { PHRASE_KEYS, ph, hasLang, tr } from '../src/engine/phrases.ts';
import { CATALOG } from '../src/engine/practice.ts';
import { breathWords } from '../src/engine/mind.ts';
import { MED_THEMES } from '../src/engine/themes.ts';
import type { InstructionLevel, Lang, Session } from '../src/engine/types.ts';
import { getState, setState } from '../src/store/store.ts';
import { buildPractice } from '../src/screens/practiceSession.ts';
import { STRINGS } from '../src/i18n/strings.ts';

const LANGS: Lang[] = ['it', 'en', 'es', 'fr', 'de', 'pt'];
const LANG_COL: Record<Lang, number> = { it: 0, en: 1, es: 2, fr: 3, de: 4, pt: 5 };
const LEVELS: InstructionLevel[] = ['full', 'default', 'defaultSilence', 'least'];
const SEEDS = 12;

const only = process.argv.find((a) => a.startsWith('--lang='))?.slice(7) as Lang | undefined;
mkdirSync('scripts/tts', { recursive: true });

function seedAtoms(L: Lang): Set<string> {
  const s = new Set<string>();
  const add = (x?: string) => x && x.trim() && s.add(x.trim());
  for (const m of [...HIIT, ...PILATES, ...YOGA]) {
    add(tr(m.name, L));
    if (m.sanskrit) add(m.sanskrit);
    if (hasLang(m.cue, L)) add(tr(m.cue, L));
    if (hasLang(m.short, L)) add(tr(m.short, L));
  }
  for (const k of PHRASE_KEYS) add(ph(k, L));
  for (const w of breathWords(L)) add(w);
  add(STRINGS.tagline[LANG_COL[L]]);
  return s;
}

function* sessions(L: Lang): Generator<Session> {
  const types = Object.values(CATALOG).flat();
  for (const type of types) {
    for (const instruction of LEVELS) {
      for (const sanskrit of [false, true]) {
        for (let seed = 1; seed <= SEEDS; seed++) {
          setState((s) => ({
            lang: L,
            practice: { ...s.practice, type, medTheme: MED_THEMES[seed % MED_THEMES.length] },
            yoga: { ...s.yoga, instruction, sanskrit, minutes: [10, 20, 45][seed % 3] },
            hiit: { ...s.hiit, instruction, minutes: [10, 20, 40][seed % 3] },
            pilates: { ...s.pilates, instruction, minutes: [10, 20, 40][seed % 3] },
            meditation: { ...s.meditation, minutes: [5, 15, 30][seed % 3], guidance: 4 },
            nidra: { ...s.nidra, minutes: 30, sleep: seed % 2 === 0 },
          }));
          yield buildPractice(getState(), seed * 7919);
        }
        if (type.startsWith('med') || type === 'breathwork' || type === 'nidra') break; // instruction/sanskrit don't apply
      }
      if (type.startsWith('med') || type === 'breathwork' || type === 'nidra') break;
    }
  }
}

for (const L of only ? [only] : LANGS) {
  const atoms = seedAtoms(L);
  const texts = new Set<string>();
  for (const s of sessions(L)) for (const seg of s.segments) for (const c of seg.cues) texts.add(c.text);

  // unknown spans become atoms; one more pass to measure coverage
  let idx = new AtomIndex(atoms);
  for (const t of texts) for (const p of idx.segment(t)) if (!p.known) atoms.add(p.text);
  idx = new AtomIndex(atoms);
  const used = new Set<string>();
  let pieces = 0;
  let unknown = 0;
  for (const t of texts) for (const p of idx.segment(t)) {
    pieces++;
    if (p.known) used.add(p.text);
    else unknown++;
  }
  // keep every seeded atom (a name may appear only for some settings) plus all used ones
  const list = [...atoms].sort((a, b) => a.localeCompare(b));
  const chars = list.reduce((n, a) => n + a.length, 0);
  writeFileSync(`scripts/tts/corpus-${L}.json`, JSON.stringify(list, null, 0));
  console.log(`${L}: ${list.length} atoms (${chars} chars), ${texts.size} distinct cues, ${pieces} pieces, ${unknown} still unknown, ${used.size} atoms used by sampled sessions`);
}
