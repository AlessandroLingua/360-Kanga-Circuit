/**
 * Pre-records the voice guidance with Gemini TTS.
 *
 *   npx tsx scripts/tts-generate.ts --samples                 → one sentence in every candidate voice (public/voice/_samples)
 *   npx tsx scripts/tts-generate.ts --lang=it --voice=Sulafat → records corpus-it.json with that voice (resumable)
 *       [--gender=female|male] [--limit=200] [--model=gemini-3.8-flash-tts]
 *
 * Needs GEMINI_API_KEY in .env.local (never shipped: no VITE_ prefix) and ffmpeg on PATH.
 * Output: public/voice/<lang>/<voice>/<id>.mp3 + index.json ({ text: id }) and public/voice/voices.json,
 * which the app reads to offer the recorded voices. Already-recorded sentences are skipped, so the
 * script can be stopped and restarted at any time (e.g. when the free daily quota runs out).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { clipId } from '../src/audio/atoms.ts';

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const flag = (k: string) => process.argv.includes(`--${k}`);

function envKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  for (const f of ['.env.local', '.env']) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, 'utf8').match(/^GEMINI_API_KEY=(.*)$/m);
    if (m?.[1].trim()) return m[1].trim();
  }
  throw new Error('GEMINI_API_KEY is empty: paste your AI Studio key in .env.local');
}

const KEY = envKey();
const MODEL = arg('model') ?? 'gemini-3.8-flash-tts';
const STYLE = arg('style') ?? 'warm, calm and encouraging, like a personal yoga and fitness instructor; natural pace, clear diction';
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** fetch that survives brief network drops (connection resets during long runs). */
async function fetch(url: string, init?: RequestInit): Promise<Response> {
  for (let i = 0; ; i++) {
    try {
      return await globalThis.fetch(url, init);
    } catch (e) {
      if (i >= 5) throw e;
      await sleep(3000 * (i + 1));
    }
  }
}

class Quota extends Error {}

/** Finds the first base64 audio payload anywhere in the response. */
function findAudio(o: unknown): string | undefined {
  if (!o || typeof o !== 'object') return undefined;
  const r = o as Record<string, unknown>;
  const mime = (r.mime_type ?? r.mimeType) as string | undefined;
  if (typeof r.data === 'string' && r.data.length > 100 && (r.type === 'audio' || mime?.startsWith('audio'))) return r.data;
  for (const v of Object.values(r)) {
    const f = Array.isArray(v) ? v.map(findAudio).find(Boolean) : findAudio(v);
    if (f) return f;
  }
  return undefined;
}

