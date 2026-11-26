/**
 * Yoga Nidra and Meditation generators (audio-first sessions).
 * Long-form guidance scripts are written in Italian and English; other languages fall back to English.
 */
import { Rng } from './rng';
import type { Cue, Lang, Segment, Session } from './types';

type Bi = { en: string; it: string };
const pickLang = (lang: Lang): 'en' | 'it' => (lang === 'it' ? 'it' : 'en');
export const scriptLang = pickLang;

// ───────────────────────────── Yoga Nidra ─────────────────────────────

const NIDRA = {
  settle: [
    { en: 'Lie down on your back and make yourself completely comfortable. Cover yourself if you like.', it: 'Sdraiati sulla schiena e mettiti completamente comodo. Copriti se lo desideri.' },
    { en: 'Let the eyes close. Let the body be still. This is a time to do nothing at all.', it: 'Lascia che gli occhi si chiudano. Lascia il corpo immobile. Questo è un tempo in cui non fare nulla.' },
    { en: 'Notice the sounds around you, the furthest first, then the closest. Let them come and go.', it: 'Ascolta i suoni intorno a te, prima i più lontani, poi i più vicini. Lasciali andare e venire.' },
    { en: 'Feel the points where your body touches the ground. Let the ground hold you.', it: 'Senti i punti in cui il corpo tocca il pavimento. Lascia che il pavimento ti sostenga.' },
  ] as Bi[],
  sankalpa: [
    { en: 'Now find a short positive intention, a sankalpa. Repeat it silently three times, with feeling.', it: 'Ora trova una breve intenzione positiva, un sankalpa. Ripetila mentalmente tre volte, con sentimento.' },
    { en: 'Bring to mind a simple resolve, something you wish for your life. Say it inwardly, three times.', it: 'Porta alla mente un semplice proposito, qualcosa che desideri per la tua vita. Ripetilo interiormente tre volte.' },
  ] as Bi[],
  rotationIntro: { en: 'We now rotate awareness through the body. Simply move your attention to each part as it is named.', it: 'Ora facciamo ruotare la consapevolezza nel corpo. Porta semplicemente l\'attenzione a ogni parte nominata.' } as Bi,
  bodyParts: {
    en: ['right hand thumb', 'second finger', 'third finger', 'fourth finger', 'little finger', 'palm of the hand', 'back of the hand', 'wrist', 'forearm', 'elbow', 'upper arm', 'shoulder', 'armpit', 'right side of the waist', 'right hip', 'thigh', 'knee', 'shin', 'ankle', 'heel', 'sole of the foot', 'big toe', 'all the toes together'],
    it: ['pollice della mano destra', 'secondo dito', 'terzo dito', 'quarto dito', 'mignolo', 'palmo della mano', 'dorso della mano', 'polso', 'avambraccio', 'gomito', 'parte alta del braccio', 'spalla', 'ascella', 'fianco destro', 'anca destra', 'coscia', 'ginocchio', 'stinco', 'caviglia', 'tallone', 'pianta del piede', 'alluce', 'tutte le dita insieme'],
  },
  head: {
    en: ['the top of the head', 'the forehead', 'right eyebrow', 'left eyebrow', 'the space between the eyebrows', 'right eye', 'left eye', 'the nose', 'the upper lip', 'the lower lip', 'the chin', 'the throat', 'the chest', 'the navel', 'the whole back', 'the whole body', 'the whole body together'],
    it: ['la sommità della testa', 'la fronte', 'sopracciglio destro', 'sopracciglio sinistro', 'lo spazio tra le sopracciglia', 'occhio destro', 'occhio sinistro', 'il naso', 'il labbro superiore', 'il labbro inferiore', 'il mento', 'la gola', 'il petto', 'l\'ombelico', 'tutta la schiena', 'tutto il corpo', 'tutto il corpo insieme'],
  },
  breath: [
    { en: 'Become aware of the natural breath. Now count backwards from twenty-seven: I am breathing in twenty-seven, I am breathing out twenty-seven. If you lose count, start again.', it: 'Diventa consapevole del respiro naturale. Ora conta all\'indietro da ventisette: inspiro ventisette, espiro ventisette. Se perdi il conto, ricomincia.' },
    { en: 'Feel the breath moving in the belly. Rising with the inhale, falling with the exhale. Just watch.', it: 'Senti il respiro che si muove nell\'addome. Sale con l\'inspirazione, scende con l\'espirazione. Osserva soltanto.' },
    { en: 'Imagine the breath flowing up the front of the body as you inhale, and down as you exhale, like a gentle tide.', it: 'Immagina il respiro che sale lungo la parte anteriore del corpo inspirando e scende espirando, come una marea gentile.' },
  ] as Bi[],
  opposites: [
    { en: 'Awaken the feeling of heaviness. The body is heavy, sinking into the floor… Now lightness. The body is light, as if floating.', it: 'Risveglia la sensazione di pesantezza. Il corpo è pesante, sprofonda nel pavimento… Ora leggerezza. Il corpo è leggero, come se fluttuasse.' },
    { en: 'Recall the feeling of cold, a winter morning… Now warmth, the sun on your skin on a summer day.', it: 'Ricorda la sensazione del freddo, un mattino d\'inverno… Ora il calore, il sole sulla pelle in un giorno d\'estate.' },
  ] as Bi[],
  images: {
    en: ['a calm lake at dawn', 'a candle flame', 'a mountain covered with snow', 'waves on a sandy beach', 'a forest after rain', 'a starry night sky', 'a field of sunflowers', 'a white bird flying', 'a stone path in a garden', 'the full moon', 'an old wooden boat', 'a golden sunset', 'a quiet temple', 'clouds drifting slowly', 'a warm fireplace'],
    it: ['un lago calmo all\'alba', 'la fiamma di una candela', 'una montagna innevata', 'onde su una spiaggia di sabbia', 'un bosco dopo la pioggia', 'un cielo stellato', 'un campo di girasoli', 'un uccello bianco in volo', 'un sentiero di pietra in un giardino', 'la luna piena', 'una vecchia barca di legno', 'un tramonto dorato', 'un tempio silenzioso', 'nuvole che passano lente', 'un caminetto acceso'],
  },
  visualIntro: { en: 'Now let images pass through the mind. Visualise them as clearly as you can, without effort.', it: 'Ora lascia passare delle immagini nella mente. Visualizzale il più chiaramente possibile, senza sforzo.' } as Bi,
  sankalpaReturn: { en: 'Now remember your sankalpa, the intention you made at the beginning. Repeat it three times.', it: 'Ora ricorda il tuo sankalpa, l\'intenzione espressa all\'inizio. Ripetilo tre volte.' } as Bi,
  wake: { en: 'Slowly become aware of the body again, of the floor beneath you, of the room around you. Move the fingers and toes. When you are ready, roll to one side and open your eyes. Yoga Nidra is complete.', it: 'Lentamente torna consapevole del corpo, del pavimento sotto di te, della stanza intorno. Muovi le dita delle mani e dei piedi. Quando sei pronto, rotola su un fianco e apri gli occhi. Lo Yoga Nidra è concluso.' } as Bi,
  sleep: { en: 'There is nothing left to do. Let the practice dissolve and allow yourself to drift into deep, restful sleep.', it: 'Non c\'è più nulla da fare. Lascia che la pratica si dissolva e permetti a te stesso di scivolare in un sonno profondo e riposante.' } as Bi,
};

