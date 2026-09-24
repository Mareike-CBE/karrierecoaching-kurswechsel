// Kurswechsel: Browser-Teil. Lädt Inhalte.md, baut die Seite, steuert den Filter.
// Alle Inhalte kommen per textContent ins HTML, nie als Code.
import {
  parseInhalte, heuteWert, bereiteVor, filterListe, leerHinweis,
  datumZeitText, mailLink, teileName,
} from './content.js';

const $ = (auswahl) => document.querySelector(auswahl);

// Aktueller Stand, damit Filterklicks und Neuladen zusammenpassen.
let aktuell = null; // { inhalte, ansicht }
let filter = 'alle';

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
  await laden();
  // Handys holen eine installierte App oft nur aus dem Hintergrund zurück, ohne neu zu laden.
  // Deshalb beim Wiedererscheinen die Inhalte frisch holen.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') laden();
  });
}

start();
