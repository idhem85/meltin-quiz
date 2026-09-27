/* ════════════════════════════════════════════════════════════════
   CORE — Utilitaires partagés
════════════════════════════════════════════════════════════════ */
'use strict';

const IB = window.IB || (window.IB = {});
IB.util = (() => {
  const genRoomCode = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };
  const genId = () => 'p_' + Math.random().toString(36).slice(2, 10);

  const getRoomParam = () => {
    const m = window.location.search.match(/[?&]room=([A-Za-z0-9]{4,10})/);
    return m ? m[1].toUpperCase() : '';
  };
  const setRoomParam = (code) => {
    const u = new URL(window.location.href);
    code ? u.searchParams.set('room', code) : u.searchParams.delete('room');
    window.history.replaceState({}, '', u);
  };
  const joinUrlFor = (code) => {
    const u = new URL(window.location.href);
    u.hash = ''; u.search = '?room=' + code;
    return u.toString();
  };
  const hash = () => window.location.hash.replace(/^#\/?/, '') || 'home';

  /* Persistance locale (dashboard, session participant) */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('ib_' + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('ib_' + key, JSON.stringify(value)); } catch (e) {}
    },
    del(key) { try { localStorage.removeItem('ib_' + key); } catch (e) {} },
  };

  /* Quiz courant : cache local (repli) > défaut.
     La source officielle en ligne est config/dashboard (via sync). */
  const loadQuiz = () => store.get('quiz', window.IB_DEFAULT_QUIZ);
  const saveQuiz = (quiz) => store.set('quiz', quiz);
  const resetQuiz = () => { store.del('quiz'); return window.IB_DEFAULT_QUIZ; };

  /* Normalisation : garantit des données saines avant envoi */
  const sanitizeQuiz = (quiz) => (Array.isArray(quiz) ? quiz : [])
    .map((q) => {
      const out = { type: q.type || 'mcq', question: String(q.question || '').slice(0, 300) };
      if (q.phase) out.phase = String(q.phase).slice(0, 80);
      const secs = Number(q.seconds);
      if (secs > 0) out.seconds = Math.min(Math.round(secs), 300);  // 0/absent = pas de timer
      if (q.type === 'mcq') out.options = (q.options || []).slice(0, 4).map((o) => String(o).slice(0, 80));
      if (q.type === 'mcq' && q.correctIndex != null) out.correctIndex = Number(q.correctIndex) || 0;
      if (q.type === 'word') { out.placeholder = String(q.placeholder || 'Votre réponse…').slice(0, 60); out.maxLen = Math.min(Number(q.maxLen) || 30, 80); }
      if (q.type === 'number') { out.unit = String(q.unit || '').slice(0, 10); out.maxLen = Math.min(Number(q.maxLen) || 12, 15); if (q.target != null && isFinite(Number(q.target))) out.target = Number(q.target); }
      if (q.type === 'scale') { out.min = Number(q.min) || 1; out.max = Number(q.max) || 10; }
      return out;
    })
    .filter((q) => q.question);

  /* Badge lisible par format */
  const TYPE_BADGE = {
    mcq:    { label: 'Choix multiple', icon: '🔘' },
    word:   { label: 'Nuage de mots',  icon: '☁️' },
    number: { label: 'Estimation',     icon: '🔢' },
    scale:  { label: 'Échelle',        icon: '📏' },
  };
  const typeBadge = (q) => TYPE_BADGE[(q && q.type) || 'mcq'] || TYPE_BADGE.mcq;

  const fmtNum = (v) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('fr-FR') : String(Math.round(v * 10) / 10));

  return { genRoomCode, genId, getRoomParam, setRoomParam, joinUrlFor, hash, store, loadQuiz, saveQuiz, resetQuiz, sanitizeQuiz, TYPE_BADGE, typeBadge, fmtNum };
})();
