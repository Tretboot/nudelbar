# NUDELBAR — Patch- und Update-Historie

> Vollständiges Protokoll aller Änderungen. Neueste zuerst.
> Der Arbeitsname „DAMPF & PHASE“ (leider) ist mit v2.5 beerdigt; der Ordner hieß bis
> dahin `dampf-and-phase/`. Die Vita des sichtbaren Barnamens: „NUDELBAR“ (v2.2/2.3) →
> „PHASE VOLL“ (v2.4) → **„NUDELBAR“** (v2.5, *fertig*, *einfach*, *simpl*).
> v2.9.2 wurde von einem **externen Prüfer** nachgeführt, nachdem das Patchlog drei
> Versionen lang nicht mitgegangen war. Das ist kein Scherz. Das ist der Hauptfund.

---

## V2.9.2 — „Der Prüfer kam“ (Aktuell)

**Status:** Vertical Slice · 130/130 Tests · Bot 25/25 · MIT-lizenziert · Paket für ein
neues Team. Ein externes KI-Modell hat die Codebase geauditet, zwei verdeckte Bugs
aufgedeckt, repariert und das Projekt verpackt.

### Die zwei Bugs, die ihr nicht sehen konntet (und ich auch erst im Code)

1. **Der Titelbildschirm war unsichtbar — und zwar *seit v2.9*.** Das Canvas wohnt in
   `#game`, und `#game` startet mit der Klasse `hidden`. Ein Element mit `display:none`
   hat eine `clientWidth` von 0. Also maße `fitCanvas()` 0×0, zeichnete den
   Titelbildschirm auf ein unsichtbares 0×0-Rechteck, und das Spiel zeigte… den Start-
   Screen (v2.3-UI) von vorne. *Das neue Hauptmenü existierte. Es war einfach 0 mal 0.*
   **Fix:** „title-mode“ — wenn kein Spiel aktiv ist, wird `#game` sichtbar, aber ohne
   Topbar/Ticker (`#game.title-mode #topbar/#ticker {display:none}`). Der Start-Screen
   wird erst von der Menü-Auswahl „Schicht beginnen“ geöffnet.
2. **Der Menü-Button war tot — und zwar *nie* lebendig.** `app.js` referenzierte
   `$('btn-menu')`, aber das `id="btn-menu"` **gab es nie im index.html** (dieselbe
   Fehlerklasse wie der v2.4-Black-Screen mit `#btn-shop-next` — nur leiser: kein Crash,
   nur ein Feature, das existiert, aber niemand finden kann). **Fix:** Button in die
   Topbar + neue Versicherung: `tools/dom-check.js` und **Test 42** (DOM-Vertrag) —
   jede `$('id')`-Referenz muss ein Element im HTML haben. Beides hätte v2.4 *und* v2.9
   gefangen.

### Bug 3 (leise): Der Peak-Stem war eine Phantasie

Die iMUSE-Architektur (Stem 1 Shamisen / Stem 2 Walzer / Stem 3 Peak bei Combo 5+) war
gebaut, aber `_scheduleStem3()` **lief nie an** — `startAmbience()` rief nur Shamisen
und Walzer. Und wenn er gelaufen wäre, hätte er sich den gemeinsamen `nextNoteTime`-
Zeiger mit dem Walzer geklaut (drei Scheduler, ein Zeiger = drei Lügen). **Fix:**
eigener `stem3NextTime`, Laufwerk in `startAmbience`, Noten nur wenn `stem3Target`
aktiv. Der Peak ist jetzt echt. (Ich konnte ihn hier nicht hören — das ist ein
Menschenauftrag. Siehe `MANIFEST.md`, offene Punkte.)

### Neu: Partytime im Kern (und warum)

Die Partytime (4+ Gäste → Mützen 🎩, Konfetti, Fanfare) stand in v2.5 **im Frontend**
mit `Math.random()` — unsichtbar für Tests und Sim, und das Frontend weiß nicht, was
der Kern weiß. In v2.9.2 ist der Trigger **deterministisch in `core.js`**
(`PARTY_GUESTS: 4`, `PARTY_CHANCE`, `PARTY_DUR`), mit eigener Party-Sprache (8 Gäste-
Zeilen + 2 Chef-Zeilen im KAWAII-Block) und Ticker-Log. Tests 39–41 decken Trigger,
Ablauf und Pools ab. Die Kosmetik (Konfetti, Hüte) liest den Kern-State.

