/* ════════════════════════════════════════════════════════════════
   CONFIGURATION — MELTIN QUIZ
════════════════════════════════════════════════════════════════ */

/* PIN du dashboard (#/admin) — modifiable ici.
   Stocké haché (SHA-256) ; "1234" par défaut à CHANGER avant l'évènement. */
const ADMIN_PIN = '1234';

/* ── Firebase (mode en ligne) ──────────────────────────────────
   Projet : icebreak-quiz
   ⚠️ La clé API d'une app Web Firebase n'est pas un secret (elle
   est publique par design) : la SÉCURITÉ repose sur les règles
   Firestore — déployez firestore.rules (voir README).            */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAdrNTmTe44uzke4W-jLZBH9BxRU8AweGY",
  authDomain: "icebreak-quiz.firebaseapp.com",
  projectId: "icebreak-quiz",
  storageBucket: "icebreak-quiz.firebasestorage.app",
  messagingSenderId: "983086356172",
  appId: "1:983086356172:web:9f74f76fa3d43b08ec9469",
};

/* Titre par défaut d'une session (modifiable au cas par cas via le
   quiz cloud du dashboard) */
const QUIZ_TITLE = 'Quiz interactif — créez le vôtre dans le dashboard 🎛️';

/* ── Presets de thèmes (éditables via le dashboard #/admin) ────
   Chaque preset surcharge les variables CSS définies dans
   css/styles.css (--bg, --accent, --radius, --font-display…).
   C'est le document rooms/{room}.theme qui fait foi à l'exécution. */
const THEME_PRESETS = {
  navy: {
    label: 'Navy Néon (défaut)',
    vars: {
      '--bg': '#0b1226', '--bg-2': '#101a33', '--bg-3': '#1b2540',
      '--accent': '#22d3ee', '--accent-2': '#a78bfa', '--accent-3': '#34d399',
      '--text': '#f1f5f9', '--text-dim': '#94a3b8',
      '--radius': '1.25rem', '--font-display': "'Poppins', sans-serif",
    },
  },
  midnight: {
    label: 'Midnight Or',
    vars: {
      '--bg': '#0a0a12', '--bg-2': '#12121f', '--bg-3': '#1c1c2e',
      '--accent': '#fbbf24', '--accent-2': '#f59e0b', '--accent-3': '#fde68a',
      '--text': '#fafafa', '--text-dim': '#a1a1aa',
      '--radius': '0.75rem', '--font-display': "'Inter', sans-serif",
    },
  },
  corporate: {
    label: 'Corporate Bleu',
    vars: {
      '--bg': '#0f172a', '--bg-2': '#1e293b', '--bg-3': '#273449',
      '--accent': '#38bdf8', '--accent-2': '#818cf8', '--accent-3': '#2dd4bf',
      '--text': '#f8fafc', '--text-dim': '#94a3b8',
      '--radius': '0.5rem', '--font-display': "'Inter', sans-serif",
    },
  },
  forest: {
    label: 'Forêt Émeraude',
    vars: {
      '--bg': '#071a14', '--bg-2': '#0c2a20', '--bg-3': '#123a2c',
      '--accent': '#34d399', '--accent-2': '#a7f3d0', '--accent-3': '#fbbf24',
      '--text': '#ecfdf5', '--text-dim': '#86b7a5',
      '--radius': '1.5rem', '--font-display': "'Poppins', sans-serif",
    },
  },
};

/* Options de réponse globales (couleurs A→D) */
const OPT_COLOR = ['#f43f5e', '#3b82f6', '#f59e0b', '#10b981'];
const OPT_GRADIENT = [
  'linear-gradient(90deg,#f43f5e,#fb7185)',
  'linear-gradient(90deg,#2563eb,#60a5fa)',
  'linear-gradient(90deg,#d97706,#fbbf24)',
  'linear-gradient(90deg,#059669,#34d399)',
];
const OPT_LABEL = ['A', 'B', 'C', 'D'];

/* Exposition pour scripts classiques (pas de modules — compat file://) */
window.IB_CONFIG = { FIREBASE_CONFIG, ADMIN_PIN, QUIZ_TITLE, THEME_PRESETS, OPT_COLOR, OPT_GRADIENT, OPT_LABEL };
