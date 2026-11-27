import { useEffect, useMemo, useRef, useState } from 'react';
import { MusicEngine } from '../audio/music';
import { isSpeaking, listTeachers, pauseSpeaking, setVoiceVolume, speak, stopSpeaking, type Teacher } from '../audio/voice';
import { prefetchNeural } from '../audio/neural';
import { FigureCanvas } from '../components/FigureCanvas';
import { figureAt, getMove, indexAt, nextPreviewAt, offsets, type FigureFrame } from '../engine/animate';
import { moveName } from '../engine/cues';
import { breathWords } from '../engine/mind';
import type { Figure, MusicGenre, Session } from '../engine/types';
import { useLang, useT } from '../i18n';
import { broadcastTv, startCast } from '../services/cast';
import { clipFor } from '../services/clips';
import { estimateCalories, logToHealth } from '../services/health';
import { clearPref, dislikeMove, getState, likeMove, setState, useStore } from '../store/store';
import { fmt } from '../components/ui';
import { phaseLabel, variantLabel } from '../i18n/variant';

/** With subtitles on, the floor line moves up so the text fits below it (see .subtitle in styles.css). */
const SUB_FLOOR = 0.7;
/** Genres that can be switched to mid-session ("my music" needs files picked in the settings). */
const PLAYER_GENRES: MusicGenre[] = ['ambient', 'pianoStrings', 'acoustic', 'lofi', 'altBeats', 'electronic', 'hipHop', 'rock', 'brainWaves', 'nature', 'silent'];

/**
 * Music/voice balance: 0 = mostly music, 0.5 = both full, 1 = mostly voice.
 * Neither side ever goes fully silent: the slider is a balance, not a mute.
 */
const musicShare = (mix: number) => 0.1 + 0.9 * Math.min(1, 2 * (1 - mix));
const voiceShare = (mix: number) => 0.25 + 0.75 * Math.min(1, 2 * mix);

/** Seconds a subtitle stays on screen: roughly reading/speaking time. */
const subtitleTime = (text: string) => Math.max(3.5, text.split(/\s+/).length * 0.45 + 1.5);

