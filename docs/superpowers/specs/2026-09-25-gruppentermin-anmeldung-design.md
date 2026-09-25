# Entwurf: Anmeldung zu Gruppenterminen mit Supabase

Stand: 25.09.2026 · Projekt: Kurswechsel-App (`Tag-4-Kit/Eigene-Website/`)

## Ziel

Besucher melden sich über ein Formular in der App für einen Gruppentermin an.
Die Anmeldungen landen in Supabase. Mareike sieht im Supabase-Dashboard, wer sich
angemeldet hat und wie viele Anmeldungen es pro Termin gibt.

**Erfolgreich ist das, wenn:**

- sich ein Besucher auf dem Handy in unter einer Minute für einen Gruppentermin anmelden kann,
- die Anmeldung danach im Dashboard steht und in der Übersicht pro Termin mitgezählt wird,
- niemand von außen Anmeldungen lesen, ändern oder löschen kann,
- bei einem Fehler niemand verloren geht (es gibt den Ausweg per E-Mail).

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Wer sieht die Zahlen? | Nur Mareike, im Supabase-Dashboard. Keine Anzeige und kein Login in der App. |
| Welche Angaben? | Name und E-Mail (Pflicht) und „Deine Frage oder Situation“ (freiwillig). |
| Nach dem Absenden? | Nur eine Bestätigung auf dem Bildschirm. Keine automatischen E-Mails. Zugangslink und Zahlungsinfo schickt Mareike selbst. |
| Technischer Weg | Die App schickt direkt an Supabase, mit dem öffentlichen Schlüssel und Zeilenschutz (Row Level Security). Kein Zwischenschritt über Netlify. |
| Supabase-Projekt | Neu anlegen, kostenloser Tarif, Region Frankfurt (`eu-central-1`). |
| Werkzeug für den Aufbau | Der claude.ai-Connector für Supabase (mit Schreibrecht). Jeder ändernde Schritt wird vorher angekündigt. Für den Alltag reicht danach der Projekt-Eintrag mit „nur lesen“. |

**Bewusste Abweichung von den Kursregeln:** Die Kursregel „keine Datenbank, keine Logins“
gilt für dieses Projekt ab jetzt nur noch eingeschränkt. Es gibt eine Datenbank für
Anmeldungen, aber weiterhin keine Logins in der App. Das wird in `CLAUDE.md` vermerkt.

## Nicht enthalten (YAGNI)

Automatische E-Mails, Benachrichtigung an Mareike, Höchstzahl an Plätzen oder „Noch X Plätze frei“,
Abmelden per Link, Bezahlung, automatische Löschfristen, Übersichtsseite in der App.
Alles das lässt sich später ergänzen.

## Abschnitt 1: Datenbank

### Tabelle `public.anmeldungen`

| Spalte | Typ | Regel |
|---|---|---|
| `id` | `bigint`, automatisch | Primärschlüssel |
| `erstellt_am` | `timestamptz` | Standardwert `now()` |
| `termin_datum` | `date` | Pflicht |
| `termin_titel` | `text` | Pflicht, 1–200 Zeichen |
| `name` | `text` | Pflicht, nach Entfernen von Leerzeichen am Rand 1–100 Zeichen |
| `email` | `text` | Pflicht, max. 254 Zeichen, einfache Formprüfung (`etwas@etwas.etwas`, keine Leerzeichen) |
| `nachricht` | `text` | Freiwillig (`null` erlaubt), max. 1000 Zeichen |

Ein Termin wird über `termin_datum` und `termin_titel` erkannt. Die Termine selbst
stehen weiter nur in `Inhalte.md`. Ein neuer Termin dort ist ohne Änderung in Supabase
sofort buchbar.

Es gibt keine Eindeutigkeitsregel für (Termin, E-Mail). Doppelte Anmeldungen werden
gespeichert, in der Übersicht aber nur einmal gezählt. Das verrät außerdem Fremden nicht,
ob eine E-Mail-Adresse schon angemeldet ist.

### Schutzregeln

