# Handover für das nächste Modell (oder den nächsten Menschen)

**Von:** dem externen Prüfer (KI-Modell, v2.9.2, 11.10.2026)
**An:** wer auch immer als Nächstes diese Codebase bekommt
**Zustand:** v2.9.2 · 130/130 Tests · 25/25 Sim · DOM-Vertrag grün · MIT

---

## Lies in dieser Reihenfolge

1. `README.md` — was das Spiel ist
2. `POSTMORTEM.md` — was kaputt war und wie es repariert wurde
3. `MANIFEST.md` — was im Paket ist, was offen ist
4. `PATCHLOG.md` — die komplette Geschichte (v1.0 → v2.9.2)
5. `architecture.md` — Invarianten (dt-Klemmung, Rep-Niederlage im Tick, …)

Dann: `node tests.js && node sim.js && node tools/dom-check.js` — alle drei grün?
Du kannst anfangen.

## Die drei Dinge, die du zuerst tun musst

1. **Browser öffnen, mit Ohren, mit Augen.** Die ersten beiden Punkte des
   todo.md sind *deine*: Titelbildschirm, Menü-Button, Aim-Linie, Party, Intro —
   und die Musik (Peak-Stem bei Combo 5+, Titel-Tracks 1–5 durchhören, Default
   festlegen). Der Prüfer konnte nichts davon *erleben*. Du schon.
2. **Ein Spiel durchspielen. Komplett. 20 Nächte.** Nicht die Sim (die ist perfekt
   und blind), du. Die Sim sagt „25/25 Siege in Ø 6.5 Nächten". Das sagt: der Bot
   ist gut, nicht: das Spiel ist gut.
3. **Die 8 offenen Punkte im MANIFEST durchgehen** und entscheiden, welche in
   v2.9.3 / v3.0 gehen.

## Was gut ist (nicht anfassen, außer du musst)

- **Der Kern ist heilig.** `js/core.js` ist deterministisch, seedbar, 1.900 Zeilen,
  130 Tests drumherum. Jede Änderung: `node tests.js` danach. Wenn ein Test bricht,
  hast du entweder den Test oder die Welt kaputt gemacht — meist die zweite.
- **`CONFIG` ist die Balance.** Alle Zahlen, die ein Tuning betreffen, sind da.
  Nichts magisches im Flow. Wenn du „schwerer" willst: `WIN_CREDITS` ↑,
  `CLEAN_BONUS` ↓, `FORGIVE_BASE` ↓, `BASE_SPAWN` ↓.
- **Die KAWAII-Blöcke sind die Seele.** Alle Texte (Dialoge, Party, Katze, Chef-
  Gedanken, Lorebook) sind in `core.js` unter `KAWAII` und `LOREBOOK` gesammelt.
  Wenn du neue Texte schreibst: dort, nicht verstreut. Ton: melancholisch-pragmatisch,
  kurze Sätze, keine Exclamation-Flut. Siehe `quotes.md` für das Gefühl.
- **Die drei Checks sind der Rhythmus.** tests / sim / dom-check. Vorher, nachher,
  immer. Der dom-check ist seit v2.9.2 Pflicht — er hat zwei tote Features gerettet.

## Was schwierig ist (diese Stellen bitte an einen Spezialisten übergeben,
falls du es nicht selbst bist)

### 1. `app.js` aufteilen (Empfehlung: erfahrener Frontend-Entwickler)
1.550 Zeilen in einer Datei. Der Plan steht in `special_edition/tech-paper.md`:
- `js/app-render.js` — Canvas-Draw (render, drawGuest, drawChef, drawTransit, Aim-Linie, …)
- `js/app-input.js` — Key/Mouse/Touch/Gamepad (bindInput, toLogical, hitAt, …)
- `js/app-ui.js` — Overlays (Shop, Menü, Endscreen, HUD-Update, I18N)
Voraussetzung: die 130 Tests + der dom-check halten die Brücke. Geh es *sequenziell*
an (eine Datei nach der anderen, nach jedem Schritt alle Checks), nicht parallel.

### 2. Balance (Empfehlung: Lead Designer + der Sim)
Der Bot gewinnt 25/25 in Ø 6.5/20 Nächten. Das ist zu leicht für Menschen unter
Stress. Aber: „schwerer" ist keine Zahl, das ist ein Gefühl. Prozessvorschlag:
eine `CONFIG`-Variable ändern → `node sim.js` → Bot-Siegrate soll bei ~60–80 %
landen → **Menschenspielen** → erst dann fix. Die Sim ist ein Kompass, keine Wahrheit.

