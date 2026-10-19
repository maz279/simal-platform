// scripts/observability-sink.mjs — rm(9.3-3): the rig's REAL webhook sink.
// Staging/production point OBSERVABILITY_WEBHOOK_URL at Slack/Teams; on the rig
// there is no external endpoint, so this receiver stands in: it accepts the same
// JSON payloads (anything with a `text` field — server.js 5xx sink and
// uptime-probe.mjs alerts), appends them to scratch/observability.jsonl and
// echoes a compact line. Run: node scripts/observability-sink.mjs  (PORT, default 8095)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 8095);
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'scratch', 'observability.jsonl');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') { res.writeHead(405).end(); return; }
  const chunks = []; let n = 0;
  req.on('data', (c) => { n += c.length; if (n > 64 * 1024) { res.writeHead(413).end(); req.destroy(); return; } chunks.push(c); });
  req.on('end', () => {
    let body = null;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { /* keep raw */ }
    const rec = { receivedAt: new Date().toISOString(), body };
    fs.appendFileSync(OUT, JSON.stringify(rec) + '\n');
    console.log(`[sink] ${(body?.text || '(no text field)').slice(0, 140)}`);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"received":true}');
  });
  req.on('error', () => { /* client aborted */ });
});
server.listen(PORT, '127.0.0.1', () => console.log(`[sink] observability sink listening on http://127.0.0.1:${PORT} -> ${path.relative(process.cwd(), OUT)}`));
