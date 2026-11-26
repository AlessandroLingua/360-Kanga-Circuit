/**
 * Splits a spoken cue into "atoms" that have a pre-recorded clip.
 *
 * Cues are built by joining fixed pieces ("Vieni in" + name + ", lato destro. " + instruction),
 * so we record the pieces once and replay them in sequence instead of recording every combination.
 * Matching is greedy longest-first against the known atoms, so names that contain commas
 * ("Forward fold, hands behind the head") still match as one piece. Text that matches no atom
 * comes back as an unknown span, to be spoken by the device voice (or recorded later).
 */

export interface Piece {
  text: string;
  known: boolean;
}

/** Characters that may sit between atoms without being spoken on their own. */
const SEP = /[\s.,:;!?…–—-]/;

export class AtomIndex {
  private byFirst = new Map<string, string[]>();

  constructor(atoms: Iterable<string>) {
    for (const a of atoms) {
      const k = a.trim();
      if (!k) continue;
      const f = k[0].toLowerCase();
      const list = this.byFirst.get(f) ?? [];
      list.push(k);
      this.byFirst.set(f, list);
    }
    for (const list of this.byFirst.values()) list.sort((a, b) => b.length - a.length);
  }

  /** Longest atom starting at `i` that ends on a word boundary. */
  private match(text: string, i: number): string | undefined {
    const list = this.byFirst.get(text[i].toLowerCase());
    if (!list) return undefined;
    for (const a of list) {
      if (text.length - i < a.length) continue;
      if (text.substr(i, a.length).toLowerCase() !== a.toLowerCase()) continue;
      const after = text[i + a.length];
      if (after === undefined || SEP.test(after)) return a;
    }
    return undefined;
  }

  segment(text: string): Piece[] {
    const out: Piece[] = [];
    let unknown = '';
    const flush = () => {
      const u = unknown.replace(/^[\s.,:;…–—-]+|[\s,:;–—-]+$/g, '');
      if (u) out.push({ text: u, known: false });
      unknown = '';
    };
    let i = 0;
    while (i < text.length) {
      // only start a match at a word start
      const atWordStart = i === 0 || SEP.test(text[i - 1]);
      const a = atWordStart && !SEP.test(text[i]) ? this.match(text, i) : undefined;
      if (a) {
        flush();
        out.push({ text: a, known: true });
        i += a.length;
      } else {
        unknown += text[i];
        i++;
      }
    }
    flush();
    return out;
  }
}

/** Stable short id for a clip file name: FNV-1a over the text. */
export function clipId(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0;
  }
  return h1.toString(36) + h2.toString(36);
}
