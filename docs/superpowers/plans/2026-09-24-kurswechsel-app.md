# Kurswechsel-App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine installierbare PWA „Kurswechsel – Karrierecoaching", die Termine und Preise aus `Inhalte.md` anzeigt, filtert und per `mailto:` buchen lässt.

**Architecture:** Statische Dateien ohne Build-Schritt. `content.js` ist reine, in Node getestete Logik (Markdown einlesen, Termine aufbereiten, Mail-Links bauen). `app.js` lädt `Inhalte.md`, baut daraus DOM-Elemente und steuert den Filter. Ein network-first Service Worker plus `Cache-Control: no-cache` sorgen dafür, dass Updates immer ankommen.

**Tech Stack:** HTML, CSS, JavaScript (ES-Module), Node 20 eingebauter Testläufer (`node --test`), Python 3 + Pillow nur zum Erzeugen der Icons, Netlify (statisch).

**Spec:** `docs/superpowers/specs/2026-09-24-kurswechsel-app-design.md`

**Arbeitsordner:** Alle Pfade sind relativ zu
`/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website/`
⚠️ Der Pfad enthält `Claude-Workshop ` **mit Leerzeichen am Ende**. In Shell-Befehlen immer in Anführungszeichen setzen, z. B. `cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website"`.

**Keine Commits in diesem Plan.** Git hat auf diesem Rechner noch keine Identität; die wird in Kursschritt 7 mit der GitHub-noreply-Adresse eingerichtet. Ein Commit jetzt könnte die private E-Mail in die öffentliche Historie schreiben. Statt „Commit" endet jeder Task mit einem Prüfschritt.

## Global Constraints

- Keine Datenbank, kein Login, keine npm-Abhängigkeiten zur Laufzeit, kein Build-Schritt.
- Alle redaktionellen Inhalte stehen ausschließlich in `Inhalte.md`, nie fest in HTML/JS.
- Farben: Midnight Ink `#1A1A2E`, Warm White `#F5F3EF`, Signal Purple `#7F77DD`, Lavender Mist `#EEEDFE`, Soft Iris `#AFA9EC`, Deep Violet `#3C3489`.
- Schriften: Syne (Überschriften, 700/600/500), Inter (Fließtext, 400/500), Ersatz Arial. Kein Kursiv.
- Ton: immer „Du", kurze Hauptsätze, kein Gendersternchen/Doppelpunkt, Punkt statt Gedankenstrich im Fließtext.
- Verbotene Wörter: revolutionieren, disruptiv, transformieren, ermöglichen, entdecken, freischalten, bahnbrechend, bemerkenswert, vielleicht, eigentlich, grundsätzlich, Empowerment, Game-Changer, next level.
- Nie in irgendeine Datei: Wohnadresse, Handynummer, private E-Mail aus Mareikes Profil.
- E-Mail (Platzhalter): `hallo@kurswechsel-coaching.de`. Coach: Mareike Kirch.
- Texte aus `Inhalte.md` nur per `textContent` ins DOM, nie per `innerHTML`.
- Fußzeilen-Hinweis wörtlich: „Beispielseite aus einem Workshop. Preise und Termine sind Beispiele."

## Review Focus

1. **Datum im falschen Format** (`15.10.26`, `31.02.2026`, leer): Termin bleibt sichtbar mit „Datum folgt", am Ende der Liste, nie als „Nächster Termin". → Tests in Task 1.
2. **Uhrzeit anders geschrieben** (`19 Uhr`, `9.30`, `abends`): lesbare Varianten werden zu `19:00`/`09:30`, Unlesbares wird wörtlich gezeigt statt verschluckt. → Tests in Task 1.
3. **Zwei Termine am selben Tag**, in der Datei in falscher Reihenfolge: der frühere Uhrzeit-Termin wird „Nächster Termin". → Test in Task 1.
4. **Sonderzeichen im Titel** (`&`, `?`, `„"`): Mail-Betreff kommt vollständig im Mailprogramm an (korrekt kodiert). → Test in Task 1.
5. **Datei mit Windows-Zeilenenden, anderer Groß-/Kleinschreibung oder mehrzeiligem Text mit Doppelpunkt:** wird genauso gelesen; Folgezeilen gehen nicht verloren. → Tests in Task 1.

---

## Dateiübersicht

| Datei | Verantwortung | Task |
|---|---|---|
| `package.json` | Macht `.js` zu ES-Modulen für Node; Befehl `npm test` | 1 |
| `.gitignore` | `.env`, `node_modules/`, `.DS_Store`, `.superpowers/` | 1 |
| `content.js` | Reine Logik (Einlesen, Aufbereiten, Mail-Links) | 1 |
| `tests/content.test.js` | Tests für `content.js` | 1, 2 |
| `Inhalte.md` | Alle Inhalte, von Mareike bearbeitbar | 2 |
| `tools/server.mjs` | Lokaler Testserver mit `Cache-Control: no-cache` | 3 |
| `index.html` | Grundgerüst | 3 |
| `style.css` | Aussehen | 3 |
| `app.js` | Laden, Anzeigen, Filter, SW-Registrierung | 3 |
| `icons/icon.svg`, `tools/make_icons.py`, `icons/*.png` | App-Icon | 4 |
| `manifest.webmanifest` | PWA-Ausweis | 4 |
| `sw.js` | Service Worker (network-first) | 4 |
| `netlify.toml` | Cache-Header, Veröffentlichungsordner | 4 |
| `docs/Styleguide/Mareike_StyleGuide_v1.docx` | Kopie des Styleguides | 5 |
| `../../CLAUDE.md` (Workshop-Wurzel) | Befehle ergänzen | 5 |
| `../../.claude/launch.json` (Workshop-Wurzel) | Vorschau-Server für die Browser-Ansicht | 3 |

---

### Task 1: Inhalts-Logik (`content.js`) mit Tests

**Files:**
- Create: `package.json`, `.gitignore`, `content.js`, `tests/content.test.js`

**Interfaces:**
- Consumes: nichts
- Produces (alle als benannte Exporte aus `content.js`):
  - `parseInhalte(text: string) → { allgemein: {name?, spruch?, email?}, ueberMich: {name?, text?}, einzel: Eintrag[], gruppen: Eintrag[] }`
  - `Eintrag = { art: 'einzel'|'gruppe', titel: string, dauer?, preis?, beschreibung?, ort?, datum?: string (roh), uhrzeit?: string|null, termin?: {wert: number (JJJJMMTT), wochentag: string ('Do'), text: string ('15.10.2026')}|null }` — `termin` und normalisierte `uhrzeit` nur bei `art: 'gruppe'`.
  - `parseDatum(text) → {wert, wochentag, text} | null`
  - `parseUhrzeit(text) → 'HH:MM' | Originaltext | null`
  - `heuteWert(datum?: Date) → number` (JJJJMMTT, lokale Zeit)
  - `bereiteVor(inhalte, heute: number) → { naechster: Eintrag|null, gruppen: Eintrag[], einzel: Eintrag[] }`
  - `filterListe(ansicht, filter: 'alle'|'einzel'|'gruppe') → Eintrag[]`
  - `leerHinweis(ansicht, filter) → null | 'weitere-folgen' | 'keine-termine'`
  - `datumZeitText(eintrag) → string` (z. B. `'Do, 15.10.2026, 19:00 Uhr'` oder `'Datum folgt'`)
  - `mailLink(eintrag, email, coachName) → string | null`
  - `teileName(name) → { haupt: string, zusatz: string }`

