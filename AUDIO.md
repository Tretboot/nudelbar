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

## SFX (16 in `audio.js`, alle `_blip`-basiert, alle verdrahtet)

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
| `sfxClick` | Alle UI-Klicks (Setup, Menüs, Titel-Menü, Dialog-Antworten) |
| `sfxThink` | Gast überlegt an der Karte (Stage „thinking") — *neu v2.9.2.2* |
| `sfxPhone` | Ein Gast stellt eine Frage (Dialog-UI erscheint) — *neu v2.9.2.2* |
| `sfxBad` | Chef-Mood wird „😬" (falsche Schüssel / schlechte Dialog-Antwort) — *neu v2.9.2.2* |
| `sfxZenJiru` | Chef-Mood wird „😋" (leere Schüssel, Zen-jiru) — *neu v2.9.2.2* |
| `sfxDispatch` | Der Angestellte schickt eine Schüssel ab (`inTransit[].byEmployee`) — *neu v2.9.2.2* |

### Gestrichen (Entscheidung v2.9.2.2, 12.10.2026)

| SFX | Warum gestrichen |
|---|---|
| `sfxReady` | Kein eindeutiger Trigger: „Schüssel fertig" kollidiert mit `sfxCook` (jede Zutat macht bereits Sound) |
| `sfxDeliver` | Kollidiert mit den Servier-Sounds (`sfxThrow` + `sfxHappy`/`sfxAngry`/`sfxCoin`); für den Angestellten gibt es jetzt `sfxDispatch` |

Beide bleiben als Muster in der Git-Historie. Wenn später ein Feature einen
eindeutigen Moment braucht (z. B. „Bestellung komplett" als eigenes Event),
kann der Sound mit zwei Zeilen zurückkommen.

### Der größere Fund dabei (v2.9.2.2)

Die 7 toten SFX waren ein Symptom: Beim Verdrahten stellte sich heraus, dass
**`sfxPhone` für die Dialog-UI gedacht war — und die Dialog-UI existierte nicht.**
Das v2.8-Dialog-System (Gast fragt → Spieler antwortet gut/neutral/schlecht →
moodBonus ±8) lief komplett im Kern, hatte aber **null Referenzen in app.js und
null Tests**. Der Spieler hat nie eine Frage gesehen; nach 12 s hat der Kern
selbst neutral geantwortet. v2.9.2.2 stellt die UI wieder her (Panel, Timer,
3 Antwort-Buttons, I18N, `sfxPhone`) und deckt das System mit Tests 43–45 ab.
Dasselbe Muster wie der tote Menü-Button — nur diesmal hat es den dom-check
nicht gefangen können, weil da kein `$('id')` fehlte, sondern ein ganzes Feature.
Lektion: Der dom-check prüft Verträge zwischen Code und HTML. Features, die
zwischen Code und *Spieler* tot sind, findet nur jemand, der die README
gegen das Spiel liest. (Und der sie dann wieder herstellt.)

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
