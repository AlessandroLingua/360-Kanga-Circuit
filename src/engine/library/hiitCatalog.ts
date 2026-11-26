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
};

const c = (en: string, it: string): L10n => ({ en, it });

const FAMILIES: Record<string, Family> = {
  stretchHam: { from: ['uttanasana'], position: 'standing', focus: ['hamstrings', 'flexibility'], intensity: 1.5, met: 2.5, level: 1, cue: c('Fold forward from the hips with soft knees and let the back of the legs lengthen.', 'Piegati in avanti dalle anche con le ginocchia morbide e lascia allungare la parte posteriore delle gambe.') },
  stretchQuad: { from: ['lowLunge'], position: 'kneeling', focus: ['quads', 'hipFlexors', 'flexibility'], intensity: 1.5, met: 2.5, level: 1, cue: c('Open the front of the thigh and hip; keep the pelvis tucked and breathe slowly.', 'Apri la parte anteriore della coscia e dell\'anca; bacino in retroversione e respira lento.'), tags: ['knee'] },
  stretchHip: { from: ['pigeon'], position: 'seated', focus: ['hipOpeners', 'glutes', 'flexibility'], intensity: 1.5, met: 2.5, level: 1, cue: c('Ease into the hip, keep the spine long and let the outer hip soften.', 'Entra piano nell\'anca, colonna lunga, lascia ammorbidire l\'esterno dell\'anca.') },
  stretchSide: { from: ['tadasana', 'reverseWarrior'], position: 'standing', focus: ['flexibility', 'spineMobility'], intensity: 1.5, met: 2.5, level: 1, cue: c('Reach long through the side of the body, ribs lifting away from the hips.', 'Allungati lungo il fianco, le costole si allontanano dalle anche.') },
  stretchUpper: { from: ['tadasana'], position: 'standing', focus: ['shoulders', 'chestOpening', 'neckUpperBack'], intensity: 1.5, met: 2.5, level: 1, cue: c('Relax the shoulders down, breathe into the stretch and keep the neck long.', 'Spalle rilassate in basso, respira nell\'allungamento e collo lungo.') },
  stretchSeated: { from: ['seatedFold'], position: 'seated', focus: ['hamstrings', 'lowerBack', 'flexibility'], intensity: 1.5, met: 2.3, level: 1, cue: c('Sit tall, then fold forward from the hips without forcing.', 'Siedi alto, poi piegati in avanti dalle anche senza forzare.') },
  stretchTwist: { from: ['supineTwist'], position: 'supine', focus: ['twists', 'spineMobility', 'lowerBack'], intensity: 1.5, met: 2.3, level: 1, cue: c('Let the knees fall to one side and keep both shoulders heavy.', 'Lascia cadere le ginocchia da un lato e tieni entrambe le spalle pesanti.') },
  stretchBack: { from: ['cobra'], position: 'prone', focus: ['backbends', 'chestOpening'], intensity: 1.8, met: 2.5, level: 1, cue: c('Press the hands down, lift the chest gently and keep the shoulders away from the ears.', 'Premi le mani, solleva il petto con dolcezza e allontana le spalle dalle orecchie.') },
  stretchKnees: { from: ['kneesToChest'], position: 'supine', focus: ['lowerBack', 'hipOpeners'], intensity: 1.3, met: 2.2, level: 1, cue: c('Hug the knee in and let the lower back release into the floor.', 'Abbraccia il ginocchio e lascia che la zona lombare si rilassi sul pavimento.') },
  stretchCalf: { from: ['downDog'], position: 'inverted', focus: ['hamstrings', 'flexibility'], intensity: 1.8, met: 2.5, level: 1, cue: c('Press the heel toward the floor and lengthen the back of the lower leg.', 'Spingi il tallone verso terra e allunga il polpaccio.'), tags: ['wrist'] },
  fold: { from: ['prasarita'], position: 'standing', focus: ['hamstrings', 'flexibility'], intensity: 1.8, met: 2.5, level: 1, cue: c('Feet wide, hinge forward with a long spine and let the head hang.', 'Piedi larghi, piegati in avanti con la colonna lunga e lascia pendere la testa.') },
  arms: { from: ['tadasana', 'urdhvaHastasana'], position: 'standing', focus: ['shoulders', 'armStrength'], intensity: 2.8, met: 4, level: 1, cue: c('Stand tall, brace the core and move the arms with control through the full range.', 'In piedi alto, addome attivo, muovi le braccia con controllo per tutta l\'ampiezza.') },
  punch: { from: ['chair', 'tadasana'], position: 'standing', focus: ['shoulders', 'armStrength', 'core'], intensity: 3.8, met: 6, level: 1, cue: c('Soft knees, fists by the chin, punch fast and pull back just as quickly.', 'Ginocchia morbide, pugni al mento, colpisci veloce e richiama altrettanto rapido.') },
  calf: { from: ['tadasana', 'urdhvaHastasana'], position: 'standing', focus: ['legStrength', 'balance'], intensity: 2.8, met: 4, level: 1, cue: c('Rise onto the balls of the feet, pause at the top and lower slowly.', 'Sali sulle punte, fermati in alto e scendi lentamente.') },
  balance: { from: ['tadasana', 'warrior3'], position: 'standing', focus: ['balance', 'glutes', 'hamstrings'], intensity: 3.3, met: 4.5, level: 2, cue: c('Find a steady point to look at, hinge on one leg and keep the hips level.', 'Fissa un punto, inclinati su una gamba e tieni le anche allineate.') },
  kick: { from: ['tadasana', 'highKnees'], position: 'standing', focus: ['legStrength', 'core', 'hipFlexors'], intensity: 3.8, met: 6, level: 1, cue: c('Stand tall, kick with control and bring the leg back without leaning.', 'Busto alto, calcia con controllo e riporta la gamba senza inclinarti.') },
  legLiftStanding: { from: ['tadasana', 'tree'], position: 'standing', focus: ['glutes', 'balance'], intensity: 3, met: 4, level: 1, cue: c('Shift weight to the standing leg and lift the other leg without tipping the torso.', 'Sposta il peso sulla gamba d\'appoggio e solleva l\'altra senza inclinare il busto.') },
  squat: { from: ['squat'], position: 'standing', focus: ['legStrength', 'glutes', 'quads'], intensity: 3.6, met: 5, level: 1, cue: c('Feet hip-width, hips back and down, chest up, drive through the heels to stand.', 'Piedi alla larghezza delle anche, anche indietro e giù, petto alto, spingi sui talloni per risalire.') },
  sumo: { from: ['goddess', 'tadasana'], position: 'standing', focus: ['glutes', 'quads', 'hipOpeners'], intensity: 3.6, met: 5, level: 1, cue: c('Wide stance, toes out, knees track over the toes as you sink and rise.', 'Gambe larghe, punte in fuori, ginocchia sopra le punte mentre scendi e risali.') },
  squatHold: { from: ['wallSit'], position: 'standing', focus: ['quads', 'legStrength', 'glutes'], intensity: 3.5, met: 4.5, level: 1, cue: c('Sit low and hold; weight in the heels, chest proud, breathe steadily.', 'Resta in basso e mantieni; peso sui talloni, petto aperto, respira regolare.') },
  jumpSquat: { from: ['jumpSquat'], position: 'standing', focus: ['legStrength', 'glutes'], intensity: 5, met: 9, level: 3, cue: c('Squat down, explode up and land softly through the whole foot.', 'Scendi in squat, esplodi verso l\'alto e atterra morbido su tutto il piede.'), tags: ['jump', 'knee'] },
  lunge: { from: ['lunges'], position: 'standing', focus: ['legStrength', 'quads', 'glutes', 'balance'], intensity: 3.8, met: 6, level: 1, cue: c('Step long, lower until both knees bend to about ninety degrees, push back up.', 'Fai un passo lungo, scendi finché le ginocchia sono a circa novanta gradi e risali.'), tags: ['knee'] },
  sideLunge: { from: ['skaters'], position: 'standing', focus: ['legStrength', 'glutes', 'hipOpeners'], intensity: 3.8, met: 6, level: 1, cue: c('Step out wide, sit back into one hip with the other leg straight, then push back.', 'Fai un passo laterale ampio, siedi su un\'anca con l\'altra gamba tesa, poi spingi per tornare.'), tags: ['knee'] },
  curtsey: { from: ['lunges', 'tadasana'], position: 'standing', focus: ['glutes', 'legStrength', 'balance'], intensity: 3.8, met: 6, level: 2, cue: c('Cross one leg behind on a diagonal, lower with control and stand tall again.', 'Incrocia una gamba dietro in diagonale, scendi con controllo e torna in piedi.'), tags: ['knee'] },
  jack: { from: ['jumpingJacks'], position: 'standing', focus: ['legStrength', 'shoulders'], intensity: 4, met: 8, level: 1, cue: c('Jump the feet out as the arms rise, back in as they lower, light on the feet.', 'Salta aprendo i piedi mentre alzi le braccia, chiudi mentre le abbassi, leggero sui piedi.'), tags: ['jump'] },
  run: { from: ['highKnees'], position: 'standing', focus: ['legStrength', 'core', 'hipFlexors'], intensity: 4.6, met: 8.5, level: 1, cue: c('Drive the knees up quickly, stay on the balls of the feet and pump the arms.', 'Porta su le ginocchia velocemente, resta sulle punte e accompagna con le braccia.') },
  buttKick: { from: ['buttKicks'], position: 'standing', focus: ['quads', 'legStrength'], intensity: 4.2, met: 8, level: 1, cue: c('Kick the heels toward the glutes in a quick rhythm, staying light.', 'Calcia i talloni verso i glutei con ritmo veloce, restando leggero.') },
  skater: { from: ['skaters'], position: 'standing', focus: ['legStrength', 'glutes', 'balance'], intensity: 4.5, met: 7, level: 2, cue: c('Bound side to side, land softly on one leg and let the other swing behind.', 'Salta da un lato all\'altro, atterra morbido su una gamba e lascia l\'altra dietro.'), tags: ['jump'] },
  burpee: { from: ['burpee'], position: 'standing', focus: ['core', 'legStrength', 'armStrength'], intensity: 5, met: 10, level: 3, cue: c('Hands down, step or jump back to plank, return the feet and stand or jump up.', 'Mani a terra, passa in plank, riporta i piedi e torna in piedi o salta.'), tags: ['jump', 'wrist'] },
  walkout: { from: ['uttanasana', 'plank'], position: 'armBalance', focus: ['core', 'shoulders', 'hamstrings'], intensity: 3.8, met: 6, level: 1, cue: c('Fold down, walk the hands out to plank, then walk them back and roll up.', 'Piegati, cammina con le mani fino al plank, poi torna indietro e risali.'), tags: ['wrist'] },
  pushup: { from: ['pushUp'], position: 'armBalance', focus: ['armStrength', 'chestOpening', 'core'], intensity: 4.3, met: 7, level: 2, cue: c('Hands under the shoulders, body in one line, lower the chest and press away.', 'Mani sotto le spalle, corpo in linea, abbassa il petto e spingi via il pavimento.'), tags: ['wrist'] },
  kneePushup: { from: ['pushUp'], position: 'kneeling', focus: ['armStrength', 'chestOpening'], intensity: 3.5, met: 5, level: 1, cue: c('From the knees, keep hips in line with the shoulders, lower and press up.', 'Dalle ginocchia, anche allineate alle spalle, scendi e spingi su.'), tags: ['wrist'] },
  plank: { from: ['plank', 'shoulderTaps'], position: 'armBalance', focus: ['core', 'shoulders'], intensity: 4, met: 5.5, level: 2, cue: c('Strong plank: shoulders over wrists, belly in, glutes engaged, hips steady.', 'Plank solido: spalle sopra i polsi, pancia dentro, glutei attivi, anche ferme.'), tags: ['wrist'] },
  forearmPlank: { from: ['forearmPlank'], position: 'armBalance', focus: ['core', 'shoulders'], intensity: 3.8, met: 5, level: 2, cue: c('On the forearms, elbows under shoulders, keep a long line from head to heels.', 'Sugli avambracci, gomiti sotto le spalle, linea lunga dalla testa ai talloni.') },
  kneePlank: { from: ['tableTop', 'plank'], position: 'kneeling', focus: ['core', 'shoulders'], intensity: 3, met: 4, level: 1, cue: c('Knees down, hips in line, belly drawn in and shoulders stable.', 'Ginocchia a terra, anche in linea, pancia dentro e spalle stabili.'), tags: ['wrist'] },
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
  deadBug: { from: ['singleLegStretch'], position: 'supine', focus: ['core'], intensity: 3.3, met: 4, level: 1, cue: c('Arms up, knees over hips; extend opposite arm and leg without arching the back.', 'Braccia su, ginocchia sopra le anche; distendi braccio e gamba opposti senza inarcare.') },
  wiper: { from: ['supineTwist', 'hundred'], position: 'supine', focus: ['core', 'twists'], intensity: 3.6, met: 4.5, level: 2, cue: c('Legs together, tip them side to side with control while the shoulders stay down.', 'Gambe unite, portale da un lato all\'altro con controllo, spalle a terra.') },
  quadruped: { from: ['tableTop', 'catCow'], position: 'kneeling', focus: ['glutes', 'core'], intensity: 3, met: 4, level: 1, cue: c('On hands and knees, back flat; move the leg from the hip without twisting.', 'A quattro zampe, schiena piatta; muovi la gamba dall\'anca senza ruotare.'), tags: ['knee', 'wrist'] },
  sideLying: { from: ['clam', 'sideKick'], position: 'supine', focus: ['glutes', 'hipOpeners'], intensity: 2.8, met: 3.8, level: 1, cue: c('Lying on your side, hips stacked; lift and lower the leg slowly.', 'Sdraiato su un fianco, anche sovrapposte; solleva e abbassa la gamba lentamente.') },
  downDog: { from: ['downDog', 'plank'], position: 'inverted', focus: ['shoulders', 'hamstrings', 'core'], intensity: 3.5, met: 5, level: 2, cue: c('Hips high, press the floor away, then flow forward keeping the core engaged.', 'Anche alte, spingi via il pavimento, poi scorri in avanti con l\'addome attivo.'), tags: ['wrist'] },
  slam: { from: ['squat', 'urdhvaHastasana'], position: 'standing', focus: ['legStrength', 'shoulders', 'core'], intensity: 4.5, met: 7.5, level: 2, cue: c('Reach tall, then drive down powerfully into a squat, and rise again.', 'Allungati verso l\'alto, poi scendi con forza in squat e risali.') },
};