- [ ] **Step 1: Projektdateien anlegen**

`package.json`:
```json
{
  "name": "kurswechsel",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/content.test.js",
    "start": "node tools/server.mjs"
  }
}
```

`.gitignore`:
```
.env
.env.*
node_modules/
.DS_Store
.superpowers/
```

- [ ] **Step 2: Tests schreiben (schlagen zunächst fehl)**

`tests/content.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseInhalte, parseDatum, parseUhrzeit, heuteWert, bereiteVor,
  filterListe, leerHinweis, datumZeitText, mailLink, teileName,
} from '../content.js';

const BEISPIEL = `<!-- Anleitung, wird ignoriert.
Datum: 01.01.2000
-->
# Inhalte

## Allgemein
Name: Kurswechsel – Karrierecoaching
Spruch: Neue Richtung. Klarer Plan.
E-Mail: hallo@example.org

## Über mich
Name: Mareike Kirch
Text: Erste Zeile.
Zweite Zeile: mit Doppelpunkt.

## Einzelcoaching
### Kennenlerngespräch
Dauer: 20 Min.
Preis: kostenlos
Beschreibung: Kurz reden.

### Einzelcoaching
DAUER : 60 Min.
Preis:120 €

###
Preis: 999 €

## Gruppentermine
### Webinar: Neustart mit 40
Datum: 27.10.2026
Uhrzeit: 18:30
Preis: 29 €

### Info-Abend
Datum: 15.10.2026
Uhrzeit: 19 Uhr
Ort: online

### Vergangen
Datum: 01.09.2026

### Tippfehler
Datum: 31.02.2026
`;

const titel = (liste) => liste.map((e) => e.titel);

test('liest Allgemein und Über mich', () => {
  const inhalte = parseInhalte(BEISPIEL);
  assert.deepEqual(inhalte.allgemein, {
    name: 'Kurswechsel – Karrierecoaching',
    spruch: 'Neue Richtung. Klarer Plan.',
    email: 'hallo@example.org',
  });
  assert.equal(inhalte.ueberMich.name, 'Mareike Kirch');
});

test('Folgezeilen gehören zum vorigen Feld, auch mit Doppelpunkt', () => {
  const inhalte = parseInhalte(BEISPIEL);
  assert.equal(inhalte.ueberMich.text, 'Erste Zeile.\nZweite Zeile: mit Doppelpunkt.');
});

test('liest Einzelangebote, Stichwörter ohne Rücksicht auf Schreibweise', () => {
  const inhalte = parseInhalte(BEISPIEL);
  assert.deepEqual(titel(inhalte.einzel), ['Kennenlerngespräch', 'Einzelcoaching']);
  assert.equal(inhalte.einzel[1].dauer, '60 Min.');
  assert.equal(inhalte.einzel[1].preis, '120 €');
  assert.equal(inhalte.einzel[0].art, 'einzel');
});

test('Eintrag ohne Titel wird übersprungen', () => {
  const inhalte = parseInhalte(BEISPIEL);
  assert.ok(!inhalte.einzel.some((e) => e.preis === '999 €'));
});

test('liest Gruppentermine, Kommentare erzeugen nichts', () => {
  const inhalte = parseInhalte(BEISPIEL);
  assert.deepEqual(titel(inhalte.gruppen), ['Webinar: Neustart mit 40', 'Info-Abend', 'Vergangen', 'Tippfehler']);
  const info = inhalte.gruppen[1];
  assert.equal(info.art, 'gruppe');
  assert.equal(info.uhrzeit, '19:00');
  assert.deepEqual(info.termin, { wert: 20261015, wochentag: 'Do', text: '15.10.2026' });
  assert.equal(inhalte.gruppen[3].termin, null);
});

test('Windows-Zeilenenden ergeben dasselbe', () => {
  assert.deepEqual(parseInhalte(BEISPIEL.replace(/\n/g, '\r\n')), parseInhalte(BEISPIEL));
});

test('parseDatum', () => {
  assert.deepEqual(parseDatum('15.10.2026'), { wert: 20261015, wochentag: 'Do', text: '15.10.2026' });
  assert.deepEqual(parseDatum(' 5.1.2027 '), { wert: 20270105, wochentag: 'Di', text: '05.01.2027' });
  assert.equal(parseDatum('31.02.2026'), null);
  assert.equal(parseDatum('15.10.26'), null);
  assert.equal(parseDatum(''), null);
  assert.equal(parseDatum(undefined), null);
});

test('parseUhrzeit', () => {
  assert.equal(parseUhrzeit('19:00'), '19:00');
  assert.equal(parseUhrzeit('9.30'), '09:30');
  assert.equal(parseUhrzeit('19 Uhr'), '19:00');
  assert.equal(parseUhrzeit('abends'), 'abends');
  assert.equal(parseUhrzeit('25:00'), '25:00');
  assert.equal(parseUhrzeit(''), null);
  assert.equal(parseUhrzeit(undefined), null);
});

test('heuteWert nutzt das lokale Datum', () => {
  assert.equal(heuteWert(new Date(2026, 9, 15, 23, 59)), 20261015);
});

test('bereiteVor: nächster Termin, Vergangenes weg, Tippfehler ans Ende', () => {
  const ansicht = bereiteVor(parseInhalte(BEISPIEL), 20261001);
  assert.equal(ansicht.naechster.titel, 'Info-Abend');
  assert.deepEqual(titel(ansicht.gruppen), ['Webinar: Neustart mit 40', 'Tippfehler']);
  assert.deepEqual(titel(ansicht.einzel), ['Kennenlerngespräch', 'Einzelcoaching']);
});

test('bereiteVor: Termin von heute bleibt sichtbar', () => {
  const ansicht = bereiteVor(parseInhalte(BEISPIEL), 20261015);
  assert.equal(ansicht.naechster.titel, 'Info-Abend');
});

test('bereiteVor: gleicher Tag wird nach Uhrzeit sortiert', () => {
  const md = `## Gruppentermine
### Abends
Datum: 20.10.2026
Uhrzeit: 18:00
### Morgens
Datum: 20.10.2026
Uhrzeit: 9:00
`;
  const ansicht = bereiteVor(parseInhalte(md), 20261001);
  assert.equal(ansicht.naechster.titel, 'Morgens');
  assert.deepEqual(titel(ansicht.gruppen), ['Abends']);
});

test('bereiteVor: Termin mit Tippfehler wird nie nächster Termin', () => {
  const md = `## Gruppentermine
### Nur Tippfehler
Datum: 15.10.26
`;
  const ansicht = bereiteVor(parseInhalte(md), 20261001);
  assert.equal(ansicht.naechster, null);
  assert.deepEqual(titel(ansicht.gruppen), ['Nur Tippfehler']);
});

test('filterListe', () => {
  const ansicht = bereiteVor(parseInhalte(BEISPIEL), 20261001);
  assert.deepEqual(titel(filterListe(ansicht, 'alle')),
    ['Webinar: Neustart mit 40', 'Tippfehler', 'Kennenlerngespräch', 'Einzelcoaching']);
  assert.deepEqual(titel(filterListe(ansicht, 'einzel')), ['Kennenlerngespräch', 'Einzelcoaching']);
  assert.deepEqual(titel(filterListe(ansicht, 'gruppe')), ['Webinar: Neustart mit 40', 'Tippfehler']);
});

test('leerHinweis', () => {
  const einTermin = bereiteVor(parseInhalte(`## Gruppentermine
