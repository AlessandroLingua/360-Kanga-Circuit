/**
 * Generates the music library with Google Lyria (Gemini API, paid: about $0.08 per track).
 *
 *   npx tsx scripts/music-generate.ts --plan              → prints the planned tracks and cost, records nothing
 *   npx tsx scripts/music-generate.ts [--genre=ambient] [--limit=10] [--concurrency=3]
 *
 * Every track is instrumental and comes from its own prompt (genre × mood × instruments × tempo),
 * so the library is varied. Tracks are loudness-normalised so genres sit at the same volume under
 * the voice. Output: media/music/<genre>/<id>.mp3 and media/music/library.json (copy the folder
 * to the website: kanga-dev.it/kanga-circuit-360/music, see VITE_MUSIC_BASE in .env), which the app
 * reads. Already generated tracks are skipped, so the script can be re-run safely.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const flag = (k: string) => process.argv.includes(`--${k}`);

type Energy = 'low' | 'mid' | 'high';
interface Spec {
  genre: string;
  energy: Energy;
  bpm: number;
  prompt: string;
}

/** Per genre: style, then one entry per track [energy, bpm, mood + instruments]. */
const PLAN: Record<string, { style: string; tracks: [Energy, number, string][] }> = {
  ambient: {
    style: 'ambient soundscape for yoga and meditation',
    tracks: [
      ['low', 60, 'weightless evolving synth pads, distant shimmer, deep calm'],
      ['low', 62, 'warm analog drones with slow filter sweeps, floating and safe'],
      ['low', 64, 'glassy textures and soft bells, like dawn light over water'],
      ['low', 58, 'deep cinematic pads with subtle choir-like tones, spacious'],
      ['low', 66, 'gentle granular textures and soft piano notes, introspective'],
      ['low', 60, 'airy pads with soft wind-like noise, open and serene'],
      ['mid', 72, 'flowing pads with a soft pulsing arpeggio, uplifting and hopeful'],
      ['mid', 76, 'warm pads, muted electric piano and a light heartbeat pulse'],
      ['mid', 80, 'bright evolving synths with a gentle rhythmic shimmer, focused'],
      ['mid', 74, 'ethereal guitar swells with long reverb, dreamy'],
      ['low', 56, 'very slow sub-bass drones and crystalline overtones, for deep rest'],
      ['mid', 78, 'Nordic ambient with felt piano and soft synth strings'],
      ['low', 62, 'tibetan bowl-like tones blended with warm pads, grounding'],
      ['mid', 84, 'soft downtempo ambient with brushed percussion, steady flow'],
      ['low', 64, 'oceanic pads with slow swells, like breathing'],
      ['mid', 70, 'hopeful major-key pads and gentle plucked synths, sunrise mood'],
    ],
  },
  pianoStrings: {
    style: 'neoclassical piano and strings',
    tracks: [
      ['low', 60, 'solo felt piano, intimate and tender, lots of space between notes'],
      ['low', 64, 'piano with soft string quartet, peaceful and warm'],
      ['low', 58, 'slow cello melody over sparse piano chords, reflective'],
      ['mid', 72, 'flowing piano arpeggios with lush strings, hopeful'],
      ['mid', 76, 'cinematic piano and strings, gently building, inspiring'],
      ['low', 62, 'music-box-like high piano with soft violins, delicate'],
      ['mid', 80, 'minimalist repeating piano pattern with string pulses, focused'],
      ['low', 56, 'very slow piano chords and viola, calm evening mood'],
      ['mid', 70, 'romantic piano melody with string pads, graceful'],
      ['low', 66, 'piano and harp duet, light and soothing'],
      ['mid', 84, 'uplifting piano with pizzicato strings, bright morning feel'],
      ['low', 60, 'solo piano lullaby, soft dynamics, very gentle'],
      ['mid', 74, 'piano and warm string orchestra, emotional but serene'],
      ['low', 64, 'piano with distant cello and subtle ambience, meditative'],
      ['mid', 78, 'modern classical piano ostinato with strings swelling, steady flow'],
      ['low', 58, 'piano and solo violin, slow and heartfelt'],
    ],
  },
  acoustic: {
    style: 'acoustic instrumental',
    tracks: [
      ['low', 66, 'fingerpicked acoustic guitar, warm and relaxed'],
      ['mid', 84, 'acoustic guitar and light hand percussion, sunny and positive'],
      ['low', 62, 'nylon-string guitar ballad, intimate and calm'],
      ['mid', 92, 'folk guitar strumming with soft shaker, easygoing'],
      ['mid', 88, 'acoustic guitar, ukulele and claps, cheerful'],
      ['low', 70, 'two acoustic guitars interweaving, gentle and open'],
      ['mid', 96, 'acoustic guitar with cajon groove, upbeat and steady'],
      ['low', 64, 'slide guitar and soft acoustic chords, laid-back sunset'],
      ['mid', 100, 'indie folk instrumental with mandolin and guitar, lively'],
      ['low', 68, 'Spanish-tinged nylon guitar, soft and flowing'],
      ['mid', 90, 'acoustic guitar and light piano, hopeful journey'],
      ['high', 116, 'driving acoustic strumming with stomps and claps, energetic'],
      ['mid', 86, 'Hawaiian-style ukulele and guitar, breezy'],
      ['low', 60, 'solo acoustic guitar harmonics and slow picking, peaceful'],
      ['high', 120, 'upbeat folk-pop acoustic instrumental with percussion, joyful'],
      ['mid', 94, 'Celtic-inspired guitar and whistle-like melody, adventurous'],
    ],
  },
  altBeats: {
    style: 'alternative chill beats',
    tracks: [
      ['mid', 90, 'chillhop beat with jazzy keys and vinyl texture'],
      ['mid', 96, 'downtempo electronic with organic percussion, smooth'],
      ['mid', 100, 'trip-hop groove with deep bass and atmospheric pads'],
      ['high', 110, 'future beats with bright synth chords, bouncy'],
      ['mid', 94, 'neo-soul instrumental groove with Rhodes and bass'],
      ['high', 118, 'indie electronic with plucked synths and steady drums'],
      ['mid', 88, 'world-fusion downtempo with tabla-like percussion'],
      ['high', 122, 'organic house groove with marimba and claps, uplifting'],
      ['mid', 98, 'glitchy chill beat with warm pads'],
      ['high', 115, 'funky instrumental groove with slap bass and guitar licks'],
      ['mid', 92, 'deep chill beat with muted trumpet-like synth'],
      ['high', 124, 'melodic deep house with soft vocal-free chords'],
      ['mid', 86, 'dub-influenced chill groove with spacious echoes'],
      ['high', 112, 'afrobeat-inspired instrumental with percussion and guitar'],
      ['mid', 102, 'electronic soul groove with warm bass, positive'],
      ['high', 120, 'nu-disco instrumental with groovy bassline'],
    ],
  },
  nature: {
    style: 'gentle music blended with nature sounds',
    tracks: [
      ['low', 58, 'soft rain on leaves with distant warm pads'],
      ['low', 60, 'ocean waves on a beach with slow ambient chords'],
      ['low', 62, 'forest birdsong at morning with soft flute-like tones'],
      ['low', 56, 'gentle stream and water drops with sparse piano'],
      ['low', 60, 'night crickets and soft breeze with low drones'],
      ['low', 64, 'mountain wind and distant bells, open and calm'],
      ['low', 58, 'thunderstorm far away, steady rain and deep pads'],
      ['low', 62, 'tropical birds and light waterfall with kalimba'],
      ['low', 60, 'crackling fireplace and soft guitar notes, cozy'],
      ['low', 56, 'calm lake with loons and slow ambient strings'],
      ['low', 64, 'spring meadow with bees and soft wind chimes'],
      ['low', 60, 'underwater ambience with whale-like tones, deep rest'],
      ['low', 62, 'bamboo forest with wooden flute and light rain'],
      ['low', 58, 'snowy forest silence, soft wind and glassy bells'],
    ],
  },
  electronic: {
    style: 'electronic workout music',
    tracks: [
      ['high', 128, 'driving EDM with big synth leads and four-on-the-floor kick, motivating'],
      ['high', 130, 'progressive house with uplifting chords and steady build'],
      ['high', 126, 'tech house groove with punchy drums and rolling bass'],
      ['high', 140, 'energetic drum and bass style breaks with bright pads'],
      ['high', 132, 'electro pop instrumental with catchy synth hooks'],
      ['high', 135, 'trance-inspired workout track with soaring arpeggios'],
      ['high', 128, 'big room energy with claps and synth stabs, pumping'],
      ['high', 124, 'melodic techno with hypnotic synths, focused intensity'],
      ['mid', 118, 'synthwave with retro drums and warm analog bass, steady drive'],
      ['high', 150, 'high-tempo electronic cardio track with relentless beat'],
      ['high', 128, 'future house with bouncy bass and bright plucks'],
      ['mid', 120, 'deep electronic groove for warm-up, building energy'],
      ['high', 138, 'hardstyle-lite energetic track, powerful but clean'],
      ['high', 126, 'electro funk workout with groovy bass and claps'],
      ['high', 130, 'euphoric dance track with piano chords and strong kick'],
      ['high', 145, 'breakbeat workout track with heavy bass, intense'],
    ],
  },
  hipHop: {
    style: 'instrumental hip-hop beat',
    tracks: [
      ['high', 95, 'hard-hitting boom bap beat with punchy drums and gritty samples-like keys'],
      ['high', 140, 'trap beat with heavy 808s and crisp hi-hats, motivating'],
      ['mid', 88, 'smooth jazzy hip-hop instrumental with laid-back drums'],
      ['high', 100, 'gym hip-hop beat with brass stabs and strong kick'],
      ['high', 145, 'dark energetic trap with orchestral hits'],
      ['mid', 92, 'soulful hip-hop instrumental with Rhodes and warm bass'],
      ['high', 98, 'west coast style bouncy beat with synth lead'],
      ['high', 150, 'drill-style beat with sliding bass, intense focus'],
      ['mid', 85, 'old school instrumental with turntable-like scratches feel and funky bass'],
      ['high', 102, 'motivational hip-hop beat with piano riff and big drums'],
      ['high', 142, 'uplifting trap instrumental with bright synth melody'],
      ['mid', 90, 'chill boom bap with vinyl warmth and mellow keys'],
      ['high', 96, 'funky hip-hop instrumental with horns and claps'],
      ['high', 138, 'epic trap beat with cinematic strings, powerful'],
    ],
  },
  rock: {
    style: 'instrumental rock',
    tracks: [
      ['high', 140, 'driving rock instrumental with power chords and pounding drums'],
      ['high', 128, 'indie rock instrumental with jangly guitars, upbeat'],
      ['high', 150, 'punk-energy instrumental, fast and fun'],
      ['high', 120, 'stadium rock instrumental with big guitar riffs, motivating'],
      ['mid', 110, 'alternative rock instrumental with steady groove, determined'],
      ['high', 135, 'garage rock instrumental with fuzzy guitars'],
      ['high', 125, 'funk rock instrumental with tight drums and wah guitar'],
      ['high', 145, 'hard rock instrumental with energetic solo guitar melody'],
      ['mid', 105, 'blues rock instrumental with groovy riff'],
      ['high', 132, 'pop rock instrumental with bright guitars, positive energy'],
      ['high', 138, 'surf rock instrumental, fast and lively'],
      ['high', 130, 'post-rock build with layered guitars and powerful drums'],
    ],
  },
  lofi: {
    style: 'lo-fi beats',
    tracks: [
      ['low', 70, 'lo-fi beat with soft piano, vinyl crackle and rain'],
      ['mid', 80, 'lo-fi hip-hop with mellow guitar and dusty drums'],
      ['low', 72, 'sleepy lo-fi with warm Rhodes and tape hiss'],
      ['mid', 85, 'lo-fi beat with jazzy chords and soft sax-like synth'],
      ['low', 68, 'lo-fi ambient beat with pads and gentle kick'],
      ['mid', 78, 'lo-fi with kalimba melody and soft bass'],
      ['mid', 82, 'lo-fi study beat with plucked guitar and brushed snare'],
      ['low', 66, 'night-time lo-fi with muted keys and distant city ambience'],
      ['mid', 88, 'upbeat lo-fi with bright piano and bouncy drums'],
      ['low', 74, 'lo-fi with flute melody and warm bass, relaxed'],
      ['mid', 84, 'lo-fi soul with electric piano and soft claps'],
      ['low', 70, 'cozy lo-fi with music box tones and vinyl noise'],
    ],
  },
};

