# CLAUDE.md

Projekt „Kurswechsel – Karrierecoaching": eine kleine PWA (Website, die sich als App aufs
Handy legen lässt) für Mareikes Workshop, Tag 4. Mareike ist Einsteigerin: auf Deutsch
antworten, Fachbegriffe kurz erklären, einen Weg empfehlen statt vieler Optionen.

## Speichern auf GitHub

Wenn Mareike „Save to GitHub" oder „Speichern auf GitHub" sagt: alle Änderungen mit einer
kurzen, klaren Nachricht committen und pushen (`git add -A`, `git commit`, `git push`).
Netlify ist mit GitHub verbunden, jeder Push geht automatisch live.

Das Repository ist **öffentlich** (github.com/Mareike-CBE/karrierecoaching-kurswechsel).
Deshalb nie Geheimnisse, Wohnadresse, Handynummer oder private E-Mail committen. Der
Marken-Styleguide unter `docs/Styleguide/` bleibt bewusst lokal (steht in `.gitignore`).

## Aufbau

- `Inhalte.md`: **alle** Texte, Angebote, Termine. Nur hier Inhalte ändern, nie in HTML/JS.
- `content.js`: reine Logik (Einlesen, Termine aufbereiten, Mail-Links), getestet.
- `app.js`: Anzeige im Browser, Filter, lädt Inhalte beim Wiedererscheinen neu.
- `sw.js`: Service Worker, network-first. Updates müssen auf installierten Handys ankommen.
- `netlify.toml`: `Cache-Control: max-age=0, must-revalidate` für alles, kein Build-Schritt.
- Spec und Plan: `docs/superpowers/`.

## Befehle

- Tests: `npm test` (Node-eingebauter Testläufer, keine Pakete)
- Lokal ansehen: `npm start` → http://localhost:8080
- Icons neu erzeugen: `python3 tools/make_icons.py`
