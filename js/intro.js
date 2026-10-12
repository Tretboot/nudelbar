/* =============================================================================
  NUDELBAR — Anime-Prolog v2.9.2 (Retro-Isometrisch, PC-98/Amiga-Vibe)
  3 Szenen: Kalte Stadt / Warmes Licht / Der Meister
  - Scanline-Overlay, Dither-Noise, Neon-Flackern, Regen, Dampf
  - Typewriter-Text, Fade-Transitions, Leertaste/Klick = skip
  UMD-Modul, kein Zugriff auf core.js-Game-State.
============================================================================= */
(function (global) {
  'use strict';

  var I = global.DAMPF = global.DAMPF || {};
  var W = 960, H = 620;

  var SCENES = [
    { duration: 5.5, text: '4:12 Uhr morgens. Der Atem hängt wie Glas in der Luft.\nDie Stadt schläft noch. Der Beton wartet schon.', draw: drawScene1 },
    { duration: 5.5, text: 'Am Ende der Gasse glüht genau ein Fenster.\nEs riecht nach Dashi, Sesam, Dampf — nach Hause.', draw: drawScene2 },
    { duration: 6.5, text: 'Drei Stunden Schlaf reichen.\nWer hungrig vor meiner Theke steht, bekommt\ndas Beste, was ich habe.', draw: drawScene3 }
  ];

  /* ---- Regen-Partikel-Pool (pre-allocated, null Allokationen/Frame) -------- */
  var RAIN_COUNT = 180;
  var rain = [];
  for (var i = 0; i < RAIN_COUNT; i++) {
    rain.push({ x: Math.random() * W, y: Math.random() * H, speed: 540 + Math.random() * 360, len: 8 + Math.random() * 8, a: 0.35 + Math.random() * 0.35 });
  }
  var SPLASH_COUNT = 30;
  var splashes = [];
  for (var si = 0; si < SPLASH_COUNT; si++) splashes.push({ x: Math.random() * W, t: Math.random() * 0.4 });

  function updateRain(dt) {
    for (var i = 0; i < RAIN_COUNT; i++) {
      var p = rain[i];
      p.y += p.speed * dt; p.x -= p.speed * 0.36 * dt; // ~20° nach links unten
      if (p.y > H) { p.y = -10; p.x = Math.random() * (W + 100); }
      if (p.x < -10) p.x = W + 10;
    }
    for (var s = 0; s < SPLASH_COUNT; s++) {
      splashes[s].t += dt;
      if (splashes[s].t > 0.4) { splashes[s].t = 0; splashes[s].x = Math.random() * W; }
    }
  }

  function drawRain(c, alpha) {
    c.lineWidth = 1;
    for (var i = 0; i < RAIN_COUNT; i++) {
      var p = rain[i];
      c.strokeStyle = 'rgba(90, 107, 140, ' + (p.a * alpha) + ')';
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + p.len * 0.36, p.y + p.len);
      c.stroke();
    }
    // Ground-Splashes
    for (var s = 0; s < SPLASH_COUNT; s++) {
      var sp = splashes[s];
      var r = 1 + (sp.t / 0.4) * 3;
      c.strokeStyle = 'rgba(125, 155, 196, ' + (0.3 * (1 - sp.t / 0.4) * alpha) + ')';
      c.beginPath();
      c.ellipse(sp.x, H - 20, r, r * 0.4, 0, 0, Math.PI * 2);
      c.stroke();
    }
  }

  /* ---- Scanline-Overlay + Dither (Retro-Look) ------------------------------ */
  function drawScanlines(c, t) {
    c.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (var y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
    // Dither-Noise (10 fps Refresh)
    if (Math.floor(t * 10) % 2 === 0) {
      c.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (var n = 0; n < 60; n++) c.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1, 1);
    }
  }

  /* ---- Typewriter ---------------------------------------------------------- */
  function drawTypewriter(c, text, t, cps) {
    var total = Math.floor(t * cps);
    if (total > text.length) total = text.length;
    var shown = text.substring(0, total);
    var lines = shown.split('\n');
    c.fillStyle = 'rgba(220, 230, 240, 0.92)';
    c.font = '17px monospace';
    c.textAlign = 'center';
    var startY = 510;
    for (var i = 0; i < lines.length; i++) c.fillText(lines[i], 480, startY + i * 26);
    if (total < text.length && Math.floor(t * 3) % 2 === 0) {
      var lastLine = lines[lines.length - 1];
      var cx = 480 + c.measureText(lastLine).width / 2 + 4;
      c.fillRect(cx, startY + (lines.length - 1) * 26 - 13, 9, 17);
    }
  }

  /* ---- Szene 1: Kalte Stadt (isometrische Skyline + Neon) ------------------ */
  function drawScene1(c, t, alpha) {
    // Himmel: vertikaler Gradient
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#060913'); g.addColorStop(1, '#0a1022');
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // Skyline: ~50 Silhouetten mit isometrischen Kanten
    var drift = 2 + 1.5 * Math.sin(t * 0.1);
    for (var i = 0; i < 50; i++) {
      var bw = 18 + (i * 37 % 40);
      var bh = 120 + (i * 53 % 220);
      var bx = ((i * 41 + drift) % (W + 60)) - 30;
      var by = H - 60 - bh;
      c.fillStyle = '#0b1226';
      c.fillRect(bx, by, bw, bh);
      // Iso-Kante (dunkles Parallelogramm)
      c.fillStyle = '#070b16';
      c.beginPath();
      c.moveTo(bx + bw, by); c.lineTo(bx + bw + 8, by - 4);
      c.lineTo(bx + bw + 8, by + bh - 4); c.lineTo(bx + bw, by + bh);
      c.fill();
      // Fenster (12% blinken)
      for (var wy = 0; wy < 4; wy++) for (var wx = 0; wx < 3; wx++) {
        var fi = i * 12 + wy * 3 + wx;
        if (fi % 8 === 0) {
          var fa = 0.5 + 0.5 * Math.sin(t * 10 + fi);
          c.fillStyle = 'rgba(255, 209, 102, ' + (fa * 0.7) + ')';
        } else c.fillStyle = '#1f2c4d';
        c.fillRect(bx + 4 + wx * 6, by + 8 + wy * 10, 3, 4);
      }
    }

    // Neon-Schild "NUDEL" + ラーメン (flackert)
    var flick = 0.85 + 0.15 * Math.sin(t * 11.3);
    if (Math.random() < 0.02) flick = 0.2; // 1-Frame-Blackout
    c.save();
    c.font = 'bold 40px monospace';
    c.textAlign = 'center';
    c.shadowColor = '#ff4d9d'; c.shadowBlur = 12;
    c.fillStyle = 'rgba(255, 77, 157, ' + flick + ')';
    c.fillText('NUDEL', 760, 200);
    c.font = '20px serif';
    c.fillText('ラーメン', 760, 230);
    c.restore();
    // Spiegelung im nassen Boden
    c.save();
    c.globalAlpha = 0.25 * flick;
    c.translate(0, (H - 60) * 2); c.scale(1, -0.3);
    c.font = 'bold 40px monospace'; c.textAlign = 'center';
    c.fillStyle = '#ff4d9d'; c.fillText('NUDEL', 760, 200);
    c.restore();

    // Nasser Boden
    c.fillStyle = 'rgba(20, 30, 50, 0.5)';
    c.fillRect(0, H - 60, W, 60);

    drawRain(c, alpha);
    drawScanlines(c, t);
  }

  /* ---- Szene 2: Warmes Licht (Fenster + Schale + Dampf) -------------------- */
  function drawScene2(c, t, alpha) {
    // Raum: warmer Verlauf
    var g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#140f0a'); g.addColorStop(1, '#2a1a0e');
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // Fenster (beschlagen, Regen drin)
    c.fillStyle = '#0a0e18';
    c.fillRect(360, 120, 240, 280);
    c.strokeStyle = '#3b2a1a'; c.lineWidth = 6;
    c.strokeRect(360, 120, 240, 280);
    c.beginPath(); c.moveTo(480, 120); c.lineTo(480, 400); c.moveTo(360, 260); c.lineTo(600, 260); c.stroke();
    // Regentropfen am Glas
    for (var d = 0; d < 40; d++) {
      var dx = 365 + (d * 53 % 230);
      var dy = 125 + ((d * 31 + t * 40) % 270);
      c.fillStyle = 'rgba(125, 155, 196, 0.4)';
      c.fillRect(dx, dy, 2, 4);
    }

    // Lampe (Radial-Glow, oszilliert)
    var lr = 260 + 6 * Math.sin(t * 7);
    var lg = c.createRadialGradient(480, 180, 10, 480, 180, lr);
    lg.addColorStop(0, 'rgba(255, 179, 71, 0.55)'); lg.addColorStop(1, 'rgba(255, 179, 71, 0)');
    c.fillStyle = lg; c.fillRect(0, 0, W, H);

    // Schale (Fokus, Anime-Silhouette)
    var sy = 420;
    c.fillStyle = '#d94f4f';
    c.beginPath(); c.ellipse(480, sy, 70, 26, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffe8cf';
    c.beginPath(); c.ellipse(480, sy - 4, 58, 18, 0, 0, Math.PI * 2); c.fill();
    // Nudeln: 5 gelbe Wellenlinien
    c.strokeStyle = 'rgba(245, 200, 106, 0.9)'; c.lineWidth = 3;
    for (var n = 0; n < 5; n++) {
      c.beginPath();
      for (var nx = -40; nx <= 40; nx += 4) {
        var ny = sy - 8 + Math.sin(nx * 0.2 + n) * 4 + n * 2;
        if (nx === -40) c.moveTo(480 + nx, ny); else c.lineTo(480 + nx, ny);
      }
      c.stroke();
    }

    // Dampf (Haupteffekt: 8-10 Partikel, Wellen-Pfad)
    for (var st = 0; st < 10; st++) {
      var prog = (t * 0.8 + st * 0.1) % 1;
      var sx = 480 + Math.sin(t * 2 + st * 0.5) * 10 + (st - 5) * 8;
      var syy = sy - 20 - prog * 120;
      var sa = 0.35 * (1 - prog);
      var ss = 3 + prog * 11;
      c.fillStyle = 'rgba(255, 245, 230, ' + sa + ')';
      c.beginPath(); c.arc(sx, syy, ss, 0, Math.PI * 2); c.fill();
    }

    // Thekenkante (Neon-Glow) + OFFEN-Schild
    c.save();
    c.shadowColor = '#ffd166'; c.shadowBlur = 6;
    c.fillStyle = '#ffd166'; c.fillRect(0, H - 40, W, 2);
    c.restore();
    var oa = 0.5 + 0.5 * Math.sin(t * 3);
    c.fillStyle = 'rgba(255, 92, 92, ' + oa + ')';
    c.beginPath(); c.arc(120, 100, 6, 0, Math.PI * 2); c.fill();
    c.font = '14px monospace'; c.textAlign = 'left';
    c.fillStyle = 'rgba(255, 209, 102, 0.8)'; c.fillText('OFFEN', 135, 105);

    drawScanlines(c, t);
  }

  /* ---- Szene 3: Der Meister (isometrische Küche + Kelle) -------------------- */
  function drawScene3(c, t, alpha) {
    // Küche: isometrische Bodenfliesen
    c.fillStyle = '#1a120b'; c.fillRect(0, 0, W, H);
    for (var row = 0; row < 12; row++) {
      for (var col = 0; col < 16; col++) {
        var fx = col * 70 + (row % 2) * 35 - 35;
        var fy = 380 + row * 22;
        c.fillStyle = (row + col) % 2 ? '#241812' : '#2c1f16';
        c.beginPath();
        c.moveTo(fx + 35, fy); c.lineTo(fx + 70, fy + 11);
        c.lineTo(fx + 35, fy + 22); c.lineTo(fx, fy + 11);
        c.fill();
      }
    }

    // Theke (isometrisch)
    c.fillStyle = '#6b3f22'; c.fillRect(280, 320, 400, 60);
    c.fillStyle = '#4a2b18';
    c.beginPath(); c.moveTo(680, 320); c.lineTo(700, 310); c.lineTo(700, 370); c.lineTo(680, 380); c.fill();
    c.fillStyle = '#120c08'; c.fillRect(280, 380, 400, 4);

    // Topf (Brühen-Glow)
    c.fillStyle = '#2b2b33';
    c.beginPath(); c.ellipse(480, 320, 75, 24, 0, 0, Math.PI * 2); c.fill();
    var bg = 0.4 + 0.2 * Math.sin(t * 1.5);
    c.fillStyle = 'rgba(255, 209, 102, ' + bg + ')';
    c.beginPath(); c.ellipse(480, 316, 62, 17, 0, 0, Math.PI * 2); c.fill();

    // Der Meister (Rücken 3/4, Anime-Silhouette)
    c.fillStyle = '#1a120b';
    c.beginPath(); c.ellipse(480, 250, 45, 55, 0, 0, Math.PI * 2); c.fill(); // Körper
    c.fillStyle = '#0a0805';
    c.beginPath(); c.arc(480, 195, 26, 0, Math.PI * 2); c.fill(); // Kopf
    c.beginPath(); c.arc(480, 172, 12, 0, Math.PI * 2); c.fill(); // Haar-Bun
    c.fillStyle = '#e0d5c3'; // Schürze
    c.fillRect(455, 250, 50, 60);

    // Kelle (rotiert) + Gusstrahl
    var kr = -0.3 + 0.25 * Math.sin(t * 2.2);
    c.save();
    c.translate(540, 280); c.rotate(kr);
    c.strokeStyle = '#8a7a5a'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(50, -40); c.stroke();
    c.fillStyle = '#6a5a3a';
    c.beginPath(); c.ellipse(0, 0, 16, 9, 0.3, 0, Math.PI * 2); c.fill();
    c.restore();
    // Gusstrahl (weiße Linie + Splash)
    c.strokeStyle = 'rgba(255, 245, 230, 0.7)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(540, 280); c.lineTo(490, 316); c.stroke();
    for (var sp = 0; sp < 6; sp++) {
      var spx = 490 + Math.sin(t * 5 + sp) * 8;
      var spy = 316 + Math.abs(Math.sin(t * 4 + sp)) * 6;
      c.fillStyle = 'rgba(255, 245, 230, 0.5)';
      c.beginPath(); c.arc(spx, spy, 2, 0, Math.PI * 2); c.fill();
    }

    // Licht-Punkte im Dampf (twinkle)
    for (var lt = 0; lt < 3; lt++) {
      var ltx = 440 + lt * 40 + Math.sin(t + lt) * 10;
      var lty = 280 - lt * 20;
      var lta = Math.pow(Math.sin(t * 4 + lt), 2);
      c.fillStyle = 'rgba(255, 209, 102, ' + lta + ')';
      c.beginPath(); c.arc(ltx, lty, 2, 0, Math.PI * 2); c.fill();
    }

    // RAMEN-Schild (pulsierend)
    c.save();
    c.shadowColor = '#ff5c5c'; c.shadowBlur = 8;
    c.font = 'bold 22px monospace'; c.textAlign = 'center';
    c.fillStyle = 'rgba(255, 92, 92, ' + (0.7 + 0.3 * Math.sin(t * 2)) + ')';
    c.fillText('RAMEN', 820, 120);
    c.restore();

    drawScanlines(c, t);
  }

  /* ---- Intro-Controller ---------------------------------------------------- */
  function IntroController() {
    this.scene = 0; this.t = 0; this.done = false; this.fading = false; this.fadeT = 0;
  }
  IntroController.prototype.reset = function () { this.scene = 0; this.t = 0; this.done = false; this.fading = false; this.fadeT = 0; };
  IntroController.prototype.update = function (dt) {
    if (this.done) return;
    this.t += dt;
    var sc = SCENES[this.scene];
    if (!sc) { this.done = true; return; }
    var fadeStart = sc.duration - 0.8;
    if (this.t > fadeStart && !this.fading) { this.fading = true; this.fadeT = 0; }
    if (this.fading) {
      this.fadeT += dt;
      if (this.fadeT >= 0.8) {
        this.fading = false; this.fadeT = 0; this.scene++; this.t = 0;
        if (this.scene >= SCENES.length) this.done = true;
      }
    }
    updateRain(dt);
  };
  IntroController.prototype.draw = function (c) {
    if (this.done) return;
    var sc = SCENES[this.scene];
    if (!sc) return;
    var alpha = 1;
    if (this.fading) alpha = 1 - this.fadeT / 0.8;
    if (this.t < 0.5) alpha *= this.t / 0.5;
    c.save();
    c.globalAlpha = alpha;
    sc.draw(c, this.t, alpha);
    if (this.t > 1.0) drawTypewriter(c, sc.text, this.t - 1.0, 22);
    c.globalAlpha = 0.4;
    c.fillStyle = '#8899aa'; c.font = '11px monospace'; c.textAlign = 'right';
    c.fillText('[ Leertaste / Klick — überspringen ]', 940, 600);
    c.restore();
  };
  IntroController.prototype.skip = function () { this.done = true; };

  I.intro = new IntroController();
  I.intro.SCENES = SCENES;
})(typeof window !== 'undefined' ? window : this);
