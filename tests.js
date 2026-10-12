/* =============================================================================
   NUDELBAR v2.9.2.4 "Tapper-Ramen" — Unit Tests
   Node:  node tests.js
   ============================================================================= */
'use strict';
var core = require('./js/core.js');

var passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  ✗ FAIL: ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + ' (got ' + a + ', want ' + b + ')'); }

function makeGame(seed) {
  var s = core.createGame({ seed: seed, barName: 'TEST' });
  s.phase = 'night'; s.phaseClock = 10; s.event = core.EVENTS[0];
  s.spawnIn = 99999; // kein Auto-Spawn während Tests
  return s;
}
function placeGuest(s, broth, toppings, personaId) {
  var p = core.personaOf(personaId || 'heisshunger');
  var order = { broth: broth, toppings: toppings || [] };
  order.price = core.priceOfOrder(order, 1);
  s.seats[0] = {
    persona: p, order: order, seat: 0,
    patience: 30, maxPatience: 30,
    stage: 'waiting', stageTimer: 0, eatTimer: 0, sipTimer: 0, lingerTimer: 0, leaveTimer: 0,
    reaction: null, line: null, lingerLine: false,
    finisher: null, moodBonus: 0, chat: null,
    payment: 0, tip: 0, repGain: 0,
    isRegular: false, group: null, angry: false, tipBonus: 0,
    stayer: false, reorders: 0
  };
  return s.seats[0];
}
function buildBowl(s, broth, toppings) {
  core.pourBroth(s, broth);
  for (var i = 0; i < (toppings || []).length; i++) core.addTopping(s, toppings[i]);
}
function settle(s, n) { for (var i = 0; i < n; i++) core.tick(s, 0.05); }

console.log('NUDELBAR v2.9.2.4 "Tapper-Ramen" — Core Tests\n');

// 1. Determinismus
(function () {
  var a = core.createGame({ seed: 777, barName: 'A', chefEmoji: '😎', priceLevel: 'billig' });
  var b = core.createGame({ seed: 777, barName: 'A', chefEmoji: '😎', priceLevel: 'billig' });
  eq(a.seed, 777, 'seed');
  eq(a.credits, b.credits, 'same start credits');
  for (var i = 0; i < 500; i++) { core.tick(a, 0.05); core.tick(b, 0.05); }
  eq(a.night, b.night, 'same night after ticks');
  eq(Math.round(a.credits), Math.round(b.credits), 'same credits after ticks');
  eq(a.seats.filter(Boolean).length, b.seats.filter(Boolean).length, 'same seat occupancy');
})();

// 2. Setup-Optionen (barName, chefEmoji, priceLevel)
(function () {
  var s = core.createGame({ seed: 1, barName: '  NEBELTÖPFE  ', chefEmoji: '🤓', priceLevel: 'exklusiv' });
  eq(s.barName, 'NEBELTÖPFE', 'barName trimmed');
  eq(s.chefEmoji, '🤓', 'chefEmoji value');
  eq(s.priceLevel, 'exklusiv', 'priceLevel set');
  var s2 = core.createGame({ seed: 2 });
  eq(s2.barName, 'NUDELBAR', 'default barName (v2.5: fertig)');
  eq(s2.priceLevel, 'standard', 'default priceLevel');
})();

// 3. Nacht-Übergang: between → night nach BETWEEN_DURATION
(function () {
  var s = core.createGame({ seed: 5 });
  eq(s.phase, 'between', 'starts in between');
  for (var i = 0; i < 300; i++) core.tick(s, 0.05);
  eq(s.phase, 'night', 'enters night');
  assert(s.event !== null, 'event rolled');
})();

// 4. Gast-Flow: entering → thinking → waiting
(function () {
  var s = makeGame(30);
  s.spawnIn = 0.2; s.phaseClock = 6; // Spawn freischalten
  var before = s.seats.filter(Boolean).length;
  // ein paar Ticks, bis ein Gast spawnen kann
  for (var i = 0; i < 30; i++) core.tick(s, 0.05);
  var found = null;
  for (var j = 0; j < s.seats.length; j++) if (s.seats[j]) { found = s.seats[j]; break; }
  assert(found !== null, 'a guest spawned');
  if (found) {
    // Er muss durch thinking → waiting kommen (oder ist schon da)
    for (var k = 0; k < 100 && found.stage !== 'waiting'; k++) core.tick(s, 0.05);
    assert(['waiting', 'eating', 'leaving'].indexOf(found.stage) !== -1, 'guest reached waiting+ (stage ' + found.stage + ')');
  }
})();