export function Player({ session, onExit }: { session: Session; onExit: () => void }) {
  const t = useT();
  const lang = useLang();
  const audio = useStore((s) => s.audio);
  const likes = useStore((s) => s.likes);
  const dislikes = useStore((s) => s.dislikes);
  const offs = useMemo(() => offsets(session), [session]);

  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [subtitle, setSubtitle] = useState('');
  const [finished, setFinished] = useState<null | { active: number[]; early: boolean }>(null);
  const [showSubs, setShowSubs] = useState(audio.subtitles);

  const frameRef = useRef<FigureFrame | null>(null);
  // during rests: the coming exercise, looping in the corner preview
  const nextRef = useRef<FigureFrame | null>(null);
  // the clock starts paused and only runs once the voice is loaded, so the first instruction is never lost
  const clock = useRef({ base: 0, t0: performance.now(), paused: true });
  const fired = useRef(new Set<string>());
  const music = useRef<MusicEngine | null>(null);
  const teacher = useRef<Teacher | null>(null);
  const lastBell = useRef(-1);
  const breathPhase = useRef(-1);
  const subtitleUntil = useRef(0);
  // real time spent in each segment (skips and pauses don't count)
  const active = useRef<number[]>(session.segments.map(() => 0));
  const lastFrame = useRef(0);
  const startedAt = useRef(new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  const now = () => (clock.current.paused ? clock.current.base : clock.current.base + (performance.now() - clock.current.t0) / 1000);

  // audio setup, then start the clock
  useEffect(() => {
    let cancelled = false;
    const m = new MusicEngine();
    music.current = m;
    m.setVolume(audio.musicVolume * musicShare(audio.voiceMix ?? 0.5));
    setVoiceVolume(voiceShare(audio.voiceMix ?? 0.5));
    m.start(audio.genre, session.discipline);
    listTeachers(session.lang).then((ts) => {
      if (cancelled) return;
      teacher.current = ts[audio.teacherIdx % ts.length] ?? ts[0] ?? null;
      const nv = teacher.current?.neural;
      if (nv) prefetchNeural(session.segments.flatMap((g) => g.cues.map((c) => c.text)), nv.lang, nv.voice);
      startedAt.current = new Date();
      clock.current = { base: 0, t0: performance.now(), paused: false };
      if (session.discipline === 'meditation') m.bell('soft');
      setReady(true);
    });
    let lock: { release: () => Promise<void> } | null = null;
    (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<typeof lock> } }).wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
    return () => {
      cancelled = true;
      m.dispose();
      stopSpeaking();
      setVoiceVolume(1);
      lock?.release().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Voice policy (keeps voice and picture in sync):
   * - the first cue of a segment interrupts whatever is still being said
   * - later cues are skipped if the teacher is still talking, instead of queueing up
   */
  const say = (text: string, interrupt: boolean) => {
    if (!interrupt && isSpeaking()) return;
    setSubtitle(text);
    subtitleUntil.current = performance.now() + subtitleTime(text) * 1000;
    if (!teacher.current) return;
    speak(text, teacher.current, { interrupt, onStart: () => music.current?.duck(true), onEnd: () => music.current?.duck(false) });
  };

  const finish = (early: boolean) => {
    const pos = Math.min(now(), session.totalSeconds);
    clock.current = { base: pos, t0: performance.now(), paused: true };
    if (early) {
      stopSpeaking();
      music.current?.pause(true);
    } else {
      music.current?.fadeOut(5);
      if (session.discipline === 'meditation') music.current?.bell('soft');
    }
    setFinished({ active: [...active.current], early });
  };

  // main loop
  useEffect(() => {
    if (!ready || finished) return;
    let raf = 0;
    let lastUi = 0;
    let lastTv = 0;
    const tick = () => {
      const e = now();
      if (e >= session.totalSeconds) return finish(false);
      const i = indexAt(offs, e);
      const seg = session.segments[i];
      const se = e - offs[i];
      const nowMs = performance.now();
      if (!clock.current.paused && lastFrame.current) active.current[i] += Math.min(0.5, (nowMs - lastFrame.current) / 1000);
      lastFrame.current = nowMs;
      // cues
      seg.cues.forEach((c, k) => {
        const key = `${i}:${k}`;
        if (c.at <= se && !fired.current.has(key)) {
          fired.current.add(key);
          if (se - c.at < 2) say(c.text, k === 0 && c.at < 0.5);
        }
      });
      // bells
      if (seg.bellEvery) {
        const n = Math.floor(se / seg.bellEvery);
        if (n !== lastBell.current && n > 0) music.current?.bell('soft');
        lastBell.current = n;
      }
      // spoken breath pattern (first cycles only, then on-screen only)
      if (seg.kind === 'breath' && seg.pattern) {
        const cyc = seg.pattern.reduce((a, b) => a + b, 0);
        const inCycle = se % cyc;
        let p = 0,
          acc = 0;
        for (; p < 4; p++) {
          acc += seg.pattern[p];
          if (inCycle < acc) break;
        }
        const id = Math.floor(se / cyc) * 4 + p;
        if (id !== breathPhase.current && seg.pattern[p] > 0) {
          breathPhase.current = id;
          if (se < cyc * 4) say(breathWords(session.lang)[p], true);
        }
      }
      music.current?.setIntensity(seg.intensity);
      frameRef.current = figureAt(session, i, se);
      nextRef.current = nextPreviewAt(session, i, se);
      const ts = performance.now();
      if (ts - lastUi > 200) {
        lastUi = ts;
        setIdx(i);
        setElapsed(e);
        if (subtitleUntil.current && ts > subtitleUntil.current && !isSpeaking()) {
          subtitleUntil.current = 0;
          setSubtitle('');
        }
      }
      if (ts - lastTv > 500) {
        lastTv = ts;
        broadcastTv({ index: i, segElapsed: se, paused: clock.current.paused, subtitle: '', sentAt: Date.now() });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, offs, ready, finished]);

  // segment start bells for HIIT
  const prevIdx = useRef(-1);
  useEffect(() => {
    if (idx === prevIdx.current || !ready) return;
    prevIdx.current = idx;
    if (session.discipline === 'hiit') music.current?.bell(session.segments[idx].kind === 'rest' ? 'soft' : 'high');
    if (session.segments[idx].kind === 'breath') breathPhase.current = -1;
  }, [idx, session, ready]);

  // share full session with TV receivers periodically (so late-joining TVs get it)
  useEffect(() => {
    const iv = setInterval(() => {
      const e = now();
      const i = indexAt(offs, e);
      broadcastTv({ session, index: i, segElapsed: e - offs[i], paused: clock.current.paused, subtitle, sentAt: Date.now() });
    }, 3000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, subtitle]);

  const togglePause = () => {
    if (!ready) return;
    const c = clock.current;
    if (c.paused) {
      c.t0 = performance.now();
      c.paused = false;
    } else {
      c.base = now();
      c.paused = true;
    }
    setPaused(c.paused);
    music.current?.pause(c.paused);
    pauseSpeaking(c.paused);
  };

  const seek = (i: number) => {
    if (!ready) return;
    if (i >= session.segments.length) return finish(true);
    const target = Math.max(0, i);
    stopSpeaking();
    setSubtitle('');
    clock.current.base = offs[target];
    clock.current.t0 = performance.now();
    for (const k of [...fired.current]) if (Number(k.split(':')[0]) >= target) fired.current.delete(k);
    lastBell.current = -1;
    setIdx(target);
    setElapsed(offs[target]);
  };

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  // keyboard: space = pause, ← → = previous / next, f = fullscreen, esc handled by browser
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    if (finished || (e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      togglePause();
    } else if (e.key === 'ArrowRight') seek(idx + 1);
    else if (e.key === 'ArrowLeft') seek(idx - 1);
    else if (e.key === 'f') toggleFs();
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, []);

  if (finished)
    return <Summary session={session} active={finished.active} early={finished.early} startedAt={startedAt.current} onDone={onExit} />;

  const seg = session.segments[idx];
  const isRest = seg.kind === 'rest';
  // a rest segment carries the id of the *next* exercise
  const move = isRest ? undefined : getMove(seg.moveId);
  const nextSeg = isRest ? seg : session.segments.slice(idx + 1).find((s) => s.moveId && s.moveId !== seg.moveId);
  const nextMove = getMove(nextSeg?.moveId);
  const segLeft = Math.max(0, offs[idx] + seg.duration - elapsed);
  const clip = clipFor(seg.moveId, seg.side);
  const pref = move ? (likes.includes(move.id) ? 'like' : dislikes.includes(move.id) ? 'dislike' : null) : null;
  const audioOnly = session.audioOnly || (!move && !isRest);

  return (
    <div className="player" ref={rootRef}>
      <div className="player-top">
        <button className="ghost" onClick={() => (ready ? finish(true) : onExit())} aria-label={t('end')}>✕</button>
        <div className="player-title">
          <span className="phase">{phaseLabel(seg.phase, lang) || variantLabel(session.discipline, session.variant, lang)}</span>
          <strong>{seg.kind === 'breath' || seg.phase === 'timer' ? variantLabel('meditation', session.variant, lang) : isRest && nextMove ? `${t('upNext')}: ${moveName(nextMove, { lang, sanskrit: false })}` : seg.title}</strong>
        </div>
        <button className="ghost" onClick={async () => { const r = await startCast(); if (r === 'window') alert(t('castHelp')); }} title={t('cast')}>📺</button>
        <button className="ghost" onClick={toggleFs} title={t('fullscreen')}>⛶</button>
      </div>

      <div className={`stage ${seg.kind === 'rest' ? 'rest' : ''}`}>
        {audioOnly ? (
          <AudioVisual session={session} idx={idx} se={elapsed - offs[idx]} />
        ) : clip ? (
          <video className="clip" src={clip} autoPlay loop muted playsInline key={clip} />
        ) : (
          <FigureCanvas frameRef={frameRef} floorAt={showSubs ? SUB_FLOOR : undefined} />
        )}
        {seg.kind === 'rest' && <div className="rest-badge">{t('rest')} · {Math.ceil(segLeft)}</div>}
        {isRest && nextMove && !audioOnly && (
          <div className="next-preview" aria-label={`${t('upNext')}: ${moveName(nextMove, { lang, sanskrit: false })}`}>
            <FigureCanvas frameRef={nextRef} className="next-canvas" floorAt={0.9} />
            <span>{t('upNext')}</span>
          </div>
        )}
        {showSubs && subtitle && <div className="subtitle">{subtitle}</div>}
        {!ready && <div className="loading-badge">…</div>}
        {paused && <button className="paused-overlay" onClick={togglePause} aria-label={t('resume')}>▶</button>}
      </div>

      <div className="player-info">
        <div className="seg-timer">{fmt(segLeft)}</div>
        <div className="names">
          {isRest && <div className="move-name">{t('rest')}</div>}
          {move && <div className="move-name">{moveName(move, { lang, sanskrit: false })}{seg.side ? ` · ${seg.side === 'right' ? '→' : '←'}` : ''}</div>}
          {move?.sanskrit && <div className="sanskrit">{move.sanskrit}</div>}
          {nextMove && <div className="next">{t('upNext')}: {moveName(nextMove, { lang, sanskrit: false })}</div>}
        </div>
        {move && move.id !== 'savasana' && (
          <div className="prefs">
            <button className={`chip ${pref === 'like' ? 'on' : ''}`} onClick={() => (pref === 'like' ? clearPref(move.id) : likeMove(move.id))} title={t('likedNote')}>♥</button>
            <button className={`chip ${pref === 'dislike' ? 'on bad' : ''}`} onClick={() => (pref === 'dislike' ? clearPref(move.id) : dislikeMove(move.id))} title={t('dislikedNote')}>⊘</button>
          </div>
        )}
      </div>

      <div className="progress"><div style={{ width: `${(elapsed / session.totalSeconds) * 100}%` }} /></div>
      <div className="time-row"><span>{fmt(elapsed)}</span><span>-{fmt(session.totalSeconds - elapsed)}</span></div>

      <div className="controls">
        <button className="round" onClick={() => seek(idx - 1)} aria-label={t('prev')}>⏮</button>
        <button className="round big" onClick={togglePause} aria-label={paused ? t('resume') : t('pause')}>{paused ? '▶' : '❚❚'}</button>
        <button className="round" onClick={() => seek(idx + 1)} aria-label={t('next')}>⏭</button>
      </div>
      <div className="controls small">
        <label className="toggle"><input type="checkbox" checked={showSubs} onChange={(e) => setShowSubs(e.target.checked)} /> {t('subtitles')}</label>
        <label className="vol mix" title={t('musicVoiceMix')}>
          <span aria-hidden>🎵</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            aria-label={t('musicVoiceMix')}
            defaultValue={audio.voiceMix ?? 0.5}
            onChange={(e) => {
              const mix = +e.target.value;
              music.current?.setVolume(getState().audio.musicVolume * musicShare(mix));
              setVoiceVolume(voiceShare(mix));
              setState((s) => ({ audio: { ...s.audio, voiceMix: mix } }));
            }}
          />
          <span aria-hidden>🗣️</span>
        </label>
      </div>
      <div className="controls small music-row">
        <select
          className="genre-pick"
          aria-label={t('musicGenre')}
          value={audio.genre}
          onChange={(e) => {
            const g = e.target.value as MusicGenre;
            setState((s) => ({ audio: { ...s.audio, genre: g } }));
            music.current?.start(g, session.discipline);
          }}
        >
          {(PLAYER_GENRES.includes(audio.genre) ? PLAYER_GENRES : [audio.genre, ...PLAYER_GENRES]).map((g) => (
            <option key={g} value={g}>{t(`g_${g}`)}</option>
          ))}
        </select>
        <button className="chip" onClick={() => music.current?.nextTrack()} disabled={audio.genre === 'silent' || audio.genre === 'local'} aria-label={t('nextSong')}>
          ⏭ {t('nextSong')}
        </button>
      </div>
    </div>
  );
}

function AudioVisual({ session, idx, se }: { session: Session; idx: number; se: number }) {
  const seg = session.segments[idx];
  let scale = 0.75 + 0.15 * Math.sin((2 * Math.PI * se) / 10);
  let label = '';
  if (seg.kind === 'breath' && seg.pattern) {
    const [a, b, c, d] = seg.pattern;
    const cyc = a + b + c + d;
    const x = se % cyc;
    if (x < a) scale = 0.5 + 0.5 * (x / a);
    else if (x < a + b) scale = 1;
    else if (x < a + b + c) scale = 1 - 0.5 * ((x - a - b) / c);
    else scale = 0.5;
    const words = breathWords(session.lang);
    const p = x < a ? 0 : x < a + b ? 1 : x < a + b + c ? 2 : 3;
    const rem = [a, a + b, a + b + c, cyc][p] - x;
    label = `${words[p]} · ${Math.ceil(rem)}`;
  }
  if (seg.bellEvery !== undefined || seg.phase === 'timer') label = fmt(seg.duration - se);
  return (
    <div className="audio-visual">
      <div className="orb" style={{ transform: `scale(${scale})` }} />
      {label && <div className="orb-label">{label}</div>}
    </div>
  );
}

function Summary({ session, active, early, startedAt, onDone }: { session: Session; active: number[]; early: boolean; startedAt: Date; onDone: () => void }) {
  const t = useT();
  const lang = useLang();
  const weight = useStore((s) => s.weightKg);
  const likes = useStore((s) => s.likes);
  const dislikes = useStore((s) => s.dislikes);
  const [notes, setNotes] = useState('');
  const practised = active.reduce((a, x) => a + x, 0);
  const kcal = estimateCalories(session, active, weight);
  const minutes = Math.round((practised / 60) * 10) / 10;
  // only what was actually practised
  const done = session.segments.filter((s, i) => active[i] > 3 && s.kind !== 'rest');
  const moves = [...new Set(done.map((s) => s.moveId).filter(Boolean) as string[])]
    .map(getMove)
    .filter((m) => m && m.id !== 'savasana') as NonNullable<ReturnType<typeof getMove>>[];

  const save = async () => {
    const end = new Date(startedAt.getTime() + practised * 1000);
    setState((s) => ({
      history: [
        { id: session.id, date: startedAt.toISOString(), discipline: session.discipline, variant: session.variant, minutes: Math.max(1, Math.round(minutes)), kcal, notes },
        ...s.history.filter((h) => h.id !== session.id),
      ],
    }));
    if (getState().health.enabled) await logToHealth(session, startedAt, end, kcal);
    onDone();
  };

  return (
    <div className="summary">
      <h1>{early ? t('sessionEnded') : `${t('complete')} 🌿`}</h1>
      <div className="stats">
        <div><strong>{minutes < 10 ? minutes.toFixed(1) : Math.round(minutes)}</strong><span>{t('minutes')}</span></div>
        <div><strong>{kcal}</strong><span>{t('calories')}</span></div>
        {moves.length > 0 && <div><strong>{moves.length}</strong><span>{t('poses')}</span></div>}
      </div>
      {moves.length > 0 && (
        <>
          <h3>{t('ratePoses')}</h3>
          <ul className="rate-list">
            {moves.map((m) => {
              const p = likes.includes(m.id) ? 'like' : dislikes.includes(m.id) ? 'dislike' : null;
              return (
                <li key={m.id}>
                  <span>{moveName(m, { lang, sanskrit: false })}</span>
                  <span>
                    <button className={`chip ${p === 'like' ? 'on' : ''}`} onClick={() => (p === 'like' ? clearPref(m.id) : likeMove(m.id))}>♥</button>
                    <button className={`chip ${p === 'dislike' ? 'on bad' : ''}`} onClick={() => (p === 'dislike' ? clearPref(m.id) : dislikeMove(m.id))}>⊘</button>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <h3>{t('notes')}</h3>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('notesPh')} rows={3} />
      {practised >= 30 ? (
        <>
          <button className="primary wide" onClick={save}>{t('saveJournal')}</button>
          <button className="ghost wide discard" onClick={onDone}>{t('discard')}</button>
        </>
      ) : (
        <button className="primary wide" onClick={onDone}>{t('discard')}</button>
      )}
    </div>
  );
}