const LEN: Record<Energy, string> = { low: 'about 2 and a half minutes', mid: 'about 2 and a half minutes', high: 'about 2 and a half minutes' };

/** Second takes (--take=2): same brief, steered to a clearly different piece. */
const VARIANTS = [
  'a different melody in a minor key',
  'a brighter arrangement in a major key',
  'a sparser arrangement with more space',
  'a richer, layered arrangement',
  'a warmer, more organic sound',
  'a more modern, polished sound',
  'a hopeful, uplifting mood',
  'a deeper, more introspective mood',
  'a playful, light-hearted mood',
  'a cinematic, wide stereo sound',
];

function specs(): (Spec & { id: string })[] {
  const take = Number(arg('take') ?? 1);
  const perGenre = Number(arg('per-genre') ?? Infinity);
  const out: (Spec & { id: string })[] = [];
  for (const [genre, g] of Object.entries(PLAN)) {
    g.tracks.slice(0, take > 1 ? perGenre : undefined).forEach(([energy, bpm, mood], i) => {
      const twist = take > 1 ? `, ${VARIANTS[(i * 3 + genre.length) % VARIANTS.length]}` : '';
      const tempo = take > 1 ? bpm + (i % 2 ? 4 : -4) : bpm;
      const prompt = `Instrumental only, no vocals, no singing, no spoken words. A ${g.style} track of ${LEN[energy]}, around ${tempo} BPM, ${mood}${twist}. Consistent energy throughout, suitable as background music under a voice coach, high production quality, smooth fade-out ending.`;
      out.push({ id: `${genre}-${String(i + 1).padStart(2, '0')}${take > 1 ? 'b' : ''}`, genre, energy, bpm: tempo, prompt });
    });
  }
  return out;
}

