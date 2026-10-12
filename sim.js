/* =============================================================================
   NUDELBAR v2.9.2 — Balance-Simulator
   Ein Bot spielt komplette Kampagnen über viele Seeds und berichtet Metriken:
   Sieg-Rate, Ø Credits/Reputation am Ende, Ø Gäste bedient/verloren,
   längste Combo, Überraschungen (accidental), typische Enden.

   Node:  node sim.js
   ============================================================================= */
'use strict';
var core = require('./js/core.js');

var SEEDS = 25;
var DT = 0.05;

function runBot(seed) {
  var s = core.createGame({ seed: seed, barName: 'SIMBAR' });
  var guard = 0;
  while (!s.gameOver && guard++ < 400000) {
    core.tick(s, DT);
    if (s.phase === 'night') {
      // 1) Vorrat pflegen (Fritteuse)
      if (s.fryCooldown <= 0) {
        var low = 0;
        for (var t in s.stock) low += s.stock[t];
        if (low < 5) core.fryBatch(s);
      }
      // 2) Feste Schüssel? Dann auf den Wartenden schauen.
      if (s.bowl.broth) {
        var ws = core.firstWaitingSeat(s);
        if (ws !== -1 && s.inTransit.length === 0) {
          var c = s.seats[ws];
          var need = c.order;
          var ok = s.bowl.broth === need.broth;
          if (ok) {
            var have = s.bowl.toppings.slice().sort();
            var want = need.toppings.slice().sort();
            ok = have.length === want.length;
            if (ok) for (var i = 0; i < have.length; i++) if (have[i] !== want[i]) { ok = false; break; }
          }
          if (ok) { core.serveBowl(s); }
          else {
            if (s.bowl.broth === need.broth && s.bowl.toppings.length < core.maxToppings(s.night)) {
              var missing = need.toppings.slice();
              for (var h = 0; h < s.bowl.toppings.length; h++) missing.splice(missing.indexOf(s.bowl.toppings[h]), 1);
              if (missing.length && s.stock[missing[0]] > 0) {
                core.addTopping(s, missing[0]);
                if (s.bowl.toppings.length === need.toppings.length) core.serveBowl(s);
              } else core.discardBowl(s);
            } else {
              core.discardBowl(s);
            }
          }
        }
      } else {
        // 3) Neue Schüssel für den nächsten Wartenden
        var ws2 = core.firstWaitingSeat(s);
        if (ws2 !== -1 && s.inTransit.length < 2) {
          var order = s.seats[ws2].order;
          core.pourBroth(s, order.broth);
          for (var k = 0; k < order.toppings.length; k++) {
            if (s.stock[order.toppings[k]] > 0) core.addTopping(s, order.toppings[k]);
            else break;
          }
          if (s.bowl.toppings.length === order.toppings.length) core.serveBowl(s);
          if (s.bowl.toppings.length < order.toppings.length) core.discardBowl(s);
        }
      }
      // 4) Upgrades (einfache Heuristik)
      if (s.credits > 400 && core.upgradeLevel(s, 'fryer') < 1 && core.upgradeCost(s, 'fryer') < s.credits - 100) core.buyUpgrade(s, 'fryer');
      if (s.credits > 600 && core.upgradeLevel(s, 'seats') < 1 && core.upgradeCost(s, 'seats') < s.credits - 150) core.buyUpgrade(s, 'seats');
      if (s.credits > 900 && core.upgradeLevel(s, 'sign') < 1 && core.upgradeCost(s, 'sign') < s.credits - 150) core.buyUpgrade(s, 'sign');
    } else if (s.phase === 'between') {
      // 5) Bürozeit: Vorrat auffüllen + Upgrades
      core.TOPPINGS.forEach(function (tp) {
        if (tp.unlock <= s.night && s.stock[tp.id] < 2) core.buyTopping(s, tp.id);
      });
      if (s.credits > 1100 && core.upgradeLevel(s, 'decor') < 1 && core.upgradeCost(s, 'decor') < s.credits - 200) core.buyUpgrade(s, 'decor');
    }
  }
  return s;
}

var results = [];
for (var i = 0; i < SEEDS; i++) results.push(runBot(1000 + i));

function avg(arr) { return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length; }
function med(arr) { var a = arr.slice().sort(function (x, y) { return x - y; }); return a[Math.floor(a.length / 2)]; }

var wins = results.filter(function (s) { return s.won; });
var endings = {};
results.forEach(function (s) { endings[s.ending] = (endings[s.ending] || 0) + 1; });

console.log('NUDELBAR v2.9.2 — Balance-Sim (Bot, ' + SEEDS + ' Seeds)\n');
console.log('Sieg-Rate:      ' + wins.length + '/' + SEEDS + ' (' + Math.round(wins.length / SEEDS * 100) + '%)');
console.log('Enden:          ' + JSON.stringify(endings));
console.log('Ø Nights:       ' + avg(results.map(function (s) { return s.night; })).toFixed(1) + ' / ' + core.CONFIG.CAMPAIGN_NIGHTS);
console.log('Ø Credits Ende: ' + avg(results.map(function (s) { return Math.round(s.credits); })).toFixed(0));
console.log('Ø Rep Ende:     ' + avg(results.map(function (s) { return Math.round(s.reputation); })).toFixed(0));
console.log('Ø Bedient:      ' + avg(results.map(function (s) { return s.totalServed; })).toFixed(1));
console.log('Ø Verloren:     ' + avg(results.map(function (s) { return s.totalLost; })).toFixed(1));
console.log('Ø Überraschungen (accidental): ' + avg(results.map(function (s) { return s.stats.accidental; })).toFixed(1));
console.log('Ø Leere Schüsseln:  ' + avg(results.map(function (s) { return s.stats.cleanBowls; })).toFixed(1));
console.log('Ø Bleiber:           ' + avg(results.map(function (s) { return s.stats.lingers; })).toFixed(1));
console.log('Ø Trinkgeld gesamt: ' + avg(results.map(function (s) { return s.stats.totalTips; })).toFixed(0));
console.log('Ø BestCombo:    ' + avg(results.map(function (s) { return s.bestCombo; })).toFixed(1));
console.log('Beste Combo:    ' + Math.max.apply(null, results.map(function (s) { return s.bestCombo; })));
console.log('\nDetail:');
results.forEach(function (s) {
  console.log('  seed ' + s.seed + ': ' + (s.won ? 'WON ' : 'lost ') + 'night ' + s.night +
    ' · ' + Math.round(s.credits) + ' € · ' + Math.round(s.reputation) + ' Rep · ' +
    s.totalServed + ' served / ' + s.totalLost + ' lost · ' + s.stats.accidental + ' acc · ' + s.stats.cleanBowls + ' clean · ' + s.stats.lingers + ' linger · ' +
    'best combo ' + s.bestCombo + ' · ' + s.ending);
});
