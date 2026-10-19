// Sandbox static server for the scratch dist with an /api reverse proxy to the sandbox portal.
// Emulates the production topology the site's relative /api URLs assume (but which the repo never defines).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const [, , ROOT, PORT = '18100', API = 'http://127.0.0.1:18090'] = process.argv;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };
http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const u = new URL(API);
    const p = http.request({ host: u.hostname, port: u.port, path: req.url, method: req.method, headers: { ...req.headers, host: u.host } }, (pr) => { res.writeHead(pr.statusCode, pr.headers); pr.pipe(res); });
    p.on('error', () => { res.writeHead(502).end('bad gateway'); });
    req.pipe(p);
    return;
  }
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(ROOT, rel);
  if (!file.startsWith(path.resolve(ROOT))) { res.writeHead(400).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(Number(PORT), '127.0.0.1', () => console.log('sandbox site+proxy on', PORT));
