# NUDELBAR — Lore-Dokumentation (Welt, Figuren, Texte)

**Grundsatz:** Alle spielerischen Texte leben in `KAWAII` (core.js) — nicht verstreut.
Deutsch zuerst (EN ist da). Ton: melancholisch-pragmatisch, kurze Sätze, keine
Exclamation-Flut. Referenz: `special_edition/quotes.md`.
Keine Sätze über 14 Wörter in Sprechblasen.

> Regel aus dem Handover: Nichts erfinden. Wenn hier eine Lücke steht, ist sie
> eine Lücke — sie wird nicht still zugeklatscht.

## Die Welt

- **Nebelklee**, eine kalte Stadt. Die Bar liegt in der Nacht; draußen regnet es
  im Intro, im Neonlicht. Die Suppe ist warm. Das ist der ganze Kontrast.
- **Die Bar:** Theke mit 4–6 Hockern, Speisekarte an der Wand, Fritteuse,
  Zapfhahn für Brühen. Arbeitsschüssel, Ausguss. Ein Neon-Schild mit dem
  Barname (Standard: „NUDELBAR").
- **Der Chronist:** „Nebelklees literarisches Amt für Dinge, die in Suppe landen."
  Er schreibt den Feierabend-Report (Chronik) über die Nacht.
- **Die Katze:** War nie geplant. Irgendwann im Code (v2.6), dann im Logo
  (sitzt auf dem „U"), dann im Audio. Sie besucht die Bar zufällig
  (`CAT_CHANCE`), bringt Glück (Verzeihung + Trinkgeld) und sieht alles.
  **Sie darf nicht gelöscht werden.** Wenn sie verschwindet: sie ist nicht
  versehentlich verschwunden.

## Die Gäste (7 Personas)

| Persona | Name im Lorebook (v2.8) | Charakter in einem Satz |
|---|---|---|
| 🧐 Der Kritiker | Gustav V. Forkenbein | Misst Suppen in Zehnteln, gibt Nudeln „ohne Haltung" zurück |
| 🌌 Der Philosoph | Frau Nishida | Fragt, ob die Nudel „da ist" |
| 💬 Der Schwätzer | Rico | Erzählt Tantes Geschichte — immer zwei Sätze vor dem Ende |
| 🙈 Der Timide | „die am Fenster sitzt" | Bedankt sich leiser, als der dampfende Löffel es hört |
| 🍜 Der Heißhunger | HUNGER.EXE | Hat die Tür nie ins Schloss fallen lassen |
| 📷 Der Tourist | — | Fragt, ob Ramen eingeflochten werden kann |
| ☕ Der Regelmäßige | Der Stammgast (Stuhl 4) | Bestellt dasselbe, die Wahrheit steht in v3.0 |

Statistiken (MoodBias, Geduld/Verzeihung, Ess-Tempo, Gewicht): `BALANCE.md`.
Dialog-Pools je Persona × 5 Stimmungen (enthusiastic/positive/neutral/grumpy/
accidental): `DIALOGUE.personas` in core.js. **Persona-Bibeln v2.1** (Alt-Ordner
`dampf-and-phase/content/personas/`) sind noch nicht portiert — offen (ROADMAP v2.9.3 #6).

## Gäste-Gruppen (Raids)

Wandergruppe 🥾 (Tourist) · Schulklasse 🎒 (Heißhunger) · Familienausflug 🍁
(Regelmäßige). Alle drei stürmen gemeinsam rein — Balance-Druckmomente.

## Nacht-Events

Sieben (Ruhige Nacht, Sturm-Stunde, Regen, Der Kritiker, Lampion-Festival,
Raid in der Tür, Totstille) — Werte in `BALANCE.md`.

## Das Lorebook (im Spiel, nachts freigeschaltet)

`LOREBOOK` in core.js. Einträge nach Nacht:

| Nacht | Titel | Inhalt (Kern) |
|---|---|---|
| 1 | v1.0 — Es gab nur Nudeln | 200-Zeilen-HTML-File, es reichte |
| 3 | v2.0 — Gesichter | 7 Personas, die Bar bekam einen Namen |
| 5 | v2.3 — Tapper-Ramen | Touch, Fritteuse, Vorrat, 122 Tests |
| 8 | v2.6 — Die Katze | „Sie war nie geplant" |
| 10 | Der Bug wird Gast | Am letzten Stuhl: „Der Bug ist gefixt. Oder: er ist jetzt Feature." |
| 12 | v2.8 — Seele | Vier Modelle haben an der Suppe gerührt |
| 14 | Die Gäste (I) | Forkenbein/Nishida/Rico eingeführt |
| 15 | Das Video | YouTube-Link (ubgC7YKWPgs) — „die Katze weiß es" |
| 16 | Die Gäste (II) | Timide/HUNGER.EXE/Tourist eingeführt |
| 18 | Studio 11 — die Entwickler | Sonett (Texte), Mammut (Logik), Commander (Koordination), Haiku (Praktikant, 12 % Verfügbarkeit) |
| 19 | Der Stammgast (Stuhl 4) | „Die Wahrheit über seine Schale wird aufbewahrt … in Version 3." |
| 20 | v3.0 — Die Bar kocht selbst | „Die Stadt fröstelt. Der Dashi nicht." |

Freischaltung: `state.night >= entry.night` (nach `lastNight` alles).

## Das Entwicklerstudio (Lore — ACHTUNG: zwei Besetzungen)

> **Inkonsistenz (markiert 12.10.2026, offene Story-Entscheidung):**

- `special_edition/lore-studio.md` (Meta-Doku): **Yuki** (Frontend/Canvas),
  **Marco** (Audio, hat nie Ramen gegessen), **Kofi** (Core/Logik). Drei Leute,
  Whiteboard, Katze.
- Lorebook-Eintrag Nacht 18 (in-game): **Sonett** (Texte), **Mammut** (Logik),
  **Commander** (Koordination), **Haiku** (Praktikant). Vier Leute, „Studio 11",
  3. Stock, fensterlos.

Beides kann wahr sein (zwei Studios, zwei Erzähl-Ebenen), beides kann eine
unreine Übergabe sein. **Entscheidung v3.0 nötig**, bevor das Studio betretbar
wird: eine Besetzung, die andere wird verworfen oder erklärt.

### Studio-Event (aus lore-studio.md, für v3.0 vorgesehen)

Nacht 10: Am letzten Stuhl sitzt jemand, der nicht bestellt, tippt auf seinem
Laptop. Ihm eine Schüssel hinstellen (irgendeine) →
„Danke. Der Bug ist gefixt. Oder: er ist jetzt Feature." Er verschwindet;
ab Nacht 11 bleibt auf dem Laptop die Sticky-Note „TODO: v3.0".
*(Der Lorebook-Text für Nacht 10 existiert bereits — v3.0 baut darauf auf.)*

## Weitere Lore-Bausteine

- **Easter Egg YouTube-Link** (Lorebook 15): Inspiration für die Nudelbar.
  Wer es schaut, versteht, warum die Stadt so kalt und die Brühe so warm ist.
- **v3.0-Vision** (Handover + lore-studio.md): Studio betretbar, Bug-Gäste
  („2× Nichts, 1× Fehler, extra Geduld"), Straße + Wetter, Meta-Element
  („Du hast mich schon 3 Mal neu gestartet. Ich erinnere mich."),
  Tageszeiten (Morgengrauen nach Nacht 20).
- **Endings:** Der Endscreen ist nicht auto-dismissed — der Spieler klickt selbst
  weiter. Die Chronicle (Feierabend-Report) ist der Chronist am Werk.

## Texte schreiben (Checkliste)

- [ ] In `KAWAII` (core.js), nicht in app.js oder HTML
- [ ] Deutsch zuerst, EN-Gegenstück, wenn es Pools gibt
- [ ] ≤ 14 Wörter pro Sprechblase
- [ ] Ton: melancholisch-pragmatisch (Vorbilder: `quotes.md`, Lorebook)
- [ ] Persona-Treue: der Kritiker lobt nicht, der Schwätzer bricht ab,
  der Timide ist leise
- [ ] Keine Meta-Erwähnungen, außer sie sind Lore (v3.0 Meta-Element ist geplant)
