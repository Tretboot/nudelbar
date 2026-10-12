/* =============================================================================
  NUDELBAR — Audio Engine v2.9.2.5 (iMUSE-Light + 5 Titel-Tracks)
  - Stem 1 (Ambient): Shamisen-Drone, läuft dauerhaft
  - Stem 2 (Rhythmus): Walzer-Akkorde + Bass, guest-gated (Code: ab 1 Gast; die alte Doku sagte „Gäste ≥ 2" — 1 oder 2 anhören = Audio-QA, siehe AUDIO.md)
  - Stem 3 (Peak): Arps + Percussion, combo/rush-gated
  - 5 Titel-Tracks (City-Pop, Neon-Rain, Dashi, Concrete, Morning)
  - 17 SFX (v2.9.2.2: sfxReady/sfxDeliver gestrichen; Think/Phone/Bad/ZenJiru/Dispatch verdrahtet)
  Alle Sounds synthetisch. Kein Asset nötig.
============================================================================= */
(function (global) {
  'use strict';

  var A = global.DAMPF = global.DAMPF || {};
  A.audio = null;

  /* ---- Tonhöhen ---------------------------------------------------------- */
  var PENTA = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  var CHORDS_WALTZ = [
    [261.63, 329.63, 392.00],  // C
    [196.00, 246.94, 293.66],  // G
    [174.61, 220.00, 261.63],  // Am
    [174.61, 220.00, 261.63]   // F (simplified)
  ];

  /* ---- 5 Titel-Tracks (8 Takte à 4/4, 120 BPM = 0.5s/Beat) --------------- */
  var TITLE_TRACKS = {
    1: {
      name: 'City Pop',
      bpm: 120,
      bass: [130.81, 130.81, 164.81, 164.81, 146.83, 146.83, 196.00, 196.00],
      chord: [
        [261.63, 329.63, 392.00], [261.63, 329.63, 392.00],
        [196.00, 246.94, 293.66], [196.00, 246.94, 293.66],
        [174.61, 220.00, 261.63], [174.61, 220.00, 261.63],
        [196.00, 246.94, 293.66], [196.00, 246.94, 293.66]
      ],
      arp: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 659.25],
      wave: 'triangle'
    },
    2: {
      name: 'Neon Rain',
      bpm: 100,
      bass: [110.00, 110.00, 116.54, 116.54, 103.83, 103.83, 98.00, 98.00],
      chord: [
        [220.00, 261.63, 329.63], [220.00, 261.63, 329.63],
        [233.08, 277.18, 349.23], [233.08, 277.18, 349.23],
        [207.65, 246.94, 311.13], [207.65, 246.94, 311.13],
        [196.00, 233.08, 293.66], [196.00, 233.08, 293.66]
      ],
      arp: [440.00, 523.25, 659.25, 523.25, 415.30, 493.88, 622.25, 493.88],
      wave: 'sine'
    },
    3: {
      name: 'Dashi',
      bpm: 110,
      bass: [146.83, 146.83, 164.81, 164.81, 196.00, 196.00, 174.61, 174.61],
      chord: [
        [293.66, 369.99, 440.00], [293.66, 369.99, 440.00],
        [329.63, 415.30, 493.88], [329.63, 415.30, 493.88],
        [392.00, 493.88, 587.33], [392.00, 493.88, 587.33],
        [349.23, 440.00, 523.25], [349.23, 440.00, 523.25]
      ],
      arp: [587.33, 698.46, 880.00, 698.46, 523.25, 659.25, 783.99, 659.25],
      wave: 'triangle'
    },
    4: {
      name: 'Concrete',
      bpm: 130,
      bass: [82.41, 82.41, 87.31, 87.31, 82.41, 82.41, 98.00, 98.00],
      chord: [
        [164.81, 207.65, 246.94], [164.81, 207.65, 246.94],
        [174.61, 220.00, 261.63], [174.61, 220.00, 261.63],
        [164.81, 207.65, 246.94], [164.81, 207.65, 246.94],
        [196.00, 246.94, 293.66], [196.00, 246.94, 293.66]
      ],
      arp: [329.63, 415.30, 493.88, 415.30, 329.63, 415.30, 493.88, 587.33],
      wave: 'square'
    },
    5: {
      name: 'Morning',
      bpm: 90,
      bass: [130.81, 130.81, 146.83, 146.83, 164.81, 164.81, 196.00, 196.00],
      chord: [
        [261.63, 329.63, 392.00], [261.63, 329.63, 392.00],
        [293.66, 369.99, 440.00], [293.66, 369.99, 440.00],
        [329.63, 415.30, 493.88], [329.63, 415.30, 493.88],
        [392.00, 493.88, 587.33], [392.00, 493.88, 587.33]
      ],
      arp: [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1046.5],
      wave: 'sine'
    }
  };

  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.started = false;
    this.muted = false;
    this.nextNoteTime = 0;
    this.shamisenTimer = null;
    this.chordTimer = null;
    this.titleTimer = null;
    this.ambGain = null;
    this.musicGain = null;
    this.stem2Gain = null;
    this.stem3Gain = null;
    this.titleGain = null;
    this.toneStep = 0;
    this.chordStep = 0;
    this.titleStep = 0;
    this.titleTrack = 1;
    this.titleActive = false;
    this.stem2Target = 0;
    this.stem3Target = 0;
    this.stem3NextTime = 0; // v2.9.2: eigener Zeiger (geteiltes nextNoteTime = Walzer-Kanal)
  }

  AudioEngine.prototype.init = function () {
    if (this.ctx) return;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) { console.warn('No AudioContext — sound disabled.'); return; }
    this.ctx = new AC();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);

    // Delay-Feedback (Reverb-Simulation)
    this.delay = this.ctx.createDelay(1.0);
    this.delay.delayTime.value = 0.33;
    this.feedback = this.ctx.createGain();
    this.feedback.gain.value = 0.22;
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.master);

    // Stem 1: Ambient (Shamisen) — läuft immer
    this.ambGain = this.ctx.createGain();
    this.ambGain.gain.value = 0.28;
    this.ambGain.connect(this.master);

    // Music Bus → Delay
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.32;
    this.musicGain.connect(this.master);
    this.musicGain.connect(this.delay);

    // Stem 2: Rhythmus (Walzer) — guest-gated
    this.stem2Gain = this.ctx.createGain();
    this.stem2Gain.gain.value = 0;
    this.stem2Gain.connect(this.musicGain);

    // Stem 3: Peak (Arps + Perc) — combo/rush-gated
    this.stem3Gain = this.ctx.createGain();
    this.stem3Gain.gain.value = 0;
    this.stem3Gain.connect(this.musicGain);

    // Titel-Musik (separater Bus, kein Delay)
    this.titleGain = this.ctx.createGain();
    this.titleGain.gain.value = 0;
    this.titleGain.connect(this.master);
  };

  AudioEngine.prototype.resume = function () {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  /* ---- iMUSE: Stem-Gain-Steuerung ---------------------------------------- */

  AudioEngine.prototype.setStem = function (stem, target) {
    if (!this.ctx) return;
    var g = stem === 2 ? this.stem2Gain : this.stem3Gain;
    if (!g) return;
    var p = this.ctx.currentTime;
    g.gain.cancelScheduledValues(p);
    g.gain.setTargetAtTime(target, p, stem === 2 ? 0.4 : 0.15);
  };

  AudioEngine.prototype.updateIMUSE = function (state) {
    if (!this.ctx || !this.started) return;
    var guests = 0;
    for (var i = 0; i < state.seats.length; i++) {
      if (state.seats[i] && state.seats[i].stage !== 'gone') guests++;
    }
    var s2 = guests >= 1 ? 1 : 0;
    var s3 = (state.combo >= 5 || state.rush) ? 1 : 0;
    if (s2 !== this.stem2Target) { this.setStem(2, s2); this.stem2Target = s2; }
    if (s3 !== this.stem3Target) { this.setStem(3, s3); this.stem3Target = s3; }
  };

  /* ---- Stem 1: Shamisen-Ambience (läuft immer) ---------------------------- */

  AudioEngine.prototype.startAmbience = function () {
    if (!this.ctx || this.started) return;
    this.started = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this._scheduleShamisen();
    this._scheduleChords();
    this._scheduleStem3(); // v2.9.2-Fix: lief nie — Peak-Stem war tot (Noten nur bei Combo 5+/Rush)
  };

  AudioEngine.prototype._scheduleShamisen = function () {
    var self = this;
    if (!this.started) return;
    var now = this.ctx.currentTime;
    while (this.nextNoteTime < now + 0.1) {
      this._playShamisen(this.nextNoteTime);
      this.nextNoteTime += 0.42 + Math.random() * 0.30;
    }
    this.shamisenTimer = setTimeout(function () { self._scheduleShamisen(); }, 80);
  };

  AudioEngine.prototype._playShamisen = function (t) {
    var freq = PENTA[Math.floor(Math.random() * PENTA.length)];
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    var filt = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 12;
    filt.type = 'lowpass';
    filt.frequency.value = 900 + Math.random() * 600;
    filt.Q.value = 3;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.7, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(filt); filt.connect(gain); gain.connect(this.ambGain);
    osc.start(t); osc.stop(t + 0.55);
  };

  /* ---- Stem 2: Walzer-Akkorde (guest-gated) -------------------------------- */

  AudioEngine.prototype._scheduleChords = function () {
    var self = this;
    if (!this.started) return;
    var now = this.ctx.currentTime;
    var beat = 0.5;
    while (this.nextNoteTime < now + 0.2) {
      this._playChord(this.nextNoteTime);
      this.nextNoteTime += beat;
      if (Math.floor(this.nextNoteTime / beat) % 3 === 0)
        this.chordStep = (this.chordStep + 1) % CHORDS_WALTZ.length;
    }
    this.chordTimer = setTimeout(function () { self._scheduleChords(); }, 100);
  };

  AudioEngine.prototype._playChord = function (t) {
    var notes = CHORDS_WALTZ[this.chordStep];
    var self = this;
    notes.forEach(function (freq) {
      var osc = self.ctx.createOscillator();
      var gain = self.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      var g = 0.16 / notes.length;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(g, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain); gain.connect(self.stem2Gain);
      osc.start(t); osc.stop(t + 0.5);
    });
  };

  /* ---- Stem 3: Peak (Arps + Percussion) ----------------------------------- */

  AudioEngine.prototype._scheduleStem3 = function () {
    var self = this;
    if (!this.started) return;
    var now = this.ctx.currentTime;
    var beat = 0.25; // 16tel bei 120 BPM
    // v2.9.2-Fix: eigener Zeiger (geteiltes nextNoteTime verschlang den Walzer).
    // Noten werden nur geplant, wenn der Stem aktiv ist — setStem() ist der Schalter.
    if (!this.stem3NextTime) this.stem3NextTime = now + 0.05;
    if (this.stem3Target) {
      while (this.stem3NextTime < now + 0.15) {
        this._playStem3Note(this.stem3NextTime);
        this.stem3NextTime += beat;
      }
    } else {
      this.stem3NextTime = now + 0.05;
    }
    this.stem3Timer = setTimeout(function () { self._scheduleStem3(); }, 80);
  };

  AudioEngine.prototype._playStem3Note = function (t) {
    var step = Math.floor((t - this.ctx.currentTime) / 0.25) % 8;
    // Arp: schnelle pentatonische Aufwärtsbewegung
    var arpFreq = PENTA[(step * 2) % PENTA.length] * 2;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = arpFreq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain); gain.connect(this.stem3Gain);
    osc.start(t); osc.stop(t + 0.25);

    // Percussion: Taiko-Schlag auf 1 und 3
    if (step % 4 === 0) {
      var perc = this.ctx.createOscillator();
      var pg = this.ctx.createGain();
      perc.type = 'sine';
      perc.frequency.setValueAtTime(80, t);
      perc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      pg.gain.setValueAtTime(0.3, t);
      pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      perc.connect(pg); pg.connect(this.stem3Gain);
      perc.start(t); perc.stop(t + 0.25);
    }
  };

  /* ---- Titel-Musik (5 Tracks) --------------------------------------------- */

  AudioEngine.prototype.setTitleTrack = function (n) {
    if (n < 1 || n > 5) return;
    this.titleTrack = n;
    this.titleStep = 0;
  };

  AudioEngine.prototype.startTitleMusic = function () {
    if (!this.ctx || this.titleActive) return;
    this.titleActive = true;
    this.titleStep = 0;
    this._titleNextTime = this.ctx.currentTime + 0.1;
    this.titleGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.titleGain.gain.setTargetAtTime(0.45, this.ctx.currentTime, 0.5);
    this._scheduleTitle();
  };

  AudioEngine.prototype.stopTitleMusic = function () {
    this.titleActive = false;
    if (this.titleTimer) clearTimeout(this.titleTimer);
    if (this.titleGain) {
      var p = this.ctx.currentTime;
      this.titleGain.gain.cancelScheduledValues(p);
      this.titleGain.gain.setTargetAtTime(0, p, 0.3);
    }
  };

  AudioEngine.prototype._scheduleTitle = function () {
    var self = this;
    if (!this.titleActive) return;
    var track = TITLE_TRACKS[this.titleTrack];
    var beat = 60 / track.bpm;
    var now = this.ctx.currentTime;
    while (this._titleNextTime < now + 0.2) {
      this._playTitleBeat(this._titleNextTime, track);
      this._titleNextTime += beat;
      this.titleStep = (this.titleStep + 1) % 8;
    }
    this.titleTimer = setTimeout(function () { self._scheduleTitle(); }, 100);
  };

  AudioEngine.prototype._playTitleBeat = function (t, track) {
    var step = this.titleStep;
    // Bass
    var bassOsc = this.ctx.createOscillator();
    var bassGain = this.ctx.createGain();
    bassOsc.type = track.wave;
    bassOsc.frequency.value = track.bass[step];
    bassGain.gain.setValueAtTime(0.0001, t);
    bassGain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    bassOsc.connect(bassGain); bassGain.connect(this.titleGain);
    bassOsc.start(t); bassOsc.stop(t + 0.45);

    // Chord (alle 2 Beats)
    if (step % 2 === 0) {
      var chord = track.chord[step / 2];
      var self = this;
      chord.forEach(function (freq) {
        var osc = self.ctx.createOscillator();
        var g = self.ctx.createGain();
        osc.type = track.wave;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        osc.connect(g); g.connect(self.titleGain);
        osc.start(t); osc.stop(t + 0.55);
      });
    }

    // Arp (jeder Beat)
    var arpOsc = this.ctx.createOscillator();
    var arpGain = this.ctx.createGain();
    arpOsc.type = 'sine';
    arpOsc.frequency.value = track.arp[step];
    arpGain.gain.setValueAtTime(0.0001, t);
    arpGain.gain.exponentialRampToValueAtTime(0.1, t + 0.01);
    arpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    arpOsc.connect(arpGain); arpGain.connect(this.titleGain);
    arpOsc.start(t); arpOsc.stop(t + 0.35);
  };

  /* ---- SFX (unverändert) --------------------------------------------------- */

  AudioEngine.prototype._blip = function (freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    var g = vol || 0.25;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(g, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain); gain.connect(this.master);
    osc.start(t); osc.stop(t + dur);
  };

  AudioEngine.prototype.sfxCook = function () {
    this._blip(180, 0.12, 'sine', 0.3, 90);
    var self = this;
    setTimeout(function () { self._blip(240, 0.08, 'sine', 0.2, 120); }, 60);
  };
  AudioEngine.prototype.sfxPhone = function () {
    this._blip(660, 0.08, 'square', 0.22);
    var self = this;
    setTimeout(function () { self._blip(880, 0.10, 'square', 0.22); }, 90);
  };
  AudioEngine.prototype.sfxDispatch = function () {
    this._blip(300, 0.15, 'sawtooth', 0.2, 600);
  };
  /* v2.9.2.2: sfxReady und sfxDeliver gestrichen — kein eindeutiger
     Trigger (würde mit sfxCook bzw. den Servier-Sounds kollidieren).
     Entscheidung + Begründung: AUDIO.md */
  AudioEngine.prototype.sfxBad = function () {
    this._blip(200, 0.2, 'sawtooth', 0.3, 80);
  };
  AudioEngine.prototype.sfxPhase = function () {
    if (!this.ctx) return;
    var t = this.ctx.currentTime;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.6);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    var filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 2000;
    osc.connect(filt); filt.connect(gain); gain.connect(this.master);
    osc.start(t); osc.stop(t + 1.0);
  };
  AudioEngine.prototype.sfxClick = function () { this._blip(1200, 0.03, 'square', 0.15); };
  AudioEngine.prototype.sfxUpgrade = function () {
    var self = this;
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { self._blip(f, 0.1, 'triangle', 0.25); }, i * 70);
    });
  };
  AudioEngine.prototype.sfxThrow = function () {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.45);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(gain); gain.connect(this.master);
    osc.start(t); osc.stop(t + 0.55);
  };
  AudioEngine.prototype.sfxDoor = function () {
    this._blip(880, 0.06, 'square', 0.18);
    var self = this;
    setTimeout(function () { self._blip(1174, 0.09, 'square', 0.18); }, 70);
    setTimeout(function () { self._blip(150, 0.18, 'sine', 0.25, 90); }, 160);
  };
  AudioEngine.prototype.sfxHappy = function () {
    var self = this;
    [660, 880, 990].forEach(function (f, i) {
      setTimeout(function () { self._blip(f, 0.07, 'triangle', 0.18); }, i * 90);
    });
  };
  AudioEngine.prototype.sfxAngry = function () {
    this._blip(160, 0.28, 'sawtooth', 0.3, 60);
    var self = this;
    setTimeout(function () { self._blip(120, 0.3, 'sawtooth', 0.25, 50); }, 120);
  };
  AudioEngine.prototype.sfxThink = function () {
    this._blip(392, 0.05, 'sine', 0.1);
    var self = this;
    setTimeout(function () { self._blip(523, 0.07, 'sine', 0.1); }, 90);
  };
  AudioEngine.prototype.sfxCoin = function () {
    this._blip(988, 0.05, 'square', 0.2);
    var self = this;
    setTimeout(function () { self._blip(1319, 0.1, 'square', 0.2); }, 55);
  };
  AudioEngine.prototype.sfxParty = function () {
    var self = this;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      setTimeout(function () { self._blip(f, 0.14, 'triangle', 0.28); }, i * 90);
    });
    setTimeout(function () { self._blip(1318.5, 0.25, 'triangle', 0.3); }, 380);
  };
  AudioEngine.prototype.sfxSlurp = function () {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime;
    var self = this;
    [900, 620, 420].forEach(function (f, i) {
      var osc = self.ctx.createOscillator(), gain = self.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.09);
      osc.frequency.exponentialRampToValueAtTime(f * 0.6, t + i * 0.09 + 0.09);
      gain.gain.setValueAtTime(0.0001, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.18, t + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.12);
      osc.connect(gain); gain.connect(self.master);
      osc.start(t + i * 0.09); osc.stop(t + i * 0.09 + 0.14);
    });
  };

  /* ---- Zen-jiru Stinger (pentatonische Aufwärtsfolge) ---------------------- */
  AudioEngine.prototype.sfxZenJiru = function () {
    if (!this.ctx || this.muted) return;
    var self = this;
    var notes = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach(function (f, i) {
      setTimeout(function () { self._blip(f, 0.2, 'triangle', 0.25); }, i * 80);
    });
    setTimeout(function () { self._blip(1318.5, 0.8, 'sine', 0.3); }, notes.length * 80);
  };

  /* ---- Steuerung ----------------------------------------------------------- */

  AudioEngine.prototype.setMute = function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.6;
  };

  AudioEngine.prototype.setMusicVolume = function (v) {
    // v: 0..1 — regelt den Music-Bus (Stems + Titel)
    if (!this.musicGain) return;
    this.musicGain.gain.value = 0.32 * v;
    if (this.titleGain) this.titleGain.gain.value = 0.45 * v;
  };

  AudioEngine.prototype.stopAmbience = function () {
    // Stellt die Game-Ambience (Shamisen + Walzer) stumm, behält Context
    this.started = false;
    if (this.shamisenTimer) clearTimeout(this.shamisenTimer);
    if (this.chordTimer) clearTimeout(this.chordTimer);
    if (this.stem3Timer) clearTimeout(this.stem3Timer);
    if (this.ambGain) this.ambGain.gain.value = 0;
    if (this.stem2Gain) this.stem2Gain.gain.value = 0;
    if (this.stem3Gain) this.stem3Gain.gain.value = 0;
  };

  AudioEngine.prototype.stop = function () {
    this.started = false;
    this.titleActive = false;
    if (this.shamisenTimer) clearTimeout(this.shamisenTimer);
    if (this.chordTimer) clearTimeout(this.chordTimer);
    if (this.titleTimer) clearTimeout(this.titleTimer);
    if (this.stem3Timer) clearTimeout(this.stem3Timer);
  };

  A.audio = new AudioEngine();
  A.audio.TITLE_TRACKS = TITLE_TRACKS;
})(typeof window !== 'undefined' ? window : this);
