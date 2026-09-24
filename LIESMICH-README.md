# Deine eigene App fürs Handy / Your own app for the phone

Jetzt baust du deine eigene App, nach demselben Muster wie eben bei Kranich Kaffee.
/ Now you build your own app, the same way you just saw with Kranich Kaffee.

**Die Idee / The idea:** eine kleine App für deine Kundschaft oder dein Publikum: dein
Angebot und etwas, das sich ändert (Neuigkeiten, Aktionen, Termine), mit etwas zum
Antippen. Die App liegt als **Icon auf dem Handy**, und wenn du etwas änderst, sehen
alle, die die App haben, die Änderung. Ganz ohne Datenbank, ganz ohne Login.
/ A small app for your customers or audience: your offer and something that changes
(news, offers, dates), with something to tap. It sits as an icon on the phone, and
when you change something, everyone who installed it sees the change. No database,
no logins.

Superpowers ist aus Schritt 5 installiert. / Superpowers is already installed from
step 5.

## Was drin ist / What's inside

- `Steckbrief.md`: dein Auftrag an Claude, ausgefüllt
- ggf. ein Styleguide/Marken-PDF, das du selbst reinlegst
- dieses README

Die Prompts sind auf Englisch, du kannst sie genauso gut auf Deutsch tippen.
/ Prompts are in English, typing them in German works just as well.

---

## Vorab / Before you start

- 🐙 Ein **GitHub-Account** (kostenlos, github.com). / A GitHub account.
- 🌐 Dein **Netlify-Account** von Dienstag, **mit GitHub verknüpft** (bei Netlify mit
  GitHub anmelden). / Your Netlify account from Tuesday, linked to GitHub.
- 📱 Dein Handy in Reichweite. / Your phone nearby.
- 📝 `Steckbrief.md` ausgefüllt. / `Steckbrief.md` filled in.

Starte im Bereich Code der Claude-Desktop-App eine neue Session und wähle den Ordner
Eigene-Website.

---

## Schritt 6: Die App bauen / Build the app

Du musst nichts über Webentwicklung wissen. Beschreib, was du willst, und lass dich
führen. / You don't need to know web development. Describe what you want and let
Claude guide you.

> I run [was du machst, siehe mein Steckbrief.md / what you do, see my Steckbrief.md].
> Everything about me is in this folder. I don't know much about web development.
>
> I'd like a small app for my customers that they can put on their phone's home
> screen, like a real app with an icon. It should show my offer and something that
> changes (news, offers, dates), with something they can tap.
>
> I want to change that content myself later without touching any code, and everyone
> who has the app should then see the change. No database, no logins.
>
> Build it so updates always reach people who already installed the app, don't let
> old versions get stuck in the cache.
>
> Please guide me step by step: ask me one question at a time, show me design options
> before you build anything, and explain in plain words what you're doing.

### Woher kommt dein Design? / Where does your design come from?

Wenn Claude nach dem Look fragt, hast du drei Möglichkeiten: / When Claude asks about
the look, you have three options:

- Du legst ein **Styleguide- oder Marken-PDF** in diesen Ordner (Farben, Schriften,
  Ton, Logo-Regeln) und sagst Claude, es soll das nutzen. / Drop a styleguide or brand
  PDF into this folder and tell Claude to use it.
- Du nennst eine **Website, die dir gefällt** (Link einfügen). Claude lässt sich davon
  inspirieren, kopiert sie aber nicht. / Name a website you like (paste the link).
  Claude takes inspiration from it, not a copy.
- Du **beschreibst es in Worten**, oder sagst „entscheide du". / Describe it in words,
  or say "you decide".

Dann: Fragen beantworten, Entwürfe anschauen, entscheiden. Wenn Claude anbietet, dir
Entwürfe im Browser zu zeigen, sag ja. / Answer the questions, look at the drafts,
decide. If Claude offers to show drafts in the browser, say yes.

👀 **Achte darauf / Watch for:**

- **Wo landet der sich ändernde Inhalt?** Gut ist eine eigene Datei, die du ohne
  Code-Kenntnisse änderst. / Good: its own file you can change without code.
- Superpowers macht nach den Fragen einen **Plan**. Lies ihn, bevor du „go" sagst.

✅ **Fertig, wenn / Done when:** du deine App im Browser auf deinem Mac siehst, mit
deinem Angebot, dem sich ändernden Inhalt und etwas zum Antippen.

---

## Schritt 7: Speichern mit Git und GitHub / Save with git and GitHub

Git ist ein Speicherpunkt-System: jeder Speicherpunkt (**Commit**) hat eine Nachricht,
was sich geändert hat. GitHub ist der Ort im Netz, wo diese Speicherpunkte liegen.
Claude macht die ganze Technik. Du klickst nur „Installieren", falls der Mac fragt, und
fügst einmal einen Code im Browser ein.
/ Git makes save points (commits). GitHub keeps them online. Claude does the plumbing;
you only click "Install" if macOS asks and paste one code into the browser.