### Einziger
Datum: 20.10.2026
`), 20261001);
  assert.equal(leerHinweis(einTermin, 'gruppe'), 'weitere-folgen');
  assert.equal(leerHinweis(einTermin, 'einzel'), 'keine-termine');

  const nichts = bereiteVor(parseInhalte(''), 20261001);
  assert.equal(leerHinweis(nichts, 'gruppe'), 'keine-termine');
  assert.equal(leerHinweis(nichts, 'alle'), 'keine-termine');

  const voll = bereiteVor(parseInhalte(BEISPIEL), 20261001);
  assert.equal(leerHinweis(voll, 'alle'), null);
});

test('datumZeitText', () => {
  const inhalte = parseInhalte(BEISPIEL);
  assert.equal(datumZeitText(inhalte.gruppen[1]), 'Do, 15.10.2026, 19:00 Uhr');
  assert.equal(datumZeitText(inhalte.gruppen[3]), 'Datum folgt');
  const abends = parseInhalte(`## Gruppentermine
### X
Datum: 15.10.2026
Uhrzeit: abends
`).gruppen[0];
  assert.equal(datumZeitText(abends), 'Do, 15.10.2026, abends');
});

function mailTeile(link) {
  const url = new URL(link);
  return { an: url.pathname, betreff: url.searchParams.get('subject'), text: url.searchParams.get('body') };
}

test('mailLink für Gruppentermin', () => {
  const inhalte = parseInhalte(BEISPIEL);
  const link = mailLink(inhalte.gruppen[1], 'hallo@example.org', 'Mareike Kirch');
  assert.ok(link.startsWith('mailto:hallo@example.org?'));
  assert.deepEqual(mailTeile(link), {
    an: 'hallo@example.org',
    betreff: 'Anmeldung: Info-Abend – Do, 15.10.2026, 19:00 Uhr',
    text: 'Hallo Mareike,\n\nich möchte mich für diesen Termin anmelden.\n\nMein Name:\n',
  });
});

test('mailLink für Termin ohne lesbares Datum', () => {
  const inhalte = parseInhalte(BEISPIEL);
  const { betreff } = mailTeile(mailLink(inhalte.gruppen[3], 'hallo@example.org', 'Mareike Kirch'));
  assert.equal(betreff, 'Anmeldung: Tippfehler');
});

test('mailLink für Einzelangebot kodiert Sonderzeichen', () => {
  const eintrag = { art: 'einzel', titel: 'Coaching & Co? „Spezial"' };
  const link = mailLink(eintrag, 'hallo@example.org', 'Mareike Kirch');
  assert.ok(link.includes('%26'));
  assert.deepEqual(mailTeile(link), {
    an: 'hallo@example.org',
    betreff: 'Anfrage: Coaching & Co? „Spezial"',
    text: 'Hallo Mareike,\n\nich interessiere mich für „Coaching & Co? „Spezial"". Bitte schick mir Terminvorschläge.\n\nMein Name:\n',
  });
});

test('mailLink ohne E-Mail ergibt null, ohne Coach-Namen neutraler Gruß', () => {
  const eintrag = { art: 'einzel', titel: 'X' };
  assert.equal(mailLink(eintrag, '', 'Mareike Kirch'), null);
  assert.ok(mailTeile(mailLink(eintrag, 'a@b.de', '')).text.startsWith('Hallo,\n'));
});

test('teileName', () => {
  assert.deepEqual(teileName('Kurswechsel – Karrierecoaching'), { haupt: 'Kurswechsel', zusatz: 'Karrierecoaching' });
  assert.deepEqual(teileName('Kurswechsel'), { haupt: 'Kurswechsel', zusatz: '' });
  assert.deepEqual(teileName(undefined), { haupt: '', zusatz: '' });
});
```

- [ ] **Step 3: Tests laufen lassen, Fehlschlag prüfen**

Run: `cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && npm test`
Expected: FAIL, Fehlermeldung `Cannot find module '.../content.js'`.

- [ ] **Step 4: `content.js` schreiben**