- Row Level Security ist auf der Tabelle **eingeschaltet**.
- Rechte für die Rolle `anon` (öffentlicher Schlüssel): **nur `INSERT`** auf die Spalten
  `termin_datum`, `termin_titel`, `name`, `email`, `nachricht`. Kein `SELECT`, `UPDATE`
  oder `DELETE`. Die Rolle `authenticated` bekommt keine Rechte, weil die App keine Logins hat.
- Eine Policy für `INSERT` an `anon` mit der Bedingung `termin_datum >= current_date`.
  Anmeldungen für vergangene Termine werden abgelehnt.
- Die Längen- und Formregeln oben sind als `CHECK`-Regeln in der Tabelle hinterlegt und
  gelten damit auch für Anfragen, die an der App vorbeigehen.

### Ansicht `public.anmeldungen_pro_termin`

Spalten `termin_datum`, `termin_titel`, `anmeldungen` (= Anzahl verschiedener E-Mail-Adressen,
ohne Unterschied bei Groß-/Kleinschreibung), sortiert nach Datum.

- Angelegt mit `security_invoker = true`.
- Für `anon` und `authenticated` sind alle Rechte entzogen. Lesbar nur im Dashboard.

## Abschnitt 2: Formular in der App

### Ablauf

1. Bei Gruppenterminen öffnet der Knopf „Anmelden“ einen Dialog (`<dialog>`-Element)
   statt der vorbereiteten E-Mail.
2. Im Dialog stehen oben Titel, Wochentag, Datum, Uhrzeit und Ort des Termins.
3. Felder: Name (Pflicht), E-Mail (Pflicht), „Deine Frage oder Situation“ (freiwillig, mehrzeilig).
4. Kurzer Datenschutzhinweis unter den Feldern. Entwurf:
   *„Ich nutze deine Angaben nur, um dich zu diesem Termin zu kontaktieren.“*
   Der endgültige Text wird mit Mareike abgestimmt. Die rechtliche Prüfung liegt bei ihr.
5. Knöpfe „Anmelden“ und „Abbrechen“.
6. Ein unsichtbares Feld dient als Spam-Falle. Ist es ausgefüllt, zeigt die App die
   Erfolgsmeldung, sendet aber nichts.

Einzelcoaching-Angebote behalten ihre „Anfragen“-Knöpfe mit vorbereiteter E-Mail.

### Zustände

| Situation | Anzeige |
|---|---|
| Pflichtfeld leer oder E-Mail sieht falsch aus | Hinweis direkt am Feld, es wird nichts gesendet |
| Wird gesendet | Knopf „Wird gesendet …“, gesperrt |
| Erfolg (HTTP 201) | „Danke, du bist angemeldet für [Titel] am [Datum]. Ich melde mich per E-Mail bei dir.“ |
| Fehler (kein Netz, Projekt pausiert = HTTP 540, sonstige Fehler) | „Das hat leider nicht geklappt. Schreib mir einfach eine E-Mail.“ und ein Knopf mit der bisherigen vorbereiteten E-Mail |

### Aufteilung im Code

- **`content.js`**: reine Funktionen ohne Netz, getestet:
  - `pruefeAnmeldung(eingaben)` liefert eine Liste von Fehlern je Feld (gleiche Grenzen wie in der Datenbank),
  - `baueAnmeldung(termin, eingaben)` liefert das Objekt für Supabase (Datum als `JJJJ-MM-TT`,
    Leerzeichen am Rand entfernt, leere Nachricht als `null`).
- **`anmeldung.js`** (neu): enthält Supabase-Adresse und öffentlichen Schlüssel sowie
  `sendeAnmeldung(daten, fetchFn = fetch)`. Die Funktion schickt einen `POST` an
  `/rest/v1/anmeldungen` mit `Prefer: return=minimal` und liefert `{ ok: true }` oder
  `{ ok: false, grund }`. Sie wirft keine Fehler nach außen.
