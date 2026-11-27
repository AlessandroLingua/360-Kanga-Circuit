import { translateCues } from '../../i18n/catalog';
import { buildPilatesCatalog } from './pilatesCatalog';
import { buildHiitCatalog } from './hiitCatalog';
import type { FocusArea, L10n, Move, Position } from '../types';

const n = (en: string, it: string, es: string, fr: string, de: string, pt: string): L10n => ({ en, it, es, fr, de, pt });
const c = (en: string, it: string): L10n => ({ en, it });

type Def = {
  id: string;
  name: L10n;
  cue: L10n;
  position: Position;
  level: 1 | 2 | 3 | 4 | 5;
  intensity: number;
  focus: FocusArea[];
  frames: number[][];
  met: number;
  bilateral?: boolean;
};

const STAND: number[] = [180, 180, 2, 0, -2, 0, 0, 0, 0, 0];
const PLANK: number[] = [114, 110, 0, 0, 0, 0, -66, -66, -66, -66];

const mk = (discipline: 'pilates' | 'hiit') => (d: Def): Move => ({ discipline, short: d.cue, ...d });

const p = mk('pilates');
const PILATES_CORE: Move[] = [
  p({ id: 'hundred', position: 'supine', level: 1, intensity: 3, met: 3.5, focus: ['core'],
    name: n('The Hundred', 'Il Cento', 'El Cien', 'Le Cent', 'Die Hundert', 'O Cem'),
    cue: c('Head and shoulders lifted, legs long at an angle, pump the arms: inhale for five, exhale for five.', 'Testa e spalle sollevate, gambe lunghe inclinate, pompa con le braccia: inspira per cinque, espira per cinque.'),
    frames: [[-105, -110, 80, 80, 80, 80, 130, 130, 130, 130], [-105, -110, 96, 96, 96, 96, 130, 130, 130, 130]] }),
  p({ id: 'rollUp', position: 'supine', level: 2, intensity: 3, met: 3.5, focus: ['core', 'spineMobility'],
    name: n('Roll Up', 'Roll Up', 'Roll Up', 'Enroulé', 'Aufrollen', 'Roll Up'),
    cue: c('Arms overhead, peel the spine off the mat one vertebra at a time and reach toward the toes, then roll back down.', 'Braccia sopra la testa, stacca la colonna una vertebra alla volta e allungati verso i piedi, poi torna giù srotolando.'),
    frames: [[-90, -90, -175, -175, -175, -175, 90, 90, 90, 90], [100, 95, 92, 92, 92, 92, 90, 90, 90, 90, 12]] }),
  p({ id: 'singleLegStretch', position: 'supine', level: 1, intensity: 3, met: 3.8, focus: ['core'],
    name: n('Single Leg Stretch', 'Allungamento gamba singola', 'Estiramiento de una pierna', 'Étirement d\'une jambe', 'Einbeinige Dehnung', 'Alongamento de uma perna'),
    cue: c('Curl up, draw one knee in and extend the other leg long, switching with control.', 'Solleva il busto, porta un ginocchio al petto e distendi l\'altra gamba, alternando con controllo.'),
    frames: [[-105, -110, 150, 170, 150, 170, -160, 90, 120, 120], [-105, -110, 150, 170, 150, 170, 120, 120, -160, 90]] }),
  p({ id: 'doubleLegStretch', position: 'supine', level: 2, intensity: 3.5, met: 4, focus: ['core', 'shoulders'],
    name: n('Double Leg Stretch', 'Allungamento doppia gamba', 'Estiramiento de dos piernas', 'Étirement des deux jambes', 'Doppelte Beindehnung', 'Alongamento duplo'),
    cue: c('Hug the knees in, then extend arms and legs away together, circle the arms and hug back in.', 'Abbraccia le ginocchia, poi distendi braccia e gambe insieme, ruota le braccia e torna ad abbracciare.'),
    frames: [[-105, -110, 160, 170, 160, 170, -155, 90, -155, 90], [-105, -110, -165, -165, -165, -165, 125, 125, 125, 125]] }),
  p({ id: 'crissCross', position: 'supine', level: 2, intensity: 3.5, met: 4, focus: ['core', 'twists'],
    name: n('Criss-Cross', 'Criss-Cross', 'Criss-Cross', 'Criss-Cross', 'Criss-Cross', 'Criss-Cross'),
    cue: c('Hands behind the head, twist the elbow toward the opposite knee as the other leg extends.', 'Mani dietro la testa, ruota il gomito verso il ginocchio opposto mentre l\'altra gamba si distende.'),
    frames: [[-110, -110, -150, 170, -150, 170, -160, 90, 120, 120], [-110, -110, -150, 170, -150, 170, 120, 120, -160, 90]] }),
  p({ id: 'spineStretch', position: 'seated', level: 1, intensity: 2, met: 2.8, focus: ['spineMobility', 'hamstrings'],
    name: n('Spine Stretch Forward', 'Allungamento della colonna', 'Estiramiento de columna', 'Étirement de la colonne', 'Wirbelsäulendehnung', 'Alongamento da coluna'),
    cue: c('Sit tall with legs apart, exhale and curl forward from the top of the head, then restack the spine.', 'Siedi alto a gambe aperte, espira e arrotolati in avanti dalla testa, poi riallinea la colonna.'),
    frames: [[180, 180, 90, 90, 90, 90, 90, 90, 90, 90], [110, 80, 92, 92, 92, 92, 90, 90, 90, 90, 15]] }),
  p({ id: 'saw', position: 'seated', level: 2, intensity: 2.5, met: 3, focus: ['twists', 'hamstrings'], bilateral: true,
    name: n('Saw', 'Sega', 'Sierra', 'Scie', 'Säge', 'Serrote'),
    cue: c('Arms wide, twist toward one leg and reach the pinky past the little toe as if sawing it off.', 'Braccia aperte, ruota verso una gamba e allunga il mignolo oltre il piede come per segarlo.'),
    frames: [[180, 180, -90, -90, 90, 90, 90, 90, 90, 90], [120, 100, -150, -150, 70, 70, 90, 90, 90, 90, 8]] }),
  p({ id: 'swan', position: 'prone', level: 2, intensity: 3, met: 3.2, focus: ['backbends', 'lowerBack'],
    name: n('Swan', 'Cigno', 'Cisne', 'Cygne', 'Schwan', 'Cisne'),
    cue: c('Hands under the shoulders, lengthen and lift the chest using the back, then lower with control.', 'Mani sotto le spalle, allungati e solleva il petto con la schiena, poi scendi con controllo.'),
    frames: [[100, 110, -20, 90, -20, 90, -90, -90, -90, -90], [140, 160, 5, 0, 5, 0, -90, -90, -90, -90, -10]] }),
  p({ id: 'swimming', position: 'prone', level: 2, intensity: 4, met: 4.5, focus: ['lowerBack', 'glutes', 'shoulders'],
    name: n('Swimming', 'Nuoto', 'Natación', 'Nage', 'Schwimmen', 'Natação'),
    cue: c('Lift arms and legs off the mat, flutter opposite arm and leg quickly while breathing steadily.', 'Solleva braccia e gambe, muovi alternati braccio e gamba opposti velocemente respirando regolarmente.'),
    frames: [[100, 105, 98, 98, 125, 125, -85, -85, -70, -70], [100, 105, 125, 125, 98, 98, -70, -70, -85, -85]] }),
  p({ id: 'legCircles', position: 'supine', level: 1, intensity: 2.5, met: 3, focus: ['core', 'hipOpeners'], bilateral: true,
    name: n('Single Leg Circles', 'Cerchi con la gamba', 'Círculos de pierna', 'Cercles de jambe', 'Beinkreise', 'Círculos com a perna'),
    cue: c('One leg to the ceiling, draw small circles keeping the pelvis completely still.', 'Una gamba verso il soffitto, disegna piccoli cerchi mantenendo il bacino immobile.'),
    frames: [[-90, -90, 88, 88, 88, 88, 90, 90, 175, 175], [-90, -90, 88, 88, 88, 88, 90, 90, 145, 145], [-90, -90, 88, 88, 88, 88, 90, 90, 160, 160]] }),
  p({ id: 'sideKick', position: 'supine', level: 1, intensity: 3, met: 3.5, focus: ['glutes', 'hipFlexors', 'balance'], bilateral: true,
    name: n('Side Kick', 'Calcio laterale', 'Patada lateral', 'Battement latéral', 'Seitkick', 'Chute lateral'),
    cue: c('Lying on the side, swing the top leg forward twice, then sweep it back, keeping the torso still.', 'Sul fianco, porta la gamba sopra in avanti due volte, poi indietro, mantenendo il busto fermo.'),
    // side-lying (13 values): top leg swings forward, then back, hovering at hip height
    frames: [[-90, -94, 90, 90, -90, -90, 160, 160, 110, 110, 0, 25, 1], [-90, -94, 90, 90, -90, -90, 70, 70, 110, 110, 0, 25, 1]] }),
  p({ id: 'shoulderBridge', position: 'supine', level: 1, intensity: 3, met: 3.5, focus: ['glutes', 'lowerBack', 'backbends'],
    name: n('Shoulder Bridge', 'Ponte sulle spalle', 'Puente de hombros', 'Pont d\'épaules', 'Schulterbrücke', 'Ponte de ombros'),
    cue: c('Roll the pelvis up one vertebra at a time, hold, then roll down slowly.', 'Solleva il bacino una vertebra alla volta, mantieni, poi scendi lentamente.'),
    frames: [[-92, -90, 88, 88, 88, 88, 135, 45, 135, 45], [-45, -80, 90, 90, 90, 90, 100, -5, 100, -5, -6]] }),
  p({ id: 'teaser', position: 'seated', level: 3, intensity: 4.5, met: 4.5, focus: ['core', 'balance'],
    name: n('Teaser', 'Teaser', 'Teaser', 'Teaser', 'Teaser', 'Teaser'),
    cue: c('Roll up into a V balance, arms parallel to the legs, then lower with control.', 'Sali in equilibrio a V, braccia parallele alle gambe, poi scendi con controllo.'),
    frames: [[-90, -90, -175, -175, -175, -175, 105, 105, 105, 105], [212, 200, 120, 120, 120, 120, 140, 140, 140, 140]] }),
  p({ id: 'rollingBall', position: 'seated', level: 1, intensity: 2.5, met: 3, focus: ['core', 'spineMobility'],
    name: n('Rolling Like a Ball', 'Rotolare come una palla', 'Rodar como una pelota', 'Rouler comme une balle', 'Rollen wie ein Ball', 'Rolar como uma bola'),
    cue: c('Hug the shins into a small ball, roll back to the shoulder blades and return to balance.', 'Abbraccia gli stinchi in una piccola palla, rotola fino alle scapole e torna in equilibrio.'),
    frames: [[205, 140, 60, 120, 60, 120, 150, 30, 150, 30, 15], [-125, -150, 120, 170, 120, 170, -170, 80, -170, 80, 15]] }),
  p({ id: 'clam', position: 'supine', level: 1, intensity: 2, met: 2.8, focus: ['glutes', 'hipOpeners'], bilateral: true,
    name: n('Clam', 'Conchiglia', 'Almeja', 'Palourde', 'Muschel', 'Concha'),
    cue: c('Lying on the side with knees bent, open the top knee like a shell, keeping the feet together.', 'Sul fianco con le ginocchia piegate, apri il ginocchio sopra come una conchiglia, piedi uniti.'),
    // side-lying (13 values): hips and knees bent forward, the top knee opens
    frames: [[-90, -94, 90, 90, -90, -90, 135, 45, 135, 45, 0, 0, 1], [-90, -94, 90, 90, -90, -90, 135, 45, 135, 45, 0, 40, 1]] }),
  p({ id: 'mermaid', position: 'seated', level: 1, intensity: 1.5, met: 2.5, focus: ['flexibility', 'spineMobility'], bilateral: true,
    name: n('Mermaid', 'Sirena', 'Sirena', 'Sirène', 'Meerjungfrau', 'Sereia'),
    cue: c('Sitting with legs folded to one side, sweep the arm overhead and bend sideways, breathing into the ribs.', 'Seduto con le gambe piegate di lato, porta il braccio sopra la testa e piegati lateralmente, respirando nelle costole.'),
    frames: [[180, 180, 0, 0, 185, 185, 80, -100, 80, -100, 0, 0, 0, 45, 25], [202, 195, -20, 0, 210, 210, 80, -100, 80, -100, -4, 0, 0, 45, 25]] }),
  p({ id: 'legPullFront', position: 'armBalance', level: 3, intensity: 4, met: 4.5, focus: ['core', 'armStrength', 'glutes'], bilateral: true,
    name: n('Leg Pull Front', 'Leg Pull Front', 'Leg Pull Front', 'Leg Pull Front', 'Leg Pull Front', 'Leg Pull Front'),
    cue: c('In plank, lift one leg from the hip without letting the pelvis rock, lower and switch.', 'In plank, solleva una gamba dall\'anca senza far oscillare il bacino, abbassa e cambia.'),
    frames: [PLANK, [114, 110, 0, 0, 0, 0, -66, -66, -84, -84]] }),
  p({ id: 'catStretch', position: 'kneeling', level: 1, intensity: 1.5, met: 2.3, focus: ['spineMobility', 'lowerBack'],
    name: n('Cat Stretch', 'Allungamento del gatto', 'Estiramiento del gato', 'Étirement du chat', 'Katzendehnung', 'Alongamento do gato'),
    cue: c('On hands and knees, articulate the spine from round to long, moving one segment at a time.', 'A quattro zampe, articola la colonna da arrotondata a lunga, muovendo un segmento alla volta.'),
    frames: [[105, 110, 0, 0, 0, 0, 0, -90, 0, -90], [100, 50, 0, 0, 0, 0, 0, -90, 0, -90, 14]] }),
];

