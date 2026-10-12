# NUDELBAR — QA-Checkliste

**Wann:** Vor jeder größeren Änderung, nach jeder Änderung, vor jedem Release.
**Goldstandard:** Die drei automatischen Checks sind Pflicht. Der Rest braucht
Menschen mit Augen, Ohren und Fingern — der Prüfer (KI) konnte davon nichts.

## 1. Automatisch (maschinell, Pflicht)

```bash
node tests.js           # → 248 passed, 0 failed   (v2.9.2.5)
node sim.js             # → Sieg-Rate 25/25        (v2.9.2; Ziel v2.9.3: 60–80 %)
node tools/dom-check.js # → DOM-Vertrag: OK
```

- [ ] Alle drei grün, **vor** der Änderung (Ausgangsbasis)
- [ ] Alle drei grün, **nach** der Änderung
- [ ] Bei Kern-Änderung: Determinismus-Spotcheck (gleicher Seed zweimal →
      gleiche Zahlen in sim.js)
- [ ] Bei UI-Änderung: dom-check hat die neue `id` gesehen (sonst ist das
      Feature tot — v2.9.2 hat das zweimal erlebt)

## 2. Visuell (Browser, Mensch mit Augen)

*Stand: nie von einem Menschen gespielt (MANIFEST, Punkt 1).*

- [ ] **Titelbildschirm** sichtbar (Canvas, NUDELBAR-Logo, Katze, Menü)
- [ ] Titel-Menü: „Schicht beginnen" / „Intro ansehen" / „Stammgast-Chronik"
- [ ] **Intro** (3 Szenen) vollständig, kein Haken am Ende
- [ ] **Setup:** Barname, Chef-Emoji, Preis, Seed — alles klickbar/typbar
- [ ] **Menü-Button (☰)** in der Topbar sichtbar + klickbar
- [ ] Menü-Inhalt: Ton, Musik-Lautstärke, Sprache (DE/EN), Titel-Track 1–5,
      Zurück zum Titel, Lizenz-Block