⚠️ Claude Code fragt dabei oft „Allow this command?". Beim Einrichten ist Ja richtig.
Lies trotzdem kurz mit. / Expect many permission prompts; saying yes during setup is fine.

**7a. Einmal pro Rechner einrichten / One-time setup per computer**
(Sei vorher im Browser bei GitHub angemeldet. / Be logged into GitHub in your browser.)

```
I'm not technical and this is my first time using GitHub on this computer. Please set everything up so you can push my projects to GitHub. Go step by step and explain each step to me in one simple sentence.

1. Check if git is installed. If it isn't, tell me exactly what to click to install it (on a Mac, a popup asking to install the Command Line Tools may appear).
2. Check if the GitHub CLI (gh) is installed. If not, install it WITHOUT Homebrew and without needing an admin password: download the official release for my operating system and processor from github.com/cli/cli, put the gh program in a folder inside my home directory, and add that folder to my PATH so it keeps working in new terminal windows.
3. Log me in with: gh auth login --hostname github.com --git-protocol https --web
   Show me the one-time code clearly and tell me to paste it into the browser page that opens. Do NOT use SSH keys or personal access tokens.
4. Run: gh auth setup-git (so normal git pushes use this login).
5. If git doesn't know my name and email yet, ask me for my name and set both globally. For the email, use my private GitHub noreply address (you can build it from gh api user) so my real email stays private.
6. Finish with gh auth status and tell me in one sentence whether everything worked.

If any step needs me to type something myself in a separate Terminal window, tell me exactly what to paste.
```

**7b. Dieses Projekt auf GitHub bringen / Put this project on GitHub**

```
Turn this folder into a GitHub project. First create a sensible .gitignore so no secrets (like .env files or API keys) and no junk folders (like node_modules) get uploaded. Then make a first commit, create a new PUBLIC repository on my GitHub account called [my-app-name], and push everything. Also add a note to CLAUDE.md: when I say "save to GitHub", commit all changes with a short, clear message and push. At the end, give me the link to the repository.
```

Öffentlich, damit die anderen in Schritt 9 deine Commit-Historie sehen können. Deine App
hat keine Geheimnisse, sie ist ja sowieso gleich live im Netz.
/ Public so others can see your commit history in step 9. Your app has no secrets.

**7c. Ab jetzt / From now on**

```
Save to GitHub.
```

👀 **Achte darauf / Watch for:** Hat Claude dir den Code für den Browser deutlich
gezeigt? Hängt der Login, sagt Claude dir, was du in ein normales Terminal-Fenster
einfügen sollst.

🧯 **Falls es hakt / If it gets stuck**

