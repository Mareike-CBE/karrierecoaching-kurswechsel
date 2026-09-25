# Anmeldung zu Gruppenterminen – Bauplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Besucher melden sich per Formular für einen Gruppentermin an. Die Anmeldung landet in Supabase, und Mareike sieht dort die Anzahl pro Termin.

**Architecture:** Die App schickt einen `POST` direkt an die Supabase-REST-Schnittstelle, mit dem öffentlichen Schlüssel. Zeilenschutz (RLS) und Spaltenrechte erlauben von außen nur `INSERT` für kommende Termine. Prüf-Logik (`content.js`) und Senden (`anmeldung.js`) sind reine, getestete Module. `app.js` zeigt nur den Dialog an.

**Tech Stack:** Reines HTML/CSS/JavaScript (ES-Module), Node-eingebauter Testläufer (`node --test`), Supabase (Postgres + PostgREST), Supabase-MCP (claude.ai-Connector) für den Aufbau. Keine neuen npm-Pakete, kein supabase-js.

**Spec:** `docs/superpowers/specs/2026-09-25-gruppentermin-anmeldung-design.md`

Alle Pfade gelten relativ zu `Tag-4-Kit/Eigene-Website/`. Wichtig: Der Workshop-Ordner endet mit einem Leerzeichen, deshalb Pfade in Shell-Befehlen immer in Anführungszeichen setzen.

## Global Constraints

- Keine neuen Pakete. Kein Build-Schritt, denn Netlify veröffentlicht den Ordner direkt.
- Termine stehen nur in `Inhalte.md`. In Supabase stehen nur Anmeldungen.
- Grenzen, identisch in App und Datenbank: Name 1–100 Zeichen, E-Mail max. 254 Zeichen und Muster `^[^@\s]+@[^@\s]+\.[^@\s]+$`, Nachricht max. 1000 Zeichen, Termin-Titel 1–200 Zeichen. Gezählt wird in Unicode-Zeichen (Emoji = 1).
- Die Rolle `anon` darf nur `INSERT` auf die 5 Spalten `termin_datum, termin_titel, name, email, nachricht`, und nur wenn `termin_datum >= current_date`. Kein `SELECT`/`UPDATE`/`DELETE`. `authenticated` hat keine Rechte.
- Supabase-Projekt: kostenloser Tarif, Region `eu-central-1` (Frankfurt), Name `kurswechsel`.
- Texte für Besucher: duzen, kurze Sätze, keine Wörter aus der Verbotsliste in `tests/content.test.js` (z. B. „ermöglichen“, „vielleicht“, „eigentlich“).
- Inhalte kommen nur per `textContent` ins HTML, nie per `innerHTML`.
- Jeder Schritt, der in Supabase etwas anlegt, ändert oder löscht, wird Mareike vorher in einem Satz angekündigt. Löschen von Test-Anmeldungen geht nur nach ihrem ausdrücklichen Ja.
- Gearbeitet wird auf dem Zweig `anmeldung-supabase`. Lokale Commits pro Aufgabe sind erlaubt. Push, Merge und Live-Stellen passieren erst auf Mareikes „Save to GitHub“.

## Review Focus

1. **Name oder Nachricht mit Emoji oder Umlauten nahe an der Grenze:** App und Datenbank müssen gleich zählen. Sonst sagt die App „ok“ und die Datenbank lehnt ab. Getestet in Aufgabe 2.
2. **Gruppentermin ohne Datum („Datum folgt“):** Hier gibt es kein Formular, weil kein `termin_datum` existiert. Der Knopf bleibt die vorbereitete E-Mail. Getestet in Aufgabe 2 (`kannAnmelden`).
3. **Supabase hängt oder ist pausiert (HTTP 540):** Der Besucher darf nicht endlos „Wird gesendet …“ sehen. Nach 15 Sekunden erscheint der Fehler mit E-Mail-Ausweg. Getestet in Aufgabe 3.
4. **Leerzeichen um Eingaben** („ julia@example.de “) werden angenommen und bereinigt. Ein Name nur aus Leerzeichen wird abgelehnt. Getestet in Aufgabe 2.
5. **Doppeltes Tippen auf „Anmelden“** darf nur eine Anfrage senden. Geprüft im Browser-Test in Aufgabe 4.

---

### Task 1: Supabase-Projekt, Tabelle und Sicherheitsprüfung

**Files:**
- Create: `supabase/anmeldungen.sql` (die Datenbank-Einrichtung als Nachweis im Repository)
- Create: `anmeldung.js` (vorerst nur Adresse und öffentlicher Schlüssel)
- Create: `tools/pruefe-supabase.mjs` (Sicherheitsprüfung gegen das echte Supabase)

**Interfaces:**
- Produces: `anmeldung.js` exportiert `SUPABASE_URL` (String, ohne `/` am Ende) und `SUPABASE_KEY` (öffentlicher Schlüssel, String). Tabelle `public.anmeldungen` und Ansicht `public.anmeldungen_pro_termin` wie unten.

