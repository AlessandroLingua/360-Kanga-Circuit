/**
 * Extended Pilates catalog: every name in PILATES_CATALOG_NAMES becomes a Move.
 * Names are matched by keywords to a movement family that supplies the figure
 * (from a core Pilates or yoga move), position, trained areas and our own cue.
 */
import type { FocusArea, L10n, Move, MoveTag, Position } from '../types';
import { PILATES_CATALOG_NAMES } from './pilatesCatalogNames';
import { YOGA_BY_ID } from './yoga';
import { itName, PILATES_NAME_TR } from '../../i18n/catalog';

type Family = { from: string[]; position: Position; focus: FocusArea[]; intensity: number; level: 1 | 2 | 3; cue: L10n; tags?: MoveTag[]; sided?: boolean };
const c = (en: string, it: string): L10n => ({ en, it });

const F: Record<string, Family> = {
  hundred: { from: ['hundred'], position: 'supine', focus: ['core'], intensity: 3, level: 1, cue: c('Head and shoulders lifted, legs at a steady angle, pump the arms with the breath.', 'Testa e spalle sollevate, gambe ferme in diagonale, pompa le braccia con il respiro.') },
  legStretch: { from: ['singleLegStretch'], position: 'supine', focus: ['core'], intensity: 3, level: 1, sided: true, cue: c('Curl up, draw one knee in while the other leg reaches long, switch with control.', 'Solleva il busto, porta un ginocchio al petto mentre l\'altra gamba si allunga, alterna con controllo.') },
  curl: { from: ['crissCross', 'hundred'], position: 'supine', focus: ['core'], intensity: 3, level: 1, cue: c('Exhale to curl the head and shoulders up, ribs soft, and lower slowly.', 'Espira e solleva testa e spalle, costole morbide, e scendi lentamente.') },
  crissCross: { from: ['crissCross'], position: 'supine', focus: ['core', 'twists'], intensity: 3.5, level: 2, sided: true, cue: c('Rotate the ribs toward the bent knee, keeping the pelvis still.', 'Ruota le costole verso il ginocchio piegato tenendo fermo il bacino.') },
  seatedCurl: { from: ['rollUp'], position: 'seated', focus: ['core', 'spineMobility'], intensity: 3, level: 1, cue: c('Sitting tall, curl the pelvis under and roll back halfway, then return.', 'Seduto alto, arrotola il bacino e scendi a metà, poi torna su.') },
  teaser: { from: ['teaser'], position: 'seated', focus: ['core', 'hipFlexors'], intensity: 4, level: 3, cue: c('Balance in a V, reaching the arms long, and roll down and up with control.', 'In equilibrio a V, braccia lunghe, scendi e risali con controllo.') },
  supineMove: { from: ['doubleLegStretch', 'singleLegStretch'], position: 'supine', focus: ['core', 'hipFlexors'], intensity: 2.8, level: 1, cue: c('Keep the lower back gently anchored while the legs move with control.', 'Tieni la zona lombare appoggiata mentre le gambe si muovono con controllo.') },
  pelvic: { from: ['shoulderBridge'], position: 'supine', focus: ['core', 'lowerBack', 'glutes'], intensity: 2, level: 1, cue: c('Tilt and lift the pelvis slowly, one vertebra at a time.', 'Inclina e solleva il bacino lentamente, una vertebra alla volta.') },
  bridge: { from: ['shoulderBridge'], position: 'supine', focus: ['glutes', 'hamstrings', 'core'], intensity: 3, level: 1, cue: c('Press through the feet, lift the hips and keep the pelvis level.', 'Spingi sui piedi, solleva il bacino e tienilo allineato.') },
  sideLying: { from: ['sideKick'], position: 'supine', focus: ['glutes', 'hipOpeners'], intensity: 2.5, level: 1, sided: true, cue: c('On your side, hips stacked, waist lifted; move the top leg with control.', 'Sul fianco, anche sovrapposte, vita sollevata; muovi la gamba di sopra con controllo.') },
  clam: { from: ['clam'], position: 'supine', focus: ['glutes', 'hipOpeners'], intensity: 2.5, level: 1, sided: true, cue: c('Heels together, open the top knee without rolling the pelvis back.', 'Talloni uniti, apri il ginocchio sopra senza ruotare il bacino indietro.') },
  innerThigh: { from: ['sideKick'], position: 'supine', focus: ['legStrength', 'hipOpeners'], intensity: 2.5, level: 1, sided: true, cue: c('Lift the bottom leg from the inner thigh, keeping it long and the waist lifted.', 'Solleva la gamba di sotto dall\'interno coscia, lunga e con la vita sollevata.') },
  quadruped: { from: ['catStretch', 'legPullFront'], position: 'kneeling', focus: ['glutes', 'core'], intensity: 2.8, level: 1, sided: true, cue: c('On hands and knees, back flat; move the leg without shifting the hips.', 'A quattro zampe, schiena piatta; muovi la gamba senza spostare le anche.'), tags: ['knee', 'wrist'] },
  birdDog: { from: ['catStretch'], position: 'kneeling', focus: ['core', 'lowerBack', 'balance'], intensity: 2.8, level: 1, sided: true, cue: c('Reach the opposite arm and leg long, hips level, then draw them in.', 'Allunga braccio e gamba opposti, anche allineate, poi riportali dentro.'), tags: ['wrist'] },
  cat: { from: ['catStretch'], position: 'kneeling', focus: ['spineMobility'], intensity: 1.5, level: 1, cue: c('Round the spine on the exhale and lengthen it on the inhale.', 'Arrotonda la colonna espirando e allungala inspirando.') },
  plank: { from: ['legPullFront'], position: 'armBalance', focus: ['core', 'shoulders'], intensity: 3.5, level: 2, cue: c('Long line from head to heels, belly drawn in, shoulders stable.', 'Linea lunga dalla testa ai talloni, pancia dentro, spalle stabili.'), tags: ['wrist'] },
  forearmPlank: { from: ['forearmPlank'], position: 'armBalance', focus: ['core', 'shoulders'], intensity: 3.3, level: 2, cue: c('On the forearms, press the floor away and keep the hips level.', 'Sugli avambracci, spingi via il pavimento e tieni le anche allineate.') },
  sidePlank: { from: ['sidePlank'], position: 'armBalance', focus: ['core', 'shoulders', 'twists'], intensity: 3.3, level: 2, sided: true, cue: c('Stack the hips and lift them, supporting arm strong.', 'Anche sovrapposte e sollevate, braccio d\'appoggio forte.') },
  saw: { from: ['saw'], position: 'seated', focus: ['twists', 'hamstrings'], intensity: 2.5, level: 2, sided: true, cue: c('Rotate toward one leg and reach past the foot, then restack the spine.', 'Ruota verso una gamba e allungati oltre il piede, poi riallinea la colonna.') },
  mermaid: { from: ['mermaid'], position: 'seated', focus: ['flexibility', 'shoulders'], intensity: 2, level: 1, sided: true, cue: c('Sit with legs to one side, reach long over the head into a side bend.', 'Seduto con le gambe da un lato, allungati sopra la testa in flessione laterale.') },
  spine: { from: ['spineStretch'], position: 'seated', focus: ['spineMobility', 'hamstrings'], intensity: 2, level: 1, cue: c('Sit tall, then peel forward from the head and restack the spine.', 'Siedi alto, poi arrotolati in avanti dalla testa e riallinea la colonna.') },
  seatedTwist: { from: ['seatedTwist'], position: 'seated', focus: ['twists', 'spineMobility'], intensity: 1.5, level: 1, sided: true, cue: c('Lengthen up, then rotate from the waist keeping both sit bones down.', 'Allungati verso l\'alto, poi ruota dalla vita con gli ischi a terra.') },
  seated: { from: ['easySeat'], position: 'seated', focus: ['neckUpperBack', 'shoulders'], intensity: 1, level: 1, cue: c('Sit tall and move slowly within an easy range.', 'Siedi alto e muoviti lentamente in un\'ampiezza facile.') },
  swan: { from: ['swan'], position: 'prone', focus: ['backbends', 'lowerBack'], intensity: 2.5, level: 1, cue: c('Face down, lengthen through the crown and lift the chest with the back muscles.', 'A pancia in giù, allunga dalla testa e solleva il petto con i muscoli della schiena.') },
  swim: { from: ['swimming'], position: 'prone', focus: ['lowerBack', 'shoulders', 'glutes'], intensity: 3, level: 2, cue: c('Lift opposite arm and leg, belly gently lifted off the mat.', 'Solleva braccio e gamba opposti, pancia leggermente staccata dal tappetino.') },
  prone: { from: ['sphinx'], position: 'prone', focus: ['lowerBack'], intensity: 1, level: 1, cue: c('Rest on the belly and let the breath widen the back.', 'Riposa sulla pancia e lascia che il respiro allarghi la schiena.') },
  child: { from: ['child'], position: 'kneeling', focus: ['lowerBack'], intensity: 1, level: 1, cue: c('Hips back to the heels, arms long, forehead down, breathe into the back.', 'Bacino sui talloni, braccia lunghe, fronte giù, respira nella schiena.') },
  puppy: { from: ['child', 'tableTop'], position: 'kneeling', focus: ['shoulders', 'chestOpening'], intensity: 1.5, level: 1, cue: c('Hips over the knees, hands forward, let the chest soften down.', 'Anche sopra le ginocchia, mani avanti, lascia scendere il petto.') },
  stretch: { from: ['kneesToChest'], position: 'supine', focus: ['flexibility', 'lowerBack'], intensity: 1.2, level: 1, cue: c('Ease into the stretch and breathe slowly; no bouncing.', 'Entra piano nell\'allungamento e respira lento; niente molleggi.') },
  supineTwist: { from: ['supineTwist'], position: 'supine', focus: ['twists', 'lowerBack'], intensity: 1, level: 1, sided: true, cue: c('Knees to one side, shoulders heavy, breathe into the twist.', 'Ginocchia da un lato, spalle pesanti, respira nella torsione.') },
  kneesChest: { from: ['kneesToChest'], position: 'supine', focus: ['lowerBack'], intensity: 1, level: 1, cue: c('Hug the knees in and let the lower back soften.', 'Abbraccia le ginocchia e ammorbidisci la zona lombare.') },
  happyBaby: { from: ['happyBaby'], position: 'supine', focus: ['hipOpeners'], intensity: 1.2, level: 1, cue: c('Hold the feet, knees wide toward the armpits, rock gently.', 'Afferra i piedi, ginocchia larghe verso le ascelle, dondola piano.') },
  hipStretch: { from: ['pigeon'], position: 'seated', focus: ['hipOpeners', 'glutes'], intensity: 1.5, level: 1, sided: true, cue: c('Open the outer hip slowly, spine long.', 'Apri l\'esterno dell\'anca lentamente, colonna lunga.') },
  lowLunge: { from: ['lowLunge'], position: 'kneeling', focus: ['hipFlexors', 'quads'], intensity: 1.8, level: 1, sided: true, cue: c('Back knee down, hips forward to stretch the front of the hip.', 'Ginocchio dietro a terra, anche avanti per allungare l\'anca.'), tags: ['knee'] },
  fold: { from: ['seatedFold'], position: 'seated', focus: ['hamstrings', 'lowerBack'], intensity: 1.5, level: 1, cue: c('Lengthen on the inhale, fold a little further on the exhale.', 'Allungati inspirando, piegati un po\' di più espirando.') },
  downDog: { from: ['downDog'], position: 'inverted', focus: ['hamstrings', 'shoulders'], intensity: 2.5, level: 1, cue: c('Hips high, heels reaching down, press the floor away.', 'Anche alte, talloni verso il basso, spingi via il pavimento.'), tags: ['wrist'] },
  reverseTable: { from: ['tricepDips', 'bridge'], position: 'seated', focus: ['armStrength', 'glutes', 'shoulders'], intensity: 3, level: 2, cue: c('Hands behind, lift the hips level and lower with control.', 'Mani dietro, solleva le anche in linea e scendi con controllo.'), tags: ['wrist'] },
  standing: { from: ['tadasana', 'urdhvaHastasana'], position: 'standing', focus: ['shoulders', 'flexibility'], intensity: 1.2, level: 1, cue: c('Stand tall and reach long, breathing slowly.', 'In piedi alto, allungati e respira lento.') },
  legCircles: { from: ['legCircles'], position: 'supine', focus: ['hipOpeners', 'core'], intensity: 2.5, level: 1, sided: true, cue: c('Draw small circles with the leg while the pelvis stays perfectly still.', 'Disegna piccoli cerchi con la gamba mentre il bacino resta immobile.') },
};

