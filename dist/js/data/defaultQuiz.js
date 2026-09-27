/* ════════════════════════════════════════════════════════════════
   QUIZ PAR DÉFAUT — vide : chaque organisateur crée ses questions
   depuis le dashboard (#/admin), une par une, en choisissant le
   format (QCM, nuage de mots, estimation, échelle).

   GABARITS DE RÉFÉRENCE — à utiliser dans l'import JSON du
   dashboard (onglet « Import / Export ») :

   { phase: "Phase 1 — Warm-up", type: "mcq",
     question: "…", options: ["A", "B", "C", "D"], correctIndex: 0 }
   { phase: "Phase 1 — Warm-up", type: "word",
     question: "…", placeholder: "Un mot…", maxLen: 30 }
   { phase: "Phase 2 — Challenge", type: "number",
     question: "…", unit: "€", maxLen: 12, target: 42000 }
   { phase: "Phase 3 — Engagement", type: "scale",
     question: "…", min: 1, max: 10 }

   Tous les champs sont optionnels sauf `question`. `phase` regroupe
   visuellement les questions (badge affiché à l'écran animateur).
════════════════════════════════════════════════════════════════ */
const DEFAULT_QUIZ = [];
window.IB_DEFAULT_QUIZ = DEFAULT_QUIZ;
