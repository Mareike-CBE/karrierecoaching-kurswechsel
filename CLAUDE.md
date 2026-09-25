# CLAUDE.md

Projekt „Kurswechsel – Karrierecoaching": eine kleine PWA (Website, die sich als App aufs
Handy legen lässt) für Mareike Kirch. Entstanden in einem Claude-Workshop, Tag 4.

Live: https://kurswechsel.netlify.app · Code: github.com/Mareike-CBE/karrierecoaching-kurswechsel

Diese Datei ist bewusst vollständig: Neue Sessions laufen oft in der Cloud (Claude-App auf
dem Handy) und sehen nur dieses Repository, nichts von Mareikes Mac.

## Wie du mit Mareike arbeitest

Mareike ist Einsteigerin.

- Auf Deutsch antworten, freundlich und geduldig. Fachbegriffe beim ersten Mal kurz
  erklären (z. B. „Commit = ein Speicherpunkt in Git"). Lieber ein Beispiel als eine Definition.
- Einen Weg empfehlen und kurz sagen warum, statt viele Optionen aufzuzählen.
- **Erst planen, dann machen.** Bei allem, was mehr als ein kleiner Schritt ist: kurzen Plan
  zeigen und auf „ok" warten, bevor Dateien geändert werden. Bei Unklarheit nachfragen.
- **Selbst prüfen** (mindestens `npm test`) und das Ergebnis ehrlich sagen. Nie „fertig"
  melden, ohne geprüft zu haben.
- Einfachste Lösung, die funktioniert. Keine ungefragten Extras, keine neuen Pakete, wenn es
  ohne geht. Sicherheit und Fehlerbehandlung trotzdem nie weglassen.
- Vor jedem Schritt in einem Satz sagen, was du tust und warum. Am Ende kurz in einfacher
  Sprache zusammenfassen, was jetzt anders ist.
- Ohne Mareikes Zustimmung: nichts löschen oder überschreiben, nichts nach außen senden,
  keine Passwörter oder Zugangsdaten eingeben.

## Speichern auf GitHub

Wenn Mareike „Save to GitHub" oder „Speichern auf GitHub" sagt: alle Änderungen mit einer
kurzen, klaren Nachricht committen und pushen (`git add -A`, `git commit`, `git push`).
Netlify ist mit GitHub verbunden: **nur ein Push auf den Zweig `main` geht live**.

Arbeitest du in einer Cloud-Session und landet die Arbeit auf einem eigenen Zweig
(z. B. `claude/...`), sag Mareike das deutlich. Die Seite ändert sich erst, wenn der Zweig
in `main` übernommen ist. Erkläre ihr Schritt für Schritt, wie sie den Pull Request in der
GitHub-App oder auf github.com zusammenführt („Merge").

Das Repository ist **öffentlich**. Deshalb nie Geheimnisse, Wohnadresse, Handynummer oder
private E-Mail committen (ein Test prüft `Inhalte.md` darauf). Der Marken-Styleguide unter
`docs/Styleguide/` bleibt bewusst nur auf Mareikes Mac (steht in `.gitignore`). Alle Regeln
daraus stehen unten, die Datei wird nicht gebraucht.

## Aufbau

- `Inhalte.md`: **alle** Texte, Angebote, Termine. Nur hier Inhalte ändern, nie in HTML/JS.
- `content.js`: reine Logik (Einlesen, Termine aufbereiten, Mail-Links), getestet.
- `app.js`: Anzeige im Browser, Filter, lädt Inhalte beim Wiedererscheinen neu.
- `style.css`: nur Styleguide-Farben und ihre transparenten Varianten.
- `sw.js`: Service Worker, network-first. Updates müssen auf installierten Handys ankommen
  (Cache-Busting). Die Cache-Version `kurswechsel-vN` nur erhöhen, wenn sich `sw.js` selbst
  grundlegend ändert.
- `netlify.toml`: `Cache-Control: max-age=0, must-revalidate` für alles, kein Build-Schritt.
- `Steckbrief.md`: der ursprüngliche Auftrag. Spec und Plan: `docs/superpowers/`
  (historisch, die Mac-Pfade darin sind nur Protokoll).
- Keine Datenbank, keine Logins. Buchung läuft über `mailto:`-Links an die
  Platzhalter-Adresse hallo@kurswechsel-coaching.de.

## Befehle

- Tests: `npm test` (Node-eingebauter Testläufer, keine Pakete nötig). Nach jeder Änderung.
- Lokal ansehen: `npm start` → http://localhost:8080
- Icons neu erzeugen: `python3 tools/make_icons.py` (braucht das Python-Paket Pillow;
  fehlt es, mit `pip install pillow` nachinstallieren)

## Styleguide (Mareike Personal Brand, Version 1.0, Mai 2026)

**Farben** (nur diese, plus ihre transparenten Varianten):

| Name | Wert | Einsatz |
|---|---|---|
| Midnight Ink | `#1A1A2E` | Text, dunkler Kopfbereich |
| Warm White | `#F5F3EF` | Hintergrund, Text auf Dunkel |
| Signal Purple | `#7F77DD` | Knöpfe, Akzente, Karte „Nächster Termin" |
| Lavender Mist | `#EEEDFE` | Hintergrund-Akzent |
| Soft Iris | `#AFA9EC` | Icons, dezente Details |
| Deep Violet | `#3C3489` | Hover, Text auf hellem Lila |

**Schriften:** Syne für Überschriften, Inter für Fließtext (Google Fonts), Ersatz Arial.
Kein Kursiv.

| Stufe | Schrift | Gewicht | Größe | Zeilenabstand |
|---|---|---|---|---|
| H1 | Syne | 700 | 40 px (Handy 32 px) | 1.05 |
| H2 | Syne | 600 | 26 px | 1.20 |
| H3 | Syne | 500 | 18 px | 1.30 |
| Body | Inter | 400 | 16 px | 1.70 |
| Caption | Inter | 400 | 13 px | 1.60 |
| Label | Inter | 500 | 11 px | 1.40 |

**Ton** (für alle Texte, vor allem `Inhalte.md`):
- Ruhig stark: direkt, ehrlich, ohne Schmeichelei. Wärme durch Ehrlichkeit.
- Immer „Du". Kurze Hauptsätze, keine Schachtelsätze. Punkt statt Gedankenstrich.
- Keine Weichmacher („vielleicht", „ich glaube"), keine Ausrufe-Motivation („Du schaffst das!").
- Kein Gendersternchen, kein Doppelpunkt. Plural oder direkte Ansprache („Menschen, die …").
- „KI", nicht „AI". Abkürzungen beim ersten Mal ausschreiben.
- Keine Ergebnis- oder Zahlenversprechen („in 30 Tagen zum Traumjob", „10x").
- Verbotene Wörter: revolutionieren, disruptiv, transformieren, ermöglichen, entdecken,
  freischalten, bahnbrechend, bemerkenswert, vielleicht, eigentlich, grundsätzlich,
  Empowerment, Game-Changer, next level. (Ein Test prüft das in `Inhalte.md`.)
- Nie mit „Abschließend", „Insgesamt" oder „Zusammenfassend" beginnen.
