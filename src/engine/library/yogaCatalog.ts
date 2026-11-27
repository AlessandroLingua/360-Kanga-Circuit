/**
 * Extended Yoga catalog: every name in YOGA_CATALOG_NAMES becomes a pose.
 * Each name (Italian) is matched by keywords to a base pose that supplies the
 * figure, position, focus and styles; the voice cue is our own, per family.
 */
import type { FocusArea, L10n, Move, Position, YogaStyle } from '../types';
import { YOGA_CATALOG_NAMES } from './yogaCatalogNames';
import { itName, YOGA_NAME_TR } from '../../i18n/catalog';

const STANDING: YogaStyle[] = ['vinyasa', 'hatha', 'gentle', 'ashtanga'];
const FLOOR: YogaStyle[] = ['hatha', 'gentle', 'vinyasa', 'yin', 'restorative'];
const MOBILITY: YogaStyle[] = ['gentle', 'hatha', 'vinyasa', 'restorative'];
const FLOW: YogaStyle[] = ['vinyasa', 'hatha', 'ashtanga', 'sunSalutation'];

type Family = { frames?: number[][]; facing?: 90; from: string[]; position: Position; focus: FocusArea[]; intensity: number; level: 1 | 2 | 3; styles: YogaStyle[]; cue: L10n; sided?: boolean };
const c = (en: string, it: string): L10n => ({ en, it });

/** Catalog poses shown facing the camera (their legs work out to the sides). */
export const YOGA_CATALOG_FACING = new Set<string>();

