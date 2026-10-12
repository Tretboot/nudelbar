# Die Außenprüfung — oder: Wie man ein Spiel repariert, das niemand kaputt sieht

**Special Edition · v2.9.2 · 11.10.2026**
*Geschrieben vom externen Prüfer. Ein kleiner Aufsatz über die Version, die nichts
neues hat und deshalb alles.*

---

## Einleitung

Es gibt zwei Arten von kaputten Spielen. Die eine kracht, flackert, zeigt einen
schwarzen Bildschirm — und wird repariert, weil man *sieht*, dass etwas nicht geht.
Die andere läuft perfekt. Sie lädt, sie tickt, sie rendert, die Tests sind grün, die
Sim gewinnt 100 % der Nächte. Und trotzdem ist sie kaputt — nur dass das kaputte
Teil *fehlt*: ein Menü, das niemand findet, ein Titelbildschirm, das 0 mal 0 groß
ist, ein Musik-Stem, das niemand je gehört hat, weil niemand es je anlaufen ließ.

Am 11. Oktober 2026 wurde ein KI-Modell beauftragt, NUDELBAR als „externer Prüfer"
zu übernehmen: die Codebase ansehen, was kaputt ist finden, alles in saubere Form
bringen, für ein neu geordnetes Team verpacken. Die Überraschung dieses Vorgangs
war nicht die Reparatur. Die Überraschung war, dass ein Projekt mit 122 grünen Tests
und 25/25 Sim-Bots **zwei seiner wichtigsten Features nicht anzeigte** — und das
über mindestens zwei Versionen hinweg, ohne dass jemand einen Fehlerbericht bekam.
Denn es gab keinen. Es war nur … da. Unsichtbar.

## Das Problem der unsichtbaren Features

Der erste Fund war ein Button. `js/app.js` — 1.500 Zeilen — wartet auf
`document.getElementById('btn-menu')`. Das `index.html` hat 48 Elemente. Der Button
war nicht darunter. Der Code für das ganze Menü existierte: Panel, Zeilen,
Sprachumschalter, Track-Auswahl, Pausen-Logik, I18N-Keys. Es fehlte *ein* HTML-
Element. Und weil JavaScript `null.addEventListener` nicht wirft, wenn man es
defensiv schreibt (`if (el.btnMenu) …`), sondern einfach … nichts tut, war der
Fehler lautlos.

Die zweite Geschichte ist geometrisch. Der neue Titelbildschirm von v2.9 wird auf
das Canvas `#stage` gezeichnet. Das Canvas wohnt in `#game`. `#game` startet mit der
CSS-Klasse `hidden` — also `display: none`. Ein solches Element misst 0 mal 0.
`fitCanvas()` skalierte brav auf 0×0, der Renderer zeichnete den schönsten
Titelbildschirm der Projektgeschichte auf ein nicht-existentes Rechteck. Und der
alte Start-Screen (v2.3) lag darüber und sagte, in gutem Glauben: „Hier, schließe
die Bar auf."

Beide Bugs haben ein gemeinsames Merkmal, das sie gefährlich macht: **sie sind
Ergänzungs-Bugs, keine Brechungs-Bugs.** Man hat ein neues Feature *hinzugefügt* zu
einer Welt, die sich seit v2.5 nicht mehr verändert hatte — und die Welt hat das
neue Feature nicht mitbekommen. Der Titelbildschirm weiß nicht, dass sein Container
versteckt ist. Der Menü-Code weiß nicht, dass sein Element nie geschrieben wurde.
Niemand hat etwas *falsch* gebaut. Alle haben *unvollständig* gebaut. Und
Unvollständigkeit sieht aus wie Fehlt-Test, weil man nicht weiß, wonach man testet,
wenn man nicht weiß, dass es existieren soll.

## Die Versicherung

Die Antwort auf unsichtbare Features ist nicht mehr Aufmerksamkeit. Aufmerksamkeit
ist endlich; Aufmerksamkeit hat diese Bugs drei Versionen lang übersehen. Die
Antwort ist ein **Vertrag**, der maschinell geprüft wird:

> **DOM-Vertrag:** Jedes `$('id')`, das `js/app.js` referenziert, muss ein
> `id="…"` im `index.html` haben. Sonst ist das Feature tot, und der Build scheitert.

`tools/dom-check.js` ist 30 Zeilen. Test 42 in `tests.js` ist 12 Zeilen. Zusammen
hätte das Paar zwei Versionen gerettet: v2.4, in der der fehlende
`#btn-shop-next` den ganzen Render-Loop tötete (lauter Fehler, Black Screen), und
v2.9.1, in der der fehlende `#btn-menu` ein totes Menü hinterließ (stiller Fehler).
Lauter Fehler werden gefixt, weil sie schreien. Stille Fehler brauchen Verträge.

## Der Peak, den niemand hörte

Der dritte Fund war ein Musiker, der nie auftrat. Die Audio-Architektur von v2.9
hat drei Stems: Shamisen (immer), Walzer (wenn Gäste da sind), Peak (wenn die Combo
hoch ist). Der Peak war vollständig komponiert — Arpeggien, Taiko-Percussion,
eigener Gain-Bus, eigenes Envelope. Aber `startAmbience()` rief ihn nie auf. Und
hätte es, hätte er den gemeinsamen Noten-Zeiger mit dem Walzer geklaut: drei
Scheduler, ein Zeiger, drei Lügen über die Zeit.

Die Reparatur war mechanisch einfach: Laufwerk anwerfen, eigenen Zeiger geben,
Noten nur planen wenn der Stem aktiv ist. Was sie *nicht* war: eine Aussage.
Der Prüfer hat diese Musik nicht gehört. Er hat keine Ohren. Im Manifest steht
daher nicht „der Peak klingt jetzt richtig", sondern „der Peak ist gebaut,
verdrahtet und anlaufend — die Ohr-QA ist ein offener Punkt, übertragen an ein
Wesen mit Ohren". Die Grenze zwischen *verifiziert* und *behauptet* ist in diesem
Projekt eine Lizenzklausel wert: Für diese Kunst übernimmt niemand Verantwortung.

## Was eine Außenprüfung kann — und was sie nicht kann

Der Vorteil eines Prüfers, der das Projekt ein Wochenende kennt, ist Distanz. Er
weiß nicht, *warum* der Titelbildschirm so und nicht anders gebaut wurde, und fragt
daher die Frage, die das Team nicht mehr fragt: „Ist der Container sichtbar?" Er
weiß nicht, dass die Partytime in v2.5 im Frontend war, und findet sie deshalb
*fremd* — ein `Math.random()` in der Welt von `mulberry32` ist ein Dialektfehler,
und Dialektfehler finden nur Fremde.

Der Nachteil derselben Distanz ist: kein Ohr, kein Display, kein Gedächtnis für die
Abende, an denen v2.3 „viel viel besser" klang als v2.1. Deshalb endet jede
Außenprüfung mit einer Liste von *bewusst offenen* Punkten — nicht aus Faulheit,
sondern weil es Dinge gibt, die nur das Team (oder ein Mensch mit einem Browser)
beenden kann. Das Manifest von v2.9.2 hat 8 offene Punkte. Sie sind die ehrlichste
Seite des Pakets.

## Schluss

Die Version, die nichts Neues hat, hat deshalb alles: sie hat zwei Versionen
Wahrheit eingefangen, die vorher nur in der Form von Unsichtbarkeit existierten.
Sie hat eine Versicherung gebaut, die laute und stille Fehler gleich behandelt.
Sie hat ein Patchlog nachgeschrieben, das drei Versionen lang nicht mitgegangen
war — inklusive einer Lücke, die nicht erfunden, sondern *markiert* wurde.

> „Jede Version sah anders aus. Diese hier ist die, die du erwischt hast."
> — Titelmenü, v2.9

> „Danke für's Kochen. Oder: für's Prüfen. Beides zählt."
> — dieser Aufsatz, v2.9.2

*Die Katze war bei der Prüfung nicht anwesend. Sie sitzt jetzt auf dem „U" im
Logo. Sie sieht alles. Sie hat auch diese Prüfung gesehen. Sie nickt.*