### Neu: Aim-System wird sichtbar

Seit v2.9.1 wirft die Schüssel zu dem Gast, den die Maus anvisiert. Das war
unsichtbares Wissen. Jetzt zeichnet der Renderer eine **gestrichelte Flugkurve** zur
Zielschüssel + Pulsring um den Gast, während die Schüssel aufgebaut ist. Man sieht,
wohin man wirft, bevor man wirft.

### Menü: Über-Block (MIT)

Im Einstellungen-Menü: Lizenz-Block. „Lizenz: **MIT** (siehe LICENSE). **Für diese
Kunst übernimmt niemand Verantwortung.**“ + Zitat: *„Kein Build-Step. Kein npm. Kein
‚läuft bei mir‘. Nur Nudeln.“ — Lead Developer, Tech-Paper v2.9.*

### Weitere Fixes & Hygiene
- Sprechblasen: „PREIS: 8 €“ statt nacktem „8 €“ (war zu dezent).
- `index.html`: Zielwerte 2400/50 → **3000/55** (passiert `CONFIG`), Hilfe um Menü-Zeile,
  Credits-Zeile auf V2.9.2.
- Alle Datei-Header normalisiert auf v2.9.2 (waren v2.3/v2.6/v2.8/v2.9 verstreut).
- `sim.js`-Output: „Da“ → „€“ (Währungs-Fossil aus v2.2).

### Neue Checks (die Versicherung)
- `tools/dom-check.js` — DOM-Vertrag (45 Referenzen / 48 Elemente, jetzt alle verbunden).
- **Test 42** — derselbe Vertrag, aber *in* der Test-Suite (läuft mit `node tests.js`).
- **Tests 39–41** — Partytime (Trigger, Ablauf, Pools).
- Gesamtpaket: 122 → **130 Tests**.

### Doku & Paket (für die Nachwelt)
- `LICENSE` (MIT + Sonderklausel).
- `POSTMORTEM.md` — persönliches Protokoll des Prüfers.
- `MANIFEST.md` — Inhalt, Prüfsummen, Zustand, offene Punkte für das neue Team.
- `special_edition/the-audit.md` — Aufsatz über diese Außenprüfung.
- `special_edition/handover-next-model.md` — Anweisungen für das nächste Modell.
- `PATCHLOG.md` nachgeführt: **v2.7, v2.8, v2.9, v2.9.1** (siehe unten — sie waren
  drei Versionen lang unaufgeschrieben).
- **Zip:** `nudelbar_v2.9.2.zip` — das Übergabepaket.

### Offene Punkte (bewusst offen, für das nächste Modell / einen Menschen)
- Visuelle QA im echten Browser (Titel, Menü, Party, Aim-Linie) — hier nur per Code,
  Tests und DOM-Vertrag verifiziert.
- Mobile-Layout (Porträt) — nie von einem Menschen geprüft.
- Audio-Mix per Ohr (Peak-Stem-Lautstärke, Titel-Track-Auswahl 1–5).
- `app.js` ist 1.500+ Zeilen — der Tech-Paper-Refactoring-Plan (Trennung in
  render/input/ui) steht in `special_edition/tech-paper.md`.

---

## V2.9.1 — „Laute Nacht“

**Status:** Vertical Slice · 122/122 Tests · Bot 25/25.

- Audio-Balance: Ambience 0.14 → 0.28, Walzer ab **1** Gast (vorher 2), Shamisen-
  Lautstärke 0.5 → 0.7, Titel-Musik 0.35 → 0.45.
- **Musik-Lautstärke-Regler** im Menü (eigener Music-Bus, `setMusicVolume`).
- **Aim-System:** `serveBowl(state, targetSeat)` — die Schüssel fliegt zum Gast, den
  die Maus anvisiert (vorher: immer der älteste Wartende). 5 Call-Sites angebunden.
- Sprechblasen größer: Order-Bubble 92×54 → 110×64, Text 13 → 16px.

*Postskriptum des Prüfers (v2.9.2):* Der Aim-Code ist gut, war aber unsichtbar —
siehe Aim-System oben. Und der Menü-Button, den v2.9.1 „ausbaute“, referenzierte ein
HTML-Element, das es nie gab. v2.9.2 hat ihn gebaut.