- [ ] **Step 1: Zweig anlegen**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && git switch -c anmeldung-supabase && git add docs/superpowers && git commit -m "Entwurf und Bauplan: Anmeldung zu Gruppenterminen"
```

Erwartet: `Switched to a new branch 'anmeldung-supabase'` und ein Commit mit 2 Dateien.

- [ ] **Step 2: SQL-Datei schreiben**

`supabase/anmeldungen.sql`:

```sql
-- Kurswechsel: Anmeldungen zu Gruppenterminen.
-- Von außen (öffentlicher Schlüssel = Rolle anon) darf man nur Anmeldungen HINZUFÜGEN,
-- und nur für Termine ab heute. Lesen, Ändern, Löschen geht nur im Supabase-Dashboard.

create table public.anmeldungen (
  id bigint generated always as identity primary key,
  erstellt_am timestamptz not null default now(),
  termin_datum date not null,
  termin_titel text not null check (char_length(termin_titel) between 1 and 200),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text not null check (
    char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  nachricht text check (nachricht is null or char_length(nachricht) <= 1000)
);

comment on table public.anmeldungen is
  'Anmeldungen zu Gruppenterminen aus der Kurswechsel-App. Von außen nur INSERT.';

alter table public.anmeldungen enable row level security;

-- Supabase gibt neuen Tabellen standardmäßig viele Rechte. Erst alles weg, dann gezielt erlauben.
revoke all on table public.anmeldungen from anon, authenticated;
grant insert (termin_datum, termin_titel, name, email, nachricht)
  on table public.anmeldungen to anon;

create policy "Besucher melden sich fuer kommende Termine an"
  on public.anmeldungen for insert to anon
  with check (termin_datum >= current_date);

-- Übersicht für das Dashboard: gleiche E-Mail zählt pro Termin nur einmal.
create view public.anmeldungen_pro_termin
  with (security_invoker = true) as
  select termin_datum, termin_titel, count(distinct lower(email)) as anmeldungen
  from public.anmeldungen
  group by termin_datum, termin_titel
  order by termin_datum, termin_titel;

revoke all on table public.anmeldungen_pro_termin from anon, authenticated;
```

- [ ] **Step 3: Supabase-Projekt anlegen (Mareike vorher ankündigen)**

Über den claude.ai-Supabase-Connector, in dieser Reihenfolge:
1. `list_organizations`: Organisations-ID notieren. Gibt es mehrere, Mareike fragen, welche.
2. `get_cost` mit `type: "project"` und der Organisations-ID. Erwartet: 0 $ (kostenloser Tarif). **Ist es nicht 0 $: anhalten und Mareike fragen.**
3. `confirm_cost` mit dem Betrag, dann `create_project` mit `name: "kurswechsel"`, `region: "eu-central-1"`, Organisations-ID und Bestätigungs-ID.
4. `get_project` wiederholt aufrufen, bis `status` = `ACTIVE_HEALTHY` ist. Das dauert meist 1–3 Minuten.

- [ ] **Step 4: Tabelle anlegen (Mareike vorher ankündigen)**

`apply_migration` mit `name: "anmeldungen"` und dem vollständigen Inhalt von `supabase/anmeldungen.sql` aus Step 2.

Danach mit `execute_sql` die Rechte kontrollieren:

```sql
select 'tabelle' as art, grantee, table_name, privilege_type, null as column_name
from information_schema.role_table_grants
where table_schema = 'public' and table_name in ('anmeldungen', 'anmeldungen_pro_termin')
  and grantee in ('anon', 'authenticated')
union all
select 'spalte', grantee, table_name, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'anmeldungen'
  and grantee in ('anon', 'authenticated')
order by 1, 2, 3, 4, 5;
```

Erwartet: keine Zeilen der Art `tabelle`. Genau 5 Zeilen der Art `spalte`, alle `anon`/`INSERT`, für `email, name, nachricht, termin_datum, termin_titel`.

- [ ] **Step 5: Adresse und Schlüssel in `anmeldung.js` eintragen**

`get_project_url` und `get_publishable_keys` aufrufen. Den Schlüssel nehmen, der mit `sb_publishable_` beginnt. Gibt es keinen, den `anon`-Schlüssel nehmen. Beide sind öffentlich gedacht, der `service_role`- oder `secret`-Schlüssel **niemals**.

`anmeldung.js`:

```js
// Kurswechsel: Anmeldungen an Supabase schicken.
// Der Schlüssel hier ist ÖFFENTLICH gedacht. Die Datenbank erlaubt damit nur das Hinzufügen
// von Anmeldungen (siehe supabase/anmeldungen.sql). Einen geheimen Schlüssel hier nie eintragen.
export const SUPABASE_URL = 'https://<projekt-ref>.supabase.co';
export const SUPABASE_KEY = '<öffentlicher Schlüssel aus get_publishable_keys>';
```

Die beiden Platzhalter in spitzen Klammern werden in diesem Step durch die echten Werte aus den beiden Aufrufen ersetzt. Danach darf keine spitze Klammer mehr in der Datei stehen.

- [ ] **Step 6: Sicherheitsprüfung schreiben**

`tools/pruefe-supabase.mjs`:

```js
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
```

- [ ] **Step 7: Sicherheitsprüfung laufen lassen**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && node tools/pruefe-supabase.mjs
```

Erwartet: 9 Zeilen mit ✅ und am Ende „Alle Schutzregeln greifen.“ Bei einem ❌: **nicht weitermachen.** Die Ursache mit superpowers:systematic-debugging suchen, die SQL-Datei und die Datenbank per neuer Migration korrigieren und die Prüfung wiederholen.

- [ ] **Step 8: Supabase-Sicherheitscheck**

`get_advisors` mit `type: "security"`. Erwartet: keine Warnung zu `anmeldungen` oder `anmeldungen_pro_termin`. Warnungen zu anderen Dingen (z. B. Auth-Einstellungen) Mareike zeigen und erklären, aber nicht eigenmächtig ändern.

- [ ] **Step 9: Commit**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && git add supabase/anmeldungen.sql anmeldung.js tools/pruefe-supabase.mjs && git commit -m "Supabase: Tabelle für Anmeldungen mit Schutzregeln und Sicherheitsprüfung"
```

---

### Task 2: Prüf-Regeln für das Formular (`content.js`)

**Files:**
- Modify: `content.js` (neue Funktionen am Ende anfügen)
- Test: `tests/content.test.js` (Import erweitern, Tests anfügen)

**Interfaces:**
- Consumes: Einträge aus `parseInhalte()`. Ein Gruppentermin hat `{ art: 'gruppe', titel, termin: { wert: 20261015, wochentag, text } | null, uhrzeit, ort, ... }`.
- Produces:
  - `kannAnmelden(eintrag) → boolean`: `true` nur für Gruppentermine mit gültigem Datum.
  - `pruefeAnmeldung({ name, email, nachricht }) → { name?: string, email?: string, nachricht?: string }`. Leeres Objekt = alles in Ordnung. Die Werte sind die Fehlertexte für Besucher.
  - `baueAnmeldung(eintrag, { name, email, nachricht }) → { termin_datum: 'JJJJ-MM-TT', termin_titel, name, email, nachricht: string | null }`.

- [ ] **Step 1: Fehlschlagende Tests schreiben**

In `tests/content.test.js` den Import erweitern:

```js
import {
  parseInhalte, parseDatum, parseUhrzeit, heuteWert, bereiteVor,
  filterListe, leerHinweis, datumZeitText, mailLink, teileName,
  kannAnmelden, pruefeAnmeldung, baueAnmeldung,
} from '../content.js';
```

Am Dateiende anfügen:

```js
const TERMIN = { art: 'gruppe', titel: 'Info-Abend', termin: parseDatum('15.10.2026'), uhrzeit: '19:00', ort: 'online' };

test('kannAnmelden: nur Gruppentermine mit Datum', () => {
  assert.equal(kannAnmelden(TERMIN), true);
  assert.equal(kannAnmelden({ ...TERMIN, termin: null }), false);
  assert.equal(kannAnmelden({ art: 'einzel', titel: 'Einzelcoaching' }), false);
});

test('pruefeAnmeldung: gültige Eingaben ohne Nachricht', () => {
  assert.deepEqual(pruefeAnmeldung({ name: 'Julia Beispiel', email: 'julia@example.de', nachricht: '' }), {});
});

test('pruefeAnmeldung: Leerzeichen am Rand sind egal', () => {
  assert.deepEqual(pruefeAnmeldung({ name: '  Julia ', email: ' julia@example.de ', nachricht: ' ' }), {});
});

test('pruefeAnmeldung: Pflichtfelder', () => {
  const fehler = pruefeAnmeldung({ name: '   ', email: '', nachricht: '' });
  assert.equal(fehler.name, 'Bitte gib deinen Namen ein.');
  assert.equal(fehler.email, 'Bitte gib deine E-Mail-Adresse ein.');
  assert.equal(fehler.nachricht, undefined);
});

test('pruefeAnmeldung: E-Mail muss vollständig aussehen', () => {
  for (const email of ['julia', 'julia@', 'julia@example', '@example.de', 'julia @example.de', 'a@b@c.de']) {
    assert.equal(pruefeAnmeldung({ name: 'J', email }).email, 'Diese E-Mail-Adresse sieht nicht vollständig aus.', email);
  }
  assert.equal(pruefeAnmeldung({ name: 'J', email: 'j.b+kurs@mail.example.de' }).email, undefined);
});

test('pruefeAnmeldung: Längen wie in der Datenbank, Emoji zählt als 1 Zeichen', () => {
  assert.equal(pruefeAnmeldung({ name: 'x'.repeat(100), email: 'a@b.de' }).name, undefined);
  assert.equal(pruefeAnmeldung({ name: 'x'.repeat(101), email: 'a@b.de' }).name, 'Bitte höchstens 100 Zeichen.');
  assert.equal(pruefeAnmeldung({ name: '🙂'.repeat(100), email: 'a@b.de' }).name, undefined);
  assert.equal(pruefeAnmeldung({ name: 'J', email: 'a@b.de', nachricht: 'ü'.repeat(1000) }).nachricht, undefined);
  assert.equal(pruefeAnmeldung({ name: 'J', email: 'a@b.de', nachricht: 'ü'.repeat(1001) }).nachricht, 'Bitte höchstens 1000 Zeichen.');
  const langeMail = `${'a'.repeat(250)}@b.de`;
  assert.equal(pruefeAnmeldung({ name: 'J', email: langeMail }).email, 'Diese E-Mail-Adresse sieht nicht vollständig aus.');
});

test('baueAnmeldung: Format für Supabase', () => {
  assert.deepEqual(
    baueAnmeldung(TERMIN, { name: ' Julia ', email: ' julia@example.de ', nachricht: '  Ich will in die IT.  ' }),
    { termin_datum: '2026-10-15', termin_titel: 'Info-Abend', name: 'Julia', email: 'julia@example.de', nachricht: 'Ich will in die IT.' },
  );
  assert.equal(baueAnmeldung(TERMIN, { name: 'J', email: 'a@b.de', nachricht: '   ' }).nachricht, null);
  assert.equal(baueAnmeldung({ ...TERMIN, termin: parseDatum('3.2.2027') }, { name: 'J', email: 'a@b.de' }).termin_datum, '2027-02-03');
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen fehlschlagen**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && npm test
```

Erwartet: FAIL mit einem Fehler wie `does not provide an export named 'kannAnmelden'`.

- [ ] **Step 3: Funktionen schreiben**

Am Ende von `content.js` anfügen:

```js
// ─── Anmeldung zu Gruppenterminen ───
// Gleiche Grenzen wie in supabase/anmeldungen.sql, damit App und Datenbank dasselbe sagen.

// Zählt wie die Datenbank: ein Emoji ist ein Zeichen (String.length würde 2 zählen).
const zeichen = (text) => Array.from(text).length;
const EMAIL_MUSTER = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const bereinigt = (wert) => String(wert ?? '').trim();

export function kannAnmelden(eintrag) {
  return eintrag.art === 'gruppe' && Boolean(eintrag.termin);
}

export function pruefeAnmeldung(eingaben) {
  const name = bereinigt(eingaben.name);
  const email = bereinigt(eingaben.email);
  const nachricht = bereinigt(eingaben.nachricht);
  const fehler = {};
  if (!name) fehler.name = 'Bitte gib deinen Namen ein.';
  else if (zeichen(name) > 100) fehler.name = 'Bitte höchstens 100 Zeichen.';
  if (!email) fehler.email = 'Bitte gib deine E-Mail-Adresse ein.';
  else if (zeichen(email) > 254 || !EMAIL_MUSTER.test(email)) {
    fehler.email = 'Diese E-Mail-Adresse sieht nicht vollständig aus.';
  }
  if (zeichen(nachricht) > 1000) fehler.nachricht = 'Bitte höchstens 1000 Zeichen.';
  return fehler;
}

export function baueAnmeldung(eintrag, eingaben) {
  const wert = String(eintrag.termin.wert); // z. B. "20261015"
  return {
    termin_datum: `${wert.slice(0, 4)}-${wert.slice(4, 6)}-${wert.slice(6, 8)}`,
    termin_titel: eintrag.titel,
    name: bereinigt(eingaben.name),
    email: bereinigt(eingaben.email),
    nachricht: bereinigt(eingaben.nachricht) || null,
  };
}
```

- [ ] **Step 4: Tests laufen lassen, jetzt müssen alle bestehen**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && npm test
```

Erwartet: alle Tests `ok`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && git add content.js tests/content.test.js && git commit -m "Anmeldung: Prüf-Regeln für Name, E-Mail und Nachricht"
```

---

### Task 3: Senden an Supabase (`anmeldung.js`)

**Files:**
- Modify: `anmeldung.js` (Funktionen unter den beiden Konstanten anfügen)
- Create: `tests/anmeldung.test.js`
- Modify: `package.json` (Testskript um die neue Datei erweitern)

**Interfaces:**
- Consumes: `SUPABASE_URL`, `SUPABASE_KEY` (Task 1). `pruefeAnmeldung`, `baueAnmeldung` (Task 2).
- Produces:
  - `sendeAnmeldung(daten, fetchFn?, zeitlimitMs = 15000) → Promise<{ ok: true } | { ok: false, grund: string }>`. Wirft nie.
  - `meldeAn(eintrag, eingaben, fetchFn?) → Promise<{ ok: true } | { ok: false, fehler: {…} } | { ok: false, grund: string }>`. `eingaben` hat `name, email, nachricht, webseite` (`webseite` = Spam-Falle).

- [ ] **Step 1: Fehlschlagende Tests schreiben**

`tests/anmeldung.test.js`:

```js
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
```

In `package.json` das Testskript ändern:

```json
    "test": "node --test tests/content.test.js tests/anmeldung.test.js",
```

- [ ] **Step 2: Tests laufen lassen, sie müssen fehlschlagen**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && npm test
```

Erwartet: FAIL mit einem Fehler wie `does not provide an export named 'sendeAnmeldung'`.

- [ ] **Step 3: Funktionen schreiben**

In `anmeldung.js` unter den beiden Konstanten anfügen. Die Import-Zeile kommt an den Dateianfang, direkt unter den Kommentar:

```js
import { pruefeAnmeldung, baueAnmeldung } from './content.js';
```

```js
// Schickt eine fertige Anmeldung an Supabase. Wirft nie, sondern liefert { ok } zurück.
// fetchFn ist austauschbar, damit die Tests ohne Internet laufen.
export async function sendeAnmeldung(daten, fetchFn = (...a) => globalThis.fetch(...a), zeitlimitMs = 15000) {
  try {
    const antwort = await fetchFn(`${SUPABASE_URL}/rest/v1/anmeldungen`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(daten),
      // Hängt Supabase (z. B. pausiertes Projekt), soll niemand ewig warten.
      signal: AbortSignal.timeout(zeitlimitMs),
    });
    return antwort.ok ? { ok: true } : { ok: false, grund: `HTTP ${antwort.status}` };
  } catch {
    return { ok: false, grund: 'netz' };
  }
}

// Der ganze Ablauf für einen Klick auf „Anmelden“: Spam-Falle, Prüfen, Senden.
export async function meldeAn(eintrag, eingaben, fetchFn) {
  // Das unsichtbare Feld „webseite“ füllen nur Spam-Programme aus.
  if (String(eingaben.webseite ?? '').trim()) return { ok: true };
  const fehler = pruefeAnmeldung(eingaben);
  if (Object.keys(fehler).length > 0) return { ok: false, fehler };
  return sendeAnmeldung(baueAnmeldung(eintrag, eingaben), fetchFn);
}
```

- [ ] **Step 4: Tests laufen lassen, jetzt müssen alle bestehen**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && npm test
```

Erwartet: alle Tests beider Dateien `ok`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && git add anmeldung.js tests/anmeldung.test.js package.json && git commit -m "Anmeldung: Senden an Supabase mit Zeitlimit und Spam-Falle"
```

---

### Task 4: Formular-Dialog in der App

**Files:**
- Modify: `index.html` (Dialog vor `</body>` einfügen)
- Modify: `app.js` (Import, `karte()`, neue Dialog-Funktionen, `start()`)
- Modify: `style.css` (Dialog- und Formularstile anfügen)
- Modify: `sw.js` (`anmeldung.js` in `START_DATEIEN`)

**Interfaces:**
- Consumes: `kannAnmelden`, `datumZeitText`, `mailLink` aus `content.js`. `meldeAn` aus `anmeldung.js`.
- Produces: nichts für spätere Aufgaben.

- [ ] **Step 1: Datenschutztext mit Mareike abstimmen**

Mareike diesen Entwurf zeigen und auf ihr Ja oder ihren eigenen Text warten:
*„Ich nutze deine Angaben nur, um dich zu diesem Termin zu kontaktieren.“*
Den bestätigten Text in Step 2 unverändert einsetzen. Dazu der Hinweis, dass die rechtliche Prüfung bei ihr liegt.

- [ ] **Step 2: Dialog in `index.html`**

Direkt vor `</body>` einfügen:

```html
  <dialog class="dialog" id="anmeldung" aria-labelledby="anmeldung-titel">
    <form class="formular" id="anmeldung-formular" novalidate>
      <p class="label">Anmeldung</p>
      <h2 class="dialog-titel" id="anmeldung-titel"></h2>
      <p class="dialog-termin" id="anmeldung-termin"></p>

      <label for="feld-name">Name</label>
      <input id="feld-name" name="name" autocomplete="name" maxlength="100" required aria-describedby="fehler-name">
      <p class="feld-fehler" id="fehler-name" hidden></p>

      <label for="feld-email">E-Mail</label>
      <input id="feld-email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" required aria-describedby="fehler-email">
      <p class="feld-fehler" id="fehler-email" hidden></p>

      <label for="feld-nachricht">Deine Frage oder Situation <span class="freiwillig">(freiwillig)</span></label>
      <textarea id="feld-nachricht" name="nachricht" rows="4" maxlength="1000" aria-describedby="fehler-nachricht"></textarea>
      <p class="feld-fehler" id="fehler-nachricht" hidden></p>

      <!-- Spam-Falle: für Menschen unsichtbar. Nicht entfernen. -->
      <div class="falle" aria-hidden="true">
        <label for="feld-webseite">Webseite</label>
        <input id="feld-webseite" name="webseite" tabindex="-1" autocomplete="off">
      </div>

      <p class="datenschutz">Ich nutze deine Angaben nur, um dich zu diesem Termin zu kontaktieren.</p>

      <div class="dialog-knoepfe">
        <button type="button" class="knopf knopf--leise" data-schliessen>Abbrechen</button>
        <button type="submit" class="knopf" id="anmeldung-senden">Anmelden</button>
      </div>
    </form>

    <div class="dialog-ergebnis" id="anmeldung-ergebnis" hidden>
      <p class="dialog-meldung" id="anmeldung-meldung" role="status"></p>
      <div class="dialog-knoepfe">
        <a class="knopf knopf--leise" id="anmeldung-mail" hidden>E-Mail schreiben</a>
        <button type="button" class="knopf" data-schliessen>Schließen</button>
      </div>
    </div>
  </dialog>
```

- [ ] **Step 3: `app.js` anpassen**

Import ersetzen durch:

```js
import {
  parseInhalte, heuteWert, bereiteVor, filterListe, leerHinweis,
  datumZeitText, mailLink, teileName, kannAnmelden,
} from './content.js';
import { meldeAn } from './anmeldung.js';
```

Unter `let filter = 'alle';` ergänzen:

```js
let offeneAnmeldung = null; // { eintrag, inhalte } des Termins im Dialog
let sendetGerade = false; // verhindert doppeltes Senden bei Doppeltipp
```

In `karte()` den Block `const link = mailLink(...)` bis zur schließenden `}` von `if (link)` ersetzen durch:

```js
  if (kannAnmelden(eintrag)) {
    const knopf = el('button', 'knopf', 'Anmelden');
    knopf.type = 'button';
    knopf.addEventListener('click', () => oeffneAnmeldung(eintrag, inhalte));
    fuss.append(knopf);
  } else {
    const link = mailLink(eintrag, inhalte.allgemein.email, inhalte.ueberMich.name);
    if (link) {
      const knopf = el('a', 'knopf', eintrag.art === 'gruppe' ? 'Anmelden' : 'Anfragen');
      knopf.href = link;
      fuss.append(knopf);
    }
  }
```

Vor `async function laden()` einfügen:

```js
// ─── Anmelde-Dialog ───
const FELDER = ['name', 'email', 'nachricht'];

function zeigeFeldFehler(fehler) {
  for (const feld of FELDER) {
    const hinweis = $(`#fehler-${feld}`);
    hinweis.textContent = fehler[feld] || '';
    hinweis.hidden = !fehler[feld];
    $(`#feld-${feld}`).setAttribute('aria-invalid', String(Boolean(fehler[feld])));
  }
  const erstes = FELDER.find((feld) => fehler[feld]);
  if (erstes) $(`#feld-${erstes}`).focus();
}

function setzeSenden(an) {
  sendetGerade = an;
  const knopf = $('#anmeldung-senden');
  knopf.disabled = an;
  knopf.textContent = an ? 'Wird gesendet …' : 'Anmelden';
}

function oeffneAnmeldung(eintrag, inhalte) {
  offeneAnmeldung = { eintrag, inhalte };
  const formular = $('#anmeldung-formular');
  formular.reset();
  zeigeFeldFehler({});
  setzeSenden(false);
  $('#anmeldung-titel').textContent = eintrag.titel;
  $('#anmeldung-termin').textContent = [datumZeitText(eintrag), eintrag.ort].filter(Boolean).join(' · ');
  formular.hidden = false;
  $('#anmeldung-ergebnis').hidden = true;
  $('#anmeldung').showModal();
}

function zeigeErgebnis(ok) {
  const { eintrag, inhalte } = offeneAnmeldung;
  $('#anmeldung-formular').hidden = true;
  $('#anmeldung-ergebnis').hidden = false;
  const mail = $('#anmeldung-mail');
  if (ok) {
    $('#anmeldung-meldung').textContent =
      `Danke, du bist angemeldet für „${eintrag.titel}“ am ${eintrag.termin.text}. Ich melde mich per E-Mail bei dir.`;
    mail.hidden = true;
  } else {
    $('#anmeldung-meldung').textContent = 'Das hat leider nicht geklappt. Schreib mir einfach eine E-Mail.';
    const link = mailLink(eintrag, inhalte.allgemein.email, inhalte.ueberMich.name);
    if (link) mail.href = link;
    mail.hidden = !link;
  }
}

async function sendeFormular(ereignis) {
  ereignis.preventDefault();
  if (!offeneAnmeldung || sendetGerade) return;
  const formular = new FormData(ereignis.target);
  const eingaben = {};
  for (const feld of [...FELDER, 'webseite']) eingaben[feld] = String(formular.get(feld) ?? '');
  setzeSenden(true);
  const ergebnis = await meldeAn(offeneAnmeldung.eintrag, eingaben);
  setzeSenden(false);
  if (ergebnis.fehler) {
    zeigeFeldFehler(ergebnis.fehler);
    return;
  }
  if (!ergebnis.ok) console.warn('Anmeldung fehlgeschlagen:', ergebnis.grund);
  zeigeErgebnis(ergebnis.ok);
}

function verbindeAnmeldung() {
  $('#anmeldung-formular').addEventListener('submit', sendeFormular);
  for (const knopf of document.querySelectorAll('[data-schliessen]')) {
    knopf.addEventListener('click', () => $('#anmeldung').close());
  }
}
```

In `start()` direkt nach `verbindeFilter();` einfügen:

```js
  verbindeAnmeldung();
```

- [ ] **Step 4: Stile in `style.css`**

Am Dateiende **vor** dem Block `@media (prefers-reduced-motion: reduce)` einfügen:

```css
/* ─── Anmelde-Dialog ─── */
button.knopf { border: 0; cursor: pointer; font-family: inherit; }
button.knopf:disabled { opacity: 0.6; cursor: wait; }
.knopf--leise {
  background: transparent;
  color: var(--deep-violet);
  border: 1px solid var(--soft-iris);
}
.knopf--leise:hover { background: var(--lavender-mist); }

.dialog {
  width: calc(100% - 32px);
  max-width: 480px;
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 24px 22px;
  border: none;
  border-radius: var(--radius-lg);
  background: #fff;
  color: var(--midnight-ink);
  box-shadow: var(--shadow-md);
  overflow-y: auto;
}
.dialog::backdrop { background: rgba(26, 26, 46, 0.55); }
.dialog-titel { font-weight: 700; font-size: 22px; line-height: 1.2; margin: 6px 0 4px; }
.dialog-termin { color: var(--ink-soft); margin-bottom: 16px; }

.formular label { display: block; font-weight: 600; font-size: 15px; margin: 14px 0 6px; }
.formular .freiwillig { font-weight: 400; color: var(--ink-soft); }
.formular input,
.formular textarea {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--soft-iris);
  border-radius: 12px;
  background: #fff;
  color: var(--midnight-ink);
  font: 400 16px/1.5 var(--body);           /* 16px: iPhone zoomt sonst beim Tippen hinein */
}
.formular textarea { resize: vertical; }
.formular input[aria-invalid="true"],
.formular textarea[aria-invalid="true"] { border: 2px solid var(--deep-violet); }
.feld-fehler { color: var(--deep-violet); font-weight: 600; font-size: 14px; margin-top: 6px; }
.falle { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
.datenschutz { color: var(--ink-soft); font-size: 14px; margin-top: 16px; }
.dialog-meldung { font-size: 17px; }

.dialog-knoepfe { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.dialog-knoepfe .knopf { margin-left: 0; }

.formular input:focus-visible,
.formular textarea:focus-visible,
.dialog .knopf:focus-visible {
  outline: 3px solid var(--deep-violet);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Service Worker**

In `sw.js` in `START_DATEIEN` nach `'content.js',` die Zeile `'anmeldung.js',` einfügen. Die Versionsnummer `CACHE` bleibt: Die geänderte `sw.js` wird ohnehin neu installiert, und die Regel „Netz zuerst“ bleibt gleich.

- [ ] **Step 6: Tests laufen lassen**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && npm test
```

Erwartet: `# fail 0`. Die Tests für `Inhalte.md` prüfen auch die Styleguide-Wörter. Die neuen Besucher-Texte stehen in `app.js`/`index.html` und dürfen ebenfalls keine Verbotswörter enthalten. Das von Hand gegen die Liste in `tests/content.test.js` abgleichen.

- [ ] **Step 7: Browser-Test (Vorschau „kurswechsel“)**

Vorschau mit `preview_start` `{ name: "kurswechsel" }` starten. Fehlt der Eintrag in `.claude/launch.json`, ihn mit `npm start` und Port 8080 anlegen. Dann:

1. Konsole: keine Fehler beim Laden.
2. Bei einem Gruppentermin auf „Anmelden“ tippen. Der Dialog zeigt Titel, Datum und Ort.
3. Leer absenden. Die Hinweise an Name und E-Mail erscheinen, und der Fokus steht im Namensfeld.
4. Name `TEST – bitte löschen`, E-Mail `test@example.org` eintragen und auf „Anmelden“ **doppelt** tippen. Danach im Netzwerk-Protokoll (`read_network_requests`, Filter `anmeldungen`) prüfen: genau **ein** `POST` mit Status 201. Erfolgsmeldung sichtbar.
5. In Supabase per `execute_sql` gegenprüfen: `select termin_datum, termin_titel, name from public.anmeldungen order by id desc limit 3;` Die Test-Anmeldung steht darin, mit dem richtigen Datum und Titel.
6. Fehlerfall: Seite neu laden. Per `javascript_tool` `window.fetch = () => Promise.reject(new TypeError('offline'));` setzen und erneut anmelden. Erwartet: „Das hat leider nicht geklappt …“ und ein sichtbarer Knopf „E-Mail schreiben“ mit `mailto:`-Link.
7. Einzelcoaching-Karte: Der Knopf „Anfragen“ ist weiterhin ein `mailto:`-Link.
8. `resize_window` auf `mobile`, Dialog öffnen: Alles ist ohne seitliches Scrollen bedienbar, und die Knöpfe sind sichtbar. Danach `resize_window` auf `desktop` zurücksetzen.
9. Screenshots von Dialog, Erfolgsmeldung und Handy-Ansicht an Mareike schicken.

- [ ] **Step 8: Commit**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && git add index.html app.js style.css sw.js && git commit -m "Anmeldung: Formular-Dialog für Gruppentermine"
```

---

### Task 5: Dokumentation und Live-Stellen

**Files:**
- Modify: `CLAUDE.md` (in `Eigene-Website/`)

**Interfaces:**
- Consumes: alles aus Task 1–4.

- [ ] **Step 1: `CLAUDE.md` ergänzen**

Zuerst `CLAUDE.md` lesen. Dann einen Abschnitt `## Anmeldungen (Supabase)` anfügen, im Stil der Datei, mit diesem Inhalt:

```markdown
## Anmeldungen (Supabase)

Bewusste Ausnahme von der Kursregel „keine Datenbank“: Anmeldungen zu Gruppenterminen
landen in Supabase (Projekt `kurswechsel`, Region Frankfurt, kostenloser Tarif).
Weiterhin keine Logins in der App. Termine stehen weiter nur in `Inhalte.md`.

- Einrichtung und Schutzregeln: `supabase/anmeldungen.sql`. Von außen nur `INSERT` für Termine ab heute.
- Senden: `anmeldung.js` (öffentlicher Schlüssel, darf öffentlich sein; nie einen geheimen Schlüssel eintragen).
- Sicherheitsprüfung nach jeder Änderung an der Datenbank: `node tools/pruefe-supabase.mjs`
  (legt Test-Anmeldungen „TEST – bitte löschen“ an).
- Mareike sieht die Zahlen im Supabase-Dashboard → Table Editor → `anmeldungen_pro_termin`.
  Einzelne Anmeldungen unter `anmeldungen`. Alte Anmeldungen dort regelmäßig löschen (Datenschutz).
- Kostenloser Tarif: Nach 7 Tagen mit wenig Betrieb pausiert Supabase das Projekt. Vorher kommt eine
  Warn-E-Mail. Wiederherstellen im Dashboard mit „Resume project“. Während der Pause sehen Besucher
  den Ausweg per E-Mail.
- Für Claude im Alltag: Projekt-Eintrag `supabase` (nur lesen). Schreibzugriff nur über den
  claude.ai-Connector und nur mit Mareikes Zustimmung.
```

In der Zeile zu den Befehlen, falls vorhanden, `npm test` so ergänzen, dass beide Testdateien erwähnt sind.

- [ ] **Step 2: Commit**

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && git add CLAUDE.md && git commit -m "CLAUDE.md: Anmeldungen mit Supabase dokumentiert"
```

- [ ] **Step 3: Warten auf „Save to GitHub“**

Mareike zeigen: alle Tests grün, Sicherheitsprüfung grün, Screenshots. Erst auf ihr „Save to GitHub“ weitermachen.

- [ ] **Step 4: Veröffentlichen**

Wie bei PR #1: Zweig pushen, Pull Request öffnen, nach Mareikes Ja zusammenführen.

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && git push -u origin anmeldung-supabase && gh pr create --title "Anmeldung zu Gruppenterminen mit Supabase" --body "Formular für Gruppentermine, Anmeldungen in Supabase (nur INSERT von außen). Entwurf und Plan unter docs/superpowers/."
```

Danach `ccd_pr` `get_status` bzw. `bind_pr`. Zusammenführen erst nach Mareikes ausdrücklichem Ja:

```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && gh pr merge --merge --delete-branch && git switch main && git pull
```

- [ ] **Step 5: Live prüfen**

Warten, bis Netlify fertig ist. Das geht über den Netlify-MCP (Deploy-Status der Seite `kurswechsel`) oder, falls der nicht klappt, durch Neuladen der Seite, bis `anmeldung.js` ausgeliefert wird. Dann im Browser `https://kurswechsel.netlify.app` öffnen und eine Test-Anmeldung wie in Task 4, Step 7.4 machen. Erwartet: Status 201 und Erfolgsmeldung.

- [ ] **Step 6: Test-Anmeldungen löschen (nur nach Rückfrage)**

Mareike fragen: „Darf ich die N Test-Anmeldungen mit dem Namen ‚TEST – bitte löschen‘ löschen?“ Erst nach ihrem Ja per `execute_sql`:

```sql
delete from public.anmeldungen where name = 'TEST – bitte löschen' returning id;
```

Danach Mareike im Dashboard einmal zeigen, wo `anmeldungen_pro_termin` steht. Dazu der Hinweis, dass sie den claude.ai-Supabase-Connector jetzt wieder abschalten kann.
