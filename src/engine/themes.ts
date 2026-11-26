/** Meditation themes ("Scegli il tuo tema"): an opening line and guidance woven into the meditation. Italian and English. */
type Bi = { en: string; it: string };

export const MED_THEMES = ['beginners', 'selfCompassion', 'selfEsteem', 'selfCare', 'stressRelax', 'anxiety', 'difficultEmotions', 'growth', 'innerPeace', 'lettingGo', 'presence', 'buddhism', 'positiveVoice'] as const;
export type MedTheme = (typeof MED_THEMES)[number];
/** 'any' picks a theme for each session, 'none' uses only the goal's guidance. */
export type MedThemeChoice = MedTheme | 'any' | 'none';

export const THEME_TEXT: Record<MedTheme, { intro: Bi; body: Bi[] }> = {
  beginners: {
    intro: { en: 'There is nothing to get right today. Meditation is simply noticing, and gently coming back.', it: 'Oggi non c\'è niente da fare nel modo giusto. Meditare è semplicemente notare, e tornare con gentilezza.' },
    body: [
      { en: 'If the mind wanders, that is normal. Noticing it is already meditation.', it: 'Se la mente vaga, è normale. Accorgersene è già meditazione.' },
      { en: 'Rest your attention on the breath, without changing it.', it: 'Appoggia l\'attenzione sul respiro, senza cambiarlo.' },
      { en: 'You can count the breaths: one on the inhale, two on the exhale, up to ten.', it: 'Puoi contare i respiri: uno inspirando, due espirando, fino a dieci.' },
      { en: 'Each time you come back, you are training the mind, like a muscle.', it: 'Ogni volta che torni, alleni la mente, come un muscolo.' },
      { en: 'There is no special state to reach. Just this breath, then the next.', it: 'Non c\'è uno stato speciale da raggiungere. Solo questo respiro, poi il prossimo.' },
    ],
  },
  selfCompassion: {
    intro: { en: 'Today we offer ourselves the same kindness we would offer a good friend.', it: 'Oggi offriamo a noi stessi la stessa gentilezza che offriremmo a un buon amico.' },
    body: [
      { en: 'Silently repeat: may I be kind to myself in this moment.', it: 'Ripeti in silenzio: che io possa essere gentile con me stesso in questo momento.' },
      { en: 'If something is hard right now, acknowledge it: this is a moment of difficulty.', it: 'Se qualcosa è difficile adesso, riconoscilo: questo è un momento di fatica.' },
      { en: 'Remember that struggling is part of being human. You are not alone in this.', it: 'Ricorda che fare fatica fa parte dell\'essere umani. Non sei solo in questo.' },
      { en: 'Place a hand where it feels comforting, and feel its warmth.', it: 'Appoggia una mano dove ti dà conforto e senti il suo calore.' },
      { en: 'Now extend this wish to someone you love: may you be well, may you be at peace.', it: 'Ora estendi questo augurio a una persona cara: che tu stia bene, che tu sia in pace.' },
    ],
  },
  selfEsteem: {
    intro: { en: 'This practice is about recognising your own worth, just as you are.', it: 'Questa pratica serve a riconoscere il tuo valore, così come sei.' },
    body: [
      { en: 'Sit tall, as someone who deserves the space they occupy.', it: 'Siediti dritto, come chi merita lo spazio che occupa.' },
      { en: 'Recall a moment when you handled something well. Notice how it feels in the body.', it: 'Ricorda un momento in cui hai gestito bene qualcosa. Nota come lo senti nel corpo.' },
      { en: 'Silently say: I am enough, as I am, today.', it: 'Di\' in silenzio: io sono abbastanza, così come sono, oggi.' },
      { en: 'Notice any voice that disagrees, and let it speak without believing it.', it: 'Nota se una voce non è d\'accordo, e lasciala parlare senza crederle.' },
      { en: 'Feel the steadiness of your breath. It has carried you through everything so far.', it: 'Senti la stabilità del respiro. Ti ha accompagnato in tutto, finora.' },
    ],
  },
  selfCare: {
    intro: { en: 'Taking these minutes for yourself is already an act of care.', it: 'Prenderti questi minuti per te è già un atto di cura.' },
    body: [
      { en: 'Ask yourself gently: what do I need right now?', it: 'Chiediti con gentilezza: di cosa ho bisogno adesso?' },
      { en: 'Scan the body and notice where it asks for rest.', it: 'Percorri il corpo e nota dove chiede riposo.' },
      { en: 'Let the exhale be a small gift you give yourself.', it: 'Lascia che l\'espirazione sia un piccolo regalo che ti fai.' },
      { en: 'Think of one simple thing you can do for yourself later today.', it: 'Pensa a una cosa semplice che potrai fare per te più tardi oggi.' },
      { en: 'You do not have to earn rest. You are allowed to pause.', it: 'Il riposo non va guadagnato. Hai il permesso di fermarti.' },
    ],
  },
  stressRelax: {
    intro: { en: 'Let\'s put the to-do list down for a few minutes. It will still be there later.', it: 'Mettiamo da parte la lista delle cose da fare per qualche minuto. Sarà ancora lì dopo.' },
    body: [
      { en: 'Breathe in through the nose, and sigh out slowly through the mouth.', it: 'Inspira dal naso ed espira lentamente dalla bocca, come un sospiro.' },
      { en: 'Unclench the jaw, drop the shoulders, soften the hands.', it: 'Sciogli la mascella, abbassa le spalle, ammorbidisci le mani.' },
      { en: 'Make the exhale a little longer than the inhale. This tells the body it is safe.', it: 'Rendi l\'espirazione un po\' più lunga dell\'inspirazione. Dice al corpo che è al sicuro.' },
      { en: 'Notice the ground supporting you. You can let it do the work.', it: 'Nota il pavimento che ti sostiene. Puoi lasciare che faccia lui il lavoro.' },
      { en: 'With each breath out, let go of a little more effort.', it: 'A ogni espirazione lascia andare un po\' più di sforzo.' },
    ],
  },
  anxiety: {
    intro: { en: 'If you feel anxious, that is okay. We will simply find a steady place to rest.', it: 'Se senti ansia, va bene. Troveremo semplicemente un punto stabile su cui appoggiarci.' },
    body: [
      { en: 'Feel your feet. Press them gently into the floor.', it: 'Senti i piedi. Premili delicatamente contro il pavimento.' },
      { en: 'Name five things you can hear, one at a time.', it: 'Nomina cinque cose che riesci a sentire, una alla volta.' },
      { en: 'Breathe in for four, and out for six. Slow and steady.', it: 'Inspira contando fino a quattro, espira fino a sei. Lento e regolare.' },
      { en: 'Anxious thoughts are not facts. Let them pass like cars on a road.', it: 'I pensieri ansiosi non sono fatti. Lasciali passare come auto su una strada.' },
      { en: 'Right here, in this breath, you are okay.', it: 'Proprio qui, in questo respiro, stai bene.' },
    ],
  },
  difficultEmotions: {
    intro: { en: 'Today we make room for what we feel, even when it is uncomfortable.', it: 'Oggi facciamo spazio a ciò che sentiamo, anche quando è scomodo.' },
    body: [
      { en: 'Notice the emotion that is here. Where do you feel it in the body?', it: 'Nota l\'emozione presente. Dove la senti nel corpo?' },
      { en: 'Give it a name, softly: this is sadness, this is anger, this is fear.', it: 'Dalle un nome, con delicatezza: questa è tristezza, questa è rabbia, questa è paura.' },
      { en: 'Breathe around the sensation, as if making space for it.', it: 'Respira intorno alla sensazione, come per farle spazio.' },
      { en: 'You do not need to fix it. Just let it be felt.', it: 'Non devi risolverla. Lascia solo che venga sentita.' },
      { en: 'Emotions are like weather. They move through, and they change.', it: 'Le emozioni sono come il tempo atmosferico. Passano e cambiano.' },
    ],
  },
  growth: {
    intro: { en: 'This practice invites curiosity about who you are becoming.', it: 'Questa pratica invita alla curiosità verso la persona che stai diventando.' },
    body: [
      { en: 'Think of one quality you would like to grow in yourself.', it: 'Pensa a una qualità che vorresti far crescere in te.' },
      { en: 'Imagine a day where you live this quality a little more.', it: 'Immagina una giornata in cui vivi questa qualità un po\' di più.' },
      { en: 'Notice any resistance, and meet it with patience.', it: 'Nota se c\'è resistenza e accoglila con pazienza.' },
      { en: 'Growth happens in small steps, one breath, one choice at a time.', it: 'La crescita avviene a piccoli passi, un respiro, una scelta alla volta.' },
      { en: 'Set a simple intention to carry with you after this practice.', it: 'Scegli un\'intenzione semplice da portare con te dopo questa pratica.' },
    ],
  },
  innerPeace: {
    intro: { en: 'Beneath the busy surface of the mind there is a quiet place. Let\'s rest there.', it: 'Sotto la superficie agitata della mente c\'è un luogo quieto. Riposiamo lì.' },
    body: [
      { en: 'Imagine the mind as a lake. With each breath the water grows still.', it: 'Immagina la mente come un lago. A ogni respiro l\'acqua si fa più calma.' },
      { en: 'Notice the silence between sounds.', it: 'Nota il silenzio tra un suono e l\'altro.' },
      { en: 'Let the breath become soft and quiet, almost by itself.', it: 'Lascia che il respiro diventi morbido e silenzioso, quasi da solo.' },
      { en: 'There is nothing to do and nowhere to go.', it: 'Non c\'è niente da fare e nessun posto dove andare.' },
      { en: 'Rest in this stillness. It is always available to you.', it: 'Riposa in questa quiete. È sempre a tua disposizione.' },
    ],
  },
  lettingGo: {
    intro: { en: 'Today we practise loosening our grip, on the body and on our thoughts.', it: 'Oggi pratichiamo l\'allentare la presa, sul corpo e sui pensieri.' },
    body: [
      { en: 'Notice what you are holding on to right now, a worry, a plan, a tension.', it: 'Nota a cosa ti stai aggrappando adesso: una preoccupazione, un piano, una tensione.' },
      { en: 'On the exhale, imagine opening your hand and letting it rest.', it: 'Espirando, immagina di aprire la mano e lasciarla riposare.' },
      { en: 'You can pick it up again later. For now, set it down.', it: 'Potrai riprenderla dopo. Per ora, appoggiala.' },
      { en: 'Let each thought arrive and leave, like leaves on a stream.', it: 'Lascia che ogni pensiero arrivi e se ne vada, come foglie su un ruscello.' },
      { en: 'Feel the lightness that comes from not holding.', it: 'Senti la leggerezza che nasce dal non trattenere.' },
    ],
  },
  presence: {
    intro: { en: 'This practice brings you back to the only moment there is: now.', it: 'Questa pratica ti riporta all\'unico momento che esiste: adesso.' },
    body: [
      { en: 'Notice three sensations in the body right now.', it: 'Nota tre sensazioni nel corpo in questo momento.' },
      { en: 'Feel the temperature of the air on your skin.', it: 'Senti la temperatura dell\'aria sulla pelle.' },
      { en: 'When the mind jumps to the future or the past, gently say: here.', it: 'Quando la mente salta al futuro o al passato, di\' dolcemente: qui.' },
      { en: 'Follow one whole breath, from beginning to end.', it: 'Segui un respiro intero, dall\'inizio alla fine.' },
      { en: 'This moment is enough. Let yourself fully arrive in it.', it: 'Questo momento è sufficiente. Lascia che tu ci arrivi completamente.' },
    ],
  },
  buddhism: {
    intro: { en: 'Today we draw on simple teachings from the Buddhist tradition: awareness, impermanence and loving-kindness.', it: 'Oggi attingiamo a insegnamenti semplici della tradizione buddhista: consapevolezza, impermanenza e gentilezza amorevole.' },
    body: [
      { en: 'Observe the breath arising and passing away. Nothing stays the same.', it: 'Osserva il respiro che sorge e svanisce. Nulla resta uguale.' },
      { en: 'Notice sensations as pleasant, unpleasant or neutral, without chasing or pushing away.', it: 'Nota le sensazioni come piacevoli, spiacevoli o neutre, senza inseguirle né respingerle.' },
      { en: 'Thoughts are events in the mind, not who you are.', it: 'I pensieri sono eventi nella mente, non sono ciò che sei.' },
      { en: 'Silently wish: may all beings be happy, may all beings be free from suffering.', it: 'Augura in silenzio: che tutti gli esseri siano felici, che tutti gli esseri siano liberi dalla sofferenza.' },
      { en: 'Rest in awareness itself, open and spacious like the sky.', it: 'Riposa nella consapevolezza stessa, aperta e spaziosa come il cielo.' },
    ],
  },
  positiveVoice: {
    intro: { en: 'We all talk to ourselves. Today we practise a kinder inner voice.', it: 'Tutti parliamo a noi stessi. Oggi alleniamo una voce interiore più gentile.' },
    body: [
      { en: 'Notice the tone of your inner voice right now, without judging it.', it: 'Nota il tono della tua voce interiore adesso, senza giudicarlo.' },
      { en: 'Imagine it speaking like an encouraging coach.', it: 'Immagina che parli come un allenatore che incoraggia.' },
      { en: 'Silently say: I am doing my best, and that is enough.', it: 'Di\' in silenzio: sto facendo del mio meglio, ed è abbastanza.' },
      { en: 'Replace "I have to" with "I choose to", and notice how it feels.', it: 'Sostituisci "devo" con "scelgo di", e nota come ti senti.' },
      { en: 'Let one kind sentence to yourself echo with each breath.', it: 'Lascia che una frase gentile verso di te risuoni a ogni respiro.' },
    ],
  },
};