```js
// Kurswechsel: reine Logik ohne Browser-Bezug.
// Liest Inhalte.md und bereitet Angebote und Termine für die Anzeige vor.
// Hier kein document/window, damit die Tests in Node laufen.

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Stichwort in Inhalte.md → Feldname im Programm
const STICHWOERTER = {
  'name': 'name',
  'spruch': 'spruch',
  'e-mail': 'email',
  'email': 'email',
  'text': 'text',
  'dauer': 'dauer',
  'preis': 'preis',
  'beschreibung': 'beschreibung',
  'datum': 'datum',
  'uhrzeit': 'uhrzeit',
  'ort': 'ort',
};

// Bereichsüberschrift (## ...) → Schlüssel im Ergebnis
const BEREICHE = {
  'allgemein': 'allgemein',
  'über mich': 'ueberMich',
  'ueber mich': 'ueberMich',
  'einzelcoaching': 'einzel',
  'gruppentermine': 'gruppen',
};

const zweistellig = (zahl) => String(zahl).padStart(2, '0');

export function parseDatum(text) {
  const treffer = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec((text || '').trim());
  if (!treffer) return null;
  const tag = Number(treffer[1]);
  const monat = Number(treffer[2]);
  const jahr = Number(treffer[3]);
  const datum = new Date(Date.UTC(jahr, monat - 1, tag));
  // Fängt Daten wie 31.02. ab, die JavaScript sonst in den März schieben würde.
  if (datum.getUTCMonth() !== monat - 1 || datum.getUTCDate() !== tag) return null;
  return {
    wert: jahr * 10000 + monat * 100 + tag,
    wochentag: WOCHENTAGE[datum.getUTCDay()],
    text: `${zweistellig(tag)}.${zweistellig(monat)}.${jahr}`,
  };
}

export function parseUhrzeit(text) {
  const roh = (text || '').trim();
  if (!roh) return null;
  const treffer = /^(\d{1,2})(?:[:.](\d{2}))?(?:\s*uhr)?$/i.exec(roh);
  if (treffer) {
    const stunde = Number(treffer[1]);
    const minute = Number(treffer[2] ?? '0');
    if (stunde < 24 && minute < 60) return `${zweistellig(stunde)}:${zweistellig(minute)}`;
  }
  return roh; // Unlesbares wird wörtlich gezeigt statt verschluckt.
}

export function parseInhalte(text) {
  const inhalte = { allgemein: {}, ueberMich: {}, einzel: [], gruppen: [] };
  const ohneKommentare = String(text ?? '').replace(/<!--[\s\S]*?-->/g, '');
  let bereich = null; // 'allgemein' | 'ueberMich' | 'einzel' | 'gruppen' | null
  let ziel = null; // Objekt, in das Stichwort-Zeilen geschrieben werden
  let letztesFeld = null; // für Folgezeilen ohne Stichwort

  for (const rohzeile of ohneKommentare.split(/\r?\n/)) {
    const zeile = rohzeile.trim();
    if (zeile === '') continue;

    const ueberschrift = /^(#{1,3})(?:\s+(.*))?$/.exec(zeile);
    if (ueberschrift) {
      const ebene = ueberschrift[1].length;
      const titel = (ueberschrift[2] || '').trim();
      letztesFeld = null;
      if (ebene === 1) {
        bereich = null;
        ziel = null;
      } else if (ebene === 2) {
        bereich = BEREICHE[titel.toLowerCase()] || null;
        ziel = bereich === 'allgemein' || bereich === 'ueberMich' ? inhalte[bereich] : null;
      } else if ((bereich === 'einzel' || bereich === 'gruppen') && titel) {
        ziel = { art: bereich === 'einzel' ? 'einzel' : 'gruppe', titel };
        inhalte[bereich].push(ziel);
      } else {
        ziel = null; // ### ohne Titel oder außerhalb einer Liste: Zeilen darunter ignorieren
      }
      continue;
    }

    if (!ziel) continue;
    const paar = /^([^:]+?)\s*:\s*(.*)$/.exec(zeile);
    const feld = paar ? STICHWOERTER[paar[1].trim().toLowerCase()] : undefined;
    if (feld) {
      ziel[feld] = paar[2].trim();
      letztesFeld = feld;
    } else if (letztesFeld) {
      ziel[letztesFeld] = ziel[letztesFeld] ? `${ziel[letztesFeld]}\n${zeile}` : zeile;
    }
  }

  for (const termin of inhalte.gruppen) {
    termin.termin = parseDatum(termin.datum);
    termin.uhrzeit = parseUhrzeit(termin.uhrzeit);
  }
  return inhalte;
}

export function heuteWert(datum = new Date()) {
  return datum.getFullYear() * 10000 + (datum.getMonth() + 1) * 100 + datum.getDate();
}

export function bereiteVor(inhalte, heute) {
  const kommend = inhalte.gruppen.filter((g) => !g.termin || g.termin.wert >= heute);
  const mitDatum = kommend
    .filter((g) => g.termin)
    .sort((a, b) => a.termin.wert - b.termin.wert || (a.uhrzeit || '').localeCompare(b.uhrzeit || ''));
  const ohneDatum = kommend.filter((g) => !g.termin);
  return {
    naechster: mitDatum[0] || null,
    gruppen: [...mitDatum.slice(1), ...ohneDatum],
    einzel: inhalte.einzel,
  };
}

export function filterListe(ansicht, filter) {
  if (filter === 'einzel') return ansicht.einzel;
  if (filter === 'gruppe') return ansicht.gruppen;
  return [...ansicht.gruppen, ...ansicht.einzel];
}

export function leerHinweis(ansicht, filter) {
  if (filterListe(ansicht, filter).length > 0) return null;
  if (filter !== 'einzel' && ansicht.naechster) return 'weitere-folgen';
  return 'keine-termine';
}

export function datumZeitText(eintrag) {
  if (!eintrag.termin) return 'Datum folgt';
  const teile = [eintrag.termin.wochentag, eintrag.termin.text];
  if (eintrag.uhrzeit) {
    teile.push(/^\d{2}:\d{2}$/.test(eintrag.uhrzeit) ? `${eintrag.uhrzeit} Uhr` : eintrag.uhrzeit);
  }
  return teile.join(', ');
}

export function mailLink(eintrag, email, coachName) {
  if (!email) return null;
  const vorname = (coachName || '').trim().split(/\s+/)[0];
  const gruss = vorname ? `Hallo ${vorname},` : 'Hallo,';
  let betreff;
  let text;
  if (eintrag.art === 'gruppe') {
    betreff = `Anmeldung: ${eintrag.titel}`;
    if (eintrag.termin) betreff += ` – ${datumZeitText(eintrag)}`;
    text = `${gruss}\n\nich möchte mich für diesen Termin anmelden.\n\nMein Name:\n`;
  } else {
    betreff = `Anfrage: ${eintrag.titel}`;
    text = `${gruss}\n\nich interessiere mich für „${eintrag.titel}". Bitte schick mir Terminvorschläge.\n\nMein Name:\n`;
  }
  return `mailto:${email}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
}

export function teileName(name) {
  const [haupt = '', ...rest] = (name || '').split(/\s+[–-]\s+/);
  return { haupt: haupt.trim(), zusatz: rest.join(' – ').trim() };
}
```

- [ ] **Step 5: Tests laufen lassen**

Run: `cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && npm test`
Expected: PASS, alle Tests grün (`# fail 0`).

---

### Task 2: Inhaltsdatei `Inhalte.md`

**Files:**
- Create: `Inhalte.md`
- Modify: `tests/content.test.js` (Tests am Dateiende anhängen)

**Interfaces:**
- Consumes: `parseInhalte`, `bereiteVor` aus Task 1
- Produces: `Inhalte.md` im Format aus Spec Abschnitt 5; wird von `app.js` (Task 3) per `fetch('Inhalte.md')` geladen.

- [ ] **Step 1: Tests für die echte Datei anhängen**

Am Ende von `tests/content.test.js` anfügen:
```js
import { readFile } from 'node:fs/promises';

const ECHT = await readFile(new URL('../Inhalte.md', import.meta.url), 'utf8');

test('Inhalte.md: vollständig und lesbar', () => {
  const inhalte = parseInhalte(ECHT);
  assert.equal(inhalte.allgemein.name, 'Kurswechsel – Karrierecoaching');
  assert.equal(inhalte.allgemein.email, 'hallo@kurswechsel-coaching.de');
  assert.equal(inhalte.ueberMich.name, 'Mareike Kirch');
  assert.ok(inhalte.ueberMich.text.length > 50);
  assert.deepEqual(inhalte.einzel.map((e) => e.preis), ['kostenlos', '120 €', '540 €']);
  assert.equal(inhalte.gruppen.length, 3);
  for (const g of inhalte.gruppen) {
    assert.ok(g.termin, `Datum von „${g.titel}" nicht lesbar`);
    assert.match(g.uhrzeit, /^\d{2}:\d{2}$/);
    assert.ok(g.beschreibung, `Beschreibung fehlt bei „${g.titel}"`);
  }
  for (const e of inhalte.einzel) assert.ok(e.beschreibung, `Beschreibung fehlt bei „${e.titel}"`);
});

test('Inhalte.md: Styleguide-Regeln', () => {
  const verboten = ['revolutionier', 'disruptiv', 'transformier', 'ermöglich', 'entdeck', 'freischalt',
    'bahnbrechend', 'bemerkenswert', 'vielleicht', 'eigentlich', 'grundsätzlich', 'empowerment',
    'game-changer', 'next level'];
  for (const wort of verboten) {
    assert.doesNotMatch(ECHT, new RegExp(`(^|[^\\p{L}])${wort}`, 'iu'), `verbotenes Wort: ${wort}`);
  }
  assert.doesNotMatch(ECHT, /\p{L}[*:]innen/u, 'Gendersternchen oder -doppelpunkt');
});

// (Umgesetzt mit allgemeinen Mustern statt echter Daten: private Mail, Handynummer,
// Postleitzahl mit Ort. Siehe tests/content.test.js, Konstante PRIVAT.)
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag prüfen**