/** Ordered keyword rules: the first match decides the family. */
const RULES: [RegExp, string][] = [
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
  [/crab|reverse plank|l to crab/i, 'crab'],
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
  [/fire hydrant|donkey|calci dell|table top|four point|kick backs?|kickback|frog kick|bird|quadruped|cat|inner thigh(?! circles)/i, 'quadruped'],
  [/clam|side leg|inner thigh|abductor|lifted clam|layer bend|leg lift knee|triangle leg/i, 'sideLying'],
  [/jump squat|squat jump|explosive squat|jump to drop|squat to hop|knee down squat to hop|drop squat/i, 'jumpSquat'],
  [/sumo|wide squat|pivot squat|plié|deep sumo|abductor squat/i, 'sumo'],
  [/squat hold|chair|wall sit|squat to squat hold/i, 'squatHold'],
  [/slam|squat and press|rocket|wood ?chop|push pulls/i, 'slam'],
  [/curtsey/i, 'curtsey'],
  [/side lunge|lateral lunge|side step squat|lateral quick/i, 'sideLunge'],
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
  [/arm|angel|robot|milk jug|curly|raise|circles|scapula|shoulder roll|wrist|fly|flies|c-rotation|t-raise/i, 'arms'],
];

/** Stretches are matched on their own, so "Low Lunge Quad Stretch" is a stretch, not a lunge. */
const STRETCH_RULES: [RegExp, string][] = [
  [/twist|torsione|supine cross/i, 'stretchTwist'],
  [/calf|polpaccio/i, 'stretchCalf'],
  [/hamstring|forward fold|wide leg fold|piegamento in avanti|seated wide|rocking wide|wide fold|pyramid/i, 'stretchHam'],
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
    const fam = FAMILIES[(stretchy ? hit(STRETCH_RULES) ?? 'stretchUpper' : hit(RULES) ?? hit(STRETCH_RULES)) ?? 'squat'];
    // keyframes: the first frame of each template move; a single template keeps its own animation
    const tpl = fam.from.map(frameOf).filter(Boolean) as number[][][];
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