---

## V2.9 — „Audio, Intro & Seele des Interfaces“

**Status:** Vertical Slice · 122/122 Tests · Bot 25/25.

- **iMUSE-Light (3 Stems):** Shamisen-Ambience (immer) / Walzer-Akkorde (guest-gated) /
  Peak-Arps+Taiko (combo/rush-gated). Alle synthetisch, kein Asset. *(Der Peak kam laut
  v2.9.2-Prüfung nie zum Läufen — fixiert in v2.9.2.)*
- **5 Titel-Tracks** (City Pop, Neon Rain, Dashi, Concrete, Morning) — im Menü
  auswählbar (Taste 1–5 / Button).
- **Anime-Intro** (`js/intro.js`, 3 Szenen): isometrische Skyline, 180 Regenpartikel,
  Ground-Splashes, Neon-Flicker, Scanlines + Dither, Nudelschale mit Dampf,
  isometrische Küche, Kelle mit Guss-Strahl. Typewriter-Text, Fade, Skip.
- **I18N DE/EN** (Taste L) für HUD, Shop, Titel, Pause.
- **UI-Overhaul:** Titelbildschirm (Canvas-Render), Einstellungen-Menü (☰),
  Währung **Euro** (€) statt „Da“ (Dampf-Dollar, aus v2.2 — die letzte Umrechnung
  war zu komplex, also: Euro).
- **Lorebook** (12 Einträge N1→N20): versteckte Entwicklungsgeschichte, LLM-Studio-Witz
  (Sonnett/Mammut/Commander/Haiku), Gast-Lore-Platzhalter, YouTube-Ref (ubgC7YKWPgs).
- Code schlanker: `lerp`-Duplikat + `renderIdle` entfernt.

*Postskriptum des Prüfers (v2.9.2):* Das Intro ist gut. Es lief nur auf einem
0×0-Canvas. Der Menü-Button war nur in app.js. Beides fixiert. Das Feature-Set selbst
ist intakt.

---

## V2.8 — „Kawaii & Seele“

**Status:** Vertical Slice · 122/122 Tests · Bot 25/25.

- **KAWAII-Block** in `core.js`: 11 Text-Pools (Katze, Angestellter, Chef-Gedanken,
  Dialoge, Skills, Deko, Seele) — zentrale Textquelle, keine verstreuten Strings.
- **Glückskatze** (ab Nacht 2, zufällige Besuche, verlängert sich durch Skill).
- **Angestellter** (einmalig kaufbar, 150 €): serviert automatisch, 15 % Fehlerquote.
- **Dialog-UI** (Gast fragt → 2 Antwort-Buttons, Timeout) + **Skills** (Kauf-System).
- **4. + 5. Brühe/Topping-Slots** (Chashu, Zwiebel; Spicy-Brühe freigeschaltet).
- **Chef-Gedanken** (Monolog in ruhigen Momenten, wenn der Laden leer ist).

*Prüfer-Hinweis (v2.9.2):* Die Versions-Labels im Code sind hier historisch unruhig
(der Lorebook- und die `dev-history.md` datieren die Katze auf v2.6, die Code-Kommentare
auf v2.8). Die Code-Kommentare gelten als maßgeblich; die Lore-Dokumente sind
*in der Spielwelt* geschrieben und dort erlaubt. v2.7 hat keinen eigenen Eintrag
überliefert — die Dokumentation lückte, bis v2.9.2 sie nachpflegte.

---

## V2.7 — „Die Lücke“

**Status:** nicht überliefert.

In diesem Patchlog, im Master-Log und in der Special Edition gibt es keinen Eintrag
für v2.7. Der Code enthält keine v2.7-Kommentare. Was zwischen v2.6 (Lebendiger Laden)
und v2.8 (Kawaii & Seele) geschah, weiß nur noch der `dampf-and-phase/`-Ordner, der
neben diesem Projekt liegt — er ist allerdings der v2.6-Stand.

*Prüfer-Befund (v2.9.2):* Wahrscheinlich wurde v2.7 als Zwischenstand getaggt, ohne
Dokumentation (oder war ein Tag, der nie ausgeliefert wurde). Bewusst nicht erfunden —
ein externer Prüfer erfindet keine Geschichte. Für die Nachwelt: wenn jemand das
Git-/Datei-Log hat, möge er diese Lücke füllen.

---

