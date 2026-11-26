// Sanity check for the generative engine: every style/duration produces a session of the requested length.
import { generateYoga, DEFAULT_YOGA } from '../src/engine/yoga.ts';
import { generateNidra, generateMeditation, DEFAULT_MEDITATION } from '../src/engine/mind.ts';
import { generateFitness, DEFAULT_FITNESS, REGION_CAP, levelFromRegions } from '../src/engine/fitness.ts';
import { MIX_PRESETS, allowed } from '../src/engine/practice.ts';
import { getMove } from '../src/engine/animate.ts';

let fail = 0;
const check = (label: string, got: number, want: number, tol: number) => {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(44)} ${Math.round(got)}s / ${want}s`);
};
const styles = ['vinyasa', 'hatha', 'gentle', 'restorative', 'yin', 'ashtanga', 'sunSalutation'] as const;
for (const style of styles) for (const minutes of [5, 10, 30, 60, 90]) for (const level of [1, 3, 5] as const) {
  const s = generateYoga({ ...DEFAULT_YOGA, style, minutes, level, savasanaMin: minutes >= 30 ? 5 : 1 }, 1234 + minutes + level);
  check(`yoga ${style} ${minutes}m L${level} (${s.segments.length} seg)`, s.totalSeconds, minutes * 60, Math.max(30, minutes * 60 * 0.1));
}
for (const style of styles) for (let seed = 0; seed < 30; seed++) {
  const s = generateYoga({ ...DEFAULT_YOGA, style, minutes: 45, level: ((seed % 5) + 1) as 1 }, seed);
  const dup = s.segments.findIndex((x, i) => i > 0 && x.moveId === s.segments[i - 1].moveId && x.side === s.segments[i - 1].side);
  if (dup >= 0) { fail++; console.log(`FAIL consecutive duplicate ${style} seed ${seed}: ${s.segments[dup].moveId}`); }
  const tooLong = s.segments.find((x) => x.kind === 'move' && x.cues[0] && x.cues[0].text.split(' ').length * 0.42 > x.duration + 6);
  if (tooLong) { fail++; console.log(`FAIL cue longer than pose ${style} seed ${seed}: ${tooLong.title} ${tooLong.duration}s`); }
}
for (const style of ['vinyasa', 'hatha', 'gentle', 'yin'] as const) for (let seed = 0; seed < 20; seed++) {
  const s = generateYoga({ ...DEFAULT_YOGA, style, minutes: 60, level: 5 }, seed);
  const floor = s.segments.filter((x) => x.phase === 'floor' && !x.side && x.duration > 10).map((x) => x.moveId);
  if (new Set(floor).size < floor.length) { fail++; console.log(`FAIL repeated floor pose ${style} seed ${seed}: ${floor.join(',')}`); }
}
console.log('ok   no consecutive duplicates / cues fit / no repeats per phase');
const a = generateYoga({ ...DEFAULT_YOGA }, 42), b = generateYoga({ ...DEFAULT_YOGA }, 42), c = generateYoga({ ...DEFAULT_YOGA }, 43);
const sig = (x: typeof a) => x.segments.map((s) => s.moveId + s.side).join(',');
console.log(sig(a) === sig(b) ? 'ok   same seed → same session' : (fail++, 'FAIL determinism'));
console.log(sig(a) !== sig(c) ? 'ok   different seed → different session' : (fail++, 'FAIL variety'));
const dis = generateYoga({ ...DEFAULT_YOGA, dislikes: ['downDog', 'warrior2'] }, 7);
console.log(!dis.segments.some((s) => s.moveId === 'downDog' || s.moveId === 'warrior2') ? 'ok   dislikes excluded' : (fail++, 'FAIL dislikes'));
check('nidra 30m', generateNidra(30, false, 'it', 1).totalSeconds, 1800, 5);
for (const goal of ['sleep', 'stress', 'focus', 'breath', 'timer'] as const) check(`meditation ${goal} 10m`, generateMeditation({ ...DEFAULT_MEDITATION, goal }, 1).totalSeconds, 600, 5);
for (const d of ['pilates', 'hiit'] as const) for (const m of [10, 20, 45]) check(`${d} ${m}m`, generateFitness({ ...DEFAULT_FITNESS(d), minutes: m }, 9).totalSeconds, m * 60, m * 60 * 0.12);
for (const structure of ['circuits', 'progression', 'cycles', 'tabata', 'hiitYoga', 'stretch'] as const) for (const preset of MIX_PRESETS) for (const m of [5, 15, 30, 60]) {
  const s = generateFitness({ ...DEFAULT_FITNESS('hiit'), minutes: m, structure, mix: preset.mix, constraints: preset.constraints, level: 3 }, m + preset.id.length);
  check(`hiit ${structure} ${preset.id} ${m}m`, s.totalSeconds, m * 60, Math.max(45, m * 60 * 0.08));
  const bad = s.segments.find((x) => x.moveId && x.kind === 'move' && !allowed(getMove(x.moveId)!, preset.constraints));
  if (bad) { fail++; console.log(`FAIL constraint ${preset.id}: ${bad.moveId}`); }
}
for (const m of [10, 30, 60]) {
  const s = generateFitness({ ...DEFAULT_FITNESS('pilates'), minutes: m, structure: 'hiitYoga' }, m);
  check(`yoga+pilates ${m}m`, s.totalSeconds, m * 60, Math.max(45, m * 60 * 0.08));
  if (!s.segments.some((x) => x.phase === 'warmup' && getMove(x.moveId!)?.discipline === 'yoga')) { fail++; console.log(`FAIL yoga+pilates ${m}m has no yoga warm-up`); }
}
for (const [w, c] of [[0, 0], [2, 3], [5, 10]] as const) for (const m of [10, 30]) {
  const s = generateFitness({ ...DEFAULT_FITNESS('hiit'), minutes: m, structure: 'circuits', mix: MIX_PRESETS[0].mix, warmupMin: w, cooldownMin: c }, m + w);
  check(`hiit warm ${w}m cool ${c}m ${m}m`, s.totalSeconds, m * 60, Math.max(45, m * 60 * 0.08));
  const warm = s.segments.filter((x) => x.phase === 'warmup').reduce((a, x) => a + x.duration, 0);
  if (Math.abs(warm - Math.min(w * 60, m * 60 * 0.4)) > 45) { fail++; console.log(`FAIL warm-up ${w}m in ${m}m session lasted ${warm}s`); }
}
for (const lv of [0, 1, 2, 3]) {
  const regions = { upper: lv, lower: lv, core: lv };
  const s = generateFitness({ ...DEFAULT_FITNESS('hiit'), minutes: 20, regions, level: levelFromRegions(regions) }, lv);
  const tooHard = s.segments.find((x) => x.kind === 'move' && x.phase.startsWith('round') && getMove(x.moveId!)!.level > REGION_CAP[lv]);
  if (tooHard) { fail++; console.log(`FAIL region level ${lv}: ${tooHard.moveId}`); } else console.log(`ok   region level ${lv} respects cap`);
}
for (const step of [0, 2, 4]) for (const m of [15, 45]) {
  const y = generateYoga({ ...DEFAULT_YOGA, minutes: m, warmupStep: step, cooldownStep: 4 - step, holdStep: step }, m + step);
  check(`yoga steps ${step} ${m}m`, y.totalSeconds, m * 60, Math.max(30, m * 60 * 0.1));
  const p = generateFitness({ ...DEFAULT_FITNESS('pilates'), minutes: m, warmupStep: step, cooldownStep: 4 - step, holdStep: step, savasanaMin: step }, m + step);
  check(`pilates steps ${step} sav ${step}m ${m}m`, p.totalSeconds, m * 60, Math.max(45, m * 60 * 0.08));
  const sav = p.segments.filter((x) => x.phase === 'savasana').reduce((a, x) => a + x.duration, 0);
  if (Math.abs(sav - step * 60) > 1) { fail++; console.log(`FAIL pilates savasana ${step}m lasted ${sav}s`); }
}
for (const theme of ['any', 'none', 'anxiety', 'buddhism'] as const) for (const guidance of [0, 2, 4]) for (const longSilence of [undefined, 30, 600]) {
  const s = generateMeditation({ ...DEFAULT_MEDITATION, minutes: 15, theme, guidance, longSilence }, guidance);
  check(`meditation ${theme} g${guidance} long ${longSilence ?? 'auto'}`, s.totalSeconds, 900, 5);
  const cues = s.segments.flatMap((x) => x.cues).length;
  if (cues < 3) { fail++; console.log(`FAIL meditation ${theme} g${guidance} has only ${cues} cues`); }
}
const few = generateMeditation({ ...DEFAULT_MEDITATION, minutes: 15, guidance: 0, longSilence: 0 }, 1).segments.flatMap((x) => x.cues).length;
const many = generateMeditation({ ...DEFAULT_MEDITATION, minutes: 15, guidance: 4, longSilence: 0 }, 1).segments.flatMap((x) => x.cues).length;
console.log(many > few * 2 ? `ok   guidance proportion ${few} → ${many} cues` : (fail++, `FAIL guidance proportion ${few} → ${many}`));
console.log('\nsample vinyasa 20m:', generateYoga({ ...DEFAULT_YOGA, minutes: 20, lang: 'en' }, 5).segments.map((s) => `${s.title}${s.side ? '(' + s.side[0] + ')' : ''} ${Math.round(s.duration)}s`).join(' · '));
process.exit(fail ? 1 : 0);
