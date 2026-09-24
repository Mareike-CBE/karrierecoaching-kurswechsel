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

    // Leerzeichen nach den # ist erlaubt, aber nicht nötig: "###Webinar" zählt auch.
    const ueberschrift = /^(#{1,3})(?!#)\s*(.*)$/.exec(zeile);
    if (ueberschrift) {
      const ebene = ueberschrift[1].length;
      const titel = (ueberschrift[2] || '').trim();
      letztesFeld = null;
      if (ebene === 1) {
        bereich = null;
        ziel = null;
      } else if (ebene === 2) {
        // NFC: manche Mac-Programme speichern "Ü" als "U" + Pünktchen. Doppelpunkt am Ende ist egal.
        const schluessel = titel.normalize('NFC').replace(/:$/, '').trim().toLowerCase();
        bereich = BEREICHE[schluessel] || null;
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