const RULES: [RegExp, string][] = [
  [/^cento$/i, 'hundred'],
  [/teaser/i, 'teaser'],
  [/allungamento di una gamba|stiramento di una gamba/i, 'legStretch'],
  [/criss cross/i, 'crissCross'],
  [/curl da seduti/i, 'seatedCurl'],
  [/curl|crunch/i, 'curl'],
  [/clamshell/i, 'clam'],
  [/interno coscia/i, 'innerThigh'],
  [/cerchi con le gambe/i, 'legCircles'],
  [/sul fianco/i, 'sideLying'],
  [/bird dog|braccio alzato in tavolo|braccio e gamba opposta/i, 'birdDog'],
  [/fire hydrant|piegamenti della gamba in tavolo|impulsi con la gamba piegata|ginocchio al tricipite|sollevamento gamba in diagonale|piegamento serrato in tavolo/i, 'quadruped'],
  [/^gatto|dal tavolo al gatto/i, 'cat'],
  [/panca laterale/i, 'sidePlank'],
  [/avambracci/i, 'forearmPlank'],
  [/^panca|sega in panca/i, 'plank'],
  [/sega/i, 'saw'],
  [/sirena/i, 'mermaid'],
  [/spine stretch|^piegamento$/i, 'spine'],
  [/tavolo invertito|tricep dips/i, 'reverseTable'],
  [/cane in giù/i, 'downDog'],
  [/ponte/i, 'bridge'],
  [/pelvic|orologio pelvico/i, 'pelvic'],
  [/torsione.*supini/i, 'supineTwist'],
  [/torsione|rotazione della schiena|rotazione da seduti/i, 'seatedTwist'],
  [/estensione della schiena|impulsi con le braccia sulla pancia/i, 'swan'],
  [/sulla pancia|prona/i, 'prone'],
  [/bambino felice/i, 'happyBaby'],
  [/bambino/i, 'child'],
  [/cucciolo/i, 'puppy'],
  [/abbraccia le ginocchia|abbracciando le ginocchia|ginocchia al petto|da un lato all'altro/i, 'kneesChest'],
  [/figura a quattro|piccione|stiramento dell'anca|cerchi con i fianchi/i, 'hipStretch'],
  [/lucertola|mezza rana|mezzo hanuman|stiramento della coscia|mezza sella/i, 'lowLunge'],
  [/piegamento (in avanti|con le gambe|in angolo)/i, 'fold'],
  [/mattutino|stiramento laterale|stiramento del braccio|stiramento del tricipite/i, 'standing'],
  [/da supini|supina|estensioni/i, 'supineMove'],
  [/tavolo/i, 'quadruped'],
  [/polpaccio|gambe/i, 'stretch'],
  [/seduti|seduta|collo|scapolare|cerchi con il corpo/i, 'seated'],
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const slug = (s: string) => 'px_' + s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildPilatesCatalog(core: Move[]): Move[] {
  const byId: Record<string, Move> = { ...YOGA_BY_ID, ...Object.fromEntries(core.map((m) => [m.id, m])) };
  const taken = new Set(core.flatMap((m) => [m.name.it, m.name.en].filter(Boolean).map((x) => norm(x!))));
  const out: Move[] = [];
  for (const raw of PILATES_CATALOG_NAMES) {
    if (taken.has(norm(raw))) continue;
    taken.add(norm(raw));
    const fam = F[RULES.find(([re]) => re.test(raw))?.[1] ?? 'seated'];
    const tpl = fam.from.map((id) => byId[id]?.frames).filter(Boolean) as number[][][];
    if (!tpl.length) continue;
    const s = raw.toLowerCase();
    let frames = tpl.length === 1 ? tpl[0] : tpl.map((f) => f[0]);
    const dynamic = /impulsi|cerchi|sollevamento|abbassamento|alternat|oscillazion|rotazione|tocco|fuori e dentro|da un lato/.test(s);
    if (!dynamic && /preparazione|posizione|^tavolo$|^panca$|stiramento|sulla pancia/.test(s)) frames = [frames[0]];
    out.push({
      id: slug(raw),
      discipline: 'pilates',
      name: itName(cap(raw), PILATES_NAME_TR),
      cue: fam.cue,
      short: fam.cue,
      position: fam.position,
      level: (/con sollevamento|gamba sollevata|piedi uniti/.test(s) ? Math.max(fam.level, 2) : fam.level) as Move['level'],
      intensity: fam.intensity + (dynamic ? 0.3 : 0),
      met: Math.round((2.2 + fam.intensity * 0.6) * 10) / 10,
      focus: fam.focus,
      frames,
      bilateral: fam.sided || undefined,
      tags: fam.tags,
    });
  }
  return out;
}