const F: Record<string, Family> = {
  highLunge: { from: ['highLunge'], position: 'standing', focus: ['legStrength', 'hipFlexors', 'balance'], intensity: 3, level: 1, styles: STANDING, sided: true, cue: c('Back heel lifted, front knee over the ankle, hips square and the torso long.', 'Tallone dietro sollevato, ginocchio davanti sopra la caviglia, anche allineate e busto lungo.') },
  lowLunge: { from: ['lowLunge'], position: 'kneeling', focus: ['hipFlexors', 'quads'], intensity: 2, level: 1, styles: FLOOR, sided: true, cue: c('Back knee down, sink the hips forward and lift the chest to open the front of the hip.', 'Ginocchio dietro a terra, porta le anche in avanti e solleva il petto per aprire l\'anca.') },
  // skandasana: sink deep into one bent knee, the other leg long out to the side (facing the camera)
  sideLunge: { frames: [[168, 172, 18, 30, 18, 30, 72, -12, -62, -62]], facing: 90, from: ['goddess'], position: 'standing', focus: ['hipOpeners', 'legStrength'], intensity: 2.8, level: 1, styles: STANDING, sided: true, cue: c('Wide stance, bend one knee deeply and keep the other leg long, chest lifted.', 'Gambe larghe, piega a fondo un ginocchio e tieni l\'altra gamba lunga, petto alto.') },
  warrior1: { from: ['warrior1'], position: 'standing', focus: ['legStrength', 'hipFlexors'], intensity: 3, level: 1, styles: STANDING, sided: true, cue: c('Front knee bent, back foot grounded, hips facing forward and arms reaching up.', 'Ginocchio davanti piegato, piede dietro radicato, anche in avanti e braccia verso l\'alto.') },
  warrior2: { from: ['warrior2'], position: 'standing', focus: ['legStrength', 'hipOpeners'], intensity: 3, level: 1, styles: STANDING, sided: true, cue: c('Front knee over the ankle, arms wide at shoulder height, gaze over the front hand.', 'Ginocchio sopra la caviglia, braccia aperte all\'altezza delle spalle, sguardo oltre la mano davanti.') },
  warrior3: { from: ['warrior3'], position: 'standing', focus: ['balance', 'glutes', 'hamstrings'], intensity: 3.5, level: 2, styles: STANDING, sided: true, cue: c('Hinge forward on one leg, back leg lifted, body one long line from fingertips to heel.', 'Inclinati su una gamba, gamba dietro sollevata, corpo in un\'unica linea dalle mani al tallone.') },
  peaceful: { from: ['reverseWarrior'], position: 'standing', focus: ['flexibility', 'legStrength'], intensity: 2.5, level: 1, styles: STANDING, sided: true, cue: c('Keep the front knee bent and arc the top arm back to lengthen the side body.', 'Mantieni il ginocchio piegato e porta il braccio in alto indietro per allungare il fianco.') },
  sideAngle: { from: ['sideAngle'], position: 'standing', focus: ['legStrength', 'flexibility'], intensity: 3, level: 1, styles: STANDING, sided: true, cue: c('Forearm on the thigh or hand down, top arm reaching over the ear in one long line.', 'Avambraccio sulla coscia o mano a terra, braccio sopra l\'orecchio in un\'unica linea.') },
  triangle: { from: ['triangle'], position: 'standing', focus: ['hamstrings', 'flexibility'], intensity: 2.5, level: 1, styles: STANDING, sided: true, cue: c('Both legs straight, reach forward then tilt down, opening the chest to the side.', 'Gambe tese, allungati in avanti poi inclinati verso il basso aprendo il petto di lato.') },
  tree: { from: ['tree'], position: 'standing', focus: ['balance'], intensity: 2, level: 1, styles: STANDING, sided: true, cue: c('Foot on the calf or inner thigh, never the knee; press foot and leg into each other.', 'Piede sul polpaccio o sull\'interno coscia, mai sul ginocchio; premi piede e gamba uno contro l\'altro.') },
  dancer: { from: ['dancer'], position: 'standing', focus: ['balance', 'backbends', 'quads'], intensity: 3.5, level: 3, styles: STANDING, sided: true, cue: c('Hold the back foot, kick it into the hand and tip forward as the chest lifts.', 'Afferra il piede dietro, spingilo nella mano e inclinati in avanti sollevando il petto.') },
  chair: { from: ['chair'], position: 'standing', focus: ['legStrength', 'quads'], intensity: 3, level: 1, styles: STANDING, cue: c('Sit back as if into a chair, weight in the heels, arms reaching up alongside the ears.', 'Siediti indietro come su una sedia, peso sui talloni, braccia in alto accanto alle orecchie.') },
  mountain: { from: ['tadasana', 'urdhvaHastasana'], position: 'standing', focus: ['balance', 'shoulders'], intensity: 1.2, level: 1, styles: [...STANDING, 'sunSalutation'], cue: c('Stand tall, feet rooted, and move the arms with the breath.', 'In piedi alto, piedi radicati, muovi le braccia con il respiro.') },
  wide: { from: ['goddess'], position: 'standing', focus: ['hipOpeners', 'legStrength'], intensity: 2.5, level: 1, styles: STANDING, cue: c('Feet wide, toes turned out, sink the hips and keep the knees tracking the toes.', 'Piedi larghi, punte in fuori, abbassa il bacino e tieni le ginocchia sopra le punte.') },
  fold: { from: ['uttanasana'], position: 'standing', focus: ['hamstrings', 'flexibility'], intensity: 1.8, level: 1, styles: [...STANDING, 'sunSalutation'], cue: c('Fold from the hips, knees soft, and let the head and neck hang heavy.', 'Piegati dalle anche, ginocchia morbide, lascia pesare testa e collo.') },
  wideFold: { from: ['prasarita'], position: 'standing', focus: ['hamstrings', 'flexibility'], intensity: 2, level: 1, styles: STANDING, cue: c('Feet wide and parallel, fold forward with a long spine, crown toward the floor.', 'Piedi larghi e paralleli, piegati in avanti con la colonna lunga, testa verso il pavimento.') },
  downDog: { from: ['downDog'], position: 'inverted', focus: ['hamstrings', 'shoulders'], intensity: 2.5, level: 1, styles: [...STANDING, 'sunSalutation'], cue: c('Hips high, press the floor away, heels reaching down and the spine long.', 'Anche alte, spingi via il pavimento, talloni verso il basso e colonna lunga.') },
  flow: { from: ['plank', 'chaturanga', 'upDog', 'downDog'], position: 'armBalance', focus: ['armStrength', 'core', 'backbends'], intensity: 3, level: 2, styles: FLOW, cue: c('Plank, lower with control, open the chest and press back to downward dog.', 'Plank, scendi con controllo, apri il petto e torna nel cane a testa in giù.') },
  walkIn: { from: ['downDog', 'uttanasana'], position: 'standing', focus: ['hamstrings'], intensity: 2, level: 1, styles: [...STANDING, 'sunSalutation'], cue: c('From downward dog, walk the feet toward the hands and fold.', 'Dal cane a testa in giù, cammina con i piedi verso le mani e piegati.') },
  table: { from: ['tableTop', 'catCow'], position: 'kneeling', focus: ['spineMobility', 'core'], intensity: 1.5, level: 1, styles: MOBILITY, cue: c('Hands under shoulders, knees under hips; move the spine slowly with the breath.', 'Mani sotto le spalle, ginocchia sotto le anche; muovi la colonna lentamente con il respiro.') },
  threadNeedle: { from: ['threadNeedle'], position: 'kneeling', focus: ['twists', 'shoulders', 'neckUpperBack'], intensity: 1.5, level: 1, styles: FLOOR, sided: true, cue: c('Slide one arm under the chest and rest the shoulder and ear down.', 'Fai scivolare un braccio sotto il petto e appoggia spalla e orecchio.') },
  child: { from: ['child'], position: 'kneeling', focus: ['lowerBack', 'hipOpeners'], intensity: 1, level: 1, styles: FLOOR, cue: c('Knees wide or together, hips back to the heels, forehead resting down.', 'Ginocchia aperte o unite, bacino sui talloni, fronte appoggiata.') },
  puppy: { from: ['child', 'tableTop'], position: 'kneeling', focus: ['shoulders', 'chestOpening'], intensity: 1.5, level: 1, styles: FLOOR, cue: c('Hips over the knees, walk the hands forward and let the chest melt down.', 'Anche sopra le ginocchia, porta le mani avanti e lascia scendere il petto.') },
  camel: { from: ['camel'], position: 'kneeling', focus: ['backbends', 'chestOpening', 'hipFlexors'], intensity: 3, level: 2, styles: ['vinyasa', 'hatha'], cue: c('Hands on the lower back, lift the chest up and back, hips over the knees.', 'Mani sulla zona lombare, solleva il petto in alto e indietro, anche sopra le ginocchia.') },
  lizard: { from: ['lizard'], position: 'kneeling', focus: ['hipOpeners', 'hipFlexors'], intensity: 2.5, level: 2, styles: FLOOR, sided: true, cue: c('Both hands inside the front foot, sink the hips low and breathe into the hip.', 'Entrambe le mani all\'interno del piede davanti, abbassa il bacino e respira nell\'anca.') },
  // back knee down under the hip, front leg straight with the heel on the mat, folding over it
  halfSplit: { frames: [[70, 55, 0, 0, 0, 0, 0, -90, 60, 60]], from: ['pyramid'], position: 'kneeling', focus: ['hamstrings', 'flexibility'], intensity: 2, level: 1, styles: FLOOR, sided: true, cue: c('Front leg straight, hips back over the back knee, fold over the front leg.', 'Gamba davanti tesa, bacino sopra il ginocchio dietro, piegati sulla gamba.') },
  pigeon: { from: ['pigeon'], position: 'seated', focus: ['hipOpeners', 'glutes'], intensity: 2, level: 2, styles: FLOOR, sided: true, cue: c('Front shin angled across, back leg long; stay upright or fold over the front leg.', 'Stinco davanti di traverso, gamba dietro lunga; resta su o piegati sulla gamba davanti.') },
  boundAngle: { from: ['boundAngle'], position: 'seated', focus: ['hipOpeners'], intensity: 1.5, level: 1, styles: FLOOR, cue: c('Soles of the feet together, knees falling open, spine tall.', 'Piante dei piedi unite, ginocchia che si aprono, colonna alta.') },
  boundFold: { from: ['butterfly'], position: 'seated', focus: ['hipOpeners', 'lowerBack'], intensity: 1.5, level: 1, styles: FLOOR, cue: c('Soles together, knees open; walk the hands forward and fold over the feet.', 'Piante dei piedi unite, ginocchia aperte; cammina con le mani in avanti e piegati sopra i piedi.') },
  reclinedBound: { from: ['recliningBound'], position: 'supine', focus: ['hipOpeners', 'chestOpening'], intensity: 1, level: 1, styles: FLOOR, cue: c('Lying back, soles together, let the knees fall open and the belly soften.', 'Sdraiato, piante unite, lascia aprire le ginocchia e rilassa la pancia.') },
  seatedFold: { from: ['seatedFold'], position: 'seated', focus: ['hamstrings', 'lowerBack'], intensity: 1.5, level: 1, styles: FLOOR, cue: c('Legs long, lengthen the spine on the inhale and fold a little deeper on the exhale.', 'Gambe lunghe, allunga la colonna inspirando e piegati un po\' di più espirando.') },
  headToKnee: { from: ['headToKnee'], position: 'seated', focus: ['hamstrings', 'flexibility'], intensity: 1.5, level: 1, styles: FLOOR, sided: true, cue: c('One leg long, the other foot to the inner thigh; fold over the straight leg.', 'Una gamba lunga, l\'altro piede all\'interno coscia; piegati sulla gamba tesa.') },
  // cross-legged facing the camera: arms down, then one arm sweeps up and over
  seatedSide: { frames: [[180, 180, 20, 10, 20, 10, 80, -100, 80, -100, 0, 0, 0, 45, 25], [195, 190, -20, 0, 200, 200, 80, -100, 80, -100, 0, 0, 0, 45, 25]], facing: 90, from: ['easySeat', 'seatedSideBend'], position: 'seated', focus: ['flexibility', 'shoulders'], intensity: 1.2, level: 1, styles: MOBILITY, sided: true, cue: c('Sit tall, reach one arm up and over, keeping both sit bones grounded.', 'Siedi alto, porta un braccio in alto e di lato, ischi ben radicati.') },
  seatedTwist: { from: ['seatedTwist'], position: 'seated', focus: ['twists', 'spineMobility'], intensity: 1.5, level: 1, styles: FLOOR, sided: true, cue: c('Lengthen up first, then turn from the belly, ribs and finally the head.', 'Allungati prima verso l\'alto, poi ruota da pancia, costole e infine testa.') },
  seated: { from: ['easySeat'], position: 'seated', focus: ['neckUpperBack', 'shoulders'], intensity: 1, level: 1, styles: MOBILITY, cue: c('Sit comfortably and tall; move slowly and only within an easy range.', 'Siedi comodo e alto; muoviti lentamente e solo in un\'ampiezza facile.') },
  staff: { from: ['staff'], position: 'seated', focus: ['core', 'hamstrings'], intensity: 1.8, level: 1, styles: FLOOR, cue: c('Legs straight, feet flexed, hands beside the hips and the spine tall.', 'Gambe tese, piedi a martello, mani accanto alle anche e colonna alta.') },
  boat: { from: ['boat'], position: 'seated', focus: ['core', 'hipFlexors'], intensity: 3, level: 2, styles: ['vinyasa', 'hatha', 'ashtanga'], cue: c('Balance behind the sit bones, chest lifted, shins up and the spine long.', 'In equilibrio dietro gli ischi, petto alto, stinchi sollevati e colonna lunga.') },
  saddle: { from: ['saddle'], position: 'supine', focus: ['quads', 'hipFlexors'], intensity: 2, level: 2, styles: ['yin', 'restorative', 'gentle'], cue: c('Sit between or on the heels and recline only as far as the knees allow.', 'Siediti tra o sui talloni e reclinati solo quanto le ginocchia permettono.') },
  frog: { from: ['sphinx'], position: 'prone', focus: ['quads', 'hipOpeners'], intensity: 1.8, level: 1, styles: FLOOR, sided: true, cue: c('On the forearms, bend one knee and draw the heel toward the hip.', 'Sugli avambracci, piega un ginocchio e porta il tallone verso l\'anca.') },
  sphinx: { from: ['sphinx'], position: 'prone', focus: ['backbends', 'lowerBack'], intensity: 1.5, level: 1, styles: FLOOR, cue: c('Elbows under the shoulders, forearms down, chest gently lifted.', 'Gomiti sotto le spalle, avambracci a terra, petto leggermente sollevato.') },
  cobra: { from: ['cobra'], position: 'prone', focus: ['backbends', 'chestOpening'], intensity: 2, level: 1, styles: [...STANDING, 'sunSalutation'], cue: c('Hands under the shoulders, press lightly and lift the chest with the back muscles.', 'Mani sotto le spalle, spingi leggermente e solleva il petto con i muscoli della schiena.') },
  locust: { from: ['locust'], position: 'prone', focus: ['lowerBack', 'glutes'], intensity: 2.5, level: 2, styles: ['vinyasa', 'hatha'], cue: c('Face down, lift the chest, arms and legs together, neck long.', 'A pancia in giù, solleva petto, braccia e gambe insieme, collo lungo.') },
  bow: { from: ['bow'], position: 'prone', focus: ['backbends', 'quads'], intensity: 3, level: 2, styles: ['vinyasa', 'hatha'], sided: true, cue: c('Hold the ankle or foot and kick into the hand to lift the chest.', 'Afferra la caviglia o il piede e spingi nella mano per sollevare il petto.') },
  bridge: { from: ['bridge'], position: 'supine', focus: ['glutes', 'backbends'], intensity: 2.5, level: 1, styles: FLOOR, cue: c('Feet hip-width, press through the feet and lift the hips, chest toward the chin.', 'Piedi alla larghezza delle anche, spingi sui piedi e solleva il bacino, petto verso il mento.') },
  happyBaby: { from: ['happyBaby'], position: 'supine', focus: ['hipOpeners', 'lowerBack'], intensity: 1.2, level: 1, styles: FLOOR, cue: c('Hold the feet or shins, knees toward the armpits, rock gently if it feels good.', 'Afferra piedi o stinchi, ginocchia verso le ascelle, dondola piano se ti fa bene.') },
  kneesChest: { from: ['kneesToChest'], position: 'supine', focus: ['lowerBack'], intensity: 1, level: 1, styles: FLOOR, cue: c('Hug the knees in and let the lower back release; circle gently if you like.', 'Abbraccia le ginocchia e rilassa la zona lombare; fai piccoli cerchi se ti va.') },
  supineMove: { from: ['kneesToChest', 'happyBaby'], position: 'supine', focus: ['core', 'hipOpeners'], intensity: 2.2, level: 1, styles: MOBILITY, cue: c('On your back, keep the lower back heavy and move the legs slowly with the breath.', 'Sulla schiena, tieni la zona lombare pesante e muovi le gambe lentamente con il respiro.') },
  // lying on the back, legs up together, then opened into a wide V
  legsOpen: { frames: [[-90, -90, 90, 90, 90, 90, 180, 180, 180, 180], [-90, -90, 90, 90, 90, 90, 180, 180, 180, 180, 0, 0, 0, 38, 38]], from: [], position: 'supine', focus: ['hipOpeners', 'core'], intensity: 1.8, level: 1, styles: MOBILITY, cue: c('On your back, legs up, open them wide and bring them back together with control.', 'Sulla schiena, gambe in alto, aprile ampie e richiudile con controllo.') },
  // tabletop, one knee drawn forward towards the arm
  kneeToArm: { frames: [[105, 110, 0, 0, 0, 0, 0, -90, 0, -90], [98, 95, 0, 0, 0, 0, 0, -90, 48, -105, 16]], from: [], position: 'kneeling', focus: ['core', 'hipFlexors'], intensity: 2, level: 1, styles: MOBILITY, sided: true, cue: c('From tabletop, round the back and draw one knee towards the arm, then reach it back.', 'Dal tavolo, arrotonda la schiena e porta un ginocchio verso il braccio, poi riportalo indietro.') },
  supineTwist: { from: ['supineTwist'], position: 'supine', focus: ['twists', 'lowerBack'], intensity: 1, level: 1, styles: FLOOR, sided: true, cue: c('Knees to one side, arms wide, both shoulders heavy on the floor.', 'Ginocchia da un lato, braccia aperte, spalle pesanti a terra.') },
  figureFour: { from: ['kneesToChest'], position: 'supine', focus: ['hipOpeners', 'glutes'], intensity: 1.5, level: 1, styles: FLOOR, sided: true, cue: c('Ankle over the opposite knee, draw the legs in and keep the foot flexed.', 'Caviglia sul ginocchio opposto, avvicina le gambe e tieni il piede a martello.') },
  sidePlank: { from: ['sidePlank'], position: 'armBalance', focus: ['core', 'shoulders'], intensity: 3, level: 2, styles: ['vinyasa', 'hatha'], sided: true, cue: c('Lower knee down for support, hips lifted, top arm reaching up.', 'Ginocchio basso a terra per sostegno, anche sollevate, braccio in alto.') },
  // hands under the shoulders behind, knees bent over the feet, hips lifted level: a table facing up
  reverseTable: { frames: [[-90, -118, 0, 0, 0, 0, 90, 0, 90, 0]], from: ['bridge'], position: 'seated', focus: ['shoulders', 'glutes', 'chestOpening'], intensity: 2.5, level: 1, styles: ['vinyasa', 'hatha'], cue: c('Hands behind, knees bent, lift the hips level with the knees and open the chest.', 'Mani dietro, ginocchia piegate, solleva le anche all\'altezza delle ginocchia e apri il petto.') },
  // sitting on the heels (vajrasana): knees and shins on the mat, hands on the thighs
  kneeling: { frames: [[180, 180, 20, 60, 20, 60, 90, -90, 90, -90]], from: ['easySeat'], position: 'kneeling', focus: ['quads'], intensity: 1, level: 1, styles: MOBILITY, cue: c('Kneel comfortably, sit tall and breathe slowly.', 'In ginocchio comodo, siedi alto e respira lentamente.'), },
  prone: { from: ['sphinx'], position: 'prone', focus: ['lowerBack'], intensity: 1, level: 1, styles: FLOOR, cue: c('Rest on the belly and feel the breath press the belly into the floor.', 'Riposa sulla pancia e senti il respiro che spinge la pancia contro il pavimento.') },
  supineRest: { from: ['kneesToChest'], position: 'supine', focus: ['lowerBack'], intensity: 0.8, level: 1, styles: FLOOR, cue: c('Knees bent, feet on the floor; let the lower back settle and the breath slow.', 'Ginocchia piegate, piedi a terra; lascia appoggiare la zona lombare e rallentare il respiro.') },
};

