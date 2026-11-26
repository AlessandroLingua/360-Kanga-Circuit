import { ph, tr, hasLang } from './phrases';
import type { Cue, InstructionLevel, Lang, Move } from './types';

export interface CueOpts {
  lang: Lang;
  instruction: InstructionLevel;
  sanskrit: boolean;
  breathSec: number;
}

export const moveName = (m: Move, o: { lang: Lang; sanskrit: boolean }) =>
  o.sanskrit && m.sanskrit ? m.sanskrit : tr(m.name, o.lang);

/** Build spoken/subtitle cues for one held or repeated move. */
export function moveCues(m: Move, duration: number, o: CueOpts, side?: 'right' | 'left', isFlowStep = false): Cue[] {
  const name = moveName(m, o);
  const sideTxt = side ? `, ${ph(side === 'right' ? 'rightSide' : 'leftSide', o.lang)}` : '';
  const cues: Cue[] = [];
  const level = o.instruction;

  if (isFlowStep) {
    // single-breath movements inside a flow: just the name
    cues.push({ at: 0, text: `${name}${sideTxt}` });
    return cues;
  }

  const fullCue = hasLang(m.cue, o.lang) ? tr(m.cue, o.lang) : ph('breatheDeep', o.lang);
  const shortCue = hasLang(m.short, o.lang) ? tr(m.short, o.lang) : '';
  if (level === 'full') cues.push({ at: 0, text: `${ph('comeInto', o.lang)} ${name}${sideTxt}. ${fullCue}` });
  else if (level === 'least') cues.push({ at: 0, text: `${name}${sideTxt}` });
  else cues.push({ at: 0, text: `${name}${sideTxt}. ${shortCue}`.trim() });

  // mid-hold guidance
  if (level === 'full' && duration > 18) {
    const b = o.breathSec;
    let t = Math.max(10, duration * 0.35);
    cues.push({ at: t, text: `${ph('inhale', o.lang)}… ${ph('exhale', o.lang)}…` });
    if (duration > 40) cues.push({ at: duration * 0.62, text: ph(m.intensity >= 3 ? 'stayHere' : 'soften', o.lang) });
    if (duration > 25) cues.push({ at: Math.max(duration - b * 1.2, t + 4), text: ph('release', o.lang) });
  } else if (level === 'default' && duration > 25) {
    cues.push({ at: duration * 0.5, text: ph(m.frames.length > 1 ? 'keepMoving' : 'breatheDeep', o.lang) });
  }
  // defaultSilence and least: silence while holding
  return cues;
}
