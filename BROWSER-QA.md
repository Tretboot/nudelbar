# NUDELBAR — Browser-QA-Protokoll v2.9.2.8

**Zweck:** Exakt definieren, was im Browser von einem Menschen getestet wird,
welche Screenshots es wert sind und wie ein externes AI-Modell Screenshots
gegen klare Fragen prüfen kann. Die Unit-Tests (272) testen den Kern — hier
wird getestet, was **Menschen sehen, hören und anknöpfen** (können).

**Testobjekt:** `releases/NUDELBAR-v2.9.2.8/` (entpackt, `index.html`
doppelklicken) — oder das Repo direkt, beides ist identisch.
**Browser:** Chrome/Edge, Desktop + einmal mobil (Touch).
**DevTools:** F12 offen lassen. **Console-Tab auf „keine roten Zeilen"**
ist Daueraufgabe — bei Test 0 ein Screenshot der leeren Console.

> **Sparsamkeitstipp (LocalStorage-Cheats):** Die „Bar erinnert sich"-Tests
> brauchen 3 Neustarts bzw. eine komplette Kampagne. Zum schnellen
> Nachstellen: DevTools → **Application → Local Storage** →
> `nudelbar_restarts` auf `3` setzen (Meta-Zeile) bzw.
> `nudelbar_stats` auf
> `{"campaigns":5,"wins":1,"bestCredits":3200,"bestRep":70,"bestNight":20,"totalServed":830,"bestCombo":14}`
> setzen (Rekorde-Zeile) → Seite neu laden. Die organische Variante steht
> bei jedem Test in Klammer.

---

## Test 0 — Start & Konsole (5 Min.)

1. `index.html` öffnen.
2. Watchen: lädt alles, kein Black Screen, Titel-Animation läuft,
   „🔑 NUDELBAR" + Badge **v2.9.2.8** sichtbar.
3. DevTools Console: **null** rote Fehler, null Warnungen mit „NUDELBAR".
   Network-Tab: `style.css`, `js/core.js`, `js/app.js`, `js/audio.js`,
   `js/intro.js` alle geladen (200).

- **Screenshot:** `00-titel-freilauf.png` (kompletter Titelbildschirm)
- **Screenshot:** `00-console-leer.png` (DevTools, Console leer, Network alle grün)
- **AI-Frage (Prompt A):** siehe unten.

**Bestanden =** Titel läuft, Console sauber. Rot/Black-Screen → STOP,
alles abbrechen, Screenshots + Konsolen-Text schicken.

---

## Test 1 — Meta-Element: „Die Bar erinnert sich" (v2.9.2.6, 10 Min.)

**Ziel:** Ab 3 Neustarts sagt die Bar es auf dem Startbildschirm.

1. `nudelbar_restarts` auf `3` setzen (Cheat oben) → neu laden.
2. Startbildschirm (Name/Chef/Preis-Setup) anschauen.
3. Erwartet: oberhalb des „🔑 AUFSCHLIESSEN"-Knopfs die pink
   Kursiv-Zeile: **„Du hast mich schon 3 Mal neu gestartet. Ich erinnere mich."**
4. `nudelbar_restarts` auf `0` setzen → neu laden → Zeile ist **weg**.
5. (Organisch: Startbildschirm 3× durch „AUFSCHLIESSEN" durchlaufen —
   die erste Schicht zählt nicht.)

- **Screenshot:** `01-metazeile-3.png` (Startbildschirm mit der Zeile)
- **AI-Frage (Prompt B).**

**Bestanden =** Zeile ab 3 sichtbar (mit der echten Zahl), bei 0/1/2 nicht.
**Typischer Fehler:** Zeile steht auch ohne Neustarts da, oder gar nicht.

---

## Test 2 — Rekorde (v2.9.2.6, 10 Min.)

**Ziel:** Gemerkte Kampagnen werden auf Start- und Endscreen gezeigt.

1. `nudelbar_stats` mit dem Cheat-JSON (oben) setzen → neu laden.
2. Startbildschirm: graue Zeile **„Bisher: 5 Schichten · 1 Sieg · beste
   Nacht 20/20 · 830 bedient."**