const seg = (title: string, phase: string, duration: number, cues: Cue[], kind: Segment['kind'] = 'audio'): Segment => ({
  kind,
  title,
  phase,
  duration: Math.round(duration),
  intensity: 0,
  cues,
});

/** Spread a list of short utterances across a duration. */
const spread = (texts: string[], duration: number, startPad = 2): Cue[] => {
  const gap = (duration - startPad) / Math.max(1, texts.length);
  return texts.map((t, i) => ({ at: startPad + i * gap, text: t }));
};

export function generateNidra(minutes: number, sleep: boolean, lang: Lang, seed: number): Session {
  const r = new Rng(seed);
  const L = pickLang(lang);
  const T = Math.max(8, minutes) * 60;
  const parts = { settle: 0.12, sankalpa: 0.06, rotation: 0.3, breath: 0.14, opposites: 0.1, visual: 0.14, sankalpa2: 0.05, end: 0.09 };
  const d = (k: keyof typeof parts) => T * parts[k];
  const rightParts = NIDRA.bodyParts[L];
  const leftParts = rightParts.map((p) => (L === 'en' ? p.replace('right', 'left') : p.replace('destr', 'sinistr')));
  const [parts1, parts2] = r.chance(0.5) ? [rightParts, leftParts] : [leftParts, rightParts];
  const settle = r.shuffle(NIDRA.settle).slice(0, 3).map((x) => x[L]);
  const imgs = r.shuffle(NIDRA.images[L]).slice(0, Math.round(6 + minutes / 6));
  const T_ = (en: string, it: string) => (L === 'it' ? it : en);
  const segs: Segment[] = [
    seg(T_('Settling', 'Radicamento'), 'settle', d('settle'), spread(settle, d('settle'))),
    seg('Sankalpa', 'sankalpa', d('sankalpa'), [{ at: 1, text: r.pick(NIDRA.sankalpa)[L] }]),
    seg(T_('Rotation of consciousness', 'Rotazione della coscienza'), 'rotation', d('rotation'), spread([NIDRA.rotationIntro[L], ...parts1, ...parts2, ...NIDRA.head[L]], d('rotation'))),
    seg(T_('Breath', 'Respiro'), 'breath', d('breath'), [{ at: 1, text: r.pick(NIDRA.breath)[L] }]),
    seg(T_('Opposites', 'Opposti'), 'opposites', d('opposites'), [{ at: 1, text: r.pick(NIDRA.opposites)[L] }]),
    seg(T_('Visualisation', 'Visualizzazione'), 'visual', d('visual'), spread([NIDRA.visualIntro[L], ...imgs], d('visual'))),
    seg('Sankalpa', 'sankalpa', d('sankalpa2'), [{ at: 1, text: NIDRA.sankalpaReturn[L] }]),
    seg(sleep ? T_('Sleep', 'Sonno') : T_('Return', 'Ritorno'), 'end', d('end'), [{ at: 1, text: (sleep ? NIDRA.sleep : NIDRA.wake)[L] }]),
  ];
  return {
    id: `nidra-${seed}-${Date.now()}`,
    seed,
    createdAt: Date.now(),
    discipline: 'yoga',
    variant: 'nidra',
    title: 'nidra',
    lang,
    segments: segs,
    totalSeconds: segs.reduce((a, s) => a + s.duration, 0),
    audioOnly: true,
    config: { minutes, sleep },
  };
}

