# NUDELBAR v2.9.2 — Übergabe-Manifest

**Paket:** `nudelbar_v2.9.2.zip`
**Zustand:** 130/130 Tests · 25/25 Balance-Sim · DOM-Vertrag grün · MIT-lizenziert
**Verpackt am:** 11.10.2026 von einem externen Prüfer (KI-Modell)
**Für:** ein neu geordnetes Team — Menschen, andere Agenten, das nächste Modell.

> Lies zuerst: **README.md** (was ist das), **POSTMORTEM.md** (wie der Zustand
> entstanden ist), dieses Manifest (was drin ist und was offen ist).

---

## 1. Inhalt des Zips

```
nudelbar/
├── index.html            Spiel: Start-Setup, Hilfe, Bürozeit, Feierabend, ☰-Menü, Spiel
├── style.css             Neon-CRT-Design, title-mode, About-Block
├── js/
│   ├── core.js           Reiner deterministischer Kern (Node + Browser). ALLE
│   │                     Spielregeln, CONFIG, KAWAII-Texte, Lorebook. 1.900 Zeilen.
│   ├── app.js            Renderer + Input + Overlays. 1.550 Zeilen (Refactoring-Plan
│   │                     steht in special_edition/tech-paper.md).
│   ├── audio.js          WebAudio: iMUSE 3 Stems, 5 Titel-Tracks, 17 SFX. Alles synthetisch.
│   └── intro.js          Anime-Intro (3 Szenen), UMD, kein Zugriff auf core-State.
├── tests.js              130 Unit-Tests (Kern) — `node tests.js`
├── sim.js                Balance-Simulator, 25 Seeds — `node sim.js`
├── tools/
│   └── dom-check.js      DOM-Vertrag: jede $('id') in app.js MUSS im index.html sein
├── special_edition/
│   ├── tech-paper.md     Warum Vanilla JS bleibt (+ Refactoring-Plan)
│   ├── lore-studio.md    In-Welt-Lore: das Studio (Yuki, Marco, Kofi)
│   ├── quotes.md         Sprüche des Projekts
│   ├── dev-history.md    Entwicklungsgeschichte (Spielperspektive)
│   ├── the-audit.md      Aufsatz über die Außenprüfung v2.9.2  ← NEU
│   └── handover-next-model.md  Anweisungen für das nächste Modell  ← NEU
├── LICENSE               MIT + Sonderklausel
├── PATCHLOG.md           Vollständig nachgeführt (v1.0 → v2.9.2, inkl. v2.7-Lücke)
├── POSTMORTEM.md         Persönliches Protokoll des Prüfers  ← NEU
├── MANIFEST.md           Diese Datei  ← NEU
├── README.md             Einstieg
├── architecture.md       Architektur & Invarianten
├── master_log.md         Phasen-Protokoll
└── todo.md               Aktueller Stand
```

## 2. Integrität

```
SHA-256:   in der Sidecar-Datei `nudelbar_v2.9.2.zip.sha256` (neben dem Zip —
           eine Datei kann ihre eigene Prüfsumme nicht enthalten; Standard bei
           Release-Paketen, vgl. Linux-ISOs).
Dateien:  22 · 124 KB · `nudelbar_v2.9.2.zip`
```

## 3. Verifizieren (die 4 Befehle)

```bash
node tests.js           # → 130 passed, 0 failed
node sim.js             # → Sieg-Rate 25/25
node tools/dom-check.js # → DOM-Vertrag: OK
# Browser: index.html öffnen → Titelbildschirm (NUDELBAR, Dampf, Katze-Story)
```

## 4. Spiel-Flow (kurz)

1. **Titelbildschirm** (Canvas): „Schicht beginnen" → Setup (Name, Chef-Emoji,
   Preis, Seed) · „Intro ansehen" (3 Szenen) · „Stammgast-Chronik" (Lorebook).
2. **Nacht:** 1–4 Brühe, A–G Beilagen, Enter/Leertaste = werfen (Maus-Ziel: Aim-Linie).
   R = Fritteuse, X = Schüssel leeren, C/ESC = Shop, ? = Hilfe, P = Pause, M = Ton,
   L = Sprache (DE/EN), ☰ = Menü.
3. **Bürozeit** zwischen den Nächten: Einkauf, Upgrades, Skills, Preis,
   Angestellter, „Nächste Nacht".
4. **Ziel:** 3000 € und 55 Reputation in 20 Nächten (Konfig: `CONFIG.WIN_CREDITS/REP`).

## 5. Offene Punkte (bewusst offen — für das neue Team)

| # | Punkt | Warum offen | Für wen |
|---|---|---|---|
| 1 | **Visuelle QA im Browser** (Titel, Menü, Party, Aim-Linie, Intro) | Der Prüfer hat kein Display; nur Code/Tests/DOM-Vertrag verifiziert | Mensch |
| 2 | **Audio-QA per Ohr** (Peak-Stem, Titel-Tracks 1–5, Mix) | Der Prüfer hat keine Ohren; der Peak ist *gebaut und angelaufen*, nicht *gehört* | Mensch |
| 3 | **Mobile-Layout (Porträt)** | Nie von einem Menschen geprüft | Mensch |
| 4 | **`app.js` aufteilen** (render/input/ui, Ziel: <500 Zeilen/Datei) | Refactoring braucht Kontinuität; 130 Tests tragen die Brücke | Entwickler |
| 5 | **Balance: schwerer** (Bot gewinnt 25/25 in Ø 6.5 Nächten) | Design-Entscheidung, kein Bug | Lead Designer |
| 6 | **v2.7-Lücke im Patchlog** | Bewusst nicht erfunden; Git-/Datei-Log konsultieren | Wer das Log hat |
| 7 | **Persona-Bibeln v2.1 portieren** | Content-Entscheidung (Alt-Ordner `dampf-and-phase/`) | Story |
| 8 | **KAWAII → lore.js, CONFIG → config.js** | Tech-Paper-Vorschlag, nach dem app.js-Split | Entwickler |

## 6. Was der Prüfer bewusst NICHT getan hat

- Keine neue Mechanik (das Projekt braucht Verlässlichkeit, nicht Inhalte).
- Kein Großrefactoring (siehe Punkt 4 — mit Begründung).
- Keine erfundene v2.7-Geschichte.
- Keine Audio-Behauptung („es klingt gut" steht hier nirgends, weil sie nicht wahr ist).
- Keine Weiterentwicklung jenseits des Fixes: v2.9.2 ist eine *Reparatur- und
  Verpackungs-Version*, keine Feature-Version. Die nächsten Feature-Visionen stehen
  in `special_edition/handover-next-model.md`.

## 7. Die drei Dinge, die wichtiger sind als jede Feature-Liste

1. **`node tests.js && node sim.js && node tools/dom-check.js`** — vor jeder
   Änderung, nach jeder Änderung. Der DOM-Check ist neu (v2.9.2). Er hätte zwei
   dieser Bugs gefangen, bevor sie ausgeliefert wurden.
2. **Alles Balance-relevante in `CONFIG`** (core.js). Keine magischen Zahlen im Flow.
3. **Das Patchlog wird mit der Version geschrieben, nicht danach.** v2.7 lückte
   drei Versionen lang. v2.9.2 hat nachgeschrieben — und die Konvention geändert.

> „Kein Build-Step. Kein npm. Kein ‚läuft bei mir‘. Nur Nudeln."
> — Lead Developer, Tech-Paper v2.9

Für diese Kunst übernimmt niemand Verantwortung.