## V2.6 — „Lebendiger Laden“

**Status:** Vertical Slice · 122/122 Tests · Bot 25/25 · Dialoge verdoppelt.

### Tempo: Der Laden atmet jetzt
- **Warten 4× länger** (Geduld 22→88 s) — Gäste treffen sich endlich; Gossip,
  Stimmung und Partys haben Raum.
- **Alles andere 2× langsamer:** Essen, Schlürfen, Rein-/Rausgehen, Karte,
  Servierflug, Fritteuse, Bürozeit, Nacht (120→240 s).

### Brühen, die man nicht mehr verwechselt
Tonkatsu **Orange**, Shoyu **Braun** (Soja — war fast wie Miso), Miso **Gelb**,
Spicy **Rot**. Vier Farben, vier Brühen, kein Rätselraten.

### Stayer: Gäste, die den Abend bleiben
- Stammis/Begeisterte **bestellen nach dem Essen noch mal** (bis zu 3×) und
  bleiben den Abend.
- **Anklicken = wegschicken** (🚪-Badge) → **−2 Rep** (Platz braucht man).
- **Bleibt er die ganze Nacht → +2 Rep** am Nachtende.
- Deterministisch im Kern (`dismissGuest`, `stayer`, `reorders`).

### Der Koch bewegt sich
Humpelt jetzt **zum Zapfhahn**, wenn du Brühe gießt (Hop-Animation mit Wackeln).

### Öffnung
Länger (5 s) + **Neon-Flicker** auf „… IST GEÖFFNET".

### Dialoge: verdoppelt & vertieft
Alle 7 Personas haben jetzt **8–10 Zeilen pro Stimmung** (vorher 5). Neue
Kunden-Gesprächs-Pools: **Intro** (Gast kommentiert Neuankömmling), **Stayer**
(Bleiber plaudern), **Re-Order** (zweite Schüssel). Alles in **einer zentralen
Datei** (`js/core.js`, `DIALOGUE`-Objekt) gebündelt — keine 20 kleinen Dateien
mehr, die das API-Limit sprengen.

### Balance
Ziel auf **3000 Da / 55 Rep** angehoben (Sim war nach dem Verlangsamen zu leicht).

---

## V2.5 — „NUDELBAR, fertig“ (aktuell)

**Status:** Vertical Slice · 116/116 Tests · Bot 25/25 · endlich wieder spielbar.

### Der Black-Screen — und wie man ihn heilte
Nach v2.4 sah der Spieler nach dem Start einen schwarzen Bildschirm. Danke für den
Bug-Report, das hat sehr geholfen.

**Ursache (Klassiker, fast zu schön um wahr zu sein):** In v2.4 wurde in `app.js` ein
`addEventListener` auf `#btn-shop-next` eingebaut — aber der HTML-Edit für genau
dieses Button-Element hatte *still* nicht durchgezogen (ein fehlendes Platzhalter-
Muster hatte das komplette HTML-Skript abbrechen lassen). Ergebnis: `el.btnShopNext`
war `null`, `init()` starb mit `TypeError: Cannot read properties of null` — und
weil `init()` dabei `requestAnimationFrame` nie erreichte, wurde **nichts** gerendert.
Schwarzer Bildschirm. Der Chronist hat es nicht einmal mitbekommen.

**Fix (drei Lagen, wie es sich gehört):**
1. `index.html` sauber neu geschrieben — `#btn-shop-next` existiert jetzt wirklich.
2. `bindInput()` referenziert den Button defensiv (`if (el.btnShopNext)`).
3. `init()` läuft den UI-Aufbau in einem `try/catch` und startet den Render-Loop
   **unabhängig davon** (Black-Screen-Schutz für die Ewigkeit).

*Lessons learned:* Wenn ein UI-Edit sagt „OK“, aber der nächste `grep` sagt „na ja“,
glaubt man dem grep. Außerdem: ein Render-Loop, der von UI-Elementen abhängt, ist
wie eine Nudelbar ohne Wasserhahn — technisch möglich, praktisch falsch.

### Umbenennung: NUDELBAR, fertig. Einfach. Simpl.
Der Name „PHASE VOLL“ aus v2.4 hat die Playtester nicht überzeugt. Also heißt das
Spiel jetzt einfach **NUDELBAR**. Keine Diskussion mehr. (Die komplette
Umbenennungs-Historie — NUDELBAR → PHASE VOLL → NUDELBAR — ist nun dokumentiert.
Der Chronist hat dafür eine eigene Spalte im Master-Log angelegt: „Namen, die
nicht hielten“.)