// 5. Brühe in die Schüssel
(function () {
  var s = makeGame(11);
  assert(core.pourBroth(s, 'tonkatsu') === true, 'pour tonkatsu');
  eq(s.bowl.broth, 'tonkatsu', 'bowl has tonkatsu');
  assert(core.pourBroth(s, 'shoyu') === false, 'second broth refused');
  eq(s.bowl.broth, 'tonkatsu', 'still tonkatsu');
  assert(core.discardBowl(s) === true, 'discard works');
  eq(s.bowl.broth, null, 'bowl empty after discard');
})();

// 6. Beilagen brauchen Vorrat
(function () {
  var s = makeGame(12);
  eq(s.stock.ei, 2, 'starts with 2 Ei');
  assert(core.pourBroth(s, 'tonkatsu'), 'pour first');
  assert(core.addTopping(s, 'ei') === true, 'add Ei');
  eq(s.stock.ei, 1, 'stock decremented');
  eq(s.bowl.toppings.length, 1, 'bowl has 1 topping');
  core.discardBowl(s);
  assert(core.addTopping(s, 'chashu') === false, 'locked topping refused (night 1)');
})();

// 7. Vollständiger servierbarer Gast: richtig → payment
(function () {
  var s = makeGame(13);
  placeGuest(s, 'tonkatsu', ['ei']);
  var before = s.credits;
  buildBowl(s, 'tonkatsu', ['ei']);
  assert(core.serveBowl(s) === true, 'serve bowl');
  eq(s.inTransit.length, 1, 'bowl in transit');
  eq(s.bowl.broth, null, 'bowl reset after serve');
  settle(s, 55); // Bowl ankommen (1.6s) + Gast isst gerade
  eq(s.nightServed, 1, 'nightServed incremented');
  assert(s.seats[0].stage === 'eating', 'guest is eating (stage ' + (s.seats[0] ? s.seats[0].stage : 'gone') + ')');
  settle(s, 360);
  assert(s.credits > before, 'credits increased after payment');
  assert(!s.seats[0] || s.seats[0].stage === 'leaving', 'guest left or is leaving');
})();

// 8. Falsches Gericht (deterministisch) → Reputation verliert, combo reset
(function () {
  // Kritiker (forgiving 0.05), bestellt shoyu(∅), bekommt tonkatsu+ei → doWrong
  var s = makeGame(1000);
  placeGuest(s, 'shoyu', [], 'kritiker');
  var repBefore = s.reputation;
  buildBowl(s, 'tonkatsu', ['ei']);
  core.serveBowl(s);
  settle(s, 60); // Bowl ankommen (0.8s) + kurz danach
  var g8 = s.seats[0];
  assert(g8 && g8.angry === true, 'guest angry on wrong soup (stage ' + (g8 ? g8.stage : 'gone') + ')');
  assert(s.reputation < repBefore, 'reputation dropped on wrong soup');
  eq(s.nightLost, 1, 'nightLost incremented');
  eq(s.combo, 0, 'combo reset');
  eq(s.stats.wrongServes, 1, 'wrongServes counted');
})();

// 9. Fast richtig → Zufalls-Verzeihung (accidental) funktioniert
(function () {
  // Schwätzer (forgiving 0.55) + gleiche Brühe → hohe Chance auf accidental
  var servedAcc = 0, servedWrong = 0;
  for (var seed = 0; seed < 40; seed++) {
    var s = makeGame(2000 + seed);
    placeGuest(s, 'tonkatsu', ['ei'], 'schwatzer');
    // Richtige Brühe, aber falsche Beilage (nori statt ei)
    buildBowl(s, 'tonkatsu', ['nori']);
    core.serveBowl(s);
    settle(s, 75);
    servedAcc += s.stats.accidental;
    servedWrong += s.stats.wrongServes;
  }
  assert(servedAcc > 0, 'at least one accidental forgiveness happened (' + servedAcc + ')');
  assert(servedAcc + servedWrong === 40, 'all 40 resolved (' + servedAcc + ' acc, ' + servedWrong + ' wrong)');
})();

// 10. Combo wächst bei korrekten Servieren
(function () {
  var s = makeGame(15);
  s.stock = { ei: 9, nori: 9, mais: 0, chashu: 0, zwiebel: 0 };
  placeGuest(s, 'tonkatsu', ['ei']);
  buildBowl(s, 'tonkatsu', ['ei']);
  core.serveBowl(s);
  settle(s, 120);
  eq(s.combo, 1, 'combo = 1 after first correct');
  s.seats[0] = null;
  placeGuest(s, 'tonkatsu', ['nori']);
  buildBowl(s, 'tonkatsu', ['nori']);
  core.serveBowl(s);
  settle(s, 120);
  eq(s.combo, 2, 'combo = 2 after second correct');
})();

