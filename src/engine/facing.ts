/**
 * Which way the 3D body faces for each pose.
 *
 * Poses are stored as side-view angles. That is right for most exercises, but in some the arms
 * or legs move out to the sides (warrior II, jumping jacks, side lunges…): drawn from the side,
 * their "front/back" angles really mean "left/right". For those the 3D body turns to face the
 * camera (yaw 90) so the limbs move in the correct plane.
 *
 * Only upright or side-lying poses can turn: a body lying on its back or in a plank would end up
 * on its side, so plank jacks, fire hydrants and supine leg swings stay in profile.
 *
 * Catalog exercises reuse the frames of a base move, so they inherit its facing by frame.
 */
import { HIIT, PILATES } from './library/fitness';
import { YOGA } from './library/yoga';
import { CATALOG_FACING } from './library/hiitCatalog';
import { YOGA_CATALOG_FACING } from './library/yogaCatalog';
import type { Move } from './types';

export const SIDEWAYS = new Set([
  // yoga: hips open to the side
  'warrior2', 'reverseWarrior', 'sideAngle', 'triangle', 'halfMoon', 'goddess', 'prasarita', 'tree',
  'sidePlank', 'seatedSideBend', 'malasana',
  'yx_flussoNelGuerriero2', 'yx_rotazioneDelBraccioInPancaLateraleConGinocchioAbbassato', 'yx_oscillazioniInPosizioneSedutaConLeGambeDivaricate',
  // pilates: side-lying and side-bending work
  'mermaid',
  // hiit: lateral movement
  'jumpingJacks', 'skaters', 'x_abductorSquats', 'x_sideLungeHold',
]);

let byFrames: Map<string, number> | null = null;
const key = (m: Move) => JSON.stringify(m.frames);

/** Body turn in degrees for a move: 90 = facing the camera, 0 = profile. */
export function yawFor(m: Move | undefined): number {
  if (!m) return 0;
  if (SIDEWAYS.has(m.id) || CATALOG_FACING.has(m.id) || YOGA_CATALOG_FACING.has(m.id)) return 90;
  if (!byFrames) {
    byFrames = new Map();
    for (const c of [...YOGA, ...PILATES, ...HIIT]) if (SIDEWAYS.has(c.id)) byFrames.set(key(c), 90);
  }
  return byFrames.get(key(m)) ?? 0;
}