// ───────────────────────────── Meditation ─────────────────────────────

export type MeditationGoal = 'sleep' | 'stress' | 'focus' | 'breath' | 'timer';
export type BreathPattern = 'box' | '478' | 'coherent' | 'calm';
export const BREATH_PATTERNS: Record<BreathPattern, number[]> = {
  box: [4, 4, 4, 4],
  '478': [4, 7, 8, 0],
  coherent: [5.5, 0, 5.5, 0],
  calm: [4, 0, 6, 0],
};

export interface MeditationConfig {
  goal: MeditationGoal;
  minutes: number;
  /** seconds of silence between guidance lines */
  silence: number;
  pattern: BreathPattern;
  /** timer: interval bell in minutes (0 = only start/end) */
  bellMinutes: number;
  lang: Lang;
}

export const DEFAULT_MEDITATION: MeditationConfig = { goal: 'stress', minutes: 10, silence: 30, pattern: 'box', bellMinutes: 0, lang: 'it' };

const MED: Record<Exclude<MeditationGoal, 'timer'>, { intro: Bi[]; body: Bi[]; close: Bi[] }> = {
  sleep: {
    intro: [{ en: 'Lie down comfortably and let the day come to an end. There is nowhere else to be.', it: 'Sdraiati comodamente e lascia che la giornata si concluda. Non c\'è nessun altro posto in cui essere.' }],
    body: [
      { en: 'Let each exhale be a little longer than the inhale.', it: 'Lascia che ogni espirazione sia un po\' più lunga dell\'inspirazione.' },
      { en: 'Feel the weight of the body sinking into the bed.', it: 'Senti il peso del corpo che sprofonda nel letto.' },
      { en: 'Relax the jaw, the tongue, the space behind the eyes.', it: 'Rilassa la mascella, la lingua, lo spazio dietro gli occhi.' },
      { en: 'If thoughts arise, imagine them as clouds drifting across a night sky.', it: 'Se arrivano pensieri, immaginali come nuvole che attraversano il cielo notturno.' },
      { en: 'Relax the shoulders, the arms, the hands. Let them be heavy and warm.', it: 'Rilassa le spalle, le braccia, le mani. Lasciale pesanti e calde.' },
      { en: 'Soften the belly. Let the breath slow down on its own.', it: 'Ammorbidisci la pancia. Lascia che il respiro rallenti da solo.' },
      { en: 'Count each exhale from ten down to one, and begin again.', it: 'Conta ogni espirazione da dieci a uno, e ricomincia.' },
    ],
    close: [{ en: 'Now let go of the practice completely, and drift into sleep.', it: 'Ora lascia andare completamente la pratica e scivola nel sonno.' }],
  },
  stress: {
    intro: [{ en: 'Find a comfortable seat. Close the eyes or soften the gaze. Take three deep breaths, sighing out through the mouth.', it: 'Trova una posizione comoda. Chiudi gli occhi o abbassa lo sguardo. Fai tre respiri profondi, espirando dalla bocca.' }],
    body: [
      { en: 'Notice where you are holding tension right now, and breathe into that place.', it: 'Nota dove stai trattenendo tensione in questo momento e respira in quel punto.' },
      { en: 'With each exhale, let the shoulders drop a little more.', it: 'Con ogni espirazione lascia scendere le spalle un po\' di più.' },
      { en: 'Name what you are feeling, gently, without judgement. And let it be.', it: 'Dai un nome a ciò che senti, con gentilezza, senza giudizio. E lascia che sia.' },
      { en: 'Place a hand on the heart. Feel its warmth. You are safe in this moment.', it: 'Appoggia una mano sul cuore. Senti il suo calore. In questo momento sei al sicuro.' },
      { en: 'Breathe in calm. Breathe out what you don\'t need.', it: 'Inspira calma. Espira ciò che non ti serve.' },
      { en: 'Come back to the breath every time the mind wanders. That return is the practice.', it: 'Torna al respiro ogni volta che la mente si distrae. Quel ritorno è la pratica.' },
      { en: 'Feel the feet on the ground, steady and supported.', it: 'Senti i piedi a terra, stabili e sostenuti.' },
    ],
    close: [{ en: 'Take a deeper breath. Notice how you feel now. Gently open your eyes when you are ready.', it: 'Fai un respiro più profondo. Nota come ti senti ora. Apri dolcemente gli occhi quando sei pronto.' }],
  },
  focus: {
    intro: [{ en: 'Sit upright and alert. Choose one point of focus: the sensation of the breath at the nostrils.', it: 'Siediti dritto e vigile. Scegli un unico punto di attenzione: la sensazione del respiro alle narici.' }],
    body: [
      { en: 'Feel the cool air coming in, the warm air going out.', it: 'Senti l\'aria fresca che entra, l\'aria calda che esce.' },
      { en: 'When you notice the mind has wandered, note "thinking" and return.', it: 'Quando noti che la mente si è distratta, annota "pensiero" e ritorna.' },
      { en: 'Count breaths from one to ten. If you lose count, start again at one.', it: 'Conta i respiri da uno a dieci. Se perdi il conto, ricomincia da uno.' },
      { en: 'Keep the attention light but steady, like holding a bird in your hand.', it: 'Mantieni l\'attenzione leggera ma stabile, come tenere un uccellino in mano.' },
      { en: 'Notice the tiny pause at the end of each exhale.', it: 'Nota la piccola pausa alla fine di ogni espirazione.' },
      { en: 'Sharpen the attention: notice the very beginning of each inhale.', it: 'Affina l\'attenzione: nota l\'inizio esatto di ogni inspirazione.' },
    ],
    close: [{ en: 'Let go of the counting. Carry this clarity into what comes next.', it: 'Lascia andare il conteggio. Porta questa chiarezza in ciò che farai dopo.' }],
  },
  breath: {
    intro: [{ en: 'Sit comfortably with a long spine. Follow the rhythm on the screen and the voice.', it: 'Siediti comodamente con la colonna lunga. Segui il ritmo sullo schermo e la voce.' }],
    body: [],
    close: [{ en: 'Release the pattern and let the breath return to its natural rhythm.', it: 'Lascia andare lo schema e permetti al respiro di tornare al suo ritmo naturale.' }],
  },
};

