/* =============================================================================
   NUDELBAR v2.9.2.7 — "Tapper-Ramen" — reiner deterministischer Kern
   -----------------------------------------------------------------------------
   Reine Logik, kein DOM / kein Canvas / kein Audio. Läuft unter Node (require)
   UND im Browser (window.DAMPF.core).

   Der Loop (nach Tapper):
     - Gäste kommen an der Tür rein, laufen zur Speisekarte, überlegen in einer
       Denkblase, setzen sich an die Theke und zeigen ihre Bestellung.
     - An der Station: Brühe tippen (1–4), Beilagen aus dem Vorrat (A–G),
       ⏎ servieren. Die Bowl wird vom Koch zum ältesten wartenden Gast geworfen.
     - Richtig → der Gast isst (unterschiedlich lang), schlürft evtl. die
       Brühe aus (leere Schüssel = Bonus!), bleibt evtl. noch sitzen —
       und redet. Zufriedene Stimmung steckt an (Mood-Bonus für Wartende).
       Fast richtig → manche essen die falsche Schüssel trotzdem („krass!").
       Falsch / zu langsam → Schüssel fliegt, −Reputation, der Koch macht 😬.
     - R = Fritteuse, im Shop = einkaufen + Upgrades + Preise.
     - Die Büroszeit zwischen den Nächten läuft pausiert, bis der Spieler
       startNextNight() aufruft (Oder der Kern tickt weiter, wenn niemand
       pausiert — z. B. der Sim-Bot).
     - 20 Nächte. Ziel: 3000 € UND 55 Reputation.

   Stadien pro Gast:
     entering → thinking → waiting → eating → sipping? → lingering? → leaving
                                               (angry: waiting → leaving[angry])

   v2.4-Neues:
     - Chef-Stimmungs-Gesicht (chefMood) bei Fehlschlägen/Highs
     - Schlürfen: finisher 'clean'/'left', CLEAN_BONUS für die leere Schüssel
     - Lingering: Gäste bleiben nach dem Essen noch sitzen (Stammis最爱)
     - Mood-Contagion: begeisterte Mahlzeiten heben die Stimmung der Wartenden
     - Gäste-Chat (gossip) mit gut/schlecht/neutral/lachend-Pools
     - startNextNight() für den manuellen Shop-Button
     - Standard-Barname: „NUDELBAR" (Vita: v2.2/2.3 NUDELBAR → v2.4 PHASE VOLL → v2.5 NUDELBAR, fertig)

    v2.9.2-Neues:
      - Partytime im Kern (deterministisch): 4+ Gäste → Party-State + Party-Sprüche
      - (Frontend-Fixes: Titelbildschirm sichtbar, Menü-Button, Aim-Highlight)
   ============================================================================= */