const PRICE = 0.08;
const all = specs().filter((s) => !arg('genre') || s.genre === arg('genre'));
const libFile = 'media/music/library.json';
type Entry = { id: string; genre: string; energy: Energy; bpm: number; duration: number; file: string };
const library: Entry[] = existsSync(libFile) ? JSON.parse(readFileSync(libFile, 'utf8')) : [];
const done = new Set(library.map((e) => e.id));
const todo = all.filter((s) => !done.has(s.id)).slice(0, Number(arg('limit') ?? Infinity));

if (flag('plan')) {
  const by = new Map<string, number>();
  for (const s of all) by.set(s.genre, (by.get(s.genre) ?? 0) + 1);
  console.log([...by].map(([g, n]) => `${g}: ${n}`).join(', '));
  console.log(`${all.length} tracks planned, ${done.size} done, ${todo.length} to generate ≈ $${(todo.length * PRICE).toFixed(2)}`);
  process.exit(0);
}

function envKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const m = readFileSync('.env.local', 'utf8').match(/^GEMINI_API_KEY=(.*)$/m);
  if (!m?.[1].trim()) throw new Error('GEMINI_API_KEY is empty in .env.local');
  return m[1].trim();
}
const KEY = envKey();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function findAudio(o: unknown): string | undefined {
  if (!o || typeof o !== 'object') return undefined;
  const r = o as Record<string, unknown>;
  if (r.type === 'audio' && typeof r.data === 'string') return r.data;
  for (const v of Object.values(r)) {
    const f = Array.isArray(v) ? v.map(findAudio).find(Boolean) : findAudio(v);
    if (f) return f;
  }
  return undefined;
}