// 11. Fritteuse: Vorrat auffüllen + Cooldown
(function () {
  var s = makeGame(16);
  var totalBefore = s.stock.ei + s.stock.nori;
  assert(core.fryBatch(s) === true, 'fry batch ok');
  var totalAfter = s.stock.ei + s.stock.nori;
  assert(totalAfter > totalBefore, 'stock increased');
  assert(s.fryCooldown > 0, 'cooldown set');
  assert(core.fryBatch(s) === false, 'second fry in cooldown refused');
})();

// 12. Gast, der zu lange wartet, geht (−Reputation)
(function () {
  var s = makeGame(17);
  placeGuest(s, 'tonkatsu', []);
  s.seats[0].patience = 0.01;
  var repBefore = s.reputation;
  core.tick(s, 0.05);
  assert(s.reputation < repBefore, 'patience ran out → rep drop');
  eq(s.nightLost, 1, 'walkout counted');
  eq(s.stats.walkouts, 1, 'walkouts counted');
})();

// 13. Begeisterung: schneller Service → enthusiastic möglich
(function () {
  var s = makeGame(18);
  placeGuest(s, 'tonkatsu', [], 'heisshunger');
  s.seats[0].patience = s.seats[0].maxPatience;
  buildBowl(s, 'tonkatsu', []);
  core.serveBowl(s);
  settle(s, 120);
  assert(['enthusiastic', 'positive'].indexOf(s.seats[0].reaction) !== -1,
    'fast service on happy guest → enthusiastic or positive (got ' + s.seats[0].reaction + ')');
})();

// 14. Upgrades
(function () {
  var s = makeGame(19);
  s.credits = 500;
  var cost0 = core.upgradeCost(s, 'fryer');
  assert(core.buyUpgrade(s, 'fryer') === true, 'buy fryer');
  eq(core.upgradeLevel(s, 'fryer'), 1, 'fryer lvl 1');
  assert(core.upgradeCost(s, 'fryer') > cost0, 'cost increases');
  var seatsBefore = core.seatCount(s);
  assert(core.buyUpgrade(s, 'seats') === true, 'buy seat');
  eq(core.seatCount(s), seatsBefore + 1, 'seat count increased');
})();

// 15. Einkauf (buyTopping)
(function () {
  var s = makeGame(28);
  s.credits = 100;
  var before = s.stock.ei;
  var creditsBefore = s.credits;
  assert(core.buyTopping(s, 'ei') === true, 'buy Ei');
  eq(s.stock.ei, before + 1, 'stock +1 after buy');
  assert(s.credits < creditsBefore, 'credits reduced');
  eq(core.CONFIG.TOPPING_STOCK_MAX, 4, 'max stock 4');
  s.stock.zwiebel = 4;
  assert(core.buyTopping(s, 'zwiebel') === false, 'buy refused when full');
  s.stock.mais = 0;
  assert(core.buyTopping(s, 'mais') === false, 'buy refused when locked (night 1)');
  s.credits = 1;
  assert(core.buyTopping(s, 'ei') === false, 'buy refused when poor');
})();

// 16. Preisgestaltung (setPriceLevel) + Preis-Multiplikator
(function () {
  var s = makeGame(29);
  assert(core.setPriceLevel(s, 'exklusiv') === true, 'set price level');
  eq(s.priceLevel, 'exklusiv', 'price level updated');
  assert(core.setPriceLevel(s, 'invalid') === false, 'invalid refused');
  var o = { broth: 'tonkatsu', toppings: [] };
  eq(core.priceOfOrder(o, 1), core.brothOf('tonkatsu').price, 'price mult 1');
  eq(core.priceOfOrder(o, 1.25), Math.round(core.brothOf('tonkatsu').price * 1.25), 'price mult 1.25');
})();

// 17. Sieg: Credits + Reputation
(function () {
  var s = makeGame(20);
  s.credits = core.CONFIG.WIN_CREDITS + 50;
  s.reputation = core.CONFIG.WIN_REP + 5;
  s.phaseClock = core.CONFIG.NIGHT_DURATION + 0.01;
  core.tick(s, 0.05);
  assert(s.gameOver === true, 'game over on win');
  assert(s.won === true, 'won');
})();

// 18. Niederlage: Bankrott
(function () {
  var s = makeGame(21);
  s.credits = 1;
  s.phaseClock = core.CONFIG.NIGHT_DURATION + 0.01;
  core.tick(s, 0.05);
  assert(s.gameOver === true, 'game over on bankruptcy');
  assert(s.won === false, 'lost');
  eq(s.ending, 'bankruptcy', 'bankruptcy ending');
})();

