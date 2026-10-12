# NUDELBAR — Mobile-Dokumentation

**Stand (12.10.2026):** Mobile-Unterstützung existiert im Code, wurde aber
**nie von einem Menschen auf einem Gerät geprüft** (MANIFEST, offener Punkt 3).
Dieses Dokument ist der Prüfplan + der Ist-Zustand. Nichts hier ist ein
Qualitätsurteil — dafür fehlen die Finger.

## Ist-Zustand (Code, `js/app.js`)

### Touch-Erkennung
```js
isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
```
Nur bei grobem Pointer wird das Touchpad eingeblendet (`#touchpad.hidden` weg).

### Touchpad-Layout (3 Reihen, Pointer-Events)
```
| 1 | 2 | 3 | 4 |        ← Brühe
| A | S | D | F |        ← Beilagen
| G | SERVIEREN | BRATEN | AUS |   ← G = letzte Beilage, weite Buttons
```
- `SERVIEREN` = wide-Button, `BRATEN`/`AUS` = amber-Stil.
- Servieren nutzt **aimSeat()**: die zuletzt anvisierte Position (Maus → auf
  Touch: letzter Tap/Ziel). *Offene Frage: Wie visiert man per Touch an?
  Vermutung: Tap auf Gast = Ziel setzen. IM CODE NOCH NICHT VERIFIZIERT —
  das ist genau der Punkt, den das Mobile-QA klärt.*
- `pointerdown` (nicht click) → keine 300 ms-Delay, gut.

### Canvas-Fitting (`fitCanvas()`)
- Logischer Spielraum: **960 × 620** (Landscape-Proportion ~1.55:1).
- Letterbox: `scale = min(cw/960, ch/620)`, zentriert, DPR-aware (DPR max 2).
- **v2.9.2-Fix relevant:** Der Canvas wohnt in `#game` (initial `hidden` → 0×0).
  Im Titelmodus bekommt `#game` die Klasse `title-mode` und wird sichtbar.
  Auf Mobile gilt dasselbe — der Titelbildschirm muss gecheckt werden.
- Klick-Zonen (`hits[]`) werden pro Frame neu aus den gezeichneten Rechtecken
  berechnet → skalierungsunabhängig, gut.

###Viewport (index.html)
```html
<meta name="viewport" content="width=device-width, initial-scale=1,
      maximum-scale=1, user-scalable=no, viewport-fit=cover">
```
`maximum-scale=1` + `user-scalable=no`: bewusste Entscheidung (Spiel, kein
Text-Doku) — Accessibility-Kehrseite: keine Zoom-Möglichkeit (siehe unten).

## Offene Punkte (die QA-Liste für echte Geräte)

### Must-Check (v2.9.3)
- [ ] **Titelbildschirm** sichtbar (nicht 0×0) — der v2.9-Bug war hier geboren
- [ ] **Menü-Button (☰)** mit Daumen erreichbar UND klickbar
- [ ] **Touchpad-Größe:** Buttons ≥ 48 × 48 dp? Greift sich der Daumen?
- [ ] **Porträt-Modus:** Letterbox macht aus 960×620 in einem 9:19-Screen
  einen ~380 px hohen Spielstreifen. **Ist das spielbar?** (Entscheidung:
  Landscape erzwingen mit Dreh-Hinweis ODER Portrait-Layout bauen.)
- [ ] **Landscape-Modus:** Topbar, Ticker, HUD lesbar?
- [ ] **Aim-Steuerung:** Wie visiert man per Touch an? Funktioniert Aim-Linie?
- [ ] **Canvas-Skalierung:** Keine unscharfen Kanten (DPR-Pfad prüfen),
  keine abgeschnittenen UI-Bereiche (safe-area, `viewport-fit=cover` → Notch)
- [ ] **Performance:** 60 fps auf einem Mittelklasse-Handy (Chrome DevTools
  Remote Debugging; Partikel + Konfetti sind der Druckfall)
- [ ] **Audio:** Autoplay-Regel — erster Touch startet die Engine,
  danach läuft Titel-Musik? (iOS-Safari ist der Strengste.)
- [ ] **Bürozeit-Shop** auf kleinem Screen scrollbar, Buttons nicht
  überlappend (DOM/Overlay, nicht Canvas!)

### Entscheidungsvorlage (Porträt vs. Landscape)

| Option | Pro | Contra | Aufwand |
|---|---|---|---|
| Landscape erzwingen (Rota-Hinweis) | 960×620 bleibt 1:1, kein Layout-Coding | Unfreundlich, iOS warnt eh | klein |
| Portrait-Layout bauen (960×620 → z. B. 620×960 umlegen, Theke horizontal) | Native Haltung des Daumens | Neue Layout-Konstanten, Rendering-Änderungen, neue QA | groß |

**Vorschlag (offen, kein Beschluss):** Erst Landscape erproben (Option A),
weil v3.0 ohnehin Straße/Wetter dazukommt und das Layout dann neu gedacht
wird. Die Entscheidung + Begründung hier eintragen.

## Accessibility (bewusst klein, weil Slice)

- `user-scalable=no` blockt Zoom → blinde Nutzer:innen sind auf Screenreader
  angewiesen, der bei Canvas-Spielen an Grenzen stößt. **Bewusst akzeptiert**
  für den Slice; dokumentiert, damit es nicht „versehentlich" so bleibt.
- Farben: Neon-Palette auf CRT-Dunkel — Kontrast ist gut, Farbsymbolik
  (Brühen: orange/braun/gelb/rot) ist für Rot-Grün-Schwäche grenzwertig
  (Tonkatsu vs. Spicy). **Option:** zusätzliches Symbol je Brühe im
  Bestellsprechblasen (Kern-Data `BROTHS` hat nur Farben/Emojis — Emoji fehlt,
  wäre v3.5-Material).
- Ton ist abschaltbar (M / Menü) — wichtig, da Musik dauerhaft läuft.

## Was der dom-check hier NICHT leisten kann

`tools/dom-check.js` prüft, dass jede `$('id')`-Referenz ein HTML-Element hat.
Mobile-Layout ist ein **Auge-Fall**: keine Referenz kaputt, aber alles zu klein,
verschoben, ungreifbar. Deshalb steht Mobile-QA in der QA-CHECKLIST als
reine Menschenarbeit.

## Protokoll (füllen, wenn es gespielt wurde)

| Datum | Gerät | OS/ Browser | Landscape/Porträt | Ergebnis | Anmerkung |
|---|---|---|---|---|---|
| — | (noch nie getestet) | — | — | — | v2.9.3-Task |
