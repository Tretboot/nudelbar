# NUDELBAR — Release Notes

## v2.9.2.8 „Die Speisekarte" — 12.10.2026

**Status:** Release-Paket (spielbar) · **Zustand:** 272/272 Unit-Tests ·
25/25 Balance-Sim · DOM-Vertrag OK · MIT + Sonderklausel

### Starten

Entpacken → `index.html` doppelklicken. Kein Install, kein Server, kein npm,
funktioniert offline. Jeder moderne Browser (Desktop oder Mobile).
**Für Spieler: `MANUAL.md` lesen** (Handbuch mit Steuerung, Personas,
Bürozeit, Events, Enden und Profi-Tipps).

### Was in dieser Version drin ist

**v2.9.2.8 — „Die Speisekarte" (aktuell)**
- Neue **Speisekarte** (Taste **K** während der Nacht): alle Brühen und
  Beilagen mit ihren echten Preisen in deiner aktuellen Preisstufe,
  🔒-Markierung für noch gesperrte Gerichte.

**v2.9.2.7 — „Morgengrauen"**
- Alle 20 Nächte durchgehalten? Der Endscreen liegt in Morgenlicht:
  „Die Stadt wacht auf. Der Dashi nicht."

**v2.9.2.6 — „Die Bar erinnert sich"**
- Meta-Element: ab 3 Neustarts sagt die Bar es dir auf dem Titelbildschirm.
- Rekorde (Kampagnen, Siege, beste Nacht, bediente Gäste, beste Combo)
  werden offline gemerkt (localStorage) — Endscreen + Titel.

**v2.9.2.5 — „Der Bug wird Gast"**
- Nacht 10: Der Bug-Gast (💻) setzt sich, bestellt nichts, tippt 60 s
  (Sticky-Note „TODO: v3.0"). Solange er da ist, werden Patzer öfter
  verziehen — der Lorebook-Eintrag „Der Bug wird Gast" passiert jetzt.

**v2.9.2.4 — „Tiefe Fragen"**
- Gast-Dialoge sind jetzt **selten** (Mindestabstand 45 s, ~2–4 pro Nacht)
  und **tiefer**: alle 7 Personas neu geschrieben. Drei Haltungen — warm /
  flach / kalt — die Wahl ist erkennbar, die Wirkung sichtbar.
- Dialog-Antworten erscheinen in zufälliger Reihenfolge.

**v2.9.2.3 — „Abzeichen"**
- 5 deterministische Kampagnen-Abzeichen (Zen-Meister, Party-Vater,
  Kritiker-Bändiger, Katzenfreund, Makellose Nacht) — Endscreen-Zeile,
  Log-Eintrag. Kein Gameplay-Effekt.

**v2.9.2.2 — „Die stillen Features"**
- Gast-Dialog-UI wiederhergestellt (war seit v2.9 ein totes Feature).
- 5 tote SFX verdrahtet (Think, Phone, Bad, ZenJiru, Dispatch),
  2 unbrauchbare entfernt — Audio vollständig dokumentiert.

**v2.9.2.1 — „Doku-Nachschub"**
- Übernahme-Dokumentation: ROADMAP, CONTRIBUTING, BALANCE, AUDIO, LORE,
  MOBILE, QA-CHECKLIST. Kein Code.

**v2.9.2 — „Nudelbar an der Naht"** (Basis)
- Ramen-Koch-Loop: Brühe gießen, Beilagen, Schüssel werfen. 7 Personas,
  Stammis, Bleiber, Raids, Events, Bürozeit, Shop, Upgrades, Skills,
  iMUSE-Audio (3 Stems + 5 Titel-Tracks + 16 SFX), Glückskatze, Partytime,
  Chronist-Report, Anime-Intro, Seed-System, DE/EN.

### Verifizieren (optional, braucht Node)

```bash
node tests.js           # → 272 passed, 0 failed
node sim.js             # → Sieg-Rate 25/25
node tools/dom-check.js # → DOM-Vertrag: OK
```

### Lizenz

MIT + Sonderklausel (siehe `LICENSE`).

> „Kein Build-Step. Kein npm. Kein ‚läuft bei mir'. Nur Nudeln."
> Für diese Kunst übernimmt niemand Verantwortung.