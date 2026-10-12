# NUDELBAR — Todo (Stand: v2.9.2, Außenprüfung)

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
