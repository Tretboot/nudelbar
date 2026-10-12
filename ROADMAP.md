# NUDELBAR — Roadmap (Stand 12.10.2026, ab v2.9.2)

**Zweck:** Dieses Dokument ist die Quelle für „was kommt als Nächstes".
Ergänzung zu `todo.md`: `todo.md` = aktuelle Tasks, `ROADMAP.md` = Richtung und
Versionsziele. `todo.md` rotiert, die Roadmap bleibt.

> Prozessregel (aus dem Handover): Eine Aufgabe, eine Datei, ein Commit.
> Das Patchlog wird in der gleichen Aktion wie der Code geschrieben.
> Nichts erfinden — Lücken werden markiert, nicht zugeklatscht.

---

## Versionsziele

### v2.9.3 — „Stabilisierung" (klein, keine neuen Mechaniken)

**Notiz (12.10.2026):** Das Abzeichen-Feature (vom Nutzer gewählt, siehe
Ideenpark) wurde als Micro-Version **v2.9.2.3** vorgezogen — die Anti-Liste
bleibt stehen: v2.9.3 bleibt reine Stabilisierung.

**Ziel:** Den Vertical Slice getestet, balanciert und mobil-fähig machen.

| # | Aufgabe | Warum | Doku |
|---|---|---|---|
| 1 | Visuelle Browser-QA (Titel, Menü-Button, Aim-Linie, Party, Intro) | Nie von einem Menschen *erlebt* | `QA-CHECKLIST.md` |
| 2 | Audio-QA (Peak-Stem, 5 Titel-Tracks, Mix, Default-Track-Entscheidung) | Gebaut und angelaufen, aber nie *gehört* | `AUDIO.md` |
| 3 | Mobile-QA (Touchpad-Größe, Porträt-Layout) | Nie auf einem echten Gerät geprüft | `MOBILE.md` |
| 4 | Balance-Turn (Bot-Siegrate 100 % → 60–80 %) | Bot gewinnt 25/25 in Ø 6.5/20 Nächte — zu leicht für gestresste Menschen | `BALANCE.md` |
| 5 | Tote SFX entschärfen (7 definiert, nie aufgerufen — siehe `AUDIO.md`) | Gleiche Fehlerklasse wie der tote Menü-Button (v2.9.2) | `AUDIO.md` |
| 6 | Persona-Bibeln v2.1 portieren (Alt-Ordner `dampf-and-phase/content/personas/`) | Content-Lücke | `LORE.md` |
| 7 | v2.7-Lücke im Patchlog füllen (Git-/Datei-Log konsultieren — nicht erfinden) | Bekannte Lücke, bewusst offen | `PATCHLOG.md` |

**Definition of Done:** Alle QA-Punkte in `QA-CHECKLIST.md` abgehakt, Sim-Bot im
Zielbereich (60–80 %), jede Balance-Entscheidung in `BALANCE.md` protokolliert.

### v2.9.4 — „Struktur" (Refactoring, keine Verhaltensänderung)

**Ziel:** Die Codebasis wartbarer machen, ohne dass der Spieler irgendetwas merkt.

1. **`app.js` aufteilen** (1.550 Zeilen) in
   `js/app-render.js` (Canvas-Draw) · `js/app-input.js` (Key/Mouse/Touch/Gamepad) ·
   `js/app-ui.js` (Overlays, Shop, HUD, I18N) — jede Datei < 500 Zeilen.
   Plan: `special_edition/tech-paper.md`. **Sequenziell** angehen: eine Datei,
   danach alle drei Checks grün (tests/sim/dom-check), dann die nächste.
2. **`CONFIG` → `js/config.js`** — Balance-Tuning ohne `core.js` anzufassen;
   `sim.js` und `tests.js` können eigene Config-Overrides laden.
3. **KAWAII/LOREBOOK → `js/lore.js`** — reine Daten, `core.js` wird ~200 Zeilen
   schlanker; Texte bleiben deterministisch (Kern) oder werden dort referenziert.

**Definition of Done:** 130 Tests + Sim + DOM-Check grün, **kein** Verhaltenstest
bricht, gleicher Seed + gleiche Eingaben = identisches Spiel (Determinismus-Test).

### v3.0 — „Die Bar kocht selbst" (Feature-Version)

**Ziel:** Die Vision aus `special_edition/handover-next-model.md` und
`special_edition/lore-studio.md`. **Voraussetzung: v2.9.3 + v2.9.4 fertig.**

