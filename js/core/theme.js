/* ════════════════════════════════════════════════════════════════
   CORE — Thème : applique les variables CSS d'un objet thème.
   Un thème = { preset?, vars? }. Les vars surchargent le preset ;
   tout est injecté sur :root en propriétés CSS personnalisées.
════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const applyTheme = (theme) => {
    const root = document.documentElement;
    const presets = window.IB_CONFIG.THEME_PRESETS;
    const t = theme || {};
    const base = t.preset && presets[t.preset] ? presets[t.preset].vars : presets.navy.vars;
    const merged = Object.assign({}, base, t.vars || {});
    Object.entries(merged).forEach(([k, v]) => { if (k.startsWith('--') && v) root.style.setProperty(k, v); });
  };

  /* Recharge la police display dynamiquement (Google Fonts) */
  const loadDisplayFont = (family) => {
    if (!family) return;
    const fam = family.replace(/['"]/g, '').split(',')[0].trim();
    if (!fam) return;
    const id = 'ib-font-display';
    let link = document.getElementById(id);
    if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link); }
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fam).replace(/%20/g, '+') + ':wght@600;700;800;900&display=swap';
  };

  /* Liste éditable de polices display proposées dans le dashboard */
  const FONT_CHOICES = ['Poppins', 'Inter', 'Montserrat', 'Space Grotesk', 'Playfair Display', 'DM Sans'];

  window.IB.theme = { applyTheme, loadDisplayFont, FONT_CHOICES };
})();
