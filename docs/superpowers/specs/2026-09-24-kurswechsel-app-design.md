# Kurswechsel – Karrierecoaching: Design-Spezifikation

Stand: 24.09.2026 · Status: abgestimmt im Brainstorming, wartet auf Review

## 1. Ziel

Eine kleine **PWA** (Website, die sich als App-Icon aufs Handy legen lässt) für ein
Online-Karrierecoaching. Besucherinnen und Besucher finden **Termine und Preise** und
können per Knopf eine vorbereitete E-Mail zur Anmeldung oder Anfrage öffnen.

Übungsprojekt aus dem Workshop „Agentic Engineering", Tag 4. Coach ist Mareike Kirch; Preise,
Termine und E-Mail-Adresse sind **Platzhalter**.

**Fertig, wenn:** die App im Browser auf dem Mac läuft, der Filter funktioniert, ein
Buchungsknopf eine Mail öffnet und eine Änderung in `Inhalte.md` nach dem Neuladen
sichtbar ist, auch bei aktivem Service Worker.

## 2. Eckdaten

| Punkt | Festlegung |
|---|---|
| Name | Kurswechsel – Karrierecoaching |
| Kurzname (Icon) | Kurswechsel |
| Zielgruppe | Alle Menschen in beruflicher Neuorientierung (Jobwechsel, Quereinstieg). Nicht gezielt Frauen, kein KI-Schwerpunkt. |
| Coach | Mareike Kirch |
| E-Mail (Platzhalter) | hallo@kurswechsel-coaching.de |
| Buchung | `mailto:`-Links mit vorbereitetem Betreff und Text |
| Interaktion | Filter „Alle / Einzelcoaching / Gruppentermine" + Buchungsknöpfe |
| Datenbank / Login | keine |

**Nicht übernehmen:** Wohnadresse, Handynummer und private E-Mail aus dem Profil von
Mareike. Das Repository wird öffentlich.

## 3. Design

Quelle: `Mareike_StyleGuide_v1.docx` (Version 1.0, Mai 2026). Eine Kopie kommt nach
`docs/Styleguide/`; das Original bleibt unverändert.

**Farben**

| Name | Wert | Einsatz in der App |
|---|---|---|
| Midnight Ink | `#1A1A2E` | Text, dunkler Kopfbereich |
| Warm White | `#F5F3EF` | Seitenhintergrund, Text auf Dunkel |
| Signal Purple | `#7F77DD` | Knöpfe, Akzentlinien, Karte „Nächster Termin" |
| Lavender Mist | `#EEEDFE` | Hintergrund der Angebotskarten |
| Soft Iris | `#AFA9EC` | Icons, dezente Details |
| Deep Violet | `#3C3489` | Hover, Text auf hellem Lila |

**Schriften:** Syne (Überschriften, 700/600/500), Inter (Fließtext, 400/500) über
Google Fonts. Ersatzschrift Arial. Kein Kursiv. Größen nach Styleguide (H1 40 px,
H2 26 px, H3 18 px, Body 16 px, Caption 13 px, Label 11 px), auf dem Handy H1 32 px.