| Feature | Kern (deterministisch) | Frontend | Lore |
|---|---|---|---|
| Entwicklerstudio betretbar | — | Tür in der Gasse, 3 Schreibtische, Whiteboard mit TODOs, Katze auf dem Monitor | Studio-Besetzung klären (siehe `LORE.md`, Inkonsistenz) |
| ~~Bug-Gast (Nacht 10)~~ | **vorgezogen in v2.9.2.5** (deterministisch, bestellt nichts, extra Geduld) | Laptop, Sticky-Note „TODO: v3.0" | Lorebook-Nacht-10-Text ist jetzt im Spiel wirksam |
| Straße + Wetter | Wetter als Spawn-/Geduld-Modifier (wie EVENTS, aber andauernd) | Regen/Schnee, Neon-Reflexionen auf nassem Asphalt | „Die Stadt fröstelt. Der Dashi nicht." |
| ~~Meta-Element~~ | **vorgezogen in v2.9.2.6** (Neustart-Zähler localStorage, `restartLine` im Kern) | „Du hast mich schon 3 Mal neu gestartet. Ich erinnere mich." | Die Bar weiß, dass sie ein Spiel ist |
| ~~Tageszeiten~~ | **vorgezogen in v2.9.2.7** (`chronicle().dawn`, true nur nach 20 Nächten) | Morgengrauen-Endscreen nach Nacht 20 (Endscreen-Expansion) | Die Stadt wacht auf |

**Nicht in v3.0:** neue Preisstufen, neue Persona-Typen, Multiplayer.

### v3.5 / v4.0 — Ausblick (keine Zusagen)

- ~~Highscore/Statistik-Persistenz (localStorage, bleibt offline)~~ — **vorgezogen in v2.9.2.6** (Rekorde: Kampagnen, Siege, beste Nacht, Bediente, Combo)
- ~~Speisekarte mit echten Preisen pro Preisstufe rendern~~ — **vorgezogen in v2.9.2.8** (Overlay `#card-screen`, Taste K)
- Sound: Gossip-Flüsterungen, Bleiber-Seufzer, Tür-Klingel beim Spawn
- Content-Updates: saisonale Events, neue Brühen, neue Gäste-Typen
- **Multiplayer (Parked → neu bewerten):** Lokal-Coop (2 Spieler, 1 Bar) ist
  technisch vertretbar; Online-Multiplayer bleibt Parked.

---

## Technische Trigger (aus dem Tech-Paper — nicht vorher)

| Trigger | Entscheidung |
|---|---|
| > 15.000 Zeilen **oder** > 3 Entwickler | TypeScript (gleicher Stack, nur Typen, ES5-Target) |
| 3D-Rendering oder Physik-Engine | Rust + WASM, nur Hot-Path-Module |
| > 10.000 Zeilen (früherer Review-Punkt) | TypeScript-Überprüfung anstoßen („sinnvoll" laut Tech-Paper) |

Bis dahin: Vanilla JS (ES5), Zero Dependencies, kein Build-Step.
Begründung im Detail: `special_edition/tech-paper.md`.

## Erfolgsmetriken

| Metrik | Stand v2.9.2 | Ziel |
|---|---|---|
| Unit-Tests | 130 | 200 (bis v3.0) |
| Sim-Bot-Siegrate | 100 % (Ø 6.5/20 Nächte) | 60–80 % |
| Menschenspieler-Siegrate | unbekannt (niemand hat die 20 Nächte durchgespielt) | 25–40 % |
| Ø-Spielsession | unbekannt | 15–25 Minuten |
| Ladezeit | < 100 ms (Mittelklasse-Handy, Angabe Tech-Paper) | bleibt < 100 ms |
| FPS | nicht gemessen | stabil 60 (Chrome DevTools, Mobile) |
| Codegröße | ~5.700 Zeilen JS | < 10.000 (vor dem TS-Trigger) |

## Was wir NICHT tun (explizit)

- Mikro-Transaktionen (Prinzipien-Entscheidung, v2.5)
- Build-Step / npm (solange kein technischer Trigger greift)
- Online-Multiplayer (Parked)
- Neue Feature-Mechaniken in v2.9.3 (die Version ist Stabilisierung, keine
  Feature-Version — v2.9.2 war dasselbe, und es hat gutgetan)
- Erfinden (v2.7-Lücke, Studio-Besetzung, Audio-Eindrücke: markieren, nicht behaupten)
