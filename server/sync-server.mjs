// Minimal self-hostable sync server for Kanga Circuit 360.
// Stores one JSON profile per account code in ./server/data. Run: npm run sync-server
// Put it behind HTTPS (e.g. a reverse proxy) for real use.
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'data');
const PORT = Number(process.env.PORT || 8787);
await mkdir(DIR, { recursive: true });

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return res.writeHead(204, cors).end();
  const m = req.url?.match(/^\/profile\/([a-f0-9]{16,64})$/i);
  if (!m) return res.writeHead(404, cors).end();
  const file = join(DIR, `${m[1].toLowerCase()}.json`);
  if (req.method === 'GET') {
    let data;
    try {
      data = await readFile(file);
    } catch {
      return res.writeHead(404, cors).end();
    }
    return res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }).end(data);
  }
  if (req.method === 'PUT') {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 10_000_000) return res.writeHead(413, cors).end();
    }
    try {
      JSON.parse(body);
    } catch {
      return res.writeHead(400, cors).end();
    }
    await writeFile(file, body);
    return res.writeHead(204, cors).end();
  }
  res.writeHead(405, cors).end();
}).listen(PORT, () => console.log(`sync server on http://localhost:${PORT}`));
