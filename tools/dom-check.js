#!/usr/bin/env node
/* =============================================================================
   NUDELBAR — DOM-Vertrag-Check (v2.9.2, Außenprüfung)
   -----------------------------------------------------------------------------
   Hintergrund: Zweimal in der Geschichte dieses Spiels ist ein UI-Element in
   app.js referenziert worden, das nie im index.html angelegt wurde (v2.4:
   #btn-shop-next → Black Screen. v2.9: #btn-menu → totes Menü-Feature).
   Der Kern-Test (tests.js) sieht das nicht, weil der Kern kein DOM kennt.

   Dieses Skript ist die Versicherung: Jede $('id')-Referenz in js/app.js
   MUSS ein passendes id="…" in index.html haben.

   Usage:  node tools/dom-check.js
   Exit:   0 = Vertrag hält, 1 = Elemente fehlen.
   ============================================================================= */
'use strict';
var fs = require('fs');
var path = require('path');
var root = path.join(__dirname, '..');
var app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

var refIds = [];
var re = /\$\('([a-zA-Z0-9-]+)'\)/g, m;
while ((m = re.exec(app))) refIds.push(m[1]);

var have = {};
var re2 = /id="([^"]+)"/g;
while ((m = re2.exec(html))) have[m[1]] = true;

var missing = refIds.filter(function (id) { return !have[id]; });

console.log('Referenzierte Element-IDs in app.js: ' + refIds.length);
console.log('Elemente mit id in index.html:      ' + Object.keys(have).length);
if (missing.length) {
  console.error('');
  console.error('✗ FEHLEN im index.html (Feature wäre tot): ' + missing.join(', '));
  process.exit(1);
}
console.log('');
console.log('DOM-Vertrag: OK — jede Referenz hat ein Element.');