// 19. Niederlage: Reputation 0
(function () {
  var s = makeGame(1001); // doWrong seed
  s.reputation = 3;
  placeGuest(s, 'shoyu', [], 'kritiker');
  buildBowl(s, 'tonkatsu', ['ei']);
  core.serveBowl(s);
  settle(s, 120);
  assert(s.reputation <= 0, 'reputation at 0 (got ' + s.reputation + ')');
  assert(s.gameOver === true, 'game over on rep 0');
  eq(s.ending, 'reputation', 'reputation ending');
})();

// 20. Menü-Freischaltung nachts
(function () {
  var s = core.createGame({ seed: 23 });
  eq(core.maxToppings(1), 1, 'night 1: max 1 topping');
  eq(core.maxToppings(5), 2, 'night 5: max 2 toppings');
  eq(core.maxToppings(10), 3, 'night 10: max 3 toppings');
  eq(core.unlockedBroths(s).length, 2, 'night 1: 2 broths');
  s.night = 6;
  eq(core.unlockedBroths(s).length, 4, 'night 6: 4 broths');
})();

// 21. Event-Würfelung: erste Nacht immer ruhig
(function () {
  for (var seed = 1; seed <= 8; seed++) {
    var s = core.createGame({ seed: seed });
    for (var i = 0; i < 300; i++) core.tick(s, 0.05);
    eq(s.event.type, 'calm', 'night 1 always calm (seed ' + seed + ')');
  }
})();

// 22. In-Transit-Limit
(function () {
  var s = makeGame(25);
  s.stock = { ei: 9, nori: 9, mais: 0, chashu: 0, zwiebel: 0 };
  placeGuest(s, 'tonkatsu', []);
  s.inTransit = [
    { bowl: { broth: 'tonkatsu', toppings: [] }, seat: 0, t: 0.9 },
    { bowl: { broth: 'tonkatsu', toppings: [] }, seat: 0, t: 0.95 }
  ];
  buildBowl(s, 'tonkatsu', []);
  assert(core.serveBowl(s) === false, 'transit limit respected');
})();

// 23. 20-Nächte-Kampagne endet (seam)
(function () {
  var s = core.createGame({ seed: 26 });
  s.night = core.CONFIG.CAMPAIGN_NIGHTS;
  s.credits = 100;
  s.reputation = 20;
  s.phase = 'night'; s.phaseClock = core.CONFIG.NIGHT_DURATION + 0.01; s.event = core.EVENTS[0];
  core.tick(s, 0.05);
  assert(s.gameOver === true, 'game over at night 20');
  eq(s.ending, 'seam', 'seam ending');
})();

// 24. Preise sind konsistent
(function () {
  var o = { broth: 'spicy', toppings: ['chashu'] };
  var p = core.priceOfOrder(o);
  eq(p, core.brothOf('spicy').price + core.toppingOf('chashu').price, 'order price = broth + toppings');
})();

// 25. Chronist-Report (chronicle)
(function () {
  var s = makeGame(1002);
  placeGuest(s, 'shoyu', [], 'kritiker');
  buildBowl(s, 'tonkatsu', ['ei']);
  core.serveBowl(s);
  settle(s, 120);
  var ch = core.chronicle(s);
  assert(ch.hardestLine !== null, 'hardest line recorded');
  assert(ch.worstMistake.indexOf('falsche Suppe') !== -1, 'worst mistake = wrong soup (' + ch.worstMistake + ')');
  eq(ch.worstMistake, '1× falsche Suppe serviert', 'worst mistake text');
})();

// 26. Raid / Gruppen-Event spawnen Gäste
(function () {
  var s = makeGame(1400);
  s.phase = 'night'; s.phaseClock = 0; s.event = core.EVENTS.filter(function (e) { return e.type === 'raid'; })[0];
  s._raid = { at: 0.1, size: 3, group: core.GROUPS[0], done: false };
  settle(s, 90);
  var count = s.seats.filter(Boolean).length;
  assert(count >= 1, 'raid spawned guests (' + count + ')');
  assert(s.stats.lines.length >= 1, 'raid line logged');
})();

// 27. Langspiel-Bestandsicherheit: 20 Nächte mit Bot, kein Crash
(function () {
  var s = core.createGame({ seed: 27 });
  var steps = 0;
  while (!s.gameOver && steps < 30000) {
    core.tick(s, 0.05);
    if (s.phase === 'night') {
      if (!s.bowl.broth) core.pourBroth(s, 'tonkatsu');
      if (s.stock.ei > 0 && s.bowl.toppings.length === 0) core.addTopping(s, 'ei');
      if (s.bowl.broth && s.inTransit.length === 0) core.serveBowl(s);
      if (s.fryCooldown <= 0 && (s.stock.ei < 2 || s.stock.nori < 2)) core.fryBatch(s);
    }
    steps++;
  }
  assert(s.totalServed > 0 || s.totalLost > 0, 'game actually ran (served/lost > 0)');
  assert(steps < 30000 || s.gameOver, 'terminated within guard');
})();


