// Lists catalog moves that are missing a translation in any app language.
import { HIIT, PILATES } from '../src/engine/library/fitness.ts';
import { YOGA } from '../src/engine/library/yoga.ts';
const langs = ['en', 'it', 'es', 'fr', 'de', 'pt'] as const;
for (const [label, lib] of [['HIIT', HIIT], ['Yoga', YOGA], ['Pilates', PILATES]] as const) {
  const missingName = lib.filter((m) => langs.some((l) => !m.name[l]));
  const missingCue = lib.filter((m) => m.cue && langs.some((l) => !m.cue![l]));
  console.log(`${label}: ${lib.length} moves, names missing a language: ${missingName.length}, cues missing a language: ${missingCue.length}`);
  if (missingName.length) console.log('  e.g.', missingName.slice(0, 8).map((m) => m.name.en).join(' | '));
}

// Meditation & Yoga Nidra scripts: every line must differ from the English source in es/fr/de/pt.
import { generateMeditation, generateNidra, DEFAULT_MEDITATION, breathWords } from '../src/engine/mind.ts';
import { MED_THEMES } from '../src/engine/themes.ts';
const en = new Set<string>();
const collect = (s: { segments: { title: string; cues: { text: string }[] }[] }) => s.segments.forEach((g) => { en.add(g.title); g.cues.forEach((c) => en.add(c.text)); });
const runs = (lang: string) => {
  const out: ReturnType<typeof generateNidra>[] = [];
  for (let seed = 1; seed <= 30; seed++) {
    out.push(generateNidra(30, seed % 2 === 0, lang as never, seed));
    for (const goal of ['sleep', 'stress', 'focus', 'breath', 'timer'] as const)
      for (const theme of [...MED_THEMES, 'none'] as const) out.push(generateMeditation({ ...DEFAULT_MEDITATION, goal, theme, minutes: 30, guidance: 4, lang: lang as never }, seed));
  }
  return out;
};
runs('en').forEach(collect);
for (const lang of ['es', 'fr', 'de', 'pt']) {
  const left = new Set<string>();
  runs(lang).forEach((s) => s.segments.forEach((g) => [g.title, ...g.cues.map((c) => c.text)].forEach((t) => en.has(t) && !['Sankalpa', 'Timer', 'Visualisation'].includes(t) && left.add(t))));
  breathWords(lang as never).forEach((w) => ['Breathe in', 'Hold', 'Breathe out'].includes(w) && left.add(w));
  console.log(`Meditation ${lang}: untranslated lines: ${left.size}`, [...left].slice(0, 5).join(' | '));
}