/** Core Pilates moves plus the extended catalog. */
export const PILATES: Move[] = translateCues([...PILATES_CORE, ...buildPilatesCatalog(PILATES_CORE)]);

const h = mk('hiit');
const HIIT_CORE: Move[] = [
  h({ id: 'jumpingJacks', position: 'standing', level: 1, intensity: 4, met: 8, focus: ['legStrength'],
    name: n('Jumping Jacks', 'Jumping jack', 'Saltos de tijera', 'Jumping jacks', 'Hampelmann', 'Polichinelos'),
    cue: c('Jump the feet wide as the arms sweep overhead, then back together. Land softly.', 'Salta aprendo i piedi mentre le braccia salgono, poi richiudi. Atterra morbido.'),
    frames: [[180, 180, 0, 0, 0, 0, -6, -6, 6, 6], [180, 180, 175, 175, 175, 175, -22, -22, 22, 22]] }),
  h({ id: 'squat', position: 'standing', level: 1, intensity: 3.5, met: 5, focus: ['legStrength', 'glutes', 'quads'],
    name: n('Squat', 'Squat', 'Sentadilla', 'Squat', 'Kniebeuge', 'Agachamento'),
    cue: c('Feet shoulder-width, sit the hips back and down, chest up, drive through the heels to stand.', 'Piedi alla larghezza delle spalle, porta i fianchi indietro e in basso, petto alto, spingi sui talloni per risalire.'),
    frames: [STAND, [140, 150, 90, 90, 90, 90, 85, -10, 85, -10]] }),
  h({ id: 'jumpSquat', position: 'standing', level: 3, intensity: 5, met: 9, focus: ['legStrength', 'glutes'],
    name: n('Jump Squat', 'Squat jump', 'Sentadilla con salto', 'Squat sauté', 'Sprungkniebeuge', 'Agachamento com salto'),
    cue: c('Squat down, explode up into a jump, land softly back into the squat.', 'Scendi in squat, esplodi in un salto, atterra morbido di nuovo in squat.'),
    frames: [[140, 150, 30, 30, 30, 30, 85, -10, 85, -10], [185, 185, 170, 170, 170, 170, -5, 5, 5, 10]] }),
  h({ id: 'lunges', position: 'standing', level: 1, intensity: 4, met: 6, focus: ['legStrength', 'quads', 'balance'],
    name: n('Alternating Lunges', 'Affondi alternati', 'Zancadas alternas', 'Fentes alternées', 'Wechselnde Ausfallschritte', 'Avanços alternados'),
    cue: c('Step forward and lower both knees to ninety degrees, push back and switch legs.', 'Fai un passo avanti e scendi con entrambe le ginocchia a novanta gradi, spingi indietro e cambia gamba.'),
    frames: [STAND, [180, 180, 5, 0, -5, 0, -30, -90, 88, 2], STAND, [180, 180, 5, 0, -5, 0, 88, 2, -30, -90]] }),
  h({ id: 'highKnees', position: 'standing', level: 2, intensity: 5, met: 9, focus: ['core', 'hipFlexors'],
    name: n('High Knees', 'Skip alto', 'Rodillas altas', 'Montées de genoux', 'Kniehebelauf', 'Joelhos altos'),
    cue: c('Run in place driving the knees up to hip height, arms pumping fast.', 'Corri sul posto portando le ginocchia all\'altezza delle anche, braccia veloci.'),
    frames: [[180, 180, 40, 140, -40, 60, 90, 0, 0, 0], [180, 180, -40, 60, 40, 140, 0, 0, 90, 0]] }),
  h({ id: 'buttKicks', position: 'standing', level: 1, intensity: 4, met: 8, focus: ['quads'],
    name: n('Butt Kicks', 'Calciata dietro', 'Talones al glúteo', 'Talons-fesses', 'Anfersen', 'Chute no glúteo'),
    cue: c('Jog in place kicking the heels up toward the glutes, stay light on the feet.', 'Corri sul posto portando i talloni verso i glutei, resta leggero sui piedi.'),
    frames: [[180, 180, 30, 120, -30, 40, 0, 0, -10, -170], [180, 180, -30, 40, 30, 120, -10, -170, 0, 0]] }),
  h({ id: 'mountainClimbers', position: 'armBalance', level: 2, intensity: 5, met: 8, focus: ['core', 'armStrength'],
    name: n('Mountain Climbers', 'Mountain climber', 'Escaladores', 'Grimpeurs', 'Bergsteiger', 'Escalador'),
    cue: c('From plank, drive the knees toward the chest one after the other, hips low and steady.', 'Dal plank, porta le ginocchia al petto una dopo l\'altra, fianchi bassi e stabili.'),
    frames: [[114, 110, 0, 0, 0, 0, -66, -66, 40, -60], [114, 110, 0, 0, 0, 0, 40, -60, -66, -66]] }),
  h({ id: 'burpee', position: 'standing', level: 3, intensity: 5, met: 10, focus: ['core', 'legStrength', 'armStrength'],
    name: n('Burpee', 'Burpee', 'Burpee', 'Burpee', 'Burpee', 'Burpee'),
    cue: c('Squat, hands down, jump back to plank, jump the feet in and explode up with the arms overhead.', 'Accovacciati, mani a terra, salta indietro in plank, riporta i piedi e salta in alto con le braccia sopra la testa.'),
    frames: [STAND, [100, 105, 0, 0, 0, 0, 120, -25, 120, -25], PLANK, [100, 105, 0, 0, 0, 0, 120, -25, 120, -25], [185, 185, 175, 175, 175, 175, -5, 5, 5, 10]] }),
  h({ id: 'pushUp', position: 'armBalance', level: 2, intensity: 4.5, met: 7, focus: ['armStrength', 'chestOpening', 'core'],
    name: n('Push-Up', 'Piegamenti', 'Flexiones', 'Pompes', 'Liegestütz', 'Flexões'),
    cue: c('Hands under the shoulders, lower the chest toward the floor as one unit and press back up. Knees down if needed.', 'Mani sotto le spalle, abbassa il petto verso il pavimento come un blocco unico e spingi in su. Ginocchia a terra se serve.'),
    frames: [PLANK, [104, 104, -60, 0, -60, 0, -76, -76, -76, -76]] }),
  h({ id: 'plankJacks', position: 'armBalance', level: 2, intensity: 4.5, met: 7, focus: ['core', 'shoulders'],
    name: n('Plank Jacks', 'Plank jack', 'Plancha con saltos', 'Planche jacks', 'Plank Jacks', 'Prancha com saltos'),
    cue: c('Hold a strong plank and jump the feet wide and back together.', 'Mantieni un plank solido e salta aprendo e chiudendo i piedi.'),
    frames: [PLANK, [114, 110, 0, 0, 0, 0, -70, -70, -62, -62]] }),
  h({ id: 'skaters', position: 'standing', level: 2, intensity: 4.5, met: 7, focus: ['legStrength', 'balance', 'glutes'],
    name: n('Skaters', 'Pattinatore', 'Patinadores', 'Patineurs', 'Eisschnellläufer', 'Patinador'),
    cue: c('Leap side to side landing on one leg, the other sweeping behind, arms swinging across.', 'Salta da un lato all\'altro atterrando su una gamba, l\'altra dietro, braccia che oscillano.'),
    frames: [[140, 150, 120, 120, -40, -40, -50, -50, 30, -10], [140, 150, -40, -40, 120, 120, 30, -10, -50, -50]] }),
  h({ id: 'bicycle', position: 'supine', level: 2, intensity: 4, met: 5.5, focus: ['core', 'twists'],
    name: n('Bicycle Crunch', 'Crunch bicicletta', 'Abdominal bicicleta', 'Crunch vélo', 'Fahrrad-Crunch', 'Abdominal bicicleta'),
    cue: c('Hands behind the head, bring the elbow toward the opposite knee while the other leg extends.', 'Mani dietro la testa, porta il gomito verso il ginocchio opposto mentre l\'altra gamba si distende.'),
    frames: [[-110, -110, -150, 170, -150, 170, -160, 90, 120, 120], [-110, -110, -150, 170, -150, 170, 120, 120, -160, 90]] }),
  h({ id: 'russianTwist', position: 'seated', level: 2, intensity: 4, met: 5, focus: ['core', 'twists'],
    name: n('Russian Twist', 'Russian twist', 'Giro ruso', 'Rotation russe', 'Russian Twist', 'Giro russo'),
    cue: c('Lean back with feet lifted or down, rotate the torso side to side, touching the floor beside the hips.', 'Inclinati indietro con i piedi sollevati o a terra, ruota il busto da un lato all\'altro toccando il pavimento.'),
    frames: [[215, 200, 60, 20, 60, 20, 135, 85, 135, 85], [215, 200, 120, 160, 120, 160, 135, 85, 135, 85]] }),
  h({ id: 'gluteBridge', position: 'supine', level: 1, intensity: 3, met: 4, focus: ['glutes', 'lowerBack'],
    name: n('Glute Bridge', 'Ponte glutei', 'Puente de glúteos', 'Pont fessier', 'Glute Bridge', 'Ponte de glúteos'),
    cue: c('Feet flat, drive the hips up squeezing the glutes, pause at the top and lower.', 'Piedi a terra, spingi i fianchi in alto stringendo i glutei, pausa in alto e scendi.'),
    frames: [[-92, -90, 88, 88, 88, 88, 135, 45, 135, 45], [-45, -80, 90, 90, 90, 90, 100, -5, 100, -5, -6]] }),
  h({ id: 'tricepDips', position: 'seated', level: 2, intensity: 4, met: 5, focus: ['armStrength', 'shoulders'],
    name: n('Tricep Dips', 'Dip per tricipiti', 'Fondos de tríceps', 'Dips triceps', 'Trizeps-Dips', 'Mergulho de tríceps'),
    cue: c('Hands behind you, fingers forward, bend the elbows straight back to lower the hips and press up.', 'Mani dietro, dita in avanti, piega i gomiti indietro per abbassare i fianchi e spingi in su.'),
    frames: [[-150, -160, 0, 0, 0, 0, 95, 0, 95, 0], [-160, -170, -55, 0, -55, 0, 130, 5, 130, 5]] }),
  h({ id: 'shoulderTaps', position: 'armBalance', level: 2, intensity: 4, met: 5.5, focus: ['core', 'shoulders', 'balance'],
    name: n('Plank Shoulder Taps', 'Plank con tocco spalle', 'Plancha con toque de hombro', 'Planche touches d\'épaule', 'Schulter-Taps', 'Prancha com toque no ombro'),
    cue: c('In plank, tap one hand to the opposite shoulder without rocking the hips.', 'In plank, tocca la spalla opposta con una mano senza far oscillare i fianchi.'),
    frames: [PLANK, [114, 110, 0, 0, 150, -150, -66, -66, -66, -66]] }),
  h({ id: 'sprint', position: 'standing', level: 1, intensity: 5, met: 10, focus: ['legStrength'],
    name: n('Sprint in Place', 'Sprint sul posto', 'Sprint en el sitio', 'Sprint sur place', 'Sprint auf der Stelle', 'Corrida no lugar'),
    cue: c('Fast feet, light on the balls of the feet, arms driving hard.', 'Piedi veloci, leggero sugli avampiedi, braccia che spingono forte.'),
    frames: [[170, 175, 50, 150, -50, 50, 60, -20, -20, -40], [170, 175, -50, 50, 50, 150, -20, -40, 60, -20]] }),
  h({ id: 'wallSit', position: 'standing', level: 1, intensity: 3.5, met: 4, focus: ['quads', 'legStrength'],
    name: n('Wall Sit', 'Sedia al muro', 'Sentadilla en pared', 'Chaise au mur', 'Wandsitzen', 'Cadeirinha'),
    cue: c('Back against a wall, slide down until the knees are at ninety degrees and hold.', 'Schiena contro il muro, scivola giù finché le ginocchia sono a novanta gradi e mantieni.'),
    frames: [[180, 180, 0, 90, 0, 90, 90, 0, 90, 0]] }),
  h({ id: 'superman', position: 'prone', level: 1, intensity: 3, met: 4, focus: ['lowerBack', 'glutes'],
    name: n('Superman', 'Superman', 'Superman', 'Superman', 'Superman', 'Super-homem'),
    cue: c('Lying face down, lift the arms, chest and legs together, hold briefly and lower.', 'A pancia in giù, solleva braccia, petto e gambe insieme, mantieni un attimo e scendi.'),
    frames: [[92, 95, 92, 92, 92, 92, -90, -90, -90, -90], [105, 110, 115, 115, 115, 115, -78, -78, -78, -78, -6]] }),
];

const CORE_BY_ID: Record<string, Move> = Object.fromEntries([...PILATES, ...HIIT_CORE].map((m) => [m.id, m]));
/** Core HIIT moves plus the extended catalog (figures borrowed from core / yoga moves). */
export const HIIT: Move[] = translateCues([...HIIT_CORE, ...buildHiitCatalog((id) => CORE_BY_ID[id], HIIT_CORE.map((m) => m.name.en))]);

export const FITNESS_BY_ID: Record<string, Move> = Object.fromEntries([...PILATES, ...HIIT].map((m) => [m.id, m]));
