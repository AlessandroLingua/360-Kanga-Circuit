/**
 * Adaptive generative soundtrack built with the Web Audio API.
 * Nothing is pre-recorded: each genre is synthesised live and reacts to the
 * intensity of the current phase (tempo, brightness, density, volume).
 */
import type { Discipline, MusicGenre } from '../engine/types';
import { getLocalTracks } from './localLibrary';
import { playlist, trackUrl, type Track } from './library';

/** Synth used when a recorded genre has no tracks available (offline before first download). */
const SYNTH_FALLBACK: Partial<Record<MusicGenre, MusicGenre>> = { electronic: 'altBeats', hipHop: 'altBeats', rock: 'altBeats', lofi: 'pianoStrings' };
const CROSSFADE = 4;

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// D dorian-ish progressions (MIDI root + chord tones)
const PROGRESSIONS = [
  [[50, 57, 60, 64, 65], [46, 53, 57, 62, 65], [53, 57, 60, 64, 67], [48, 55, 60, 64, 67]],
  [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [43, 50, 55, 59, 62], [48, 52, 55, 60, 64]],
  [[50, 57, 62, 65, 69], [55, 59, 62, 67, 71], [52, 57, 60, 64, 67], [53, 57, 60, 65, 69]],
];
const PENTA = [62, 64, 65, 69, 72, 74, 76, 77, 81];

let sharedCtx: AudioContext | null = null;
/** One AudioContext for the whole app (browsers limit how many can exist). */
export function getAudioContext() {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new AC();
  }
  return sharedCtx;
}
/** Call synchronously from the Start tap so iOS/Safari allow sound. */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  // a silent one-sample buffer fully unlocks WebKit
  const b = ctx.createBufferSource();
  b.buffer = ctx.createBuffer(1, 1, 22050);
  b.connect(ctx.destination);
  b.start(0);
}

export class MusicEngine {
  ctx: AudioContext;
  master: GainNode;
  duckGain: GainNode;
  bus: GainNode;
  reverb: ConvolverNode;
  private noise: AudioBuffer;
  private timer: number | null = null;
  private genre: MusicGenre = 'silent';
  private intensity = 0.3;
  private target = 0.3;
  private next = 0;
  private step = 0;
  private chordIdx = 0;
  private prog = PROGRESSIONS[0];
  private persistent: AudioNode[] = [];
  private audioEl: HTMLAudioElement | null = null;
  private localUrls: string[] = [];
  private volume = 0.6;
  /** Bumped on every start/stop so a playlist that is still loading knows it was replaced. */
  private run = 0;
  private libraryEls: HTMLAudioElement[] = [];
  private libraryTimer: number | null = null;
  paused = false;

  constructor() {
    this.ctx = getAudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.duckGain = this.ctx.createGain();
    this.bus = this.ctx.createGain();
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this.impulse(3.2);
    const wet = this.ctx.createGain();
    wet.gain.value = 0.45;
    this.bus.connect(this.duckGain);
    this.bus.connect(this.reverb).connect(wet).connect(this.duckGain);
    this.duckGain.connect(this.master).connect(this.ctx.destination);
    this.noise = this.makeNoise();
  }

