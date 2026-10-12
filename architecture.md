# NUDELBAR (ehem. DAMPF & PHASE) — Architektur

## Grundsätze
1. **Kern ohne DOM.** `js/core.js` ist reines Verhalten: keine Variablen, keine
   Variablen. Node (`require('./js/core.js')`) und Browser (`window.DAMPF.core`)
   liefern dasselbe Modul (UMD-Wrapper).
2. **Determinismus.** Ein `mulberry32`-PRNG mit Spielerseed. Alle Zufallsentscheidungen
   laufen durch `state.rnd()`. Gleicher Seed + gleiche Eingaben = identisches Spiel
   (von `tests.js` abgedeckt).
3. **Rendering trennen.** `js/app.js` beobachtet den Zustand (Differenz-Checks),
   erzeugt SFX/Partikel und zeichnet. Der Kern kennt kein Canvas.
4. **Zero Dependencies.** Keine Libs, keine Fonts, keine Assets. WebAudio synthetisiert
   alles (Shamisen, Cembalo, 8-Bit-SFX).

## Module
```
js/core.js   ~900 Zeilen. UMD-Modul.
             - CONFIG (alle Tuning-Konstanten an EINER Stelle)
             - BROTHS / TOPPINGS / PERSONAS / GROUPS / EVENTS / UPGRADES / PRICE_LEVELS
             - createGame(opts{seed,barName,chefEmoji,priceLevel}) → state
             - tick(state, dt)          dt wird auf 0.05 geklemmt → viele kleine Ticks
             - Aktionen: pourBroth, addTopping, serveBowl, fryBatch, discardBowl,
                         buyUpgrade, buyTopping, setPriceLevel, startNextNight
             - Anfragen: brothOf, toppingOf, personaOf, priceLevelOf, unlockedBroths,
                         unlockedToppings, maxToppings, seatCount, firstWaitingSeat,
                         firstEmptySeat, priceOfOrder, computeReaction, bowlSimilarity,
                         upgradeCost, upgradeLevel, phaseInfo, chronicle, log
js/app.js    Renderer/Controller:
             - Layout-Konstanten (W=960, H=620; Tür, Karte, Theke, Stationen)
             - Canvas-Fitting: 960×620-Raum wird skaliert + zentriert (Letterbox),
               DPR-aware; Klick-Zonen pro Frame neu (hits[])
             - Gast-Animation: Easing zwischen Tür → Karte → Theke → Tür,
               Hoppsen (glücklich/sauer), Wurf-Physik, Partikel, Screen-Shake
             - Blasen: Bestell-Blase (Mini-Schüssel + Preis), Sims-Blase,
               Reaktions-Blase (Label BEGEISTERT/ZUFRIEDEN/ÜBERRASCHT/MURRKOPF/BLEIBT SITZEN),
               Chat-Blase (Gossip)
             - Chef: Stimmungs-Mood (game.chefMood), Wurfbewegung
             - Input: Tastatur, Maus (Hover-Tooltip), Touchpad, Gamepad
             - Overlays: Start (Setup: Name, Chef-Emoji, Preis, Seed), Hilfe,
               Bürozeit (manueller „Nächste Nacht“-Button), Feierabend
js/audio.js  AudioEngine (WebAudio): Pentatonik-Shamisen, Cembalo-Walzer,
             SFX: Cook, Throw, Door, Happy, Angry, Slurp, Coin, Phase, Click, Upgrade, Bad
```

## Gast-Lebenszyklus (Kern)
```
entering (Tür → Karte)
  → thinking (Sims-Blase)
  → waiting (Geduld-Ring; Mood-Bonus via Contagion; Gossip; Walkout → leaving[angry])
  → eating (Persona-Tempo; finisher wird im doServe gewürfelt: 'clean'|'left')
  → [clean] sipping (Schlürfen → CLEAN_BONUS)
  → lingering? (Chance: Stammgast+40 %, Begeistert+25 %, … → Bleiber-Sprache)
  → leaving (HAPPY_LEAVE, hoppsend)   |   leaving[angry] (LEAVE_TIME, wirft Schüssel)
```

## Servieren & Reaktion
- `serveBowl` fliegt zum **ältesten wartenden** Gast (kein Zielwahl).
- `bowlsMatch` = exakt gleich → `doServe(match)`.
- Sonst `chance = FORGIVE_BASE + persona.forgiving*0.30 + (sameBroth?0.20:0) + overlap*0.06`
  → `doServe(accidental)` (80 % Preis, eigener Spruch-Pool) oder `doWrong`
  (−3 Rep, Combo-Reset, Schüssel fliegt, Koch 😬).
- Zahlung: `price + tip + speed`. Tipp = `price*0.3*(0.4+rep/100)*tipMult*comboMult*priceLevelMult*(1+tipBonus)`.

## Wichtige Invarianten
- `tick` klemmt `dt ≤ 0.05` → Tests/Sim ticken mit vielen kleinen Schritten.
- Rep-Niederlage wird **im Tick** geprüft (nicht nur am Nachtende).
- `startNextNight` setzt `phaseClock = BETWEEN_DURATION`; der App-Loop pausiert die
  Welt in der Bürozeit, bis der Spieler sie durchlässt (`shopSkip`).
- Endscreen ist **nicht** auto-dismissed — der Spieler klickt selbst weiter.
- `stats.lines` hält nur die letzten 12 Gesprächs-Zeilen (Chronist-Report greift darauf zurück).

## Tuning
Alles Balance-Relevante sitzt in `CONFIG` (Kern) — keine magischen Zahlen im Code verteilt.
Empfohlene Dialektik für „schwerer": `WIN_CREDITS ↑`, `CLEAN_BONUS ↓`, `FORGIVE_BASE ↓`,
`BASE_SPAWN ↓`, `PATIENCE_BASE ↓`, Einkaufspreise (`TOPPINGS[].buy`) ↑.