- [ ] **Aim-Linie:** bei aufgebauter Schüssel gestrichelte Flugkurve + Pulsring
- [ ] **Partytime** (4+ Gäste): Mützen 🎩, Konfetti, Fanfare, Party-Sprache
- [ ] **Sprechblasen:** Bestellung (Mini-Schüssel + „PREIS: X €"), Sims-Blase,
      Reaktions-Label (BEGEISTERT/ZUFRIEDEN/ÜBERRASCHT/MURRKOPF/BLEIBT SITZEN),
      Gossip
- [ ] **Gast-Dialog (v2.9.2.4 neu kalibriert):** kommt jetzt **selten**
      (max. alle ~45 s, ~2–4 pro Nacht). Prüfen: fühlt sich jeder Dialog
      an wie ein echtes Gespräch? Antworten sind in zufälliger Reihenfolge —
      warm/flach/kalt erkennbar? Reaktion des Gasts sichtbar?
- [ ] **Katze:** taucht (selten!) auf, bleibt, geht
- [ ] **Bug-Gast (v2.9.2.5):** kommt in Nacht 10 (Sek. ~40), tippt am Laptop
      mit Sticky-Note „TODO: v3.0", geht nach ~60 s — fühlt sich an wie ein
      Moment, nicht wie ein Fehler
- [ ] **Bürozeit:** Einkauf, Upgrades, Skills, Preis, Angestellter,
      „Nächste Nacht"-Button — alles lesbar und funktionsfähig
- [ ] **Feierabend:** Score, Chronist-Report, End-Text — Endscreen bleibt,
      bis der Spieler klickt (kein Auto-Dismiss)
- [ ] **Abzeichen (v2.9.2.3 neu):** „🏅 Abzeichen"-Zeile am Endscreen —
      verdiente zeigen Name + Nacht, unverdiente „🔒 ???". Im Spiel: die
      „🏅 Abzeichen:"-Logzeile flackert im Ticker, wenn eins fällt
- [ ] Sprache DE ↔ EN: keine toten Strings, keine Mixtexte
- [ ] Controller: ⬅➡/A/X/Y/B/Start (falls verfügbar)

## 3. Audio (Mensch mit Ohren + Kopfhörern)

*Stand: gebaut und angelaufen, nie gehört (MANIFEST, Punkt 2).*

- [ ] **Stem 1 (Ambient):** Shamisen-Drone läuft, stört auf Dauer nicht
- [ ] **Stem 2 (Walzer):** blendet ein, wenn Gäste da sind — und: ist der
      Threshold „≥ 1" oder „≥ 2" gewollt? (Kopfzeile audio.js vs. Code:
      Diskrepanz dokumentiert in `AUDIO.md`)
- [ ] **Stem 3 (Peak):** wird bei Combo 5+ / Rush hörbar — Taiko gegen Walzer,
      Lautstärke im Mix
- [ ] **Titel-Tracks 1–5** durchhören → **Default-Track entscheiden**
      (aktuell 1 „City Pop") → Eintrag in `AUDIO.md` + `titleTrack` in app.js
- [ ] **SFX-Liste abhaken:** Cook, Throw, Door, Happy, Angry, Slurp, Coin,
      Upgrade, Party, Phase, Click, Think, Phone, Bad, ZenJiru, Dispatch —
      alle hörbar, keine Overlaps, die stören
- [ ] iOS-Safari: erster Touch startet Audio, danach läuft alles
- [ ] M (Mute) + Menü-Lautstärke wirken tatsächlich

## 4. Mobile (Mensch mit echtem Gerät)

*Stand: nie geprüft (MANIFEST, Punkt 3). Details + Protokolltabelle: `MOBILE.md`.*

- [ ] Titelbildschirm sichtbar (0×0-Bug-Klasse)
- [ ] Touchpad greifbar (Buttons ≥ 48 dp), Aim per Touch verständlich
- [ ] Porträt-Modus: spielbar oder nicht? → Entscheidung dokumentieren
- [ ] Landscape-Modus: HUD/Topbar/Ticker lesbar, safe-area (Notch) ok
- [ ] 60 fps (Mittelklasse-Handy, Chrome DevTools Remote)
- [ ] Shop-Overlay auf kleinem Screen scrollbar

## 5. Balance (nach Änderungen an CONFIG)

- [ ] `node sim.js`: Siegrate im Zielbereich (60–80 %)
- [ ] **2–3 Menschenkampagnen** zu 20 Nächten gespielt (Stress, Raids, Fritteuse)
- [ ] Entscheidung + Begründung in `BALANCE.md` (Log der Balance-Entscheidungen)
- [ ] Patchlog-Eintrag

## 6. Release (vor Zip/Tag)

- [ ] PATCHLOG.md: Eintrag **mit der Version** geschrieben (nicht später)
- [ ] Versions-Header überall (README, index.html, core.js, app.js, audio.js)
- [ ] MANIFEST.md: Inhalt, offene Punkte, Prüfsumme neu
- [ ] ROADMAP.md: Version abgeschlossen abgehakt
- [ ] todo.md: erledigte Punkte verschriftet, neue Punkte eingetragen
- [ ] `git add -A && git commit` + `git tag v2.x.y`
- [ ] (Optional) Zip + SHA-256-Sidecar, wie bei v2.9.2

## Das Nein-Verzeichnis (QA-Dinge, die nicht sein dürfen)

- „Es klingt gut" — ohne Ohrprotokoll
- „Läuft auf Mobile" — ohne Gerät
- „Ist doch nur Kosmetik" — Kosmetik, die den Kern-State liest, ist deterministisch
  testbar und wird getestet (Partytime ist das Vorbild)
- „Das war schon immer so" — v2.9.2 hat gezeigt, dass „immer" auch „seit v2.9
  und unsichtbar" heißen kann