  private impulse(sec: number) {
    const len = this.ctx.sampleRate * sec;
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }
  private makeNoise() {
    const len = this.ctx.sampleRate * 3;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // mix of white and brown noise
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3 + w * 0.15;
    }
    return buf;
  }

  async start(genre: MusicGenre, discipline?: Discipline) {
    this.stop();
    const my = ++this.run;
    this.genre = genre;
    this.prog = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (genre === 'silent') return;
    if (genre === 'local') return this.startLocal();
    if (genre !== 'brainWaves') {
      const list = await playlist(genre, discipline);
      if (my !== this.run) return;
      if (list.length) return this.startLibrary(list, my);
      genre = SYNTH_FALLBACK[genre] ?? genre;
      this.genre = genre;
    }
    this.next = this.ctx.currentTime + 0.1;
    this.step = 0;
    if (genre === 'nature') this.startNatureBed();
    if (genre === 'brainWaves') this.startBinaural();
    this.timer = window.setInterval(() => this.schedule(), 100);
  }

  /** Next song: the following recorded track with a crossfade, or a new progression for the generated genres. */
  nextTrack() {
    if (this.skipTrack) return this.skipTrack();
    if (this.genre === 'silent' || this.genre === 'local') return;
    this.prog = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
    this.step = 0;
  }
  private skipTrack: (() => void) | null = null;

  stop() {
    this.run++;
    this.skipTrack = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.libraryTimer) clearTimeout(this.libraryTimer);
    this.libraryTimer = null;
    for (const el of this.libraryEls) {
      el.pause();
      el.removeAttribute('src');
    }
    this.libraryEls = [];
    for (const n of this.persistent) {
      try {
        (n as OscillatorNode).stop?.();
      } catch {
        /* already stopped */
      }
      n.disconnect();
    }
    this.persistent = [];
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
    this.localUrls.forEach((u) => URL.revokeObjectURL(u));
    this.localUrls = [];
  }

  /** Release this engine's nodes (the shared context stays alive). */
  dispose() {
    this.stop();
    this.master.disconnect();
  }

  /** Gentle fade at the natural end of a session. */
  fadeOut(sec = 4) {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0.0001, t + sec);
    setTimeout(() => this.stop(), sec * 1000 + 100);
  }

  async pause(p: boolean) {
    this.paused = p;
    const playing = this.libraryEls.filter((e) => !!e.src && (p ? !e.paused : e.dataset.active === '1'));
    if (p) {
      await this.ctx.suspend();
      this.audioEl?.pause();
      playing.forEach((e) => e.pause());
    } else {
      await this.ctx.resume();
      this.audioEl?.play().catch(() => {});
      playing.forEach((e) => e.play().catch(() => {}));
    }
  }

  /**
   * Plays recorded tracks in order with a crossfade. Two elements alternate: the next track is
   * downloaded while the current one plays, then faded in over its last seconds.
   */
  private startLibrary(list: Track[], my: number) {
    const els = [0, 1].map(() => {
      const el = new Audio();
      el.crossOrigin = 'anonymous';
      el.preload = 'auto';
      const g = this.ctx.createGain();
      g.gain.value = 0;
      this.ctx.createMediaElementSource(el).connect(g).connect(this.duckGain);
      return { el, g };
    });
    this.libraryEls = els.map((e) => e.el);
    let i = 0;
    let cur = 0;
    const urls = new Map<string, string>();
    const load = async (t: Track) => {
      // fetched whole: a plain GET is what the service worker can cache for offline
      if (!urls.has(t.id)) {
        const b = await fetch(trackUrl(t)).then((r) => (r.ok ? r.blob() : Promise.reject()));
        urls.set(t.id, URL.createObjectURL(b));
        this.localUrls.push(urls.get(t.id)!);
      }
      return urls.get(t.id)!;
    };
    const playAt = async (slot: number) => {
      if (my !== this.run) return;
      const t = list[i++ % list.length];
      let src: string;
      try {
        src = await load(t);
      } catch {
        return; // offline and not cached: keep whatever is playing
      }
      if (my !== this.run) return;
      const { el, g } = els[slot];
      el.src = src;
      el.dataset.active = '1';
      const now = this.ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(1, now + CROSSFADE);
      if (!this.paused) await el.play().catch(() => {});
      const other = els[1 - slot];
      other.g.gain.cancelScheduledValues(now);
      other.g.gain.setValueAtTime(other.g.gain.value, now);
      other.g.gain.linearRampToValueAtTime(0, now + CROSSFADE);
      setTimeout(() => {
        if (my !== this.run) return;
        other.el.pause();
        other.el.dataset.active = '0';
      }, CROSSFADE * 1000 + 100);
      cur = slot;
      // start the next one before this one ends, and download it meanwhile
      const next = list[i % list.length];
      load(next).catch(() => {});
      const schedule = () => {
        if (my !== this.run) return;
        const left = (el.duration || t.duration) - el.currentTime;
        if (left <= CROSSFADE + 0.3 && !this.paused) playAt(1 - cur);
        else this.libraryTimer = window.setTimeout(schedule, 500);
      };
      this.libraryTimer = window.setTimeout(schedule, 1000);
    };
    playAt(0);
    this.skipTrack = () => {
      if (my !== this.run) return;
      if (this.libraryTimer) clearTimeout(this.libraryTimer);
      playAt(1 - cur);
    };
  }

  setIntensity(x: number) {
    this.target = Math.max(0, Math.min(1, x));
  }
  setVolume(v: number) {
    this.volume = v;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }
  duck(on: boolean) {
    this.duckGain.gain.setTargetAtTime(on ? 0.35 : 1, this.ctx.currentTime, on ? 0.15 : 0.8);
  }

  /** Short bell for meditation timers and HIIT transitions. */
  bell(kind: 'soft' | 'high' = 'soft') {
    const t = this.ctx.currentTime + 0.02;
    const base = kind === 'soft' ? 528 : 880;
    for (const [mul, g, d] of [[1, 0.25, 6], [2.76, 0.08, 3], [5.4, 0.04, 1.5]] as const) {
      const o = this.ctx.createOscillator();
      const gn = this.ctx.createGain();
      o.frequency.value = base * mul;
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(g, t + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(gn).connect(this.master);
      o.start(t);
      o.stop(t + d + 0.1);
    }
  }

  // ───────────────────────── scheduler ─────────────────────────
  private schedule() {
    this.intensity += (this.target - this.intensity) * 0.04;
    const I = this.intensity;
    const ahead = this.ctx.currentTime + 0.35;
    while (this.next < ahead) {
      const t = this.next;
      switch (this.genre) {
        case 'ambient':
          this.ambientStep(t, I);
          break;
        case 'pianoStrings':
          this.pianoStep(t, I);
          break;
        case 'acoustic':
          this.acousticStep(t, I);
          break;
        case 'altBeats':
          this.beatStep(t, I);
          break;
        case 'brainWaves':
          this.brainStep(t, I);
          break;
        case 'nature':
          this.natureStep(t, I);
          break;
      }
      this.step++;
    }
  }

  private chord() {
    return this.prog[this.chordIdx % this.prog.length];
  }

  // ambient: long evolving pads, occasional high bells
  private ambientStep(t: number, I: number) {
    const len = 8 - I * 3;
    const ch = this.chord();
    this.pad(ch.slice(0, 4).map((m) => midi(m)), t, len + 2, 400 + I * 1600, 0.05);
    if (Math.random() < 0.4 + I * 0.4) this.bellNote(midi(this.pickPenta() + 12), t + len * Math.random(), 0.03);
    this.chordIdx++;
    this.next += len;
  }

  // piano arpeggios over a string pad
  private pianoStep(t: number, I: number) {
    const bpm = 62 + I * 40;
    const beat = 60 / bpm / 2;
    const ch = this.chord();
    const pattern = [0, 2, 3, 4, 3, 2, 1, 2];
    const i = this.step % 8;
    if (i === 0) {
      this.pad(ch.slice(0, 3).map((m) => midi(m - 12)), t, beat * 8 + 1, 700 + I * 900, 0.035, 1.2);
      this.piano(midi(ch[0] - 12), t, 0.12);
    }
    if (i % (I > 0.5 ? 1 : 2) === 0 || Math.random() < 0.3) this.piano(midi(ch[pattern[i]] + 12), t, 0.06 + Math.random() * 0.03);
    if (i === 7) this.chordIdx++;
    this.next += beat;
  }

  // acoustic: plucked guitar-like arpeggios
  private acousticStep(t: number, I: number) {
    const bpm = 70 + I * 45;
    const beat = 60 / bpm / 2;
    const ch = this.chord();
    const i = this.step % 8;
    const order = [0, 2, 1, 3, 2, 4, 3, 1];
    this.pluck(midi(ch[order[i]] + (i === 0 ? -12 : 0)), t, i === 0 ? 0.14 : 0.08);
    if (I > 0.55 && i % 2 === 1) this.pluck(midi(ch[4]), t + beat / 2, 0.04);
    if (i === 7) this.chordIdx++;
    this.next += beat;
  }

  // downtempo beats: kick/snare/hats + bass + pad
  private beatStep(t: number, I: number) {
    const bpm = 72 + I * 52;
    const s16 = 60 / bpm / 4;
    const i = this.step % 16;
    const ch = this.chord();
    if (i === 0 || i === 10 || (I > 0.6 && i === 7)) this.kick(t);
    if (i === 4 || i === 12) this.snare(t, 0.12 + I * 0.08);
    if (i % 2 === 0 || I > 0.65) this.hat(t, i % 4 === 2 ? 0.05 : 0.025);
    if (i === 0 || i === 6 || i === 10) this.bass(midi(ch[0] - 12), t, s16 * 3);
    if (i === 0) this.pad(ch.slice(1, 4).map((m) => midi(m)), t, s16 * 16, 800 + I * 1200, 0.025);
    if (i === 15) this.chordIdx++;
    this.next += s16;
  }

  // binaural beds are persistent; here only a slow soft pad
  private brainStep(t: number, I: number) {
    const ch = this.chord();
    this.pad([midi(ch[0]), midi(ch[2])], t, 12, 500, 0.02);
    const beat = 4 + I * 12; // theta (calm) → beta (active)
    const [l, r] = this.persistent.filter((n) => n instanceof OscillatorNode) as OscillatorNode[];
    if (l && r) {
      l.frequency.setTargetAtTime(200, t, 2);
      r.frequency.setTargetAtTime(200 + beat, t, 2);
    }
    this.chordIdx++;
    this.next += 10;
  }

  private natureStep(t: number, I: number) {
    if (Math.random() < 0.35 + I * 0.3) this.bird(t + Math.random() * 2);
    if (Math.random() < 0.1) this.bellNote(midi(this.pickPenta()), t, 0.015);
    this.next += 2.5;
  }

  // ───────────────────────── voices ─────────────────────────
  private env(g: GainNode, t: number, peak: number, a: number, d: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  private pickPenta() {
    return PENTA[Math.floor(Math.random() * PENTA.length)];
  }
  private pad(freqs: number[], t: number, dur: number, cutoff: number, vol: number, attack = 2) {
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    f.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - 2));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.5);
    f.connect(g).connect(this.bus);
    for (const fr of freqs)
      for (const det of [-7, 7]) {
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = fr;
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 1.6);
      }
  }
  private piano(freq: number, t: number, vol: number) {
    const g = this.ctx.createGain();
    this.env(g, t, vol, 0.005, 2.4);
    g.connect(this.bus);
    for (const [type, mul, v] of [['triangle', 1, 1], ['sine', 2, 0.35], ['sine', 3, 0.12]] as const) {
      const o = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      og.gain.value = v;
      o.type = type;
      o.frequency.value = freq * mul;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 2.6);
    }
  }
  private pluck(freq: number, t: number, vol: number) {
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq * 8, t);
    f.frequency.exponentialRampToValueAtTime(freq * 1.2, t + 0.4);
    const g = this.ctx.createGain();
    this.env(g, t, vol, 0.003, 1.4);
    o.connect(f).connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 1.5);
  }
  private bellNote(freq: number, t: number, vol: number) {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    this.env(g, t, vol, 0.01, 4);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 4.2);
  }
  private kick(t: number) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    this.env(g, t, 0.5, 0.002, 0.35);
    o.connect(g).connect(this.duckGain);
    o.start(t);
    o.stop(t + 0.4);
  }
  private noiseHit(t: number, vol: number, type: BiquadFilterType, freq: number, dur: number) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    this.env(g, t, vol, 0.002, dur);
    s.connect(f).connect(g).connect(this.duckGain);
    s.start(t, Math.random() * 2);
    s.stop(t + dur + 0.05);
  }
  private snare(t: number, vol: number) {
    this.noiseHit(t, vol, 'bandpass', 1800, 0.18);
  }
  private hat(t: number, vol: number) {
    this.noiseHit(t, vol, 'highpass', 7000, 0.05);
  }
  private bass(freq: number, t: number, dur: number) {
    const o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    this.env(g, t, 0.16, 0.01, dur);
    o.connect(g).connect(this.duckGain);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
  private bird(t: number) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const base = 2200 + Math.random() * 1800;
    o.frequency.setValueAtTime(base, t);
    for (let k = 0; k < 3; k++) {
      o.frequency.linearRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t + 0.05 + k * 0.12);
      o.frequency.linearRampToValueAtTime(base, t + 0.1 + k * 0.12);
    }
    this.env(g, t, 0.02, 0.01, 0.45);
    const p = this.ctx.createStereoPanner();
    p.pan.value = Math.random() * 2 - 1;
    o.connect(g).connect(p).connect(this.bus);
    o.start(t);
    o.stop(t + 0.5);
  }
  private startNatureBed() {
    // ocean waves: brown noise with slow amplitude LFO
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const g = this.ctx.createGain();
    g.gain.value = 0.18;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoG = this.ctx.createGain();
    lfoG.gain.value = 0.12;
    lfo.connect(lfoG).connect(g.gain);
    s.connect(f).connect(g).connect(this.duckGain);
    // light rain layer
    const r = this.ctx.createBufferSource();
    r.buffer = this.noise;
    r.loop = true;
    const rf = this.ctx.createBiquadFilter();
    rf.type = 'highpass';
    rf.frequency.value = 5000;
    const rg = this.ctx.createGain();
    rg.gain.value = 0.03;
    r.connect(rf).connect(rg).connect(this.duckGain);
    s.start();
    r.start(0, 1.3);
    lfo.start();
    this.persistent.push(s, r, lfo, f, g, rf, rg);
  }
  private startBinaural() {
    const merger = this.ctx.createChannelMerger(2);
    const g = this.ctx.createGain();
    g.gain.value = 0.08;
    const l = this.ctx.createOscillator();
    const r = this.ctx.createOscillator();
    l.frequency.value = 200;
    r.frequency.value = 208;
    l.connect(merger, 0, 0);
    r.connect(merger, 0, 1);
    merger.connect(g).connect(this.duckGain);
    l.start();
    r.start();
    this.persistent.push(l, r, merger, g);
  }

  private async startLocal() {
    const tracks = await getLocalTracks();
    if (!tracks.length) return;
    const order = tracks.sort(() => Math.random() - 0.5);
    this.localUrls = order.map((t) => URL.createObjectURL(t.blob));
    const el = new Audio();
    el.crossOrigin = 'anonymous';
    this.audioEl = el;
    const src = this.ctx.createMediaElementSource(el);
    src.connect(this.duckGain);
    let i = 0;
    const playNext = () => {
      el.src = this.localUrls[i++ % this.localUrls.length];
      el.play().catch(() => {});
    };
    el.addEventListener('ended', playNext);
    playNext();
  }
}
