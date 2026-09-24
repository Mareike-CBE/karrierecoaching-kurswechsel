// Kleiner Testserver für den Mac. Liefert die App so aus wie später Netlify:
// mit "Cache-Control: no-cache", damit der Browser immer nach Neuem fragt.
// Start: node tools/server.mjs  →  http://localhost:8080
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

createServer(async (anfrage, antwort) => {
  let pfad = decodeURIComponent(new URL(anfrage.url, 'http://localhost').pathname);
  if (pfad.endsWith('/')) pfad += 'index.html';
  const datei = normalize(join(WURZEL, pfad));
  if (!datei.startsWith(WURZEL.endsWith(sep) ? WURZEL : WURZEL + sep)) {
    antwort.writeHead(403).end();
    return;
  }
  try {
    const inhalt = await readFile(datei);
    antwort.writeHead(200, {
      'Content-Type': TYPEN[extname(datei)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    antwort.end(inhalt);
  } catch {
    antwort.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
  }
}).listen(PORT, () => console.log(`Kurswechsel läuft auf http://localhost:${PORT}`));