3. (Organisch: eine Kampagne zu Ende spielen → Endscreen zeigt neue Zeile
   „📊 Rekorde: …" → zurück zum Titel → „Bisher"-Zeile aktualisiert.)

- **Screenshot:** `02-titel-rekorde.png` (Startbildschirm, Rekorde-Zeile)
- **Screenshot (nur bei Organsich-Lauf):** `02-endscreen-rekorde.png`
- **AI-Frage (Prompt B, zweiter Teil).**

**Bestanden =** Zahlen stimmen (5/1/20/830), nach einer echten Kampagne
werden sie gemerged (nie schlechter).

---

## Test 3 — Bug-Gast, Nacht 10 (v2.9.2.5, ~45–60 Min.)

**Ziel:** Der Lorebook-Eintrag „Der Bug wird Gast" passiert sichtbar im Spiel.
**Empfehlung:** fester Seed (z. B. `42`) für Nachvollziehbarkeit, schnell
spielen, ab und zu nur servieren.

1. Nacht 10 starten. **Rund Sekunde 40** (ca. 10–20 Gäste später) sollte
   ein Gast reinkommen und sich **setzten, ohne Bestellung**:
   - 💻-Kopf, grau-blauer Körper, **keine** Bestell-Sprechblase,
     **kein** Geduld-Ring.
   - Gelbe Sticky-Note neben ihm: **„TODO: v3.0"**, kleine Tipp-Partikel.
   - Log (unten): „💻 Der Bug-Gast setzt sich. Bestellung: 2× nichts,
     1× Fehler. Geduld: extra."
2. **~60 Sekunden** tippt er — er geht **nicht** weg, auch wenn alle
   anderen längst abgerauscht sind.
3. Danach steht er auf und geht (hopsend, nicht wütend), Log-Zeile:
   „💻 „Danke. Der Bug ist gefixt. Oder: er ist jetzt Feature."
4. Rest der Nacht + alle Folgenächte: er kommt **nie wieder**.
5. (Mechanik — nicht direkt sichtbar, nur als Hinweis notieren:) Während
   er da ist, werden Patzer öfter verziehen (+0.10, wie bei der Katze).
   Unit-Tests 52–54 decken das ab; im Browser reicht das Auge.

- **Screenshot:** `03-buggast-typing.png` — **wichtig:** Gast MIT Sticky-Note
  UND das Log-Fenster mit der arrivals-Zeile im Bild.
- **Screenshot:** `03-buggast-log-gang.png` (Log-Zeile beim Gehen)
- **AI-Frage (Prompt C).**

**Bestanden =** erscheint Sek. ~40, bleibt ohne Bestellung/Geduld-Ring
sitzen, geht nach ~60 s mit seiner Zeile, bleibt weg.
**Typische Fehler:** Gast hat eine Bestellung in der Blase / Geduld-Ring
(das wäre ein normaler Gast, der nur schlecht aussieht), er geht nach
10 s weg, er kommt in Nacht 11 nochmal.

---

## Test 4 — Speisekarte (v2.9.2.8, 10 Min.)

**Ziel:** K zeigt echte Preise der aktuellen Preisstufe.

1. In einer Nacht (beliebige) **K** drücken.
2. Overlay „📋 SPEISEKARTE": Stufen-Zeile (z. B. „Preisstufe: Standard —
   Der faire Mittelweg."), Tabelle mit **4 Brühen + 5 Beilagen**, rechts
   die Preise. Bei Standard: Tonkatsu **8 €**, Ei **3 €**.
   Nicht freigeschaltete Gerichte: **🔒 (ab Nacht X)**.
3. Schließen: nochmal **K**, Button „KARTE ZU", oder die Nacht zu Ende
   spielen — sie muss sich **von selbst** schließen.
4. Im Büro (C) Preisstufe auf **Billig** setzen → nächste Nacht → K:
   Tonkatsu **6,8 €**. Auf **Exklusiv** → **10 €**.