- Ordner: `dampf-and-phase/` → **`nudelbar/`**, Zip: **`nudelbar_v2.5.zip`**
- Default-Barname, Platzhalter, Topbar, Neon-Schild, Sieg-Texte, Tests, Sim — alles **NUDELBAR**
- Titel: „NUDELBAR 🍜 — Nudelbar an der Naht“

### 🎉 Und dann passierte Folgendes: PARTYTIME
Während der Black-Screen-Reparatur (es war frustrierend, man muss das verstehen)
wurde aus Frust — ja, *aus Frust* — ein neues Feature implementiert, das wir
eigentlich übersehen hatten: **PARTYTIME.**

> **Sind 4 oder mehr Gäste gleichzeitig im Laden, erklärt die Nudelbar die Party.**
> Jeder Gast und der Koch bekommen eine schwebende Partymütze 🎩, aus dem
> Fensterbereich fällt farbiges Konfetti, eine kleine WebAudio-Fanfare
> (C–E–G–C′–h′) spielt, und im Ticker steht: *„🎉 Party in der Nudelbar —
> alle tragen Mützen. (Warum? Kein Kommentar.)“*

Warum ist das cool? Weil es **Kosmetik ohne Regelwerk** ist: Kein Gameplay-Einfluss,
keine Balance, kein Tuning — einfach ein Moment, in dem der Laden *feiert*, weil er
voll ist. Das Gefühl, eine geschäftige Nudelbar zu führen, in einem Feature.
Es ist die belohnendste Sache, die in v2.5 passiert, und sie war ein Unfall.
Die Party dauert 6 Sekunden und kann nicht gestacked werden. Der Chronist
verweigert dazu jede Stellungnahme.

**Technisch:** `party {active, t, dur}` im App-State (reine Optik, kein Kern),
Trigger in `tickGame` (4+ Gäste, kleine Zufallsschwelle pro Frame → maximal alle
~2 s neu), Mützen auf `drawGuest` + `drawChef` mit Sinus-Wackeln, Konfetti-Partikel
im bestehenden Partikelsystem, `sfxParty` in `audio.js`.

### Sonstiges
- Defensive DOM-Referenzen im Frontend (UI-Fehler killen nie mehr den Loop).
- Doku-Refresh: README, architecture, master_log, todo — alles auf NUDELBAR/v2.5.
- Tests & Sim mit neuen Header-Namen; 116/116 grün.

---
## V2.4 — „Leben im Laden“

**Status:** Vertical Slice · 116/116 Tests · Bot 25/25 (Ø Nacht 13.6/20)

### Umbenennung
- In-Game-Name: **„NUDELBAR“ → „PHASE VOLL“** (Default-Barname, Topbar-Default,
  Platzhalter, Sieg-Texte). Dokumentiert in README + `master_log.md`.
- Projekt-Arbeitsname „DAMPF & PHASE“ bleibt. Finaler Spielname offen (siehe todo.md).

### Kern (`js/core.js`)
- **Chef-Stimmung:** `chefMood {emoji, t}` — bei Fehlschlag 😬, bei Begeisterung 😄,
  bei Pech-Überraschung 🤯, bei Walkout 😅, bei leerer Schüssel 😋. Frontend zeigt
  das Gesicht am Koch-Kopf (mit leichtem Wackeln).
- **Variable Ess-Tempos:** Jede Persona hat `eat` (0.75×–1.5×). Essen dauert jetzt
  pro Gast unterschiedlich lange.
- **Auslöffeln (`sipping`):** `finisher` wird beim Servieren gewürfelt
  (persona-`cleanBowl`, Heißhunger 0.8 … Kritiker 0.2). Bei `clean`: Gast schläft
  die Schüssel an (SIP_TIME, ±30 %) und gibt sie **komplett leer** zurück →
  `CLEAN_BONUS` (+3 Da) + Statistik `stats.cleanBowls`.
- **Bleiber (`lingering`):** Nach dem Essen bleiben Gäste mit einer Chance
  (Basis 8 % + Stammgast 40 % + Begeisterung 25 % + Pech 20 % + Persona-`lingerBias`)
  LINGER_MIN–SPREAD Sekunden weiter sitzen, mit eigener Sprüche-Pool
  („…sonst muss ich wieder zur Arbeit“). Statistik `stats.lingers`.