Run: `npm test` (im Projektordner)
Expected: FAIL mit `ENOENT: no such file or directory ... Inhalte.md`.

- [ ] **Step 3: `Inhalte.md` schreiben**

```markdown
<!--
  SO ÄNDERST DU DIESE DATEI

  - Das hier ist normaler Text. Du brauchst keine Programmierkenntnisse.
  - Zeilen mit ## sind Bereiche. Ihre Namen bitte nicht ändern.
  - Zeilen mit ### sind ein Angebot oder ein Termin. Der Text dahinter ist der Titel.
  - Darunter stehen Zeilen nach dem Muster   Stichwort: Wert
    Stichwörter: Dauer, Preis, Beschreibung. Bei Terminen außerdem Datum, Uhrzeit, Ort.
  - Datum immer so schreiben: 15.10.2026   Uhrzeit so: 19:00
    Den Wochentag rechnet die App selbst aus.
  - Neuer Termin: einen Termin komplett kopieren (von ### bis vor den nächsten ###),
    darunter einfügen, Titel und Datum ändern.
  - Vergangene Termine verschwinden von allein. Du musst sie nicht löschen.
  - Längere Texte dürfen über mehrere Zeilen gehen. Jede Zeile wird ein Absatz.
  - Danach speichern und Claude sagen: „Save to GitHub". Kurz danach ist es live.
-->

# Inhalte der Kurswechsel-App

## Allgemein
Name: Kurswechsel – Karrierecoaching
Spruch: Neue Richtung. Klarer Plan.
E-Mail: hallo@kurswechsel-coaching.de

## Über mich
Name: Mareike Kirch
Text: Ich bin Ingenieurin, Gründerin und zertifizierte Laufbahn- und Karriere-Coach.
Meinen eigenen Kurs habe ich mehrmals gewechselt. Aus der Stahlindustrie in den Vertrieb. Aus dem Vertrieb in die eigene Firma.
In meinem Bildungsunternehmen habe ich 255 Menschen auf dem Weg in einen neuen Beruf begleitet.
Ich arbeite strukturiert und direkt. Du bekommst keine Motivationssprüche. Du bekommst einen Plan.

## Einzelcoaching

### Kennenlerngespräch
Dauer: 20 Min.
Preis: kostenlos
Beschreibung: Wir sprechen über deine Situation. Danach weißt du, ob ein Coaching dir weiterhilft.

### Einzelcoaching
Dauer: 60 Min.
Preis: 120 €
Beschreibung: Wir klären, wo du stehst und wohin du willst. Du gehst mit konkreten nächsten Schritten raus.

### Paket „Neuer Kurs" (5 Sitzungen)
Dauer: 5 × 60 Min.
Preis: 540 €
Beschreibung: Fünf Sitzungen über acht bis zehn Wochen. Von der Standortbestimmung bis zur ersten Bewerbung.

## Gruppentermine

### Info-Abend: Wie klappt ein Quereinstieg?
Datum: 15.10.2026
Uhrzeit: 19:00
Dauer: 60 Min.
Preis: kostenlos
Ort: online
Beschreibung: Welche Wege gibt es? Wo liegen die Fallstricke? Du bekommst einen Überblick und stellst deine Fragen.

### Webinar: Neustart mit 40
Datum: 27.10.2026
Uhrzeit: 18:30
Dauer: 90 Min.
Preis: 29 €
Ort: online
Beschreibung: Mit 40 fängst du nicht bei null an. Wir sortieren, was du mitbringst und wo es gebraucht wird.

### Info-Abend: Wie klappt ein Quereinstieg?
Datum: 12.11.2026
Uhrzeit: 19:00
Dauer: 60 Min.
Preis: kostenlos
Ort: online
Beschreibung: Welche Wege gibt es? Wo liegen die Fallstricke? Du bekommst einen Überblick und stellst deine Fragen.
```

- [ ] **Step 4: Tests laufen lassen**

Run: `npm test`
Expected: PASS, `# fail 0`.

---

### Task 3: Die Seite (`index.html`, `style.css`, `app.js`) und lokaler Server

**Files:**
- Create: `tools/server.mjs`, `index.html`, `style.css`, `app.js`
- Create: `/Users/mareikekirch/Desktop/Claude-Workshop /.claude/launch.json`

**Interfaces:**
- Consumes: alle Exporte aus `content.js` (Task 1), `Inhalte.md` (Task 2)
- Produces: DOM-IDs `titel`, `zusatz`, `spruch`, `fehler`, `naechster-bereich`, `naechster`, `liste`, `ueber`, `ueber-name`, `ueber-text`, `fuss-name`, `fuss-mail`; Filter-Knöpfe mit `data-filter`. `app.js` registriert `sw.js` (die Datei entsteht in Task 4; bis dahin schlägt nur die Registrierung still fehl).

- [ ] **Step 1: Lokalen Testserver schreiben**

`tools/server.mjs`:
```js
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
```

`/Users/mareikekirch/Desktop/Claude-Workshop /.claude/launch.json` (Datei neu anlegen; falls sie schon existiert, nur den Eintrag zu `configurations` hinzufügen):
```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "kurswechsel",
      "runtimeExecutable": "node",
      "runtimeArgs": ["Tag-4-Kit/Eigene-Website/tools/server.mjs"],
      "port": 8080
    }
  ]
}
```

- [ ] **Step 2: `index.html` schreiben**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Kurswechsel – Karrierecoaching</title>
  <meta name="description" content="Online-Karrierecoaching für deine berufliche Neuorientierung. Termine, Preise, Anmeldung.">
  <meta name="theme-color" content="#1A1A2E">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Kurswechsel">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=Inter:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="style.css">
  <script type="module" src="app.js"></script>
</head>
<body>
  <header class="kopf">
    <div class="wrap">
      <p class="kopf-zusatz" id="zusatz"></p>
      <h1 id="titel">Kurswechsel</h1>
      <p class="kopf-spruch" id="spruch"></p>
    </div>
  </header>

  <main class="wrap inhalt">
    <p class="fehler" id="fehler" hidden>Die Inhalte laden gerade nicht. Versuch es gleich noch einmal.</p>

    <section class="naechster" id="naechster-bereich" aria-labelledby="naechster-label" hidden>
      <p class="label" id="naechster-label">Nächster Termin</p>
      <div id="naechster"></div>
    </section>

    <section aria-label="Angebote und Termine">
      <div class="filter" role="group" aria-label="Angebote filtern">
        <button type="button" data-filter="alle" aria-pressed="true">Alle</button>
        <button type="button" data-filter="einzel" aria-pressed="false">Einzelcoaching</button>
        <button type="button" data-filter="gruppe" aria-pressed="false">Gruppentermine</button>
      </div>
      <div class="liste" id="liste" aria-live="polite"></div>
    </section>

    <section class="ueber" id="ueber" hidden>
      <h2 class="abschnitt-titel">Über mich</h2>
      <h3 id="ueber-name"></h3>
      <div id="ueber-text"></div>
    </section>
  </main>

  <footer class="fuss">
    <div class="wrap">
      <p class="fuss-name" id="fuss-name">Kurswechsel</p>
      <a class="fuss-mail" id="fuss-mail" hidden></a>
      <p class="fuss-hinweis">Beispielseite aus einem Workshop. Preise und Termine sind Beispiele.</p>
    </div>
  </footer>