**Ton (für alle Texte in der App und in `Inhalte.md`):**
- Immer „Du". Kurze Hauptsätze. Punkt statt Gedankenstrich im Fließtext.
- Keine Weichmacher, keine Ausrufe-Motivation („Du schaffst das!").
- Kein Gendersternchen, kein Doppelpunkt. Pluralformen oder direkte Ansprache.
- Verbotene Wörter: revolutionieren, disruptiv, transformieren, ermöglichen,
  entdecken, freischalten, bahnbrechend, bemerkenswert, vielleicht, eigentlich,
  grundsätzlich, Empowerment, Game-Changer, next level.
- Keine Ergebnisversprechen („in 30 Tagen zum Traumjob").

**Spruch (Platzhalter):** „Neue Richtung. Klarer Plan."

## 4. Seitenaufbau (Layout B)

Eine einzige Seite, von oben nach unten:

1. **Kopfbereich** (Hintergrund Midnight Ink): Name „Kurswechsel", Spruch in Signal Purple.
2. **Nächster Termin:** Label „Nächster Termin", große Karte in Signal Purple mit Datum
   (inkl. Wochentag), Uhrzeit, Ort, Titel, Preis und Knopf „Anmelden". Zeigt den
   frühesten zukünftigen Gruppentermin. Gibt es keinen, entfällt der Block.
3. **Filter:** drei Knöpfe „Alle" (vorausgewählt), „Einzelcoaching", „Gruppentermine".
4. **Liste:** Karten (Lavender Mist, Akzentlinie oben) für alle Einzelangebote und alle
   übrigen zukünftigen Gruppentermine. Der Termin aus Punkt 2 erscheint hier **nicht**
   noch einmal. Reihenfolge bei „Alle": erst Gruppentermine nach Datum, dann
   Einzelangebote in Datei-Reihenfolge.
5. **Über mich:** Name und kurzer Text über Mareike Kirch, eine Kurzfassung aus ihrem
   Profil (Ingenieurin, Gründerin, zertifizierte Laufbahn- und Karriere-Coach). Ohne
   Wohnort-Adresse, Telefonnummer, private E-Mail.
6. **Fußbereich** (Midnight Ink): Name, E-Mail-Link, Hinweis „Beispielseite aus einem
   Workshop. Preise und Termine sind Beispiele."

Jede Karte zeigt: Art + Datum/Dauer als Label, Titel, Beschreibung, Preis, Knopf.

**Filterverhalten:** Der Filter wirkt auf die Liste (Punkt 4). Der Block „Nächster
Termin" bleibt immer sichtbar. Ist die gefilterte Liste leer, steht dort:
- wenn es gar keinen zukünftigen Gruppentermin gibt: „Gerade keine Termine. Schreib
  mir, dann melde ich mich." mit E-Mail-Link;
- wenn der einzige Termin schon oben als „Nächster Termin" steht: „Weitere Termine
  folgen."

## 5. Inhaltsdatei `Inhalte.md`

Die einzige Datei, die Mareike bearbeitet. Ganz oben steht eine kurze Anleitung als
HTML-Kommentar (`<!-- ... -->`), die in der App nicht erscheint.

**Aufbau:**

```markdown
## Allgemein
Name: Kurswechsel – Karrierecoaching
Spruch: Neue Richtung. Klarer Plan.
E-Mail: hallo@kurswechsel-coaching.de

## Über mich
Name: Mareike Kirch
Text: ...

## Einzelcoaching
### Kennenlerngespräch
Dauer: 20 Min.
Preis: kostenlos
Beschreibung: ...

## Gruppentermine
### Info-Abend: Wie klappt ein Quereinstieg?
Datum: 15.10.2026
Uhrzeit: 19:00
Dauer: 60 Min.
Preis: kostenlos
Ort: online
Beschreibung: ...
```

**Regeln beim Einlesen:**
- `##` = Bereich, `###` = ein Eintrag, darunter Zeilen `Stichwort: Wert`.
- Stichwörter ohne Rücksicht auf Groß-/Kleinschreibung; Leerzeichen um den Doppelpunkt
  egal. Unbekannte Stichwörter werden ignoriert.
- Leere Zeilen und HTML-Kommentare werden ignoriert.
- `Datum` im Format `TT.MM.JJJJ`, `Uhrzeit` im Format `HH:MM`. Den Wochentag
  berechnet die App.
- Ein Termin gilt als vergangen, wenn sein Datum vor dem heutigen Tag liegt
  (Termine von heute bleiben den ganzen Tag sichtbar). Vergangene Termine werden
  ausgeblendet.
- Ist das Datum nicht lesbar oder fehlt es, erscheint der Termin trotzdem, mit
  „Datum folgt", am Ende der Gruppentermine. Er kommt nie in den Block
  „Nächster Termin".
- Fehlt `Preis`, wird kein Preis angezeigt. Fehlt der Titel (`###` ohne Text), wird
  der Eintrag übersprungen.

**Start-Inhalte (Platzhalter):**

| Bereich | Titel | Dauer | Preis | Datum / Uhrzeit |
|---|---|---|---|---|
| Einzel | Kennenlerngespräch | 20 Min. | kostenlos | – |
| Einzel | Einzelcoaching | 60 Min. | 120 € | – |
| Einzel | Paket „Neuer Kurs" (5 Sitzungen) | 5 × 60 Min. | 540 € | – |
| Gruppe | Info-Abend: Wie klappt ein Quereinstieg? | 60 Min. | kostenlos | 15.10.2026, 19:00 |
| Gruppe | Webinar: Neustart mit 40 | 90 Min. | 29 € | 27.10.2026, 18:30 |
| Gruppe | Info-Abend: Wie klappt ein Quereinstieg? | 60 Min. | kostenlos | 12.11.2026, 19:00 |

Alle Gruppentermine online.

## 6. Buchung per E-Mail

- **Gruppentermin**, Knopf „Anmelden":
  Betreff `Anmeldung: <Titel> – <Wochentag>, <TT.MM.JJJJ>, <HH:MM> Uhr`
  Text: `Hallo <Coach-Vorname>,\n\nich möchte mich für diesen Termin anmelden.\n\nMein Name:\n`
- **Einzelangebot**, Knopf „Anfragen":
  Betreff `Anfrage: <Titel>`
  Text: `Hallo <Coach-Vorname>,\n\nich interessiere mich für „<Titel>". Bitte schick mir Terminvorschläge.\n\nMein Name:\n`
- Betreff und Text werden URL-kodiert (`encodeURIComponent`).
- Bei Datum „folgt": Betreff ohne Datumsteil.

## 7. Technik

Schlichte statische Dateien, **kein Build-Schritt**, keine npm-Abhängigkeiten zur Laufzeit.

| Datei | Aufgabe |
|---|---|
| `index.html` | Grundgerüst, Einbindung von CSS/JS/Manifest, Platzhalter-Container |
| `style.css` | Design-Tokens (CSS-Variablen) und Layout, Handy zuerst |
| `content.js` | **Reine Logik ohne Browser-Bezug:** `Inhalte.md` einlesen, Termine filtern/sortieren, nächsten Termin bestimmen, Mail-Links bauen, Datum formatieren. Als ES-Modul, damit Node sie testen kann. |
| `app.js` | Browser-Teil: `Inhalte.md` laden, HTML erzeugen, Filter steuern, Service Worker registrieren |
| `Inhalte.md` | Inhalte (siehe Abschnitt 5) |
| `manifest.webmanifest` | Name, Kurzname, `display: standalone`, Farben (`theme_color` `#1A1A2E`, `background_color` `#F5F3EF`), Icons |
| `sw.js` | Service Worker (siehe Abschnitt 8) |
| `icons/` | `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` (180 px), `icon.svg` als Vorlage |
| `netlify.toml` | Cache-Header |
| `tests/content.test.js` | Tests mit dem eingebauten Node-Testläufer (`node --test`) |
| `.gitignore` | `.env`, `node_modules/`, `.DS_Store`, `.superpowers/` |
| `docs/` | Diese Spezifikation, Plan, Styleguide-Kopie |

Alle Texte der Oberfläche werden mit `textContent` gesetzt, nicht mit `innerHTML`, damit
Inhalte aus `Inhalte.md` nie als Code ausgeführt werden.

**Fehlerfall:** Lässt sich `Inhalte.md` nicht laden (offline ohne Kopie), zeigt die
App Kopfbereich und den Hinweis „Die Inhalte laden gerade nicht. Versuch es gleich
noch einmal." statt einer leeren Seite.

**App-Icon (Variante B):** lila Richtungspfeil (`#7F77DD`), der nach rechts abbiegt, auf
Midnight Ink. Quelle ist `icons/icon.svg`; die PNGs werden daraus erzeugt. Die
maskable-Variante hat genug Rand, damit Android den Pfeil beim Zuschneiden nicht anschneidet.

## 8. Updates und Cache-Busting

Ziel: Nach einem Push erscheint beim nächsten Öffnen die neue Version, auch auf schon
installierten Handys.

- **Service Worker, „network-first":** Für alle eigenen Dateien (HTML, CSS, JS,
  `Inhalte.md`, Manifest) fragt er zuerst das Netz. Klappt das, speichert er die frische
  Antwort als Kopie. Nur wenn das Netz fehlt, liefert er die Kopie.
- Google Fonts: Cache als Fallback, ohne die Seite zu blockieren.
- `self.skipWaiting()` und `clients.claim()`: Ein neuer Service Worker übernimmt sofort.
- Cache-Name mit Versionsnummer (`kurswechsel-v1`); beim Aktivieren werden alte Caches
  gelöscht.
- Registrierung mit `updateViaCache: 'none'`, damit der Browser `sw.js` selbst nie aus
  dem HTTP-Cache nimmt.
- `netlify.toml`: `Cache-Control: no-cache` für `/`, `*.html`, `*.js`, `*.css`, `*.md`,
  `*.webmanifest`, `sw.js`, umgesetzt als eine Regel für alle Dateien (`/*`). Der
  Browser muss also bei jedem Laden nachfragen, ob es etwas Neues gibt. Keine
  Sonderregel für Icons, weil sich Netlify-Regeln sonst überschneiden.
- `Inhalte.md` wird im Browser mit `fetch(..., { cache: 'no-store' })` geladen.

## 9. Prüfung

1. **Automatische Tests** (`node --test`) für `content.js`, mindestens:
   - Allgemein, Über mich, Einzel- und Gruppeneinträge werden korrekt gelesen.
   - Groß-/Kleinschreibung und Leerzeichen bei Stichwörtern sind egal; Kommentare
     werden ignoriert.
   - Vergangene Termine werden ausgeblendet, heutige nicht.
   - Unlesbares Datum → „Datum folgt", am Ende, nie „Nächster Termin".
   - Nächster Termin = frühester zukünftiger; er fehlt in der Liste.
   - Wochentag stimmt (15.10.2026 = Donnerstag).
   - Mail-Link: Betreff und Text wie in Abschnitt 6, korrekt kodiert.
2. **Browser-Check** in Handygröße (375 px) und Desktop: Layout, Filter, Mail-Knopf,
   keine Fehler in der Konsole.
3. **Update-Test:** Service Worker aktiv → Termin in `Inhalte.md` ändern → neu laden →
   Änderung sichtbar.
4. **Offline-Test:** Nach einmaligem Laden bei ausgeschaltetem Netz → App öffnet sich.
5. **Text-Check:** keine verbotenen Wörter, kein Gendersternchen, keine privaten Daten
   (Adresse, Handynummer, private E-Mail) in irgendeiner Datei.

## 10. Nicht enthalten

Impressum und Datenschutzerklärung (für eine echte Seite Pflicht, später ergänzen),
Fotos, Mehrsprachigkeit, Online-Buchung mit Kalender, Formular, Analyse-Tools.