- **Mood-Contagion:** Begeisterte/Pech-Mahlzeit hebt die Laune aller wartenden
  Gäste (`moodBonus` +6, Cap 12, Chance 0.35) — sie reagieren später besser,
  selbst ohne eigenes Essen. Frontend: 💚 über dem Gast.
- **Gäste-Gossip:** Bei 2+ Gästen entsteht Smalltalk (neutral); nach guter
  Mahlzeit wird ein anderer Gast positiv empfohlen („Das war wirklich lecker!“),
  nach Fehlschlag gewarnt („Der hat den Laden komplett nicht im Griff, lauf
  schnell weg!“) + Reaktions-Pool (🤣😅). Feld `guest.chat {text, t}`.
- **`startNextNight(state)`**: setzt `phaseClock = BETWEEN_DURATION`. Damit der
  manuelle Shop-Button die Welt durchlässt, ohne den Bot/Sim zu blockieren.
- Reaktions-/Gossip-Blasen leben länger; `HAPPY_LEAVE` 1.1 → **1.6 s**
  (zufriedene Gäste gehen sichtbar langsamer, mit Hoppsen).
- `PERSONAS` bekommen die Felder `eat`, `cleanBowl`, `lingerBias`.

### Frontend (`js/app.js`, `index.html`, `style.css`)
- **24 Chef-Emojis** wählbar (😶 😁 😎 🤓 🧐 😋 🥸 👨‍🍳 🧙‍♂️ 🤖 👽 🐱 🐻 🐸 🐼 🦊 🐵 🐨 🐧 🦄 🐷 🐯 🦁 🐹).
- Startbildschirm: **WIP-Badge** („VERTICAL SLICE · ERSTER PROTOTYP · SPIELTEST“).
- **Bürozeit pausiert** jetzt den Laden; neuer Button **„🌙 NÄCHSTE NACHT BEGINNEN“**
  (+ Enter/Start). Kein auto-Countdown mehr (`shop-countdown` entfernt).
- **Endscreen bleibt stehen**, bis der Spieler weiterklickt (vorher: weg nach ~4 s).
- Rendering: Schlürf-Animation (kippende Schüssel, 💧), Schüsselinhalt wird beim
  Essen sichtbar weniger, Bleiber-💺-Floater, Chat-Blasen (lila), 💚-Mood-Indikator,
  Reaktions-Blase über alle Stufen sichtbar (Essen → Schlürfen → Bleiben → Rausgehen).
- Neues SFX: **sfxSlurp** (WebAudio).
- Feierabend-Statistik: + „Leere Schüsseln 🍜“, + „Bleiber 💺“.
- Controller/Keyboard: Start/Enter in der Bürozeit = „Nächste Nacht“.

### Tests / Sim
- `tests.js`: 100 → **116** (neue Gruppen 28–35: Chef-Mood, startNextNight,
  Schlürfen, Bonus-Exakt, Bleiber, Contagion, Gossip, Chronist-Report v2.4).
- `sim.js`: meldet jetzt Ø leere Schüsseln & Bleiber (Bot: 66 / 60).
- **Balance:** Bot gewinnt 25/25, Ø 124 bedient / 10 verloren — für Bot-Optimierung
  leicht, für Menschen (Stress, Raids, Fritteuse) deutlich härter.

---

## V2.3 — „Tapper mit Leben“

- Start-Setup: Bar-Name (Neon oben), Chef-Emoji (8), Preisstufe
  (Billig/Standard/Exklusiv → Preise, Trinkgelder, Frequenz, Geduld), Seed.
- Intro: aufsperren → Tür auf → Chef läuft rein → Geräte an → Schild.
- Gäste wandeln: Tür → **Speisekarte** → **Sims-Blase** → Theke.
- Fehlschlag: **Schüssel fliegt mit Physik** durch den Raum (Shake + Partikel),
  wütender Gast hüpft ab; zufriedene Gäste gehen **freudig hoppsend** raus.
- **Verzeihung:** `FORGIVE_BASE` + Persona-`forgiving` + Ähnlichkeit → Gast isst
  die falsche Schüssel trotzdem („Glaub, das hab ich nicht bestellt — aber KRASS!“).