5. **K** zwischen den Nächten (Bürozeit) = passiert nichts (Karte nur
   in der Nacht).

- **Screenshot:** `04-karte-standard.png` (komplettes Overlay)
- **Screenshot:** `04-karte-billig.png` (gleiche Ansicht, andere Preise)
- **AI-Frage (Prompt D).**

**Bestanden =** Preise exakt 8/6,8/10 € pro Stufe, 🔒-Zeilen korrekt,
alle 3 Schließwege + Auto-Schließen funktionieren.
**Typische Fehler:** Karte bleibt nach Nachtende über dem Shop liegen,
Preise gleich bei allen Stufen (Stufe wird nicht gelesen).

---

## Test 5 — Morgengrauen (v2.9.2.7, nur bei vollem Lauf)

**Ziel:** 20 Nächte durch → Endscreen in Morgenlicht.
**Realität:** nur bei einer kompletten Kampagne (Sieg „Die Naht" **oder**
Verlust in Nacht 20 — das Grauen kommt in beiden Fällen). Unit-Test 57
deckt die Logik ab; hier ist es ein „bei Gelegenheit"-Test.

1. Eine Kampagne bis Nacht 20 durchspielen (oder den Seed aus Test 3
   weiterspielen).
2. Endscreen: **warmer Orange/Pink-Grauen-Gradient** (statt rein dunkel),
   Titel in Morgen-Orange, Chronicle-Zeile **„🌅 Morgen: Die Stadt wacht
   auf. Der Dashi nicht."**
3. Gegencheck (falls schon mal früher verloren wurde): Endscreen nach
   Nacht 5 = normale Nacht-Farben, keine Morgen-Zeile.

- **Screenshot:** `05-morgengrauen.png` (kompletter Endscreen)
- **AI-Frage (Prompt E).**

**Bestanden =** Grauen-Endscreen NUR bei erreichter Nacht 20.

---

## Test 6 — Regression: Altes darf nicht kaputt sein (laufend)

Während der Läufe oben notieren (kein eigener Zeitplan):

- [ ] **Gast-Dialog** (selten!): Panel mit Persona-Frage, 3 Antworten,
      Timer, Antworten in **anderer Reihenfolge** als im letzten Dialog,
      Reaktion des Gasts sichtbar, `sfxPhone` beim Erscheinen.
- [ ] **Katze**: +Trinkgeld/Verzeihung, Log-Zeilen ankommen/gehen.
- [ ] **Partytime**: 4+ Gäste → Hüte, Konfetti, Fanfare.
- [ ] **SFX**: Think (Sims-Blase), Bad (Fehlschüssel), Zenjiru (leere
      Schüssel), Dispatch (Servierwurf) — alle hörbar.
- [ ] **Endscreen**: Abzeichen-Zeile (verdient = Name+Nacht, nicht = 🔒 ???),
      Rekorde-Zeile (Test 2), Greta-Zeile.
- [ ] **Mobile (einmalig):** Touch-Steuerung spielt die Nacht. (Die
      Speisekarte ist ein Tastatur-Feature (K) — am Handy einfach nicht
      erreichbar, das ist gewollt, kein Bug.)

- **Screenshot:** `06-dialog-panel.png` (wenn mal ein Dialog kommt —
  seltene Ware, nicht zwingen)

---

## Die Screenshot-Liste (Kurzfassung)

| # | Dateiname | Was drauf sein muss | Pflicht |
|---|---|---|---|
| 1 | `00-titel-freilauf.png` | Titelbildschirm komplett | ✅ |
| 2 | `00-console-leer.png` | DevTools-Console ohne rote Zeilen | ✅ |
| 3 | `01-metazeile-3.png` | Startbildschirm + Meta-Zeile (3) | ✅ |
| 4 | `02-titel-rekorde.png` | Startbildschirm + Rekorde-Zeile | ✅ |
| 5 | `03-buggast-typing.png` | Bug-Gast + Sticky-Note + Log-Zeile | ✅ |
| 6 | `03-buggast-log-gang.png` | Log-Zeile beim Abschied | ✅ |
| 7 | `04-karte-standard.png` | Speisekarte, Standard-Preise | ✅ |
| 8 | `04-karte-billig.png` | Speisekarte, Billig-Preise | ✅ |
| 9 | `02-endscreen-rekorde.png` | Endscreen mit Rekorde-Zeile | bei Organsich-Lauf |
| 10 | `05-morgengrauen.png` | Endscreen in Morgenlicht | nur bei Nacht-20-Lauf |
| 11 | `06-dialog-panel.png` | Gast-Dialog mit Timer | Opportunistic |

