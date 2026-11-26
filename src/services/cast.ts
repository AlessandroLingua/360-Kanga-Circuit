/**
 * TV casting.
 * - Chrome/Edge: Presentation API → Chromecast (the receiver page is the #tv route).
 * - Safari / iOS / macOS: system AirPlay Screen Mirroring (no web API for arbitrary pages).
 * - Fallback: opens the #tv window for an external display / HDMI.
 * The player broadcasts its state; the TV page renders it.
 */
import type { Session } from '../engine/types';

export interface TvState {
  session?: Session;
  index: number;
  segElapsed: number;
  paused: boolean;
  subtitle: string;
  sentAt: number;
}

const CH = 'kanga-tv';
let bc: BroadcastChannel | null = null;
let conn: { send: (m: string) => void; state: string } | null = null;

const channel = () => (bc ??= 'BroadcastChannel' in window ? new BroadcastChannel(CH) : null);

export function broadcastTv(s: TvState) {
  const msg = JSON.stringify(s);
  channel()?.postMessage(msg);
  if (conn && conn.state === 'connected') conn.send(msg);
}

export function onTvState(cb: (s: TvState) => void) {
  const handler = (m: string) => {
    try {
      cb(JSON.parse(m));
    } catch {
      /* ignore */
    }
  };
  const c = channel();
  const l = (e: MessageEvent) => handler(e.data);
  c?.addEventListener('message', l);
  // presentation receiver side
  const nav = navigator as unknown as { presentation?: { receiver?: { connectionList: Promise<{ connections: { addEventListener: (t: string, f: (e: MessageEvent) => void) => void }[]; addEventListener: (t: string, f: (e: { connection: { addEventListener: (t: string, f: (e: MessageEvent) => void) => void } }) => void) => void }> } } };
  nav.presentation?.receiver?.connectionList.then((list) => {
    list.connections.forEach((cn) => cn.addEventListener('message', l));
    list.addEventListener('connectionavailable', (e) => e.connection.addEventListener('message', l));
  });
  return () => c?.removeEventListener('message', l);
}

export async function startCast(): Promise<'presentation' | 'window'> {
  const url = `${location.href.split('#')[0]}#tv`;
  const PR = (window as unknown as { PresentationRequest?: new (u: string[]) => { start: () => Promise<typeof conn> } }).PresentationRequest;
  if (PR) {
    try {
      conn = await new PR([url]).start();
      return 'presentation';
    } catch {
      /* user cancelled or no receivers: fall through */
    }
  }
  window.open(url, 'kanga-tv', 'width=1280,height=720');
  return 'window';
}
