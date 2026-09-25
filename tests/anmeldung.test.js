import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SUPABASE_URL, SUPABASE_KEY, sendeAnmeldung, meldeAn } from '../anmeldung.js';
import { parseDatum } from '../content.js';

const TERMIN = { art: 'gruppe', titel: 'Info-Abend', termin: parseDatum('15.10.2026'), uhrzeit: '19:00', ort: 'online' };
const GUT = { name: 'Julia', email: 'julia@example.de', nachricht: '', webseite: '' };

// Nachgespieltes fetch: merkt sich Aufrufe und antwortet mit dem vorgegebenen Status.
function falschesFetch(status) {
  const aufrufe = [];
  const fn = async (url, optionen) => {
    aufrufe.push({ url, optionen });
    return { ok: status >= 200 && status < 300, status };
  };
  return { fn, aufrufe };
}

test('Konfiguration: Adresse und öffentlicher Schlüssel sind eingetragen', () => {
  assert.match(SUPABASE_URL, /^https:\/\/[a-z0-9]+\.supabase\.co$/);
  assert.ok(SUPABASE_KEY.length > 20);
  assert.doesNotMatch(SUPABASE_KEY, /^sb_secret_/, 'geheimer Schlüssel gehört nie in die App');
});

test('sendeAnmeldung: schickt POST mit Schlüssel und Daten', async () => {
  const { fn, aufrufe } = falschesFetch(201);
  const daten = { termin_datum: '2026-10-15', termin_titel: 'Info-Abend', name: 'Julia', email: 'julia@example.de', nachricht: null };
  assert.deepEqual(await sendeAnmeldung(daten, fn), { ok: true });
  assert.equal(aufrufe.length, 1);
  const { url, optionen } = aufrufe[0];
  assert.equal(url, `${SUPABASE_URL}/rest/v1/anmeldungen`);
  assert.equal(optionen.method, 'POST');
  assert.equal(optionen.headers.apikey, SUPABASE_KEY);
  assert.equal(optionen.headers.Prefer, 'return=minimal');
  assert.equal(optionen.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(optionen.body), daten);
});

test('sendeAnmeldung: Server-Fehler werden gemeldet, nicht geworfen', async () => {
  for (const status of [400, 401, 500, 540]) {
    assert.deepEqual(await sendeAnmeldung({}, falschesFetch(status).fn), { ok: false, grund: `HTTP ${status}` });
  }
});

test('sendeAnmeldung: kein Netz', async () => {
  const ohneNetz = async () => { throw new TypeError('Failed to fetch'); };
  assert.deepEqual(await sendeAnmeldung({}, ohneNetz), { ok: false, grund: 'netz' });
});

test('sendeAnmeldung: bricht nach dem Zeitlimit ab', async () => {
  // Der Zeitgeber von AbortSignal.timeout hält Node nicht wach. Deshalb hält hier ein
  // eigener Zeitgeber den Test am Leben, bis das Abbrechen kommt.
  const haengt = (url, optionen) => new Promise((_, reject) => {
    const wach = setTimeout(() => {}, 5000);
    optionen.signal.addEventListener('abort', () => {
      clearTimeout(wach);
      reject(optionen.signal.reason);
    });
  });
  assert.deepEqual(await sendeAnmeldung({}, haengt, 20), { ok: false, grund: 'netz' });
});

test('meldeAn: gültige Eingaben werden gesendet', async () => {
  const { fn, aufrufe } = falschesFetch(201);
  assert.deepEqual(await meldeAn(TERMIN, GUT, fn), { ok: true });
  assert.equal(JSON.parse(aufrufe[0].optionen.body).termin_datum, '2026-10-15');
  assert.equal('webseite' in JSON.parse(aufrufe[0].optionen.body), false);
});

test('meldeAn: fehlerhafte Eingaben werden nicht gesendet', async () => {
  const { fn, aufrufe } = falschesFetch(201);
  const ergebnis = await meldeAn(TERMIN, { ...GUT, email: 'julia@' }, fn);
  assert.equal(ergebnis.ok, false);
  assert.equal(ergebnis.fehler.email, 'Diese E-Mail-Adresse sieht nicht vollständig aus.');
  assert.equal(aufrufe.length, 0);
});

test('meldeAn: Spam-Falle ausgefüllt → sieht nach Erfolg aus, sendet aber nichts', async () => {
  const { fn, aufrufe } = falschesFetch(201);
  assert.deepEqual(await meldeAn(TERMIN, { ...GUT, webseite: 'http://spam.example' }, fn), { ok: true });
  assert.equal(aufrufe.length, 0);
});

test('meldeAn: Server-Fehler kommt durch', async () => {
  assert.deepEqual(await meldeAn(TERMIN, GUT, falschesFetch(540).fn), { ok: false, grund: 'HTTP 540' });
});