const BREATH_WORDS: Record<'en' | 'it', string[]> = {
  en: ['Breathe in', 'Hold', 'Breathe out', 'Hold'],
  it: ['Inspira', 'Trattieni', 'Espira', 'Trattieni'],
};
export const breathWords = (lang: Lang) => BREATH_WORDS[pickLang(lang)];

export function generateMeditation(cfg: MeditationConfig, seed: number): Session {
  const r = new Rng(seed);
  const L = pickLang(cfg.lang);
  const T = Math.max(1, cfg.minutes) * 60;
  const segs: Segment[] = [];

  if (cfg.goal === 'timer') {
    segs.push({ kind: 'audio', title: 'Timer', phase: 'timer', duration: T, intensity: 0, cues: [], bellEvery: cfg.bellMinutes * 60 || undefined });
  } else if (cfg.goal === 'breath') {
    const pat = BREATH_PATTERNS[cfg.pattern];
    const intro = Math.min(20, T * 0.1);
    const outro = Math.min(20, T * 0.1);
    segs.push(seg(L === 'it' ? 'Introduzione' : 'Intro', 'intro', intro, [{ at: 0.5, text: MED.breath.intro[0][L] }]));
    segs.push({ kind: 'breath', title: cfg.pattern, phase: 'breath', duration: Math.round(T - intro - outro), intensity: 0.1, cues: [], pattern: pat });
    segs.push(seg(L === 'it' ? 'Chiusura' : 'Close', 'close', outro, [{ at: 0.5, text: MED.breath.close[0][L] }]));
  } else {
    const bank = MED[cfg.goal];
    const intro = Math.min(45, T * 0.12);
    const close = Math.min(40, T * 0.1);
    const body = T - intro - close;
    const lines = r.shuffle(bank.body);
    const cues: Cue[] = [];
    let t = 3;
    let i = 0;
    while (t < body - 10) {
      cues.push({ at: t, text: lines[i % lines.length][L] });
      i++;
      t += 8 + cfg.silence;
    }
    segs.push(seg(L === 'it' ? 'Introduzione' : 'Intro', 'intro', intro, [{ at: 0.5, text: bank.intro[0][L] }]));
    segs.push(seg(L === 'it' ? 'Pratica' : 'Practice', 'body', body, cues));
    segs.push(seg(L === 'it' ? 'Chiusura' : 'Close', 'close', close, [{ at: 0.5, text: bank.close[0][L] }]));
  }
  return {
    id: `med-${seed}-${Date.now()}`,
    seed,
    createdAt: Date.now(),
    discipline: 'meditation',
    variant: cfg.goal,
    title: cfg.goal,
    lang: cfg.lang,
    segments: segs,
    totalSeconds: segs.reduce((a, s) => a + s.duration, 0),
    audioOnly: true,
    config: cfg,
  };
}
