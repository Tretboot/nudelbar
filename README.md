# 🍜 NUDELBAR — Nudelbar an der Naht

**NUDELBAR** (ja, wirklich, endgültig, siehe `PATCHLOG.md` v2.5) — ein deterministischer,
seedbarer Neon-CRT-Ramen-Tapper nach dem Vorbild von *Tapper* (C64). Premium, keine
Mikro-Transaktionen, **zero Dependencies** (kein Build-Step, kein npm). Der Kern ist
reine Logik (Node + Browser, `mulberry32`-PRNG), das Rendering läuft auf Canvas 2D,
die Musik wird zur Laufzeit synthetisiert.

**Lizenz: MIT** — „Für diese Kunst übernimmt niemand Verantwortung."

> **⚠ VERTICAL SLICE · SPIELTEST**
> Mechaniken entstehen beim Spielen. Der Name ist es nicht mehr — der heißt einfach
> **NUDELBAR** (dritte Umbenennung, endgültig, versprochen). Feedback ist Gold wert.

> „Der Chronist, Nebelklees literarisches Amt für Dinge, die in Suppe landen." — Greta

## Das Gameplay (ein Satz)
Ein Gast = eine Bestellung (Brühe + Beilagen). Du gießt Brühe, legst Beilagen,
**wirfst die Schüssel** zum Gast, den du anvisierst (Aim-Linie zeigt den Flugweg).
Exakt richtig → der isst, reagiert, zahlt, tippt. Fast richtig → *manche* Gäste
essen die falsche Schüssel trotzdem („Glaub, das hab ich nicht bestellt — aber war
KRASS!"). Deutlich falsch oder zu langsam → die Schüssel fliegt durch den Raum,
−Reputation, der Koch macht 😬. Ziel: **3000 € und 55 Reputation in 20 Nächten.**

## Der Einstieg (v2.9+)
Das Spiel startet im **Titelbildschirm** (Canvas): *Schicht beginnen* (Setup:
Barname, Chef-Emoji, Preisniveau, Seed) · *Intro ansehen* (3 Szenen, Anime-Prolog)
· *Stammgast-Chronik* (Lorebook, nachts freigeschaltet). In der Schicht steht der
**☰-Menü-Button** in der Topbar: Ton, Musik-Lautstärke, Sprache (DE/EN),
Titel-Track (1–5), Zurück zum Titel — plus der Lizenz-Block.

## Steuerung
| Eingabe | Aktion |
|---|---|
| **1 – 4** | Brühe gießen (Tonkatsu, Shoyu, Miso, Spicy) |
| **A S D F G** | Beilage aus dem Vorrat (Ei, Nori, Mais, Chashu, Zwiebel) |
| **Enter / Leertaste** | Schüssel zum anvisierten Gast werfen (Maus = Aim) |
| **R** | Fritteuse anwerfen (Beilagen nachbraten) |
| **X** | Arbeits-Schüssel ausspülen |
| **C / ESC** | Shop & Abrechnung (Bürozeit) |
| **?** | Hilfetafel |
| **P** | Pause · **M** | Ton an/aus · **L** | Sprache DE/EN |
| **☰ (Menü)** | Einstellungen: Ton, Musik-Lautstärke, Sprache, Titel-Track, Zum Titel |
| **Maus / Touch** | Alle Stationen anklickbar, Hover zeigt Details |
| **Controller** | D-Pad wählen · A: Aktion · X: Braten · Y: Ausspülen · B: Servieren · Start: Nächste Nacht / Shop |

## Was im Laden so passiert
- Gäste kommen an der Tür rein, laufen zur **Speisekarte** und überlegen in einer
  **Sims-Blase**, dann Theke. Strichmännchen mit Armen/Beinen, Wackeln beim Gehen.
- **Unterschiedliche Ess-Tempos** pro Persona · **Auslöffeln** (leere Schüssel =
  Bonus-€) · **Bleiber** (sitzen den Abend, Stammis bestellen nach).
- **Stimmung steckt an** (💚), Gäste plaudern (Gossip), **Stammgäste** (⭐) mit
  wachsender Rep, **Raids** (Wandergruppe/Schule/Familie).
- **Glückskatze** (ab Nacht 2, zufällige Besuche) · **Angestellter** (150 €,
  serviert automatisch, 15 % Fehlerquote) · **Dialog-UI** (Gast fragt, du antwortest — in v2.9.2.2 wiederhergestellt, war seit v2.9 ein totes Feature).
- **🎉 Partytime:** 4+ Gäste gleichzeitig → alle tragen Mützen 🎩, Konfetti,
  Fanfare, Party-Sprache. Seit v2.9.2 **deterministisch im Kern** (Testbar!).
- **KAWAII-Block:** 11 Text-Pools — Katze, Angestellter, Chef-Gedanken, Dialoge,
  Skills, Deko, Seele, Party. Alle Texte an einem Ort (`KAWAII` in core.js).
- **iMUSE-Audio:** 3 Stems (Shamisen immer / Walzer ab Gast / Peak bei Combo 5+) +
  5 Titel-Tracks (City Pop, Neon Rain, Dashi, Concrete, Morning) + 16 SFX.
- **Bürozeit** zwischen den Nächten: Einkauf, Upgrades, Skills, Preisstufe.
- **Feierabend:** Score-Tally + **Chronist-Report** (bestes Gericht, größtes
  Trinkgeld, schönster & härtester Spruch, häufigster Fehler, leere Schüsseln).

## Starten
Zip entpacken, `index.html` im Browser öffnen. Fertig. (Audio braucht einen
Klick/Tastendruck zum Start — Browser-Autoplay-Regel.)

## Verifizieren (die drei Befehle)
```
node tests.js           # 142 Unit-Tests (Kern)
node sim.js             # Balance-Sim: 25 Seeds, Bot spielt komplette Kampagnen
node tools/dom-check.js # DOM-Vertrag: jede UI-Referenz hat ein HTML-Element
```

## Projektstruktur
```
index.html            Screens: Titel (Canvas), Start-Setup, Hilfe, Bürozeit, Feierabend, ☰-Menü
style.css             Neon-CRT-Design, Design-Tokens, title-mode, About-Block
js/core.js            Reiner deterministischer Kern (Node + Browser, window.DAMPF.core)
                      — ALLE Spielregeln, CONFIG, KAWAII-Texte, Lorebook
js/app.js             Canvas-Renderer, Input, Tooltips, Touch, Controller, Overlays
js/audio.js           WebAudio: iMUSE 3 Stems, 5 Titel-Tracks, 17 SFX (alles synthetisch)
js/intro.js           Anime-Prolog (3 Szenen), UMD, kein Zugriff auf core-State
tests.js              142 Unit-Tests (node tests.js, inkl. Dialog-Tests 43–45, DOM-Vertrag als Test 42)
sim.js                Balance-Simulator (node sim.js, 25 Seeds)
tools/dom-check.js    DOM-Vertrag-Check (v2.9.2: die Versicherung gegen tote Features)
special_edition/      Tech-Paper, Studio-Lore, Zitate, Dev-History,
                      the-audit.md (Aufsatz über die Außenprüfung),
                      handover-next-model.md (Übergabe für das nächste Team/Modell)
LICENSE               MIT + Sonderklausel
PATCHLOG.md           Vollständige Historie (v1.0 → v2.9.2)
POSTMORTEM.md         Persönliches Protokoll der Außenprüfung (v2.9.2)
MANIFEST.md           Paket-Inhalt, Prüfsumme, offene Punkte
README.md, architecture.md, master_log.md, todo.md
```

## Balance (v2.9.2, `sim.js` / 25 Seeds)
- Bot: **25/25 Siege**, Ø 6.5/20 Nächte, Ø 139 bedient / 0 verloren, beste Combo Ø ~140.
- Der Bot kauft ein und plant perfekt — ein Mensch steht unter Stress, bei Raids
  und wenn die Fritteuse kült. **Zu leicht für Menschen**: `CONFIG` in `js/core.js`
  ist der Drehknopf (`WIN_CREDITS` ↑, `CLEAN_BONUS` ↓, `FORGIVE_BASE` ↓, `BASE_SPAWN` ↓).
- Partytime hat keine Messbarkeit (abgesehen von Tests 39–41). Das ist ihre Stärke.

## Für das neue Team
Lies `POSTMORTEM.md` (wie der aktuelle Zustand entstanden ist), `MANIFEST.md`
(was offen ist) und `special_edition/handover-next-model.md` (Konkretes: was gut
ist, was schwierig ist, wer was am besten übernimmt). Die drei offenen Punkte,
die nur ein Mensch mit Browser und Ohren beenden kann: **Visuelle QA, Audio-QA,
Mobile-Layout** — sie stehen oben in `todo.md`.
Seit 12.10.2026 (v2.9.2.1) führt **ein einzelner Entwickler** (KI-Modell mit
Kontinuität) das Projekt — Übergabe-Kette und Regeln: PATCHLOG (v2.9.2.1),
`CONTRIBUTING.md`, `ROADMAP.md`.

## Dokumentation (Index)

| Datei | Inhalt |
|---|---|
| `ROADMAP.md` | Versionsziele (v2.9.3 Stabilisierung → v2.9.4 Struktur → v3.0), Metriken, technische Trigger |
| `CONTRIBUTING.md` | Setup, Code-Konventionen, Workflow, Commit-Regeln — für Menschen und KI-Kollegen |
| `BALANCE.md` | CONFIG komplett dokumentiert, Schrauben für „schwerer", Personas, Events, Balance-Prozess |
| `AUDIO.md` | iMUSE-Light, Stems, Titel-Tracks, SFX-Liste (inkl. 7 toter SFX — Fund 12.10.2026) |
| `LORE.md` | Welt, 7 Personas, Lorebook, die Katze, Studio-Inkonsistenz (offen), Schreibregeln |
| `MOBILE.md` | Touch-Ist-Zustand, QA-Plan für echte Geräte, Porträt/Landscape-Entscheidung |
| `QA-CHECKLIST.md` | Release-Checkliste: 3 automatische Checks + visuelle/audio/mobile QA |
| `architecture.md` | Architektur & Invarianten (dt-Klemmung, Rep-Niederlage im Tick, …) |
| `todo.md` | Aktuelle Tasks (rotiert mit dem Projekt) |
| `special_edition/` | Tech-Paper, Studio-Lore, Zitate, Dev-History, Audit, Handover |


> „Kein Build-Step. Kein npm. Kein ‚läuft bei mir‘. Nur Nudeln."
> — Lead Developer, Tech-Paper v2.9
