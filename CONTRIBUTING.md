# NUDELBAR — Beitragsguide

**Für:** Menschen und KI-Kollegen, die an dieser Codebase arbeiten.
**Regel in einem Satz:** Wenn die drei Checks grün sind und das Patchlog geschrieben
ist, ist die Änderung fertig. Alles andere ist Vermutung.

## Quickstart

```
git clone <repo> nudelbar
cd nudelbar
node tests.js           # → 130 passed, 0 failed
node sim.js             # → Sieg-Rate 25/25 (Stand v2.9.2)
node tools/dom-check.js # → DOM-Vertrag: OK
# dann: index.html im Browser öffnen (Audio braucht einen Klick — Autoplay-Regel)
```

**Voraussetzungen:** Node.js (für Tests/Sim) und ein moderner Browser (zum Spielen).
Kein Install-Step, kein npm, kein Build. Das ist kein Zufall, das ist eine Haltung
(siehe `special_edition/tech-paper.md`).

## Code-Konventionen

1. **ES5, Vanilla JS.** `var`, keine Arrow Functions, im Bestand kein `let/const`.
   Neuer Code folgt dem Stil der Datei, in der er landet. (TypeScript-Trigger: `ROADMAP.md`.)
2. **Zero Dependencies.** Keine Libs, keine Fonts, keine Assets. Alles Audio wird
   synthetisiert, alles Bild wird gezeichnet.
3. **Kern ohne DOM.** `js/core.js` kennt kein `document`, kein `canvas`, kein
   `window` (außer UMD-Export). **Alle Zufallsentscheidungen durch `state.rnd()`**
   (mulberry32) — niemals `Math.random()`. (Im Frontend/`app.js` darf `Math.random()`
   nur für Kosmetik: Partikel, Konfetti, Wackeln.)
4. **Keine magischen Zahlen.** Alles Balance-relevante in `CONFIG` (core.js).
5. **Alle Texte in `KAWAII`** (core.js) — nicht verstreut. Deutsch zuerst, EN ist da.
   Keine Sätze über 14 Wörter in Sprechblasen. Ton: melancholisch-pragmatisch,
   kurze Sätze, keine Exclamation-Flut (`special_edition/quotes.md`).
6. **UMD-Pattern** für Dateien, die unter Node UND im Browser laufen sollen
   (`core.js`, `intro.js`; Muster oben in beiden Dateien).

## Wo was hingehört

| Datei | Zuständig für | Hingehören dürfen NICHT |
|---|---|---|
| `js/core.js` | Regeln, State-Machine, CONFIG, Content-Daten (KAWAII, LOREBOOK) | DOM, Rendering, Audio |
| `js/app.js` | Canvas-Rendering, Input, Overlays, FX | Spielregeln, Zufall für Game-Logik |
| `js/audio.js` | WebAudio-Synthese (Stems, Titel, SFX) | Game-Logik (nur iMUSE-Abfrage `updateIMUSE(state)`) |
| `js/intro.js` | Anime-Prolog (3 Szenen) | Zugriff auf core-State |
| `tests.js` | Unit-Tests für den Kern (Node) | DOM, Timing über dt-Klemmung hinaus |
| `sim.js` | Balance-Bot, komplette Kampagnen | Alles, was über die core-API hinausgeht |
| `tools/dom-check.js` | DOM-Vertrag: jede `$('id')` in app.js braucht ein Element | — |

## Workflow (der Rhythmus)

1. **Vorher:** `node tests.js && node sim.js && node tools/dom-check.js` — alle drei
   grün? Erst dann anfassen.
2. **Eine Aufgabe, eine Datei, ein Commit.** Nicht parallel. Die 130 Tests sind das
   Sicherheitsnetz — wer zwei Dateien gleichzeitig ändert, weiß nicht, was bricht.
3. **Nachher:** alle drei Checks erneut. Wenn ein Test bricht, ist entweder der Test
   oder die Welt kaputt — meist die zweite.
4. **DOM-Vertrag:** Neues UI-Element → erst `id="…"` ins `index.html`, *dann* der
   Code in `app.js`. Der dom-check ist die Versicherung (er hat zwei tote Features
   gerettet, vgl. `PATCHLOG.md` v2.9.2).
5. **Patchlog mit der Version** (`PATCHLOG.md`, neueste oben) — nicht „später".
   v2.7 lückte drei Versionen lang, weil „später" nie kam.
6. **Nichts erfinden.** Lücke gefunden (fehlende Doku, tote Referenz, widersprüchliche
   Werte): markieren, in das Patchlog schreiben, was man *nicht* weiß. Ein ehrliches
   „Lücke" ist mehr wert als eine geschickte Geschichte.

## Commits & Branches

- `main` ist die Arbeitsbranch (kleines Projekt, keine PR-Zeremonie; Review = Diff
  vor dem Commit + grüne Checks).
- Commit-Meldung: Deutsch, was + warum. Beispiel:
  `Balance: FORGIVE_BASE 0.14 → 0.10 (Sim-Bot-Siegrate 100 % → 76 %)`
- Release = Commit + `git tag v2.9.3` + PATCHLOG-Eintrag + MANIFEST/ROADMAP pflegen.

## Neues Feature — Checkliste

- [ ] Gehört es in den **Kern** (deterministisch, testbar) oder ins **Frontend** (Kosmetik)?
- [ ] Kern: neuer `CONFIG`-Key + neuer Test in `tests.js` (Nummerierung fortsetzen)
- [ ] UI: `id` im HTML → `app.js` → dom-check grün → visueller Blick im Browser
- [ ] Text: in `KAWAII`, Ton laut `quotes.md`, ≤ 14 Wörter pro Sprechblase
- [ ] Audio: `_blip(freq, dur, wave, gain, slide)`-Muster in `audio.js` — **kein Asset**
- [ ] Titel-Track: `TITLE_TRACKS[n]` (bass/chord/arp/wave, 8 Takte)
- [ ] Patchlog-Eintrag + `todo.md` abhaken + bei Meilensteinen `ROADMAP.md` pflegen

## Die Dinge, die nie passieren

- Kein `Math.random()` in `core.js` (Determinismus ist das Fundament)
- Kein DOM-Zugriff in `core.js`
- Keine Dependencies (Zero Deps ist ein Feature, kein Mangel)
- Keine neuen Assets/Fonts/Samples (alles synthetisch/gezeichnet)
- Keine stummen Patchlogs
- Keine Berührung der Katze. Sie war nie geplant. Sie ist im Code, im Logo,
  in der Seele. Wer sie „versehentlich" löscht, hat sie nicht versehentlich gelöscht.