async function tts(text: string, voice: string): Promise<{ wav: Buffer; raw: boolean }> {
  const interactions = !MODEL.startsWith('gemini-2.5');
  const url = interactions ? `${BASE}/interactions` : `${BASE}/models/${MODEL}:generateContent`;
  const body = interactions
    ? {
        model: MODEL,
        input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: STYLE }] }] }],
        response_format: { type: 'audio', mime_type: 'audio/wav' },
        generation_config: { speech_config: [{ voice }] },
      }
    : {
        contents: [{ parts: [{ text: `Say in a ${STYLE} voice: ${text}` }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
      };
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body) });
    if (res.ok) {
      const data = findAudio(await res.json());
      if (!data) throw new Error('no audio in response');
      // 2.5 models return headerless 16-bit PCM; 3.x unary returns WAV
      return { wav: Buffer.from(data, 'base64'), raw: !interactions };
    }
    const msg = await res.text();
    if (res.status === 429) {
      // the per-minute error also mentions daily quotas, so only give up after ~30 minutes of refusals
      const hours = msg.match(/retry in (\d+)h/i);
      if ((hours && Number(hours[1]) >= 1) || attempt >= 14) throw new Quota(msg.slice(0, 200));
      const wait = Number(msg.match(/"retryDelay":\s*"(\d+)/)?.[1] ?? 0) * 1000 || Math.min(180000, 4000 * 2 ** attempt);
      process.stdout.write(`  rate limited, waiting ${Math.round(wait / 1000)}s\n`);
      await sleep(wait);
      continue;
    }
    if (res.status >= 500 && attempt < 4) {
      await sleep(3000 * (attempt + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${msg.slice(0, 400)}`);
  }
}

/** WAV/PCM → trimmed mono MP3 (silence trimmed at both ends so clips join smoothly). */
function toMp3(audio: Buffer, raw: boolean, out: string) {
  const tmp = `${out}.tmp`;
  writeFileSync(tmp, audio);
  const input = raw ? ['-f', 's16le', '-ar', '24000', '-ac', '1', '-i', tmp] : ['-i', tmp];
  const trim = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.12,areverse';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...input, '-af', trim, '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '48k', out]);
  rmSync(tmp);
}

function updateVoices(lang: string, voice: string, gender: string, count: number) {
  const f = 'public/voice/voices.json';
  const all: Record<string, { voice: string; gender: string; count: number }[]> = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
  const list = (all[lang] ??= []).filter((v) => v.voice !== voice);
  list.push({ voice, gender, count });
  all[lang] = list.sort((a, b) => a.voice.localeCompare(b.voice));
  writeFileSync(f, JSON.stringify(all, null, 2));
}

// ───────── voice samples ─────────
const CANDIDATES = ['Sulafat', 'Vindemiatrix', 'Achernar', 'Aoede', 'Kore', 'Leda', 'Despina', 'Achird', 'Algieba', 'Charon', 'Sadaltager', 'Orus', 'Iapetus', 'Puck'];
const SAMPLE: Record<string, string> = {
  it: 'Vieni in Cane a testa in giù. Spingi i talloni verso terra e allunga la colonna. Inspira… espira.',
  en: 'Come into Downward Dog. Press the heels toward the floor and lengthen the spine. Inhale… exhale.',
};

if (flag('samples')) {
  const lang = arg('lang') ?? 'it';
  mkdirSync('public/voice/_samples', { recursive: true });
  for (const v of (arg('voices')?.split(',') ?? CANDIDATES)) {
    const out = `public/voice/_samples/${lang}-${v}${MODEL.includes('lite') ? '-lite' : ''}.mp3`;
    if (existsSync(out)) continue;
    const { wav, raw } = await tts(SAMPLE[lang] ?? SAMPLE.en, v);
    toMp3(wav, raw, out);
    console.log(`sample ${v} → ${out}`);
  }
  process.exit(0);
}

// ───────── full corpus ─────────
const lang = arg('lang');
const voice = arg('voice');
if (!lang || !voice) throw new Error('use --lang=it --voice=Name (or --samples)');
const gender = arg('gender') ?? 'female';
const limit = Number(arg('limit') ?? Infinity);
const corpus: string[] = JSON.parse(readFileSync(`scripts/tts/corpus-${lang}.json`, 'utf8'));
const dir = `public/voice/${lang}/${voice}`;
mkdirSync(dir, { recursive: true });
const indexFile = `${dir}/index.json`;
const index: Record<string, string> = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : {};
const save = () => {
  writeFileSync(indexFile, JSON.stringify(index));
  updateVoices(lang, voice, gender, Object.keys(index).length);
};

const todo = corpus.filter((t) => !index[t]);
console.log(`${lang}/${voice}: ${corpus.length - todo.length}/${corpus.length} done, ${todo.length} to record (model ${MODEL})`);
let n = 0;
const workers = Number(arg('concurrency') ?? 4);
const queue = todo.slice(0, Number.isFinite(limit) ? limit : undefined);
let stop = false;

/**
 * --batch: Batch API (generateContent shape). Half price and not counted against the
 * requests-per-day limit; results usually arrive within minutes. Chunks of 200 sentences,
 * all submitted at once, then polled; each finished chunk is converted and saved.
 */
if (flag('batch')) {
  const H = { 'Content-Type': 'application/json', 'x-goog-api-key': KEY };
  const req = (text: string) => ({ contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } });
  const size = Number(arg('chunk') ?? 200);
  const chunks: string[][] = [];
  for (let i = 0; i < queue.length; i += size) chunks.push(queue.slice(i, i + size));
  const jobs: { name: string; texts: string[] }[] = [];
  for (const [ci, texts] of chunks.entries()) {
    const body = { batch: { display_name: `kanga-${lang}-${voice}-${ci}`, input_config: { requests: { requests: texts.map((t, k) => ({ request: req(t), metadata: { key: String(k) } })) } } } };
    const r = await fetch(`${BASE}/models/${MODEL}:batchGenerateContent`, { method: 'POST', headers: H, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`batch create HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const j = (await r.json()) as { name: string };
    jobs.push({ name: j.name, texts });
    console.log(`  submitted ${j.name} (${texts.length} sentences)`);
  }
  const pending = new Set(jobs);
  while (pending.size) {
    await sleep(30000);
    for (const job of [...pending]) {
      const j = await (await fetch(`${BASE}/${job.name}`, { headers: H })).json();
      const meta = j.metadata ?? j;
      const state: string = meta.state ?? '';
      if (!/SUCCEEDED|FAILED|CANCELLED|EXPIRED/.test(state)) continue;
      pending.delete(job);
      const out: { response?: unknown; error?: unknown; metadata?: { key: string } }[] = meta.output?.inlinedResponses?.inlinedResponses ?? [];
      let ok = 0;
      for (const res of out) {
        const text = job.texts[Number(res.metadata?.key)];
        const data = res.response && findInline(res.response);
        if (!text || !data) continue;
        const id = clipId(text);
        try {
          toMp3(Buffer.from(data, 'base64'), false, `${dir}/${id}.mp3`);
          index[text] = id;
          ok++;
        } catch {
          /* bad audio: stays in the todo list for the next run */
        }
      }
      save();
      console.log(`  ${job.name}: ${state}, ${ok}/${job.texts.length} saved — ${Object.keys(index).length}/${corpus.length} total`);
    }
  }
  console.log(`${lang}/${voice}: ${Object.keys(index).length}/${corpus.length} recorded`);
  process.exit(0);
}

function findInline(o: unknown): string | undefined {
  if (!o || typeof o !== 'object') return undefined;
  const r = o as Record<string, unknown>;
  const d = (r.inlineData ?? r.inline_data) as { data?: string } | undefined;
  if (d?.data) return d.data;
  for (const v of Object.values(r)) {
    const f = Array.isArray(v) ? v.map(findInline).find(Boolean) : findInline(v);
    if (f) return f;
  }
  return undefined;
}
async function worker() {
  while (!stop && queue.length) {
    const text = queue.shift()!;
    const id = clipId(text);
    try {
      const { wav, raw } = await tts(text, voice!);
      toMp3(wav, raw, `${dir}/${id}.mp3`);
      index[text] = id;
      n++;
      if (n % 25 === 0) {
        save();
        console.log(`  ${corpus.length - todo.length + n}/${corpus.length}`);
      }
    } catch (e) {
      if (e instanceof Quota) {
        stop = true;
        throw e;
      }
      console.log(`  skipped (${(e as Error).message.slice(0, 120)}): ${text.slice(0, 60)}`);
    }
  }
}
try {
  await Promise.all(Array.from({ length: workers }, worker));
} catch (e) {
  if (e instanceof Quota) console.log(`Quota reached (${e.message}): run the same command again later to continue.`);
  else throw e;
} finally {
  save();
  console.log(`${lang}/${voice}: ${Object.keys(index).length}/${corpus.length} recorded`);
}
