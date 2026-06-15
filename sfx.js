/* =====================================================================
   THE CANRAEL CODEX — Ambient SFX
   Tiny, synthesized sounds (Web Audio). No files, no network.
   Soft and low by design — meant to make the page feel alive,
   never to intrude. Honours a user toggle + reduced-motion.
   ===================================================================== */

(function () {
  "use strict";

  let ctx = null;
  let master = null;
  let unlocked = false;
  let enabled = (localStorage.getItem("canrael-sound") || "on") !== "off";

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    const c = ensure();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    unlocked = true;
  }

  const live = () => enabled && unlocked && ctx;

  // --- A single soft oscillator voice with a gentle envelope ---
  function tone(o) {
    if (!live()) return;
    const t = ctx.currentTime;
    const dur = o.dur || 0.2;
    const osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t + dur);

    let node = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = o.lp;
      osc.connect(f);
      node = f;
    }

    const g = ctx.createGain();
    const peak = o.gain || 0.04;
    const atk = o.attack || 0.006;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g);
    g.connect(master);

    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  // --- A short filtered-noise burst (parchment / air texture) ---
  function noise(o) {
    if (!live()) return;
    const t = ctx.currentTime;
    const dur = o.dur || 0.14;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = o.bp || 2000;
    f.Q.value = o.q || 0.7;

    const g = ctx.createGain();
    const peak = o.gain || 0.03;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  const SFX = {
    unlock: unlock,
    isEnabled: function () { return enabled; },
    setEnabled: function (v) {
      enabled = !!v;
      localStorage.setItem("canrael-sound", v ? "on" : "off");
      if (v) { unlock(); SFX.tick(); }
    },

    // a faint tactile click
    tick: function () {
      tone({ type: "sine", freq: 520, dur: 0.06, gain: 0.03, lp: 1800 });
    },

    // drawing a whisper — a soft parchment rustle + airy swell
    draw: function () {
      noise({ dur: 0.16, gain: 0.028, bp: 2600, q: 0.6 });
      tone({ type: "sine", freq: 392, dur: 0.5,  gain: 0.026, attack: 0.04, lp: 1200 });
      tone({ type: "sine", freq: 587, dur: 0.55, gain: 0.02,  attack: 0.06, lp: 2000 });
    },

    // changing region — a low scene-shift sweep
    swap: function () {
      tone({ type: "triangle", freq: 240, glideTo: 150, dur: 0.34, gain: 0.045, attack: 0.012, lp: 900 });
      noise({ dur: 0.30, gain: 0.016, bp: 1200, q: 0.4 });
    },

    // inscribing a quote — a soft two-note confirm
    copy: function () {
      tone({ type: "sine", freq: 660, dur: 0.14, gain: 0.038, lp: 2500 });
      window.setTimeout(function () {
        tone({ type: "sine", freq: 880, dur: 0.18, gain: 0.034, lp: 3000 });
      }, 95);
    }
  };

  // Respect reduced-motion as a proxy for "minimal sensory" preference:
  // keep sound available but never auto-enable it loudly. (Toggle still works.)
  window.CanraelSFX = SFX;

  // Unlock the audio context on the first user gesture (required by browsers).
  function firstGesture() {
    unlock();
    window.removeEventListener("pointerdown", firstGesture);
    window.removeEventListener("keydown", firstGesture);
  }
  window.addEventListener("pointerdown", firstGesture);
  window.addEventListener("keydown", firstGesture);
})();
