/* ════════════════════════════════════════════════════════════════
   CORE — Moteur de résultats (tous formats de question)
   answersMap : { pid: { opt, text, val, q } }
════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const computeResults = (q, answersMap, qIndex) => {
    const type = (q && q.type) || 'mcq';

    if (type === 'mcq') {
      const n = (q.options && q.options.length) || 4;
      const counts = Array(n).fill(0);
      let total = 0;
      Object.values(answersMap || {}).forEach((a) => {
        if (a && a.q === qIndex && a.opt != null && a.opt >= 0 && a.opt < n) { counts[a.opt] += 1; total += 1; }
      });
      return { type, counts, total };
    }

    if (type === 'word') {
      const acc = {};
      let total = 0;
      Object.values(answersMap || {}).forEach((a) => {
        if (!a || a.q !== qIndex || !a.text) return;
        // Éclate les réponses multi-valeurs (« écoute, audace » → 2 mots)
        String(a.text).split(/[,;.]|\bet\b|\//i).map((s) => s.trim().toLowerCase()).filter((w) => w.length >= 1).forEach((w) => {
          acc[w] = (acc[w] || 0) + 1;
          total += 1;
        });
      });
      const words = Object.entries(acc).map(([w, n]) => ({ w, n })).sort((a, b) => b.n - a.n || a.w.localeCompare(b.w));
      return { type, words, distinct: words.length, total };
    }

    if (type === 'number') {
      const entries = [];
      Object.entries(answersMap || {}).forEach(([pid, a]) => {
        if (a && a.q === qIndex && typeof a.val === 'number' && isFinite(a.val)) entries.push({ pid, v: a.val });
      });
      entries.sort((a, b) => a.v - b.v);
      const total = entries.length;
      const avg = total ? entries.reduce((s, e) => s + e.v, 0) / total : 0;
      return { type, entries, total, min: total ? entries[0].v : null, max: total ? entries[total - 1].v : null, avg };
    }

    if (type === 'scale') {
      const min = q.min != null ? q.min : 1, max = q.max != null ? q.max : 10;
      const n = max - min + 1;
      const counts = Array(n).fill(0);
      let total = 0, sum = 0;
      Object.values(answersMap || {}).forEach((a) => {
        if (a && a.q === qIndex && a.opt != null && a.opt >= 0 && a.opt < n) { counts[a.opt] += 1; sum += min + a.opt; total += 1; }
      });
      return { type, counts, total, avg: total ? sum / total : 0 };
    }

    return { type: 'mcq', counts: [], total: 0 };
  };

  const countAnswers = (answersMap, qIndex) =>
    Object.values(answersMap || {}).filter((a) => a && a.q === qIndex && (a.opt != null || a.text || a.val != null)).length;

  /* Attribution des points selon le format :
     mcq → correctIndex · number → plus proche de target · autres → rien */
  const computeWinners = (q, answersMap, qIndex) => {
    const winners = [];
    if ((q.type || 'mcq') === 'mcq' && q.correctIndex != null) {
      Object.entries(answersMap || {}).forEach(([pid, a]) => {
        if (a && a.q === qIndex && a.opt === q.correctIndex) winners.push(pid);
      });
    } else if (q.type === 'number' && q.target != null) {
      let best = Infinity;
      Object.entries(answersMap || {}).forEach(([pid, a]) => {
        if (a && a.q === qIndex && a.val != null) {
          const d = Math.abs(a.val - q.target);
          if (d < best - 1e-9) { best = d; winners.length = 0; winners.push(pid); }
          else if (Math.abs(d - best) < 1e-9) winners.push(pid);
        }
      });
    }
    return winners;
  };

  window.IB.results = { computeResults, countAnswers, computeWinners };
})();
