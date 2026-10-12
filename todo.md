# NUDELBAR — Todo (Stand: v2.9.2, Außenprüfung)

## Übernahme 12.10.2026 (neuer Entwickler)
- [x] **Git-Repo initialisiert** + erster Commit (`3372646`, Branch `main`, 23 Dateien)
- [x] **Tag `v2.9.2`** auf dem Initial-Commit gesetzt
- [x] **Erweiterte Dokumentation** angelegt: `ROADMAP.md`, `CONTRIBUTING.md`,
      `BALANCE.md`, `AUDIO.md`, `LORE.md`, `MOBILE.md`, `QA-CHECKLIST.md`
      (alle Fakten am Code verifiziert; Funde: 7 tote SFX, Stem-2-Gate-Diskrepanz,
      Studio-Besetzungs-Inkonsistenz — jeweils in der Doku markiert, nicht erfunden)
- [x] README/PATCHLOG/MANIFEST/`todo.md` auf den neuen Dokumentationsstand gebracht
- [x] **Entwickler-Handover dokumentiert:** ab v2.9.2.1 führt **ein einzelner
      Entwickler** (KI-Modell mit Kontinuität) das Projekt — Einträge in PATCHLOG
      (v2.9.2.1 „Entwickler-Handover"), master_log (Phase 12), POSTMORTEM
      (Nachtrag), MANIFEST (Nachtrag), `special_edition/quotes.md` (Wand)

## v2.9.2.4 — Erledigt (12.10.2026, „Tiefe Fragen")
- [x] **Dialog-Frequenz:** `DIALOG_CHANCE` 0.05 → 0.0008 + neues
      `DIALOG_MIN_GAP` 45 s → ~2–4 Dialoge pro Nacht (Playtest-Feedback:
      „zu oft, ohne Sinn")
- [x] **Dialog-Texte neu:** alle 7 Personas (gut = warm & aufmerksam,
      neutral = höflich & flach, schlecht = kalt), Widersprüche behoben
      (Katzen-Lüge, Schale-bevor-sie-da-war), alle Zeilen geprüft
- [x] **Antworten zufällig angeordnet** (nur Frontend, Kern deterministisch)
- [x] **Stem-2-Header** in audio.js passt zum Code (≥ 1); Ohr-Entscheidung
      1-oder-2 bleibt Audio-QA
- [x] Tests 50–51 (236 gesamt), Sim 25/25, DOM OK, Doku + Header nachgeführt

## v2.9.2.3 — Erledigt (12.10.2026, „Abzeichen")
- [x] **5 Kampagnen-Abzeichen im Kern** (Zen-Meister, Party-Vater,
      Kritiker-Bändiger, Katzenfreund, Makellose Nacht) — deterministisch,
      idempotent, mit „🏅"-Logzeile
- [x] **Endscreen:** „🏅 Abzeichen"-Zeile (verdient: Name + Nacht,
      unverdient: „🔒 ???")
- [x] Tests 46–49 (161 gesamt), Sim 25/25, DOM-Vertrag OK
- [x] Alle Header auf v2.9.2.3, Doku nachgeführt, ROADMAP-Notiz (Feature
      vorgezogen, v2.9.3 bleibt reine Stabilisierung)

## v2.9.2.2 — Erledigt (12.10.2026, „Die stillen Features")
- [x] **Dialog-UI wiederhergestellt** (drittes totes Feature: v2.8-System lief
      im Kern, 0 Referenzen in app.js, 0 Tests) — Panel, Timer, 3 Antworten,
      I18N, `sfxPhone`. Tests 43–45 (142 gesamt). DOM-Vertrag OK.
- [x] **7 tote SFX entschärft:** 5 verdrahtet (Think, Phone, Bad, ZenJiru,
      Dispatch), 2 gestrichen (Ready, Deliver — kein eindeutiger Trigger).
      Alle 16 SFX aktiv. Doku: `AUDIO.md`.
- [x] app.js-Header korrigiert („DAMPF & PHASE v2.3" → v2.9.2.2)
- [x] Alle Header auf v2.9.2.2, PATCHLOG/MANIFEST-Freund: Doku nachgeführt

## v2.9.3 — Stabilisierung (siehe `ROADMAP.md`)
- [ ] **Visuelle Browser-QA** (Punkt 2 der `QA-CHECKLIST.md`) — Titel, Menü,
      Aim-Linie, Party, Intro, Endscreen
- [ ] **Audio-QA** (Punkt 3): Peak-Stem, Titel-Tracks 1–5 → Default-Entscheidung,
      Stem-2-Gate klären (Header passt jetzt zum Code: ab 1 Gast — 1 oder 2
      anhören = Ohr-Entscheidung), neu verdrahtete SFX anhören
      (Think/Phone/Bad/ZenJiru/Dispatch)
- [ ] **Mobile-QA** (Punkt 4) + Porträt/Landscape-Entscheidung in `MOBILE.md`
- [ ] **Balance-Turn:** Bot-Siegrate 100 % → 60–80 %, Prozess in `BALANCE.md`
      (eine Variable pro Runde, Log der Entscheidungen führen)
- [x] **Dialog-Frequenz prüfen** (v2.9.2.4 erledigt, nach Playtest-Feedback):
      `DIALOG_CHANCE` 0.0008 + `DIALOG_MIN_GAP` 45 s. Beim nächsten Play
      noch mal fühlen — Schrauben stehen in `BALANCE.md`
- [ ] **Persona-Bibeln v2.1 portieren** (Alt-Ordner `dampf-and-phase/content/personas/`)
- [ ] **v2.7-Lücke im Patchlog füllen** (Git-/Datei-Log konsultieren — nicht erfinden)
- [ ] **Studio-Besetzung klären** (Yuki/Marco/Kofi vs. Sonett/Mammut/Commander/Haiku —
      `LORE.md`): eine Entscheidung, bevor v3.0 das Studio betretbar macht

## v2.9.4 — Struktur (Refactoring, siehe `ROADMAP.md`)
- [ ] `app.js` (1.550 Zeilen) aufteilen: `app-render.js` / `app-input.js` / `app-ui.js`
      (je < 500 Zeilen; sequenziell, nach jedem Schritt alle drei Checks grün;
      Plan: `special_edition/tech-paper.md`)
- [ ] `CONFIG` → `js/config.js` (Balance-Tuning ohne core.js)
- [ ] KAWAII/LOREBOOK → `js/lore.js` (reine Daten)
- [ ] DOM-Check um Audio-Vertrag erweitern? (tote SFX hätten ein „Audio-Check"
      verdient — Entscheidung mit dem SFX-Task)

## Sofort (nächster Spieltest — von einem Menschen, mit Ohren)
- [ ] **Visuelle QA im Browser:** Titelbildschirm sichtbar? (war 0×0 bis v2.9.2)
      Menü-Button (☰) klickbar? (existierte bis v2.9.2 nicht) Aim-Linie bei
      aufgebauter Schüssel? Partytime (4+ Gäste)? Intro (3 Szenen) vollständig?
- [ ] **Audio-QA:** Peak-Stem (Combo 5+) hörbar? Titel-Tracks 1–5 durchhören und
      entscheiden, welcher Default bleibt. Ambience/Mix-Ohrtest.
- [ ] Touch auf dem Handy: Touchpad-Größe, Canvas-Skalierung bei Porträt.
- [ ] Tempo-Feintuning, falls nötig: Essen (EAT_TIME, persona.eat), Schlürfen
      (SIP_TIME), Verlassen (HAPPY_LEAVE), Bleiben (LINGER_*). → `CONFIG`.

## Erledigt in v2.9.2 (Außenprüfung)
- [x] **Bug: Titelbildschirm unsichtbar** (Canvas in `#game.hidden` → 0×0) → title-mode.
- [x] **Bug: Menü-Button fehlte im HTML** (totes Feature) → Button gebaut + DOM-Check.
- [x] **Bug: Peak-Stem-3 lief nie an** (kein Aufruf, geteilter Zeiger) → fixiert.
- [x] Partytime in den Kern (deterministisch) + 8 Party-Sprüche + 2 Chef-Zeilen, Tests 39–41.
- [x] Aim-Linie (gestrichelte Kurve + Pulsring) — man sieht, wohin man wirft.
- [x] MIT-Lizenz + About-Block im Menü (Zitat: Lead Developer, Tech-Paper v2.9).
- [x] `tools/dom-check.js` + **Test 42** (DOM-Vertrag) — die Versicherung.
- [x] Sprechblasen „PREIS: X €"; Zielwerte 3000/55 überall; alle Header auf v2.9.2.
- [x] Patchlog nachgeführt (v2.7–v2.9.1), POSTMORTEM.md, MANIFEST.md,
      Special-Edition-Aufsatz, Übergabe für das nächste Modell.
- [x] **Zip: `nudelbar_v2.9.2.zip`** (Übergabepaket, SHA-256 im MANIFEST).

## Später (in Reihenfolge nach Aufwand, nicht nach Dringlichkeit)
- [ ] `app.js` (1.500+ Zeilen) aufteilen in render/input/ui — Plan:
      `special_edition/tech-paper.md`. Vorausetzung: 130 Tests halten die Brücke.
- [ ] KAWAII-Block → `js/lore.js`; `CONFIG` → `js/config.js` (Tech-Paper-Vorschlag).
- [ ] Balance: schwerer machen? Sim-Bot gewinnt 25/25 in Ø 6.5 Nächten.
      Schrauben: `WIN_CREDITS` ↑, `CLEAN_BONUS` ↓, `FORGIVE_BASE` ↓, `BASE_SPAWN` ↓.
- [ ] v2.1-Persona-Bibeln portieren (Alt-Ordner `dampf-and-phase/content/personas/`).
- [ ] v2.7-Lücke im Patchlog füllen (Git-/Datei-Log konsultieren — nicht erfinden).
- [ ] Highscore/Statistik-Persistenz (localStorage) — optional, bleibt offline.
- [ ] Speisekarte mit echten Preisen pro Preisstufe rendern (Alt-Todo).
- [ ] Sound: Gossip-Flüsterungen, Bleiber-Seufzer, Tür-Klingel beim Spawn (Alt-Todo).

## Erledigt in v2.5 (Historie)
- [x] **Finaler Name: NUDELBAR.** Einfach, simpel, endgültig. Ordner `nudelbar/`,
      Default-Barname, Neon-Schild. (Umbenennungs-Vita: NUDELBAR → PHASE VOLL → NUDELBAR.)

## Parked (bewusst raus)
- [ ] Echtzeit-Multiplayer, Co-op
- [ ] Mikro-Transaktionen (Prinzipien-Entscheidung: nein)