</body>
</html>
```

- [ ] **Step 3: `style.css` schreiben**

Kontrast-Hinweis: Weiße Schrift auf Signal Purple erreicht nur ca. 3,9 : 1 (zu wenig für kleine Schrift). Deshalb: normale Knöpfe in Deep Violet mit weißer Schrift, die große „Nächster Termin"-Karte in Signal Purple mit Midnight-Ink-Schrift und weißem Knopf.

```css
/* Kurswechsel: Aussehen nach Mareike_StyleGuide v1.0 (Mai 2026) */
:root {
  --midnight-ink: #1A1A2E;
  --warm-white: #F5F3EF;
  --signal-purple: #7F77DD;
  --lavender-mist: #EEEDFE;
  --soft-iris: #AFA9EC;
  --deep-violet: #3C3489;
  --ink-mid: #5C5A7A;
  --rule: #D5D3F0;

  --display: 'Syne', Arial, sans-serif;
  --body: 'Inter', Arial, sans-serif;

  --max-w: 720px;
  --gutter: 20px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
[hidden] { display: none !important; }

body {
  background: var(--warm-white);
  color: var(--midnight-ink);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 { font-family: var(--display); font-style: normal; }

.wrap { max-width: var(--max-w); margin: 0 auto; padding: 0 var(--gutter); }

.label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-mid);
}

/* ─── Kopfbereich ─── */
.kopf {
  background: var(--midnight-ink);
  color: var(--warm-white);
  padding: max(40px, env(safe-area-inset-top)) 0 36px;
}
.kopf-zusatz {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--soft-iris);
  margin-bottom: 8px;
}
.kopf h1 { font-weight: 700; font-size: 32px; line-height: 1.05; letter-spacing: -0.01em; }
.kopf-spruch {
  font-family: var(--display);
  font-weight: 600;
  font-size: 18px;
  line-height: 1.3;
  color: var(--signal-purple);
  margin-top: 10px;
}

.inhalt { padding-top: 28px; padding-bottom: 48px; }

.fehler {
  background: #fff;
  border-left: 3px solid var(--signal-purple);
  padding: 12px 16px;
  margin-bottom: 24px;
}

/* ─── Karten ─── */
.naechster { margin-bottom: 32px; }
.naechster .label { margin-bottom: 8px; }

.karte {
  background: var(--lavender-mist);
  border-top: 2px solid var(--signal-purple);
  padding: 20px;
}
.karte + .karte { margin-top: 16px; }
.karte h3 { font-weight: 500; font-size: 18px; line-height: 1.3; margin: 6px 0 8px; }
.karte-text { color: var(--ink-mid); }
.karte-text p + p { margin-top: 0.5em; }
.karte-fuss {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}
.preis { font-weight: 600; }

.knopf {
  display: inline-block;
  min-height: 44px;
  padding: 10px 20px;
  border-radius: 6px;
  background: var(--deep-violet);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  line-height: 24px;
  text-decoration: none;
}
.knopf:hover { background: var(--midnight-ink); }

.karte--gross {
  background: var(--signal-purple);
  border-top: none;
  border-radius: 8px;
  color: var(--midnight-ink);
}
.karte--gross .label,
.karte--gross .karte-text { color: var(--midnight-ink); }
.karte--gross h3 { font-weight: 600; font-size: 22px; }
.karte--gross .knopf { background: #fff; color: var(--deep-violet); }
.karte--gross .knopf:hover { background: var(--warm-white); }

/* ─── Filter ─── */
.filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.filter button {
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--rule);
  border-radius: 999px;
  background: #fff;
  color: var(--midnight-ink);
  font: 500 14px/1.2 var(--body);
  cursor: pointer;
}
.filter button[aria-pressed="true"] {
  background: var(--midnight-ink);
  border-color: var(--midnight-ink);
  color: var(--warm-white);
}
.filter button:focus-visible,
.knopf:focus-visible,
.fuss-mail:focus-visible { outline: 3px solid var(--signal-purple); outline-offset: 2px; }

.leer { color: var(--ink-mid); padding: 8px 0; }
.leer a { color: var(--deep-violet); }

/* ─── Über mich ─── */
.ueber { margin-top: 48px; padding-top: 32px; border-top: 1px solid var(--rule); }
.abschnitt-titel {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 22px;
  line-height: 1.2;
  margin-bottom: 16px;
}
.abschnitt-titel::before {
  content: '';
  width: 32px;
  height: 2px;
  background: var(--signal-purple);
  flex-shrink: 0;
}
.ueber h3 { font-weight: 500; font-size: 18px; line-height: 1.3; margin-bottom: 8px; }
#ueber-text { color: var(--ink-mid); }
#ueber-text p + p { margin-top: 0.8em; }

/* ─── Fußbereich ─── */
.fuss {
  background: var(--midnight-ink);
  color: var(--warm-white);
  padding: 40px 0 max(40px, env(safe-area-inset-bottom));
}
.fuss-name { font-family: var(--display); font-weight: 600; font-size: 20px; line-height: 1.2; margin-bottom: 6px; }
.fuss-mail { color: var(--warm-white); }
.fuss-hinweis { font-size: 13px; line-height: 1.6; color: var(--soft-iris); margin-top: 16px; }

/* ─── Größere Bildschirme ─── */
@media (min-width: 680px) {
  :root { --gutter: 40px; }
  .kopf h1 { font-size: 40px; }
  .abschnitt-titel { font-size: 26px; }
}
```

- [ ] **Step 4: `app.js` schreiben**

```js
// Kurswechsel: Browser-Teil. Lädt Inhalte.md, baut die Seite, steuert den Filter.
// Alle Inhalte kommen per textContent ins HTML, nie als Code.
import {
  parseInhalte, heuteWert, bereiteVor, filterListe, leerHinweis,
  datumZeitText, mailLink, teileName,
} from './content.js';

const $ = (auswahl) => document.querySelector(auswahl);

function el(tag, klasse, text) {
  const element = document.createElement(tag);
  if (klasse) element.className = klasse;
  if (text != null) element.textContent = text;
  return element;
}

function absaetze(text, klasse) {
  const box = el('div', klasse);
  for (const zeile of text.split('\n')) box.append(el('p', null, zeile));
  return box;
}

function karte(eintrag, inhalte, gross = false) {
  const artikel = el('article', gross ? 'karte karte--gross' : 'karte');
  const labelTeile = eintrag.art === 'gruppe'
    ? ['Gruppentermin', datumZeitText(eintrag), eintrag.dauer, eintrag.ort]
    : ['Einzelcoaching', eintrag.dauer];
  artikel.append(el('p', 'label', labelTeile.filter(Boolean).join(' · ')));
  artikel.append(el('h3', null, eintrag.titel));
  if (eintrag.beschreibung) artikel.append(absaetze(eintrag.beschreibung, 'karte-text'));

  const fuss = el('div', 'karte-fuss');
  fuss.append(el('span', 'preis', eintrag.preis || ''));
  const link = mailLink(eintrag, inhalte.allgemein.email, inhalte.ueberMich.name);
  if (link) {
    const knopf = el('a', 'knopf', eintrag.art === 'gruppe' ? 'Anmelden' : 'Anfragen');
    knopf.href = link;
    fuss.append(knopf);
  }
  artikel.append(fuss);
  return artikel;
}