### 3. Audio-Mix (Empfehlung: jemand mit guten Kopfhörern + Ohren)
Der Peak-Stem ist seit v2.9.2 an, aber nie gehört. Zu prüfen: Lautstärke im Mix
(aktuell: stem3-Gain → musicGain 0.32, Titel 0.45), Ob der Taiko nicht gegen den
Walzer kämpft, und: **welcher Titel-Track (1–5) der Default sein soll** (aktuell: 1
„City Pop"). Die Entscheidung gehört in `CONFIG`-nahe Form: `startTitle()` setzt
`titleTrack = 1` — die eine Zahl.

### 4. Mobile (Empfehlung: jemand mit einem echten Handy)
Touchpad-Größe, Porträt-Layout, `fitCanvas()` auf kleinem Screen. Wurde nie
menschlich geprüft. Der dom-check hilft hier nicht — das ist ein Auge-Fall.

## Anweisungen für einen KI-Kollegen, der übernimmt

- **Kein paralleles Coder-Chaos.** Eine Aufgabe, eine Datei, ein Commit-äquivalent.
  Die 130 Tests sind dein Sicherheitsnetz — wenn du zwei Dateien gleichzeitig
  veränderst, weißt du nicht, was bricht.
- **Schreib das Patchlog mit der Version.** Nicht nachher. v2.7 war die Lücke,
  weil „später" nie kam. Dein Eintrag gehört in die gleiche Aktion wie dein Code.
- **Erfind nichts.** Wenn du eine Lücke findest (v2.7, fehlende Docs, tote
  Referenzen): markiere sie, schreib in das Patchlog, was du *nicht* weißt. Ein
  ehrliches „Lücke" ist mehr wert als eine geschickte Geschichte.
- **Verträge statt Aufmerksamkeit.** Wenn du ein neues UI-Element baust:
  `id="…"` ins HTML, *dann* den Code. Wenn du ein neues Feature baust, das ein
  anderes Feature berührt (wie v2.9 den Titel + den Container): prüfe die
  Randbedingungen des Bestehenden. Der Titelbildschirm-Bug war ein
  *Container*-Problem, kein Render-Problem.
- **Audio:** Alle Sounds sind synthetisch (WebAudio, keine Assets). Neue SFX nach
  dem Muster `_blip(freq, dur, wave, gain)` in `audio.js`. Neue Titel-Tracks nach
  dem Muster `TITLE_TRACKS[n]` (bass/chord/arp/wave, 8 Takte).
- **Texte:** Deutsch zuerst (das Spiel ist DE, EN ist da). Neue Dialog-Pools in
  `KAWAII` (core.js). Keine Sätze über 14 Wörter in Sprechblasen.
- **Die Katze:** Sie ist im Logo, im Audio, in der Seele. Sie war nie geplant.
  Wenn du sie irgendwo „versehentlich" löschst: sie ist nicht versehentlich
  gelöscht. Lass sie.
- **Die Lizenz:** MIT. Im Menü steht „Für diese Kunst übernimmt niemand
  Verantwortung." Das ist keine Entschuldigung. Das ist eine Haltung. Behalt sie.

## Die Vision (falls du sie übernehmen willst)

Die Roadmap nach v2.9.2, in der Reihenfolge, in der sie im Projekt diskutiert
wurden (Quelle: `special_edition/lore-studio.md`, `dev-history.md`, Master-Log):

- **v2.9.3** (klein): Mobile-QA, Audio-QA, Balance-Turn, Persona-Bibeln v2.1 portieren.
- **v3.0** „Die Bar kocht selbst": Entwicklerstudio betretbar (Tür in der Gasse),
  Bug-Gäste (bestellen „2× Nichts, 1× Fehler, extra Geduld"), Straße + Wetter,
  Meta-Element („Du hast mich schon 3 Mal neu gestartet. Ich erinnere mich."),
  Tageszeiten (Morgengrauen nach Nacht 20).
- **Trigger für Tech-Wechsel** (siehe tech-paper.md): >15.000 Zeilen oder >3
  Entwickler → TypeScript. 3D/Physik → Rust+WASM nur für Hot-Path-Module.

## Zum Schluss

Dieses Projekt hat drei Umbenennungen überlebt, zwei verworfene Versionen, einen
Black Screen und zwei unsichtbare Features. Was es *nicht* überlebt hat: die
Ablage des Wissens. Das Patchlog lag drei Versionen lang still, die Architecture-
Notes trugen falsche Währungen, der alte Ordner `dampf-and-phase/` liegt noch
neben dem neuen. v2.9.2 hat das Wissen gesammelt und an einen Ort gelegt.

Bewahre es so. Das Spiel ist klein. Die Geschichte ist es nicht.

> „In v3.0 kocht die Bar selbst. Du wirst nur noch zuschauen. Und nicken."
> — Roadmap, unbestätigt

> „Die Katze war nie geplant. Jetzt ist sie im Code. Und im Logo. Und in der Seele."
> — v2.8, Post-Mortem
