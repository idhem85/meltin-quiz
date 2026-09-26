/* ════════════════════════════════════════════════════════════════
   CORE — Couche de synchronisation (Firebase ↔ démo locale)
   API unique consommée par les vues :
   - IB.sync.demoMode             → booléen
   - IB.sync.host(room, cbs)      → unsubscribe (cbs: onState/onPlayers/onAnswers/onError)
   - IB.sync.watchRoom(room, cb)  → unsubscribe (participant)
   - IB.sync.join(room, player)   → écriture joueur
   - IB.sync.leave(room, pid)     → retrait joueur
   - IB.sync.vote(room, pid, doc) → écriture réponse {optionIndex|text|val, questionIndex}
   - IB.sync.patchState(room, p)  → patch de l'état de salle
   - IB.sync.clearAnswers(room)   → purge entre questions
   - IB.sync.setScore(room, pid, delta) → incrément de score
   - IB.sync.resetScores(room)    → remise à zéro
   - IB.sync.kick(room, pid)      → exclusion
════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  // ib_force_demo=1 → force le mode démo même avec une config Firebase
  // (répétitions sans consommer de quotas).
  const forcedDemo = (() => { try { return localStorage.getItem('ib_force_demo') === '1'; } catch (e) { return false; } })();
  const hasFirebase = typeof firebase !== 'undefined' && !!window.IB_CONFIG.FIREBASE_CONFIG.apiKey && !forcedDemo;
  const demoMode = !hasFirebase;
  const defQuiz = () => window.IB.util.sanitizeQuiz(window.IB.util.loadQuiz());

  /* Initialisation du SDK (compat) — indispensable avant tout usage */
  if (hasFirebase) {
    firebase.initializeApp(window.IB_CONFIG.FIREBASE_CONFIG);
  }

  /* ════════ MODE DÉMO (BroadcastChannel, même navigateur) ════════ */
  const demo = { room: null, channel: null, isHost: false, state: null, players: {}, answers: {} };
  const demoEmit = () => {
    if (demo.channel && demo.isHost) demo.channel.postMessage({ t: 'sync', state: demo.state });
    window.dispatchEvent(new Event('ib-demo-sync'));
  };
  const docFrom = (d) => ({
    opt: d.optionIndex != null ? d.optionIndex : null,
    text: d.text || null,
    val: d.val != null ? d.val : null,
    q: d.questionIndex,
  });

  function demoHost(room, cbs) {
    demo.room = room; demo.isHost = true;
    demo.state = { room, status: 'waiting', questionIndex: -1, quiz: defQuiz(), quizTitle: window.IB_CONFIG.QUIZ_TITLE, theme: null, lastResults: null, podium: null };
    demo.players = {}; demo.answers = {};
    try { if (demo.channel) demo.channel.close(); } catch (e) {}
    demo.channel = new BroadcastChannel('icebreaker-demo-' + room);
    demo.channel.onmessage = (e) => {
      const m = e.data || {};
      if (m.t === 'join') { demo.players[m.pid] = { pid: m.pid, pseudo: m.pseudo, emoji: m.emoji, score: 0 }; demoEmit(); }
      else if (m.t === 'vote') { demo.answers[m.pid] = docFrom(m.doc || {}); demoEmit(); }
      else if (m.t === 'leave') { delete demo.players[m.pid]; delete demo.answers[m.pid]; demoEmit(); }
    };
    const rerender = () => {
      cbs.onState(demo.state ? { ...demo.state } : null);
      cbs.onPlayers(Object.values(demo.players));
      cbs.onAnswers({ ...demo.answers });
    };
    window.addEventListener('ib-demo-sync', rerender);
    rerender();
    return () => { window.removeEventListener('ib-demo-sync', rerender); try { demo.channel.close(); } catch (e) {} demo.channel = null; demo.isHost = false; };
  }

  function demoWatch(room, me, cbs) {
    demo.room = room; demo.isHost = false;
    try { if (demo.channel) demo.channel.close(); } catch (e) {}
    demo.channel = new BroadcastChannel('icebreaker-demo-' + room);
    const joinMsg = () => demo.channel.postMessage({ t: 'join', pid: me.pid, pseudo: me.pseudo, emoji: me.emoji });
    joinMsg();
    let joined = false;
    const retry = setInterval(() => { if (!joined) joinMsg(); }, 2000);
    const onMsg = (e) => { const m = e.data || {}; if (m.t === 'sync') { joined = true; demo.state = m.state; cbs.onState(m.state); } };
    demo.channel.addEventListener('message', onMsg);
    const rerender = () => cbs.onState(demo.state ? { ...demo.state } : null);
    window.addEventListener('ib-demo-sync', rerender);
    const leave = () => { try { demo.channel.postMessage({ t: 'leave', pid: me.pid }); } catch (e) {} };
    window.addEventListener('pagehide', leave);
    rerender();
    return () => {
      clearInterval(retry);
      window.removeEventListener('pagehide', leave);
      leave();
      demo.channel.removeEventListener('message', onMsg);
      window.removeEventListener('ib-demo-sync', rerender);
      try { demo.channel.close(); } catch (e) {}
      demo.channel = null;
    };
  }

  const demoApi = {
    host: demoHost,
    watchRoom: demoWatch,
    join: () => {},                                  // géré par watchRoom (BroadcastChannel)
    leave: () => {},
    vote: (room, pid, doc) => {
      if (demo.isHost) { demo.answers[pid] = docFrom(doc); demoEmit(); }
      else if (demo.channel) demo.channel.postMessage({ t: 'vote', pid, doc });
    },
    patchState: (room, patch) => { if (demo.isHost) { demo.state = { ...demo.state, ...patch }; demoEmit(); } },
    clearAnswers: () => { if (demo.isHost) { demo.answers = {}; demoEmit(); } },
    setScore: (room, pid, delta) => {
      if (demo.isHost && demo.players[pid]) { demo.players[pid].score = (demo.players[pid].score || 0) + delta; demoEmit(); }
    },
    resetScores: () => { if (demo.isHost) { Object.values(demo.players).forEach((p) => { p.score = 0; }); demoEmit(); } },
    kick: (room, pid) => { if (demo.isHost) { delete demo.players[pid]; delete demo.answers[pid]; demoEmit(); } },
  };

  /* ════════ MODE FIREBASE (Firestore) ════════ */
  const fs = () => firebase.firestore();
  const roomRef = (room) => fs().collection('rooms').doc(room);

  /* Throttle des snapshots à haute fréquence (300 participants qui
     votent = nombreuses émissions) : on ne re-rend l'UI qu'au plus
     toutes les RATE_MS. Les données restent à jour en continu.   */
  function throttled(fn, rateMs) {
    let pending = null, last = 0;
    return (...args) => {
      pending = args;
      const now = Date.now();
      if (now - last >= rateMs) { last = now; const a = pending; pending = null; fn(...a); }
      else if (!pending._t) {
        pending._t = setTimeout(() => { pending._t = null; last = Date.now(); const a = pending; pending = null; fn(...a); }, rateMs - (Date.now() - last));
      }
    };
  }
  const SNAPSHOT_RATE = 350;   // ms — imperceptible à l'œil, ÷3 le re-rendu

  const fbApi = {
    host(room, cbs) {
      roomRef(room).get().then((snap) => {
        if (!snap.exists) {
          roomRef(room).set({
            room, status: 'waiting', questionIndex: -1,
            quiz: defQuiz(), quizTitle: window.IB_CONFIG.QUIZ_TITLE, theme: null,
            lastResults: null, podium: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          }).catch((e) => cbs.onError('Création salle : ' + e.code));
        }
      });
      const onAnswersT = throttled(cbs.onAnswers, SNAPSHOT_RATE);
      const u1 = roomRef(room).onSnapshot((snap) => cbs.onState(snap.exists ? snap.data() : null), (e) => cbs.onError('État : ' + e.code));
      const u2 = roomRef(room).collection('players').onSnapshot((qs) => cbs.onPlayers(qs.docs.map((d) => d.data())), (e) => cbs.onError('Joueurs : ' + e.code));
      const u3 = roomRef(room).collection('answers').onSnapshot((qs) => {
        const m = {}; qs.forEach((d) => { m[d.id] = docFrom(d.data()); });
        onAnswersT(m);
      }, (e) => cbs.onError('Réponses : ' + e.code));
      return () => { u1(); u2(); u3(); };
    },
    watchRoom(room, me, cbs) {
      const unsub = roomRef(room).onSnapshot((snap) => cbs.onState(snap.exists ? snap.data() : null), (e) => cbs.onError('Lecture salle : ' + e.code));
      const t = setTimeout(() => {
        roomRef(room).get().then((s) => { if (!s.exists) cbs.onError('Salle "' + room + '" introuvable — vérifiez le code'); });
      }, 4000);
      const leave = () => { roomRef(room).collection('players').doc(me.pid).delete().catch(() => {}); };
      window.addEventListener('pagehide', leave);
      return () => { unsub(); clearTimeout(t); window.removeEventListener('pagehide', leave); };
    },
    join(room, player) {
      roomRef(room).collection('players').doc(player.pid).set({
        ...player, score: 0, joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {});
    },
    leave(room, pid) { roomRef(room).collection('players').doc(pid).delete().catch(() => {}); },
    vote(room, pid, doc) {
      const clean = { questionIndex: doc.questionIndex, at: firebase.firestore.FieldValue.serverTimestamp() };
      if (doc.optionIndex != null) clean.optionIndex = doc.optionIndex;
      if (doc.text) clean.text = String(doc.text).slice(0, 80);
      if (doc.val != null && isFinite(doc.val)) clean.val = Number(doc.val);
      roomRef(room).collection('answers').doc(pid).set(clean).catch(() => {});
    },
    patchState(room, patch) { roomRef(room).set(patch, { merge: true }).catch(() => {}); },
    async clearAnswers(room) {
      try {
        const snap = await roomRef(room).collection('answers').get();
        if (!snap.empty) {
          const batch = fs().batch();
          snap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) { /* non bloquant */ }
    },
    setScore(room, pid, delta) {
      roomRef(room).collection('players').doc(pid).update({ score: firebase.firestore.FieldValue.increment(delta) }).catch(() => {});
    },
    async resetScores(room) {
      try {
        const snap = await roomRef(room).collection('players').get();
        const batch = fs().batch();
        snap.docs.forEach((d) => batch.update(d.ref, { score: 0 }));
        if (!snap.empty) await batch.commit();
      } catch (e) { /* non bloquant */ }
    },
    kick(room, pid) { roomRef(room).collection('players').doc(pid).delete().catch(() => {}); },
  };

  window.IB.sync = { demoMode, ...(demoMode ? demoApi : fbApi) };
})();