// 28. Chef hat Gefühle: Fehlschlag → 😬, High → 😄
(function () {
  var s = makeGame(1000);
  placeGuest(s, 'shoyu', [], 'kritiker');
  buildBowl(s, 'tonkatsu', ['ei']);
  core.serveBowl(s);
  settle(s, 60);
  assert(s.chefMood && s.chefMood.emoji === '😬', 'chef is 😬 after wrong soup (got ' + (s.chefMood ? s.chefMood.emoji : 'null') + ')');
})();

// 29. startNextNight: Bürozeit lässt durch
(function () {
  var s = core.createGame({ seed: 33 });
  eq(s.phase, 'between', 'starts in between');
  assert(core.startNextNight(s) === true, 'startNextNight accepted');
  core.tick(s, 0.05);
  eq(s.phase, 'night', 'night started after startNextNight');
  var s2 = core.createGame({ seed: 34 });
  s2.phase = 'night'; s2.phaseClock = 10; s2.event = core.EVENTS[0];
  assert(core.startNextNight(s2) === false, 'startNextNight refused during night');
})();

// 30. Auslöffeln: Heißhunger (cleanBowl 0.8) wird über viele Runs mindestens einmal clean
(function () {
  var cleanRuns = 0;
  for (var seed = 0; seed < 60; seed++) {
    var s = makeGame(3000 + seed);
    placeGuest(s, 'tonkatsu', [], 'heisshunger');
    buildBowl(s, 'tonkatsu', []);
    core.serveBowl(s);
    settle(s, 240); // ankommen (0.8s) + essen (0.75x) + ggf. Schlürfen
    var g0 = s.seats[0];
    if ((g0 && g0.stage === 'sipping') || s.stats.cleanBowls > 0) cleanRuns++;
  }
  assert(cleanRuns > 5, 'heisshunger sips often (cleanRuns=' + cleanRuns + ')');
})();

// 31. Leere Schüssel gibt Bonus
(function () {
  var s = makeGame(3100);
  placeGuest(s, 'tonkatsu', [], 'heisshunger');
  buildBowl(s, 'tonkatsu', []);
  core.serveBowl(s);
  settle(s, 55); // noch beim Essen (travel 1.6s + ~1s)
  var g = s.seats[0];
  assert(g && g.stage === 'eating', 'guest eating (stage ' + (g ? g.stage : 'gone') + ')');
  g.finisher = 'clean';              // Testzugriff: Schüssel wird sauber
  g.stage = 'sipping'; g.sipTimer = 0.01;
  var before = s.credits;
  core.tick(s, 0.05);
  eq(s.credits, before + core.CONFIG.CLEAN_BONUS, 'clean bowl pays exactly CLEAN_BONUS');
  eq(s.stats.cleanBowls, 1, 'cleanBowls counter incremented');
})();

// 32. Bleiber: Stammgast mit enthusiastischer Reaktion bleibt häufig
(function () {
  var lingers = 0;
  for (var seed = 0; seed < 80; seed++) {
    var s = makeGame(3500 + seed);
    var g = placeGuest(s, 'tonkatsu', [], 'regelmassige');
    g.isRegular = true;
    buildBowl(s, 'tonkatsu', []);
    core.serveBowl(s);
    settle(s, 270); // ankommen + essen fertig (1.0x) + ggf. Schlürfen
    if (s.seats[0] && s.seats[0].stage === 'lingering') lingers++;
  }
  assert(lingers > 10, 'regulars linger often (lingers=' + lingers + ')');
})();

// 33. Stimmung steckt an: enthusiastische Mahlzeit → Mood-Bonus auf Wartende
(function () {
  var contaminated = 0;
  for (var seed = 0; seed < 60; seed++) {
    var s = makeGame(3900 + seed);
    var g1 = placeGuest(s, 'tonkatsu', [], 'heisshunger'); // Seat 0
    g1.patience = g1.maxPatience;
    // zweiter Gast wartet nebenan (Seat 1)
    var g2 = placeGuest(s, 'tonkatsu', [], 'timide');
    g1.seat = 0; s.seats[0] = g1; g2.seat = 1; s.seats[1] = g2;
    buildBowl(s, 'tonkatsu', []);
    core.serveBowl(s);
    settle(s, 240); // Mahlzeit 1 wird fertig → Contagion
    if (s.seats[1] && s.seats[1].moodBonus > 0) contaminated++;
  }
  assert(contaminated > 3, 'mood contagion happens (contaminated=' + contaminated + ')');
})();