/** Ordered keyword rules on the Italian name: first match wins. */
const RULES: [RegExp, string][] = [
  [/^vinyasa$/i, 'flow'],
  [/janu sirsasana/i, 'headToKnee'],
  [/padangusthasana|bambola di pezza|piegamento in avanti(?! da seduti)(?! con le gambe)/i, 'fold'],
  [/urdhva hastasana|tadasana|stiramento mattutino|stiramento laterale in piedi|mezzo angelo in piedi/i, 'mountain'],
  [/guerriero 1/i, 'warrior1'],
  [/guerriero 2|flusso nel guerriero/i, 'warrior2'],
  [/guerriero 3/i, 'warrior3'],
  [/guerriero pacifico|sguardo alle stelle/i, 'peaceful'],
  [/affondo (alto|crescente)|affondi di cortesia|impulsi in affondo/i, 'highLunge'],
  [/affondo basso|mucca in affondo|gatto in affondo/i, 'lowLunge'],
  [/skandasana/i, 'sideLunge'],
  [/angolo laterale/i, 'sideAngle'],
  [/triangolo/i, 'triangle'],
  [/albero/i, 'tree'],
  [/ballerino/i, 'dancer'],
  [/sedia/i, 'chair'],
  [/cavallo|stella/i, 'wide'],
  [/gambe aperte|piegamento con le gambe divaricate da seduti|oscillazioni in posizione seduta/i, 'wideFold'],
  [/camminare con i piedi/i, 'walkIn'],
  [/cane (a tre gambe|in giù)/i, 'downDog'],
  [/panca laterale/i, 'sidePlank'],
  [/tavolo invertito|tavolo da supini|tavola inversa/i, 'reverseTable'],
  [/filo nella cruna/i, 'threadNeedle'],
  [/cucciolo/i, 'puppy'],
  [/cammello/i, 'camel'],
  [/lucertola/i, 'lizard'],
  [/mezzo hanuman/i, 'halfSplit'],
  [/piccione/i, 'pigeon'],
  [/mezza rana/i, 'frog'],
  [/mezza sella/i, 'saddle'],
  [/angolo legato da supini/i, 'reclinedBound'],
  [/piegamento in angolo legato|farfalla/i, 'boundFold'],
  [/angolo legato/i, 'boundAngle'],
  [/barca/i, 'boat'],
  [/bastone/i, 'staff'],
  [/sfinge/i, 'sphinx'],
  [/sulla pancia/i, 'prone'],
  [/cobra/i, 'cobra'],
  [/locusta/i, 'locust'],
  [/mezzo arco/i, 'bow'],
  [/ponte/i, 'bridge'],
  [/bambino felice/i, 'happyBaby'],
  [/bambino/i, 'child'],
  [/torsione.*(supini)|braccia aperte e chiuse in torsione|cerchi con le braccia in torsione/i, 'supineTwist'],
  [/torsione|contro torsione/i, 'seatedTwist'],
  [/figura a quattro da seduti/i, 'pigeon'],
  [/figura a quattro/i, 'figureFour'],
  [/abbraccia le ginocchia|ginocchio al petto/i, 'kneesChest'],
  [/apertura delle gambe|gambe aperte da supini/i, 'legsOpen'],
  [/supini|dead bug/i, 'supineMove'],
  [/ginocchio al (naso|tricipite)/i, 'kneeToArm'],
  [/tavolo|gatto e mucca|da mucca a gatto/i, 'table'],
  [/piegamento da seduti|piegamento in avanti da seduti|piegamento in angolo|piegamento nel/i, 'seatedFold'],
  [/laterale da seduti|stiramento laterale con rotazione|saluto al sole da seduti/i, 'seatedSide'],
  [/sulle ginocchia|seduta sui talloni/i, 'kneeling'],
  [/supina/i, 'supineRest'],
  [/ginocchio sollevato/i, 'tree'],
  [/da seduti|posizione seduta|seduti/i, 'seated'],
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const slug = (s: string) => 'yx_' + s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildYogaCatalog(core: Move[]): Move[] {
  const byId = Object.fromEntries(core.map((m) => [m.id, m]));
  const taken = new Set(core.flatMap((m) => [m.name.it, m.name.en, m.sanskrit].filter(Boolean).map((x) => norm(x!))));
  const out: Move[] = [];
  for (const raw of YOGA_CATALOG_NAMES) {
    if (taken.has(norm(raw)) || /^savasana$/i.test(raw)) continue;
    taken.add(norm(raw));
    const fam = F[RULES.find(([re]) => re.test(raw))?.[1] ?? 'seated'];
    const tpl = fam.frames ? [fam.frames] : (fam.from.map((id) => byId[id]?.frames).filter(Boolean) as number[][][]);
    if (!tpl.length) continue;
    let frames = tpl.length === 1 ? tpl[0] : tpl.map((f) => f[0]);
    const s = raw.toLowerCase();
    const dynamic = /impulsi|oscillazion|cerchi|rotazion|flusso|camminata|aperte e chiuse|su e giù|destra e a sinistra|alternat|spinta|crunch|sollevamento/.test(s);
    // a dynamic variation of a held pose: alternate the pose with a neutral one
    if (dynamic && frames.length === 1) frames = [frames[0], byId[fam.position === 'standing' ? 'tadasana' : fam.position === 'supine' ? 'kneesToChest' : fam.position === 'prone' ? 'sphinx' : fam.position === 'kneeling' ? 'tableTop' : 'easySeat']?.frames[0] ?? frames[0]];
    const level = /incrociat|mani in preghiera|mezzo arco|ballerino|sollevamento di una gamba/.test(s) ? Math.max(fam.level, 2) : fam.level;
    if (fam.facing) YOGA_CATALOG_FACING.add(slug(raw));
    out.push({
      id: slug(raw),
      discipline: 'yoga',
      name: itName(cap(raw), YOGA_NAME_TR),
      cue: fam.cue,
      short: fam.cue,
      position: fam.position,
      level: level as Move['level'],
      intensity: Math.round((fam.intensity + (dynamic ? 0.3 : 0)) * 10) / 10,
      met: Math.round((2 + fam.intensity * 0.6) * 10) / 10,
      focus: fam.focus,
      frames,
      styles: fam.styles,
      bilateral: fam.sided || undefined,
    });
  }
  return out;
}
