import { readFileSync, writeFileSync } from 'node:fs';
const key = readFileSync('.env.local','utf8').match(/^GEMINI_API_KEY=(.*)$/m)[1].trim();
const t0 = Date.now();
const r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', { method:'POST',
  headers:{'Content-Type':'application/json','Api-Revision':'2026-05-20','x-goog-api-key':key},
  body: JSON.stringify({ model:'lyria-3.5', input:'Instrumental only, no vocals. A calm 2-minute ambient track for a yoga class: warm evolving pads, soft piano, slow tempo around 70 BPM, gentle and peaceful, smooth fade-out ending.' }) });
const j = await r.json();
console.log('status', r.status, 'secs', (Date.now()-t0)/1000);
const walk = (o, p='') => { if (o && typeof o === 'object') for (const [k,v] of Object.entries(o)) { if (typeof v === 'string' && v.length > 200) console.log(p+k, '<'+v.length+' chars>'); else if (typeof v !== 'object') console.log(p+k, JSON.stringify(v).slice(0,150)); else walk(v, p+k+'.'); } };
walk(j);
const find = (o) => { if (!o || typeof o !== 'object') return; if (o.type === 'audio' && o.data) return o; for (const v of Object.values(o)) { const f = find(v); if (f) return f; } };
const a = find(j); if (a) { writeFileSync('scripts/music/_probe.out', Buffer.from(a.data, 'base64')); console.log('mime', a.mime_type); }
