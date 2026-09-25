// Kurswechsel: Browser-Teil. Lädt Inhalte.md, baut die Seite, steuert den Filter.
// Alle Inhalte kommen per textContent ins HTML, nie als Code.
import {
  parseInhalte, heuteWert, bereiteVor, filterListe, leerHinweis,
  datumZeitText, mailLink, teileName, kannAnmelden,
} from './content.js';
import { meldeAn } from './anmeldung.js';

const $ = (auswahl) => document.querySelector(auswahl);

// Aktueller Stand, damit Filterklicks und Neuladen zusammenpassen.
let aktuell = null; // { inhalte, ansicht }
let filter = 'alle';
let offeneAnmeldung = null; // { eintrag, inhalte } des Termins im Dialog
let sendetGerade = false; // verhindert doppeltes Senden bei Doppeltipp

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
  // Ohne <dialog> (iPhone vor iOS 15.4) bleibt der E-Mail-Knopf, sonst passiert beim Tippen nichts.
  if (kannAnmelden(eintrag) && typeof HTMLDialogElement === 'function') {
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

  // "heute" bei jedem Anzeigen neu berechnen, damit vergangene Termine verschwinden.
  const ansicht = bereiteVor(inhalte, heuteWert());
  aktuell = { inhalte, ansicht };

  $('#naechster').replaceChildren(...(ansicht.naechster ? [karte(ansicht.naechster, inhalte, true)] : []));
  $('#naechster-bereich').hidden = !ansicht.naechster;

  zeigeListe(ansicht, inhalte, filter);

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

function verbindeFilter() {
  const knoepfe = document.querySelectorAll('[data-filter]');
  for (const knopf of knoepfe) {
    knopf.addEventListener('click', () => {
      filter = knopf.dataset.filter;
      for (const k of knoepfe) k.setAttribute('aria-pressed', String(k === knopf));
      if (aktuell) zeigeListe(aktuell.ansicht, aktuell.inhalte, filter);
    });
  }
}

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
  $('#anmeldung-abbrechen').disabled = an;
}

function oeffneAnmeldung(eintrag, inhalte) {
  // Läuft noch eine Anmeldung, zeigt der Dialog weiter diese an statt eines neuen Termins.
  // Sonst würde die Antwort später im falschen Termin landen.
  if (sendetGerade) {
    $('#anmeldung').showModal();
    return;
  }
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
  // Escape während des Sendens nicht zulassen.
  $('#anmeldung').addEventListener('cancel', (ereignis) => {
    if (sendetGerade) ereignis.preventDefault();
  });
  for (const knopf of document.querySelectorAll('[data-schliessen]')) {
    knopf.addEventListener('click', () => $('#anmeldung').close());
  }
}

async function laden() {
  try {
    const antwort = await fetch('Inhalte.md', { cache: 'no-store' });
    if (!antwort.ok) throw new Error(`Inhalte.md: HTTP ${antwort.status}`);
    zeige(parseInhalte(await antwort.text()));
    $('#fehler').hidden = true;
  } catch (fehler) {
    console.error(fehler);
    // Wenn schon Inhalte zu sehen sind, bleiben sie stehen statt einer Fehlermeldung.
    if (!aktuell) $('#fehler').hidden = false;
  }
}

async function start() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch((fehler) => {
      console.warn('Service Worker nicht registriert:', fehler);
    });
  }
  verbindeFilter();
  verbindeAnmeldung();
  await laden();
  // Handys holen eine installierte App oft nur aus dem Hintergrund zurück, ohne neu zu laden.
  // Deshalb beim Wiedererscheinen die Inhalte frisch holen.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') laden();
  });
}

start();