function zeigeListe(ansicht, inhalte, filter) {
  const liste = $('#liste');
  liste.replaceChildren(...filterListe(ansicht, filter).map((e) => karte(e, inhalte)));
  const hinweis = leerHinweis(ansicht, filter);
  if (hinweis === 'weitere-folgen') liste.append(el('p', 'leer', 'Weitere Termine folgen.'));
  if (hinweis === 'keine-termine') {
    const absatz = el('p', 'leer', 'Gerade keine Termine. ');
    if (inhalte.allgemein.email) {
      const link = el('a', null, 'Schreib mir, dann melde ich mich.');
      link.href = `mailto:${inhalte.allgemein.email}`;
      absatz.append(link);
    } else {
      absatz.append('Schreib mir, dann melde ich mich.');
    }
    liste.append(absatz);
  }
}

function zeige(inhalte) {
  const { allgemein, ueberMich } = inhalte;
  const { haupt, zusatz } = teileName(allgemein.name);
  if (haupt) $('#titel').textContent = haupt;
  if (allgemein.name) document.title = allgemein.name;
  $('#zusatz').textContent = zusatz;
  $('#spruch').textContent = allgemein.spruch || '';

  const ansicht = bereiteVor(inhalte, heuteWert());

  $('#naechster').replaceChildren(...(ansicht.naechster ? [karte(ansicht.naechster, inhalte, true)] : []));
  $('#naechster-bereich').hidden = !ansicht.naechster;

  const knoepfe = document.querySelectorAll('[data-filter]');
  for (const knopf of knoepfe) {
    knopf.addEventListener('click', () => {
      for (const k of knoepfe) k.setAttribute('aria-pressed', String(k === knopf));
      zeigeListe(ansicht, inhalte, knopf.dataset.filter);
    });
  }
  zeigeListe(ansicht, inhalte, 'alle');

  if (ueberMich.name || ueberMich.text) {
    $('#ueber-name').textContent = ueberMich.name || '';
    $('#ueber-text').replaceChildren(...(ueberMich.text ? [absaetze(ueberMich.text)] : []));
    $('#ueber').hidden = false;
  }

  $('#fuss-name').textContent = allgemein.name || 'Kurswechsel';
  if (allgemein.email) {
    const mail = $('#fuss-mail');
    mail.href = `mailto:${allgemein.email}`;
    mail.textContent = allgemein.email;
    mail.hidden = false;
  }
}

async function start() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch((fehler) => {
      console.warn('Service Worker nicht registriert:', fehler);
    });
  }
  try {
    const antwort = await fetch('Inhalte.md', { cache: 'no-store' });
    if (!antwort.ok) throw new Error(`Inhalte.md: HTTP ${antwort.status}`);
    zeige(parseInhalte(await antwort.text()));
  } catch (fehler) {
    console.error(fehler);
    $('#fehler').hidden = false;
  }
}

start();
```

- [ ] **Step 5: Im Browser prüfen**

1. Vorschau starten: `preview_start` mit `name: "kurswechsel"` (öffnet `http://localhost:8080`).
2. Fenster auf Handygröße: `resize_window` mit `preset: "mobile"`, dann neu laden.
3. `read_page` / Screenshot. Expected:
   - Kopf dunkel mit „KARRIERECOACHING", „Kurswechsel", Spruch in Lila.
   - „Nächster Termin": Info-Abend, „Gruppentermin · Do, 15.10.2026, 19:00 Uhr · 60 Min. · online".
   - Liste bei „Alle": Webinar (Di, 27.10.2026), Info-Abend (Do, 12.11.2026), dann Kennenlerngespräch, Einzelcoaching, Paket. Der 15.10. steht **nicht** noch einmal in der Liste.
   - „Über mich" mit Mareike Kirch und vier Absätzen. Fußzeile mit Hinweis.
4. Auf „Einzelcoaching" tippen → nur 3 Einzelangebote. „Gruppentermine" → nur 2 Termine. „Alle" → wieder 5.
5. `javascript_tool`: `[...document.querySelectorAll('.knopf')].map(a => decodeURIComponent(a.href))[0]` → Expected: beginnt mit `mailto:hallo@kurswechsel-coaching.de?subject=Anmeldung: Info-Abend: Wie klappt ein Quereinstieg? – Do, 15.10.2026, 19:00 Uhr`. (Nicht klicken, sonst öffnet sich die Mail-App.)
6. `read_console_messages` mit `onlyErrors: true` → Expected: höchstens die Warnung zur fehlenden `sw.js` (entsteht in Task 4), sonst keine Fehler.
7. Fehlerfall: `Inhalte.md` vorübergehend in `Inhalte.md.bak` umbenennen, neu laden → Expected: Hinweis „Die Inhalte laden gerade nicht. …". Danach Datei zurückbenennen und neu laden.
8. `resize_window` mit `preset: "desktop"` zurücksetzen.

---

### Task 4: PWA (Icons, Manifest, Service Worker, Netlify)

**Files:**
- Create: `icons/icon.svg`, `tools/make_icons.py`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png`, `icons/apple-touch-icon.png` (die PNGs erzeugt das Skript), `manifest.webmanifest`, `sw.js`, `netlify.toml`

**Interfaces:**
- Consumes: `index.html` verweist bereits auf `manifest.webmanifest`, `icons/icon.svg`, `icons/apple-touch-icon.png`; `app.js` registriert `sw.js` (Task 3).
- Produces: installierbare PWA, Cache-Name `kurswechsel-v1`.

- [ ] **Step 1: Icon-Vorlage und Icon-Skript**

`icons/icon.svg` (Variante B aus dem Brainstorming):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#1A1A2E"/>
  <path d="M24 70 L24 52 Q24 36 40 36 L66 36" fill="none" stroke="#7F77DD" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M58 26 L70 36 L58 46" fill="none" stroke="#7F77DD" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

`tools/make_icons.py`:
```python
"""Erzeugt die App-Icons (Richtungspfeil, Variante B) als PNG.

Aufruf im Projektordner:  python3 tools/make_icons.py
Zeichnet dieselbe Form wie icons/icon.svg, damit keine Zusatzsoftware nötig ist.
"""
from pathlib import Path

from PIL import Image, ImageDraw

HINTERGRUND = "#1A1A2E"  # Midnight Ink
PFEIL = "#7F77DD"  # Signal Purple
ORDNER = Path(__file__).resolve().parent.parent / "icons"
UEBERABTASTUNG = 4  # erst größer zeichnen, dann verkleinern: glatte Kanten


def bezier(p0, p1, p2, schritte=24):
    punkte = []
    for i in range(schritte + 1):
        t = i / schritte
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        punkte.append((x, y))
    return punkte


# Koordinaten im 100er-Raster wie in icon.svg
SCHAFT = [(24, 70), (24, 52)] + bezier((24, 52), (24, 36), (40, 36))[1:] + [(66, 36)]
SPITZE = [(58, 26), (70, 36), (58, 46)]