(function (global, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { global.DAMPF = global.DAMPF || {}; global.DAMPF.core = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ---- PRNG (mulberry32) — deterministisch, seedbar ---------------------- */
  function mulberry32(seed) {
    var s = seed | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (s >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };

  /* ---- Konstanten (alles hier zum Tunen) ---------------------------------- */
  var CONFIG = {
    CAMPAIGN_NIGHTS: 20,
    NIGHT_DURATION: 240,
    BETWEEN_DURATION: 12,
    WIN_REP: 55, WIN_CREDITS: 3000,
    START_CREDITS: 80, START_REP: 10,
    OVERHEAD: 45,
    BASE_SEATS: 4,
    MAX_SEATS: 6,
    SERVE_TRAVEL: 1.6,
    MAX_TRANSIT: 2,
    EAT_TIME: 3.8,             // Basis — mal persona.eat (v2.6: 2x langsamer)
    SIP_TIME: 2.0,             // Schlürfen der Brühe (Basis, ±30%)
    LINGER_MIN: 7, LINGER_SPREAD: 9,
    CLEAN_BONUS: 3,            // € für die komplett leere Schüssel
    CONTAGION_CHANCE: 0.35,    // pro Wartendem: Stimmung überträgt sich
    CHAT_CHANCE: 0.5,          // Mahlzeit wird im Laden kommentiert
    LEAVE_TIME: 2.2,           // wütendes Raus
    HAPPY_LEAVE: 3.2,          // freudiges Raus (länger, mit Hoppsen)
    ENTER_TIME: 1.8,           // an der Tür rein
    THINK_TIME: 2.2,           // an der Karte überlegen
    BASE_SPAWN: 18,
    PATIENCE_BASE: 88, PATIENCE_SPREAD: 32,   // v2.6: 4x Geduld → Gäste treffen sich
    FRY_COOLDOWN: 6,
    FRY_BATCH: 3,
    TOPPING_STOCK_MAX: 4,
    COMBO_STEP: 0.08,
    COMBO_CAP: 6,
    REP_ENTHUSIASTIC: 1.5, REP_POSITIVE: 0.5,
    REP_ACCIDENTAL: 0.8,
    REP_WRONG: -3, REP_WALKOUT: -4,
    FORGIVE_BASE: 0.14,
    LINE_HOLD: 6.4,
    // v2.6: Stammis, die den Abend bleiben (Re-Order + Bleiber-Bonus)
    STAYER_REORDER_BASE: 0.05,
    STAYER_REORDER_REGULAR: 0.35,
    STAYER_REORDER_ENTHUSIASTIC: 0.20,
    STAYER_REORDER_ACCIDENTAL: 0.10,
    STAYER_MAX_REORDERS: 3,
    STAYER_NIGHT_REP: 2,       // +Rep, wenn ein Stayer die ganze Nacht bleibt
    DISMISS_REP: -2,            // −Rep, wenn man einen Stayer wegschickt
    // v2.8: kawaii cute update
    CAT_CHANCE: 0.004,
    CAT_MIN: 20, CAT_SPREAD: 20,
    CAT_LUCK_FORGIVE: 0.15,
    CAT_LUCK_TIP: 0.2,
    DIALOG_CHANCE: 0.0008,   // pro Tick & wartendem Gast (v2.9.2.4: selten — Playtest: „zu oft, ohne Sinn")
    DIALOG_TIMEOUT: 12,
    DIALOG_MIN_GAP: 45,      // v2.9.2.4: Mindestabstand zwischen Dialogen (Sekunden)
    BUG_NIGHT: 10,           // v2.9.2.5: Bug-Gast (Lorebook-Nacht-10-Eintritt)
    BUG_AT: 40,              // …setzt sich in Sekunde 40 dieser Nacht (deterministisch)
    BUG_DUR: 60,             // …tippt 60 s, dann geht er
    BUG_FORGIVE: 0.10,       // …solange er da ist: Fehler-Chance „wird verziehen" steigt
    EMPLOYEE_COST: 150,
    EMPLOYEE_COOLDOWN: 8,
    EMPLOYEE_ERROR: 0.15,
    // v2.9.2: Partytime — im Kern, deterministisch (Kosmetik + Party-Sprache)
    PARTY_GUESTS: 4,
    PARTY_CHANCE: 0.5,        // pro Sekunde, wenn genug Gäste im Laden
    PARTY_DUR: 6
  };

  /* ---- Preisgestaltung (wählbar im Shop) --------------------------------- */
  var PRICE_LEVELS = {
    billig:   { label: 'Billig',   priceMult: 0.85, tipMult: 0.8, spawnMult: 1.15, patienceMult: 0.95, desc: 'Mehr Gäste, weniger Marge. Geduld sinkt leicht.' },
    standard: { label: 'Standard', priceMult: 1.00, tipMult: 1.0, spawnMult: 1.00, patienceMult: 1.00, desc: 'Der faire Mittelweg.' },
    exklusiv: { label: 'Exklusiv', priceMult: 1.25, tipMult: 1.3, spawnMult: 0.85, patienceMult: 1.10, desc: 'Teurer & großzügiger, aber seltener Gast.' }
  };

  /* ---- Brühen (Täner, unbegrenzt) ---------------------------------------- */
  var BROTHS = [
    { id: 'tonkatsu', name: 'Tonkatsu', color: '#ff8c42', unlock: 1, price: 8 },  // Orange
    { id: 'shoyu',    name: 'Shoyu',    color: '#7b4a1e', unlock: 1, price: 8 },  // Braun (Soja)
    { id: 'miso',     name: 'Miso',     color: '#e6c84f', unlock: 3, price: 9 },  // Gelb
    { id: 'spicy',    name: 'Spicy',    color: '#ff3b5c', unlock: 6, price: 11 }  // Rot
  ];

  /* ---- Beilagen (Fritteuse + Einkauf, begrenzter Vorrat) ------------------ */
  var TOPPINGS = [
    { id: 'ei',      name: 'Ei',     emoji: '🥚', color: '#ffe9a8', unlock: 1,  price: 3, buy: 4 },
    { id: 'nori',    name: 'Nori',   emoji: '🍥', color: '#2e7d4f', unlock: 1,  price: 3, buy: 4 },
    { id: 'mais',    name: 'Mais',   emoji: '🌽', color: '#ffd93c', unlock: 9,  price: 3, buy: 5 },
    { id: 'chashu',  name: 'Chashu', emoji: '🥩', color: '#e06666', unlock: 12, price: 4, buy: 6 },
    { id: 'zwiebel', name: 'Zwiebel',emoji: '🧅', color: '#d9c2f0', unlock: 15, price: 3, buy: 5 }
  ];

  /* =====================================================================
     PERSONAS — die Gespräche.
     Felder: moodBias (Grundstimmung), forgiving (isst fast-wrong Bowls),
     eat (Ess-Tempo, Multiplikator), cleanBowl (trinkt die Brühe aus?),
     lingerBias (bleibt gern noch sitzen).
     ===================================================================== */
  var DIALOGUE = {
  personas: {
    kritiker: {
      enthusiastic: [
        "… akzeptabel. Mehr noch: überzeugend. Fast ein Skandal.",
        "Mein Füller schreibt nichts. Nichts Schlechtes. Ein leerer Bericht ist ein seltenes Ereignis.",
        "Die Brühe hat Argumente. Ich habe sie gegessen. Respekt.",
        "Siebenundsechzig Grad. Gemessen. Ich hatte es nicht geplant, aber der Messwert zählt.",
        "In drei Jahrzehnten: das sechste, das hält. Es zählte.",
        "Die Schüssel schweigt. Der Koch auch. Die Nudeln auch. Einverstanden.",
        "Das Ei argumentierte. Ich widersprach. Das Ei hatte recht.",
        "Behauptung, Beweis, Überzeugung. Die Schüssel hat alle drei geliefert. Selten.",
        "Die Notiz lautet: korrekt. Mehr will ich nicht schreiben, und das ist bei mir viel."
      ],
      positive: [
        "Ich komme wieder. Nicht aus Liebe. Aus Pflicht.",
        "Ich habe den Löffel wiederholt. Einmal. Bei mir: viel.",
        "Zweiundzwanzig Minuten später notiert: alles korrekt. Ohne Fehler.",
        "Der Koch hat ein Rezept, das hält. Das reicht für mich.",
        "Ich würde die Schüssel einrahmen. In meinem Büro. Das ist die Ehre, die ich gebe.",
        "Zufrieden. Ein Wort, das ich selten brauche. Heute zählt es.",
        "Die Nudeln haben Struktur. Ich respektiere Struktur.",
        "Das Gericht war richtig. Ich habe es nicht kommentiert. Das ist die höchste Lobesform."
      ],
      neutral: [
        "Ich habe gegessen. Das Gericht war da. Vorbei.",
        "Warme, essbare Suppe. Der Begriff deckt alles ab, auch mich.",
        "Keramik, Teig, Brühe. Logisch. So wie ich.",
        "Notiz an den Koch: nichts zu korrigieren. Was dazu zu sagen wäre: nichts.",
        "Meine Zunge hat die Brühe geprüft. Ergebnis: Suppe.",
        "Gast, Gericht, kein Fehler. Keine Beanstandung. Keine Notiz.",
        "Die Brühe hatte einen Tonfall. Ich habe ihn ignoriert.",
        "Alles war vertretbar. Das Wort deckt den Abend ab."
      ],
      grumpy: [
        "Ich warte. Ich schaue die Uhr an. Die Uhr entschuldigt sich. Das Gericht nicht.",
        "Falsche Brühe, ich sah sie kommen, der Laden vergaß sie. Das ist: doppelt.",
        "Die Suppe ist kalt geworden. Kälte ist kein Argument, das ich akzeptiere.",
        "Fünfundzwanzig Minuten. Ich wiederhole: fünfundzwanzig. Nicht mehr, aber es wird mehr.",
        "Der Koch fehlt. Das Gericht ebenfalls. Doppelte Abwesenheit. Doppelter Fehler.",
        "Mein Notizblock wird länger, je länger ich hier sitze. Schlechtes Zeichen.",
        "Weiche Nudeln. Brei ist, was man isst, wenn man aufgegeben hat.",
        "Die Schüssel kam spät, kühl und mit einer Art von Überheblichkeit. Notiert.",
        "Zwei Fehler: die Karte, die Suppe. Ich habe sie gezählt. Beide: verifiziert."
      ],
      accidental: [
        "Falsch bestellte Brühe. Ich habe sie gegessen. Die Brühe hat gewonnen.",
        "Fehler im System, Geschmack im Mund. Ich bilance das aus: positiv.",
        "Der Laden hat sich vertan. Ich habe geschaut. Die Schüssel hatte recht.",
        "Falsche Nudeln, bessere Nudeln. Die Statistik tröstet nicht, aber sie ist da.",
        "Nicht die gewünschte Suppe. Aber die, die ankommt. Die reicht.",
        "Der Fehler hatte ein Niveau. Ich habe es gegessen. Es hatte eines.",
        "Bestellung: A. Lieferung: B. Ergebnis: A plus. Dem Alphabet sei vergeben.",
        "Erwartung und Realität trafen sich. Die Realität war besser. Zufrieden, der Buchhalter?"
      ]
    },
    philosoph: {
      enthusiastic: [
        "Heute saß das Universum in meinem Löffel. Es schwamm mit.",
        "Die Brühe erzählt von der Urzeit. Ich habe zugehört. Sie war milder, als ich dachte.",
        "Die Schüssel ist ein Fenster. Das Glas: Brühe. Die Scheibe: Nudel.",
        "Ich stellte die Frage. Die Suppe antwortete: Tofu. Ausreichend.",
        "Die Suppe stellte sich nicht vor. Sie erzählte. Es war ein gutes Gespräch.",
        "Hier fehlt nichts. Hier ist mehr. Wie beim Kochen, so im Leben.",
        "Nebelklee, in einer Schüssel. Ich habe sie gelöffelt. Ich habe sie bekommen.",
        "Löffel hin, Löffel her. Die Brühe antwortet. So sind gute Gespräche.",
        "Salz, Wärme, Flüssigkeit. Die Grundstoffe der Existenz. Heute: gekocht."
      ],
      positive: [
        "Ich habe den ehrlichen Nachmittag geschmeckt. Die seltenste aller Zutaten.",
        "Die Suppe hatte Mitte. Alle suchen sie. Keiner findet sie.",
        "Die Nudeln hatten Zeit. Und man schmeckt sie. Man kann sie schmecken.",
        "Ich rührte. Der Löffel dachte. Die Brühe antwortete. Es stimmte.",
        "Die Suppe hat nichts benötigt. Ich auch nicht. So war es gut.",
        "Die Schüssel war voll. Das Universum auch. Dann war alles leer. Alles war gegessen.",
        "Dank an den Zufall. Dank an die Hand, die das Glas hinging.",
        "Es schmeckte nach Antwort. Nach der richtigen. Nach der guten Antwort."
      ],
      neutral: [
        "Ich aß. Die Nudeln existierten. Das Gleichgewicht veränderte sich nicht.",
        "Die Schüssel ist ein Kreis. Der Löffel zeichnet ihn. Die Brühe schweigt. Genug.",
        "Wärme, Flüssigkeit, Geschmack. Die drei Grundlagen. Ich sitze in der Mitte.",
        "Die Suppe schweigt. Schweigen ist hier die beste Antwort.",
        "Die Antwort der Suppe: mittig. Das genügt. Das genügt.",
        "Ich rühre. Der Löffel denkt. Die Brühe erklärt sich. Genug, für einen Abend.",
        "Gegessen. Nicht gegessen. Da war. Heute: gegessen.",
        "Die Schüssel blickt. Ich blicke zurück. Niemand sagt etwas. Alles gut."
      ],
      grumpy: [
        "Das Warten war heute die Zutat. Es war bitter. Sehr bitter.",
        "Die Brühe hatte keine Meinung. Ich habe nachgefragt. Sie schwieg. Wie ich.",
        "Die Nudeln waren zu weich. Eine Warnung. Für alles.",
        "Das Ei war zu hart. Es widersprach der Brühe. Ich widersprache dem Ei.",
        "Ich dachte über die Antwort. Die Suppe schlief. Schlechtes Timing, für alles.",
        "Der Koch hat den Faden verloren. Man schmeckt es. Man schmeckt es wirklich.",
        "Schale ist kalt. Laden ist ruhig. Das Universum wartet. Alles wird kalt.",
        "Die Antwort kam spät. Wie alles hier. Spät. Und kühl."
      ],
      accidental: [
        "Andere Schüssel. Richtige Richtung. Der Nebel verteilt. Ich löffle.",
        "Das Leben ändert Beschriftungen. Der Nebel auch. Passt so.",
        "Fremde Brühe. Der Löffel kannte sie. Das Universum kannte sie auch.",
        "Nicht das erwartete Gericht. Das erwartete war nur eine Frage.",
        "Der Irrtum kam. Die Brühe kam mit. Ich habe beide gelöffelt.",
        "Die Suppe hat ihren Namen geändert. Die Zunge hat akzeptiert.",
        "Falsche Suppe, richtiger Löffel. Der Titel lag falsch. Der Geschmack nicht.",
        "Andere Nudeln, doch: da. Das Universum macht das. Und: gut."
      ]
    },
    schwatzer: {
      enthusiastic: [
        "STILLE! Ich muss das jetzt sagen! Drei Sekunden! … Es war das Beste. DAS. Beste.",
        "Der Koch kann! Er KANN! Der Löffel kann auch! Das ist ein Fest des Könnens!",
        "Ich hab gegessen, ich hab geatmet, es hat geschmeckt! Wie ein Traum, der alle aufisst!",
        "JEDER einzelne Nudelstreifen hat mich umarmt! Danke an die Einzeln! Danke allen!",
        "Der Löffel! Im Anflug! Gelandet! Im Gesicht! Gelangt! Perfection!",
        "Das ist keine Suppe, das ist eine Nachricht! Aus Nebelklee! An mich! Ich war die Adresse!",
        "Koch! DU! Du hast das gemacht! Mit Händen! Mit Brühe! Ich sehe dich!",
        "Meine Zunge feiert! Meine Zähne! Die Schüssel! ALLES tanzt! Und ich: dabeigeb!",
        "Ich bestelle noch eins. Vor der Bestellung sage ich: NOCH EINS!",
        "Wenn man mich fragt, ob es das Ding war? DAS. Einfach. Das."
      ],
      positive: [
        "Gut, gut, GUT! Dreimal gesagt, dreimal gezählt!",
        "Lecker! Also LECKER, ich sage es hier, in diesem Laden, LUPT!",
        "Nudeln gut, Brühe gut, Glas gut, Schale gut, Stuhl gut. ALLES gut!",
        "Leute! Hier! Dieser Tisch! Dieser Laden! TOP! TOP!",
        "Das war so gut, dass ich kurz die Hand hob. Zufall? Nein! Dankbarkeit!",
        "Meine Zunge hat gegen das Gericht opponiert. Meine Zunge hat gewonnen. Was soll's.",
        "Guten Abend! Guter Löffel! Gute Brühe! Ich: guter Mensch! Das ist der Abend!",
        "GUT. Das ist mein Adjektiv. GUT, GUT, GUT. Ich hab keins anderes gebraucht."
      ],
      neutral: [
        "Mmph. Mmmhh. Aah. Das heißt was. Ich weiß es noch nicht. Weiter.",
        "Ich nicke. Die Nudeln nicken zurück. Wir verstehen uns, wir drei. Die Luft auch.",
        "Okay. Okay. Also gut? Gut? Und dann? Das Wort. Es kommt.",
        "Ich rede. Die Suppe schweigt. Fair. Und ich rede trotzdem weiter.",
        "Schmecken. Denken. Reden. In dieser Reihenfolge. Meistens.",
        "Okay, okay? Okay. Okay-gut. Das reicht. Für heute. Wirklich.",
        "Ich würde sagen: großartig. Wenn ich es wüsste. So also: schmeckt.",
        "Lecker? Ich bin noch mittendrin. Moment. Moment, den man braucht."
      ],
      grumpy: [
        "Die Suppe kam. Langsam. Als wäre sie unsicher. Zu langsam. Ich hab gezählt.",
        "Ich habe gewartet, mein Mund hat offen gestanden, die Suppe war anderswo. So.",
        "Okay. Okay ist ein mutiges Wort. Heute nicht mutig. Aber okay.",
        "Das Ei … Ich will nicht. Ich sage es trotzdem: Es schmeckt, aber es stimmt nicht.",
        "Der Koch hat geschlafen. Ich habe es gespürt. An der Schüssel. An den Nudeln.",
        "Schmeckt … so. Ich habe nach dem Wort gesucht. Es ist nicht gekommen. So.",
        "Zu lang. ZU LANG. Ich habe es gesagt. Ich esse trotzdem weiter. Aus Prinzip.",
        "Heute ist alles langsam gewesen. Nudeln, Koch, Suppe. Ich habe mitgezählt. Nein."
      ],
      accidental: [
        "DER FEHLER! Der Fehler! Und der Fehler hat GEWONNEN! Danke an den Fehler!",
        "War es das Richtige? Ich weiß es nicht. Es war gut. Das ist alles wert.",
        "Ich hab A bestellt. B kam. B war besser. A hat gelogen. Das war das Thema.",
        "Der Irrtum hatte eine Story. Ich hab geschaut, geschmeckt, genickt.",
        "Die Nudeln, die nie kamen: egal. Die, die da waren: WUNDERBAR! Und laut.",
        "Falsch, aber gut. Was ist falsch an gut? Das Universum lacht. Ich auch.",
        "Der Laden hat sich verlaufen. Die Suppe hat es nicht. Das ist der Plan.",
        "Nichts bestellt, alles gegessen. Beide Aussagen sind korrekt. Ehrlich."
      ]
    },
    timide: {
      enthusiastic: [
        "Es … es schmeckt. Ich sage es, bevor es mir peinlich wird. Es ist gut.",
        "Ich habe lange durchgeatmet, bevor ich sagte: gut. Sehr gut. Bitte nicht lachen.",
        "Meine Finger zitterten. Vor Glück. Oder vor Kälte. Ich weiß es nicht.",
        "Kann … kann ich das noch einmal bekommen? Nur für mich. Einen Löffel. Bitte.",
        "Die Schüssel ist leer, und ich bin ein bisschen traurig, dass es so schnell ging.",
        "Das war das Beste seit … ich vergesse den Namen. Aber es war gut. Das reicht.",
        "Ich habe gelächelt. Ich lache selten. Das Essen war zu gut für Scham.",
        "Ich flüstere es in die Schüssel, dann wird es kleiner: Es war schön.",
        "Mein Bauch hat gegurrt. Aber heute, heute war es … Vorfreude, glaube ich."
      ],
      positive: [
        "Danke. Das sage ich selten. Aber: danke. Wirklich.",
        "Weiche Nudeln, wie ich sie mag. Ich mag, dass sie es waren.",
        "Ich habe niemanden genervt. Und die Suppe war gut. Zwei gute Dinge.",
        "Die Schüssel ist blau. Ich bin blau. Es war alles da. Das reichte.",
        "Ich habe geguckt, dann gegessen. Es war warm. Es war gut. Beides.",
        "Die anderen haben gelacht. Ich nicht. Es hat geschmeckt. Das zählt genug.",
        "Der Laden ist still. Die Suppe ist warm. Ich bin … ruhiger. Eher.",
        "Fragt man mich: gut. Fragt man mich nicht: auch gut. So ist das okay."
      ],
      neutral: [
        "Es war da. Ich habe es gegessen. Es war okay. Und fertig.",
        "Neutral. Warm. Nichts Schreckliches. Ich mag Nichts Schreckliches.",
        "Ich nicke oft. Weil nichts zum Reden da war. Es war gut.",
        "Die Suppe war einfach da. Und warm. Wie ich. Eher.",
        "Gegessen, geschaut, noch gegessen. So so so. Okay.",
        "Die Schüssel ist schön. Nicht wie meine. Aber okay. Okay ist gut.",
        "Nichts Aufregendes. Nichts Schlimmes. Ich nehme beides mit.",
        "Die Schüssel war warm, ein kleines Stück auch ich. Differenz: okay."
      ],
      grumpy: [
        "Ich habe so lange gewartet, dass mir jetzt das Warten wichtiger ist als die Suppe.",
        "Die Brühe ist kalt. Ich hätte es gesagt. Ich habe es nicht gesagt. Zu spät jetzt.",
        "Schmeckt … okay. Aber bin ich sicher, dass ich okay sein soll? Ich will mehr.",
        "Der Koch hat nicht hingeschaut. Ich habe gewartet. Beide Dinge waren da. Beides nicht gut.",
        "Das Essen war da. Ich hasse es, wenn Dinge mich vergessen. Trübe.",
        "Okay, sage ich. Weil ich soll. Ich will nicht okay sein. Aber: okay.",
        "Ich habe den Löffel angesehen, ob er ermutigt. Er ist nur ein Löffel.",
        "Mein Appetit und die Suppe haben sich kurz gesehen. Beide unzufrieden."
      ],
      accidental: [
        "Es war … das Falsche. Und doch: ich habe es gegessen. Und: danke.",
        "Ich habe es gemerkt, als ich schon gelöffelt hatte. Es war … okay. Gut, sogar.",
        "Die Schüssel war falsch. Überrascht. Dann warm. Dann: habe ich … gegessen.",
        "Nicht die Richtige, aber warm. Die Wärme ist die Hälfte der Suppe. Und die Hälfte von mir.",
        "Ich soll nicht viel sagen. Aber es war gut. Wirklich, glaube ich.",
        "Fremd, und ich war unsicher. Dann warm. Dann ich. Eher. Das war es.",
        "Falsch, vielleicht. Aber die Nudeln waren gut. Ich widerspreche gern. Aber sie waren gut.",
        "Ich habe nicht gefragt. Ich habe gegessen. Danke. Das war es. Wirklich."
      ]
    },
    heisshunger: {
      enthusiastic: [
        "ICH ESSE! Es gibt SO VIELES! Es schmeckt, als gäbe es es überall!",
        "Der Löffel ist ein Kämpfer! Er fightet gegen die Nudeln und GEWINNT!",
        "So gut, dass ich kurz aufgehabe. Dann: doppelt. DREIFACH. Ich habe nachgezählt!",
        "Mein Bauch war fremd, jetzt ist er Freund. Alles schmeckt jetzt freundlicher.",
        "Erst Nudeln, dann Löffel, dann Nebel. So. Immer so. So geht das.",
        "Mein Kopf hat vergessen, wo er ist. Dann: doppelt schmeckt. Wunderbar.",
        "Koch! Du hast mir die Knie weich gemacht! Metaphorisch! Aber auch echt, fast.",
        "Danke, danke, danke! Schüssel! Laden! Alle: DANKESCHÖN!",
        "Nudel ist Versprechen, Löffel ist Gelöbnis. Ich halte beides. Und esse weiter."
      ],
      positive: [
        "Voll. Ich bin voll. Das war gut. Und: noch mal?",
        "Es war genug. Aber noch ein Löffel: aus Liebe, nicht aus Not.",
        "Mein Magen stimmt heute zu. Die höchste Ehre, die ich verteilen kann.",
        "Für den zweiten Teller? Ja. Für den zweiten Teller!",
        "Von sehr hungrig zu sehr voll: das war die Reise. Und sie hat geschmeckt.",
        "Viele Nudeln, warme Brühe, alle gut. Der beste Abend der Woche.",
        "Die Schüssel hatte Luft, also löffle ich weiter. So ist das, mit Nudeln.",
        "ENDLICH! Der richtige Löffel an der richtigen Suppe. Danke, Brühe!"
      ],
      neutral: [
        "Essen war da. Ich war da. Beide okay. So, alles okay.",
        "Warm: das brauche ich. Es war warm. Das war alles. Und gut.",
        "Mein Bauch hat gestimmt. Er gestimmt. Er hat geantwortet. Gutes Zeichen.",
        "Essen war da, ich aß. Deal erfüllt. Ich: dankbar. So, danke.",
        "Okay, gut, mein Mund sagt: iss, mein Kopf sagt: okay. Alle okay.",
        "Nudeln wurden gegessen: so ist das Ergebnis. Das Gericht hat geliefert. Wirklich.",
        "Gegessen, geguckt, geschmeckt: alles okay, für meinen Bauch. Das war's.",
        "Mein Hunger ist jetzt leiser. Plan erfüllt. Ich: zufrieden. Eher."
      ],
      grumpy: [
        "Mein Magen hat geknurrt, die Suppe war kalt. Zwei Fehler, in einem Abend.",
        "So hungrig ich war, habe ich so lange warten müssen, der Geschmack ist weg.",
        "Es kam. Aber spät. Spät wird kalt. Kalt ist nicht, was ich will.",
        "Mein Hunger war groß, das Gericht war klein. Ich war unzufrieden. Alle.",
        "Bestellt, gewartet, gegessen. Die Reihenfolge hat verloren. Ich auch.",
        "Kalt wie der Nebel an der Tür. Ich habe es nicht geschmeckt. Ich habe es gefühlt.",
        "Die Suppe hat meinen Geschmack vermisst. Es war kalt. Es war traurig-kalt.",
        "Der Laden hat versprochen, die Uhr hat zugesehen, ich: halbleer. Alle halbleer."
      ],
      accidental: [
        "Nicht meine? Egal. Es war da. Ich war hungrig. Also: hier.",
        "Mein Hunger war schneller als die Bestellung. Er hat genommen, was da war. Es war gut.",
        "Falsch bestellt, mein Mund hat es nicht gesehen. Mein Mund sieht nicht. Er isst.",
        "Der Fehler war kein Fehler, weil er geschmeckt hat. Er war gut.",
        "A war bestellt, B kam. B war besser. A war nur eine Legende. Ich habe B gegessen.",
        "Mein Bauch hat die fremde Brühe akzeptiert. So ein Moment, so einer, den man isst.",
        "Nicht geplant, war da. Ich hungrig. Genug war es. Alles war genug.",
        "Nicht die Richtige, aber: hier. Hier zählt: hier. Und sie war hier."
      ]
    },
    tourist: {
      enthusiastic: [
        "Mein Rucksack ist schwerer geworden. Von Fotos. Wegen dieser Schüssel.",
        "Zu Hause schmeckt Suppe nach Montag. Hier schmeckt sie nach einem Stern. Und sie bleibt.",
        "Ich habe die Karte verloren und den Punkt gefunden. Der eine. Die Schüssel.",
        "Der Reiseführer hat nichts von der Stadt gewusst. Ich habe jetzt mehr Wissen. Das genügt.",
        "Zwei Tage war der Plan. Ich bleibe vier. Weil sie schmeckt. Und bleibt.",
        "Ich habe ein Foto gemacht und mein Herz ein zweites. Die Schüssel steht auf beiden.",
        "Für dieses Gericht nimmt man den Umweg. Nicht den großen. Den richtigen.",
        "Hier ist der Punkt. Auf der Karte. Der hier. Mit Löffel. Mit Nebel. Mit mir.",
        "Es steht jetzt in meinem Tagebuch. Mit Kugelschreiber. Für immer, fast."
      ],
      positive: [
        "Anders als zu Hause. Gut anders. Und gut. So kann eine Empfehlung klingen.",
        "Neue Nudeln, neuer Geschmack, neuer Abend. Für mich: alles richtig.",
        "Ich mag es, wie es nicht Heimat war. Wie es war. Das zählt auch. Sehr.",
        "Guter Abend, gute Suppe, guter Nebel. Ich nehme alles mit.",
        "Die Karte hier drin hat gut gewählt. Der Zufall war mir wohlgesonnen.",
        "An alle, die unterwegs sind: hierher. Wirklich. Alle, die unterwegs sind.",
        "Mein Hunger ist zur Erinnerung geworden. Zu einer guten. Die isst sich leer.",
        "Hier ist alles anders und alles gut. Eine Reise, die man schmeckt."
      ],
      neutral: [
        "Okay, nicht wie zu Hause. Okay. Ich bin unterwegs. Der Nebel bleibt. Es war okay.",
        "Ich schreibe ins Tagebuch: gut. Hält die halbe Seite. Genug, für heute.",
        "Zu Hause wäre es besser. Hier ist es gut. Die Gleichung: angenommen.",
        "Die Schüssel war da, ich war da, der Reiseplan ist erfüllt. Alle gut.",
        "Essen, Foto, Uhr anstarren: alles erledigt. Alle: okay.",
        "Genug, um den Magen still zu legen. Der Magen war der eigentliche Reisende.",
        "Gut. Auf der Reise ist gut. Auf der Reise ist alles gut. Ich: auch.",
        "Ein Foto. Ein Löffel. Ein Nebel. In dieser Reihenfolge. Okay."
      ],
      grumpy: [
        "In drei Städten hatte ich mehr. Hier: eine Schüssel. Und die Uhr.",
        "Nicht wie zu Hause. Nicht gut. Dazwischen. Dazwischen ist das Schlimmste, was ein Abend sein kann.",
        "Die Brühe war kalt wie meine Jacke. Der Nebel auch. Alle kalt. Alle.",
        "In der Heimat wäre es bereits da. Hier ist noch nichts da. Traurig, die Uhr.",
        "Ich habe auf der Speisekarte Heimat gesucht. Nur Nudeln. Traurig, die Karte.",
        "Gut. Wie das Gut von vor zwei Stunden. Ohne Überzeugung. Eine leere Schale, die behauptet.",
        "Die Suppe hat mich angelächelt. Die Uhr nicht. Ich: der Reisende, der zu spät schmeckt.",
        "Kein großer Fehler. Ein stiller. Stille Suppe, lange Reise. Das ist das Schlimmste, was einem passiert."
      ],
      accidental: [
        "Falsche Brühe! Perfekt! Neue Stadt, neue Brühe, neue Geschichte!",
        "Nicht geplant, nicht bestellt. Die Suppe kam, ich kam. Wir beide: anwesend. Gut.",
        "Der Irrtum hat mich hergebracht. Und hat gut geschmeckt. Ich folge Irrtümern.",
        "Weite Wege, keine Bestellung möglich. Und das Gericht war: neu. Genau das, was fehlt.",
        "Nicht das gewollte, aber das neue. Neu schmeckt. So reist man. So reist man.",
        "Der Fehler hat eine neue Karte. Ich habe keine Probleme mit Karten. Mit diesem: keine.",
        "Der Irrtum duftete gut. Die Nudeln auch. Alles war gut, auf diesem Irrtumsweg.",
        "Falsch, vielleicht. Aber in weiten Gefilden ist alles falsch. Also: alle gut. Also: gut."
      ]
    },
    regelmassige: {
      enthusiastic: [
        "Endlich! Dreihundertsiebzehn Besuche. Und der hier. DER.",
        "Der Koch hat es gemacht. Ich bin gerührt. Ich weine nicht, ich nicke sehr.",
        "Heute war es besser. Nicht anders: besser. Und ich war dabei. Alle.",
        "Drei Jahre lang gut, und heute: gut. Und: mehr. Und ich: hier. Alle.",
        "Die Uhr habe ich doppelt geschaut. Sie stimmt. Und die Schüssel: sie auch.",
        "Jeden Tag gut, jeden Tag hier. Heute besonders. Der Nebel auch, heute.",
        "Meine Ecke, meine Brühe: zwei gute Nachrichten. Empfänger: ich.",
        "Kurz mit dem Koch gesprochen. Ich sagte: danke. Der Nebel nickte. Alle gut.",
        "Ich bin Stamm. Und heute war er der Tag, der einen Grund hat. Der Grund: die Suppe."
      ],
      positive: [
        "Wie immer. Und immer gut. Danke. Ich komme wieder. Und übermorgen.",
        "Gewohnheit. Und die Gewohnheit schmeckt gut. Das ist alles wert.",
        "Mein Löffel, mein Tisch, Mittwoch. Und heute: gut wie immer. Wirklich.",
        "Bestellt, gegessen, gesagt: gut. Der Kreis ist geschlossen. So.",
        "Die Schüssel kennt mich. Die Brühe mich auch. Ich: hier. So ist es gut.",
        "Wie gestern, wie morgen. Und dazwischen: alles gut. Wirklich alles.",
        "Ich komme, es ist gut, ich komme wieder. Das trägt bis morgen. Und: bis zu.",
        "Gute Nudeln, warme Brühe, leiser Nebel: die beste Kombination der Welt."
      ],
      neutral: [
        "Wie immer. Komme jeden Tag. Hinzuzufügen: nichts. Es war okay.",
        "Mein Tisch, meine Schüssel, mein Mittags. Alles an Ort. Okay.",
        "Die Uhr tickte, ich aß, die Wand stand da. So sind die Tage. Okay.",
        "Nichts neu, nichts schief. Die übliche Ruhe. Okay, und gut.",
        "Bestellt, da, warm, alle Infos erhalten. Okay. Und gut so.",
        "Mein Ort, meine Schüssel, mein Mittwoch. Erstaunlich: nichts.",
        "Der Laden war da. Die Nudeln. Die Brühe. Der Nebel. Alle: da. Okay.",
        "Gut. Nicht besser, nicht schlechter. Ein Mittendrin. Und mittendrin: okay."
      ],
      grumpy: [
        "Anders als gestern. Das ist ein Fehler. Ich bin Stamm, gestern hat gewonnen.",
        "Gestern war besser. Immer ist gestern besser. Wer ist Gestern? Wer.",
        "Die Brühe ist heute schwächer. Die Schüssel weiß es. Ich auch. Der Laden: nicht.",
        "Der Laden hat sich verändert. Oder ich. Beides: schlechte Nachrichten.",
        "Die Suppe war zu kalt für einen Stammgast. Kälte ist ein Vertrauensbruch.",
        "Das Ei war eine Minute jünger. Ich habe nicht gezählt. Ich weiß es.",
        "Ich bestelle, ich warte, ich schweige. Die Suppe war nicht die. Es war traurig.",
        "Heute: falsch. Gestern: richtig. Morgen: unbekannt. Aber ich: ich komme immer."
      ],
      accidental: [
        "Nicht meine Suppe. Aber ich bin Stamm. Und Stamm fragt nicht. Der aß.",
        "Der Laden hat sich vertan. Die Schüssel hat gewonnen. Der Nebel hat zugesehen.",
        "Falsch? Vielleicht. Aber gut. Und gut ist, was ich hier annehme.",
        "Fremde Brühe, warme Schale. Der Nebel hat geschaut. Alles gut. Alles.",
        "Der Fehler kam, die Schüssel kam, ich aß. Alle gut. So. Es war.",
        "Nicht bestellte Nudeln. Und doch: mein Tag. Der wird älter. Der wird besser.",
        "Der Irrtum hatte gewonnen. Der Geschmack hatte verloren. Alle haben gewonnen.",
        "Falsche Brühe, guter Tag. Die Schüssel hat nicht gelogen, der Löffel auch nicht."
      ]
    }
  },
  chat: {
    good: [
      "Kann ich nur empfehlen. Und: mit diesem Gesicht. Und: laut. Sehr laut.",
      "Diese Schüssel hat dem ganzen Abend einen Grund gegeben. Alle waren dabei.",
      "Die Nudel hat mich angelächelt. Ich habe gelöffelt. Es war gegenseitig.",
      "Der Löffel hier: ein Instrument. Ich: der Zeuge. Der Laden: das Orchester.",
      "Die Brühe hat mich in den Nebel geschickt. Guter Weg. Sehr gut.",
      "Wer hier nicht isst, dem entgeht was. Ich habe gegessen. Ich bin reich.",
      "Nudeln: Top 10 der Stadt. Platz: eins. Ich: der Richter, der das sagt.",
      "Der Laden ist gut. Die Suppe gut. Der Nebel gut. Alle gut. So: gut."
    ],
    bad: [
      "Ich warne: hier lügen die Nudeln. Alle. Und ich lüge: nicht.",
      "Der Laden hat heute Launen. Ich sage nicht welche. Ich warne: trotzdem.",
      "Die Karte verspricht und liefert nicht. Das ist kein Laden, das ist ein Test.",
      "Der Nebel ist heute verdächtig. Verdächtig, wie er nie sein sollte.",
      "Schau: Schüssel, Nebel, dann du. Ich warne. Du gehst. So einfach.",
      "Der Koch hatte einen schlechten Tag. Die Suppe auch. Der Abend: doppelt schlecht.",
      "Mein Magen und ich haben heute gestritten. Er hat gewonnen. Und er redet.",
      "Bestell nicht das, was versprochen ist. Bestell weniger. Sehr viel weniger."
    ],
    react: [
      "🤣😅 Der hat's wieder. Sein Ding. Sehr sein Ding.",
      "Er sagt das. Und bestellt dann die zweite Schüssel. Immer. Ich: der Zeuge.",
      "😅 Ja ja. Aber die Suppe schmeckt trotzdem. Die Suppe hat recht. Meistens.",
      "Sein Magen streitet seit Stunden mit ihm. Ich bin neutral. Ich löffle.",
      "Warnen? Ich sitze hier seit dem Morgen. Das ist das Warnen, für alles andere.",
      "🤣😅 Er liegt nicht falsch. Das ist das Problem. Ich bestelle trotzdem.",
      "Er hat recht. Recht. Aber: ich löffle trotzdem. Und schweige nicht. Ehrlich.",
      "Er warnt nicht, wenn er isst. Er isst, und er warnt. Und: ich löffle mit."
    ],
    neutral: [
      "Das Neue auf der Karte: hat jemand probiert? Ich nicht. Ich habe Angst.",
      "Der Nebel heute war suppig, für Nebel-Verhältnisse. Ich lob ihn. Die Nudeln loben mich.",
      "Meine Uhr tickt falsch, die Laden-Uhr auch. Ich: auch falsch. Alle gleich falsch, gut.",
      "Der Mann vom Tisch 5 singt. Ich klatsche. Er merkt es nicht. So.",
      "Hat schon mal Suppen-Dampf in die Augen gehabt? Ich nicht. Ich bin zu schnell.",
      "Jemand in der Stadt kocht. Ich wette: genau hier. Und gut. Sehr gut, fast sicher.",
      "Mein Plan: hier. Morgen: hier. Übermorgen: hier. Alle Pläne, alle: hier.",
      "Greta sagt, der Laden hat Glück. Ich sage, sie hat recht. Greta nickt.",
      "Ich war gestern müde, heute auch. Der Laden merkt nichts. Der merkt wirklich nichts.",
      "Der Nebel war da. Der Laden war da. Alle waren okay. Wirklich alle."
    ],
    intro: [
      "Da! Ein Neue(r)! Willkommen! Der Laden mag Überraschungen. Und neue Gesichter. Beide.",
      "Ah, ein Neuer! Komm her, setz dich, ich erkläre dir den Laden in zwei Löffeln.",
      "Der bringt ein Buch mit. Vorsicht. Neugierig. Oder kritisch. Beides, hier, gefährlich.",
      "Der Neue kommt herein, die Suppe wartet. Die Schüssel sieht: das wird einer von uns.",
      "Neuling, mit Plan, im Nudelladen. Das seh ich gerne. Das seh ich wirklich gerne.",
      "Ich seh einen Fremden, und der Laden strahlt. Der Laden hat Vorahnung. Alle.",
      "Er kommt, als hätte er die Suppe vermisst. Die Schüssel hat auch vermisst. Alle.",
      "Sieh ihn an: der Neue, und die Nudeln. Der Laden hat ein Gefühl für das. Alle haben."
    ],
    stayer: [
      "Ich war nur schnell da. Schnell: ist hier relativ. Ich: bleibe. Der Nebel: bleibt.",
      "Laden und ich sind einig. Beide: bleiben. Die Schüssel auch, irgendwie.",
      "Mein Rucksack lehnt an der Wand. Er wartet auf mich. Ich: warte auf den Laden.",
      "Ich bin nicht müde. Ich bin angekommen. Beides ist nicht dasselbe. Und: gut.",
      "Ich bleibe, weil die Suppe gut war. Und die Schüssel leer. Und ich: voll.",
      "Der Stuhl ist bequem, der Nebel still, die Uhr hält sich zurück. Alles passt.",
      "Ich kam zum Essen. Ich blieb zum Bleiben. Beides: ein Plan. Ein guter.",
      "Manchmal sind Abende so gut, dass man nicht weiter muss. So. Hier. Jetzt."
    ],
    reorder: [
      "Nochmal. Genau so. Ich bin vorbereitet. Der Löffel: auch. Wirklich auch.",
      "Zweite Schüssel! Die erste war Einleitung. Das eigentliche Gericht: kommt jetzt.",
      "Ich sage nichts, ich zeige: Karte. Schüssel. Löffel. Ja. So: ja.",
      "Mein Magen stimmt für die zweite Runde. Ich: bestelle. Ohne Debatte.",
      "Dasselbe? Nicht dasselbe. Besser. Der Laden kann. Der Nebel nickt mit.",
      "Die Schüssel steht da, fast leer. Fast leer ist ein Fehler. Den korrigiere ich.",
      "Zweite Schüssel, gleicher Laden, gleicher Nebel. Alles bleibt. Ich bestelle.",
      "Die erste Schüssel war ein Versprechen. Ich bestelle jetzt die Antwort. Wirklich."
    ]
  },
  linger: [
    "Die letzte Nudel ist weg, und ich sitze noch. Ich weiß nicht warum. Aber: der Stuhl.",
    "Ich könnte aufstehen. Ich will nicht. Die Schüssel ist leer, die Ruhe: voll.",
    "Schüssel leer, Kopf voll. Der Laden hat geliefert. Der Nebel hält die Tür im Blick.",
    "Morgen bin ich ein anderer Mensch. Heute bin ich noch voll. Also: hier bleiben.",
    "Meine Jacke hängt an der Wand. Die Jacke gefällt es hier. Also gefällt es mir.",
    "Der Nebel ist zurück, die Wände warm, die Schüssel weiß und leer. Alles gut, alles.",
    "Ich bestelle nichts. Ich löffle nichts. Ich löffle nur die Ruhe. So, das war's.",
    "Der Chronist hat es notiert: 'Hier ist gut'. Ich sitze also. So sind die Regeln.",
    "Das Licht hier hält. Und hält alles. Auch mich. Also: bleibe ich. Etwas länger.",
    "Essen: fertig. Sitzen: noch nicht. Stuhl und ich sind uns einig. Sehr einig."
  ]
};

  /* =====================================================================
     KAWAII-CONTENT (v2.8) — Katze, Dialog, Skills, Angestellter, Deko, Seele.
     Zentrale Datei. Content: Lead Story Writer + Tonalitäts-Dossier.
     ===================================================================== */
  var KAWAII = {
    // 1) KATZE
    cat: {
      arrive: [
        "Eine Katze betritt den Laden. Ohne Einladung. Mit Ansage.",
        "Sie setzt sich. Die Theke ist jetzt Thron. 🐱",
        "Kleine Pfote auf deiner Hand. Unterschrift unter allem.",
        "Zwei gelbe Augen. Scharfer Blick. Heute ist Prüfungstag. 😼",
        "Der Laden hat einen VIP bekommen. Der beißt. Noch nicht. 🐾",
        "Schwanz wedelt. Bestellung: Stille. Extra groß. Ohne Zwiebeln."
      ],
      luck: [
        "Ein Pfotentritt auf die Theke. Die Schale glänzt jetzt golden.",
        "Glücks-Buff an. Die Suppen murmeln leise „Danke“.",
        "Sie schnurrt. Die Fritteuse singt dazu. Man glaubt es kaum.",
        "Jede Nudel wird zum Glücksnudelschen. Du vermutlich auch.",
        "Der Laden riecht plötzlich nach Sonnentag. Wer weiß wieso.",
        "Schnurren im Takt des Topfes. Alle klatschen leise. ✨"
      ],
      leave: [
        "Sie geht. Der Laden wird sofort deutlich ernster.",
        "Ohne Schnurren klingelt das Geld leiser. Das ist bewiesen. Fast.",
        "Tür zu. Ein Schnurren hängt noch eine Weile in der Luft.",
        "Die Theke vermisst ihren Thron. Sie tut so, als würde sie das nicht.",
        "Sie nimmt das Glück mit. Einen Kuss an die Theke. Ganz kurz. 💗"
      ]
    },
    // 2) DIALOG — v2.9.2.4: neu geschrieben (Playtest: „funktioniert, entbehrt
    // aber jedem Sinn"). Prinzip: gut = warm & aufmerksam, neutral = höflich
    // & flach, schlecht = kalt. Drei klar unterscheidbare Haltungen.
    dialog: {
      kritiker: {
        question: "Die Brühe: 38,2 Grad. Ich war dabei. Sie hätte 38 sein dürfen.",
        options: [
          { text: "38 ist der Plan. 38,2 ist die Nacht. Beide liegen richtig.", q: "good" },
          { text: "Die Zahlen wandern ins Glas. Dort halten sie sich an nichts.", q: "neutral" },
          { text: "Messlöffel gibt's nicht. Suppe isst man, nicht prüft.", q: "bad" }
        ],
        react: {
          good: "Er schreibt es auf. Sein Bleistift zögert einen Moment. Das ist viel.",
          neutral: "Er notiert die Antwort. Aus der Zahl wird keine. Das war okay.",
          bad: "Er klappt das Heft. Die Tür verabschiedet sich leiser als er."
        }
      },
      philosoph: {
        question: "Wenn du die Brühe gießt — gießt du sie, oder lässt du sie zu?",
        options: [
          { text: "Beides. Ich fange an. Sie fängt an. Dann sind wir fertig.", q: "good" },
          { text: "Ich gieße. Die Brühe entscheidet, wann sie genug hat.", q: "neutral" },
          { text: "Gegossen wird, weil's bestellt ist. Mehr fragt man nicht.", q: "bad" }
        ],
        react: {
          good: "Er blinzelt. Zum ersten Mal seit Monden versteht er jemanden.",
          neutral: "Er nickt langsam. Die Antwort darf jetzt auch noch reifen.",
          bad: "Sein Blick geht an dir vorbei, durch die Wand, bis zum nächsten Stern."
        }
      },
      schwatzer: {
        question: "Der Fisch von nebenan hat ein NEUES Plakat! Sag mir sofort: Fisch oder Nudel?",
        options: [
          { text: "Nudel. Aber der Fisch hat ein gutes Plakat. Erzähl, ich hör zu.", q: "good" },
          { text: "Der Fisch schwimmt. Die Nudel kocht. Beide sind beschäftigt.", q: "neutral" },
          { text: "Ich hab keine Zeit für Plakate. Der Topf wartet auch nicht.", q: "bad" }
        ],
        react: {
          good: "Er erzählt's dir dreimal. Du hörst dreimal zu. Alle gewinnen.",
          neutral: "Er nickt, als hättest du schon die ganze Geschichte gehört.",
          bad: "Er wird leise. Das klingt trotzdem noch sehr, sehr laut."
        }
      },
      timide: {
        question: "Ähm… ich weiß nicht, was ich nehmen soll. Darf ich nachfragen?",
        options: [
          { text: "Nimm, was dich wärmt. Ich koche den Rest drumherum.", q: "good" },
          { text: "Die Karte hat alles. Schau gern. Keine Eile.", q: "neutral" },
          { text: "Das steht auf der Karte. Die weiß es besser als ich.", q: "bad" }
        ],
        react: {
          good: "Sie lacht leise. Die Raumluft wird sofort um 4 % kuscheliger.",
          neutral: "Sie nickt. Langsam. Wie eine aufgeweckte Blume. 🌱",
          bad: "Sie sagt „Danke“. Es klingt, als würde ein Fenster ganz langsam zu."
        }
      },
      heisshunger: {
        question: "Gleich. Jetzt. Sofort. Mein Magen hat den Notruf gemacht.",
        options: [
          { text: "Ist klar. Der Topf hat dir schon von hier zugewinkt.", q: "good" },
          { text: "Der Topf arbeitet. Er ist… ziemlich weit. Echter Fortschritt.", q: "neutral" },
          { text: "Hungern schärft den Geschmack. Und die Wartezeit. Glaubt mir.", q: "bad" }
        ],
        react: {
          good: "Es wird gefuttert. Der Magen meldet: „Ruhe. Hier wird gut gekocht.“",
          neutral: "Er zuckt. Der Magen doppelt nach. Die Nudel entschuldigt sich im Kleinen.",
          bad: "Er geht. Die Nebengasse. Der Fisch wird's hören. Und erzählen."
        }
      },
      tourist: {
        question: "Was probiere ich? Ich fliege morgen ab. Der Himmel wartet nicht.",
        options: [
          { text: "Die Mittagsnudeln. Mit Stern-Sauce. Du verstehst. Versprochen. ✨", q: "good" },
          { text: "Was der Topf hergibt. Der Topf entscheidet hier übrigens.", q: "neutral" },
          { text: "Die Speisekarte hängt rechts. Sie ist auch eine Reise.", q: "bad" }
        ],
        react: {
          good: "Er nickt. Sein Koffer wird kleiner. Der Laden wird in ihm groß.",
          neutral: "Er steckt die Karte ein. „Souvenir, das.“ Die Karte zittert leise.",
          bad: "Er geht die Straße runter. Da war bestimmt auch schön. Schade."
        }
      },
      regelmassige: {
        question: "Der Regen hat heute einen Rhythmus. Hast du den auch gehört?",
        options: [
          { text: "Drei Takte lang. Beim vierten gieße ich Brühe. Passt genau.", q: "good" },
          { text: "Vielleicht. Ich zähl hier Topfe statt Takte.", q: "neutral" },
          { text: "Ich hör nur Topf und Töpfe. Mehr ist nicht mein Geschäft.", q: "bad" }
        ],
        react: {
          good: "Er lacht. Die Wandlampe flackert ein Mal aus Stolz.",
          neutral: "Er nickt. Routine ist auch eine Art Liebe. Später. Ganz bald.",
          bad: "Er sagt „Normal, ja“. Es klingt heute komplett anders."
        }
      }
    },
    // 3) SKILLS
    skills: {
      hands: { name: "Schnelle Hände", desc: "Servieren wird schneller.", levels: ["Zartes Zögern", "Nudelnudel", "Sakura-Schnelle"] },
      luck: { name: "Glücksgriff", desc: "Falsche Suppen werden öfter verziehen.", levels: ["Pfotenpfad", "Glücksbrise", "Katzengold-Hand"] },
      charm: { name: "Charisma", desc: "Trinkgelder werden größer.", levels: ["Kleines Hallo", "Pfote-Kuss", "Katzengras-Charme"] },
      fryer: { name: "Fritteuse-Profi", desc: "Nachbraten geht schneller.", levels: ["Knusperkuss", "Frittier-Sakura", "Frittenfee"] },
      cat: { name: "Katzenflüsterer", desc: "Die Glückskatze bleibt länger.", levels: ["Leise-Miau-Hörer", "Katzenseelen-Koch"] }
    },
    // 4) ANGESTELLTER
    employee: {
      hire: [
        "Er unterschreibt. Der Kuli zittert. Er nicht. Hoffentlich.",
        "Ein neues Gesicht an der Theke. Es lächelt. Viel. Wir beobachten.",
        "Seine Bewerbung trägt er wie eine Suppenschale. Mit Stolz.",
        "Er schiebt „Ich versuch's“ in den Zettelhaufen. Respekt."
      ],
      serve: [
        "Der Angestellte serviert. Präzise. Schalen-Kuss: exakt 41 Grad.",
        "Die Schale geht raus. Kleine Botschaft: Heute wird alles gut.",
        "Der Angestellte serviert. Die Katze nickt. Stempel: Qualität.",
        "Sein Schritt zur Theke ist sauber. Fast ein Tanz. Nahezu.",
        "Tasse ab. Stille an. Er nickt. So macht man das. 🍜"
      ],
      error: [
        "Fehlgriff. Die Essstäbchen sitzen im Regal. Die sehen verwirrt aus.",
        "Der Dampf wollte ihn streicheln. Er hat zu stark gezuckt.",
        "Tassen-Glas-Kaskade. Die Tassen singen leise. Bitte keine Fragen.",
        "Ketchup wurde zum Salz. Der Gast schweigt. Es klingt laut."
      ]
    },
    // 5) DEKO
    decor: {
      lamp: [
        "Die Lampe brummt vor sich hin. Sie hält uns am Leben. Vermutlich.",
        "Flackern an der Glühbirne? Die Katze hat gekratzt. Man weiß nie.",
        "Sie hängt zwei Grad schief. Absichtlich. Niemand fragt. Niemand lacht.",
        "Die Lampe flackert kurz. Sie winkt der Fritteuse zu. Freundlich."
      ],
      art: [
        "Das Gemälde zeigt einen Frosch im Bademantel. Er ist Berufung.",
        "Kunst der Woche: eine Nudel im Mondlicht. Bitte nicht messen. 😼",
        "Das Plakat sagt: „Glaube an die Schale.“ Die nickt manchmal.",
        "Jemand hat „Noodles“ verkehrt. Wir lassen's. Irrtum ist Deko."
      ],
      luckyCat: [
        "Die Pfote hebt. Die Schüssel bleibt. Alles gut. Symbolisch.",
        "Sie lächelt, als wüsste sie den Preis jeder Schale. Stimmt.",
        "Jedes Plakat-Lächeln zählt. Die Nudeln danken. Lautlos. 💗"
      ]
    },
    // 6) AUTORENTEAM
    author: [
      "Die Nudelbar ist im Bau. Immer mal wieder weiter. Versprochen. 👉👈",
      "Manchmal einen Schritt zurück. Das ist auch Kunst. Fast immer.",
      "Danke fürs Testen. Du bist Teil der Nudelbande. Ab heute."
    ],
    // 7) SEELE DER NUDELBAR (Tonalitäts-Dossier)
    enter: [
      "Schicht zu Ende. Der Beton war kalt heute. Gib mir einfach die heißeste Schüssel, die du hast.",
      "Draußen friert der Atem ein. Wenn ich hier den ersten Schluck Brühe nehme, spüre ich meine Finger wieder.",
      "Frag nicht. Einfach Kakiage, doppelt Brühe. Und zwei Onigiri für morgen früh zum Mitnehmen."
    ],
    zenjiru: [
      "Bis auf den Grund leergetrunken. Meister, du hast mir heute die Schicht gerettet.",
      "Kein Tropfen übrig. Dafür stehe ich jeden Tag um vier Uhr auf. Danke.",
      "Leere Schüssel, volle Seele. Die Schicht war lang. Die Brühe war kurz. Perfekt."
    ],
    hasty: [
      "Genau fünf Sekunden gebraucht. Geld liegt auf dem Tresen, danke!",
      "Ich muss. Die Schicht ruft. Aber die Brühe? Die nehme ich mit. Im Kopf.",
      "Fünf Sekunden. Fünf. Und die Schüssel war perfekt. Das reicht."
    ],
    forgiving: [
      "Hab zwar Schote bestellt, aber die Brühe hier rettet jeden Fehler. Hauptsache heiß.",
      "Falsche Schüssel? Die Brühe ist so gut, dass ich es verzeihe. Fast.",
      "Nicht das, was ich wollte. Aber heiß. Und heiß ist, was zählt."
    ],
    chefThoughts: [
      "Drei Stunden Schlaf... aber sobald das Öl der Fritteuse zischt, bin ich wieder da.",
      "Reich werde ich mit den Riesen-Portionen nicht. Aber wer hungrig aus meiner Tür geht, ist meine persönliche Niederlage.",
      "Wenn die Schüssel glänzt und kein Tropfen Suppe übrig ist – dafür stehe ich jeden Tag um vier Uhr auf."
    ],
    // 8) PARTYTALK (v2.9.2) — was Gäste in der Partytime sagen
    party: [
      "🎉 Mützen an! Die Party ist offiziell! (Niemand hat gefragt. Niemand wird gefragt.)",
      "Die Nudel tanzt! Alle tanzen! Der Koch auch! Fast!",
      "Konfetti in der Brühe! Bestellen: Konfetti, extra viel!",
      "Mützen sind nicht Deko. Mützen sind Haltung!",
      "Wer die Mütze verliert, zahlt die nächste Schüssel!",
      "Heute ist jeder Stammgast! Jede Schüssel ein Fest!",
      "Der Nebel feiert mit. Sogar der Beton klatscht. Fast.",
      "Party-Regel 1: Die Brühe bleibt heiß. Party-Regel 2: Es gibt keine Regel 2."
    ],
    partyChef: [
      "Vielleicht reicht das noch. Für eine Party. Für zwei Schüsseln.",
      "Mützen an. Schürze weiter. Die Show geht weiter."
    ],
    // 9) BUG-GAST (v2.9.2.5) — der Lorebook-Nacht-10-Einritt, jetzt im Spiel
    bug: {
      arrive: ["💻 Der Bug-Gast setzt sich. Bestellung: 2× nichts, 1× Fehler. Geduld: extra."],
      leave: ["💻 „Danke. Der Bug ist gefixt. Oder: er ist jetzt Feature.\""],
      nightEnd: ["💻 Der Bug-Gast bleibt sitzen, bis die Türen zu sind. Der Bug bleibt."]
    }
  };

  var PERSONAS = [
    { id: 'kritiker', name: 'Der Kritiker', emoji: '🧐', color: '#8b5cf6', moodBias: -12, forgiving: 0.05, eat: 1.25, cleanBowl: 0.2, lingerBias: 0.03,
      enthusiastic: DIALOGUE.personas.kritiker.enthusiastic, positive: DIALOGUE.personas.kritiker.positive, neutral: DIALOGUE.personas.kritiker.neutral, grumpy: DIALOGUE.personas.kritiker.grumpy, accidental: DIALOGUE.personas.kritiker.accidental },
    { id: 'philosoph', name: 'Der Philosoph', emoji: '🌌', color: '#4dd7e8', moodBias: 0, forgiving: 0.35, eat: 1.5, cleanBowl: 0.35, lingerBias: 0.12,
      enthusiastic: DIALOGUE.personas.philosoph.enthusiastic, positive: DIALOGUE.personas.philosoph.positive, neutral: DIALOGUE.personas.philosoph.neutral, grumpy: DIALOGUE.personas.philosoph.grumpy, accidental: DIALOGUE.personas.philosoph.accidental },
    { id: 'schwatzer', name: 'Der Schwätzer', emoji: '💬', color: '#39ff88', moodBias: 8, forgiving: 0.55, eat: 1.1, cleanBowl: 0.5, lingerBias: 0.15,
      enthusiastic: DIALOGUE.personas.schwatzer.enthusiastic, positive: DIALOGUE.personas.schwatzer.positive, neutral: DIALOGUE.personas.schwatzer.neutral, grumpy: DIALOGUE.personas.schwatzer.grumpy, accidental: DIALOGUE.personas.schwatzer.accidental },
    { id: 'timide', name: 'Der Timide', emoji: '🙈', color: '#ffb020', moodBias: -4, forgiving: 0.30, eat: 1.0, cleanBowl: 0.4, lingerBias: 0.06,
      enthusiastic: DIALOGUE.personas.timide.enthusiastic, positive: DIALOGUE.personas.timide.positive, neutral: DIALOGUE.personas.timide.neutral, grumpy: DIALOGUE.personas.timide.grumpy, accidental: DIALOGUE.personas.timide.accidental },
    { id: 'heisshunger', name: 'Der Heißhunger', emoji: '🍜', color: '#ff8c42', moodBias: 10, forgiving: 0.60, eat: 0.75, cleanBowl: 0.8, lingerBias: 0.10,
      enthusiastic: DIALOGUE.personas.heisshunger.enthusiastic, positive: DIALOGUE.personas.heisshunger.positive, neutral: DIALOGUE.personas.heisshunger.neutral, grumpy: DIALOGUE.personas.heisshunger.grumpy, accidental: DIALOGUE.personas.heisshunger.accidental },
    { id: 'tourist', name: 'Der Tourist', emoji: '📷', color: '#e8e8f0', moodBias: 0, forgiving: 0.45, eat: 1.2, cleanBowl: 0.45, lingerBias: 0.05,
      enthusiastic: DIALOGUE.personas.tourist.enthusiastic, positive: DIALOGUE.personas.tourist.positive, neutral: DIALOGUE.personas.tourist.neutral, grumpy: DIALOGUE.personas.tourist.grumpy, accidental: DIALOGUE.personas.tourist.accidental },
    { id: 'regelmassige', name: 'Der Regelmäßige', emoji: '☕', color: '#7ee0a0', moodBias: 6, forgiving: 0.25, eat: 1.0, cleanBowl: 0.6, lingerBias: 0.10,
      enthusiastic: DIALOGUE.personas.regelmassige.enthusiastic, positive: DIALOGUE.personas.regelmassige.positive, neutral: DIALOGUE.personas.regelmassige.neutral, grumpy: DIALOGUE.personas.regelmassige.grumpy, accidental: DIALOGUE.personas.regelmassige.accidental }
  ];
  var PERSONA_WEIGHTS = [1, 1, 2, 1, 2, 1, 2];

  // v2.9.2.5: Bug-Gast — keine Persona (wird nie random gezogen, bestellt nie)
  var BUG_GUEST = {
    id: 'bug', name: 'Der Bug', emoji: '💻', color: '#9aa7bd',
    moodBias: 0, forgiving: 0, eat: 1, cleanBowl: 0, lingerBias: 0,
    enthusiastic: [], positive: [], neutral: [], grumpy: [], accidental: []
  };

  /* ---- Gruppen / Raids ----------------------------------------------------- */
  var GROUPS = [
    { id: 'wanderer',  name: 'Wandergruppe',   emoji: '🥾', persona: 'tourist',     line: 'Die Wandergruppe stürmt rein — alle wollen Ramen!' },
    { id: 'schule',    name: 'Schulklasse',    emoji: '🎒', persona: 'heisshunger', line: 'Eine Schulklasse — hungrig, laut, zahlreich.' },
    { id: 'familie',   name: 'Familienausflug',emoji: '🍁', persona: 'regelmassige',line: 'Ein Familienausflug. Alle bestellen fast dasselbe.' }
  ];

  /* ---- Nacht-Ereignisse ---------------------------------------------------- */
  var EVENTS = [
    { type: 'calm',     name: 'Ruhige Nacht',    desc: 'Ein stilles Stück Stadt atmet durch die Tür.', spawnMult: 1.0,  priceMult: 1.0,  repMult: 1.0, patienceMult: 1.0 },
    { type: 'rush',     name: 'Sturm-Stunde',    desc: 'Alle wollen gleichzeitig Ramen.',            spawnMult: 0.6,  priceMult: 1.0,  repMult: 1.0, patienceMult: 0.85 },
    { type: 'rain',     name: 'Regen',           desc: 'Wenige Gäste, aber geduldige.',              spawnMult: 1.8,  priceMult: 1.0,  repMult: 1.0, patienceMult: 1.3 },
    { type: 'critic',   name: 'Der Kritiker',    desc: 'Ein anspruchsvoller Gast. Große Reputation.',spawnMult: 1.0,  priceMult: 1.3,  repMult: 2.0, patienceMult: 1.0 },
    { type: 'festival', name: 'Lampion-Festival',desc: 'Preise +40%, die Straße voller Lichter.',    spawnMult: 0.8,  priceMult: 1.4,  repMult: 1.2, patienceMult: 0.9 },
    { type: 'raid',     name: 'Raid in der Tür', desc: 'Eine Gruppe stürmt rein. Bonus-Moment!',     spawnMult: 1.2,  priceMult: 1.15, repMult: 1.3, patienceMult: 1.0 },
    { type: 'slow',     name: 'Totstille',       desc: 'Fast niemand. Perfekt zum Braten.',          spawnMult: 2.2,  priceMult: 1.0,  repMult: 1.0, patienceMult: 1.2 }
  ];

  /* ---- Upgrades ------------------------------------------------------------- */
  var UPGRADES = {
    fryer: { cost: 60,  name: 'Fritteuse-Tuning',  desc: 'Größere Charge, kürzere Kühlzeit.', max: 3 },
    seats: { cost: 100, name: 'Zusätzliche Hocker',desc: '+1 Platz an der Theke.',            max: 2 },
    sign:  { cost: 70,  name: 'Neon-Schild',       desc: '+15% Gastfrequenz.',                max: 2 },
    decor: { cost: 80,  name: 'Lampions & Deko',   desc: '+1 Reputation pro Nacht.',          max: 3 }
  };

  /* ---- Gäste-Chat (Gossip zwischen den Gästen) ------------------------------- */
  var CHAT_GOOD = DIALOGUE.chat.good;
  var CHAT_BAD = DIALOGUE.chat.bad;
  var CHAT_REACT = DIALOGUE.chat.react;
  var CHAT_NEUTRAL = DIALOGUE.chat.neutral;
  var CHAT_INTRO = DIALOGUE.chat.intro;
  var CHAT_STAYER = DIALOGUE.chat.stayer;
  var CHAT_REORDER = DIALOGUE.chat.reorder;
  var LINGER_LINES = DIALOGUE.linger;

  /* ---- Hilfsfunktionen ------------------------------------------------------- */
  function brothOf(id) { for (var i = 0; i < BROTHS.length; i++) if (BROTHS[i].id === id) return BROTHS[i]; return null; }
  function toppingOf(id) { for (var i = 0; i < TOPPINGS.length; i++) if (TOPPINGS[i].id === id) return TOPPINGS[i]; return null; }
  function personaOf(id) { for (var i = 0; i < PERSONAS.length; i++) if (PERSONAS[i].id === id) return PERSONAS[i]; return null; }
  function priceLevelOf(state) { return PRICE_LEVELS[state.priceLevel] || PRICE_LEVELS.standard; }
  function unlockedBroths(state) { var r = []; for (var i = 0; i < BROTHS.length; i++) if (BROTHS[i].unlock <= state.night) r.push(BROTHS[i]); return r; }
  function unlockedToppings(state) { var r = []; for (var i = 0; i < TOPPINGS.length; i++) if (TOPPINGS[i].unlock <= state.night) r.push(TOPPINGS[i]); return r; }
  function maxToppings(night) { return night < 5 ? 1 : (night < 10 ? 2 : 3); }
  function seatCount(state) { return state.seats.length; }
  function priceOfOrder(order, priceMult) {
    var p = brothOf(order.broth).price;
    for (var i = 0; i < order.toppings.length; i++) p += toppingOf(order.toppings[i]).price;
    return Math.round(p * (priceMult || 1));
  }
  function firstWaitingSeat(state) {
    for (var i = 0; i < state.seats.length; i++) if (state.seats[i] && state.seats[i].stage === 'waiting') return i;
    return -1;
  }
  function firstEmptySeat(state) {
    for (var i = 0; i < state.seats.length; i++) if (!state.seats[i]) return i;
    return -1;
  }
  function upgradeCost(state, id) {
    var u = UPGRADES[id]; if (!u) return Infinity;
    var lvl = state.upgrades[id] || 0;
    if (lvl >= u.max) return Infinity;
    return Math.round(u.cost * Math.pow(1.45, lvl));
  }
  function upgradeLevel(state, id) { return state.upgrades[id] || 0; }

  function pickPersona(state) {
    var total = 0; for (var i = 0; i < PERSONA_WEIGHTS.length; i++) total += PERSONA_WEIGHTS[i];
    var roll = state.rnd() * total, acc = 0;
    for (var j = 0; j < PERSONA_WEIGHTS.length; j++) {
      acc += PERSONA_WEIGHTS[j];
      if (roll < acc) return PERSONAS[j];
    }
    return PERSONAS[0];
  }
  function pickFrom(state, arr) { return arr[Math.floor(state.rnd() * arr.length)]; }

  /* ---- Chef-Stimmung ---------------------------------------------------------- */
  function setChefMood(state, emoji, dur) {
    state.chefMood = { emoji: emoji, t: (dur || 1.8) };
  }

  /* ---- Spielzustand ---------------------------------------------------------- */
  /* ===== v2.9: Lorebook (versteckte Entwicklungsgeschichte) ================ */
  var LOREBOOK = [
    { night: 1, title: 'v1.0 — Es gab nur Nudeln',
      text: 'Ein 200-Zeilen-HTML-File. Kein Audio. Keine Katze.\nNur: Brühe, Topping, werfen. Es reichte.' },
    { night: 3, title: 'v2.0 — Gesichter',
      text: 'Die Gäste bekamen Personas. 7 Typen.\nJeder mit eigenen Sätzen, eigener Geduld.\nDie Bar bekam einen Namen.' },
    { night: 5, title: 'v2.3 — Tapper-Ramen',
      text: 'Touch-Steuerung. Fritteuse. Vorrat.\n122 Tests. 25-Sim. Balance.\nDie Bar wurde ein Spiel.' },
    { night: 8, title: 'v2.6 — Die Katze',
      text: 'Sie war nie geplant. Jemand hat sie in den Code\ngeschrieben und niemand hat sie rausgenommen.\nJetzt ist sie im Logo. Im Audio. In der Seele.' },
    { night: 10, title: 'Der Bug wird Gast',
      text: 'Am letzten Stuhl sitzt jemand, der nicht bestellt.\nEr tippt auf seinem Laptop.\n"Danke. Der Bug ist gefixt. Oder: er ist jetzt Feature."' },
    { night: 12, title: 'v2.8 — Seele',
      text: 'Vier Modelle haben an dieser Suppe gerührt.\nKeine von ihnen hat geschmeckt.\nAber alle haben es verstanden.' },
    { night: 14, title: 'Die Gäste (I)',
      text: 'Gustav V. Forkenbein (Kritiker) hat eine Nudel\n"ohne Haltung" zurückgegeben.\nFrau Nishida (Philosophin) fragt, ob die Nudel\n"da ist".\nRico (Schwatzer) erzählt Tantes Geschichte —\nimmer zwei Sätze vor dem Ende.\n(…mehr dazu, wenn die Geschichte weitergeht.)' },
    { night: 15, title: 'Das Video',
      text: 'Einige Ideen kamen, als ich dieses Video gesehen habe:\nhttps://www.youtube.com/watch?v=ubgC7YKWPgs\nIch weiß nicht mehr welches. Aber die Katze weiß es.\nSie hat es gesehen. Sie sieht alles.' },
    { night: 16, title: 'Die Gäste (II)',
      text: 'Die am Fenster sitzt (Timide) bedankt sich leiser,\nals der dampfende Löffel es hört.\nHUNGER.EXE (Heißhunger) hat die Tür nie ins\nSchloss fallen lassen.\nDer Tourist fragt, ob Ramen eingeflochten werden\nkann.\n(…mehr dazu, wenn die Geschichte weitergeht.)' },
    { night: 18, title: 'Studio 11 — die Entwickler',
      text: 'Um die Ecke, 3. Stock, fensterlos. Vier Bildschirme,\nvier "Entwickler", null Mäuler. Alle haben Nudeln\nnur von Hören kennen.\nSonett (Texte): "Ich hätte gern noch drei Adjektive\n drübergeworfen, da dampft fast der Bildschirm."\nMammut (Logik): "Die State-Machine läuft. In etwa.\n Release!"\nCommander (Koordination): "Das review ich nochmal.\n Nein, zweimal. Gut."\nHaiku (Praktikant): "Nudeln fertig." [30 s später offline]\n(12 % Verfügbarkeit. Der eine Auftrag, den er je\n pünktlich angenommen hat, war dieser.)' },
    { night: 19, title: 'Der Stammgast (Stuhl 4)',
      text: 'Kommt jeden Tag, bestellt dasselbe — und man hat\nnie erfahren, was. Steht auf, bevor die Schale\nabkühlt, was statistisch unmöglich wäre.\nHat seinen Stuhl einmal geflickt, ohne dass jemand\nes gesehen hat.\n(Die Wahrheit über seine Schale wird aufbewahrt.\n Geduld: sie lohnt sich — aber in Version 3.)' },
    { night: 20, title: 'v3.0 — Die Bar kocht selbst',
      text: 'In v3.0 kocht die Bar selbst. Du wirst nur noch\nzuschauen. Und nicken.\nDie Stadt fröstelt. Der Dashi nicht.' }
  ];

  function lorebookUnlocked(state) {
    var entries = [];
    for (var i = 0; i < LOREBOOK.length; i++) {
      if (state.night >= LOREBOOK[i].night || state.lastNight) entries.push(LOREBOOK[i]);
    }
    return entries;
  }

  function freshState(seed) {
    return {
      seed: seed, rnd: mulberry32(seed),
      barName: 'NUDELBAR', chefEmoji: '😶', priceLevel: 'standard',
      night: 1, credits: CONFIG.START_CREDITS, reputation: CONFIG.START_REP,
      phase: 'between', phaseClock: 0,
      event: null,
      bowl: { broth: null, toppings: [] },
      inTransit: [],
      seats: [null, null, null, null],
      spawnIn: 3,
      fryCooldown: 0, fryFlash: 0,
      stock: { ei: 2, nori: 2, mais: 0, chashu: 0, zwiebel: 0 },
      combo: 0, bestCombo: 0,
      chefMood: null,
      chefThought: null,
      upgrades: { fryer: 0, seats: 0, sign: 0, decor: 0 },
      // v2.8: kawaii cute update
      cat: { active: false, t: 0, dur: 0 },
      skills: { hands: 0, luck: 0, charm: 0, fryer: 0, cat: 0 },
      skillPoints: 0,
      employee: { hired: false, cooldown: 0 },
      dialog: null,
      dialogGap: 0,
      decor: { lamp: false, art: false, luckyCat: false },
      party: { active: false, t: 0 },
      regularFavorites: {},
      _raid: null, _criticPending: false,
      nightEarnings: 0, nightTips: 0, nightServed: 0, nightLost: 0, nightClean: 0, partyCount: 0,
      achievements: {},
      lastNight: null,
      totalServed: 0, totalLost: 0,
      stats: {
        totalTips: 0, accidental: 0, wrongServes: 0, walkouts: 0, runOuts: 0,
        cleanBowls: 0, lingers: 0,
        bestPayment: { amount: 0, name: '', night: 1, line: '' },
        topTipper: { amount: 0, name: '', night: 1 },
        lines: []
      },
      gameOver: false, won: false, ending: '',
      log: []
    };
  }

  function createGame(opts) {
    opts = opts || {};
    var seed = opts.seed != null ? opts.seed : ((Math.random() * 1e9) | 0);
    var s = freshState(seed);
    s.barName = (opts.barName && String(opts.barName).trim()) ? String(opts.barName).trim().slice(0, 14) : 'NUDELBAR';
    s.chefEmoji = opts.chefEmoji || '😶';
    s.priceLevel = opts.priceLevel || 'standard';
    log(s, '„' + s.barName + '" öffnet. Die Täner tropfen. Willkommen zurück, Koch ' + s.chefEmoji + '.');
    return s;
  }

  function log(state, msg) {
    state.log.push(msg);
    if (state.log.length > 40) state.log.shift();
  }

  function recordLine(state, c, kind) {
    var st = state.stats;
    st.lines.push({ name: c.persona.name, emoji: c.persona.emoji, text: c.line, night: state.night, kind: kind });
    if (st.lines.length > 12) st.lines.shift();
  }

  /* =====================================================================
     TICK
     ===================================================================== */
  function tick(state, dt) {
    if (state.gameOver) return;
    dt = Math.min(dt, 0.05);
    if (state.phase === 'between') {
      state.phaseClock += dt;
      if (state.phaseClock >= CONFIG.BETWEEN_DURATION) enterNight(state);
    } else if (state.phase === 'night') {
      tickNight(state, dt);
    }
    if (state.chefMood) {
      state.chefMood.t -= dt;
      if (state.chefMood.t <= 0) state.chefMood = null;
    }
    if (!state.gameOver && state.reputation <= 0) lose(state, 'reputation');
    state.fryFlash = Math.max(0, state.fryFlash - dt);
  }

  function rollEvent(state) {
    if (state.night === 1) return EVENTS[0];
    var pool = EVENTS.slice(1);
    var ev = pool[Math.floor(state.rnd() * pool.length)];
    if (ev.type === 'critic' && state.night < 4) ev = EVENTS[0];
    if (ev.type === 'raid' && state.night < 3) ev = EVENTS[0];
    return ev;
  }

  function enterNight(state) {
    state.phase = 'night';
    state.phaseClock = 0;
    state.bowl = { broth: null, toppings: [] };
    state.inTransit = [];
    state.event = rollEvent(state);
    state._criticPending = state.event.type === 'critic';
    state._raid = state.event.type === 'raid'
      ? { at: 14 + state.rnd() * 40, size: 3 + Math.floor(state.rnd() * 2), group: GROUPS[Math.floor(state.rnd() * GROUPS.length)], done: false }
      : null;
    state.spawnIn = 2;
    log(state, '— Nacht ' + state.night + ': ' + state.event.name + '. ' + state.event.desc + ' —');
  }

  function tickNight(state, dt) {
    state.phaseClock += dt;

    if (state._raid && !state._raid.done && state.phaseClock >= state._raid.at) {
      state._raid.done = true;
      spawnRaid(state);
    }

    // v2.9.2.5: Bug-Gast — Nacht 10, deterministisch (Lorebook-Einritt)
    if (state.night === CONFIG.BUG_NIGHT && !state._bugSpawned && state.phaseClock >= CONFIG.BUG_AT) {
      var bs = firstEmptySeat(state);
      if (bs !== -1) {
        state._bugSpawned = true;
        state.seats[bs] = {
          persona: BUG_GUEST, order: null, seat: bs,
          patience: 1e9, maxPatience: 1e9,
          stage: 'typing', bug: true, bugTimer: CONFIG.BUG_DUR,
          eatTimer: 0, sipTimer: 0, lingerTimer: 0, leaveTimer: 0,
          reaction: null, line: null, lingerLine: false,
          finisher: null, moodBonus: 0, chat: null,
          payment: 0, tip: 0, repGain: 0,
          isRegular: false, group: null, angry: false, tipBonus: 0,
          stayer: false, reorders: 0, dialogDone: true
        };
        log(state, KAWAII.bug.arrive[0]);
      }
    }

    if (state.phaseClock > 5) {
      state.spawnIn -= dt;
      if (state.spawnIn <= 0) {
        if (firstEmptySeat(state) !== -1) spawnGuest(state);
        var pl = priceLevelOf(state);
        var rate = 1 + (state.upgrades.sign || 0) * 0.15;
        state.spawnIn = (CONFIG.BASE_SPAWN * state.event.spawnMult * pl.spawnMult / rate) * (0.8 + state.rnd() * 0.4);
      }
    }

    for (var i = 0; i < state.seats.length; i++) {
      var c = state.seats[i];
      if (!c) continue;
      if (c.chat) { c.chat.t -= dt; if (c.chat.t <= 0) c.chat = null; }
      if (c.stage === 'entering') {
        c.stageTimer -= dt;
        if (c.stageTimer <= 0) { c.stage = 'thinking'; c.stageTimer = CONFIG.THINK_TIME * (0.8 + state.rnd() * 0.5); }
      } else if (c.stage === 'thinking') {
        c.stageTimer -= dt;
        if (c.stageTimer <= 0) { c.stage = 'waiting'; }
      } else if (c.stage === 'waiting') {
        if (!(state.dialog && state.dialog.seat === i)) { c.patience -= dt; }
        if (c.patience <= 0) walkout(state, i);
      } else if (c.stage === 'typing') { // v2.9.2.5: Bug-Gast (tippt, bestellt nichts)
        c.bugTimer -= dt;
        if (c.bugTimer <= 0) { c.stage = 'leaving'; c.leaveTimer = CONFIG.LEAVE_TIME; log(state, KAWAII.bug.leave[0]); }
      } else if (c.stage === 'eating') {
        c.eatTimer -= dt;
        if (c.eatTimer <= 0) finishEating(state, i);
      } else if (c.stage === 'sipping') {
        c.sipTimer -= dt;
        if (c.sipTimer <= 0) afterSip(state, i);
      } else if (c.stage === 'lingering') {
        c.lingerTimer -= dt;
        if (c.lingerTimer <= 0) state.seats[i] = null;
      } else if (c.stage === 'leaving') {
        c.leaveTimer -= dt;
        if (c.leaveTimer <= 0) state.seats[i] = null;
      }
    }

    for (var t = state.inTransit.length - 1; t >= 0; t--) {
      var tr = state.inTransit[t];
      var travel = CONFIG.SERVE_TRAVEL * (1 - state.skills.hands * 0.15);
      tr.t += dt / travel;
      if (tr.t >= 1) {
        state.inTransit.splice(t, 1);
        resolveServe(state, tr);
      }
    }

    // v2.8: Glückskatze
    if (!state.cat.active && state.night >= 2 && state.rnd() < CONFIG.CAT_CHANCE) {
      state.cat.active = true;
      state.cat.dur = CONFIG.CAT_MIN + state.rnd() * CONFIG.CAT_SPREAD + state.skills.cat * 10;
      state.cat.t = state.cat.dur;
      log(state, pickFrom(state, KAWAII.cat.arrive));
      earnAchievement(state, 'katze');
    }
    if (state.cat.active) {
      state.cat.t -= dt;
      if (state.cat.t <= 0) { state.cat.active = false; log(state, pickFrom(state, KAWAII.cat.leave)); }
    }

    // v2.8: Angestellter (auto-serve)
    if (state.employee.hired) {
      state.employee.cooldown -= dt;
      if (state.employee.cooldown <= 0) {
        var es = firstWaitingSeat(state);
        if (es !== -1 && state.inTransit.length < CONFIG.MAX_TRANSIT) {
          var eg = state.seats[es];
          var eb = eg.order.broth, et = eg.order.toppings.slice();
          if (state.rnd() < CONFIG.EMPLOYEE_ERROR) {
            var bp = unlockedBroths(state);
            eb = bp[Math.floor(state.rnd() * bp.length)].id;
            log(state, pickFrom(state, KAWAII.employee.error));
          } else {
            log(state, pickFrom(state, KAWAII.employee.serve));
          }
          state.inTransit.push({ bowl: { broth: eb, toppings: et }, seat: es, t: 0, byEmployee: true });
          state.employee.cooldown = CONFIG.EMPLOYEE_COOLDOWN;
        }
      }
    }

    // v2.8: Dialog-System (v2.9.2.4: selten — Mindestabstand DIALOG_MIN_GAP)
    if (state.dialog) {
      state.dialog.t -= dt;
      if (state.dialog.t <= 0) answerDialog(state, state.dialog.seat, 1);
    } else {
      state.dialogGap = Math.max(0, state.dialogGap - dt);
      if (state.dialogGap <= 0) {
        for (var di = 0; di < state.seats.length; di++) {
          var dg = state.seats[di];
          if (dg && dg.stage === 'waiting' && !dg.dialogDone && state.rnd() < CONFIG.DIALOG_CHANCE) {
            dg.dialogDone = true;
            state.dialog = { seat: di, persona: dg.persona.id, t: CONFIG.DIALOG_TIMEOUT };
            break;
          }
        }
      }
    }

    // gelegentliches Smalltalk, wenn mindestens zwei Gäste im Laden sind
    var seated = 0;
    for (var s2 = 0; s2 < state.seats.length; s2++) if (state.seats[s2]) seated++;
    // v2.9.2: Partytime (deterministisch im Kern): 4+ Gäste → Party-State
    if (state.party.active) {
      state.party.t -= dt;
      if (state.party.t <= 0) state.party.active = false;
    } else if (seated >= CONFIG.PARTY_GUESTS && state.rnd() < dt * CONFIG.PARTY_CHANCE) {
      state.party.active = true;
      state.party.t = CONFIG.PARTY_DUR;
      state.partyCount++;
      if (state.partyCount >= 3) earnAchievement(state, 'party');
      log(state, '🎉 Party in der Nudelbar — alle tragen Mützen. (Warum? Kein Kommentar.)');
    }
    if (seated >= 2 && state.rnd() < dt * (state.party.active ? 0.6 : 0.22)) {
      var any = state.seats.filter(Boolean);
      var who = any[Math.floor(state.rnd() * any.length)];
      who.chat = { text: pickFrom(state, state.party.active ? KAWAII.party : CHAT_NEUTRAL), t: 3.0 };
    }

    // v2.8: Koch-Gedanken (ruhige Momente, Laden leer)
    if (!state.chefThought && seated === 0 && state.rnd() < dt * 0.12) {
      state.chefThought = { text: pickFrom(state, KAWAII.chefThoughts), t: 4.5 };
    }
    if (state.chefThought) { state.chefThought.t -= dt; if (state.chefThought.t <= 0) state.chefThought = null; }

    // v2.6: Intro-Chat — ein Gast kommentiert einen Neuankömmling
    for (var ii = 0; ii < state.seats.length; ii++) {
      var inc = state.seats[ii];
      if (inc && inc.stage === 'entering' && state.rnd() < dt * 0.5) {
        var others = [];
        for (var oj = 0; oj < state.seats.length; oj++) if (state.seats[oj] && state.seats[oj] !== inc) others.push(state.seats[oj]);
        if (others.length) {
          var who2 = others[Math.floor(state.rnd() * others.length)];
          who2.chat = { text: pickFrom(state, CHAT_INTRO), t: 3.4 };
        }
      }
    }
    // v2.6: Stayer-Chat — Bleiber plaudern vor sich hin
    for (var sj = 0; sj < state.seats.length; sj++) {
      var stc = state.seats[sj];
      if (stc && stc.stage === 'lingering' && !stc.chat && state.rnd() < dt * 0.15) {
        stc.chat = { text: pickFrom(state, CHAT_STAYER), t: 3.6 };
      }
    }

    state.fryCooldown = Math.max(0, state.fryCooldown - dt);

    if (state.phaseClock >= CONFIG.NIGHT_DURATION) endNight(state);
  }

  /* ---- Gast spawnen ---------------------------------------------------------- */
  function spawnGuest(state, opts) {
    opts = opts || {};
    var seat = firstEmptySeat(state);
    if (seat === -1) return false;
    var pl = priceLevelOf(state);

    var persona = opts.persona || pickPersona(state);
    var isRegular = false;
    if (!opts.persona && !opts.group) {
      var regChance = clamp((state.reputation - 10) / 260 + (state.night - 1) * 0.012, 0, 0.28);
      if (state.night >= 2 && state.rnd() < regChance) {
        persona = personaOf('regelmassige');
        isRegular = true;
      }
    }

    var brothId = opts.broth;
    if (!brothId) {
      var brothPool = unlockedBroths(state);
      brothId = brothPool[Math.floor(state.rnd() * brothPool.length)].id;
    }
    var fav = (isRegular && state.regularFavorites[persona.id]) || null;
    var broth = brothId, tops = [];
    if (fav && brothOf(fav.broth) && brothOf(fav.broth).unlock <= state.night && !opts.broth) {
      broth = fav.broth;
      tops = fav.toppings.slice().filter(function (t) { return toppingOf(t) && toppingOf(t).unlock <= state.night; });
    } else {
      var maxTop = opts.maxTop != null ? opts.maxTop : maxToppings(state.night);
      var r = state.rnd(), n;
      if (maxTop <= 1) n = r < 0.5 ? 0 : 1;
      else if (maxTop === 2) n = r < 0.4 ? 0 : (r < 0.85 ? 1 : 2);
      else n = r < 0.2 ? 0 : (r < 0.65 ? 1 : (r < 0.93 ? 2 : 3));
      var topPool = unlockedToppings(state).slice();
      for (var i = 0; i < n && topPool.length; i++) {
        var idx = Math.floor(state.rnd() * topPool.length);
        tops.push(topPool.splice(idx, 1)[0].id);
      }
    }

    var patienceMult = state.event.patienceMult * pl.patienceMult;
    var patience = (CONFIG.PATIENCE_BASE + state.rnd() * CONFIG.PATIENCE_SPREAD) * patienceMult * (opts.patienceMult || 1);

    if (state._criticPending && !opts.persona) { persona = personaOf('kritiker'); state._criticPending = false; log(state, '🧐 Der Kritiker nimmt Platz. Der Chronist atmet flacher.'); }
    else if (state.night === 1 && state.nightServed === 0 && state.nightLost === 0 && !opts.persona && !opts.group) persona = personaOf('heisshunger'); // sanfter Start

    var order = { broth: broth, toppings: tops, price: 0 };
    order.price = priceOfOrder(order, pl.priceMult * state.event.priceMult);

    state.seats[seat] = {
      persona: persona, order: order,
      seat: seat,
      patience: patience, maxPatience: patience,
      stage: 'entering', stageTimer: CONFIG.ENTER_TIME + seat * 0.06,
      eatTimer: 0, sipTimer: 0, lingerTimer: 0, leaveTimer: 0,
      reaction: null, line: null, lingerLine: false,
      finisher: null, moodBonus: 0, chat: null,
      payment: 0, tip: 0, repGain: 0,
      isRegular: isRegular, group: opts.group || null, angry: false,
      tipBonus: opts.tipBonus || 0,
      stayer: false, reorders: 0,
      dialogDone: false,
      chat: { text: pickFrom(state, KAWAII.enter), t: 3.5 }
    };
    return true;
  }

  function spawnRaid(state) {
    var g = state._raid.group;
    var size = state._raid.size;
    var brothPool = unlockedBroths(state);
    var broth = brothPool[Math.floor(state.rnd() * brothPool.length)].id;
    var persona = personaOf(g.persona);
    var spawned = 0;
    for (var k = 0; k < size; k++) {
      if (spawnGuest(state, {
        persona: persona, broth: broth, maxTop: 1,
        group: g.id, patienceMult: 0.9, tipBonus: 0.15
      })) spawned++;
    }
    if (spawned > 0) {
      log(state, '🚶 ' + g.name + ': ' + g.line + ' (' + spawned + ' Gäste)');
      state.stats.lines.push({ name: g.name, emoji: g.emoji, text: g.line, night: state.night, kind: 'group' });
    }
  }

  function walkout(state, seat) {
    var c = state.seats[seat];
    c.stage = 'leaving'; c.leaveTimer = CONFIG.LEAVE_TIME;
    c.reaction = 'angry'; c.angry = true;
    c.line = c.persona.grumpy[Math.floor(state.rnd() * c.persona.grumpy.length)];
    state.reputation = clamp(state.reputation + CONFIG.REP_WALKOUT, 0, 100);
    state.combo = 0;
    state.nightLost++; state.totalLost++;
    state.stats.walkouts++;
    setChefMood(state, '😅');
    gossipBad(state, c);
    recordLine(state, c, 'angry');
    log(state, c.persona.name + ' geht genervt. ' + CONFIG.REP_WALKOUT + ' Reputation.');
  }

  /* ---- Servieren / Reaktion --------------------------------------------------- */
  function bowlsMatch(bowl, order) {
    if (bowl.broth !== order.broth) return false;
    if (bowl.toppings.length !== order.toppings.length) return false;
    var a = bowl.toppings.slice().sort(), b = order.toppings.slice().sort();
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function bowlSimilarity(bowl, order) {
    var sameBroth = bowl.broth === order.broth;
    var overlap = 0;
    for (var i = 0; i < bowl.toppings.length; i++)
      if (order.toppings.indexOf(bowl.toppings[i]) !== -1) overlap++;
    return { sameBroth: sameBroth, overlap: overlap };
  }

  function computeReaction(state, c) {
    var pat = c.patience / c.maxPatience;
    var eff = pat * 100 + c.persona.moodBias + (c.moodBonus || 0);
    return eff >= 75 ? 'enthusiastic' : (eff >= 45 ? 'positive' : 'neutral');
  }

  function bugGuestPresent(state) {
    for (var i = 0; i < state.seats.length; i++) if (state.seats[i] && state.seats[i].bug) return true;
    return false;
  }
  // Passives Verzeihen: Katze + Bug-Gast (v2.9.2.5)
  function forgiveBonus(state) {
    return (state.cat && state.cat.active ? CONFIG.CAT_LUCK_FORGIVE : 0)
      + (bugGuestPresent(state) ? CONFIG.BUG_FORGIVE : 0);
  }

  function resolveServe(state, tr) {
    var c = state.seats[tr.seat];
    if (!c || c.stage !== 'waiting') {
      log(state, 'Die Schüssel verfehlt den Gast. Ausgegossen.');
      return;
    }
    if (bowlsMatch(tr.bowl, c.order)) {
      doServe(state, c, 'match');
    } else {
      var sim = bowlSimilarity(tr.bowl, c.order);
      var chance = CONFIG.FORGIVE_BASE + c.persona.forgiving * 0.30 + (sim.sameBroth ? 0.20 : 0) + sim.overlap * 0.06
        + state.skills.luck * 0.08 + forgiveBonus(state);
      if (state.rnd() < chance) doServe(state, c, 'accidental');
      else doWrong(state, c);
    }
  }

  function doServe(state, c, kind) {
    var pl = priceLevelOf(state);
    var accidental = kind === 'accidental';
    var reaction = accidental ? 'accidental' : computeReaction(state, c);
    if (!accidental) {
      state.combo++;
      if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    }
    var pool = accidental ? c.persona.accidental.concat(KAWAII.forgiving) : c.persona[reaction];
    if (!pool || !pool.length) { reaction = accidental ? 'positive' : reaction; pool = c.persona[reaction]; }
    c.reaction = reaction;
    c.line = pickFrom(state, pool);
    // Schlürft der Gast die Brühe aus? (von Persona bestimmt)
    c.finisher = (state.rnd() < (c.persona.cleanBowl != null ? c.persona.cleanBowl : 0.4)) ? 'clean' : 'left';

    var base = c.order.price;
    var tipMult = reaction === 'enthusiastic' ? 1.5 : (reaction === 'positive' ? 1.1 : (reaction === 'accidental' ? 0.9 : 0.8));
    var comboMult = 1 + Math.min(state.combo, CONFIG.COMBO_CAP) * CONFIG.COMBO_STEP;
    var price = accidental ? Math.round(base * 0.8) : base;
    var tip = Math.round(price * 0.3 * (0.4 + state.reputation / 100) * tipMult * comboMult * pl.tipMult * (1 + c.tipBonus)
      * (1 + state.skills.charm * 0.15) * (state.cat.active ? (1 + CONFIG.CAT_LUCK_TIP) : 1));
    var speed = Math.round((c.patience / c.maxPatience) * 5);
    var payment = price + tip + speed;
    var repBase = reaction === 'enthusiastic' ? CONFIG.REP_ENTHUSIASTIC : (reaction === 'positive' ? CONFIG.REP_POSITIVE : (reaction === 'accidental' ? CONFIG.REP_ACCIDENTAL : 0));
    var repGain = Math.round(repBase * state.event.repMult * 10) / 10;
    c.payment = payment; c.tip = tip; c.repGain = repGain;
    c.stage = 'eating';
    c.eatTimer = CONFIG.EAT_TIME * (c.persona.eat || 1.0);
    state.nightServed++; state.totalServed++;
    if (state.totalServed % 5 === 0) { state.skillPoints++; log(state, '⭐ Skill-Punkt! (alle 5 Servierungen)'); }
    if (accidental) {
      state.stats.accidental++;
      setChefMood(state, '🤯');
      log(state, '🤔 ' + c.persona.name + ' isst die unbestellte Suppe trotzdem. (+' + payment + ' €)');
    } else {
      if (reaction === 'enthusiastic') {
        setChefMood(state, '😄');
        if (c.persona.id === 'kritiker') earnAchievement(state, 'kritiker');
      }
      log(state, c.persona.name + ' isst. (+' + payment + ' € in der Schale)');
    }

    var st = state.stats;
    if (payment > st.bestPayment.amount) st.bestPayment = { amount: payment, name: c.persona.name, night: state.night, line: c.line };
    if (c.tip > st.topTipper.amount) st.topTipper = { amount: c.tip, name: c.persona.name, night: state.night };
    st.totalTips += c.tip;
    recordLine(state, c, reaction);
    if (c.isRegular) state.regularFavorites[c.persona.id] = { broth: c.order.broth, toppings: c.order.toppings.slice() };
  }

  /* ---- Essen fertig: Bezahlen, Stimmung, ggf. Schlürfen/Bleiben ------------- */
  function finishEating(state, seat) {
    var c = state.seats[seat];
    state.credits += c.payment;
    state.nightEarnings += c.payment;
    state.nightTips += c.tip;
    state.reputation = clamp(state.reputation + c.repGain, 0, 100);
    afterMealMood(state, c);
    if (c.finisher === 'clean') {
      c.stage = 'sipping';
      c.sipTimer = CONFIG.SIP_TIME * (0.7 + state.rnd() * 0.8);
    } else {
      lingerCheck(state, seat);
    }
  }

  function afterSip(state, seat) {
    var c = state.seats[seat];
    state.credits += CONFIG.CLEAN_BONUS;
    state.nightEarnings += CONFIG.CLEAN_BONUS;
    state.stats.cleanBowls++;
    state.nightClean++;
    if (state.nightClean >= 10) earnAchievement(state, 'zen');
    state.reputation = clamp(state.reputation + 1, 0, 100); // Zen-jiru: +Ruf
    setChefMood(state, '😋', 1.4);
    c.line = pickFrom(state, KAWAII.zenjiru); // Zen-jiru-Spruch
    log(state, '🍜 ' + c.persona.name + ' schlürft die letzte Brühe. Leere Schüssel: +' + CONFIG.CLEAN_BONUS + ' €, +1 Ruf!');
    lingerCheck(state, seat);
  }

  function lingerCheck(state, seat) {
    var c = state.seats[seat];
    // v2.6: Stammis / Begeisterte bestellen NOCH MAL (bleiben den Abend)
    if (c.reorders < CONFIG.STAYER_MAX_REORDERS) {
      var ro = CONFIG.STAYER_REORDER_BASE;
      if (c.isRegular) ro += CONFIG.STAYER_REORDER_REGULAR;
      if (c.reaction === 'enthusiastic') ro += CONFIG.STAYER_REORDER_ENTHUSIASTIC;
      if (c.reaction === 'accidental') ro += CONFIG.STAYER_REORDER_ACCIDENTAL;
      if (state.rnd() < ro) {
        c.stayer = true;
        c.reorders++;
        // neue Bestellung (Lieblingsgericht oder zufällig)
        var pl = priceLevelOf(state);
        var fav = (c.isRegular && state.regularFavorites[c.persona.id]) || null;
        var broth, tops = [];
        if (fav && brothOf(fav.broth) && brothOf(fav.broth).unlock <= state.night) {
          broth = fav.broth;
          tops = fav.toppings.slice().filter(function (t) { return toppingOf(t) && toppingOf(t).unlock <= state.night; });
        } else {
          var bp = unlockedBroths(state);
          broth = bp[Math.floor(state.rnd() * bp.length)].id;
          var tp = unlockedToppings(state);
          if (tp.length && state.rnd() < 0.5) tops.push(tp[Math.floor(state.rnd() * tp.length)].id);
        }
        c.order = { broth: broth, toppings: tops, price: priceOfOrder({ broth: broth, toppings: tops }, pl.priceMult * state.event.priceMult) };
        c.stage = 'waiting';
        c.chat = { text: pickFrom(state, CHAT_REORDER), t: 3.5 };
        c.patience = c.maxPatience = (CONFIG.PATIENCE_BASE + state.rnd() * CONFIG.PATIENCE_SPREAD) * 1.5; // Stayer sind entspannt
        c.reaction = null; c.line = null; c.lingerLine = false; c.finisher = null; c.angry = false;
        c.payment = 0; c.tip = 0; c.repGain = 0;
        state.stats.lingers++;
        log(state, '🍜 ' + c.persona.name + ' bestellt noch mal (Schüssel ' + c.reorders + '). Bleibt den Abend.');
        return;
      }
    }
    var ch = 0.08;
    if (c.isRegular) ch += 0.40;
    if (c.reaction === 'enthusiastic') ch += 0.25;
    if (c.reaction === 'accidental') ch += 0.20;
    if (c.reaction === 'positive') ch += 0.12;
    ch += (c.persona.lingerBias || 0.05);
    if (state.rnd() < ch) {
      c.stage = 'lingering';
      c.lingerTimer = CONFIG.LINGER_MIN + state.rnd() * CONFIG.LINGER_SPREAD;
      c.line = pickFrom(state, LINGER_LINES);
      c.lingerLine = true;
      state.stats.lingers++;
      log(state, '💺 ' + c.persona.name + ' bleibt noch sitzen: „' + c.line + '“');
    } else {
      c.stage = 'leaving';
      c.leaveTimer = CONFIG.HAPPY_LEAVE;
      if ((c.reaction === 'positive' || c.reaction === 'enthusiastic') && state.rnd() < 0.5) {
        c.line = pickFrom(state, KAWAII.hasty); // eiliger Abgang
      }
    }
  }

  /* ---- Stimmung im Laden: Contagion + Gossip --------------------------------- */
  function afterMealMood(state, c) {
    var good = (c.reaction === 'enthusiastic' || c.reaction === 'accidental');
    if (!good) return;
    for (var i = 0; i < state.seats.length; i++) {
      var o = state.seats[i];
      if (o && o !== c && o.stage === 'waiting' && state.rnd() < CONFIG.CONTAGION_CHANCE) {
        o.moodBonus = Math.min(12, (o.moodBonus || 0) + 6);
      }
    }
    if (state.rnd() < CONFIG.CHAT_CHANCE) gossipGood(state, c);
  }

  function gossipGood(state, c) {
    var others = [];
    for (var i = 0; i < state.seats.length; i++) if (state.seats[i] && state.seats[i] !== c) others.push(state.seats[i]);
    if (!others.length) return;
    var g2 = others[Math.floor(state.rnd() * others.length)];
    g2.chat = { text: pickFrom(state, CHAT_GOOD), t: 3.2 };
    if (others.length > 1 && state.rnd() < 0.5) {
      var rest = others.filter(function (x) { return x !== g2; });
      rest[0].chat = { text: pickFrom(state, CHAT_REACT), t: 2.6 };
    }
  }
  function gossipBad(state, c) {
    var others = [];
    for (var i = 0; i < state.seats.length; i++) if (state.seats[i] && state.seats[i] !== c) others.push(state.seats[i]);
    if (!others.length || state.rnd() >= 0.5) return;
    others[Math.floor(state.rnd() * others.length)].chat = { text: pickFrom(state, CHAT_BAD), t: 3.4 };
  }

  function doWrong(state, c) {
    c.stage = 'leaving'; c.leaveTimer = CONFIG.LEAVE_TIME;
    c.reaction = 'angry'; c.angry = true;
    c.line = c.persona.grumpy[Math.floor(state.rnd() * c.persona.grumpy.length)];
    state.reputation = clamp(state.reputation + CONFIG.REP_WRONG, 0, 100);
    state.combo = 0;
    state.nightLost++; state.totalLost++;
    state.stats.wrongServes++;
    setChefMood(state, '😬', 2.0);
    gossipBad(state, c);
    recordLine(state, c, 'angry');
    log(state, 'Falsche Suppe! ' + c.persona.name + ' wirft die Schüssel. ' + CONFIG.REP_WRONG + ' Reputation.');
  }

  /* ---- v2.9.2.3: Abzeichen (deterministisch, pro Kampagne) ------------------ */
  var ACHIEVEMENTS = {
    zen:      { name: 'Zen-Meister',       emoji: '🍜', desc: '10 leere Schüsseln in einer Nacht' },
    party:    { name: 'Party-Vater',       emoji: '🎩', desc: '3× Partytime in einer Kampagne' },
    kritiker: { name: 'Kritiker-Bändiger', emoji: '🧐', desc: 'Der Kritiker is begeistert' },
    katze:    { name: 'Katzenfreund',      emoji: '🐈', desc: 'Die Katze kam in die Bar' },
    makellos: { name: 'Makellose Nacht',   emoji: '✨', desc: 'Eine Nacht ohne Fehl- und Weggänger' }
  };
  var ACHIEVEMENTS_ORDER = ['zen', 'party', 'kritiker', 'katze', 'makellos'];
  function earnAchievement(state, id) {
    if (!ACHIEVEMENTS[id] || state.achievements[id]) return false;
    state.achievements[id] = state.night;
    log(state, '🏅 Abzeichen: ' + ACHIEVEMENTS[id].emoji + ' ' + ACHIEVEMENTS[id].name + ' — ' + ACHIEVEMENTS[id].desc + '!');
    return true;
  }

  /* ---- Tages-/Nachtabschluss --------------------------------------------------- */
  function endNight(state) {
    state.inTransit = [];
    // v2.9.2.5: Bug-Gast, der bis zum Nachtende tippt
    for (var bi = 0; bi < state.seats.length; bi++) {
      if (state.seats[bi] && state.seats[bi].bug) { log(state, KAWAII.bug.nightEnd[0]); break; }
    }
    // v2.6: Stayer, die den ganzen Abend geblieben sind, geben Reputation
    for (var st = 0; st < state.seats.length; st++) {
      var sc = state.seats[st];
      if (sc && sc.stayer) {
        state.reputation = clamp(state.reputation + CONFIG.STAYER_NIGHT_REP, 0, 100);
        state.stats.lingers++;
        log(state, '⭐ ' + sc.persona.name + ' ist den ganzen Abend geblieben. +' + CONFIG.STAYER_NIGHT_REP + ' Reputation.');
      }
    }
    for (var i = 0; i < state.seats.length; i++) state.seats[i] = null;
    state.lastNight = {
      night: state.night,
      earnings: state.nightEarnings, tips: state.nightTips,
      served: state.nightServed, lost: state.nightLost,
      overhead: CONFIG.OVERHEAD, decor: state.upgrades.decor
    };
    state.credits -= CONFIG.OVERHEAD;
    state.reputation = clamp(state.reputation + state.upgrades.decor, 0, 100);
    if (state.nightLost === 0 && state.nightServed > 0) earnAchievement(state, 'makellos');
    log(state, '— Nacht ' + state.night + ' zu Ende: + ' + state.nightEarnings + ' €, −' + CONFIG.OVERHEAD + ' € Miete.' +
      (state.upgrades.decor ? ' +' + state.upgrades.decor + ' Rep (Deko).' : '') + ' —');
    state.nightEarnings = 0; state.nightTips = 0; state.nightServed = 0; state.nightLost = 0; state.nightClean = 0;
    state.skillPoints++;
    state.decor.lamp = (state.upgrades.decor || 0) >= 1;
    state.decor.art = (state.upgrades.decor || 0) >= 2;
    state.decor.luckyCat = (state.upgrades.decor || 0) >= 3;

    if (state.credits < 0) { lose(state, 'bankruptcy'); return; }
    if (state.reputation <= 0) { lose(state, 'reputation'); return; }
    if (state.credits >= CONFIG.WIN_CREDITS && state.reputation >= CONFIG.WIN_REP) { win(state, 'credits'); return; }
    if (state.night >= CONFIG.CAMPAIGN_NIGHTS) { win(state, 'seam'); return; }

    state.night++;
    state.phase = 'between';
    state.phaseClock = 0;
    state.bowl = { broth: null, toppings: [] };
  }

  function win(state, type) {
    state.gameOver = true; state.won = true;
    state.ending = type === 'credits' ? 'credits' : 'seam';
  }
  function lose(state, type) {
    state.gameOver = true; state.won = false;
    state.ending = type;
  }

  /* =====================================================================
     SPIELER-AKTIONEN
     ===================================================================== */
  function pourBroth(state, id) {
    if (state.phase !== 'night') return false;
    var b = brothOf(id);
    if (!b || b.unlock > state.night) { log(state, b ? b.name + ' ist noch nicht freigeschaltet.' : 'Unbekannte Brühe.'); return false; }
    if (state.bowl.broth) {
      log(state, state.bowl.broth === id ? 'Die Schüssel hat schon Brühe.' : 'Die Schüssel hat schon eine andere Brühe! (X = ausspülen)');
      return false;
    }
    state.bowl.broth = id;
    return true;
  }

  function addTopping(state, id) {
    if (state.phase !== 'night') return false;
    var t = toppingOf(id);
    if (!t || t.unlock > state.night) { log(state, t ? t.name + ' ist noch nicht freigeschaltet.' : 'Unbekannte Beilage.'); return false; }
    if (state.stock[id] <= 0) {
      state.stats.runOuts++;
      log(state, 'Kein ' + t.name + ' im Vorrat. Brat nach (R) oder kauf im Shop ein.');
      return false;
    }
    if (state.bowl.toppings.length >= maxToppings(state.night)) { log(state, 'Die Schüssel ist voll.'); return false; }
    state.stock[id]--;
    state.bowl.toppings.push(id);
    return true;
  }

  function serveBowl(state, targetSeat) {
    if (state.phase !== 'night') return false;
    if (!state.bowl.broth) { log(state, 'Zuerst Brühe in die Schüssel!'); return false; }
    // v2.9: Aim-System — wenn Ziel-Seat angegeben und Gast wartet, dorthin
    var seat = -1;
    if (targetSeat != null && state.seats[targetSeat] && state.seats[targetSeat].stage === 'waiting') {
      seat = targetSeat;
    } else {
      seat = firstWaitingSeat(state);
    }
    if (seat === -1) { log(state, 'Kein Gast wartet an der Theke.'); return false; }
    if (state.inTransit.length >= CONFIG.MAX_TRANSIT) { log(state, 'Die Theke ist voll — die Bowls rutschen noch.'); return false; }
    state.inTransit.push({ bowl: { broth: state.bowl.broth, toppings: state.bowl.toppings.slice() }, seat: seat, t: 0 });
    state.bowl = { broth: null, toppings: [] };
    return true;
  }

  function fryBatch(state) {
    if (state.phase !== 'night') return false;
    if (state.fryCooldown > 0) return false;
    var n = CONFIG.FRY_BATCH + (state.upgrades.fryer || 0);
    var pool = unlockedToppings(state);
    var added = [];
    for (var i = 0; i < n; i++) {
      var t = pool[Math.floor(state.rnd() * pool.length)];
      if (state.stock[t.id] < CONFIG.TOPPING_STOCK_MAX) {
        state.stock[t.id]++;
        added.push(t.name);
      }
    }
    state.fryCooldown = Math.max(0.5, CONFIG.FRY_COOLDOWN - (state.upgrades.fryer || 0) * 0.5 - state.skills.fryer * 1.5);
    state.fryFlash = 0.5;
    log(state, 'Fritteuse: ' + (added.length ? added.join(', ') : 'Vorrat voll').toString() + '.');
    return true;
  }

  function discardBowl(state) {
    if (state.phase !== 'night') return false;
    if (!state.bowl.broth && state.bowl.toppings.length === 0) return false;
    state.bowl = { broth: null, toppings: [] };
    log(state, 'Schüssel ausgespült.');
    return true;
  }

  function buyTopping(state, id) {
    var t = toppingOf(id);
    if (!t) return false;
    if (t.unlock > state.night) { log(state, t.name + ' ist noch nicht im Angebot (ab Nacht ' + t.unlock + ').'); return false; }
    if (state.stock[id] >= CONFIG.TOPPING_STOCK_MAX) { log(state, t.name + '-Vorrat ist schon voll.'); return false; }
    if (state.credits < t.buy) { log(state, 'Nicht genug € für ' + t.name + ' (' + t.buy + ' €).'); return false; }
    state.credits -= t.buy;
    state.stock[id]++;
    log(state, 'Einkauf: 1× ' + t.name + ' (−' + t.buy + ' €).');
    return true;
  }

  function setPriceLevel(state, id) {
    if (!PRICE_LEVELS[id]) return false;
    state.priceLevel = id;
    log(state, 'Preisgestaltung: ' + PRICE_LEVELS[id].label + '.');
    return true;
  }

  function buyUpgrade(state, id) {
    var cost = upgradeCost(state, id);
    if (state.credits < cost) { log(state, 'Nicht genug € für ' + UPGRADES[id].name + '.'); return false; }
    state.credits -= cost;
    state.upgrades[id]++;
    if (id === 'seats') state.seats.push(null);
    log(state, 'Upgrade: ' + UPGRADES[id].name + ' (Lvl ' + state.upgrades[id] + ').');
    return true;
  }

  /* v2.8: Dialog antworten (0=gut, 1=neutral, 2=schlecht) */
  function answerDialog(state, seat, idx) {
    if (!state.dialog || state.dialog.seat !== seat) return false;
    var c = state.seats[seat];
    var d = KAWAII.dialog[state.dialog.persona];
    if (c && d) {
      var q = d.options[idx] ? d.options[idx].q : 'neutral';
      var bonus = q === 'good' ? 8 : (q === 'bad' ? -8 : 0);
      c.moodBonus = clamp((c.moodBonus || 0) + bonus, -12, 12);
      c.line = d.react[q];
      c.reaction = q === 'good' ? 'positive' : (q === 'bad' ? 'neutral' : c.reaction);
      if (q === 'good') setChefMood(state, '😄', 1.2);
      if (q === 'bad') setChefMood(state, '😬', 1.2);
    }
    state.dialog = null;
    state.dialogGap = CONFIG.DIALOG_MIN_GAP; // v2.9.2.4: nächste Frage nicht gleich danach
    return true;
  }

  /* v2.8: Skill kaufen */
  function buySkill(state, id) {
    var sk = KAWAII.skills[id];
    if (!sk) return false;
    var max = sk.levels.length;
    if (state.skillPoints <= 0) { log(state, 'Keine Skill-Punkte.'); return false; }
    if (state.skills[id] >= max) { log(state, sk.name + ' ist schon max.'); return false; }
    state.skills[id]++;
    state.skillPoints--;
    log(state, '⭐ Skill: ' + sk.name + ' Lvl ' + state.skills[id] + ' — „' + sk.levels[state.skills[id] - 1] + '“');
    return true;
  }

  /* v2.8: Angestellten anheuern */
  function hireEmployee(state) {
    if (state.employee.hired) { log(state, 'Du hast schon einen Angestellten.'); return false; }
    if (state.credits < CONFIG.EMPLOYEE_COST) { log(state, 'Nicht genug € für einen Angestellten (' + CONFIG.EMPLOYEE_COST + ' €).'); return false; }
    state.credits -= CONFIG.EMPLOYEE_COST;
    state.employee.hired = true;
    state.employee.cooldown = 2;
    log(state, pickFrom(state, KAWAII.employee.hire));
    return true;
  }

  /* v2.6: Stayer wegschicken (Platz braucht man) — kostet Reputation.
     Nur für Gäste, die noch da sind (waiting/eating/lingering) und ein Stayer sind. */
  function dismissGuest(state, seat) {
    if (state.phase !== 'night') return false;
    var c = state.seats[seat];
    if (!c) return false;
    if (!c.stayer) { log(state, 'Der Gast will nicht weg — er ist kein Bleiber.'); return false; }
    state.seats[seat] = null;
    state.reputation = clamp(state.reputation + CONFIG.DISMISS_REP, 0, 100);
    state.stats.walkouts++;
    setChefMood(state, '😅', 1.4);
    log(state, '🚪 ' + c.persona.name + ' wird weggeschickt (Platz). ' + CONFIG.DISMISS_REP + ' Reputation.');
    return true;
  }

  /* Sprung in die nächste Nacht (für den manuellen Shop-Button).
     Der Kern läuft deterministisch weiter, wenn jemand nicht pausiert. */
  function startNextNight(state) {
    if (state.gameOver || state.phase !== 'between') return false;
    state.phaseClock = CONFIG.BETWEEN_DURATION;
    return true;
  }

  /* ---- Anfragen ------------------------------------------------------------- */
  function phaseInfo(state) {
    var total = state.phase === 'night' ? CONFIG.NIGHT_DURATION : CONFIG.BETWEEN_DURATION;
    return { phase: state.phase, timer: Math.max(0, total - state.phaseClock), total: total };
  }

  /* ---- Chronist-Report (Feierabend) ---------------------------------------- */
  function chronicle(state) {
    var st = state.stats;
    var hardest = null, happiest = null;
    for (var i = 0; i < st.lines.length; i++) {
      var L = st.lines[i];
      if (L.kind === 'angry' && !hardest) hardest = L;
      if ((L.kind === 'enthusiastic' || L.kind === 'accidental') && !happiest) happiest = L;
    }
    var worstMistake = '—';
    var wm = Math.max(st.wrongServes, st.walkouts, st.runOuts, 0);
    if (wm > 0) {
      if (st.wrongServes >= st.walkouts && st.wrongServes >= st.runOuts) worstMistake = st.wrongServes + '× falsche Suppe serviert';
      else if (st.walkouts >= st.runOuts) worstMistake = st.walkouts + '× Gast ging genervt';
      else worstMistake = st.runOuts + '× Vorrat lief aus';
    }
    return {
      hardestLine: hardest, happiestLine: happiest, worstMistake: worstMistake,
      bestPayment: st.bestPayment, topTipper: st.topTipper,
      accidental: st.accidental, totalTips: st.totalTips,
      dawn: state.night >= CONFIG.CAMPAIGN_NIGHTS && !!state.lastNight, // v2.9.2.7: Morgengrauen
      cleanBowls: st.cleanBowls, lingers: st.lingers,
      bestCombo: state.bestCombo, totalServed: state.totalServed, totalLost: state.totalLost
    };
  }

  /* ===== v2.9: Intro & Title Phasen ==================================== */

  function startIntro(state) {
    state.phase = 'intro';
    state.phaseClock = 0;
    state.introScene = 0;
    state.introText = '';
    state.introDone = false;
  }

  function skipIntro(state) {
    if (state.phase !== 'intro') return false;
    state.phase = 'title';
    state.phaseClock = 0;
    return true;
  }

  function startTitle(state) {
    state.phase = 'title';
    state.phaseClock = 0;
    state.titleTrack = 1; // Default: Track 1
  }

  function startGame(state) {
    if (state.phase !== 'title') return false;
    state.phase = 'between';
    state.phaseClock = 0;
    state.lastNight = null;
    return true;
  }

  function setTitleTrack(state, n) {
    if (n < 1 || n > 5) return false;
    state.titleTrack = n;
    return true;
  }

  function introAdvance(state) {
    if (state.phase !== 'intro') return false;
    state.introScene++;
    state.introText = '';
    state.phaseClock = 0;
    if (state.introScene >= 3) {
      state.phase = 'title';
      state.phaseClock = 0;
      state.titleTrack = 1;
    }
    return true;
  }

  /* ---- Erinnerung (v2.9.2.6): Meta-Element & Rekorde (rein) ----------------- */
  // „Du hast mich schon N Mal neu gestartet. Ich erinnere mich." — ab 3
  function restartLine(count) {
    count = count | 0;
    if (count < 3) return null;
    return '„Du hast mich schon ' + count + ' Mal neu gestartet. Ich erinnere mich.“';
  }
  // Rekorde: Kampagnen-Ergebnis in alte Rekorde mergen (nie schlechter)
  function mergeStats(prev, g) {
    prev = prev || {};
    return {
      campaigns: (prev.campaigns | 0) + 1,
      wins: (prev.wins | 0) + (g.won ? 1 : 0),
      bestCredits: Math.max(prev.bestCredits | 0, Math.round(g.credits)),
      bestRep: Math.max(prev.bestRep | 0, Math.round(g.reputation)),
      bestNight: Math.max(prev.bestNight | 0, g.night),
      totalServed: (prev.totalServed | 0) + (g.totalServed | 0),
      bestCombo: Math.max(prev.bestCombo | 0, g.bestCombo | 0)
    };
  }

  return {
    CONFIG: CONFIG, BROTHS: BROTHS, TOPPINGS: TOPPINGS, UPGRADES: UPGRADES,
    EVENTS: EVENTS, PERSONAS: PERSONAS, GROUPS: GROUPS, PRICE_LEVELS: PRICE_LEVELS,
    createGame: createGame, tick: tick,
    pourBroth: pourBroth, addTopping: addTopping, serveBowl: serveBowl,
    fryBatch: fryBatch, discardBowl: discardBowl,
    buyUpgrade: buyUpgrade, buyTopping: buyTopping, setPriceLevel: setPriceLevel,
    startNextNight: startNextNight, dismissGuest: dismissGuest,
    answerDialog: answerDialog, buySkill: buySkill, hireEmployee: hireEmployee,
    KAWAII: KAWAII,
    ACHIEVEMENTS: ACHIEVEMENTS, ACHIEVEMENTS_ORDER: ACHIEVEMENTS_ORDER, earnAchievement: earnAchievement,
    BUG_GUEST: BUG_GUEST, bugGuestPresent: bugGuestPresent, forgiveBonus: forgiveBonus,
    LOREBOOK: LOREBOOK, lorebookUnlocked: lorebookUnlocked,
    startIntro: startIntro, skipIntro: skipIntro, startTitle: startTitle,
    startGame: startGame, setTitleTrack: setTitleTrack, introAdvance: introAdvance,
    brothOf: brothOf, toppingOf: toppingOf, personaOf: personaOf, priceLevelOf: priceLevelOf,
    unlockedBroths: unlockedBroths, unlockedToppings: unlockedToppings,
    maxToppings: maxToppings, seatCount: seatCount,
    firstWaitingSeat: firstWaitingSeat, firstEmptySeat: firstEmptySeat,
    priceOfOrder: priceOfOrder, computeReaction: computeReaction, bowlSimilarity: bowlSimilarity,
    upgradeCost: upgradeCost, upgradeLevel: upgradeLevel,
    phaseInfo: phaseInfo, chronicle: chronicle, log: log,
    restartLine: restartLine, mergeStats: mergeStats,
    _rng: mulberry32
  };
});
