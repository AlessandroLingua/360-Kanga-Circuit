/**
 * Extended HIIT catalog: every name in HIIT_CATALOG_NAMES becomes a Move.
 * Each exercise is classified by keywords into a movement family that supplies the
 * stick-figure animation (borrowed from an existing move), position, trained areas,
 * intensity and our own voice cue.
 */
import type { FocusArea, L10n, Move, MoveTag, Position } from '../types';
import { HIIT_CATALOG_NAMES } from './hiitCatalogNames';
import { YOGA_BY_ID } from './yoga';
import { HIIT_NAME_TR } from '../../i18n/catalog';

type Family = {
  /** move ids whose first frame becomes a keyframe; two or more = looping movement */
  from: string[];
  position: Position;
  focus: FocusArea[];
  intensity: number;
  met: number;
  level: 1 | 2 | 3;
  cue: L10n;
  tags?: MoveTag[];
  /** own keyframes instead of borrowing them from `from` */
  frames?: number[][];
  /** 90: the movement happens out to the sides, so the body faces the camera */
  facing?: 90;
};

/** Catalog exercises whose body faces the camera (lateral arm or leg work). */
export const CATALOG_FACING = new Set<string>();

// standing, arms by the sides; arms out to a T; arms overhead (faced to the camera: out to the sides)
const ARMS_LOW = [180, 180, 14, 10, 14, 10, -3, -3, 3, 3];
const ARMS_T = [180, 180, 90, 90, 90, 90, -3, -3, 3, 3];
const ARMS_UP = [180, 180, 165, 170, 165, 170, -3, -3, 3, 3];

const c = (en: string, it: string): L10n => ({ en, it });

