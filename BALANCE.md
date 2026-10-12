# NUDELBAR — Balance-Dokumentation

**Stand (v2.9.2, 12.10.2026):** Der Sim-Bot gewinnt **25/25** Kampagnen in
**Ø 6.5/20 Nächten**. Das ist zu leicht für Menschen unter Stress. Ziel für v2.9.3:
Bot-Siegrate **60–80 %** (Empfehlung aus dem Handover).

> Die Sim ist ein Kompass, keine Wahrheit. Sie sagt: der Bot ist gut.
> Nicht: das Spiel ist gut. Prozess: eine Variable ändern → `node sim.js` →
> **Menschenspielen** → erst dann fix.

## Wie die Balance funktioniert

- Kampagne: 20 Nächte × 240 s. **Sieg: 3000 € UND 55 Reputation.**
- Start: 80 €, 10 Reputation. Overhead pro Nacht: 45 €.
- Niederlage durch Rep wird **im Tick** geprüft (sofort, nicht erst am Nachtende).
- Zahlung = Preis + Tipp + Speed-Bonus. Tipp wird von Reputation, Combo,
  Preisstufe und Skills beeinflusst.
- Reputation: +1.5 begeistert · +0.5 zufrieden · +0.8 „zufällig richtig" ·
  −3 falsche Schüssel · −4 Walkout.

## CONFIG (vollständig, `js/core.js`)

### Kampagne

