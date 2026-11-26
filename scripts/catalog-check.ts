// Quick report on the extended HIIT catalog: size, duplicates, positions, filter tags and a few samples.
import { HIIT, PILATES } from '../src/engine/library/fitness.ts';
import { YOGA } from '../src/engine/library/yoga.ts';

const ids = HIIT.map((m) => m.id);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
console.log('moves', HIIT.length, 'duplicate ids', dup.length, dup.slice(0, 5));
const pos: Record<string, number> = {};
for (const m of HIIT) pos[m.position] = (pos[m.position] ?? 0) + 1;
console.log('positions', pos);
console.log('tags jump/knee/wrist', ['jump', 'knee', 'wrist'].map((t) => HIIT.filter((m) => m.tags?.includes(t as 'jump')).length));
for (const n of ['Bear Crawl', 'Glute Bridge March', 'Side Plank Hold', 'Neck Stretch', 'Tricep Dip', 'Star Jack Thrusts', 'Walkout to Pushups', 'Fire Hydrants', 'Robot Arms', 'Calf Raises', 'Sit Ups', 'Hundreds', 'Seated Twist']) {
  const m = HIIT.find((x) => x.name.en === n);
  console.log(n.padEnd(22), m ? `${m.position} L${m.level} i${m.intensity} ${m.focus.join('/')} frames:${m.frames.length} ${m.tags?.join(',') ?? ''}` : 'MISSING');
}
const bad = HIIT.filter((m) => !m.frames.length || m.frames.some((f) => f.length < 10));
console.log('moves with bad frames', bad.length);

const yx = YOGA.filter((m) => m.id.startsWith('yx_'));
const yids = YOGA.map((m) => m.id);
console.log('\nyoga poses', YOGA.length, 'new', yx.length, 'duplicate ids', yids.filter((x, i) => yids.indexOf(x) !== i).length);
const ypos: Record<string, number> = {};
for (const m of yx) ypos[m.position] = (ypos[m.position] ?? 0) + 1;
console.log('positions', ypos);
for (const m of yx.slice(0, 200).filter((_, i) => i % 12 === 0)) console.log(m.name.it.padEnd(46), m.position, `L${m.level}`, m.styles?.join(','), `frames:${m.frames.length}`);

const px = PILATES.filter((m) => m.id.startsWith('px_'));
const pids = PILATES.map((m) => m.id);
console.log('\npilates moves', PILATES.length, 'new', px.length, 'duplicate ids', pids.filter((x, i) => pids.indexOf(x) !== i).length);
for (const m of px.filter((_, i) => i % 10 === 0)) console.log(m.name.it.padEnd(46), m.position, `L${m.level}`, m.focus.join('/'), `frames:${m.frames.length}`);
