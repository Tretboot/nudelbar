/* =============================================================================
   NUDELBAR v2.9.2.2 — Frontend / Renderer / Input
   -----------------------------------------------------------------------------
   Canvas-2D-Rendering, DOM-Overlays (Start/Shop/Ende/Hilfe), Touch, Controller,
   Tooltips, SFX-Hooks. Keine DOM-Abhängigkeit im Kern — hier läuft nur Anzeige.
   ============================================================================= */
(function () {
  'use strict';
  var core = window.DAMPF && window.DAMPF.core;
  var audio = window.DAMPF && window.DAMPF.audio;
  if (!core) { console.error('DAMPF.core fehlt'); return; }

  /* ---- DOM ----------------------------------------------------------------- */
  var $ = function (id) { return document.getElementById(id); };
  var el = {
    start: $('start-screen'), help: $('help-screen'), shop: $('shop-screen'), end: $('end-screen'), game: $('game'),
    barName: $('bar-name'), seed: $('seed-input'), chefPick: $('chef-pick'), pricePick: $('price-pick'),
    btnStart: $('btn-start'), btnHelpClose: $('btn-help-close'), btnRestart: $('btn-restart'),
    btnShopNext: $('btn-shop-next'),
    nameLive: document.querySelector('.name-live'), tbName: $('tb-name'), eventName: $('event-name'),
    statNight: $('stat-night'), statClock: $('stat-clock'), statCredits: $('stat-credits'),
    statRepNum: $('stat-rep-num'), statRepFill: $('stat-rep-fill'), statGoal: $('stat-goal'),
    shopTitle: $('shop-title'), shopSummary: $('shop-summary'), shopStock: $('shop-stock'),
    shopUpgrades: $('shop-upgrades'), shopPrices: $('shop-prices'), shopCash: $('shop-cash'),
    endTitle: $('end-title'), endEnding: $('end-ending'),
    endStats: $('end-stats'), endChrono: $('end-chrono-body'), endGreta: $('end-greta'),
    canvas: $('stage'), combo: $('combo'), tooltip: $('tooltip'), touchpad: $('touchpad'), log: $('log'),
    btnMenu: $('btn-menu'), menu: $('menu-screen'), menuSound: $('menu-sound'),
    menuMusicVol: $('menu-music-vol'), menuLang: $('menu-lang'), menuTrack: $('menu-track'),
    menuResume: $('menu-resume'), menuQuit: $('menu-quit'),
    dialogPanel: $('dialog-panel'), dialogPersona: $('dialog-persona'), dialogTitle: $('dialog-title'),
    dialogQuestion: $('dialog-question'), dialogOptions: $('dialog-options'),
    dialogTimerFill: $('dialog-timer-fill'), dialogHint: $('dialog-hint')
  };

  /* ---- Layout (logische Canvas-Koordinaten) -------------------------------- */
  var W = 960, H = 620;
  var DOOR = { x: 70, y: 215, w: 74, h: 170 };
  var MENU = { x: 250, y: 185 };
  var SEAT_Y = 175;
  var COUNTER_Y = 285;
  var KITCHEN_TOP = 360;
  var WORK_BOWL = { x: 640, y: 470, r: 46 };
  var FRYER = { x: 862, y: 470, r: 40 };
  var DISCARD = { x: 742, y: 548, r: 20 };
  var CHEF_HOME = { x: 640, y: 556 };
  var BROTH_POS = [], TOPPING_POS = [];
  for (var bi = 0; bi < 4; bi++) BROTH_POS.push({ x: 118 + bi * 96, y: 402, r: 30 });
  for (var ti = 0; ti < 5; ti++) TOPPING_POS.push({ x: 118 + ti * 96, y: 486, r: 26 });
  var KEY_TOP = ['a', 's', 'd', 'f', 'g'];

  function seatCount(n) { return n; }
  function seatX(i, n) { return 360 + (900 - 360) * (n <= 1 ? 0.5 : i / (n - 1)); }

  // v2.9: Aim-System — nächster wartender Gast zur Maus-Position
  function aimSeat() {
    if (!game || mouseX < 0) return -1;
    var n = game.seats.length, best = -1, bestD = 1e9;
    for (var i = 0; i < n; i++) {
      if (game.seats[i] && game.seats[i].stage === 'waiting') {
        var d = Math.abs(seatX(i, n) - mouseX);
        if (d < bestD) { bestD = d; best = i; }
      }
    }
    return best;
  }

  /* ---- App-State ----------------------------------------------------------- */
  var game = null;
  var T = { time: 0 };
  var intro = { active: false, t: 0, dur: 5.0 };
  var paused = false;
  var shopOpen = false;
  var shopSkip = false;   // Spieler hat „Nächste Nacht“ gedrückt → Bürozeit lässt durch
  var chefEmoji = '😶', priceLevel = 'standard';
  var CHEF_EMOJIS = ['😶', '😁', '😎', '🤓', '🧐', '😋', '🥸', '👨‍🍳', '🧙‍♂️', '🤖', '👽', '🐱', '🐻', '🐸', '🐼', '🦊', '🐵', '🐨', '🐧', '🦄', '🐷', '🐯', '🦁', '🐹'];
  var hits = [];            // Klick-/Focus-Zonen (pro Frame neu)
  var focusIdx = -1;        // Controller-Fokus
  var hoverZone = null;
  var mouseX = -1, mouseY = -1;   // v2.9: Aim-System (logische Koordinaten)
  var particles = [];       // {x,y,vx,vy,life,max,color,size,grav}
  var floaters = [];        // {x,y,txt,color,life}
  var throws = [];          // {x,y,vx,vy,rot,vr,t}
  var shake = 0;
  // v2.9.2: Partytime wird IM KERN bestimmt (deterministisch) — hier nur noch Konfetti-Kosmetik
  var partyConfettiOn = false;
  var chefAnim = 0;         // Wurfbewegung
  var chefHop = { t: 0, dur: 0.7, tx: 0 };   // v2.6: Koch humpelt zum Zapfhahn
  var prev = { guests: 0, transit: 0, credits: 0, fryFlash: 0, seatStage: {}, broth: null, party: false, dialog: null, chefMood: null };
  var gpad = { last: {}, focusShown: false };
  var isTouch = (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches)) || ('ontouchstart' in window);

  /* ---- Audio-Hilfen -------------------------------------------------------- */
  function sfx(name) { if (audio && audio['sfx' + name]) { try { audio['sfx' + name](); } catch (e) {} } }
  function sfxPhase() { if (audio && audio.sfxPhase) { try { audio.sfxPhase(); } catch (e) {} } }

  /* ---- Setup --------------------------------------------------------------- */
  function buildChefPicker() {
    el.chefPick.innerHTML = '';
    CHEF_EMOJIS.forEach(function (e) {
      var b = document.createElement('button');
      b.className = 'chef-btn' + (e === chefEmoji ? ' selected' : '');
      b.textContent = e; b.setAttribute('data-e', e);
      b.addEventListener('click', function () {
        chefEmoji = e;
        Array.prototype.forEach.call(el.chefPick.children, function (c) { c.className = 'chef-btn'; });
        b.className = 'chef-btn selected'; sfx('Click');
      });
      el.chefPick.appendChild(b);
    });
  }
  function buildPricePicker() {
    el.pricePick.innerHTML = '';
    Object.keys(core.PRICE_LEVELS).forEach(function (id) {
      var p = core.PRICE_LEVELS[id];
      var b = document.createElement('button');
      b.className = 'price-btn' + (id === priceLevel ? ' selected' : '');
      b.innerHTML = p.label + '<small>' + p.desc + '</small>';
      b.addEventListener('click', function () {
        priceLevel = id;
        Array.prototype.forEach.call(el.pricePick.children, function (c) { c.className = 'price-btn'; });
        b.className = 'price-btn selected'; sfx('Click');
      });
      el.pricePick.appendChild(b);
    });
  }
  function buildTouchpad() {
    if (!isTouch) return;
    el.touchpad.classList.remove('hidden');
    var rows = [
      ['1', '2', '3', '4'],
      ['A', 'S', 'D', 'F'],
      ['G', 'SERVIEREN', 'BRATEN', 'AUS']
    ];
    el.touchpad.innerHTML = '';
    rows.forEach(function (r, ri) {
      r.forEach(function (label) {
        var b = document.createElement('button');
        b.className = 'tp-btn' + (label === 'SERVIEREN' ? ' wide' : (label === 'BRATEN' || label === 'AUS' ? ' amber' : ''));
        b.textContent = label;
        b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); onPad(label); });
        el.touchpad.appendChild(b);
      });
    });
  }
  function onPad(label) {
    if (!game || game.gameOver) return;
    if (label >= '1' && label <= '4') core.pourBroth(game, core.BROTHS[+label - 1].id), sfx('Cook');
    else if ('ASDFG'.indexOf(label) === 0) { var i = 'ASDFG'.indexOf(label); core.addTopping(game, core.TOPPINGS[i].id) && sfx('Cook'); }
    else if (label === 'SERVIEREN') core.serveBowl(game, aimSeat()) && sfx('Throw'), chefAnim = 0.4;
    else if (label === 'BRATEN') core.fryBatch(game) && sfx('Cook');
    else if (label === 'AUS') core.discardBowl(game);
  }

  /* ---- v2.9.2.2: Dialog-UI (v2.8-Kern war ohne Frontend — wiederhergestellt) ---- */
  function showDialog(d) {
    var p = core.personaOf(d.persona);
    var data = core.KAWAII && core.KAWAII.dialog ? core.KAWAII.dialog[d.persona] : null;
    if (!p || !data) { el.dialogPanel.classList.add('hidden'); return; }
    el.dialogPersona.textContent = p.emoji + ' ' + p.name;
    el.dialogTitle.textContent = T_('game.dialogTitle');
    el.dialogHint.textContent = T_('game.dialogHint');
    el.dialogQuestion.textContent = data.question;
    el.dialogOptions.innerHTML = '';
    data.options.forEach(function (o, i) {
      var b = document.createElement('button');
      b.className = 'dialog-opt';
      b.textContent = o.text;
      b.addEventListener('click', function () {
        sfx('Click');
        core.answerDialog(game, d.seat, i);
      });
      el.dialogOptions.appendChild(b);
    });
    el.dialogTimerFill.style.width = '100%';
    el.dialogPanel.classList.remove('hidden');
  }

  function requestNextNight() {
    if (game && game.phase === 'between' && game.lastNight !== null) {
      if (core.startNextNight(game)) { shopSkip = true; sfxPhase(); }
    }
  }

  /* ---- Canvas + Resize ----------------------------------------------------- */
  function fitCanvas() {
    // v2.9.2-Fix: Der Canvas wohnt in #game, das initial "hidden" ist → 0×0.
    // Titelbildschirm/Intro/Lorebook zeichnen auf denselben Canvas, also muss
    // die Stage dann sichtbar sein (ohne #game-Topbar/-Ticker, die leer bleiben).
    if (!game) {
      if (el.game.classList.contains('hidden')) {
        el.game.classList.add('title-mode');
        el.game.classList.remove('hidden');
      }
    } else if (el.game.classList.contains('title-mode')) {
      el.game.classList.remove('title-mode');
    }
    var wrap = el.canvas.parentNode;
    var cw = wrap.clientWidth, ch = wrap.clientHeight;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var scale = Math.min(cw / W, ch / H);
    var dispW = Math.max(1, Math.floor(W * scale)), dispH = Math.max(1, Math.floor(H * scale));
    el.canvas.style.width = dispW + 'px'; el.canvas.style.height = dispH + 'px';
    el.canvas.width = Math.floor(dispW * dpr); el.canvas.height = Math.floor(dispH * dpr);
    el.canvas._scale = el.canvas.width / W; // device px pro logische px
  }
  function ctx() { return el.canvas.getContext('2d'); }

  /* ---- Start / Neustart ---------------------------------------------------- */
  function startGame() {
    var seed = el.seed.value.trim();
    var name = el.barName.value.trim();
    game = core.createGame({
      seed: seed ? (parseInt(seed, 10) || (seed.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0))) : null,
      barName: name || 'NUDELBAR',
      chefEmoji: chefEmoji,
      priceLevel: priceLevel
    });
    el.tbName.textContent = game.barName.toUpperCase();
    el.statGoal.textContent = core.CONFIG.WIN_CREDITS;
    prev = { guests: 0, transit: 0, credits: game.credits, fryFlash: 0, seatStage: {}, party: false, dialog: null, chefMood: null };
    el.dialogPanel.classList.add('hidden');
    particles = []; floaters = []; throws = []; shake = 0; chefAnim = 0;
    intro = { active: true, t: 0, dur: 5.0 };
    paused = false;
    el.start.classList.add('hidden');
    el.help.classList.add('hidden');
    el.end.classList.add('hidden');
    el.game.classList.remove('hidden');
    fitCanvas();
    if (audio) { audio.init(); audio.resume(); audio.stopTitleMusic(); audio.startAmbience(); }
    titleActive = false; introPlaying = false;
    try { localStorage.setItem('nudelbar_played', '1'); hasPlayed = true; } catch(e) {}
    sfxPhase();
  }

  /* ---- Game-Schleife ------------------------------------------------------- */
  function countGuests() { var n = 0; for (var i = 0; i < game.seats.length; i++) if (game.seats[i]) n++; return n; }

  function tickGame(dt) {
    core.tick(game, dt);
    // SFX-/FX-Differenz
    var g = countGuests(), tr = game.inTransit.length, cr = game.credits;
    if (g > prev.guests) sfx('Door');
    if (tr > prev.transit) {
      // v2.9.2.2: Angestellter schickt die Schüssel ab (eigener Sound, der Koch wirft nicht)
      var lastT = game.inTransit[game.inTransit.length - 1];
      if (lastT && lastT.byEmployee) sfx('Dispatch');
      else { sfx('Throw'); chefAnim = 0.4; }
    }
    if (game.fryFlash > 0 && prev.fryFlash === 0) sfx('Cook');
    for (var i = 0; i < game.seats.length; i++) {
      var c = game.seats[i];
      var was = prev.seatStage[i];
      if (c) {
        if (c.stage === 'leaving' && was !== 'leaving') {
          if (c.angry) { spawnThrow(seatX(c.seat, seatCount(game.seats.length)), SEAT_Y); sfx('Angry'); shake = 0.5; }
          else { sfx('Happy'); }
        }
        if (c.stage === 'sipping' && was !== 'sipping') sfx('Slurp');
        if (c.stage === 'thinking' && was !== 'thinking') sfx('Think');
        if (c.stage === 'lingering' && was !== 'lingering') floater(seatX(c.seat, seatCount(game.seats.length)), SEAT_Y - 60, '💺', '#ffb020');
      }
      prev.seatStage[i] = c ? c.stage : null;
    }
    if (cr > prev.credits) sfx('Coin');
    // v2.6: Koch humpelt zum Zapfhahn, wenn Brühe reingießt
    if (game.bowl.broth && !prev.broth) {
      var bi = core.BROTHS.indexOf(core.brothOf(game.bowl.broth));
      if (bi >= 0) { chefHop.t = chefHop.dur; chefHop.tx = BROTH_POS[bi].x; }
    }
    prev.broth = game.bowl.broth;
    if (chefHop.t > 0) chefHop.t = Math.max(0, chefHop.t - dt);
    prev.guests = g; prev.transit = tr; prev.credits = cr; prev.fryFlash = game.fryFlash;
    // v2.9.2: Partytime wird im Kern bestimmt (deterministisch) — hier nur FX-Übergang erkennen
    var pNow = !!(game.party && game.party.active);
    if (pNow && !prev.party) {
      floater(W / 2, 150, '🎉 PARTY! 🎉', '#ffb020');
      if (audio && audio.sfxParty) { try { audio.sfxParty(); } catch (e) {} }
    }
    prev.party = pNow;
    // v2.9.2.2: Dialog-UI (das v2.8-Kern-System hatte nie ein Frontend) + SFX
    var dNow = game.dialog;
    if (dNow && !prev.dialog) { sfx('Phone'); showDialog(dNow); }
    if (!dNow && prev.dialog) el.dialogPanel.classList.add('hidden');
    if (dNow) el.dialogTimerFill.style.width = Math.max(0, 100 * dNow.t / core.CONFIG.DIALOG_TIMEOUT) + '%';
    prev.dialog = dNow;
    if (game.chefMood && game.chefMood !== prev.chefMood) {
      if (game.chefMood.emoji === '😬') sfx('Bad');      // falsche Schüssel / schlechte Dialog-Antwort
      if (game.chefMood.emoji === '😋') sfx('ZenJiru');  // leere Schüssel (Zen-jiru)
    }
    prev.chefMood = game.chefMood;
  }

  function spawnThrow(x, y) {
    throws.push({ x: x, y: y - 10, vx: -180 - Math.random() * 120, vy: -120 - Math.random() * 60, rot: 0, vr: (Math.random() < 0.5 ? -1 : 1) * 10, t: 0, life: 1.0 });
  }
  function burst(x, y, color, n) {
    for (var i = 0; i < (n || 10); i++) {
      var a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 120;
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.5 + Math.random() * 0.4, max: 0.9, color: color, size: 2 + Math.random() * 3, grav: 300 });
    }
  }
  function floater(x, y, txt, color) { floaters.push({ x: x, y: y, txt: txt, color: color, life: 1.2, max: 1.2 }); }

  function updateFX(dt) {
    // v2.9.2: Konfetti läuft, solange der KERN im Party-State ist
    var pActive = !!(game && game.party && game.party.active);
    if (pActive && Math.random() < 0.5) {
        var cols = ['#ff3b5c', '#ffb020', '#39ff88', '#4dd7e8', '#8b5cf6'];
        particles.push({ x: Math.random() * W, y: -8, vx: (Math.random() - 0.5) * 40, vy: 90 + Math.random() * 90,
          life: 2.4, max: 2.4, color: cols[(Math.random() * cols.length) | 0], size: 2 + Math.random() * 3, grav: 30 });
    }
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (var f = floaters.length - 1; f >= 0; f--) {
      var fl = floaters[f]; fl.y -= 34 * dt; fl.life -= dt; if (fl.life <= 0) floaters.splice(f, 1);
    }
    for (var t = throws.length - 1; t >= 0; t--) {
      var th = throws[t]; th.vy += 700 * dt; th.x += th.vx * dt; th.y += th.vy * dt; th.rot += th.vr * dt; th.t += dt;
      if (th.y > 430 || th.t > th.life) { burst(th.x, Math.min(th.y, 430), '#ff3b5c', 16); burst(th.x, Math.min(th.y, 430), '#c8a24a', 10); shake = Math.max(shake, 0.35); throws.splice(t, 1); }
    }
    shake = Math.max(0, shake - dt * 1.6);
    chefAnim = Math.max(0, chefAnim - dt);
    // Dampf über der Arbeitsschüssel
    if (game && game.bowl.broth && Math.random() < 0.4) {
      particles.push({ x: WORK_BOWL.x + (Math.random() - 0.5) * 30, y: WORK_BOWL.y - 10, vx: (Math.random() - 0.5) * 10, vy: -30 - Math.random() * 20, life: 0.9, max: 0.9, color: 'rgba(255,255,255,0.5)', size: 3 + Math.random() * 3, grav: -20 });
    }
  }
  function updateIntro(dt) {
    if (!intro.active) return;
    intro.t += dt;
    if (intro.t >= intro.dur) {
      intro.active = false;
      if (game && game.phase === 'between' && game.lastNight === null) {
        game.phaseClock = core.CONFIG.BETWEEN_DURATION - 1.8; // Nacht 1 gleich
      }
      sfxPhase();
    }
  }

  /* ---- Controller ---------------------------------------------------------- */
  function focusList() {
    var list = [];
    for (var i = 0; i < 4; i++) list.push({ t: 'broth', i: i });
    for (var j = 0; j < 5; j++) list.push({ t: 'topping', i: j });
    list.push({ t: 'serve' }, { t: 'fry' }, { t: 'discard' });
    return list;
  }
  function focusHitIndex(f) {
    for (var i = 0; i < hits.length; i++) { if (hits[i].fkey === fkey(f)) return i; }
    return -1;
  }
  function fkey(f) { return f.t === 'broth' ? 'b' + f.i : (f.t === 'topping' ? 't' + f.i : f.t); }
  function updateGamepad(dt) {
    if (!navigator.getGamepads || !game || game.gameOver) { gpad.last = {}; return; }
    var gp = null;
    var pads = navigator.getGamepads();
    for (var i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) { gp = pads[i]; break; }
    var cur = {};
    if (gp) for (var b = 0; b < gp.buttons.length; b++) cur[b] = gp.buttons[b].pressed;
    // D-Pad / Stick
    var left = gp && ((gp.buttons[14] && gp.buttons[14].pressed) || (gp.axes[0] < -0.5));
    var right = gp && ((gp.buttons[15] && gp.buttons[15].pressed) || (gp.axes[0] > 0.5));
    var up = gp && ((gp.buttons[12] && gp.buttons[12].pressed) || (gp.axes[1] < -0.5));
    var down = gp && ((gp.buttons[13] && gp.buttons[13].pressed) || (gp.axes[1] > 0.5));
    var A = gp && cur[0], B = gp && cur[1], X = gp && cur[2], Y = gp && cur[3], Start = gp && cur[9];
    var j = function (k, v) { return v && !gpad.last[k]; };
    var list = focusList();
    if (j('left', left)) { focusIdx = (focusIdx <= 0 ? list.length - 1 : focusIdx - 1); sfx('Click'); }
    if (j('right', right)) { focusIdx = (focusIdx >= list.length - 1 ? 0 : focusIdx + 1); sfx('Click'); }
    if (j('up', up)) { focusIdx = (focusIdx <= 0 ? list.length - 1 : focusIdx - 1); sfx('Click'); }
    if (j('down', down)) { focusIdx = (focusIdx >= list.length - 1 ? 0 : focusIdx + 1); sfx('Click'); }
    if (j('A', A) && focusIdx >= 0) activateFocus(focusList()[focusIdx]);
    if (j('X', X)) { core.fryBatch(game) && sfx('Cook'); }
    if (j('Y', Y)) { core.discardBowl(game); }
    if (j('B', B)) { core.serveBowl(game, aimSeat()) && sfx('Throw'), chefAnim = 0.4; }
    if (j('Start', Start)) {
      if (game && game.phase === 'between' && game.lastNight !== null) requestNextNight();
      else toggleShop();
    }
    if (gp) gpad.focusShown = true;
    gpad.last = cur;
  }
  function activateFocus(f) {
    if (!game || game.gameOver) return;
    if (f.t === 'broth') core.pourBroth(game, core.BROTHS[f.i].id), sfx('Cook');
    else if (f.t === 'topping') core.addTopping(game, core.TOPPINGS[f.i].id) && sfx('Cook');
    else if (f.t === 'serve') core.serveBowl(game, aimSeat()) && sfx('Throw'), chefAnim = 0.4;
    else if (f.t === 'fry') core.fryBatch(game) && sfx('Cook');
    else if (f.t === 'discard') core.discardBowl(game);
  }

  /* ---- Overlay-Logik ------------------------------------------------------- */
  function toggleShop() {
    if (game.gameOver) return;
    if (game.phase === 'between' && game.lastNight !== null) {
      shopOpen = !shopOpen;
      el.shop.classList.toggle('hidden', !shopOpen);
      if (shopOpen) renderShop();
    }
  }
  function renderShop() {
    var ln = game.lastNight;
    el.shopTitle.textContent = 'NACHT ' + ln.night + ' — BÜROZEIT';
    var bal = game.credits;
    el.shopSummary.innerHTML =
      '<div>Bedient: <b class="good">' + ln.served + '</b> · Verloren: <b class="bad">' + ln.lost + '</b> · ' +
      'Einnahme: <b>+' + ln.earnings + ' €</b> (Trinkgeld ' + ln.tips + ' €) · Miete: <b class="bad">−' + ln.overhead + ' €</b></div>' +
      '<div>Kassenstand: <b>' + bal + ' €</b> · Reputation: <b>' + Math.round(game.reputation) + '</b></div>';
    // Einkauf
    el.shopStock.innerHTML = '';
    core.TOPPINGS.forEach(function (t) {
      var locked = t.unlock > game.night;
      var full = game.stock[t.id] >= core.CONFIG.TOPPING_STOCK_MAX;
      var row = document.createElement('div');
      row.className = 'stock-item' + (locked ? ' locked' : '');
      row.innerHTML = '<span class="emo">' + t.emoji + '</span><span class="nm">' + t.name +
        (locked ? ' <small>(Nacht ' + t.unlock + ')</small>' : '') + '<br><span class="cnt">Vorrat ' + game.stock[t.id] + '/' + core.CONFIG.TOPPING_STOCK_MAX + '</span></span>';
      var buy = document.createElement('button');
      buy.className = 'buy'; buy.textContent = '+1 · ' + t.buy + ' €';
      buy.disabled = locked || full || bal < t.buy;
      buy.addEventListener('click', function () { core.buyTopping(game, t.id) && sfx('Coin'); renderShop(); });
      row.appendChild(buy);
      el.shopStock.appendChild(row);
    });
    // Upgrades
    el.shopUpgrades.innerHTML = '';
    Object.keys(core.UPGRADES).forEach(function (id) {
      var u = core.UPGRADES[id], lvl = core.upgradeLevel(game, id), cost = core.upgradeCost(game, id), maxed = lvl >= u.max;
      var row = document.createElement('div'); row.className = 'upg-item';
      row.innerHTML = '<span class="nm">' + u.name + '<small>' + u.desc + '</small></span><span class="lv">' + (maxed ? 'MAX' : 'L' + lvl + '/' + u.max) + '</span>';
      var buy = document.createElement('button'); buy.className = 'buy';
      buy.textContent = maxed ? '—' : cost + ' €'; buy.disabled = maxed || bal < cost;
      buy.addEventListener('click', function () { core.buyUpgrade(game, id) && sfx('Upgrade'); renderShop(); });
      row.appendChild(buy);
      el.shopUpgrades.appendChild(row);
    });
    // Preise
    el.shopPrices.innerHTML = '';
    Object.keys(core.PRICE_LEVELS).forEach(function (id) {
      var p = core.PRICE_LEVELS[id];
      var row = document.createElement('div'); row.className = 'price-item' + (game.priceLevel === id ? ' selected' : '');
      row.innerHTML = '<div><b>' + p.label + '</b><small>' + p.desc + '</small></div><span>' + (game.priceLevel === id ? '✓' : '') + '</span>';
      row.addEventListener('click', function () { core.setPriceLevel(game, id) && sfx('Click'); renderShop(); });
      el.shopPrices.appendChild(row);
    });
    el.shopCash.innerHTML = '<b>' + game.credits + ' €</b> auf der Kasse<br>Ziel: ' + core.CONFIG.WIN_CREDITS + ' € & ' + core.CONFIG.WIN_REP + ' Rep';
  }

  /* ---- Endbild ------------------------------------------------------------- */
  var GRETA = [
    '„Die Suppe ist das Leben, Koch. Das Leben ist ein wenig salzig."',
    '„Nebelklee registriert: ein weiteres Gericht, das in eine Schüssel fiel und darin blieb."',
    '„Der Chronist hat alles notiert. Einige Zeilen hat er weggelassen. Er war beschäftigt."',
    '„Suppe ist der einzige Konsens, den die Stadt noch teilt."',
    '„Man sagt, am Ende kocht man nur noch für die, die wiederkommen."'
  ];
  function endingText() {
    if (!game) return '';
    if (game.won && game.ending === 'credits') return 'ZIEL ERREICHT — du hast das Kapital und den Ruf. „' + game.barName + '" ist jetzt ein Ort.';
    if (game.won && game.ending === 'seam') return 'VOLLE SCHICHT — 20 Nächte überstanden. „' + game.barName + '“ atmet mit der Stadt.';
    if (game.ending === 'bankruptcy') return 'PLEITE — die Kasse ist leer. Der Vermieter klopft. Die Täner tropfen weiter.';
    return 'VERDRIESS — die Reputation ist weg. Niemand kommt mehr. Die Neonröhre flackert im Leerlauf.';
  }
  function showEnd() {
    var st = game.stats, ch = core.chronicle(game);
    el.endTitle.textContent = game.won ? 'SCHICHT ABGESCHLOSSEN' : 'FEIERABEND';
    el.endTitle.style.color = game.won ? 'var(--green)' : 'var(--pink)';
    el.endEnding.textContent = endingText();
    el.endStats.innerHTML =
      statBox('Nächte', game.night + '/' + core.CONFIG.CAMPAIGN_NIGHTS) +
      statBox('€', Math.round(game.credits), true) +
      statBox('Reputation', Math.round(game.reputation) + '/' + core.CONFIG.WIN_REP) +
      statBox('Bedient', st.totalServed || game.totalServed) +
      statBox('Verloren', game.totalLost) +
      statBox('Beste Combo', game.bestCombo) +
      statBox('Trinkgeld', ch.totalTips) +
      statBox('Überraschungen', ch.accidental) +
       statBox('Leere Schüsseln 🍜', ch.cleanBowls) +
       statBox('Bleiber 💺', ch.lingers);
    var body = '';
    if (ch.bestPayment && ch.bestPayment.amount) body += line('💰 Bestes Gericht', ch.bestPayment.name + ' · ' + ch.bestPayment.amount + ' € (Nacht ' + ch.bestPayment.night + ')');
    if (ch.topTipper && ch.topTipper.amount) body += line('👛 Größtes Trinkgeld', ch.topTipper.name + ' · ' + ch.topTipper.amount + ' €');
    if (ch.happiestLine) body += line('😊 Schönster Spruch', '„' + ch.happiestLine.text + '“', 'happy');
    if (ch.hardestLine) body += line('😤 Härtester Spruch', '„' + ch.hardestLine.text + '“', 'angry');
    body += line('📉 Häufigster Fehler', ch.worstMistake);
    body += line('📖 Bedient / verloren', game.totalServed + ' / ' + game.totalLost + ' Gäste');
    el.endChrono.innerHTML = body;
    el.endGreta.textContent = GRETA[Math.floor(Math.random() * GRETA.length)];
    el.end.classList.remove('hidden');
    el.shop.classList.add('hidden');
  }
  function statBox(k, v, amber) { return '<div class="end-stat"><div class="k">' + k + '</div><div class="v' + (amber ? ' amber' : '') + '">' + v + '</div></div>'; }
  function line(lbl, txt, cls) { return '<div class="chrono-line ' + (cls || '') + '"><span class="lbl">' + lbl + ':</span> <span class="q">' + txt + '</span></div>'; }

  /* ---- Render ---------------------------------------------------------------- */
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function drawBowlMini(c, x, y, r, brothId, toppings, alpha) {
    var b = core.brothOf(brothId);
    c.save(); c.globalAlpha = alpha == null ? 1 : alpha;
    c.fillStyle = '#1a2233'; c.beginPath(); c.ellipse(x, y + r * 0.5, r, r * 0.55, 0, 0, 7); c.fill();
    c.fillStyle = b ? b.color : '#333'; c.beginPath(); c.ellipse(x, y + r * 0.1, r * 0.82, r * 0.42, 0, 0, 7); c.fill();
    // Nudelwurm
    c.strokeStyle = 'rgba(255,240,200,0.85)'; c.lineWidth = Math.max(1.5, r * 0.1); c.beginPath();
    for (var a = 0; a <= Math.PI * 2; a += 0.4) { var nx = x + Math.cos(a) * r * 0.5 * (1 + 0.15 * Math.sin(a * 3)); var ny = y + r * 0.1 + Math.sin(a) * r * 0.22; a === 0 ? c.moveTo(nx, ny) : c.lineTo(nx, ny); }
    c.stroke();
    if (toppings) toppings.forEach(function (tp, i) { var t = core.toppingOf(tp); if (t) { c.font = Math.round(r * 0.5) + 'px serif'; c.textAlign = 'center'; c.fillText(t.emoji, x + (i - (toppings.length - 1) / 2) * r * 0.5, y - r * 0.35); } });
    c.restore();
  }

  function drawRoom(c) {
    // Wand
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1224'); g.addColorStop(0.55, '#0a0f1c'); g.addColorStop(1, '#05070d');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Fenster (Stadt + Mond)
    var wx = 120, wy = 20, ww = 460, wh = 90;
    c.fillStyle = '#050a16'; rr(c, wx, wy, ww, wh, 8); c.fill();
    c.strokeStyle = 'rgba(77,215,232,0.3)'; c.lineWidth = 2; c.stroke();
    // Sterne/Lichter (deterministisch per Index)
    for (var i = 0; i < 26; i++) {
      var lx = wx + 10 + ((i * 53) % (ww - 20)), ly = wy + 10 + ((i * 29) % (wh - 20));
      var tw = 0.4 + 0.6 * Math.abs(Math.sin(T.time * 1.5 + i));
      c.fillStyle = i % 3 === 0 ? 'rgba(255,176,32,' + (0.3 + tw * 0.5) + ')' : 'rgba(160,220,255,' + (0.25 + tw * 0.5) + ')';
      c.fillRect(lx, ly, 2, 2);
    }
    // Mond
    c.fillStyle = 'rgba(230,240,255,0.85)'; c.beginPath(); c.arc(wx + ww - 46, wy + 30, 15, 0, 7); c.fill();
    c.fillStyle = '#050a16'; c.beginPath(); c.arc(wx + ww - 52, wy + 26, 14, 0, 7); c.fill();
    // Neon-Schild (Bar-Name)
    var signOn = intro.active ? clamp01((intro.t - 2.2) / 0.9) : 1;
    if (signOn > 0) {
      c.save(); c.globalAlpha = signOn * (0.75 + 0.25 * Math.sin(T.time * 9) * Math.sin(T.time * 3.3));
      var name = (game ? game.barName : 'NUDELBAR').toUpperCase();
      c.font = 'bold ' + Math.min(40, Math.floor(420 / Math.max(4, name.length))) + 'px "Courier New", monospace';
      c.textAlign = 'center'; c.fillStyle = '#4dd7e8';
      c.shadowColor = '#4dd7e8'; c.shadowBlur = 18;
      c.fillText(name, 720, 70);
      c.shadowBlur = 0; c.restore();
    }
    // Festival-Lichterkette
    if (game && game.event && game.event.type === 'festival') {
      for (var f = 0; f < 20; f++) {
        var fx = 60 + f * 46, fy = 118 + Math.sin(f * 0.8) * 8;
        c.fillStyle = ['#ff3b5c', '#ffb020', '#39ff88', '#4dd7e8'][f % 4];
        c.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(T.time * 3 + f));
        c.beginPath(); c.arc(fx, fy, 4, 0, 7); c.fill(); c.globalAlpha = 1;
      }
    }
    // Boden
    c.fillStyle = 'rgba(10,16,30,0.6)'; c.fillRect(0, 330, W, H - 330);
    c.strokeStyle = 'rgba(77,215,232,0.12)'; c.lineWidth = 1;
    for (var fl = 0; fl < 6; fl++) { c.beginPath(); c.moveTo(0, 360 + fl * 45); c.lineTo(W, 360 + fl * 45); c.stroke(); }
    // Tür
    drawDoor(c);
    // Theke
    c.fillStyle = '#131c30'; rr(c, 150, COUNTER_Y, 760, 40, 8); c.fill();
    c.fillStyle = 'rgba(77,215,232,0.25)'; c.fillRect(150, COUNTER_Y, 760, 4);
    // Küchen-Abtrennung
    c.strokeStyle = 'rgba(77,215,232,0.18)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(40, KITCHEN_TOP); c.lineTo(W - 40, KITCHEN_TOP); c.stroke();
    c.font = 'bold 13px monospace'; c.fillStyle = 'rgba(111,139,150,0.8)'; c.textAlign = 'left';
    c.fillText('KÜCHE — ' + (game ? game.barName.toUpperCase() : ''), 44, KITCHEN_TOP - 8);
  }

  function drawDoor(c) {
    var open = intro.active ? clamp01(intro.t / 1.2) : 1;
    // Rahmen
    c.fillStyle = '#0c1526'; rr(c, DOOR.x - DOOR.w / 2, DOOR.y - DOOR.h / 2, DOOR.w, DOOR.h, 6); c.fill();
    c.strokeStyle = 'rgba(255,176,32,0.5)'; c.lineWidth = 3; c.stroke();
    // Türblatt (schwingt nach innen)
    c.save();
    c.translate(DOOR.x - DOOR.w / 2, DOOR.y - DOOR.h / 2);
    var sw = DOOR.w * (1 - open * 0.7);
    c.fillStyle = '#16233c'; c.fillRect(0, 0, sw, DOOR.h);
    c.fillStyle = 'rgba(77,215,232,0.5)'; c.fillRect(sw - 6, 0, 6, DOOR.h); // Licht
    c.restore();
    // Klingel
    c.fillStyle = '#ffb020'; c.beginPath(); c.arc(DOOR.x + DOOR.w / 2 - 6, DOOR.y - 10, 3, 0, 7); c.fill();
    c.font = 'bold 12px monospace'; c.fillStyle = 'rgba(111,139,150,0.9)'; c.textAlign = 'center';
    c.fillText(T_('game.entrance'), DOOR.x, DOOR.y + DOOR.h / 2 + 14);
  }

  function drawMenuKiosk(c) {
    var x = MENU.x, y = MENU.y;
    // Board
    c.fillStyle = '#0e1830'; rr(c, x - 52, y - 60, 104, 92, 8); c.fill();
    c.strokeStyle = 'rgba(255,176,32,0.5)'; c.lineWidth = 2; c.stroke();
    c.font = 'bold 14px monospace'; c.fillStyle = '#ffb020'; c.textAlign = 'center';
    c.fillText('SPEISEKARTE', x, y - 44);
    c.font = '13px serif'; c.textAlign = 'left';
    var menu = game ? core.unlockedBroths(game).concat(core.unlockedToppings(game)) : [];
    var shown = 0;
    for (var i = 0; i < menu.length && shown < 6; i++) {
      var m = menu[i]; c.fillText(m.emoji || '●', x - 44, y - 26 + shown * 13); c.font = '11px monospace'; c.fillStyle = '#cfe8ef'; c.fillText(m.name, x - 26, y - 26 + shown * 13); c.font = '13px serif'; c.fillStyle = '#cfe8ef';
      shown++;
    }
    c.font = '11px monospace'; c.fillStyle = 'rgba(111,139,150,0.9)'; c.textAlign = 'center';
    c.fillText('→ hier bestellen', x, y + 44);
  }

  /* ---- Guest-Rendering ------------------------------------------------------ */
  function guestPos(c) {
    // easing-Ziel je nach Stufe
    var n = game.seats.length, sx = seatX(c.seat, n);
    if (c.stage === 'entering') return { tx: MENU.x, ty: MENU.y + 10, at: 'menu' };
    if (c.stage === 'thinking') return { tx: MENU.x, ty: MENU.y + 10, at: 'menu' };
    if (c.stage === 'waiting' || c.stage === 'eating' || c.stage === 'sipping' || c.stage === 'lingering') return { tx: sx, ty: SEAT_Y, at: 'seat' };
    if (c.stage === 'leaving') return { tx: DOOR.x, ty: DOOR.y, at: 'door' };
    return { tx: sx, ty: SEAT_Y, at: 'seat' };
  }
  function drawGuest(c, g) {
    var p = guestPos(g);
    // easing-Position (visuell)
    var key = 'gx' + g.seat;
    if (!g._vx) g._vx = DOOR.x, g._vy = DOOR.y;
    var ease = Math.min(1, 0.05 * 60 * (1 / 60) * 3.2);
    g._vx += (p.tx - g._vx) * ease; g._vy += (p.ty - g._vy) * ease;
    var x = g._vx, y = g._vy;
    var col = g.persona.color;
    var t = T.time;
    var walk = (g.stage === 'entering' || g.stage === 'leaving') ? Math.sin(t * 10 + g.seat) : 0;
    var hop = 0;
    if (g.stage === 'leaving' && !g.angry) hop = Math.abs(Math.sin(t * 8)) * 8;
    if (g.stage === 'leaving' && g.angry) hop = -Math.abs(Math.sin(t * 11)) * 12;
    var bob = (g.stage === 'waiting') ? Math.sin(t * 3 + g.seat) * 2 : 0;
    y += bob + hop;
    var fade = 1;
    if (g.stage === 'leaving') fade = clamp01(g.leaveTimer / (g.angry ? core.CONFIG.LEAVE_TIME : core.CONFIG.HAPPY_LEAVE));
    c.save(); c.globalAlpha = fade;
    var isEating = g.stage === 'eating';
    var isSipping = g.stage === 'sipping';
    var isLingering = g.stage === 'lingering';
    var happy = g.stage === 'leaving' && !g.angry;
    var angry = g.stage === 'leaving' && g.angry;
    // Stuhl (wenn an Theke)
    if (p.at === 'seat') { c.fillStyle = '#243050'; c.beginPath(); c.ellipse(x, SEAT_Y + 40, 22, 8, 0, 0, 7); c.fill(); c.fillStyle = '#1a2233'; c.fillRect(x - 3, SEAT_Y + 40, 6, 12); }
    // Beine
    c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y + 22); c.lineTo(x - 9 - walk * 5, y + 40); c.moveTo(x, y + 22); c.lineTo(x + 9 + walk * 5, y + 40); c.stroke();
    // Körper
    c.fillStyle = col; rr(c, x - 13, y - 8, 26, 34, 10); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.25)'; rr(c, x - 13, y + 8, 26, 18, 8); c.fill(); // Schürze
    // Arme
    c.strokeStyle = col; c.lineWidth = 4;
    if (isEating || isSipping) { c.beginPath(); c.moveTo(x - 11, y + 2); c.lineTo(x - 4, y + 14); c.moveTo(x + 11, y + 2); c.lineTo(x + 4, y + 14); c.stroke(); }
    else if (happy) { c.beginPath(); c.moveTo(x - 11, y + 2); c.lineTo(x - 18, y - 12 + hop); c.moveTo(x + 11, y + 2); c.lineTo(x + 18, y - 12 + hop); c.stroke(); }
    else if (angry) { c.beginPath(); c.moveTo(x - 11, y + 2); c.lineTo(x - 16, y + 18); c.moveTo(x + 11, y + 2); c.lineTo(x + 16, y + 18); c.stroke(); }
    else { c.beginPath(); c.moveTo(x - 11, y + 2); c.lineTo(x - 15, y + 16 + walk * 3); c.moveTo(x + 11, y + 2); c.lineTo(x + 15, y + 16 - walk * 3); c.stroke(); }
    // Kopf (Emoji)
    c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(g.persona.emoji, x, y - 24);
    c.textBaseline = 'alphabetic';
    // v2.6: 🚪-Badge für Stayer (anklickbar)
    if (g.stayer) {
      c.font = '15px serif'; c.globalAlpha = fade * (0.6 + 0.4 * Math.sin(T.time * 4));
      c.fillText('🚪', x + 18, y - 40);
      c.globalAlpha = fade;
    }
    // 🎉 Partyhut während der Partytime (v2.9.2: Kern-State)
    if (game.party && game.party.active) {
      c.font = '18px serif';
      c.fillText('🎩', x + 10 + Math.sin(T.time * 6 + g.seat) * 2, y - 44 + Math.sin(T.time * 5 + g.seat * 2) * 2);
      if (Math.random() < 0.06) particles.push({ x: x + (Math.random() - 0.5) * 20, y: y - 40, vx: (Math.random() - 0.5) * 30, vy: -40, life: 0.7, max: 0.7, color: 'rgba(255,176,32,0.9)', size: 2, grav: 120 });
    }
    // Stammgast-Stern / Gruppen-Badge
    if (g.isRegular) { c.font = '13px serif'; c.fillText('⭐', x + 16, y - 34); }
    if (g.group) { c.font = '13px serif'; c.fillText(groupEmoji(g.group), x - 16, y - 34); }
    // Geduld-Ring (wartend)
    if (g.stage === 'waiting') {
      var frac = clamp01(g.patience / g.maxPatience);
      var colr = frac > 0.5 ? '#39ff88' : (frac > 0.25 ? '#ffb020' : '#ff3b5c');
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 4; c.beginPath(); c.arc(x, y - 24, 22, 0, 7); c.stroke();
      c.strokeStyle = colr; c.beginPath(); c.arc(x, y - 24, 22, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); c.stroke();
      drawOrderBubble(c, x, y - 62, g);
    }
    // Denk-Blase (am Menu)
    if (g.stage === 'thinking') drawThinkBubble(c, x, y - 60, g);
    // Essen (Inhalt wird sichtbar weniger — auslöffeln)
    if (isEating) {
      var eatDur = core.CONFIG.EAT_TIME * (g.persona.eat || 1);
      var fill = clamp01(1 - (eatDur - g.eatTimer) / eatDur);
      drawBowlMini(c, x, y + 16, 12, g.order.broth, g.order.toppings, g.finisher === 'clean' ? 0.2 + fill * 0.8 : 1);
      // Chopsticks
      c.strokeStyle = '#e8c96a'; c.lineWidth = 1.5; var ch = Math.sin(t * 8) * 4;
      c.beginPath(); c.moveTo(x - 8, y + 8 + ch); c.lineTo(x + 6, y - 4); c.moveTo(x - 4, y + 10 + ch); c.lineTo(x + 10, y - 2); c.stroke();
      if (Math.random() < 0.2) particles.push({ x: x, y: y + 10, vx: 0, vy: -20, life: 0.5, max: 0.5, color: 'rgba(255,255,255,0.4)', size: 2, grav: -10 });
    }
    // Schlürfen: Schüssel kippt ans Gesicht, letzte Brühe weg
    if (isSipping) {
      var tilt = -0.5 + Math.sin(T.time * 6) * 0.25;
      c.save(); c.translate(x, y + 8); c.rotate(tilt);
      drawBowlMini(c, 0, 6, 11, g.order.broth, [], 0.3);
      c.restore();
      c.font = '13px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('💧', x + 16, y + 4 - (T.time * 46 % 14));
      c.textBaseline = 'alphabetic';
      if (Math.random() < 0.35) particles.push({ x: x + (Math.random() - 0.5) * 10, y: y + 6, vx: (Math.random() - 0.5) * 24, vy: -34, life: 0.4, max: 0.4, color: 'rgba(77,215,232,0.8)', size: 2, grav: -8 });
    }
    // Bleiber: ruht sich aus, gelegentliches Seufzen
    if (isLingering && Math.random() < 0.02) particles.push({ x: x + 10, y: y - 30, vx: 4, vy: -14, life: 0.8, max: 0.8, color: 'rgba(255,176,32,0.5)', size: 2, grav: -12 });
    // Reaktions-Blase (bleibt über Essen, Schlürfen, Bleiben & Rausgehen sichtbar)
    if (g.line && (g.stage === 'eating' || g.stage === 'sipping' || g.stage === 'lingering' || (g.stage === 'leaving' && !g.angry))) {
      drawReactionBubble(c, x, y - 66, g, g.angry);
    }
    if (angry && g.line) drawReactionBubble(c, x, y - 66, g, true);
    // Smalltalk-Blase (Gossip zwischen Gästen)
    if (g.chat && g.chat.t > 0) drawChatBubble(c, x, y - 96, g);
    // Stimmung steckt an: grünes Herz über zufriedenen Wartenden
    if (g.moodBonus > 0 && g.stage === 'waiting') {
      c.font = '13px serif'; c.globalAlpha = fade * (0.45 + 0.4 * Math.sin(T.time * 4 + g.seat));
      c.fillText('💚', x - 17, y - 36 + Math.sin(T.time * 3) * 2);
      c.globalAlpha = fade;
    }
    c.restore();
  }
  function groupEmoji(id) { for (var i = 0; i < core.GROUPS.length; i++) if (core.GROUPS[i].id === id) return core.GROUPS[i].emoji; return '🚶'; }

  function drawChatBubble(c, x, y, g) {
    var txt = g.chat.text, maxW = 190;
    c.save();
    c.font = 'italic 10px monospace';
    var words = txt.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (c.measureText(test).width > maxW - 14 && cur) { lines.push(cur); cur = words[i]; } else cur = test;
    }
    if (cur) lines.push(cur);
    if (lines.length > 3) lines = lines.slice(0, 3);
    var bw = Math.min(maxW, Math.max.apply(null, lines.map(function (l) { return c.measureText(l).width; })) + 16);
    var bh = lines.length * 13 + 10;
    c.globalAlpha = clamp01(Math.min(1, g.chat.t / 0.5));
    c.fillStyle = 'rgba(20,10,34,0.92)'; rr(c, x - bw / 2, y - bh, bw, bh, 7); c.fill();
    c.strokeStyle = 'rgba(139,92,246,0.7)'; c.lineWidth = 1; c.stroke();
    c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x, y + 6); c.lineTo(x + 4, y); c.fill();
    c.font = 'italic 10px monospace'; c.fillStyle = 'rgba(220,200,255,0.95)';
    for (var l = 0; l < lines.length; l++) c.fillText(lines[l], x - bw / 2 + 7, y - bh + 15 + l * 13);
    c.restore();
  }

  function drawOrderBubble(c, x, y, g) {
    var w = 110, h = 64;
    c.save();
    c.fillStyle = 'rgba(8,12,24,0.94)'; rr(c, x - w / 2, y, w, h, 8); c.fill();
    c.strokeStyle = 'rgba(77,215,232,0.6)'; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.moveTo(x - 6, y + h); c.lineTo(x, y + h + 8); c.lineTo(x + 6, y + h); c.fillStyle = 'rgba(8,12,24,0.94)'; c.fill();
    drawBowlMini(c, x - 28, y + 30, 17, g.order.broth, g.order.toppings, 1);
    c.font = 'bold 16px monospace'; c.fillStyle = '#ffb020'; c.textAlign = 'left';
    c.fillText('PREIS: ' + g.order.price + ' €', x + 6, y + 28);
    c.font = '13px monospace'; c.fillStyle = 'rgba(111,139,150,0.9)';
    c.fillText(core.brothOf(g.order.broth).name, x + 6, y + 46);
    // Pulsierendes ?
    var q = 0.6 + 0.4 * Math.sin(T.time * 5);
    c.fillStyle = 'rgba(77,215,232,' + q + ')'; c.font = 'bold 16px monospace'; c.textAlign = 'center';
    c.fillText('❓', x + w / 2 - 12, y + 16);
    c.restore();
  }
  function drawThinkBubble(c, x, y, g) {
    c.save();
    c.fillStyle = 'rgba(8,12,24,0.9)';
    c.beginPath(); c.arc(x - 10, y, 10, 0, 7); c.fill();
    c.beginPath(); c.arc(x, y - 22, 16, 0, 7); c.fill();
    c.beginPath(); c.arc(x + 20, y - 46, 22, 0, 7); c.fill();
    c.strokeStyle = 'rgba(77,215,232,0.4)'; c.lineWidth = 1;
    // formende Nudel
    c.strokeStyle = 'rgba(255,240,200,' + (0.4 + 0.4 * Math.sin(T.time * 6)) + ')'; c.lineWidth = 2;
    c.beginPath(); for (var a = 0; a <= Math.PI * 2; a += 0.4) { var nx = x + 20 + Math.cos(a) * 12; var ny = y - 46 + Math.sin(a) * 8; a === 0 ? c.moveTo(nx, ny) : c.lineTo(nx, ny); } c.stroke();
    c.font = 'bold 16px monospace'; c.fillStyle = 'rgba(77,215,232,' + (0.5 + 0.5 * Math.sin(T.time * 5)) + ')'; c.textAlign = 'center';
    c.fillText('?', x + 40, y - 40);
    c.restore();
  }
  function drawReactionBubble(c, x, y, g, angry) {
    var txt = g.line, maxW = 200;
    c.save();
    // Text umbruch
    c.font = '11px monospace';
    var words = txt.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (c.measureText(test).width > maxW - 16 && cur) { lines.push(cur); cur = words[i]; } else cur = test;
    }
    if (cur) lines.push(cur);
    if (lines.length > 4) lines = lines.slice(0, 4);
    var bw = Math.min(maxW, Math.max.apply(null, lines.map(function (l) { return c.measureText(l).width; })) + 20);
    var bh = lines.length * 14 + 12;
    var colr = angry ? '#ff3b5c' : (g.lingerLine ? '#ffb020' : (g.reaction === 'enthusiastic' || g.reaction === 'accidental' ? '#39ff88' : (g.reaction === 'positive' ? '#4dd7e8' : '#cfe8ef')));
    var hold = 1;
    if (g.stage === 'eating') hold = (core.CONFIG.EAT_TIME * (g.persona.eat || 1) - g.eatTimer) / 0.6;
    else if (g.stage === 'leaving') hold = g.leaveTimer / (g.angry ? core.CONFIG.LEAVE_TIME : core.CONFIG.HAPPY_LEAVE);
    c.globalAlpha = clamp01(g.reaction ? Math.min(1, hold + 0.4) : 1);
    c.fillStyle = 'rgba(8,12,24,0.95)'; rr(c, x - bw / 2, y - bh, bw, bh, 8); c.fill();
    c.strokeStyle = colr; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x, y + 8); c.lineTo(x + 6, y); c.fill();
    // Label
    var label = angry ? 'MURRKOPF' : (g.lingerLine ? 'BLEIBT SITZEN' : (g.reaction === 'enthusiastic' ? 'BEGEISTERT' : (g.reaction === 'positive' ? 'ZUFRIEDEN' : (g.reaction === 'accidental' ? 'ÜBERRASCHT' : 'VERHALTEN'))));
    c.font = 'bold 9px monospace'; c.fillStyle = colr; c.textAlign = 'left';
    c.fillText(label, x - bw / 2 + 8, y - bh + 13);
    c.font = '11px monospace'; c.fillStyle = 'rgba(230,240,245,0.95)';
    for (var l = 0; l < lines.length; l++) c.fillText(lines[l], x - bw / 2 + 8, y - bh + 28 + l * 14);
    c.restore();
  }

  /* ---- Küche ----------------------------------------------------------------- */
  function drawKitchen(c) {
    // Brühen-Taps
    for (var i = 0; i < 4; i++) {
      var b = core.BROTHS[i], pos = BROTH_POS[i], locked = b.unlock > game.night;
      var active = game.bowl.broth === b.id;
      c.save();
      // Pipe
      c.fillStyle = locked ? '#20283a' : '#1a2740';
      rr(c, pos.x - 20, pos.y - 30, 40, 24, 4); c.fill();
      c.fillStyle = locked ? '#333c50' : b.color;
      rr(c, pos.x - 26, pos.y - 8, 52, 16, 6); c.fill();
      // Hebel
      c.fillStyle = '#8899aa'; c.fillRect(pos.x - 3, pos.y + 8, 6, 14);
      c.beginPath(); c.arc(pos.x, pos.y + 24, 6, 0, 7); c.fill();
      if (active && !locked) { c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; rr(c, pos.x - 26, pos.y - 8, 52, 16, 6); c.stroke(); }
      // Gießpartikel
      if (active && !locked && Math.random() < 0.6) particles.push({ x: pos.x, y: pos.y + 28, vx: (WORK_BOWL.x - pos.x) * 0.01, vy: 120, life: 0.4, max: 0.4, color: b.color, size: 2, grav: 300 });
      c.font = '11px monospace'; c.textAlign = 'center'; c.fillStyle = locked ? '#44506a' : '#cfe8ef';
      c.fillText(locked ? 'N' + b.unlock : (i + 1), pos.x, pos.y + 44);
      if (locked) { c.font = '10px monospace'; c.fillStyle = '#44506a'; c.fillText('🔒', pos.x, pos.y - 36); }
      c.restore();
    }
    // Beilagen
    for (var j = 0; j < 5; j++) {
      var tp = core.TOPPINGS[j], tpos = TOPPING_POS[j], locked = tp.unlock > game.night;
      var stk = game.stock[tp.id], out = stk <= 0;
      c.save();
      c.fillStyle = locked ? '#1a2233' : (out ? '#2a1520' : '#16233c');
      c.beginPath(); c.arc(tpos.x, tpos.y, tpos.r, 0, 7); c.fill();
      c.strokeStyle = out && !locked ? 'rgba(255,59,92,0.7)' : (game.bowl.toppings.indexOf(tp.id) >= 0 ? 'rgba(57,255,136,0.8)' : 'rgba(77,215,232,0.35)');
      c.lineWidth = 2; c.stroke();
      c.font = '22px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.globalAlpha = locked ? 0.4 : 1;
      c.fillText(tp.emoji, tpos.x, tpos.y - 2);
      c.globalAlpha = 1; c.textBaseline = 'alphabetic';
      c.font = 'bold 11px monospace'; c.fillStyle = out && !locked ? '#ff3b5c' : (locked ? '#44506a' : '#cfe8ef');
      c.fillText(locked ? 'N' + tp.unlock : (stk > 0 ? '×' + stk : '∅'), tpos.x, tpos.y + 30);
      c.font = '10px monospace'; c.fillStyle = '#6f8b96';
      c.fillText(KEY_TOP[j].toUpperCase(), tpos.x, tpos.y - 30);
      c.restore();
    }
    // Arbeitsschüssel
    c.save();
    c.fillStyle = '#1a2233'; c.beginPath(); c.ellipse(WORK_BOWL.x, WORK_BOWL.y + 14, WORK_BOWL.r, WORK_BOWL.r * 0.5, 0, 0, 7); c.fill();
    var b = game.bowl.broth ? core.brothOf(game.bowl.broth) : null;
    c.fillStyle = b ? b.color : '#101826'; c.beginPath(); c.ellipse(WORK_BOWL.x, WORK_BOWL.y, WORK_BOWL.r - 6, (WORK_BOWL.r - 6) * 0.5, 0, 0, 7); c.fill();
    if (b) { c.strokeStyle = 'rgba(255,240,200,0.7)'; c.lineWidth = 2; c.beginPath(); for (var a = 0; a <= Math.PI * 2; a += 0.4) { var nx = WORK_BOWL.x + Math.cos(a) * (WORK_BOWL.r - 16); var ny = WORK_BOWL.y + Math.sin(a) * (WORK_BOWL.r - 16) * 0.5; a === 0 ? c.moveTo(nx, ny) : c.lineTo(nx, ny); } c.stroke(); }
    game.bowl.toppings.forEach(function (tp, i) { var t = core.toppingOf(tp); if (t) { c.font = '20px serif'; c.textAlign = 'center'; c.fillText(t.emoji, WORK_BOWL.x - 20 + i * 20, WORK_BOWL.y - 6); } });
    c.font = 'bold 12px monospace'; c.fillStyle = '#6f8b96'; c.textAlign = 'center';
    c.fillText(T_('game.serve') + ' ⏎', WORK_BOWL.x, WORK_BOWL.y + 44);
    c.restore();
    // Fritteuse
    c.save();
    var ready = game.fryCooldown <= 0;
    c.fillStyle = '#141d30'; rr(c, FRYER.x - 38, FRYER.y - 20, 76, 52, 8); c.fill();
    c.strokeStyle = ready ? 'rgba(57,255,136,0.8)' : 'rgba(77,215,232,0.3)'; c.lineWidth = 2; c.stroke();
    // Öl
    c.fillStyle = 'rgba(255,176,32,0.5)'; rr(c, FRYER.x - 30, FRYER.y - 10, 60, 26, 4); c.fill();
    if (game.fryFlash > 0) { c.fillStyle = 'rgba(255,220,120,' + game.fryFlash + ')'; rr(c, FRYER.x - 30, FRYER.y - 10, 60, 26, 4); c.fill(); }
    if (!ready) { var frac = 1 - game.fryCooldown / core.CONFIG.FRY_COOLDOWN; c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(FRYER.x - 30, FRYER.y + 20, 60 * frac, 3); }
    c.font = 'bold 12px monospace'; c.textAlign = 'center'; c.fillStyle = ready ? '#39ff88' : '#6f8b96';
    c.fillText(ready ? 'R ✓ ' + T_('game.ready') : 'R', FRYER.x, FRYER.y + 46);
    c.restore();
    // Ausspülen
    c.save();
    c.fillStyle = '#141d30'; c.beginPath(); c.arc(DISCARD.x, DISCARD.y, DISCARD.r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,59,92,0.5)'; c.lineWidth = 2; c.stroke();
    c.font = '16px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🚰', DISCARD.x, DISCARD.y); c.textBaseline = 'alphabetic';
    c.font = '9px monospace'; c.fillStyle = '#6f8b96'; c.fillText('X', DISCARD.x, DISCARD.y + 30);
    c.restore();
    drawChef(c);
  }
  function drawChef(c) {
    var x = CHEF_HOME.x, y = CHEF_HOME.y;
    var throwA = chefAnim > 0 ? chefAnim / 0.4 : 0;
    var lean = throwA * 0.4;
    // v2.6: Humpel-Hop zum Zapfhahn
    var hopP = chefHop.t > 0 ? chefHop.t / chefHop.dur : 0;
    var hopX = Math.sin(hopP * Math.PI) * (chefHop.tx - CHEF_HOME.x) * 0.55;
    var hopY = -Math.abs(Math.sin(hopP * Math.PI * 2)) * 12;
    c.save();
    c.translate(x + hopX, y + hopY); c.rotate(-lean * 0.15 + Math.sin(hopP * Math.PI * 2) * 0.08);
    // Beine
    c.strokeStyle = '#2b3a5a'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-6, 20); c.lineTo(-8, 40); c.moveTo(6, 20); c.lineTo(8, 40); c.stroke();
    // Körper + Schürze
    c.fillStyle = '#33456b'; rr(c, -16, -12, 32, 36, 10); c.fill();
    c.fillStyle = '#4dd7e8'; rr(c, -14, 2, 28, 22, 6); c.fill();
    // Arme (Werfen)
    c.strokeStyle = '#33456b'; c.lineWidth = 5;
    var armUp = throwA * 26;
    c.beginPath(); c.moveTo(-14, -6); c.lineTo(-22, 6 - armUp * 0.5); c.moveTo(14, -6); c.lineTo(24, -6 - armUp); c.stroke();
    // Kopf (mit Stimmungs-Mood bei Fehlschlag/High)
    var moodFace = game.chefMood ? game.chefMood.emoji : game.chefEmoji;
    c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(moodFace, 0, -28 - (game.chefMood ? 2 * Math.sin(T.time * 10) : 0));
    c.textBaseline = 'alphabetic';
    if (game.party && game.party.active) { c.font = '18px serif'; c.fillText('🎩', 14 + Math.sin(T.time * 7) * 2, -46 + Math.sin(T.time * 6) * 2); }
    // v2.8: Koch-Gedanken (Monolog in ruhigen Momenten)
    if (game.chefThought && game.chefThought.t > 0) {
      var ct = game.chefThought.text, maxW = 200;
      c.font = 'italic 10px monospace';
      var words = ct.split(' '), lines = [], cur = '';
      for (var wi = 0; wi < words.length; wi++) {
        var test = cur ? cur + ' ' + words[wi] : words[wi];
        if (c.measureText(test).width > maxW - 14 && cur) { lines.push(cur); cur = words[wi]; } else cur = test;
      }
      if (cur) lines.push(cur);
      if (lines.length > 3) lines = lines.slice(0, 3);
      var bw = Math.min(maxW, Math.max.apply(null, lines.map(function (l) { return c.measureText(l).width; })) + 16);
      var bh = lines.length * 13 + 10;
      c.globalAlpha = clamp01(Math.min(1, game.chefThought.t / 0.8));
      c.fillStyle = 'rgba(10,16,30,0.9)'; rr(c, -bw / 2, -78 - bh, bw, bh, 7); c.fill();
      c.strokeStyle = 'rgba(255,176,32,0.5)'; c.lineWidth = 1; c.stroke();
      c.beginPath(); c.moveTo(-4, -78); c.lineTo(0, -72); c.lineTo(4, -78); c.fill();
      c.font = 'italic 10px monospace'; c.fillStyle = 'rgba(255,220,150,0.95)';
      for (var li = 0; li < lines.length; li++) c.fillText(lines[li], -bw / 2 + 7, -78 - bh + 15 + li * 13);
      c.globalAlpha = 1;
    }
    c.restore();
  }

  /* ---- In-Transit + FX ------------------------------------------------------- */
  function drawTransit(c) {
    for (var i = 0; i < game.inTransit.length; i++) {
      var tr = game.inTransit[i], n = game.seats.length, sx = seatX(tr.seat, n);
      var t = tr.t, mx = (WORK_BOWL.x + sx) / 2, my = Math.min(WORK_BOWL.y, SEAT_Y) - 120;
      var x = quad(WORK_BOWL.x, mx, sx, t), y = quad(WORK_BOWL.y, my, SEAT_Y - 10, t);
      drawBowlMini(c, x, y, 15, tr.bowl.broth, tr.bowl.toppings, 1);
      if (Math.random() < 0.3) particles.push({ x: x, y: y - 6, vx: 0, vy: -20, life: 0.4, max: 0.4, color: 'rgba(255,255,255,0.4)', size: 2, grav: -10 });
    }
  }
  // v2.9.2: Aim-System — Ziellinie zu dem Gast, zu dem die Schüssel fliegt
  function drawAimLine(c) {
    if (!game || game.phase !== 'night' || game.bowl.broth == null) return;
    var seat = aimSeat();
    if (seat === -1) return;
    var n = game.seats.length, tx = seatX(seat, n), ty = SEAT_Y - 12;
    var bx = WORK_BOWL.x, by = WORK_BOWL.y - 14;
    var mx = (bx + tx) / 2, my = Math.min(by, ty) - 70;
    c.save();
    c.strokeStyle = 'rgba(255, 176, 32, ' + (0.28 + 0.12 * Math.sin(T.time * 6)) + ')';
    c.lineWidth = 2;
    c.setLineDash([6, 6]);
    c.lineDashOffset = -T.time * 40;
    c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(mx, my, tx, ty); c.stroke();
    c.setLineDash([]);
    c.beginPath(); c.arc(tx, ty, 26, 0, 7); c.stroke();
    c.restore();
  }
  function quad(a, b, c2, t) { var u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c2; }
  function drawThrows(c) {
    for (var i = 0; i < throws.length; i++) {
      var th = throws[i];
      c.save(); c.translate(th.x, th.y); c.rotate(th.rot);
      c.fillStyle = '#ff3b5c'; c.beginPath(); c.ellipse(0, 0, 13, 7, 0, 0, 7); c.fill();
      c.fillStyle = '#c8a24a'; c.beginPath(); c.ellipse(0, -2, 10, 5, 0, 0, 7); c.fill();
      c.restore();
    }
  }
  function drawParticles(c) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i]; c.globalAlpha = clamp01(p.life / p.max); c.fillStyle = p.color;
      c.beginPath(); c.arc(p.x, p.y, p.size, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  }
  function drawFloaters(c) {
    for (var i = 0; i < floaters.length; i++) {
      var f = floaters[i]; c.globalAlpha = clamp01(f.life / f.max);
      c.font = 'bold 16px monospace'; c.textAlign = 'center'; c.fillStyle = f.color;
      c.shadowColor = f.color; c.shadowBlur = 8; c.fillText(f.txt, f.x, f.y); c.shadowBlur = 0;
    }
    c.globalAlpha = 1;
  }

  /* ---- Hits + Tooltip + Focus ------------------------------------------------ */
  function computeHits() {
    hits.length = 0;
    if (!game || game.gameOver) return;
    for (var i = 0; i < 4; i++) {
      var b = core.BROTHS[i], p = BROTH_POS[i], lk = b.unlock > game.night;
      hits.push({ fkey: 'b' + i, kind: 'broth', i: i, x: p.x - p.r, y: p.y - 34, w: p.r * 2, h: 84,
        tip: b.name + ' Brühe · Taste ' + (i + 1) + (lk ? ' · 🔒 ab Nacht ' + b.unlock : ' · ' + b.price + ' € in der Schüssel') + '. Gießt die Basis.' });
    }
    for (var j = 0; j < 5; j++) {
      var tp = core.TOPPINGS[j], tp2 = TOPPING_POS[j], l2 = tp.unlock > game.night;
      hits.push({ fkey: 't' + j, kind: 'topping', i: j, x: tp2.x - tp2.r, y: tp2.y - 32, w: tp2.r * 2, h: 72,
        tip: tp.name + ' · Taste ' + KEY_TOP[j].toUpperCase() + (l2 ? ' · 🔒 ab Nacht ' + tp.unlock : ' · Vorrat ' + game.stock[tp.id] + ' · Einkauf ' + tp.buy + ' € (Shop)') + '. Aus dem Fritteusen-Vorrat.' });
    }
    hits.push({ fkey: 'serve', kind: 'serve', x: WORK_BOWL.x - 48, y: WORK_BOWL.y - 48, w: 96, h: 96,
      tip: 'Schüssel werfen · Enter/Leertaste · fliegt zum ältesten wartenden Gast. Richtig = isst + zahlt. Fast richtig = oft trotzdem. Falsch = Schüssel fliegt zurück.' });
    hits.push({ fkey: 'fry', kind: 'fry', x: FRYER.x - 42, y: FRYER.y - 24, w: 84, h: 84,
      tip: 'Fritteuse · R · brät Beilagen-Nachschub (kürzt sich durch Fritteuse-Tuning).' });
    hits.push({ fkey: 'discard', kind: 'discard', x: DISCARD.x - 22, y: DISCARD.y - 22, w: 44, h: 44,
      tip: 'Ausspülen · X · leert die Arbeits-Schüssel, falls die Mischung falsch wurde.' });
    // v2.6: Stayer anklicken → wegschicken (−Rep)
    for (var si = 0; si < game.seats.length; si++) {
      var sc = game.seats[si];
      if (sc && sc.stayer) {
        var sx = seatX(si, game.seats.length);
        hits.push({ fkey: 'dismiss' + si, kind: 'dismiss', seat: si, x: sx - 26, y: SEAT_Y - 46, w: 52, h: 70,
          tip: '🚪 ' + sc.persona.name + ' bleibt den Abend. Anklicken = wegschicken (−' + Math.abs(core.CONFIG.DISMISS_REP) + ' Rep). Bleibt er die ganze Nacht: +' + core.CONFIG.STAYER_NIGHT_REP + ' Rep.' });
      }
    }
  }
  function hitAt(lx, ly) {
    for (var i = hits.length - 1; i >= 0; i--) { var h = hits[i]; if (lx >= h.x && lx <= h.x + h.w && ly >= h.y && ly <= h.y + h.h) return h; }
    return null;
  }
  function drawFocus(c) {
    var f;
    if (focusIdx >= 0) { f = focusHitIndex(focusList()[focusIdx]); if (f >= 0) { c.save(); c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2.5; c.shadowColor = '#4dd7e8'; c.shadowBlur = 12; c.setLineDash([6, 4]); rr(c, hits[f].x - 3, hits[f].y - 3, hits[f].w + 6, hits[f].h + 6, 8); c.stroke(); c.restore(); return; } }
    if (hoverZone) { c.save(); c.strokeStyle = 'rgba(77,215,232,0.7)'; c.lineWidth = 2; rr(c, hoverZone.x - 2, hoverZone.y - 2, hoverZone.w + 4, hoverZone.h + 4, 6); c.stroke(); c.restore(); }
  }
  function activateHit(h) {
    if (!h || !game || game.gameOver) return;
    if (h.kind === 'broth') core.pourBroth(game, core.BROTHS[h.i].id), sfx('Cook');
    else if (h.kind === 'topping') core.addTopping(game, core.TOPPINGS[h.i].id) && sfx('Cook');
    else if (h.kind === 'serve') core.serveBowl(game, aimSeat()) && sfx('Throw'), chefAnim = 0.4;
    else if (h.kind === 'fry') core.fryBatch(game) && sfx('Cook');
    else if (h.kind === 'dismiss') { if (core.dismissGuest(game, h.seat)) { sfx('Angry'); shake = 0.3; } }
    else if (h.kind === 'discard') core.discardBowl(game);
  }

  /* ---- Topbar + Log ---------------------------------------------------------- */
  function updateHud() {
    el.statNight.textContent = game.night + '/' + core.CONFIG.CAMPAIGN_NIGHTS;
    var info = core.phaseInfo(game);
    if (game.phase === 'night') {
      var h = 18 + (game.phaseClock / core.CONFIG.NIGHT_DURATION) * 8;
      var hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60);
      el.statClock.textContent = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
    } else el.statClock.textContent = '—';
    el.statCredits.textContent = Math.round(game.credits);
    el.statRepNum.textContent = Math.round(game.reputation);
    el.statRepFill.style.width = clamp01(game.reputation / 100) * 100 + '%';
    el.eventName.textContent = game.event ? (game.event.name) : ('Nacht ' + game.night);
    // Combo
    if (game.combo >= 2) { el.combo.classList.remove('hidden'); el.combo.textContent = game.combo + '× COMBO'; el.combo.style.animation = 'none'; void el.combo.offsetWidth; el.combo.style.animation = ''; }
    else el.combo.classList.add('hidden');
    // Log
    var last = game.log[game.log.length - 1];
    if (last && el._lastLog !== last) { el._lastLog = last; el.log.textContent = last; }
  }

  /* ---- Haupt-Render ---------------------------------------------------------- */
  function render() {
    var c = ctx(); var s = el.canvas._scale || 1;
    c.setTransform(s, 0, 0, s, 0, 0);
    c.clearRect(0, 0, W, H);
    if (shake > 0) c.translate((Math.random() - 0.5) * shake * 14, (Math.random() - 0.5) * shake * 14);
    drawRoom(c);
    drawMenuKiosk(c);
    // Stühle
    for (var i = 0; i < game.seats.length; i++) { var sx = seatX(i, game.seats.length); c.fillStyle = '#1b2740'; c.beginPath(); c.ellipse(sx, SEAT_Y + 40, 22, 8, 0, 0, 7); c.fill(); c.fillStyle = '#131c30'; c.fillRect(sx - 3, SEAT_Y + 40, 6, 12); }
    computeHits();
    drawFocus(c);
    drawKitchen(c);
    // Gäste (sortiert nach y für Überlappung)
    var guests = [];
    for (var g = 0; g < game.seats.length; g++) if (game.seats[g]) guests.push(game.seats[g]);
    guests.sort(function (a, b) { return (a._vy || 0) - (b._vy || 0); });
    for (var k = 0; k < guests.length; k++) drawGuest(c, guests[k]);
    // Chef-Gedanken-Blase
    if (chefThoughtText && chefThoughtAlpha > 0) {
      var cta = Math.min(1, chefThoughtAlpha);
      c.globalAlpha = cta * 0.8;
      c.font = '12px monospace';
      c.textAlign = 'center';
      var ctw = c.measureText(chefThoughtText).width + 20;
      var ctbx = WORK_BOWL.x - ctw / 2, ctsy = WORK_BOWL.y - 80;
      c.fillStyle = 'rgba(10, 16, 30, 0.85)';
      c.beginPath();
      c.roundRect(ctbx, ctsy, ctw, 24, 6);
      c.fill();
      c.strokeStyle = 'rgba(77, 215, 232, 0.3)';
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = 'rgba(200, 220, 240, 0.9)';
      c.fillText(chefThoughtText, WORK_BOWL.x, ctsy + 16);
      // kleiner Pfeil nach unten
      c.beginPath();
      c.moveTo(WORK_BOWL.x - 5, ctsy + 24);
      c.lineTo(WORK_BOWL.x, ctsy + 32);
      c.lineTo(WORK_BOWL.x + 5, ctsy + 24);
      c.fillStyle = 'rgba(10, 16, 30, 0.85)';
      c.fill();
      c.globalAlpha = 1;
    }
    drawTransit(c);
    drawAimLine(c);
    drawThrows(c);
    drawParticles(c);
    drawFloaters(c);
    // Intro-Overlay
    if (intro.active) drawIntro(c);
    if (paused) { c.fillStyle = 'rgba(4,6,12,0.7)'; c.fillRect(0, 0, W, H); c.font = 'bold 40px monospace'; c.textAlign = 'center'; c.fillStyle = '#4dd7e8'; c.fillText(T_('game.pause'), W / 2, H / 2); c.font = '14px monospace'; c.fillStyle = '#6f8b96'; c.fillText(T_('game.pauseHint'), W / 2, H / 2 + 30); }
    updateHud();
  }
  function drawIntro(c) {
    var t = intro.t;
    c.fillStyle = 'rgba(4,6,12,' + (t < intro.dur - 0.6 ? 0.35 : clamp01((t - (intro.dur - 0.6)) / 0.6) * 0.9) + ')';
    c.fillRect(0, 0, W, H);
    c.textAlign = 'center';
    if (t < 1.2) { c.font = 'bold 30px monospace'; c.fillStyle = '#ffb020'; c.fillText('🔑 AUFSCHLIESSEN…', W / 2, H / 2 - 20); }
    else if (t < 2.4) { c.font = 'bold 26px monospace'; c.fillStyle = '#4dd7e8'; c.fillText('Koch ' + game.chefEmoji + ' läuft zur Station', W / 2, H / 2 - 20); }
    else if (t < 3.2) { c.font = 'bold 26px monospace'; c.fillStyle = '#39ff88'; c.fillText('Täner an · Fritteuse warm', W / 2, H / 2 - 20); }
    else {
      var flick = 0.7 + 0.3 * Math.sin(t * 22) * (Math.random() < 0.15 ? 0.3 : 1);
      c.font = 'bold 34px monospace'; c.fillStyle = '#ff3b5c'; c.globalAlpha = flick;
      c.shadowColor = '#ff3b5c'; c.shadowBlur = 18;
      c.fillText('„' + game.barName.toUpperCase() + '" IST GEÖFFNET', W / 2, H / 2 - 20);
      c.shadowBlur = 0; c.globalAlpha = 1;
    }
    c.font = '13px monospace'; c.fillStyle = '#6f8b96'; c.fillText('Die erste Schicht beginnt gleich …', W / 2, H / 2 + 14);
  }

  /* ---- Input --------------------------------------------------------------- */
  function toLogical(ev) {
    var r = el.canvas.getBoundingClientRect();
    var dispW = r.width, dispH = r.height;
    var x = (ev.clientX - r.left) / dispW * W, y = (ev.clientY - r.top) / dispH * H;
    return { x: x, y: y };
  }
  function bindInput() {
    el.btnStart.addEventListener('click', startGame);
    el.btnRestart.addEventListener('click', function () { el.end.classList.add('hidden'); el.start.classList.remove('hidden'); game = null; });
    el.btnHelpClose.addEventListener('click', function () { el.help.classList.add('hidden'); });
    if (el.btnShopNext) el.btnShopNext.addEventListener('click', requestNextNight);
    // v2.9: Menü + Einstellungen
    if (el.btnMenu) el.btnMenu.addEventListener('click', function () { if (menuOpen) closeMenu(); else openMenu(); });
    if (el.menuResume) el.menuResume.addEventListener('click', closeMenu);
    if (el.menuQuit) el.menuQuit.addEventListener('click', function () {
      closeMenu();
      game = null;
      titleActive = true;
      el.end.classList.add('hidden');
      // v2.9.2-Fix: #game bleibt sichtbar im title-mode — sonst ist der Canvas 0×0
      el.game.classList.add('title-mode');
      if (audio) audio.stopAmbience && audio.stopAmbience();
    });
    if (el.menuSound) el.menuSound.addEventListener('click', function () {
      if (audio) { audio.setMute(!audio.muted); syncMenuUI(); }
    });
    if (el.menuMusicVol) el.menuMusicVol.addEventListener('input', function () {
      if (audio) audio.setMusicVolume(el.menuMusicVol.value / 100);
    });
    if (el.menuLang) el.menuLang.addEventListener('click', function () { toggleLang(); syncMenuUI(); });
    if (el.menuTrack) el.menuTrack.addEventListener('click', function () {
      titleTrack = titleTrack % 5 + 1;
      if (audio) { audio.setTitleTrack(titleTrack); }
      syncMenuUI(); sfx('Click');
    });
    document.addEventListener('keydown', function (e) {
      if (introPlaying) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); var io = global.DAMPF && global.DAMPF.intro; if (io) io.skip(); introPlaying = false; if (io) io.reset(); startTitleMusic(); }
        return;
      }
      if (titleActive && !game) {
        // Lorebook offen?
        if (lorebookOpen) {
          if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { lorebookOpen = false; return; }
          if (e.key === 'ArrowUp') { lorebookScroll = Math.max(0, lorebookScroll - 30); return; }
          if (e.key === 'ArrowDown') { lorebookScroll = Math.min(200, lorebookScroll + 30); return; }
          return;
        }
        var k0 = e.key.toLowerCase();
        var mc = hasPlayed ? 4 : 3;
        if (k0 === 'arrowup' || k0 === 'w') { titleMenuIdx = (titleMenuIdx + mc - 1) % mc; sfx('Click'); return; }
        if (k0 === 'arrowdown' || k0 === 's') { titleMenuIdx = (titleMenuIdx + 1) % mc; sfx('Click'); return; }
        if (k0 === 'enter' || k0 === ' ') {
          e.preventDefault();
          if (titleMenuIdx === 0) { titleActive = false; el.start.classList.remove('hidden'); }
          else if (titleMenuIdx === 1) { startIntroSequence(); }
          else if (titleMenuIdx === 2) { sfx('Click'); }
          else if (titleMenuIdx === 3) { lorebookOpen = true; lorebookScroll = 0; sfx('Click'); }
          return;
        }
        if (k0 >= '1' && k0 <= '5') { switchTitleTrack(+k0); return; }
        if (k0 === 'm') { if (audio) audio.setMute(!audio.muted); return; }
        if (k0 === 'l') { toggleLang(); return; }
        return;
      }
      // Start-Screen: Enter startet
      if (!el.start.classList.contains('hidden')) { if (e.key === 'Enter') { e.preventDefault(); startGame(); } return; }
      if (!el.end.classList.contains('hidden')) { if (e.key === 'Enter') { e.preventDefault(); el.btnRestart.click(); } return; }
      if (menuOpen) { if (e.key === 'Escape' || e.key === 'Enter') { closeMenu(); return; } return; }
      if (el.help.classList.contains('hidden') === false) { if (e.key === 'Escape' || e.key === '?') el.help.classList.add('hidden'); return; }
      var k = e.key.toLowerCase();
      if (k === '?') { el.help.classList.remove('hidden'); return; }
      if (k === 'escape') { toggleShop(); return; }
      if (k === 'm') { if (audio) audio.setMute(!audio.muted); return; }
      if (k === 'l') { toggleLang(); return; }
      if (k === 'p') { if (!menuOpen) paused = !paused; return; }
      if (k === 'c') { toggleShop(); return; }
      if (game && game.phase === 'between' && game.lastNight) {
        if (k === 'enter') { e.preventDefault(); requestNextNight(); }
        return;
      }
      if (!game || game.gameOver || paused) return;
      if (k >= '1' && k <= '4') { core.pourBroth(game, core.BROTHS[+k - 1].id); sfx('Cook'); }
      else if (KEY_TOP.indexOf(k) >= 0) { var i = KEY_TOP.indexOf(k); core.addTopping(game, core.TOPPINGS[i].id); sfx('Cook'); }
      else if (k === 'enter' || k === ' ') { e.preventDefault(); if (core.serveBowl(game, aimSeat())) { sfx('Throw'); chefAnim = 0.4; } }
      else if (k === 'r') { if (core.fryBatch(game)) sfx('Cook'); }
      else if (k === 'x') { core.discardBowl(game); }
    });
    el.canvas.addEventListener('click', function (e) {
      if (introPlaying) { var io = global.DAMPF && global.DAMPF.intro; if (io) io.skip(); introPlaying = false; if (io) io.reset(); startTitleMusic(); return; }
      if (titleActive && !game) {
        if (lorebookOpen) { lorebookOpen = false; return; }
        var p0 = toLogical(e);
        var menuY0 = 420;
        var mc0 = hasPlayed ? 4 : 3;
        for (var mi = 0; mi < mc0; mi++) {
          if (p0.x > 300 && p0.x < 660 && p0.y > menuY0 + mi * 36 - 18 && p0.y < menuY0 + mi * 36 + 10) {
            titleMenuIdx = mi;
            if (mi === 0) { titleActive = false; el.start.classList.remove('hidden'); }
            else if (mi === 1) { startIntroSequence(); }
            else if (mi === 2) { sfx('Click'); }
            else if (mi === 3) { lorebookOpen = true; lorebookScroll = 0; sfx('Click'); }
            sfx('Click');
            return;
          }
        }
        return;
      }
      if (!game || game.gameOver || intro.active) return;
      var p = toLogical(e); activateHit(hitAt(p.x, p.y));
    });
    el.canvas.addEventListener('mousemove', function (e) {
      var p = toLogical(e); mouseX = p.x; mouseY = p.y;
      if (!game || game.gameOver) return;
      hoverZone = hitAt(p.x, p.y);
      if (hoverZone) {
        el.tooltip.textContent = hoverZone.tip;
        el.tooltip.classList.remove('hidden');
        var tx = Math.min(window.innerWidth - 270, e.clientX + 14), ty = Math.max(8, e.clientY - 10);
        el.tooltip.style.left = tx + 'px'; el.tooltip.style.top = ty + 'px';
      } else el.tooltip.classList.add('hidden');
    });
    el.canvas.addEventListener('mouseleave', function () { hoverZone = null; el.tooltip.classList.add('hidden'); });
    // data-tip Tooltips (Topbar/Shop)
    document.addEventListener('mouseover', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
      if (t) { el.tooltip.textContent = t.getAttribute('data-tip'); el.tooltip.classList.remove('hidden'); var r = t.getBoundingClientRect(); el.tooltip.style.left = Math.min(window.innerWidth - 270, r.left) + 'px'; el.tooltip.style.top = (r.bottom + 6) + 'px'; }
    });
    document.addEventListener('mouseout', function (e) { var t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null; if (t) el.tooltip.classList.add('hidden'); });
  }

  /* ---- roundRect Polyfill (Safari < 16) ----------------------------------- */
  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === 'number') r = [r, r, r, r];
      this.moveTo(x + r[0], y);
      this.lineTo(x + w - r[1], y);
      this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
      this.lineTo(x + w, y + h - r[2]);
      this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
      this.lineTo(x + r[3], y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
      this.lineTo(x, y + r[0]);
      this.quadraticCurveTo(x, y, x + r[0], y);
      this.closePath();
      return this;
    };
  }

  /* ---- v2.9: Titelbildschirm + Anime-Intro -------------------------------- */
  var titleActive = true;
  var titleMenuIdx = 0;
  var titleTrack = 1;
  var introPlaying = false;
  var titleSteam = [];
  for (var _si = 0; _si < 30; _si++) titleSteam.push({ x: 350 + Math.random() * 260, y: 400 + Math.random() * 200, speed: 20 + Math.random() * 30, size: 4 + Math.random() * 8, phase: Math.random() * 6.28 });
  /* ---- v2.9: I18N (DE/EN) -------------------------------------------------- */
  var I18N = {
    de: {
      hud: { night: "Nacht", time: "Uhr", currency: "€", rep: "Reputation", goal: "€-Ziel" },
      shop: { stock: "Vorrat", upgrades: "Upgrades", price: "Preisniveau", nextNight: "Nächste Nacht", kitchen: "Küche — Nudelbar" },
      game: { ready: "BEREIT", serve: "SERVIEREN", entrance: "EINGANG", menu: "SPEISEKARTE", pause: "PAUSE", pauseHint: "P zum Fortsetzen · ? Hilfe", dialogTitle: "Gast fragt", dialogHint: "Klick = Antwort · 12 s Zeitlimit, sonst antworte ich neutral" },
      title: { start: "Schicht beginnen", intro: "Intro ansehen", chronicle: "Stammgast-Chronik", tagline: "Die Stadt fröstelt. Der Dashi nicht.", controls: "↑↓ wählen · Enter starten · M Ton" }
    },
    en: {
      hud: { night: "Night", time: "Time", currency: "€", rep: "Reputation", goal: "€ Goal" },
      shop: { stock: "Stock", upgrades: "Upgrades", price: "Price Level", nextNight: "Next Night", kitchen: "Kitchen — Noodle Bar" },
      game: { ready: "READY", serve: "SERVE", entrance: "ENTRANCE", menu: "MENU", pause: "PAUSE", pauseHint: "P to resume · ? Help", dialogTitle: "Guest asks", dialogHint: "Click to answer · 12 s limit, then I answer neutral" },
      title: { start: "Start Shift", intro: "Watch Intro", chronicle: "Regulars Chronicle", tagline: "The city shivers. The dashi doesn't.", controls: "↑↓ select · Enter start · M sound" }
    }
  };
  var lang = 'de';
  function T_(key) {
    var parts = key.split('.');
    var obj = I18N[lang];
    for (var i = 0; i < parts.length; i++) { obj = obj && obj[parts[i]]; }
    return obj || key;
  }
  /* ---- v2.9: Menü + Einstellungen ---------------------------------------- */
  var menuOpen = false;
  var TITLE_TRACK_NAMES2 = { 1: 'City Pop', 2: 'Neon Rain', 3: 'Dashi', 4: 'Concrete', 5: 'Morning' };

  function openMenu() {
    if (!game) return;
    menuOpen = true;
    paused = true;
    el.menu.classList.remove('hidden');
    syncMenuUI();
  }
  function closeMenu() {
    menuOpen = false;
    paused = false;
    el.menu.classList.add('hidden');
  }
  function syncMenuUI() {
    if (!audio) return;
    el.menuSound.textContent = audio.muted ? 'AUS' : 'AN';
    el.menuLang.textContent = lang.toUpperCase();
    el.menuTrack.textContent = titleTrack + ' · ' + (TITLE_TRACK_NAMES2[titleTrack] || '?');
  }

  function toggleLang() {
    lang = lang === 'de' ? 'en' : 'de';
    var statKs = document.querySelectorAll('.stat-k');
    if (statKs.length >= 5) {
      statKs[0].textContent = T_('hud.night');
      statKs[1].textContent = T_('hud.time');
      statKs[2].textContent = T_('hud.currency');
      statKs[3].innerHTML = T_('hud.rep') + ' <span id="stat-rep-num">' + (game ? Math.round(game.reputation) : 10) + '</span>/100';
      statKs[4].textContent = T_('hud.goal');
    }
    sfx('Click');
  }

  var CHEF_THOUGHTS = [
    'Die Brühe weiß, was sie tut.',
    'Noch drei Minuten. Dann ist es perfekt.',
    'Er wartet. Ich auch. Wir sind gleich.',
    'Regen auf dem Dach. Wie kleine Hände.',
    'Sie beobachtet mich. Immer. Die Katze.',
    'Nudeln sind Geduld in fester Form.',
    'Heute kocht die Stadt mit.',
    'Leere Schüssel. Bester Klang der Welt.'
  ];
  var chefThoughtTimer = 0;
  var chefThoughtText = '';
  var chefThoughtAlpha = 0;

  var lorebookOpen = false;
  var lorebookScroll = 0;
  var hasPlayed = false; // localStorage: mindestens 1 Nacht gespielt
  try { hasPlayed = localStorage.getItem('nudelbar_played') === '1'; } catch(e) {}

  var TITLE_MENU = ['Schicht beginnen', 'Intro ansehen', 'Stammgast-Chronik'];
  var TITLE_TRACK_NAMES = { 1: 'City Pop', 2: 'Neon Rain', 3: 'Dashi', 4: 'Concrete', 5: 'Morning' };

  function renderLorebook(c) {
    c.fillStyle = 'rgba(4, 6, 12, 0.97)';
    c.fillRect(0, 0, W, H);
    c.textAlign = 'center';
    c.font = 'bold 24px monospace';
    c.fillStyle = 'rgba(77, 215, 232, 0.8)';
    c.fillText('ENTWICKLUNG', 480, 50);
    c.font = '11px monospace';
    c.fillStyle = 'rgba(120, 140, 160, 0.5)';
    c.fillText('Die Geschichte hinter der Bar', 480, 72);

    var entries = core.LOREBOOK;
    var unlocked = hasPlayed ? entries.length : 1; // ohne Spiel: nur Eintrag 1
    var y = 100 - lorebookScroll;
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var isUnlocked = hasPlayed && (game ? game.night >= e.night : true);
      if (!hasPlayed && i > 0) isUnlocked = false;
      c.font = 'bold 13px monospace';
      c.fillStyle = isUnlocked ? 'rgba(200, 220, 240, 0.9)' : 'rgba(80, 90, 100, 0.4)';
      c.fillText(isUnlocked ? e.title : '🔒 Nacht ' + e.night, 480, y);
      if (isUnlocked) {
        c.font = '12px monospace';
        c.fillStyle = 'rgba(160, 180, 200, 0.7)';
        var lines = e.text.split('\n');
        for (var li = 0; li < lines.length; li++) {
          c.fillText(lines[li], 480, y + 18 + li * 16);
        }
        y += 18 + lines.length * 16 + 16;
      } else {
        y += 30;
      }
    }
    // Scroll-Hinweis
    c.font = '10px monospace';
    c.fillStyle = 'rgba(100, 120, 140, 0.4)';
    c.fillText('↑↓ scrollen · Esc/Enter schließen', 480, 600);
  }

  function renderTitle(c) {
    c.fillStyle = '#060a14';
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(200, 220, 255, 0.15)';
    for (var i = 0; i < 40; i++) {
      var sx = (i * 137 + 50) % 960, sy = (i * 89 + 20) % 300;
      var tw = 0.3 + 0.7 * Math.abs(Math.sin(T.time * 0.5 + i * 1.3));
      c.globalAlpha = tw * 0.3;
      c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1;
    for (var j = 0; j < titleSteam.length; j++) {
      var p = titleSteam[j];
      p.y -= p.speed * 0.016;
      p.x += Math.sin(T.time * 0.8 + p.phase) * 0.3;
      if (p.y < 100) { p.y = 500 + Math.random() * 100; p.x = 350 + Math.random() * 260; }
      var a = Math.max(0, 0.15 - (500 - p.y) / 2000);
      c.fillStyle = 'rgba(200, 220, 255, ' + a + ')';
      c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill();
    }
    var flicker = 0.85 + 0.15 * Math.sin(T.time * 7) * Math.sin(T.time * 3.1);
    var logoY = 200;
    c.textAlign = 'center';
    c.font = 'bold 72px monospace';
    c.fillStyle = 'rgba(77, 215, 232, ' + (0.15 * flicker) + ')';
    c.fillText('NUDELBAR', 484, logoY + 4);
    c.fillStyle = 'rgba(77, 215, 232, ' + (0.3 * flicker) + ')';
    c.fillText('NUDELBAR', 482, logoY + 2);
    c.fillStyle = 'rgba(77, 215, 232, ' + flicker + ')';
    c.fillText('NUDELBAR', 480, logoY);
    c.font = '14px monospace';
    c.fillStyle = 'rgba(180, 200, 220, 0.6)';
    c.fillText(T_('title.tagline'), 480, logoY + 35);

    // Dev-Story (Lead Dev, Bass-Performance)
    var devStory = [
      'Gestern war das hier ein 200-Zeilen-HTML-File.',
      'Vier KI-Hirne haben an dieser Bar geschraubt.',
      'Die Katze kam in v2.8. Sie war nie geplant.',
      'Jede Version sah anders aus. Diese hier ist die,',
      'die du erwischt hast. Danke fürs Kochen.'
    ];
    c.font = '11px monospace';
    c.fillStyle = 'rgba(120, 140, 160, 0.45)';
    for (var ds = 0; ds < devStory.length; ds++) {
      c.fillText(devStory[ds], 480, logoY + 60 + ds * 16);
    }
    // Version-Fußzeile
    c.fillStyle = 'rgba(100, 120, 140, 0.3)';
    c.font = '10px monospace';
    c.fillText('v2.9 — Die Katze war nie geplant. Jetzt ist sie im Code.', 480, logoY + 60 + devStory.length * 16 + 8);
    var catX = 340, catY = logoY - 15;
    c.font = '28px serif';
    c.fillText('\ud83d\udc31', catX, catY);
    c.strokeStyle = 'rgba(200, 180, 160, 0.4)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(catX + 18, catY - 5, 8, -0.5 + Math.sin(T.time * 3) * 0.3, 1.2 + Math.sin(T.time * 3) * 0.3);
    c.stroke();
    var menuY = 420;
    c.font = '18px monospace';
    var menuLabels = [T_('title.start'), T_('title.intro'), T_('title.chronicle')];
    if (hasPlayed) menuLabels.push('Entwicklung');
    var menuCount = menuLabels.length;
    for (var m = 0; m < menuCount; m++) {
      var selected = (m === titleMenuIdx);
      c.fillStyle = selected ? 'rgba(57, 255, 136, 0.9)' : 'rgba(150, 170, 190, 0.5)';
      var prefix = selected ? '\u25b6 ' : '  ';
      c.fillText(prefix + menuLabels[m], 480, menuY + m * 36);
    }
    c.font = '12px monospace';
    c.fillStyle = 'rgba(150, 170, 190, 0.4)';
    c.fillText('\u266a Track ' + titleTrack + ': ' + (TITLE_TRACK_NAMES[titleTrack] || '?') + '  [1\u20135 wechseln]', 480, 555);
    c.fillStyle = 'rgba(100, 120, 140, 0.3)';
    c.font = '11px monospace';
    c.fillText(T_('title.controls') + ' \u00b7 L ' + (lang === 'de' ? 'Sprache' : 'Language'), 480, 590);
  }

  function renderIntroScene(c) {
    var intro = global.DAMPF && global.DAMPF.intro;
    if (!intro) { renderTitle(c); return; }
    intro.draw(c);
    if (intro.done) { introPlaying = false; intro.reset(); }
  }

  function startIntroSequence() {
    var intro = global.DAMPF && global.DAMPF.intro;
    if (!intro) return;
    intro.reset();
    introPlaying = true;
    if (audio) audio.stopTitleMusic();
  }

  function startTitleMusic() {
    if (!audio) return;
    audio.init(); audio.resume();
    audio.setTitleTrack(titleTrack);
    audio.startTitleMusic();
  }

  function switchTitleTrack(n) {
    if (n < 1 || n > 5) return;
    titleTrack = n;
    if (audio) {
      audio.setTitleTrack(n);
      audio.stopTitleMusic();
      setTimeout(function () { if (titleActive && !introPlaying) startTitleMusic(); }, 200);
    }
    sfx('Click');
  }

  /* ---- Schleife -------------------------------------------------------------- */
  var last = 0;
  function frame(ts) {
    if (!last) last = ts;
    var dt = (ts - last) / 1000; last = ts; if (dt > 0.1) dt = 0.1;
    T.time += dt;
    if (game && !paused) {
      var inShop = !intro.active && game.phase === 'between' && game.lastNight !== null && !shopSkip;
      if (!intro.active && !inShop) tickGame(dt);   // Bürozeit: Welt pausiert, bis „Nächste Nacht“
      if (audio && game.phase === 'night') audio.updateIMUSE(game);
      if (shopSkip && game.phase !== 'between') shopSkip = false;
      updateFX(dt);
      updateIntro(dt);
      // Overlay-Logik
      if (game.gameOver) { showEndOnce(); }      // Endbild bleibt, bis der Spieler weiterspielt
      else if (game.phase === 'between' && game.lastNight !== null) {
        if (!shopOpen) { shopOpen = true; el.shop.classList.remove('hidden'); renderShop(); }
      }
      else { if (shopOpen) { shopOpen = false; el.shop.classList.add('hidden'); } }
    }
    if (introPlaying && !game) { var introObj = global.DAMPF && global.DAMPF.intro; if (introObj) introObj.update(dt); }
    // Chef-Gedanken: alle 12-20s ein neuer Gedanke
    if (game && game.phase === 'night' && !paused) {
      chefThoughtTimer += dt;
      if (chefThoughtTimer > 12 + Math.random() * 8 && !chefThoughtText) {
        chefThoughtText = CHEF_THOUGHTS[Math.floor(Math.random() * CHEF_THOUGHTS.length)];
        chefThoughtAlpha = 1;
        chefThoughtTimer = 0;
      }
      if (chefThoughtText) {
        chefThoughtAlpha -= dt * 0.3;
        if (chefThoughtAlpha <= 0) { chefThoughtText = ''; chefThoughtAlpha = 0; }
      }
    }
    updateGamepad(dt);
    if (game) render();
    else if (introPlaying) { var c2 = ctx(); c2.setTransform(el.canvas._scale || 1, 0, 0, el.canvas._scale || 1, 0, 0); renderIntroScene(c2); }
    else if (lorebookOpen) { var c4 = ctx(); c4.setTransform(el.canvas._scale || 1, 0, 0, el.canvas._scale || 1, 0, 0); renderLorebook(c4); }
    else { var c3 = ctx(); c3.setTransform(el.canvas._scale || 1, 0, 0, el.canvas._scale || 1, 0, 0); renderTitle(c3); }
    requestAnimationFrame(frame);
  }
  var endShown = false;
  function showEndOnce() { if (!endShown) { endShown = true; showEnd(); } }
  function resetFlags() { endShown = false; shopOpen = false; shopSkip = false; focusIdx = -1; }

  /* ---- Init ------------------------------------------------------------------ */
  function init() {
    try {
      buildChefPicker(); buildPricePicker(); buildTouchpad(); bindInput();
      if (el.barName) el.barName.addEventListener('input', function () { if (el.nameLive) el.nameLive.textContent = (el.barName.value.trim() || 'deine Nudelbar'); });
    } catch (err) {
      console.error('NUDELBAR init-Fehler (UI):', err);
    }
    // Der Render-Loop startet IMMER — auch wenn UI-Aufbau fehlschlägt (Black-Screen-Schutz)
    fitCanvas(); window.addEventListener('resize', fitCanvas);
    requestAnimationFrame(frame);
  }
  var _audioUnlocked = false;
  function _unlockAudio() {
    if (_audioUnlocked) return;
    _audioUnlocked = true;
    if (audio) { audio.init(); audio.resume(); }
    if (titleActive && !introPlaying) startTitleMusic();
  }
  document.addEventListener('pointerdown', _unlockAudio);
  document.addEventListener('keydown', _unlockAudio);

  // Neustart-Reset: resetFlags bei neuem Spiel
  var _start = startGame;
  startGame = function () { resetFlags(); _start(); };
  init();
})();