Regeln: Vollbild (kein Crop), beim Bug-Gast-Screenshot das Log-Fenster
mit drin, Dateinamen exakt wie oben (macht das Sortieren).

---

## AI-Prüfung extern (Prompts kopieren, Screenshot anhängen)

Anleitung: Screenshot + Prompt an ein anderes Model schicken. Es soll
**nur** auf die Frage antworten — keine Spielberatung.

**Prompt A — Titel & Konsole** (für `00-titel-freilauf.png` + `00-console-leer.png`):
> Hier sind zwei Screenshots eines Browser-Spiels. Frage 1: Welches
> Versions-Badge steht rechts neben dem Titel? Frage 2: Siehst du im
> zweiten Screenshot (DevTools-Console) auch nur eine einzige rote
> Fehlerzeile? Falls ja: zitiere sie wortwörtlich. Falls nein: antworte
> „Konsole sauber".

**Prompt B — Erinnerung** (für `01-metazeile-3.png` + `02-titel-rekorde.png`):
> Screenshot des Startbildschirms eines Ramen-Bar-Spiels. Zitiere
> wortwörtlich (1) die kursiv-pinke Zeile über dem Startknopf, falls eine
> da ist, und (2) die graue Statistik-Zeile darunter, falls eine da ist.
> Nenn auch die Zahl, die in der pinken Zeile vorkommt.

**Prompt C — Bug-Gast** (für `03-buggast-typing.png`):
> Screenshot aus einem 2D-Ramen-Bar-Spiel. Prüfe den sitzenden Gast mit
> dem Laptop: (1) Hat er eine Bestellung in einer Sprechblase? (2) Hat er
> einen farbigen Geduld-Ring um den Kopf wie die anderen wartenden Gäste?
> (3) Ist eine gelbe Notiz mit Text sichtbar — was steht darauf? (4) Zitiere
> die Log-Zeile im unteren Fenster, die mit „💻" beginnt. Antworte
> ja/nein/Text pro Punkt.

**Prompt D — Speisekarte** (für `04-karte-standard.png` + `04-karte-billig.png`):
> Hier sind zwei Screenshots der Speisekarte eines Ramen-Bars. Liste für
> beide: die Preisstufe oben und den Preis der „Tonkatsu"-Brühe sowie
> der „Ei"-Beilage. Zähle außerdem die Gerichte mit einem 🔒-Symbol.
> Stimmen die Preise zwischen den beiden Screenshots (8 € vs 6,8 €)?

**Prompt E — Morgengrauen** (für `05-morgengrauen.png`):
> Screenshot eines Endscreens. (1) Ist der Hintergrund auffällig
> orange/rosa verfärbt (Morgenlicht) oder dunkel-nachtlich? (2) Findet
> sich eine Zeile mit dem Wort „Morgen" — zitiere sie. (3) Wie lauten die
> Zahlen in den Statistikfeldern „Nächte" und „Bedient"?

---

## Wenn etwas fehlschlägt

Schicken: (1) die Test-Nummer, (2) den passenden Screenshot, (3) den
**vollen** Console-Text (Copy aus DevTools), (4) Browser + Gerät.
Nicht selbst umprogrammieren — das hier ist eine Messung, keine Reparatur.

---

*Protokollstand: v2.9.2.8, 12.10.2026. Logik-Abdeckung (Kern) liegt bei
272 Unit-Tests — dieses Protokoll testet bewusst nur die dünne Haut:
Rendering, Overlays, Timing-Gefühl, Ton, Konsole.*