| Key | Wert | Wirkung |
|---|---|---|
| `CAMPAIGN_NIGHTS` | 20 | Anzahl der Nächte |
| `NIGHT_DURATION` | 240 | Sekunden pro Nacht |
| `BETWEEN_DURATION` | 12 | Bürozeit (App pausiert die Welt, bis „Nächste Nacht") |
| `WIN_REP` / `WIN_CREDITS` | 55 / 3000 | Sieg-Bedingung |
| `START_CREDITS` / `START_REP` | 80 / 10 | Startwerte |
| `OVERHEAD` | 45 | Nachtliche Kosten |

### Gäste-Flow

| Key | Wert | Wirkung |
|---|---|---|
| `BASE_SEATS` / `MAX_SEATS` | 4 / 6 | Sitzplätze (Upgrade „Hocker": +1, max 2×) |
| `BASE_SPAWN` | 18 | Basis-Spawn-Intervall (kleiner = mehr Gäste) |
| `PATIENCE_BASE` / `PATIENCE_SPREAD` | 88 / 32 | Geduld (v2.6: 4× — Gäste treffen sich) |
| `ENTER_TIME` / `THINK_TIME` | 1.8 / 2.2 | Tür → Karte → Theke |
| `EAT_TIME` | 3.8 | Esszeit-Basis (× `persona.eat`) |
| `SIP_TIME` | 2.0 | Schlürfen (±30 %) |
| `LINGER_MIN` / `LINGER_SPREAD` | 7 / 9 | Sitzenbleiben nach dem Essen |
| `LEAVE_TIME` / `HAPPY_LEAVE` | 2.2 / 3.2 | Rausgehen (wütend / fröhlich hoppsend) |
| `CONTAGION_CHANCE` | 0.35 | Mood-Ansteckung pro Wartendem |
| `CHAT_CHANCE` | 0.5 | Mahlzeit wird im Laden kommentiert (Gossip) |

### Servieren & Reaktion

| Key | Wert | Wirkung |
|---|---|---|
| `SERVE_TRAVEL` / `MAX_TRANSIT` | 1.6 / 2 | Flugzeit der Schüssel, max. gleichzeitig in der Luft |
| `FORGIVE_BASE` | 0.14 | Basis-Chance „falsch serviert, wird trotzdem gegessen" |
| `CLEAN_BONUS` | 3 | € (und +1 Rep) für die komplett leere Schüssel (Zen-jiru) |
| `COMBO_STEP` / `COMBO_CAP` | 0.08 / 6 | Tipp-Combo-Wachstum / -Deckel |
| `LINE_HOLD` | 6.4 | Warten-in-reihe-Verhalten |

Reaktionsformel (Kern, `doServe`/`doWrong`):
`chance = FORGIVE_BASE + persona.forgiving·0.30 + (gleiche Brühe? 0.20 : 0) + overlap·0.06`

### Fritteuse & Vorrat

| Key | Wert | Wirkung |
|---|---|---|
| `FRY_COOLDOWN` / `FRY_BATCH` | 6 / 3 | Fritteuse (Upgrade: größere Charge, kürzere Kühlzeit) |
| `TOPPING_STOCK_MAX` | 4 | Maximaler Vorrat pro Beilage |

### Stammis (v2.6)

| Key | Wert | Wirkung |
|---|---|---|
| `STAYER_REORDER_BASE` | 0.05 | Nachbestell-Chance (Basis) |
| `STAYER_REORDER_REGULAR` | 0.35 | …wenn Stammgast |
| `STAYER_REORDER_ENTHUSIASTIC` | 0.20 | …wenn begeistert |
| `STAYER_REORDER_ACCIDENTAL` | 0.10 | …wenn „zufällig richtig" |
| `STAYER_MAX_REORDERS` | 3 | Max. Nachbestellungen pro Stayer |
| `STAYER_NIGHT_REP` | +2 | Bleibt die ganze Nacht |
| `DISMISS_REP` | −2 | Wird wegeschickt |

### Kawaii (v2.8)

| Key | Wert | Wirkung |
|---|---|---|
| `CAT_CHANCE` | 0.004 | Katze-Besuch |
| `CAT_MIN` / `CAT_SPREAD` | 20 / 20 | Katze-Verweildauer (s) |
| `CAT_LUCK_FORGIVE` | 0.15 | Katzen-Glück: Verzeihung |
| `CAT_LUCK_TIP` | 0.2 | Katzen-Glück: Trinkgeld |
| `DIALOG_CHANCE` / `DIALOG_TIMEOUT` | 0.05 / 12 | Gast-Dialog (Gast fragt, Spieler antwortet) |
| `EMPLOYEE_COST` / `EMPLOYEE_COOLDOWN` / `EMPLOYEE_ERROR` | 150 / 8 / 0.15 | Angestellter: Preis, Intervall, Fehlerquote |

### Partytime (v2.9.2)

| Key | Wert | Wirkung |
|---|---|---|
| `PARTY_GUESTS` | 4 | Schwellenwert (Gäste im Laden) |
| `PARTY_CHANCE` | 0.5 | pro Sekunde, wenn Schwellenwert erreicht |
| `PARTY_DUR` | 6 | Dauer der Party (s) |

## Die Schrauben für „schwerer" (in Reihung nach Wirkung, keine Empfehlung)

1. `WIN_CREDITS` ↑ (3000 → 3500+) — direkt, sichtbar, fair
2. `FORGIVE_BASE` ↓ (0.14 → 0.10) — weniger „Zufällig richtig"
3. `CLEAN_BONUS` ↓ (3 → 2) — leere Schüssel weniger lohnend
4. `BASE_SPAWN` ↓ (18 → 15) — mehr Gäste, mehr Druck
5. `PATIENCE_BASE` ↓ (88 → 70) — Wut schneller
6. `TOPPINGS[].buy` ↑ — Einkauf teurer
7. `NIGHT_DURATION` ↓ — weniger Zeit pro Nacht

**Pro Runde genau eine Variable** ändern, messen, dann die nächste.

## Preisstufen (wählbar im Setup/Shop)

| Stufe | Preis | Tipp | Spawn | Geduld |
|---|---|---|---|---|
| Billig | 0.85× | 0.8× | 1.15× | 0.95× |
| Standard | 1.00× | 1.0× | 1.00× | 1.00× |
| Exklusiv | 1.25× | 1.3× | 0.85× | 1.10× |

## Personas (`PERSONAS` in core.js)

| Persona | Emoji | MoodBias | Verzeiht | Esstempo | Leere Schüssel | Bleibt | Gewicht |
|---|---|---|---|---|---|---|---|
| Der Kritiker | 🧐 | −12 | 0.05 | 1.25 | 0.20 | 0.03 | 1 |
| Der Philosoph | 🌌 | 0 | 0.35 | 1.50 | 0.35 | 0.12 | 1 |
| Der Schwätzer | 💬 | +8 | 0.55 | 1.10 | 0.50 | 0.15 | 2 |
| Der Timide | 🙈 | −4 | 0.30 | 1.00 | 0.40 | 0.06 | 1 |
| Der Heißhunger | 🍜 | +10 | 0.60 | 0.75 | 0.80 | 0.10 | 2 |
| Der Tourist | 📷 | 0 | 0.45 | 1.20 | 0.45 | 0.05 | 1 |
| Der Regelmäßige | ☕ | +6 | 0.25 | 1.00 | 0.60 | 0.10 | 2 |

*Esstempo = Zeitmehr (0.75 = schnell, 1.5 = langsam). „Verzeiht" = wie oft eine
falsche Schüssel trotzdem gegessen wird. Gewicht = Spawn-Wahrscheinlichkeit.*

**Offene Balance-Frage:** Ist der Kritiker die richtige Endgame-Challenge, oder
deckt das Event „Der Kritiker" (repMult 2.0) diese Rolle schon? In der Sim messen.

## Brühen & Beilagen

| Brühe (unbegrenzt) | ab Nacht | Preis | | Beilage (Vorrat) | ab Nacht | Preis | Einkauf |
|---|---|---|---|---|---|---|---|
| Tonkatsu | 1 | 8 € | | Ei 🥚 | 1 | 3 € | 4 € |
| Shoyu | 1 | 8 € | | Nori 🍥 | 1 | 3 € | 4 € |
| Miso | 3 | 9 € | | Mais 🌽 | 9 | 3 € | 5 € |
| Spicy | 6 | 11 € | | Chashu 🥩 | 12 | 4 € | 6 € |
| | | | | Zwiebel 🧅 | 15 | 3 € | 5 € |

Beilagen pro Bestellung (`maxToppings`): Nacht < 5 → 1 · < 10 → 2 · ≥ 10 → 3.
Start-Vorrat: 2 Ei, 2 Nori, Rest 0.

## Nacht-Events (7, `EVENTS` in core.js)

| Event | Spawn* | Preis | Rep | Geduld |
|---|---|---|---|---|
| Ruhige Nacht | 1.0 | 1.0 | 1.0 | 1.0 |
| Sturm-Stunde (Rush) | 0.6 | 1.0 | 1.0 | 0.85 |
| Regen | 1.8 | 1.0 | 1.0 | 1.3 |
| Der Kritiker | 1.0 | 1.3 | 2.0 | 1.0 |
| Lampion-Festival | 0.8 | 1.4 | 1.2 | 0.9 |
| Raid in der Tür | 1.2 | 1.15 | 1.3 | 1.0 |
| Totstille | 2.2 | 1.0 | 1.0 | 1.2 |

\* spawnMult auf das Intervall: **kleiner = mehr Gäste**.

## Raids/Gruppen (`GROUPS` in core.js)

| Gruppe | Emoji | Persona | Charakter |
|---|---|---|---|
| Wandergruppe | 🥾 | Tourist | „Alle wollen Ramen" |
| Schulklasse | 🎒 | Heißhunger | „Hungrig, laut, zahlreich" |
| Familienausflug | 🍁 | Regelmäßige | „Alle bestellen fast dasselbe" |

## Upgrades (Bürozeit)

| Upgrade | Preis | Max | Effekt |
|---|---|---|---|
| Fritteuse-Tuning | 60 € | 3 | größere Charge, kürzere Kühlzeit |
| Zusätzliche Hocker | 100 € | 2 | +1 Sitzplatz |
| Neon-Schild | 70 € | 2 | +15 % Gastfrequenz |
| Lampions & Deko | 80 € | 3 | +1 Reputation pro Nacht |

## Balance-Prozess (für v2.9.3)

1. **Eine** Variable wählen (aus der Schrauben-Liste).
2. Ändern, `node sim.js` laufen lassen (25 Seeds).
3. Ziel: **Bot-Siegrate 60–80 %**, Ø Nächte deutlich über 6.5.
4. **Menschenspielen:** 2–3 komplette Kampagnen (20 Nächte, mit Stress, mit Raids).
5. Erst wenn *Menschen* es schwerer finden, fixieren.
6. Entscheidung + Begründung unten eintragen, Patchlog-Eintrag dazu.

## Log der Balance-Entscheidungen

| Datum | Änderung | von → nach | Begründung |
|---|---|---|---|
| 2026-10-12 | (noch keine) | — | v2.9.3-Balance-Task startet; die erste Messung gehört in diese Tabelle |
