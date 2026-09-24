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

test('### ohne Leerzeichen startet trotzdem einen neuen Termin', () => {
  const md = `## Gruppentermine
### A
Datum: 20.10.2026
Beschreibung: Erster.
###B
Datum: 25.12.2026
`;
  const inhalte = parseInhalte(md);
  assert.deepEqual(titel(inhalte.gruppen), ['A', 'B']);
  assert.equal(inhalte.gruppen[0].termin.text, '20.10.2026');
  assert.equal(inhalte.gruppen[0].beschreibung, 'Erster.');
});

test('#### wird nicht als Überschrift gelesen', () => {
  const md = `## Einzelcoaching
### A
Beschreibung: Text.
#### kein Titel
`;
  assert.deepEqual(titel(parseInhalte(md).einzel), ['A']);
});

test('Bereichsnamen: Doppelpunkt am Ende und andere Ü-Kodierung sind egal', () => {
  const md = `## Gruppentermine:
### A
Datum: 20.10.2026
## ${'Über mich'.normalize('NFD')}
Name: Mareike Kirch
`;
  const inhalte = parseInhalte(md);
  assert.deepEqual(titel(inhalte.gruppen), ['A']);
  assert.equal(inhalte.ueberMich.name, 'Mareike Kirch');
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

import { readFile } from 'node:fs/promises';

const ECHT = await readFile(new URL('../Inhalte.md', import.meta.url), 'utf8');

test('Inhalte.md: vollständig und lesbar', () => {
  const inhalte = parseInhalte(ECHT);
  assert.equal(inhalte.allgemein.name, 'Kurswechsel – Karrierecoaching');
  assert.equal(inhalte.allgemein.email, 'hallo@kurswechsel-coaching.de');
  assert.equal(inhalte.ueberMich.name, 'Mareike Kirch');
  assert.ok(inhalte.ueberMich.text.length > 50);
  // Anzahl und Beträge bewusst nicht festgeschrieben: Mareike ändert sie selbst.
  assert.ok(inhalte.einzel.length >= 1, 'kein Einzelangebot gefunden');
  assert.ok(inhalte.gruppen.length >= 1, 'kein Gruppentermin gefunden');
  for (const e of inhalte.einzel) assert.ok(e.preis, `Preis fehlt bei „${e.titel}"`);
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

// Allgemeine Muster statt echter Daten, damit diese Datei selbst nichts Privates verrät.
const PRIVAT = {
  'private Mail-Adresse': /googlemail|gmail/i,
  'Handynummer': /(\+49|\b0)\s?1[5-7]\d[\s/-]?\d{2,}/,
  'Postleitzahl mit Ort': /\b\d{5}\s+\p{Lu}\p{Ll}+/u,
};

test('Muster für private Daten erkennen Beispiele', () => {
  assert.match('x@googlemail.com', PRIVAT['private Mail-Adresse']);
  assert.match('+49 151 23 45 678', PRIVAT['Handynummer']);
  assert.match('0171 2345678', PRIVAT['Handynummer']);
  assert.match('Musterweg 1 · 12345 Musterstadt', PRIVAT['Postleitzahl mit Ort']);
  assert.doesNotMatch('Preis: 540 €', PRIVAT['Handynummer']);
});

test('Inhalte.md: keine privaten Daten', () => {
  for (const [art, muster] of Object.entries(PRIVAT)) {
    assert.doesNotMatch(ECHT, muster, `private Angabe gefunden: ${art}`);
  }
});