// 34. Gäste-Chat: mit 2+ Gästen entsteht irgendwann Smalltalk
(function () {
  var s = makeGame(4100);
  var g1 = placeGuest(s, 'tonkatsu', [], 'schwatzer'); g1.seat = 0; s.seats[0] = g1;
  var g2 = placeGuest(s, 'shoyu', [], 'philosoph'); g2.seat = 1; s.seats[1] = g2;
  var sawChat = false;
  for (var i = 0; i < 400 && !sawChat; i++) {
    core.tick(s, 0.05);
    for (var j = 0; j < s.seats.length; j++) if (s.seats[j] && s.seats[j].chat) { sawChat = true; break; }
  }
  assert(sawChat, 'guests chat when 2+ are present');
})();

// 35. Umbenennung: Chronist-Report bleibt intakt
(function () {
  var s = makeGame(1002);
  placeGuest(s, 'shoyu', [], 'kritiker');
  buildBowl(s, 'tonkatsu', ['ei']);
  core.serveBowl(s);
  settle(s, 120);
  var ch = core.chronicle(s);
  assert(ch.hardestLine !== null, 'hardest line recorded');
  eq(ch.worstMistake, '1× falsche Suppe serviert', 'worst mistake text');
  eq(typeof ch.cleanBowls, 'number', 'chronicle has cleanBowls');
  eq(typeof ch.lingers, 'number', 'chronicle has lingers');
})();


// 36. Stayer: dismissGuest wegschickt einen Bleiber, −Reputation
(function () {
  var s = makeGame(5000);
  var g = placeGuest(s, 'tonkatsu', [], 'regelmassige');
  g.stayer = true; g.reorders = 1;
  var repBefore = s.reputation;
  assert(core.dismissGuest(s, 0) === true, 'dismiss accepted for stayer');
  eq(s.seats[0], null, 'seat freed');
  assert(s.reputation < repBefore, 'reputation dropped on dismiss');
  // Nicht-Stayer darf nicht weg
  var g2 = placeGuest(s, 'shoyu', [], 'timide');
  g2.stayer = false;
  assert(core.dismissGuest(s, 0) === false, 'dismiss refused for non-stayer');
})();

// 37. Stayer-Reorder: Stammis bestellen nach dem Essen noch mal
(function () {
  var reorders = 0;
  for (var seed = 0; seed < 60; seed++) {
    var s = makeGame(5200 + seed);
    var g = placeGuest(s, 'tonkatsu', [], 'regelmassige');
    g.isRegular = true;
    s.regularFavorites['regelmassige'] = { broth: 'tonkatsu', toppings: [] };
    buildBowl(s, 'tonkatsu', []);
    core.serveBowl(s);
    settle(s, 200); // ankommen + essen + ggf. Re-Order
    if (s.seats[0] && s.seats[0].stayer && s.seats[0].reorders >= 1) reorders++;
  }
  assert(reorders > 5, 'regulars reorder sometimes (reorders=' + reorders + ')');
})();

// 38. Stayer-Nachtbonus: Stayer am Nachtende gibt +Reputation
(function () {
  var s = makeGame(5400);
  var g = placeGuest(s, 'tonkatsu', [], 'regelmassige');
  g.stayer = true; g.reorders = 1;
  var repBefore = s.reputation;
  s.phaseClock = core.CONFIG.NIGHT_DURATION + 0.01;
  core.tick(s, 0.05);
  assert(s.reputation > repBefore, 'stayer night bonus applied (rep ' + repBefore + ' -> ' + s.reputation + ')');
})();

// 39. v2.9.2: Partytime-Trigger im Kern (deterministisch, seedbar)
(function () {
  var s = makeGame(6001);
  assert(s.party && typeof s.party.active === 'boolean', 'party state exists in core');
  // 4 wärtende Gäste platzieren
  s.seats[0] = placeGuest(s, 'tonkatsu', [], 'heisshunger');
  s.seats[1] = placeGuest(s, 'shoyu', [], 'philosoph');
  s.seats[2] = placeGuest(s, 'miso', [], 'tourist');
  s.seats[3] = placeGuest(s, 'spicy', [], 'schnelle');
  var sawParty = false;
  for (var i = 0; i < 2000 && !sawParty; i++) { core.tick(s, 0.05); if (s.party.active) sawParty = true; }
  assert(sawParty, 'party triggers with ' + core.CONFIG.PARTY_GUESTS + '+ guests (seed 6001)');
})();

// 40. v2.9.2: Partytime läuft aus
(function () {
  var s = makeGame(6002);
  s.party.active = true; s.party.t = 0.1;
  for (var i = 0; i < 100 && s.party.active; i++) core.tick(s, 0.05);
  assert(!s.party.active, 'party expires after its duration');
})();

