# NUDELBAR 🍜

Ein kleines, deterministisches Ramen-Bar-Spiel im Neon-CRT-Stil: Bestellungen
aufnehmen, Brühe und Beilagen kombinieren und die fertigen Schüsseln zu den
Gästen werfen. Ziel ist es, in 20 Nächten 3.000 € und 55 Reputation zu erreichen.

**NUDELBAR ist ein studentisches Experiment und ein spielbarer Prototyp.**
Mechaniken, Texte und Technik wurden während der Entwicklung mehrfach ausprobiert,
verworfen und neu aufgebaut. Feedback ist willkommen.

## Spielen

`index.html` in einem modernen Browser öffnen. Es ist keine Installation, kein
Server und kein Build-Schritt erforderlich; das Spiel läuft auch offline. Für
Audio muss einmal geklickt oder eine Taste gedrückt werden (Browser-Autoplay-Regel).

Das ausführliche [Spielhandbuch](MANUAL.md) erklärt Steuerung, Gäste, Bürozeit,
Events und Spielende.

## Spielprinzip

- Gäste bestellen verschiedene Brühen und Beilagen.
- Die Schüssel wird zusammengestellt und gezielt zum Gast geworfen.
- Richtige Bestellungen bringen Geld und Reputation; Fehler kosten Reputation.
- Zwischen den Nächten kann die Bar mit Einkäufen, Upgrades und Skills verbessert
  werden.
- Das Spiel bietet Maus, Tastatur, Touch und Controller-Unterstützung sowie
  deutsche und englische Texte.

| Eingabe | Aktion |
|---|---|
| **1–4** | Brühe wählen |
| **A S D F G** | Beilage wählen |
| **Enter / Leertaste** | Schüssel werfen |
| **R** | Fritteuse |
| **X** | Schüssel ausspülen |
| **C / Esc** | Shop und Abrechnung |
| **K** | Speisekarte |
| **?** | Hilfe |
| **P / M** | Pause / Ton an oder aus |
| **Maus / Touch / Controller** | Stationen bedienen und Ziel wählen |

## Technik

NUDELBAR verwendet Vanilla JavaScript, Canvas 2D und Web Audio API. Es gibt keine
externen Bibliotheken, Assets oder Build-Abhängigkeiten. Der Spielkern ist von der
Darstellung getrennt und verwendet einen seedbaren Zufallsgenerator, damit
Spielabläufe reproduzierbar und automatisiert testbar sind.

### Lokal testen

Für die Tests und die Simulation wird [Node.js](https://nodejs.org/) benötigt.
Es ist kein `npm install` erforderlich.

```bash
node tests.js
node sim.js
node tools/dom-check.js
```

Die Tests prüfen den Spielkern, die Simulation spielt Kampagnen mit mehreren
Seeds durch, und der DOM-Check stellt sicher, dass vom Interface referenzierte
Elemente im HTML vorhanden sind.

## Projektstruktur

| Pfad | Inhalt |
|---|---|
| `index.html`, `style.css` | Spieloberfläche und Gestaltung |
| `js/core.js` | Spielregeln, Konfiguration und Spieltexte |
| `js/app.js` | Rendering, Eingaben und Benutzeroberfläche |
| `js/audio.js` | Synthetische Musik und Soundeffekte |
| `js/intro.js` | Animiertes Intro |
| `tests.js`, `sim.js` | Unit-Tests und Balance-Simulation |
| `tools/dom-check.js` | Prüfung der HTML-/DOM-Referenzen |
| `MANUAL.md` | Handbuch für Spielerinnen und Spieler |
| `master_log.md` | Projekt- und Versionsgeschichte |
| `CONTRIBUTING.md` | Hinweise zur Mitarbeit |
| `LICENSE` | Lizenzinformationen |

Weitere technische und gestalterische Hintergründe stehen in
[`architecture.md`](architecture.md), [`ROADMAP.md`](ROADMAP.md) und
[`special_edition/dev-history.md`](special_edition/dev-history.md).

## Entstehung und Dank

Dieses Projekt wurde im Rahmen des Studiums **Cognitive Science an der
Universität Osnabrück** als Test und Experiment in der **Kiwi-Instanz** zum Leben
erweckt. Die Entwicklung ist KI-unterstützt und hat sich über mehrere Iterationen
und Modelle hinweg entwickelt; einige Stationen sind im
[Master-Log](master_log.md) dokumentiert.

Ein herzliches Dankeschön an [Kiwi](https://kiwi.uni-osnabrueck.de/) für die
Tokens, die lokalen Modelle und LibreLLM – und für die Infrastruktur, die dieses
Experiment ermöglicht hat.

**Projektinitiator:** Tretboot auf GitHub.

## Lizenz

Siehe [`LICENSE`](LICENSE). Die Lizenzdatei enthält die MIT-Lizenz sowie eine
zusätzliche Projektklausel.
