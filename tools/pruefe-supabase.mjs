// Kurswechsel: prüft die Schutzregeln der Anmelde-Tabelle mit dem ÖFFENTLICHEN Schlüssel,
// also genau mit dem, was jeder Fremde auch hätte.
// Aufruf im Ordner Eigene-Website:  node tools/pruefe-supabase.mjs
// Legt Test-Anmeldungen mit dem Namen "TEST – bitte löschen" an. Die danach im Dashboard löschen.
import { SUPABASE_URL, SUPABASE_KEY } from '../anmeldung.js';

const API = `${SUPABASE_URL}/rest/v1`;
const KOPF = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
const TESTNAME = 'TEST – bitte löschen';

function tagAbHeute(tage) {
  const datum = new Date();
  datum.setUTCDate(datum.getUTCDate() + tage);
  return datum.toISOString().slice(0, 10);
}

const anmeldung = (extra = {}) => JSON.stringify({
  termin_datum: tagAbHeute(30),
  termin_titel: 'TEST-Termin',
  name: TESTNAME,
  email: 'test@example.org',
  nachricht: null,
  ...extra,
});

const verweigert = (a) => a.status === 401 || a.status === 403;
const filterName = `name=eq.${encodeURIComponent(TESTNAME)}`;

const FAELLE = [
  ['Anmeldung für kommenden Termin hinzufügen', 'klappt',
    () => fetch(`${API}/anmeldungen`, { method: 'POST', headers: KOPF, body: anmeldung() }),
    async (a) => a.status === 201],
  ['Anmeldungen lesen', 'verweigert oder leer',
    () => fetch(`${API}/anmeldungen?select=*`, { headers: KOPF }),
    async (a) => verweigert(a) || (a.status === 200 && (await a.text()).trim() === '[]')],
  ['Übersicht pro Termin lesen', 'verweigert',
    () => fetch(`${API}/anmeldungen_pro_termin?select=*`, { headers: KOPF }),
    async (a) => verweigert(a)],
  ['Anmeldung ändern', 'verweigert',
    () => fetch(`${API}/anmeldungen?${filterName}`, { method: 'PATCH', headers: KOPF, body: JSON.stringify({ name: 'geändert' }) }),
    async (a) => verweigert(a)],
  ['Anmeldung löschen', 'verweigert',
    () => fetch(`${API}/anmeldungen?${filterName}`, { method: 'DELETE', headers: KOPF }),
    async (a) => verweigert(a)],
  ['Anmeldung für vergangenen Termin', 'abgelehnt',
    () => fetch(`${API}/anmeldungen`, { method: 'POST', headers: KOPF, body: anmeldung({ termin_datum: tagAbHeute(-1) }) }),
    async (a) => verweigert(a)],
  ['Name mit 101 Zeichen', 'abgelehnt',
    () => fetch(`${API}/anmeldungen`, { method: 'POST', headers: KOPF, body: anmeldung({ name: 'x'.repeat(101) }) }),
    async (a) => a.status === 400],
  ['E-Mail ohne @', 'abgelehnt',
    () => fetch(`${API}/anmeldungen`, { method: 'POST', headers: KOPF, body: anmeldung({ email: 'julia.example.de' }) }),
    async (a) => a.status === 400],
  ['Eigene ID mitschicken', 'abgelehnt',
    () => fetch(`${API}/anmeldungen`, { method: 'POST', headers: KOPF, body: anmeldung({ id: 999999 }) }),
    async (a) => a.status >= 400],
];

let fehlgeschlagen = 0;
for (const [was, erwartet, anfrage, pruefe] of FAELLE) {
  const antwort = await anfrage();
  const ok = await pruefe(antwort);
  if (!ok) fehlgeschlagen += 1;
  console.log(`${ok ? '✅' : '❌'} ${was}: erwartet „${erwartet}“, bekommen HTTP ${antwort.status}`);
}
console.log(fehlgeschlagen ? `\n${fehlgeschlagen} Prüfung(en) fehlgeschlagen.` : '\nAlle Schutzregeln greifen.');
process.exitCode = fehlgeschlagen ? 1 : 0;