- **Stammgäste** (⭐) mit wachsender Rep; **Raids** (Wandergruppe/Schule/Familie).
- **Einkauf** in der Bürozeit (Zutaten mit Preis), Upgrades, Preis-Umschalter.
- **Feierabend:** Score-Tally + **Chronist-Report** (beste/ härteste Sprüche,
  häufigster Fehler, bestes Gericht, größtes Trinkgeld).
- Controller, Touchpad (mobil), Tooltips überall, CRT-Ästhetik, SFX-Erweiterungen.
- Tests: 81 → 100. Bot: 25/25 (v2.2: 23/25, Bot kauft jetzt ein).

---

## V2.2 — „Tapper-Ramen“ (Retrofit nach Playtest)

- Kompletter Neustart der Spiel-Schleife nach „nicht fun to play“-Feedback:
  Bestellung ansehen → passende Schüssel bauen → werfen. Keine Gesprächs-Gates.
- Canvas-2D-Rendering (Raum, Theke, Küche), 8 flache Personas mit Spruch-Pools,
  Geduld-Ring, Combo, Fritteuse-Vorrat, 6 Events, Upgrades, 20 Nächte.
- Tests: 79 → 81. Bot: 23/25.

---

## V2.1 — „Gesprächs-Counter“ (verworfen)

- 8 Personas mit Bibeln (`content/personas/`), Gesprächs-Loop
  (fragen → warten → reagieren), `design/conversation-design.md`.
- 79/79 Tests, 61 KB ausgeliefert. Playtest: zu abstrakt, nicht intuitiv spielbar
  → auf Tapper-Pivot in v2.2.

---

## V1.0 — „Bei Hai & Dampfglühen“ (verworfen)

- Liefer-Logistik-Kern (7 Wochen, Naht-Blätter alle 90 s, Fahrer, Telefon-Aufträge).
- 42/42 Tests, als `dampf-and-phase.zip` ausgeliefert.
- Auf Feedback verworfen: das Führen der Bar selbst sollte im Mittelpunkt stehen.

---

## Konventionen
- Versionen: `vMAJOR.MINOR`. Kern-Änderungen + Tests + Sim-Lauf gehören zusammen.
- Alle Tuning-Zahlen in `CONFIG` (Kern) — nie magische Zahlen im Flow.
- **DOM-Vertrag:** Jede `$('id')`-Referenz in `js/app.js` braucht ein Element im
  `index.html`. Geprüft per `node tools/dom-check.js` (und als Test 42 in der Suite).
  (v2.4 und v2.9 brannten beide daran.)
- **Patchlog-Disziplin:** Jede Version schreibt ihren Eintrag *mit* dem Version-Tag —
  nicht danach, wenn das Gedächtnis weg ist. (v2.7 hat das verlernt. Wir auch wieder
  gelernt. Siehe v2.9.2.)
- Nach jeder Version: `node tests.js` + `node sim.js` + `node tools/dom-check.js` + Zip.

## Namens- & Versions-Historie (vollständig)
| Version | Name | Status |
|---|---|---|
| v1.0 | „Bei Hai & Dampfglühen“ | verworfen (Logistik) |
| v2.1 | „Gesprächs-Counter“ | verworfen (spielschwer) |
| v2.2 | „Tapper-Ramen“ | Retrofit nach Playtest |
| v2.3 | Namen/Chef/Intro/Dialoge | 100/100 Tests |
| v2.4 | „PHASE VOLL“ (Umbenennung) | Black-Screen-Bug |
| v2.5 | „NUDELBAR, fertig“ (Umbenennung zurück) | Black-Screen-Fix + Partytime |
| v2.6 | „Lebendiger Laden“ | Tempo, Stayer, Zapfhahn |
| v2.7 | — | **Lücke** (siehe oben) |
| v2.8 | „Kawaii & Seele“ | Katze, Angestellter, Dialog-UI, Skills |
| v2.9 | „Audio, Intro & Seele des Interfaces“ | iMUSE, 5 Titel, Intro, I18N, € |
| v2.9.1 | „Laute Nacht“ | Audio-Balance, Aim-System, Menü-Overhaul |
| **v2.9.2** | **„Der Prüfer kam“** | **Außenprüfung, 2 verdeckte Bugs, MIT, Übergabepaket** |