def zeichne(groesse, rand=0.0):
    """rand: Anteil, um den der Pfeil nach innen rückt (für maskable Icons)."""
    g = groesse * UEBERABTASTUNG
    bild = Image.new("RGB", (g, g), HINTERGRUND)
    stift = ImageDraw.Draw(bild)
    skala = g * (1 - 2 * rand) / 100
    versatz = g * rand
    breite = round(9 * skala)
    radius = breite / 2
    for linie in (SCHAFT, SPITZE):
        punkte = [(versatz + x * skala, versatz + y * skala) for x, y in linie]
        stift.line(punkte, fill=PFEIL, width=breite, joint="curve")
        for x, y in punkte:  # runde Enden und Ecken
            stift.ellipse((x - radius, y - radius, x + radius, y + radius), fill=PFEIL)
    return bild.resize((groesse, groesse), Image.LANCZOS)


def main():
    ORDNER.mkdir(exist_ok=True)
    ziele = {
        "icon-192.png": (192, 0.0),
        "icon-512.png": (512, 0.0),
        "icon-maskable-512.png": (512, 0.12),
        "apple-touch-icon.png": (180, 0.0),
    }
    for name, (groesse, rand) in ziele.items():
        zeichne(groesse, rand).save(ORDNER / name, optimize=True)
        print(f"erstellt: icons/{name} ({groesse}×{groesse})")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Icons erzeugen und ansehen**

Run: `cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && python3 tools/make_icons.py`
Expected: vier Zeilen `erstellt: icons/...`.
Dann `icons/icon-512.png` und `icons/icon-maskable-512.png` mit dem Read-Tool ansehen. Expected: lila abbiegender Pfeil auf Midnight Ink, wie Variante B; maskable-Version mit mehr Rand.

- [ ] **Step 3: `manifest.webmanifest`**

```json
{
  "name": "Kurswechsel – Karrierecoaching",
  "short_name": "Kurswechsel",
  "description": "Online-Karrierecoaching für deine berufliche Neuorientierung.",
  "lang": "de",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#F5F3EF",
  "theme_color": "#1A1A2E",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 4: `sw.js`**

```js
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
```

- [ ] **Step 5: `netlify.toml`**

```toml
# Netlify veröffentlicht diesen Ordner direkt, ohne Build-Schritt.
[build]
  publish = "."

# Browser sollen bei jedem Laden nachfragen, ob es etwas Neues gibt.
# Eine Regel für alles, damit sich keine Regeln überschneiden.
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

- [ ] **Step 6: PWA im Browser prüfen**

1. Vorschau (`kurswechsel`) neu laden, zweimal (beim zweiten Mal steuert der Service Worker die Seite).
2. `javascript_tool`: `navigator.serviceWorker.controller?.scriptURL` → Expected: endet auf `/sw.js`.
3. `javascript_tool`: `await caches.keys()` → Expected: `["kurswechsel-v1"]`.
4. `javascript_tool`: `(await (await fetch('manifest.webmanifest')).json()).short_name` → Expected: `"Kurswechsel"`.
5. **Update-Test:** In `Inhalte.md` die Zeile `Spruch: Neue Richtung. Klarer Plan.` ändern in `Spruch: Update-Test.`, Seite **einmal** neu laden → Expected: Kopf zeigt „Update-Test.". Danach Zeile zurücksetzen, neu laden → Expected: wieder „Neue Richtung. Klarer Plan.".
6. **Offline-Test:** Server stoppen (`preview_stop`), Seite neu laden → Expected: App erscheint vollständig mit Terminen (aus der Kopie). Danach `preview_start` mit `name: "kurswechsel"` wieder starten.
7. `read_console_messages` mit `onlyErrors: true` → Expected: keine Fehler (außer Netzwerkfehlern aus dem Offline-Test).

---

### Task 5: Abschluss (Styleguide-Kopie, Gesamtprüfung, CLAUDE.md)

**Files:**
- Create: `docs/Styleguide/Mareike_StyleGuide_v1.docx` (Kopie)
- Modify: `/Users/mareikekirch/Desktop/Claude-Workshop /CLAUDE.md` (Abschnitt „Werkzeuge und Befehle")

**Interfaces:**
- Consumes: alle vorherigen Dateien
- Produces: fertige App, dokumentierte Befehle

- [ ] **Step 1: Styleguide kopieren (Original bleibt unverändert)**

Run:
```bash
mkdir -p "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website/docs/Styleguide"
cp -n "/Users/mareikekirch/Desktop/claude code/Mareike /Mareike_StyleGuide_v1.docx" "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website/docs/Styleguide/"
```
Expected: Datei liegt in `docs/Styleguide/`. (`-n` überschreibt nichts.)

- [ ] **Step 2: Suche nach privaten Daten und verbotenen Wörtern in allen Projektdateien**

Run:
```bash
cd "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website" && grep -rnIP -i "googlemail|gmail|(\+49|\b0)\s?1[5-7]\d[\s/-]?\d{2,}|\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+" --exclude-dir=.superpowers --exclude-dir=docs . ; echo "private: exit $?"
grep -rn -i -E "(^|[^[:alpha:]])(revolutionier|disruptiv|transformier|ermöglich|entdeck|freischalt|bahnbrechend|bemerkenswert|vielleicht|eigentlich|grundsätzlich|empowerment|game-changer|next level)" index.html app.js Inhalte.md manifest.webmanifest ; echo "verboten: exit $?"
```
Expected: beide Male keine Treffer, `exit 1`.

- [ ] **Step 3: Alle Tests**

Run: `npm test`
Expected: PASS, `# fail 0`.

- [ ] **Step 4: Befehle in CLAUDE.md der Workshop-Wurzel ergänzen**

In `/Users/mareikekirch/Desktop/Claude-Workshop /CLAUDE.md` den Satz
`Es gibt noch keinen Build, keine Tests und kein \`package.json\` — das entsteht erst beim Bauen.
Sobald es so weit ist, hier die tatsächlichen Befehle ergänzen.`
ersetzen durch:
```markdown
**Eigene-Website (Kurswechsel-App)**, alle Befehle im Ordner `Tag-4-Kit/Eigene-Website/`:
- Tests: `npm test` (Node-eingebauter Testläufer, keine Pakete nötig)
- Lokal ansehen: `npm start` → http://localhost:8080 (oder Vorschau „kurswechsel")
- Icons neu erzeugen: `python3 tools/make_icons.py`
- Kein Build-Schritt; Netlify veröffentlicht den Ordner direkt (`netlify.toml`).
- Inhalte ändern nur in `Inhalte.md`. Logik in `content.js` (getestet), Anzeige in `app.js`.
```

- [ ] **Step 5: Abschluss-Review**

Den Agenten `code-reviewer` auf alle neuen Dateien in `Tag-4-Kit/Eigene-Website/` ansetzen (ohne `.superpowers/` und `docs/`), mit Spec und diesem Plan als Kontext. Gefundene echte Fehler beheben, danach `npm test` und Browser-Check (Task 3 Step 5, Punkte 3–5) wiederholen.

- [ ] **Step 6: Vorschau-Server des Brainstormings stoppen**

Run: `bash /Users/mareikekirch/.claude/plugins/cache/superpowers-marketplace/superpowers/6.4.1/skills/brainstorming/scripts/stop-server.sh "/Users/mareikekirch/Desktop/Claude-Workshop /Tag-4-Kit/Eigene-Website/.superpowers/brainstorm/60757-1790242410"`
Expected: Server beendet; Entwürfe bleiben in `.superpowers/` (von Git ignoriert).