const FAMILIES: Record<string, Family> = {
  stretchHam: { from: ['uttanasana'], position: 'standing', focus: ['hamstrings', 'flexibility'], intensity: 1.5, met: 2.5, level: 1, cue: c('Fold forward from the hips with soft knees and let the back of the legs lengthen.', 'Piegati in avanti dalle anche con le ginocchia morbide e lascia allungare la parte posteriore delle gambe.') },
  stretchQuad: { from: ['lowLunge'], position: 'kneeling', focus: ['quads', 'hipFlexors', 'flexibility'], intensity: 1.5, met: 2.5, level: 1, cue: c('Open the front of the thigh and hip; keep the pelvis tucked and breathe slowly.', 'Apri la parte anteriore della coscia e dell\'anca; bacino in retroversione e respira lento.'), tags: ['knee'] },
  stretchHip: { from: ['pigeon'], position: 'seated', focus: ['hipOpeners', 'glutes', 'flexibility'], intensity: 1.5, met: 2.5, level: 1, cue: c('Ease into the hip, keep the spine long and let the outer hip soften.', 'Entra piano nell\'anca, colonna lunga, lascia ammorbidire l\'esterno dell\'anca.') },
  stretchSide: { from: ['tadasana', 'reverseWarrior'], facing: 90, position: 'standing', focus: ['flexibility', 'spineMobility'], intensity: 1.5, met: 2.5, level: 1, cue: c('Reach long through the side of the body, ribs lifting away from the hips.', 'Allungati lungo il fianco, le costole si allontanano dalle anche.') },
  // sitting cross-legged, one arm overhead with the hand down between the shoulder blades, the other on the elbow
  stretchTricep: { frames: [[180, 175, 165, -110, 176, -10, 95, -90, 95, -90, 0, 0, 0, 55, -75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.22]], from: [], position: 'seated', focus: ['shoulders', 'armStrength'], intensity: 1.3, met: 2.3, level: 1, cue: c('One arm up, bend the elbow and drop the hand between the shoulder blades; the other hand rests on the elbow.', "Un braccio in alto, piega il gomito e porta la mano tra le scapole; l'altra mano sul gomito.") },
  // low lunge, back knee down, arms opened wide and the chest turned over the front thigh
  stretchLungeTwist: { frames: [[182, 182, 90, 90, 90, 90, -25, -88, 88, 2, 0, 0, 0, 0, 0, 0, 85, 60, 0, 0, 0, 85, 65, 0, 0]], from: [], position: 'kneeling', focus: ['twists', 'hipFlexors', 'spineMobility'], intensity: 1.6, met: 2.5, level: 1, cue: c('Back knee down, open the arms and turn the chest toward the front leg, hips square.', 'Ginocchio dietro a terra, apri le braccia e ruota il petto verso la gamba davanti, anche dritte.'), tags: ['knee'] },
  stretchUpper: { from: ['tadasana'], position: 'standing', focus: ['shoulders', 'chestOpening', 'neckUpperBack'], intensity: 1.5, met: 2.5, level: 1, cue: c('Relax the shoulders down, breathe into the stretch and keep the neck long.', 'Spalle rilassate in basso, respira nell\'allungamento e collo lungo.') },
  stretchSeated: { from: ['seatedFold'], position: 'seated', focus: ['hamstrings', 'lowerBack', 'flexibility'], intensity: 1.5, met: 2.3, level: 1, cue: c('Sit tall, then fold forward from the hips without forcing.', 'Siedi alto, poi piegati in avanti dalle anche senza forzare.') },
  stretchTwist: { from: ['supineTwist'], position: 'supine', focus: ['twists', 'spineMobility', 'lowerBack'], intensity: 1.5, met: 2.3, level: 1, cue: c('Let the knees fall to one side and keep both shoulders heavy.', 'Lascia cadere le ginocchia da un lato e tieni entrambe le spalle pesanti.') },
  stretchBack: { from: ['cobra'], position: 'prone', focus: ['backbends', 'chestOpening'], intensity: 1.8, met: 2.5, level: 1, cue: c('Press the hands down, lift the chest gently and keep the shoulders away from the ears.', 'Premi le mani, solleva il petto con dolcezza e allontana le spalle dalle orecchie.') },
  stretchKnees: { from: ['kneesToChest'], position: 'supine', focus: ['lowerBack', 'hipOpeners'], intensity: 1.3, met: 2.2, level: 1, cue: c('Hug the knee in and let the lower back release into the floor.', 'Abbraccia il ginocchio e lascia che la zona lombare si rilassi sul pavimento.') },
  stretchCalf: { from: ['downDog'], position: 'inverted', focus: ['hamstrings', 'flexibility'], intensity: 1.8, met: 2.5, level: 1, cue: c('Press the heel toward the floor and lengthen the back of the lower leg.', 'Spingi il tallone verso terra e allunga il polpaccio.'), tags: ['wrist'] },
  fold: { from: ['prasarita'], position: 'standing', focus: ['hamstrings', 'flexibility'], intensity: 1.8, met: 2.5, level: 1, cue: c('Feet wide, hinge forward with a long spine and let the head hang.', 'Piedi larghi, piegati in avanti con la colonna lunga e lascia pendere la testa.') },
  // ---- specific families (each named exercise gets the movement it really is)
  kneeCross: { frames: [[180,180,150,-120,150,-120,0,0,0,0,0,0,0,0,0,0,70,0,0,0,0,-60,0,0,0.22],[172,178,150,-120,150,-120,0,0,100,-10,0,0,0,0,0,0,70,0,0,0,0,-60,28,0,0.22]], from: [], position: 'standing', focus: ['core', 'twists', 'hipFlexors'], intensity: 3.6, met: 5, level: 1, cue: c('Hands behind the head, lift one knee and turn the opposite elbow toward it.', 'Mani dietro la testa, solleva un ginocchio e porta il gomito opposto verso di esso.') },
  airplane: { frames: [[90,92,-55,-55,-55,-55,-90,-90,0,0,0,0,0,0,0,0,75,0,0,0,0,75,0,0,0]], from: [], position: 'standing', focus: ['balance', 'glutes', 'hamstrings'], intensity: 3.3, met: 4.5, level: 2, cue: c('Hinge on one leg, the other leg long behind, arms out like wings; hips level.', 'Inclinati su una gamba, l\'altra lunga dietro, braccia aperte come ali; anche in linea.') },
  halfLift: { frames: [[100,105,0,0,0,0,0,0,0,0]], from: [], position: 'standing', focus: ['hamstrings', 'lowerBack'], intensity: 1.6, met: 2.5, level: 1, cue: c('Hands on the shins, lengthen the spine forward with a flat back.', 'Mani sugli stinchi, allunga la colonna in avanti con la schiena piatta.') },
  neckStand: { frames: [[180,180,10,0,-10,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,0,0,0.22],[180,180,10,0,-10,0,0,0,0,0,0,0,0,0,0,0,0,0,-30,0,0,0,0,0,0.22]], from: [], position: 'standing', focus: ['neckUpperBack'], intensity: 1, met: 2, level: 1, cue: c('Shoulders down, let the ear sink toward one shoulder, then the other.', 'Spalle basse, lascia scendere l\'orecchio verso una spalla, poi verso l\'altra.') },
  handsBehindStand: { frames: [[182,192,-38,-38,-38,-38,0,0,0,0,0,0,0,0,0,0,-8,0,0,0,0,0,0,0,0.22]], from: [], position: 'standing', focus: ['chestOpening', 'shoulders'], intensity: 1.2, met: 2.2, level: 1, cue: c('Interlace the hands behind the back, draw the shoulders back and lift the chest.', 'Intreccia le mani dietro la schiena, porta indietro le spalle e solleva il petto.') },
  supineArms: { frames: [[-90,-90,-95,-95,-95,-95,90,90,90,90]], from: [], position: 'supine', focus: ['shoulders', 'chestOpening'], intensity: 1, met: 2, level: 1, cue: c('Lying on the back, reach the arms overhead along the floor and lengthen.', 'Sdraiato sulla schiena, porta le braccia sopra la testa lungo il pavimento e allungati.') },
  squatReach: { frames: [[140,150,170,170,170,170,85,-10,85,-10]], from: [], position: 'standing', focus: ['legStrength', 'shoulders'], intensity: 3.4, met: 4.5, level: 1, cue: c('Sit low in the squat and reach both arms up, chest lifted.', 'Scendi in squat e allunga entrambe le braccia in alto, petto sollevato.') },
  seatedLegRaise: { frames: [[180,180,-15,0,-15,0,90,90,90,90],[176,180,-15,0,-15,0,90,90,128,128]], from: [], position: 'seated', focus: ['core', 'hipFlexors'], intensity: 2.8, met: 3.5, level: 1, cue: c('Sit tall with the hands behind the hips; lift one straight leg and lower it with control.', 'Siedi alto con le mani dietro le anche; solleva una gamba tesa e abbassala con controllo.') },
  standSideLift: { frames: [[180,180,10,10,10,10,-3,-3,3,3],[178,178,20,20,20,20,-3,-3,42,42]], from: [], facing: 90, position: 'standing', focus: ['glutes', 'balance'], intensity: 3, met: 4, level: 1, cue: c('Stand tall on one leg and lift the other straight out to the side without leaning.', 'In piedi su una gamba, solleva l\'altra tesa di lato senza inclinarti.') },
  standKickback: { frames: [[180,180,10,0,-10,0,0,0,0,0],[165,170,30,60,30,60,0,0,-42,-42]], from: [], position: 'standing', focus: ['glutes', 'hamstrings'], intensity: 3.4, met: 4.5, level: 1, cue: c('Lean slightly forward and press one straight leg back, squeezing the glute.', 'Inclinati leggermente in avanti e spingi indietro una gamba tesa, stringendo il gluteo.') },
  armCurl: { frames: [[180,180,10,0,-10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[180,180,0,150,0,150,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]], from: [], position: 'standing', focus: ['armStrength'], intensity: 2.6, met: 3.5, level: 1, cue: c('Elbows close to the sides, curl the hands up to the shoulders and lower slowly.', 'Gomiti vicini ai fianchi, porta le mani alle spalle piegando i gomiti e scendi lentamente.') },
  standBackbend: { frames: [[180,180,10,0,-10,0,0,0,0,0],[198,212,175,175,175,175,6,4,6,4]], from: [], position: 'standing', focus: ['backbends', 'chestOpening'], intensity: 1.6, met: 2.5, level: 1, cue: c('Hands up, lift the chest and lean back gently, pressing the hips forward.', 'Braccia in alto, solleva il petto e inclinati indietro con dolcezza, spingendo le anche in avanti.') },
  halfSplitH: { frames: [[70,55,0,0,0,0,0,-90,60,60]], from: [], position: 'kneeling', focus: ['hamstrings', 'flexibility'], intensity: 1.5, met: 2.3, level: 1, cue: c('Back knee down, front leg straight; hips back over the knee and fold forward.', 'Ginocchio dietro a terra, gamba davanti tesa; anche indietro e piegati in avanti.'), tags: ['knee'] },
  standKneeHug: { frames: [[180,180,45,110,45,110,0,0,140,-20]], from: [], position: 'standing', focus: ['glutes', 'balance', 'lowerBack'], intensity: 1.3, met: 2.3, level: 1, cue: c('Standing tall, hug one knee to the chest and keep the standing leg strong.', 'In piedi, abbraccia un ginocchio al petto e tieni forte la gamba d\'appoggio.') },
  standQuad: { frames: [[180,180,15,5,-18,-12,0,0,0,-170]], from: [], position: 'standing', focus: ['quads', 'balance'], intensity: 1.3, met: 2.3, level: 1, cue: c('Hold the foot behind you, knees together, and stand tall; the other arm out for balance.', 'Tieni il piede dietro di te, ginocchia vicine, e resta alto; l\'altro braccio aperto per l\'equilibrio.') },
  seatedTwistH: { frames: [[180,165,-25,-5,80,60,90,-100,150,0,0,0,0,0,0,0,0,30,0,0,0,0,45]], from: [], position: 'seated', focus: ['twists', 'spineMobility'], intensity: 1.4, met: 2.3, level: 1, cue: c('Sit tall, one knee up; hug it and turn the chest toward the hand behind you.', 'Siedi alto, un ginocchio piegato; abbraccialo e ruota il petto verso la mano dietro.') },
  wideFoldTwist: { frames: [[8,0,180,180,0,0,-12,-12,12,12,6,0,0,0,0,0,0,0,0,0,0,0,50,0,0]], from: [], facing: 90, position: 'standing', focus: ['hamstrings', 'twists'], intensity: 1.8, met: 2.6, level: 1, cue: c('Feet wide, fold forward, one hand down and the other reaching up as the chest turns.', 'Piedi larghi, piegati in avanti, una mano a terra e l\'altra verso l\'alto mentre il petto ruota.') },
  birdDogH: { frames: [[105, 110, 0, 0, 0, 0, 0, -90, 0, -90], [100, 105, 88, 88, 0, 0, 0, -90, -86, -86]], from: [], position: 'kneeling', focus: ['core', 'lowerBack', 'balance'], intensity: 2.8, met: 3.8, level: 1, cue: c('From hands and knees reach one arm forward and the opposite leg back, level with the trunk.', 'A quattro zampe allunga un braccio in avanti e la gamba opposta indietro, in linea con il busto.') },
  pyramidH: { from: ['pyramid'], position: 'standing', focus: ['hamstrings', 'flexibility'], intensity: 1.6, met: 2.4, level: 1, cue: c('Feet staggered, both legs straight, fold over the front leg with a long spine.', 'Piedi sfalsati, gambe tese, piegati sulla gamba davanti con la colonna lunga.') },
  seatedSideH: { from: ['seatedSideBend'], position: 'seated', focus: ['flexibility', 'shoulders'], intensity: 1.2, met: 2.2, level: 1, cue: c('Sit tall, reach one arm up and over, both sit bones grounded.', 'Siedi alto, porta un braccio in alto e di lato, ischi ben radicati.') },
  armsSide: { from: [], frames: [ARMS_LOW, ARMS_T], facing: 90, position: 'standing', focus: ['shoulders', 'armStrength'], intensity: 2.8, met: 4, level: 1, cue: c('Stand tall, brace the core and lift the arms out to the sides with control.', 'In piedi alto, addome attivo, solleva le braccia lateralmente con controllo.') },
  angel: { from: [], frames: [ARMS_LOW, ARMS_UP], facing: 90, position: 'standing', focus: ['shoulders', 'chestOpening', 'neckUpperBack'], intensity: 2.5, met: 3.5, level: 1, cue: c('Sweep the arms out to the sides and up overhead like wings, then lower them slowly.', 'Porta le braccia lateralmente e sopra la testa come ali, poi abbassale lentamente.') },
  reversePlank: { from: [], frames: [[-113, -122, 0, 0, 0, 0, 67, 67, 67, 67]], position: 'seated', focus: ['armStrength', 'shoulders', 'glutes', 'core'], intensity: 3.8, met: 5, level: 2, cue: c('Hands behind under the shoulders, fingers toward the feet; lift the hips until the body is one straight line.', 'Mani dietro sotto le spalle, dita verso i piedi; solleva le anche finché il corpo è una linea dritta.'), tags: ['wrist'] },
  arms: { from: ['tadasana', 'urdhvaHastasana'], position: 'standing', focus: ['shoulders', 'armStrength'], intensity: 2.8, met: 4, level: 1, cue: c('Stand tall, brace the core and move the arms with control through the full range.', 'In piedi alto, addome attivo, muovi le braccia con controllo per tutta l\'ampiezza.') },
  punch: { from: ['chair', 'tadasana'], position: 'standing', focus: ['shoulders', 'armStrength', 'core'], intensity: 3.8, met: 6, level: 1, cue: c('Soft knees, fists by the chin, punch fast and pull back just as quickly.', 'Ginocchia morbide, pugni al mento, colpisci veloce e richiama altrettanto rapido.') },
  calf: { from: ['tadasana', 'urdhvaHastasana'], position: 'standing', focus: ['legStrength', 'balance'], intensity: 2.8, met: 4, level: 1, cue: c('Rise onto the balls of the feet, pause at the top and lower slowly.', 'Sali sulle punte, fermati in alto e scendi lentamente.') },
  balance: { from: ['tadasana', 'warrior3'], position: 'standing', focus: ['balance', 'glutes', 'hamstrings'], intensity: 3.3, met: 4.5, level: 2, cue: c('Find a steady point to look at, hinge on one leg and keep the hips level.', 'Fissa un punto, inclinati su una gamba e tieni le anche allineate.') },
  kick: { from: ['tadasana', 'highKnees'], position: 'standing', focus: ['legStrength', 'core', 'hipFlexors'], intensity: 3.8, met: 6, level: 1, cue: c('Stand tall, kick with control and bring the leg back without leaning.', 'Busto alto, calcia con controllo e riporta la gamba senza inclinarti.') },
  legLiftStanding: { from: ['tadasana', 'tree'], position: 'standing', focus: ['glutes', 'balance'], intensity: 3, met: 4, level: 1, cue: c('Shift weight to the standing leg and lift the other leg without tipping the torso.', 'Sposta il peso sulla gamba d\'appoggio e solleva l\'altra senza inclinare il busto.') },
  squat: { from: ['squat'], position: 'standing', focus: ['legStrength', 'glutes', 'quads'], intensity: 3.6, met: 5, level: 1, cue: c('Feet hip-width, hips back and down, chest up, drive through the heels to stand.', 'Piedi alla larghezza delle anche, anche indietro e giù, petto alto, spingi sui talloni per risalire.') },
  sumo: { from: ['goddess', 'tadasana'], facing: 90, position: 'standing', focus: ['glutes', 'quads', 'hipOpeners'], intensity: 3.6, met: 5, level: 1, cue: c('Wide stance, toes out, knees track over the toes as you sink and rise.', 'Gambe larghe, punte in fuori, ginocchia sopra le punte mentre scendi e risali.') },
  squatHold: { from: ['wallSit'], position: 'standing', focus: ['quads', 'legStrength', 'glutes'], intensity: 3.5, met: 4.5, level: 1, cue: c('Sit low and hold; weight in the heels, chest proud, breathe steadily.', 'Resta in basso e mantieni; peso sui talloni, petto aperto, respira regolare.') },
  jumpSquat: { from: ['jumpSquat'], position: 'standing', focus: ['legStrength', 'glutes'], intensity: 5, met: 9, level: 3, cue: c('Squat down, explode up and land softly through the whole foot.', 'Scendi in squat, esplodi verso l\'alto e atterra morbido su tutto il piede.'), tags: ['jump', 'knee'] },
  lunge: { from: ['lunges'], position: 'standing', focus: ['legStrength', 'quads', 'glutes', 'balance'], intensity: 3.8, met: 6, level: 1, cue: c('Step long, lower until both knees bend to about ninety degrees, push back up.', 'Fai un passo lungo, scendi finché le ginocchia sono a circa novanta gradi e risali.'), tags: ['knee'] },
  sideLunge: { from: ['skaters'], facing: 90, position: 'standing', focus: ['legStrength', 'glutes', 'hipOpeners'], intensity: 3.8, met: 6, level: 1, cue: c('Step out wide, sit back into one hip with the other leg straight, then push back.', 'Fai un passo laterale ampio, siedi su un\'anca con l\'altra gamba tesa, poi spingi per tornare.'), tags: ['knee'] },
  // standing, then the back leg crosses behind on a diagonal and both knees bend (curtsy)
  curtsey: { frames: [[180, 180, 10, 0, -10, 0, 0, 0, 0, 0], [178, 178, 20, 60, 20, 60, -28, -88, 78, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, -28, 0]], from: ['lunges', 'tadasana'], position: 'standing', focus: ['glutes', 'legStrength', 'balance'], intensity: 3.8, met: 6, level: 2, cue: c('Cross one leg behind on a diagonal, lower with control and stand tall again.', 'Incrocia una gamba dietro in diagonale, scendi con controllo e torna in piedi.'), tags: ['knee'] },
  jack: { from: ['jumpingJacks'], facing: 90, position: 'standing', focus: ['legStrength', 'shoulders'], intensity: 4, met: 8, level: 1, cue: c('Jump the feet out as the arms rise, back in as they lower, light on the feet.', 'Salta aprendo i piedi mentre alzi le braccia, chiudi mentre le abbassi, leggero sui piedi.'), tags: ['jump'] },
  run: { from: ['highKnees'], position: 'standing', focus: ['legStrength', 'core', 'hipFlexors'], intensity: 4.6, met: 8.5, level: 1, cue: c('Drive the knees up quickly, stay on the balls of the feet and pump the arms.', 'Porta su le ginocchia velocemente, resta sulle punte e accompagna con le braccia.') },
  buttKick: { from: ['buttKicks'], position: 'standing', focus: ['quads', 'legStrength'], intensity: 4.2, met: 8, level: 1, cue: c('Kick the heels toward the glutes in a quick rhythm, staying light.', 'Calcia i talloni verso i glutei con ritmo veloce, restando leggero.') },
  skater: { from: ['skaters'], facing: 90, position: 'standing', focus: ['legStrength', 'glutes', 'balance'], intensity: 4.5, met: 7, level: 2, cue: c('Bound side to side, land softly on one leg and let the other swing behind.', 'Salta da un lato all\'altro, atterra morbido su una gamba e lascia l\'altra dietro.'), tags: ['jump'] },
  burpee: { from: ['burpee'], position: 'standing', focus: ['core', 'legStrength', 'armStrength'], intensity: 5, met: 10, level: 3, cue: c('Hands down, step or jump back to plank, return the feet and stand or jump up.', 'Mani a terra, passa in plank, riporta i piedi e torna in piedi o salta.'), tags: ['jump', 'wrist'] },
  walkout: { from: ['uttanasana', 'plank'], position: 'armBalance', focus: ['core', 'shoulders', 'hamstrings'], intensity: 3.8, met: 6, level: 1, cue: c('Fold down, walk the hands out to plank, then walk them back and roll up.', 'Piegati, cammina con le mani fino al plank, poi torna indietro e risali.'), tags: ['wrist'] },
  pushup: { from: ['pushUp'], position: 'armBalance', focus: ['armStrength', 'chestOpening', 'core'], intensity: 4.3, met: 7, level: 2, cue: c('Hands under the shoulders, body in one line, lower the chest and press away.', 'Mani sotto le spalle, corpo in linea, abbassa il petto e spingi via il pavimento.'), tags: ['wrist'] },
  // push-up from the knees: knees down, one line from knees to head, the chest lowers between the hands
  kneePushup: { frames: [[114, 110, 0, 0, 0, 0, -66, -130, -66, -130], [104, 104, -60, 0, -60, 0, -76, -135, -76, -135]], from: ['pushUp'], position: 'kneeling', focus: ['armStrength', 'chestOpening'], intensity: 3.5, met: 5, level: 1, cue: c('From the knees, keep hips in line with the shoulders, lower and press up.', 'Dalle ginocchia, anche allineate alle spalle, scendi e spingi su.'), tags: ['wrist'] },
  plank: { from: ['plank', 'shoulderTaps'], position: 'armBalance', focus: ['core', 'shoulders'], intensity: 4, met: 5.5, level: 2, cue: c('Strong plank: shoulders over wrists, belly in, glutes engaged, hips steady.', 'Plank solido: spalle sopra i polsi, pancia dentro, glutei attivi, anche ferme.'), tags: ['wrist'] },
  forearmPlank: { from: ['forearmPlank'], position: 'armBalance', focus: ['core', 'shoulders'], intensity: 3.8, met: 5, level: 2, cue: c('On the forearms, elbows under shoulders, keep a long line from head to heels.', 'Sugli avambracci, gomiti sotto le spalle, linea lunga dalla testa ai talloni.') },
  // plank on the knees, held (the push-up frames, first one only when held)
  kneePlank: { frames: [[114, 110, 0, 0, 0, 0, -66, -130, -66, -130], [104, 104, -60, 0, -60, 0, -76, -135, -76, -135]], from: ['tableTop', 'plank'], position: 'kneeling', focus: ['core', 'shoulders'], intensity: 3, met: 4, level: 1, cue: c('Knees down, hips in line, belly drawn in and shoulders stable.', 'Ginocchia a terra, anche in linea, pancia dentro e spalle stabili.'), tags: ['wrist'] },
  sidePlank: { from: ['sidePlank'], position: 'armBalance', focus: ['core', 'shoulders', 'twists'], intensity: 4, met: 5, level: 2, cue: c('Stack the hips, lift them high and keep the supporting shoulder strong.', 'Anche sovrapposte, sollevale in alto e tieni forte la spalla d\'appoggio.') },
  climber: { from: ['mountainClimbers'], position: 'armBalance', focus: ['core', 'armStrength', 'hipFlexors'], intensity: 4.8, met: 8, level: 2, cue: c('From plank, drive the knees toward the chest one at a time, hips low.', 'Dal plank, porta le ginocchia al petto alternandole, anche basse.'), tags: ['wrist'] },
  bear: { from: ['tableTop', 'mountainClimbers'], position: 'kneeling', focus: ['core', 'shoulders', 'quads'], intensity: 4, met: 6, level: 2, cue: c('Knees hovering just off the floor, back flat; move without letting the hips rise.', 'Ginocchia sollevate di poco dal pavimento, schiena piatta; muoviti senza alzare le anche.'), tags: ['wrist'] },
  crab: { from: ['tricepDips'], position: 'seated', focus: ['armStrength', 'shoulders', 'glutes'], intensity: 3.8, met: 5, level: 2, cue: c('Hands behind, fingers forward, hips lifted; move with control, chest open.', 'Mani dietro, dita in avanti, anche sollevate; muoviti con controllo, petto aperto.'), tags: ['wrist'] },
  dip: { from: ['tricepDips'], position: 'seated', focus: ['armStrength', 'shoulders'], intensity: 3.8, met: 5, level: 2, cue: c('Bend the elbows straight back to lower, then press up through the palms.', 'Piega i gomiti dritti indietro per scendere, poi spingi sui palmi.'), tags: ['wrist'] },
  bridge: { from: ['gluteBridge'], position: 'supine', focus: ['glutes', 'lowerBack', 'hamstrings'], intensity: 3, met: 4, level: 1, cue: c('Feet close to the hips, press through the heels and lift the hips, squeeze at the top.', 'Piedi vicini alle anche, spingi sui talloni e solleva il bacino, stringi in alto.') },
  superman: { from: ['superman'], position: 'prone', focus: ['lowerBack', 'glutes', 'shoulders'], intensity: 3, met: 4, level: 1, cue: c('Face down, lift chest and limbs long and low, neck in line with the spine.', 'A pancia in giù, solleva petto e arti lunghi e bassi, collo in linea con la colonna.') },
  swimmer: { from: ['swimming'], position: 'prone', focus: ['lowerBack', 'shoulders', 'glutes'], intensity: 3.3, met: 4.5, level: 1, cue: c('Lift opposite arm and leg in a quick flutter while the belly stays lifted.', 'Alterna braccio e gamba opposti con un battito rapido, pancia sollevata.') },
  crunch: { from: ['crissCross', 'singleLegStretch'], position: 'supine', focus: ['core'], intensity: 3.5, met: 4.5, level: 1, cue: c('Curl the head and shoulders up, ribs toward the hips, and lower with control.', 'Solleva testa e spalle, costole verso le anche, e scendi con controllo.') },
  twistCrunch: { from: ['crissCross'], position: 'supine', focus: ['core', 'twists'], intensity: 3.8, met: 5, level: 1, cue: c('Rotate from the ribs, bringing the shoulder toward the opposite knee.', 'Ruota dalle costole portando la spalla verso il ginocchio opposto.') },
  situp: { from: ['rollUp'], position: 'supine', focus: ['core', 'spineMobility'], intensity: 3.8, met: 5, level: 2, cue: c('Roll up one vertebra at a time, reach forward, then roll back down slowly.', 'Sali una vertebra alla volta, allungati in avanti, poi torna giù lentamente.') },
  bicycle: { from: ['bicycle'], position: 'supine', focus: ['core', 'twists'], intensity: 4, met: 5.5, level: 2, cue: c('Elbow toward the opposite knee as the other leg extends, steady rhythm.', 'Gomito verso il ginocchio opposto mentre l\'altra gamba si distende, ritmo costante.') },
  russian: { from: ['russianTwist'], position: 'seated', focus: ['core', 'twists'], intensity: 4, met: 5, level: 2, cue: c('Lean back with a long spine and rotate the chest side to side.', 'Inclinati indietro con la colonna lunga e ruota il petto da un lato all\'altro.') },
  boat: { from: ['boat'], position: 'seated', focus: ['core', 'hipFlexors'], intensity: 3.8, met: 4.5, level: 2, cue: c('Balance on the sit bones, chest lifted, legs up; keep the back from rounding.', 'In equilibrio sugli ischi, petto alto, gambe sollevate; non arrotondare la schiena.') },
  legLower: { from: ['hundred', 'doubleLegStretch'], position: 'supine', focus: ['core', 'hipFlexors'], intensity: 3.8, met: 4.5, level: 2, cue: c('Press the lower back into the floor and move the legs only as low as you can control.', 'Schiaccia la zona lombare a terra e muovi le gambe solo finché le controlli.') },
  // on the back, arms up and shins level; the opposite arm and leg reach long, low
  deadBug: { frames: [[-90, -90, 180, 180, 180, 180, 180, 90, 180, 90], [-90, -90, -100, -100, 180, 180, 180, 90, 105, 105]], from: ['singleLegStretch'], position: 'supine', focus: ['core'], intensity: 3.3, met: 4, level: 1, cue: c('Arms up, knees over hips; extend opposite arm and leg without arching the back.', 'Braccia su, ginocchia sopra le anche; distendi braccio e gamba opposti senza inarcare.') },
  wiper: { from: ['supineTwist', 'hundred'], position: 'supine', focus: ['core', 'twists'], intensity: 3.6, met: 4.5, level: 2, cue: c('Legs together, tip them side to side with control while the shoulders stay down.', 'Gambe unite, portale da un lato all\'altro con controllo, spalle a terra.') },
  // hands and knees; one knee stays bent and drives the sole up toward the ceiling (donkey kick)
  // hands and knees; one bent knee lifts out to the side to hip height (fire hydrant)
  hydrant: { frames: [[105, 110, 0, 0, 0, 0, 0, -90, 0, -90], [105, 110, 0, 0, 0, 0, 0, -90, 0, -90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 0]], from: ['tableTop'], position: 'kneeling', focus: ['glutes', 'hipOpeners'], intensity: 3, met: 4, level: 1, cue: c('On hands and knees, lift one bent knee out to the side to hip height, keeping the hips level.', "A quattro zampe, solleva di lato un ginocchio piegato fino all'altezza dell'anca, bacino fermo.") },
  quadruped: { frames: [[105, 110, 0, 0, 0, 0, 0, -90, 0, -90], [103, 108, 0, 0, 0, 0, 0, -90, -88, 175]], from: ['tableTop', 'catCow'], position: 'kneeling', focus: ['glutes', 'core'], intensity: 3, met: 4, level: 1, cue: c('On hands and knees, back flat; move the leg from the hip without twisting.', 'A quattro zampe, schiena piatta; muovi la gamba dall\'anca senza ruotare.'), tags: ['knee', 'wrist'] },
  sideLying: { from: ['clam', 'sideKick'], position: 'supine', focus: ['glutes', 'hipOpeners'], intensity: 2.8, met: 3.8, level: 1, cue: c('Lying on your side, hips stacked; lift and lower the leg slowly.', 'Sdraiato su un fianco, anche sovrapposte; solleva e abbassa la gamba lentamente.') },
  downDog: { from: ['downDog', 'plank'], position: 'inverted', focus: ['shoulders', 'hamstrings', 'core'], intensity: 3.5, met: 5, level: 2, cue: c('Hips high, press the floor away, then flow forward keeping the core engaged.', 'Anche alte, spingi via il pavimento, poi scorri in avanti con l\'addome attivo.'), tags: ['wrist'] },
  slam: { from: ['squat', 'urdhvaHastasana'], position: 'standing', focus: ['legStrength', 'shoulders', 'core'], intensity: 4.5, met: 7.5, level: 2, cue: c('Reach tall, then drive down powerfully into a squat, and rise again.', 'Allungati verso l\'alto, poi scendi con forza in squat e risali.') },
};

/** Names whose movement is specific: checked before every other rule, stretches included. */
const SPECIFIC: [RegExp, string][] = [
  [/supine one leg extension|alternating dead bug|dead bug/i, 'deadBug'],
  [/knee to alternating elbows|cross body high steps|cross knee to toe touch|standing crunches|single side standing crunch|standing side crunches|twisted march|squat twists/i, 'kneeCross'],
  [/airplane hold/i, 'airplane'],
  [/halfway lift/i, 'halfLift'],
  [/^neck stretch$/i, 'neckStand'],
  [/biceps stretch|shoulder opener|rotated shoulder stretch|arm extension stretch/i, 'handsBehindStand'],
  [/supine shoulder stretch/i, 'supineArms'],
  [/squat arm reach hold/i, 'squatReach'],
  [/seated (cross )?leg raise|seated single leg (circles|half circles)/i, 'seatedLegRaise'],
  [/curtsey lunge to side leg raise|reverse lunge to side leg lift|squat to side leg lift|layer bend|triangle leg lift|leg lift knee to elbow/i, 'standSideLift'],
  [/curtsey lunge to (opposite )?kick ?backs?|squat to alternating kickbacks|switching lunges to kickbacks/i, 'standKickback'],
  [/inner thigh (abductors|leg lift|raises)/i, 'sideLying'],
  [/table top side leg lift/i, 'hydrant'],
  [/table top extended reach/i, 'birdDogH'],
  [/curly arms|bent arm raises|milk jugs/i, 'armCurl'],
  [/rotating slams|^slams$|squat push pulls|squat and press/i, 'slam'],
  [/standing backbend/i, 'standBackbend'],
  [/low lunge hamstring stretch/i, 'halfSplitH'],
  [/seated hamstring stretch|seated wide leg fold|seated forward fold/i, 'stretchSeated'],
  [/pyramid stretch/i, 'pyramidH'],
  [/hamstring curls/i, 'buttKick'],
  [/standing knee hug/i, 'standKneeHug'],
  [/standing quad stretch/i, 'standQuad'],
  [/^seated twist$/i, 'seatedTwistH'],
  [/wide fold twists/i, 'wideFoldTwist'],
  [/calf raise/i, 'calf'],
  [/seated side stretch/i, 'seatedSideH'],
  [/plank hip dips/i, 'plank'],
];

/** Ordered keyword rules: the first match decides the family. */
const RULES: [RegExp, string][] = [
  [/(torsione|twist).*affondo|affondo.*(torsione|twist)|lunge.*twist/i, 'stretchLungeTwist'],
  [/tricip.*(seduti|dietro)|tricep.*(seated|behind)/i, 'stretchTricep'],
  [/seated twist|supine twists?$|torsione/i, 'stretchTwist'],
  [/burpee/i, 'burpee'],
  [/walk ?out|inchworm|floor walk/i, 'walkout'],
  [/down ?dog|downward dog|three legged dog/i, 'downDog'],
  [/side plank/i, 'sidePlank'],
  [/forearm/i, 'forearmPlank'],
  [/knee (down|plank|forearm|commando|push|roundabout|typewriter|staggered|traveling|tricep|alternating single)|knee plank|kneeling|floor to knee/i, 'kneePlank'],
  [/push ?ups?|pushup|press-?ups?|press up|commando|gorilla|tricep push/i, 'pushup'],
  [/mountain climber|spiderman|climber/i, 'climber'],
  [/bear|lateral bear|military crawl|frogger/i, 'bear'],
  [/reverse (plank|table)/i, 'reversePlank'],
  [/crab|l to crab/i, 'crab'],
  [/tricep dip|dips?\b/i, 'dip'],
  [/plank|shoulder taps|plank jack|hip dips/i, 'plank'],
  [/glute bridge|bridge|hip thrust/i, 'bridge'],
  [/swimmer|breaststroke/i, 'swimmer'],
  [/superman|back bow|belly|cobra super|w-raise|t-raise|t, y|y, w|t drop/i, 'superman'],
  [/bicycle|cycles/i, 'bicycle'],
  [/russian twist|core rotations/i, 'russian'],
  [/boat|v crunch|v walkout|half boat|candle ?stick/i, 'boat'],
  [/dead ?bug|supine extension|diagonal leg/i, 'deadBug'],
  [/windshield|metronome|wiper/i, 'wiper'],
  [/flutter|scissor|leg drop|hundreds?|forty-five|lower ab|leg raise switch|straight leg (supine|overhead)|1, 2, 3|wide leg drop|leg flutter|ceiling kick|rainbow kick|rocket launcher/i, 'legLower'],
  [/sit ?ups?|roll ?ups?|roll ins|clapping/i, 'situp'],
  [/cross crunch|criss|twist|toe touch.*twist|oblique|side crunch|cross body crunch|circle crunch|three way/i, 'twistCrunch'],
  [/crunch|heel tap|toe tap crunch|reach up|butterfly (sit|crunch|cross)|frog crunch|knee in|knee to nose|toe touches?$|wide toe touch|double crab|knee lift crunch/i, 'crunch'],
  [/hydrant|idrant/i, 'hydrant'],
  [/donkey|calci dell|table top|four point|kick backs?|kickback|frog kick|bird|quadruped|cat|inner thigh(?! circles)/i, 'quadruped'],
  [/clam|side leg|inner thigh|abductor(?! squat)|lifted clam|layer bend|leg lift knee|triangle leg/i, 'sideLying'],
  [/jump squat|squat jump|explosive squat|jump to drop|squat to hop|knee down squat to hop|drop squat/i, 'jumpSquat'],
  [/sumo|wide squat|pivot squat|plié|deep sumo|abductor squat/i, 'sumo'],
  [/squat hold|chair|wall sit|squat to squat hold/i, 'squatHold'],
  [/slam|squat and press|rocket|wood ?chop|push pulls/i, 'slam'],
  [/curtsey/i, 'curtsey'],
  [/side lunge|lateral lunge|side step|step out|lateral step|lateral quick/i, 'sideLunge'],
  [/lunge|split jump|sprinter/i, 'lunge'],
  [/squat/i, 'squat'],
  [/skater|lateral pogo|side jump|cross hop|lateral hop|single leg (cross|lateral) hop/i, 'skater'],
  [/jack|star jack|half jack|fly jack|pull jack/i, 'jack'],
  [/butt kick/i, 'buttKick'],
  [/high knee|jog|run(ner)?s?\b|march|skip|sprint|quick feet|fast feet|shuffle|jump rope|boxer|power skip|knee pump|knee drive|wild things/i, 'run'],
  [/airplane|single leg (balance|deadlift|windmill)|deadlift|balance|hinge/i, 'balance'],
  [/kick|front kick|bunny|knee to elbow|knee up/i, 'kick'],
  [/standing leg lift|leg lift|leg circles|leg swing|pendulum|straight leg|leg raise/i, 'legLiftStanding'],
  [/calf raise|calf/i, 'calf'],
  [/punch|slams/i, 'punch'],
  [/angel/i, 'angel'],
  [/lateral raise|side arm|arm circles|\bfly\b|flies|t-raise|t raise|arm swing|arm open/i, 'armsSide'],
  [/arm|robot|milk jug|curly|raise|circles|scapula|shoulder roll|wrist|fly|flies|c-rotation|t-raise/i, 'arms'],
];

/** Stretches are matched on their own, so "Low Lunge Quad Stretch" is a stretch, not a lunge. */
const STRETCH_RULES: [RegExp, string][] = [
  [/tricip|tricep/i, 'stretchTricep'],
  [/(torsione|twist).*affondo|affondo.*(torsione|twist)|lunge.*twist/i, 'stretchLungeTwist'],
  [/twist|torsione|supine cross/i, 'stretchTwist'],
  [/calf|polpaccio/i, 'stretchCalf'],
  [/hamstring|forward fold|wide leg fold|piegamento in avanti|seated wide|rocking wide|wide fold|pyramid/i, 'stretchHam'],
  [/supine thigh|da supini|lying quad/i, 'stretchKnees'],
  [/quad|polpaccio|low lunge|runner stretch|coscia/i, 'stretchQuad'],
  [/figure four|pigeon|butterfly|hip|fianchi|sumo stretch|squat stretch/i, 'stretchHip'],
  [/side (body )?stretch|laterale|side bend|layer|sweep/i, 'stretchSide'],
  [/supine twist|torsione|supine cross|wide fold twist/i, 'stretchTwist'],
  [/cobra|schiena|back/i, 'stretchBack'],
  [/knee hug|single knee hug/i, 'stretchKnees'],
  [/seated|da seduti/i, 'stretchSeated'],
  [/neck|shoulder|tricep|bicep|chest|opener|stretch|bend|halfway lift|standing$/i, 'stretchUpper'],
];

const slug = (s: string) => 'x_' + s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('');
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '').replace(/s$/, '');