async function lyria(prompt: string): Promise<Buffer> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Revision': '2026-05-20', 'x-goog-api-key': KEY },
      body: JSON.stringify({ model: 'lyria-3.5', input: prompt }),
    });
    if (res.ok) {
      const data = findAudio(await res.json());
      if (!data) throw new Error('no audio in response');
      return Buffer.from(data, 'base64');
    }
    const msg = await res.text();
    // the copyright filter sometimes rejects a generic brief: reword it once as an explicitly original piece
    if (res.status === 400 && /recitation/i.test(msg) && !prompt.startsWith('An original composition')) {
      prompt = `An original composition with its own unique melody. ${prompt.replace(/ ?nu-disco| ?trance-inspired| ?stadium rock| ?chillhop/gi, '')}`;
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      const wait = Math.min(90000, 5000 * 2 ** attempt);
      console.log(`  HTTP ${res.status}, retry in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${msg.slice(0, 300)}`);
  }
}

/** Loudness-normalised 128 kbps stereo MP3, so every genre plays at the same level under the voice. */
function finish(mp3: Buffer, out: string): number {
  const tmp = `${out}.src.mp3`;
  writeFileSync(tmp, mp3);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11', '-ar', '44100', '-ac', '2', '-codec:a', 'libmp3lame', '-b:a', '128k', out]);
  rmSync(tmp);
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim());
}

const save = () => {
  library.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(libFile, JSON.stringify(library, null, 1));
};

mkdirSync('media/music', { recursive: true });
console.log(`${todo.length} tracks to generate ≈ $${(todo.length * PRICE).toFixed(2)}`);
const queue = [...todo];
let made = 0;
async function worker() {
  while (queue.length) {
    const s = queue.shift()!;
    try {
      mkdirSync(`media/music/${s.genre}`, { recursive: true });
      const file = `${s.genre}/${s.id}.mp3`;
      const duration = finish(await lyria(s.prompt), `media/music/${file}`);
      library.push({ id: s.id, genre: s.genre, energy: s.energy, bpm: s.bpm, duration: Math.round(duration), file });
      made++;
      save();
      console.log(`  ${s.id} (${Math.round(duration)}s) ${made}/${todo.length}`);
    } catch (e) {
      console.log(`  ${s.id} failed: ${(e as Error).message.slice(0, 200)}`);
    }
  }
}
await Promise.all(Array.from({ length: Number(arg('concurrency') ?? 3) }, worker));
save();
console.log(`library: ${library.length} tracks, ${Math.round(library.reduce((n, e) => n + e.duration, 0) / 60)} minutes`);
