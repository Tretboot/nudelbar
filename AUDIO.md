# NUDELBAR — Audio-Dokumentation

**Grundsatz: Alles wird synthetisiert.** Web Audio API, keine Assets, keine Files,
keine Samples. Engine: `js/audio.js` (UMD). Neue Sounds nach dem Muster
`_blip(freq, dur, wave, gain, slide?)` — nie ein mp3.

## Architektur: iMUSE-Light

Drei Stems, die sich je nach Spielzustand ein- und ausblenden (Crossfade via
`setTargetAtTime`), plus ein separater Titel-Bus:

| Stem | Inhalt | Gate (Code, `updateIMUSE`) | Crossfade |
|---|---|---|---|
| 1 — Ambient | Shamisen-Drone (pentatonisch, `PENTA`) | läuft dauerhaft | — (ambGain 0.28) |
| 2 — Rhythmus | Walzer-Akkorde + Bass (`CHORDS_WALTZ`) | **Gäste ≥ 1** | 0.4 s |
| 3 — Peak | Arps + Taiko-Percussion | **Combo ≥ 5 oder Rush-Event** | 0.15 s |

**Bus-Topologie:**
```
master 0.6 ─→ destination
├── ambGain 0.28 ──────────────────────────────── (Stem 1, direkt)
├── musicGain 0.32 ─→ delay 0.33 s ─→ feedback 0.22 ─→ master
│       ├── stem2Gain (0 → 1)   (Stem 2)
│       └── stem3Gain (0 → 1)   (Stem 3)
└── titleGain (0 → ~0.45) ────────────────────── (Titel-Bus, KEIN Delay)
```

> **Inkonsistenz (markiert, nicht erfunden):** Der Header in `audio.js` sagt für
> Stem 2 „guest-gated (Gäste ≥ 2)", der Code sagt `guests >= 1` (`updateIMUSE`,
> ~Zeile 185). Eines von beiden stimmt nicht. **QA-Aufgabe:** bewusstes späteres
> Tuning oder alter Header? Dann Header oder Code angleichen.

**Historie (wichtig):** Der Peak-Stem (Stem 3) lief bis v2.9.2 **nie an** —
`_scheduleStem3()` wurde nicht aufgerufen, und der gemeinsame `nextNoteTime`-Zeiger
hätte drei Scheduler kollidieren lassen. Fix in v2.9.2: eigener `stem3NextTime`.
Der Peak ist *gebaut und angelaufen* — aber noch nie *gehört* (siehe QA-CHECKLIST).

## Titel-Tracks (Titelbildschirm, `TITLE_TRACKS` in audio.js)

| # | Name | BPM | Wave | Charakter |
|---|---|---|---|---|
| 1 | **City Pop** (aktueller Default) | 120 | triangle | hell, gepflegt |
| 2 | Neon Rain | 100 | sine | kalt, melancholisch |
| 3 | Dashi | 110 | triangle | warm, umami |
| 4 | Concrete | 130 | square | hart, 8-bit |
| 5 | Morning | 90 | sine | hell, Morgengrauen |

Alle: 8 Takte à 4/4, Struktur `bass[8] + chord[8] + arp[8] + wave`.
Umschaltbar im ☰-Menü, gespeichert als `titleTrack` (Standard: 1).
**Offene Entscheidung (QA):** Welcher Track wird Default? Die eine Zahl
(`titleTrack = 1` in app.js) + Eintrag hier.

## SFX (18 in `audio.js`, alle `_blip`-basiert)

### Verdrahtet (werden in app.js aufgerufen)

| SFX | Tritt auf |
|---|---|
| `sfxCook` | Brühe gießen, Beilage legen, Fritteuse (Touchpad + Tastatur + fryFlash) |
| `sfxThrow` | Schüssel wird geworfen (serveBowl, auch Differenz-Check) |
| `sfxDoor` | Neuer Gast kommt rein (Gästezähler steigt) |
| `sfxHappy` | Gast geht fröhlich (hoppsend) |
| `sfxAngry` | Gast geht wütend (wirft Schüssel, Screen-Shake) |
| `sfxSlurp` | Gast schlürft die Brühe aus (Stage „sipping") |
| `sfxCoin` | Credits steigen (Zahlung) + Beilagen-Einkauf |
| `sfxUpgrade` | Upgrade gekauft |
| `sfxParty` | Partytime startet (Differenz-Check auf `game.party`) |
| `sfxPhase` | Nachtübergang / Spielstart / Intro-Ende (3 Aufrufstellen) |
| `sfxClick` | Alle UI-Klicks (Setup, Menüs, Titel-Menü) |

### Definiert, aber **nie aufgerufen** (Fund 12.10.2026 — v2.9.3-Task)

| SFX | Evtl. intended für |
|---|---|
| `sfxReady` | Schüssel fertig/aufgebaut? |
| `sfxPhone` | Dialog-Einladung (Gast fragt — v2.8-Dialog-System) |
| `sfxDispatch` | Angestellter schickt ab? |
| `sfxDeliver` | Angestellter serviert? |
| `sfxBad` | Falsche Schüssel (doWrong) |
| `sfxThink` | Gast überlegt an der Karte (Stage „thinking") |
| `sfxZenJiru` | Zen-jiru (leere Schüssel, +Rep) — die Zeilen dazu gibt es (KAWAII.zenjiru) |

**Kein Bug im engeren Sinn** (nichts läuft falsch), aber dieselbe Fehlerklasse wie
der tote Menü-Button: Features, die existieren, aber niemand finden kann.
**Entscheidung v2.9.3:** verdrahten (die 7 Kandidaten oben haben plausiblen
Anschluss) oder aus audio.js streichen. Der DOM-Check deckt das nicht ab —
er prüft nur HTML-Elemente. Hier hilft nur die Ohr-Liste in der QA-CHECKLIST.

## Neue Sounds bauen (Muster)

```js
AudioEngine.prototype.sfxXyz = function () {
  this._blip(523, 0.08, 'square', 0.25);
  var self = this;
  setTimeout(function () { self._blip(784, 0.12, 'square', 0.25); }, 130);
};
```
- Frequenzen aus `PENTA` (pentatonisch) bleiben im Tonraum; SFX dürfen abweichen.
- Gain ≤ 0.3 für Einzelevents (Master ist 0.6 — darüber klirrt's).
- **Immer** am Ende von app.js verdrahten (sfx('Xyz') an der passenden Stelle),
  sonst wird es ein weiterer toter Sound.
- Neuen Titel-Track: Eintrag in `TITLE_TRACKS` (bass/chord/arp/wave, 8 Takte)
  + Menü-Option (derzeit hart auf 1–5 begrenzt).

## Mix-Notizen (Stand v2.9.2 — ungeprüft per Ohr)

- Peak-Stem-Gain → musicGain 0.32, Titel-Bus ~0.45 (Angaben aus Handover).
- **Offene Fragen (QA):** Taiko gegen Walzer (Stem 3 auf Stem 2)? Lautstärke
  des Peak-Stems im Mix? Ambience auf langem Spiel (Stem 1 läuft *dauerhaft*)?
  Nichts davon darf hier „klingt gut" heißen, bis jemand es gehört hat.