// 41. v2.9.2: Party-Sprüche-Pools existieren und sind voll
(function () {
  assert(Array.isArray(core.KAWAII.party) && core.KAWAII.party.length >= 8, 'KAWAII.party pool ≥ 8 lines');
  assert(Array.isArray(core.KAWAII.partyChef) && core.KAWAII.partyChef.length >= 2, 'KAWAII.partyChef pool ≥ 2 lines');
  eq(core.CONFIG.PARTY_GUESTS, 4, 'PARTY_GUESTS config is 4');
  eq(core.CONFIG.PARTY_DUR, 6, 'PARTY_DUR config is 6');
})();

// 42. v2.9.2: DOM-Vertrag — jede $('id') in app.js MUSS ein id="..." im index.html haben
// (v2.4: #btn-shop-next fehlte → Black Screen. v2.9: #btn-menu fehlte → totes Münü.)
(function () {
  var fs = require('fs'), path = require('path');
  var root = path.join(__dirname);
  var app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var re = /\$\('([a-zA-Z0-9-]+)'\)/g, m, missing = [];
  while ((m = re.exec(app))) {
    if (html.indexOf('id="' + m[1] + '"') === -1) missing.push(m[1]);
  }
  assert(missing.length === 0, 'DOM contract: no missing ids ' + (missing.length ? '(' + missing.join(', ') + ')' : ''));
})();

// 43. v2.9.2.2: Dialog — wartender Gast triggert (deterministisch) und erhält
// danach nie wieder einen (dialogDone)
(function () {
  var s = makeGame(7101);
  var g = placeGuest(s, 'tonkatsu', ['ei']);
  g.patience = 9999; g.maxPatience = 9999;
  for (var i = 0; i < 400 && !s.dialog; i++) core.tick(s, 0.05);
  assert(!!s.dialog, 'dialog triggers for a waiting guest (seed 7101, 20 s)');
  if (s.dialog) {
    eq(s.dialog.seat, 0, 'dialog seat is the waiting seat');
    assert(s.dialog.t > 0 && s.dialog.t <= core.CONFIG.DIALOG_TIMEOUT, 'dialog has timeout');
  }
  core.answerDialog(s, 0, 1);
  for (var j = 0; j < 400; j++) core.tick(s, 0.05);
  assert(!s.dialog, 'same guest never gets a second dialog (dialogDone)');
})();

// 44. v2.9.2.2: Dialog antworten — good/bad/neutral wirken (moodBonus, Spruch, Chef-Mood)
(function () {
  var s = makeGame(7102);
  var g = placeGuest(s, 'tonkatsu', ['ei']);
  s.dialog = { seat: 0, persona: g.persona.id, t: 12 };
  assert(core.answerDialog(s, 0, 0), 'answerDialog returns true for the active dialog');
  eq(s.dialog, null, 'dialog cleared after answer');
  assert(g.line && g.line.length > 0, 'guest reacts with a line (good)');
  eq(g.moodBonus, 8, 'good answer +8 moodBonus');
  var s2 = makeGame(7103);
  var g2 = placeGuest(s2, 'tonkatsu', ['ei']);
  s2.dialog = { seat: 0, persona: g2.persona.id, t: 12 };
  core.answerDialog(s2, 0, 2);
  eq(g2.moodBonus, -8, 'bad answer -8 moodBonus');
  assert(s2.chefMood && s2.chefMood.emoji === '😬', 'bad answer sets chef mood 😬');
})();

// 45. v2.9.2.2: Dialog-Timeout — auto-neutrale Antwort (so läuft es ohne UI — jetzt mit UI)
(function () {
  var s = makeGame(7104);
  var g = placeGuest(s, 'tonkatsu', ['ei']);
  s.dialog = { seat: 0, persona: g.persona.id, t: 0.2 };
  for (var i = 0; i < 10 && s.dialog; i++) core.tick(s, 0.05);
  eq(s.dialog, null, 'dialog auto-answers after timeout');
  eq(g.moodBonus, 0, 'timeout answer is neutral (no moodBonus)');
})();

// 46. v2.9.2.3: Abzeichen — Struktur, Idempotenz, Log
(function () {
  var s = makeGame(7201);
  assert(s.achievements && typeof s.achievements === 'object', 'achievements object exists');
  eq(Object.keys(s.achievements).length, 0, 'starts with no achievements');
  eq(core.ACHIEVEMENTS_ORDER.length, 5, 'five achievements');
  core.ACHIEVEMENTS_ORDER.forEach(function (id) {
    var a = core.ACHIEVEMENTS[id];
    assert(a && a.name && a.emoji && a.desc, 'achievement ' + id + ' has name/emoji/desc');
  });
  var count = function () { return s.log.filter(function (l) { return l.indexOf('Abzeichen') !== -1; }).length; };
  var n0 = count();
  assert(core.earnAchievement(s, 'katze'), 'earn returns true the first time');
  eq(s.achievements.katze, 1, 'achievement records the night');
  assert(!core.earnAchievement(s, 'katze'), 'earn returns false the second time (idempotent)');
  assert(!core.earnAchievement(s, 'nicht-da'), 'unknown id returns false');
  eq(count() - n0, 1, 'only one log line despite double-earn');
})();

