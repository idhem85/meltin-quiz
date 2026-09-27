/* ════════════════════════════════════════════════════════════════
   AUDIO — MELTIN QUIZ (façon Kahoot, 100 % WebAudio, zéro fichier)
   Sons synthétisés à la volée : aucun asset à télécharger, aucun
   droit d'auteur, latence nulle. Toutes les méthodes sont silencieuses
   si le son est coupé (ib_sound=off) ou si WebAudio est indisponible.
   L'AudioContext est créé/resumé au premier geste utilisateur
   (politique autoplay des navigateurs) via unlock().
════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  let ctx = null;
  const store = window.IB.util.store;
  const isEnabled = () => store.get('sound', true);

  function ensureCtx() {
    if (!isEnabled()) return null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx.state === 'running' || ctx.state === 'suspended' ? ctx : null;
    } catch (e) { return null; }
  }

  /* Oscillateur enveloppé : la brique de base de tous les sons */
  function tone({ freq = 440, dur = 0.12, type = 'sine', vol = 0.18,
                  delay = 0, slideTo = null, attack = 0.005 }) {
    const c = ensureCtx();
    if (!c) return;
    try {
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    } catch (e) { /* jamais bloquant */ }
  }

  /* Bruit filtré : cymbale/whoosh sans échantillon */
  function noise({ dur = 0.3, vol = 0.12, delay = 0, freq = 3000, q = 0.8, slideTo = null }) {
    const c = ensureCtx();
    if (!c) return;
    try {
      const t0 = c.currentTime + delay;
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(); src.buffer = buf;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.setValueAtTime(freq, t0); filt.Q.value = q;
      if (slideTo) filt.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      const gain = c.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filt).connect(gain).connect(c.destination);
      src.start(t0);
    } catch (e) {}
  }

  const SFX = {
    /* Lancement d'une question : montée d'adrénaline (le "drum roll" Kahoot) */
    questionStart() {
      tone({ freq: 220, slideTo: 880, dur: 0.45, type: 'sawtooth', vol: 0.10 });
      tone({ freq: 440, slideTo: 1760, dur: 0.45, type: 'triangle', vol: 0.08, delay: 0.05 });
      noise({ dur: 0.5, freq: 600, slideTo: 4000, vol: 0.06 });
    },
    /* Tick d'horloge du timer (accélère visuellement le stress) */
    tick(urgent) {
      tone({ freq: urgent ? 880 : 660, dur: 0.05, type: 'square', vol: urgent ? 0.14 : 0.08 });
    },
    /* Verrouillage du vote sur le téléphone */
    lock() {
      tone({ freq: 520, dur: 0.08, type: 'triangle', vol: 0.14 });
      tone({ freq: 780, dur: 0.1, type: 'triangle', vol: 0.12, delay: 0.07 });
    },
    /* Temps écoulé : haut strident */
    timeUp() {
      tone({ freq: 990, dur: 0.5, type: 'sawtooth', vol: 0.12, slideTo: 220 });
      noise({ dur: 0.4, freq: 2000, slideTo: 300, vol: 0.08, delay: 0.05 });
    },
    /* Révélation des résultats */
    reveal() {
      tone({ freq: 392, dur: 0.14, type: 'triangle', vol: 0.12 });
      tone({ freq: 523, dur: 0.14, type: 'triangle', vol: 0.12, delay: 0.1 });
    },
    /* Bonne réponse (participant) : arpège majeur montant */
    good() {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.13, delay: i * 0.07 }));
    },
    /* Mauvaise réponse (participant) : descente dissonante */
    bad() {
      tone({ freq: 311, slideTo: 155, dur: 0.4, type: 'sawtooth', vol: 0.1 });
      tone({ freq: 330, slideTo: 165, dur: 0.4, type: 'square', vol: 0.05, delay: 0.03 });
    },
    /* Podium final : fanfare */
    fanfare() {
      const seq = [[392, 0], [392, .15], [392, .3], [523, .45], [659, .68], [784, .9], [1047, 1.15]];
      seq.forEach(([f, d]) => tone({ freq: f, dur: d > .6 ? 0.5 : 0.16, type: 'triangle', vol: 0.13, delay: d }));
      noise({ dur: 0.7, freq: 5000, vol: 0.05, delay: 1.15 });
    },
  };

  /* API : chaque méthode est un no-op sonore si le son est coupé */
  const api = {};
  Object.keys(SFX).forEach((k) => { api[k] = (...a) => { if (isEnabled()) SFX[k](...a); }; });

  /* Premier geste utilisateur → autorise les sons (autoplay policy) */
  let unlocked = false;
  api.unlock = () => {
    if (unlocked) return;
    unlocked = true;
    ensureCtx();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) =>
    window.addEventListener(e, api.unlock, { once: true, passive: true }));

  api.enabled = isEnabled;
  api.setEnabled = (on) => { store.set('sound', !!on); if (on) { unlocked = true; ensureCtx(); } };

  window.IB.audio = api;
})();