/** Italian names in the source list, with an English name to go with them. */
const IT_NAMES: Record<string, string> = {
  'allungamento del polpaccio': 'Calf Stretch',
  "calci dell'asino": 'Donkey Kicks',
  'cerchi con i fianchi': 'Hip Circles',
  cobra: 'Cobra',
  'criss cross': 'Criss Cross',
  'crunch nella panca laterale': 'Side Plank Crunch',
  'piegamento della schiena in posizione eretta': 'Standing Backbend',
  'piegamento in avanti da seduti': 'Seated Forward Fold',
  'stiramento del quadricipite in piedi': 'Standing Quad Stretch',
  'stiramento della coscia da supini': 'Supine Thigh Stretch',
  'stiramento laterale da seduti': 'Seated Side Stretch',
  'torsione da seduti': 'Seated Twist',
};

export function buildHiitCatalog(lookup: (id: string) => Move | undefined, existingNames: string[]): Move[] {
  const frameOf = (id: string) => (lookup(id) ?? YOGA_BY_ID[id])?.frames;
  const taken = new Set(existingNames.map(norm));
  const out: Move[] = [];
  for (const raw of HIIT_CATALOG_NAMES) {
    const en = IT_NAMES[raw] ?? raw;
    const tr = HIIT_NAME_TR[en];
    const name: L10n = tr ? { en, it: tr[0], es: tr[1], fr: tr[2], de: tr[3], pt: tr[4] } : { en };
    if (taken.has(norm(en))) continue;
    taken.add(norm(en));
    const stretchy = /stretch|allungamento|stiramento|forward fold|wide leg fold|opener|deep breath|rocking wide|wide fold|knee hug/i.test(raw);
    const hit = (rules: [RegExp, string][]) => rules.find(([re]) => re.test(raw) || re.test(en))?.[1];
    const fam = FAMILIES[hit(SPECIFIC) ?? (stretchy ? hit(STRETCH_RULES) ?? 'stretchUpper' : hit(RULES) ?? hit(STRETCH_RULES)) ?? 'squat'];
    // keyframes: the first frame of each template move; a single template keeps its own animation
    const tpl = fam.frames ? [fam.frames] : (fam.from.map(frameOf).filter(Boolean) as number[][][]);
    if (!tpl.length) continue;
    let frames = tpl.length === 1 ? tpl[0] : tpl.map((f) => f[0]);
    const s = en.toLowerCase();
    const hold = /\bhold\b|holds\b|stretch/.test(s);
    if (hold) frames = [frames[0]];
    const tags = new Set(fam.tags ?? []);
    let level: number = fam.level;
    let intensity = fam.intensity;
    let met = fam.met;
    if (/jump|hop|pop\b|pops\b|explosive|plyo|skip|bounce|leap|star/.test(s)) {
      tags.add('jump');
      intensity += 0.8;
      met += 2.5;
      level = Math.max(level, 2);
    }
    if (/explosive|split jump|one arm|clapping|star push|pike|diamond|gorilla|single arm push|spiderman plank to bear/.test(s)) level = 3;
    if (/single leg|single arm|one leg/.test(s)) level = Math.max(level, 2);
    if (/modified|knee down|knee plank|slow|kneeling|gently|assisted/.test(s)) {
      level = 1;
      intensity -= 0.5;
      met -= 1;
    }
    if (hold) intensity -= 0.3;
    if (/lunge|kneel|knee down|knee plank|knee push/.test(s)) tags.add('knee');
    if (/push|plank(?!.*forearm)|bear|crab|dip|walkout|burpee|commando|mountain/.test(s) && !/forearm/.test(s)) tags.add('wrist');
    if (fam.facing) CATALOG_FACING.add(slug(en));
    out.push({
      id: slug(en),
      discipline: 'hiit',
      name,
      cue: fam.cue,
      short: fam.cue,
      position: /kneeling|knee (down|plank)|knee push/.test(s) && fam.position === 'armBalance' ? 'kneeling' : fam.position,
      level: Math.min(5, Math.max(1, level)) as Move['level'],
      intensity: Math.max(1, Math.min(5, Math.round(intensity * 10) / 10)),
      met: Math.max(2, Math.round(met * 10) / 10),
      focus: fam.focus,
      frames,
      bilateral: /single leg|single side|side lunge|side plank|curtsey|figure four|fire hydrant|clam|side leg|lateral|one leg/.test(s) || undefined,
      tags: tags.size ? [...tags] : undefined,
    });
  }
  return out;
}