- **`app.js`**: Dialog anzeigen, Eingaben prüfen, senden, Zustände anzeigen.
- **`style.css`**: Stile für Dialog und Formular nach dem Styleguide (Midnight Ink, Warm White, Signal Purple).
- **`sw.js`**: `anmeldung.js` in `START_DATEIEN` aufnehmen. Der Service Worker bearbeitet
  weiterhin nur `GET`-Anfragen der eigenen Seite und der Schrift-Server. Anfragen an Supabase
  laufen an ihm vorbei.

Es kommen keine neuen Pakete dazu. Die Anfrage an Supabase ist ein einfacher `fetch`, ohne supabase-js.

## Abschnitt 3: Prüfen und Live-Stellen

### Automatische Tests (`npm test`)

- `pruefeAnmeldung`: leerer Name, fehlerhafte E-Mail, zu lange Texte, leeres freiwilliges Feld ist erlaubt.
- `baueAnmeldung`: Datumsformat, Leerzeichen entfernt, leere Nachricht wird `null`.
- `sendeAnmeldung` mit nachgespieltem `fetch`: Erfolg, Server-Fehler (400, 540) und Netzfehler.
- Spam-Falle: ausgefülltes unsichtbares Feld führt zu keinem Senden.

### Sicherheitstest gegen das echte Supabase (mit dem öffentlichen Schlüssel)

| Versuch | Erwartet |
|---|---|
| `INSERT` für kommenden Termin | erfolgreich |
| `SELECT` auf `anmeldungen` | verweigert oder leer |
| `SELECT` auf `anmeldungen_pro_termin` | verweigert |
| `UPDATE` / `DELETE` | verweigert oder wirkungslos |
| `INSERT` für vergangenen Termin | abgelehnt |
| `INSERT` mit 101 Zeichen langem Namen | abgelehnt |

Dazu kommt der Supabase-Sicherheitscheck (Security Advisor). Er darf zur Tabelle keine Warnungen zeigen.
Test-Anmeldungen heißen „TEST – bitte löschen“ und werden erst nach Rückfrage bei Mareike gelöscht.

### Browser-Test (lokal, Vorschau „kurswechsel“)

- Formular ausfüllen und absenden, dann die Erfolgsmeldung prüfen und den Eintrag in Supabase nachsehen.
- Netzwerk aus: Fehlermeldung mit E-Mail-Knopf.
- Handybreite (375 px): Dialog vollständig bedienbar.
- Screenshots als Nachweis.

### Live-Stellen

- Commit und Push nur auf „Save to GitHub“. Netlify veröffentlicht dann automatisch.
- Eine Test-Anmeldung auf https://kurswechsel.netlify.app. Löschen erst nach Rückfrage.
- `CLAUDE.md` ergänzen: Datenbank-Ausnahme, Supabase-Projekt, wo die Übersicht liegt,
  und wie Mareike alte Anmeldungen im Dashboard löscht.

## Risiken

- **Pausieren im kostenlosen Tarif:** Supabase pausiert Projekte nach 7 Tagen mit wenig
  Aktivität. Etwa eine Woche vorher kommt eine Warn-E-Mail an Mareike. Während der Pause
  schlagen Anmeldungen fehl (HTTP 540), und Besucher sehen dann den Ausweg per E-Mail.
  Wiederherstellen geht im Dashboard mit „Resume project“ innerhalb von 90 Tagen, ohne
  Datenverlust. Dauerhaft vermeiden lässt sich das nur mit dem kostenpflichtigen Pro-Tarif.
- **Spam:** Die Spam-Falle hält einfache Programme ab. Gezielter Missbrauch über die
  Schnittstelle ist möglich, wird aber durch die Längenregeln und die Datumsregel begrenzt.
  Wenn das passiert, wäre der nächste Schritt eine Rätsel-Abfrage (CAPTCHA) oder Weg 2
  (Netlify-Zwischenschritt).
- **Datenschutz:** Personenbezogene Daten liegen bei Supabase in der EU (Frankfurt).
  Hinweistext, Datenschutzerklärung und Löschung alter Anmeldungen verantwortet Mareike.
  Claude liefert Entwürfe, aber keine Rechtsberatung.
