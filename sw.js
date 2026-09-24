// Kurswechsel: Service Worker.
// Regel: immer zuerst das Netz fragen. Nur ohne Netz die gespeicherte Kopie nehmen.
// So kommt jedes Update beim nächsten Öffnen an, und offline öffnet sich die App trotzdem.
// Die Versionsnummer nur erhöhen, wenn sich an dieser Datei selbst etwas Grundlegendes ändert.
const CACHE = 'kurswechsel-v1';
const START_DATEIEN = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'content.js',
  'Inhalte.md',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
];
const SCHRIFT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(START_DATEIEN.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

async function netzZuerst(anfrage) {
  const cache = await caches.open(CACHE);
  try {
    const antwort = await fetch(anfrage);
    if (antwort.ok || antwort.type === 'opaque') await cache.put(anfrage, antwort.clone());
    return antwort;
  } catch (fehler) {
    const kopie = await cache.match(anfrage, { ignoreSearch: true });
    if (kopie) return kopie;
    if (anfrage.mode === 'navigate') {
      const startseite = await cache.match('./');
      if (startseite) return startseite;
    }
    throw fehler;
  }
}

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET') return;
  const url = new URL(anfrage.url);
  if (url.origin === self.location.origin || SCHRIFT_HOSTS.includes(url.hostname)) {
    ereignis.respondWith(netzZuerst(anfrage));
  }
});
