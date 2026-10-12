# NUDELBAR (ehem. DAMPF & PHASE) — Master-Log

Laufendes Protokoll: was gebaut, was verworfen, was noch offen.

## Phasen
1. **v1 (verworfen):** Liefer-Logistik-Kern (7 Wochen, Naht-Blätter, Fahrer).
   42/42 Tests, ausgeliefert — dann auf Spieler-Feedback komplett verworfen.
2. **v2.1 (verworfen):** Gesprächs-gated Counter (8 Personas mit Bibeln,
   fragen → warten → reagieren). 79/79 Tests. Playtest: „spielschwer“.
3. **v2.2:** Tapper-Loop (Bestellung sehen → passende Schüssel → werfen).
   Canvas-Rendering, 81/81 Tests, Bot 23/25. Playtest: „viel viel besser“ —
   aber noch zu schnell, zu wenig Leben im Laden, Endscreen flattert weg.
4. **v2.3:** Namen/Chef/Preis im Start, Intro-Animation, wandelnde Gäste mit
   Karte+Sims-Blase, Schüssel-Flug bei Fehlschlag, Verzeihungs-Chance, Stammgäste,
   Raids, Einkauf, Chronist-Ende, Controller, Touch, Tooltips. 100/100 Tests.
5. **v2.4:** Umbenennung „NUDELBAR“ → „PHASE VOLL“, 24 Chef-Emojis, Chef mit
   Stimmungs-Gesichtern, variable Ess-Tempos, Auslöffeln (leere Schüssel = Bonus),
   Bleiber (Stammis bleiben sitzen), Mood-Contagion (💚), Gäste-Gossip, manueller
   „Nächste Nacht“-Button (Endscreen & Bürozeit blockieren nicht mehr), WIP-Badge.
   116/116 Tests, Bot 25/25. **Bug:** Schwarzer Bildschirm nach dem Start —
   fehlendes HTML-Element (`#btn-shop-next`) tötete `init()` vor dem Render-Loop.
6. **v2.5 (aktuell):** „NUDELBAR, fertig“ — Black-Screen-Fix (defensive DOM +
   try/catch-Init + HTML-Neuschreib), Umbenennung zurück auf **NUDELBAR** (endgültig),
   Ordner/Zip auf `nudelbar/` umgestellt, und aus Frust über den Bug das
   **Partytime-Feature**: 4+ Gäste im Laden → alle tragen Partymützen 🎩 +
   Konfetti + Fanfare. 116/116 Tests, Bot 25/25.

8. **v2.8:** „Kawaii & Seele" — KAWAII-Block (11 Text-Pools), Glückskatze,
   Angestellter (auto-serve), Dialog-UI, Skills, 5. Topping/Brühe-Slot,
   Chef-Gedanken. 122/122 Tests, Bot 25/25.
9. **v2.9:** „Audio, Intro & Seele des Interfaces" — iMUSE-Light (3 Stems),
   5 Titel-Tracks, Anime-Intro (3 Szenen), I18N DE/EN, UI-Overhaul (Titelbildschirm
   Canvas, Menü), Währung € statt „Da", Lorebook (12 Einträge). 122/122, Bot 25/25.
10. **v2.9.1:** „Laute Nacht" — Audio-Balance (Ambience/Walzer/Shamisen/Titel),
   Musik-Regler, Aim-System (serveBowl(targetSeat)), Sprechblasen größer.
11. **v2.9.2:** „Der Prüfer kam" — Außenprüfung: Titelbildschirm war
   unsichtbar (Canvas in `hidden`-Container → 0×0), Menü-Button fehlte im HTML
   (totes Feature), Peak-Stem-3 lief nie an. Alle drei fixiert. Partytime in den
   Kern (deterministisch), Aim-Linie sichtbar, MIT-Lizenz + About-Block, DOM-
   Verträge-Check (tools/dom-check.js + Test 42), 8 neue Tests (130 gesamt),
   Patchlog nachgeführt (v2.7–v2.9.1), POSTMORTEM + MANIFEST + Übergabe-Dokumente,
   `nudelbar_v2.9.2.zip`. 130/130 Tests, Bot 25/25.
12. **v2.9.2.1:** „Die Übernahme" — Git-Repo (Branch `main`, Initial-
    Commit, Tag `v2.9.2`), 7 neue Dokumente (ROADMAP, CONTRIBUTING, BALANCE,
    AUDIO, LORE, MOBILE, QA-CHECKLIST), Patchlog/README/MANIFEST/todo auf den
    Doku-Stand. Funde markiert (nicht repariert): 7 tote SFX, Stem-2-Gate-
    Diskrepanz (Header ≥ 2, Code ≥ 1), Studio-Besetzung (lore-studio vs.
    Lorebook-Nacht-18). Kein Spielcode geändert. 130/130 Tests, Bot 25/25.
    **Ab dieser Phase: ein einzelner Entwickler (KI, mit Kontinuität)** —
    keine Übergabe mehr pro Session; v2.9.3 (Stabilisierung) geplant,
    v2.9.4 (Struktur/Refactoring) hinterher.
13. **v2.9.2.2 (aktuell):** „Die stillen Features" — Dialog-UI wiederhergestellt:
    das v2.8-Kern-System (Gast fragt, Spieler antwortet, moodBonus ±8) hatte
    kein Frontend (0 Referenzen in app.js, 0 Tests) — der Kern antwortete nach
    12 s selbst neutral. Jetzt: Panel mit Timer + 3 Antworten + I18N + sfxPhone.
    5 SFX verdrahtet (Think/Phone/Bad/ZenJiru/Dispatch), 2 gestrichen
    (Ready/Deliver — kein eindeutiger Trigger). 3 neue Tests (43–45, 142 gesamt).
    Kern unangetastet. 142/142 Tests, Bot 25/25.

## Offene Fragen / nächste Schritte
- [ ] **Visuelle QA im Browser** (Mensch): Titelbildschirm, Menü, Party, Aim-Linie,
      Intro — der Prüfer hat nur per Code/Tests/DOM-Vertrag verifiziert.
- [ ] **Audio-QA (Ohr):** Peak-Stem-Lautstärke, Titel-Track-Auswahl (1–5), Mix.
- [ ] Mobile-Layout (Porträt) — nie von einem Menschen geprüft.
- [ ] `app.js` (1.500+ Zeilen) aufteilen — Plan steht in `special_edition/tech-paper.md`.
- [ ] v2.7-Lücke im Patchlog: wer das Git-/Datei-Log hat, möge sie füllen.
- [ ] Content: v2.1-Persona-Bibeln (`content/personas/` im Alt-Ordner) nachportieren?
- [ ] Balance: Sim-Bot gewinnt 25/25 in Ø 6.5 Nächten — `CONFIG` ist der Drehknopf
      (`WIN_CREDITS`, `CLEAN_BONUS`, `FORGIVE_BASE`, `BASE_SPAWN`).

> **Stand 12.10.2026:** Diese Punkte sind weitergedacht in `todo.md`
> (v2.9.3/v2.9.4-Plan) und `ROADMAP.md`. Der Master-Log bleibt das
> Phasen-Protokoll — die Arbeitsliste wohnt jetzt woanders.