// 47. v2.9.2.3: Abzeichen Party-Vater — 3. Partytime in der Kampagne
(function () {
  var s = makeGame(6001);
  s.seats[0] = placeGuest(s, 'tonkatsu', [], 'heisshunger');
  s.seats[1] = placeGuest(s, 'shoyu', [], 'philosoph');
  s.seats[2] = placeGuest(s, 'miso', [], 'tourist');
  s.seats[3] = placeGuest(s, 'spicy', [], 'schnelle');
  s.partyCount = 2; // zwei Partys "in der Vergangenheit", jetzt die dritte
  for (var i = 0; i < 4000 && !s.achievements.party; i++) core.tick(s, 0.05);
  assert(!!s.achievements.party, 'party achievement on the 3rd party (seed 6001)');
})();

// 48. v2.9.2.3: Abzeichen Zen-Meister — 10. leere Schüssel in einer Nacht
(function () {
  var s = makeGame(7203);
  var g = placeGuest(s, 'tonkatsu', ['ei']);
  g.patience = 9999; g.maxPatience = 9999;
  g.finisher = 'clean'; g.stage = 'sipping'; g.sipTimer = 0.1; // Zen-jiru direkt anstoßen
  s.nightClean = 9;
  for (var i = 0; i < 100 && !s.achievements.zen; i++) core.tick(s, 0.05);
  assert(!!s.achievements.zen, 'zen achievement after the 10th clean bowl');
  eq(s.nightClean, 10, 'nightClean counted to 10');
})();

// 49. v2.9.2.3: Abzeichen Makellose Nacht — via endNight; ein Weggänger ruiniert sie
(function () {
  var s = makeGame(7204);
  s.nightServed = 3; s.nightLost = 0;
  s.phaseClock = core.CONFIG.NIGHT_DURATION + 0.01;
  core.tick(s, 0.05);
  assert(!!s.achievements.makellos, 'flawless night earns the badge');
  eq(s.nightClean, 0, 'nightClean resets for the next night');
  var s2 = makeGame(7205);
  s2.nightServed = 3; s2.nightLost = 1;
  s2.phaseClock = core.CONFIG.NIGHT_DURATION + 0.01;
  core.tick(s2, 0.05);
  assert(!s2.achievements.makellos, 'a lost guest ruins the flawless night');
})();

// 50. v2.9.2.4: Dialog ist selten — Mindestabstand (DIALOG_MIN_GAP)
(function () {
  var s = makeGame(7301);
  var g = placeGuest(s, 'tonkatsu', ['ei']);
  g.patience = 9999; g.maxPatience = 9999;
  s.dialog = { seat: 0, persona: g.persona.id, t: 0.1 };
  for (var i = 0; i < 10 && s.dialog; i++) core.tick(s, 0.05);
  eq(s.dialog, null, 'dialog ends (timeout)');
  assert(s.dialogGap > 0, 'min gap starts after a dialog');
  for (var j = 0; j < 400 && !s.dialog; j++) core.tick(s, 0.05); // 20 s < Gap
  assert(!s.dialog, 'no new dialog while the gap runs');
  for (var k = 0; k < 20000 && !s.dialog; k++) core.tick(s, 0.05);
  assert(!!s.dialog, 'dialog can trigger again after the gap (seed 7301)');
})();

// 51. v2.9.2.4: Dialog-Texte — jede Persona: Frage + 3 verschiedene Antworten + Reaktionen
(function () {
  var d = core.KAWAII.dialog;
  var ids = Object.keys(d);
  eq(ids.length, 7, 'seven dialog personas');
  ids.forEach(function (id) {
    assert(core.personaOf(id), 'dialog persona ' + id + ' exists in PERSONAS');
    var e = d[id];
    assert(e.question && e.question.length > 5, id + ': question not empty');
    eq(e.options.length, 3, id + ': exactly three options');
    eq(e.options.map(function (o) { return o.q; }).sort().join(','), 'bad,good,neutral',
      id + ': one good, one neutral, one bad option');
    e.options.forEach(function (o, i) {
      assert(o.text && o.text.length > 5, id + ': option ' + i + ' not empty');
    });
    ['good', 'neutral', 'bad'].forEach(function (q) {
      assert(e.react[q] && e.react[q].length > 5, id + ': react[' + q + '] not empty');
    });
  });
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
