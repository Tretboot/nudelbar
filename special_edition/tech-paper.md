# NUDELBAR: Warum wir bei JavaScript bleiben (und wann wir nicht mehr würden)

**Autor:** Lead Developer (Bass-Performance) · v2.9 · 11.02.2026

---

## 1. Status quo

5.700 Zeilen Vanilla JS (ES5), Canvas 2D, Web Audio API. Kein Build-Step, kein npm, keine Dependencies. 122 Unit-Tests + 25-Sim laufen in < 2 Sekunden. Das Spiel lädt in < 100 ms auf einem Mittelklasse-Handy. Es funktioniert in jedem Browser seit 2015.

## 2. Optionen

### Rust + WASM
**Pro:** 10x schneller, Memory-Safety, deterministische Performance.
**Contra:** Build-Step (wasm-pack), 50 MB Toolchain, Canvas-Binding-Overhead, ES5-Kompatibilitaet verloren. Fuer ein Spiel mit 60 fps und 150 Partikeln: **Overkill.**

### Python + Pyodide
**Pro:** Schnell prototypen, Data-Science-Tools fuer Balance-Sim.
**Contra:** Pyodide laedt 10 MB WASM-Interpreter. Canvas-Rendering in Python = 10x langsamer. Fuer ein Browser-Spiel: **falsches Werkzeug.**

### TypeScript (gleicher Stack, nur Typen)
**Pro:** Bessere IDE-Unterstuetzung, Refactoring-Sicherheit, Team-Kommunikation.
**Contra:** Build-Step (tsc), ES5-Target noetig fuer alte Browser, 5.700 Zeilen migrieren = 1 Tag Arbeit fuer 0 Spieler-Nutzen. **Sinnvoll ab 10.000 Zeilen oder 2+ Entwickler.**

### C++ + Emscripten
**Pro:** Maximale Performance, native Audio-Latenz.
**Contra:** Komplexester Build, 200 MB Toolchain, Debugging im Browser = Albtraum. Fuer ein Nudel-Spiel: **wie mit einem Panzer einen Briefkasten aufbrechen.**

## 3. Entscheidung

**Wir bleiben bei Vanilla JS (ES5).** Der Stack ist so klein, dass jeder Entwickler ihn in 30 Minuten versteht. Kein Build-Step = kein "laeuft bei mir". Die 122 Tests + 25-Sim sind die eigentliche Qualitaetssicherung — nicht die Sprache.

## 4. Wann wir wechseln wuerden

**Trigger 1:** > 15.000 Zeilen oder > 3 Entwickler -> TypeScript.
**Trigger 2:** 3D-Rendering oder Physik-Engine -> Rust + WASM (nur die Hot-Path-Module).

---

## Refactoring-Vorschlaege (ohne Sprachwechsel)

1. **app.js ist zu gross (1.395 Zeilen).** Trenne in `app-render.js` (Canvas-Draw) + `app-input.js` (Key/Mouse/Touch) + `app-ui.js` (Shop, HUD, Overlays). Jede Datei < 500 Zeilen.

2. **KAWAII-Block in core.js (200+ Zeilen) gehoert in `js/lore.js`.** Er ist reine Daten (Texte, Personas, Skills) — keine Logik. core.js wird 200 Zeilen schlaenger.

3. **CONFIG-Objekt (80+ Keys) in `js/config.js` auslagern.** Balance-Tweaks ohne core.js anzufassen. Sim.js und tests.js koennen dann eigene Config-Overrides laden.
