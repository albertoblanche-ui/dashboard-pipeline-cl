// Servidor local: node dev.mjs → http://localhost:3000 (torre) y /tv
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('.', import.meta.url));
for (const l of existsSync(join(raiz, '.env.local')) ? readFileSync(join(raiz, '.env.local'), 'utf8').split('\n') : []) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}
const { GET } = await import('./api/data.js');
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const puerto = Number(process.env.PORT ?? 3000);

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${puerto}`);
  if (url.pathname === '/api/data') {
    const r = await GET(new Request(url, { headers: req.headers }));
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    return res.end(await r.text());
  }
  const ruta = url.pathname === '/' ? '/index.html' : url.pathname === '/tv' ? '/tv.html' : url.pathname;
  const archivo = normalize(join(raiz, 'public', ruta));
  if (!archivo.startsWith(join(raiz, 'public')) || !existsSync(archivo)) {
    res.writeHead(404);
    return res.end('No encontrado');
  }
  res.writeHead(200, { 'Content-Type': tipos[extname(archivo)] ?? 'application/octet-stream' });
  res.end(readFileSync(archivo));
}).listen(puerto, () => console.log(`Dashboard en http://localhost:${puerto}`));