- **Der Login hängt** (Claude wartet und nichts passiert): sag „The login seems stuck.
  Tell me exactly what to paste into a normal Terminal window." Dann Terminal öffnen
  (Cmd + Leertaste, „Terminal"), einfügen, Enter. / Login hangs: ask Claude what to
  paste into a normal Terminal window.
- **Der Mac will die „Command Line Tools" installieren:** auf **Installieren** klicken
  und warten, das kann ein paar Minuten dauern. / Click Install and wait a few minutes.
- **Firmen-Laptop blockt heruntergeladene Programme:** dann hilft kein Prompt. Nimm
  **GitHub Desktop** (desktop.github.com), falls du es installieren darfst, oder
  arbeite neben jemandem mit, dessen Rechner geht. / Locked-down work laptop: use
  GitHub Desktop if allowed, or pair up with someone.
- **Viele „Allow this command?"-Fragen:** beim Einrichten normal. Nur Nein sagen, wenn
  Claude etwas außerhalb von GitHub-Einrichtung oder deinem Projektordner tun will.
  / Many permission prompts are normal during setup.

✅ **Fertig, wenn / Done when:** du dein Repository auf github.com siehst, mit deinen
Dateien und mindestens einem Commit.

---

## Schritt 8: Live stellen und aufs Handy / Go live and onto your phone

Am Dienstag hast du eine Datei per Drag and Drop zu Netlify gezogen. Heute verbindest du
Netlify mit GitHub: jeder neue Speicherpunkt, den du hochlädst (**Push**), geht dann
automatisch live. Das wird dein **zweites Netlify-Projekt**.
/ Tuesday was drag and drop. Today Netlify is connected to GitHub, so every push goes
live automatically. This becomes your second Netlify project.

> Connect this GitHub repository to Netlify so every push updates the live site. My
> Netlify account is already linked to GitHub. Guide me through it; the clicks in the
> browser I'll do myself.

Wenn die Seite live ist: / Once it's live:

> I want this app as an icon on my phone. Walk me through the steps.

👀 **Achte darauf / Watch for:** Fragt Claude, ob du ein **iPhone oder Android** hast?
Die Wege sind verschieden:

- **iPhone:** die Adresse in Safari öffnen → Teilen-Symbol → **Zum Home-Bildschirm**
- **Android:** die Adresse in Chrome öffnen → Menü ⋮ → **App installieren** (oder
  **Zum Startbildschirm hinzufügen**)

✅ **Fertig, wenn / Done when:** dein Icon auf deinem Home-Bildschirm liegt und die App
ohne Browserleiste aufgeht.

---

## Schritt 9: Teilen, Gruppenübung / Sharing, group exercise

1. Eine Person teilt ihre Netlify-Adresse im Chat. Alle anderen legen sich diese App
   aufs Handy. / One person shares their Netlify address, everyone installs that app.
2. Diese Person trägt eine Änderung ein: / That person adds an update:

   > Add a new [Angebot, Termin oder Neuigkeit / offer, date or news item] to my
   > content: [dein Beispiel / your example]. Then save it with a clear commit message
   > and push it.

3. Ein, zwei Minuten warten, dann bei allen: App schließen, neu öffnen. Ist die
   Änderung da? / Wait a minute or two, close and reopen the app. Is it there?
4. Zusammen auf GitHub die **Commit-Historie** anschauen: jeder Speicherpunkt mit
   Nachricht, Datum, und was sich geändert hat. / Look at the commit history on GitHub
   together.

👀 **Achte darauf / Watch for:** Zeigt die App auf dem Handy noch die **alte Version**?
Dann hat die App zu viel zwischengespeichert. Sag Claude:

> On my phone the app still shows the old version after the update. Please fix it so
> new content always shows up, and explain what the problem was.

---

## Schritt 10: Zwei Dinge gleichzeitig, das passende Modell / Two things at once, the right model

Wie am Mittwoch in Cowork: zwei unabhängige Aufgaben, zwei **Sub-Agents**. Neu heute:
Claude wählt für jede Aufgabe das passende Modell.
/ Like Wednesday: two independent jobs, two sub-agents. New today: a model per job.

> Do two things at the same time, each in its own sub-agent, and pick the most
> suitable model for each:
>
> 1. Give my app a fresher, more modern look, a new theme.
> 2. Add new content: [dein Beispiel, z. B. ein weiteres Angebot oder ein Termin /
>    your example, e.g. another offer or date].
>
> Before you start, tell me which model you chose for which job and why. When both
> are done, show me the result, then save to GitHub.

👀 **Achte darauf / Watch for:** Welches Modell nimmt Claude fürs Design, welches für
den Text? Überzeugt dich die Begründung? Und: Siehst du das Update gleich auch auf
dem Handy?

---

## Was du prüfen kannst / Checklist

- [ ] Claude hat Fragen gestellt und Entwürfe gezeigt, bevor es gebaut hat
- [ ] Dein Design kommt aus deinem PDF, einem Link oder deiner Beschreibung
- [ ] Dein Angebot und der sich ändernde Inhalt sind auf der Seite
- [ ] Etwas zum Antippen funktioniert
- [ ] Der sich ändernde Inhalt liegt in einer Datei, die du ohne Code-Kenntnisse ändern kannst
- [ ] Das Projekt liegt auf GitHub, mit Commits, die du verstehst
- [ ] Netlify ist mit GitHub verbunden, ein Push geht automatisch live
- [ ] Dein Icon liegt auf deinem Handy
- [ ] Eine Änderung kam nach einem Push auf dem Handy an

## Tipps / Tips

- Wenn Claude Code um Erlaubnis fragt (Datei ändern, Befehl ausführen), lies kurz,
  was es tun will, bevor du bestätigst. / Read permission prompts before approving.
- Du verstehst eine Frage von Claude nicht? Sag das genau so: „Das verstehe ich nicht,
  erklär es mir einfacher." / Don't understand a question? Say exactly that.
- Du musst dich nicht für alles entscheiden: „Entscheide du" reicht.
  / "You decide" is a fine answer.

## Beispiel-Steckbriefe / Example briefs

### Beispiel 1: Reinigungsfirma

- Name: Glanz & Co. Reinigung
- Wofür: kleine App für eine Reinigungsfirma in Hamburg
- Wer besucht: Privathaushalte und kleine Büros, die eine Putzkraft suchen
- Drei Dinge auf der Seite: Leistungen (Fensterputz, Büroreinigung, Umzugsputz),
  ein Kontaktformular, Kundenstimmen
- Farben/Schriften: frisch, viel Weiß, ein kräftiges Grün als Akzent
- Interaktive Sache: ein Formular, das eine Anfrage per Mail-Link vorbereitet
- Was soll sich regelmäßig ändern: Angebote der Woche (z. B. „20% auf Fensterputz im März")

### Beispiel 2: Kurs- oder Coach-Seite

- Name: Mira Lund, Yoga & Atemtraining
- Wofür: App für Kurse, damit Interessierte Termine und Preise finden
- Wer besucht: Leute, die einen Kurs in ihrer Stadt suchen
- Drei Dinge auf der Seite: Kursplan mit Zeiten, kurze Vorstellung, Anmeldelink
- Farben/Schriften: ruhig, gedeckte Farben, serifenlose Schrift
- Interaktive Sache: ein Filter, der Kurse nach Wochentag anzeigt
- Was soll sich regelmäßig ändern: Kurstermine (neue Termine, ausgebuchte Kurse)
