/* ════════════════════════════════════════════════════════════════
   BUILD DE PRODUCTION — MELTIN QUIZ
   Génère dist/ : version compilée (esbuild, JSX → React.createElement)
   de l'application, sans Babel runtime, prête pour Cloudflare Pages,
   GitHub Pages ou tout hébergeur statique.

   - Les 6 fichiers JSX sont compilés séparément (structure préservée)
     avec jsx:'transform' → ils continuent d'utiliser le React UMD
     global chargé par CDN (aucun npm react requis).
   - Les fichiers non-JSX (config, data, core) sont copiés tels quels.
   - dist/index.html est dérivé de index.html : scripts text/babel
     remplacés par des <script defer> vers la version compilée.
════════════════════════════════════════════════════════════════ */
import { build, context } from 'esbuild';
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';

const WATCH = process.argv.includes('--watch');
const DIST = 'dist';

const JSX_ENTRIES = [
  'js/ui/components.js',
  'js/views/home.js',
  'js/views/participant.js',
  'js/views/host.js',
  'js/views/dashboard.js',
  'js/app.js',
];

/* Fichiers JS sans JSX : copiés à l'identique */
const PLAIN_JS = [
  'js/config.js',
  'js/data/defaultQuiz.js',
  'js/core/utils.js',
  'js/core/results.js',
  'js/core/theme.js',
  'js/core/sync.js',
];

/* index.html → dist/index.html : retrait de Babel, scripts compilés */
function buildHtml() {
  let html = readFileSync('index.html', 'utf8');

  // 1) Retire Babel standalone (et son commentaire d'avertissement)
  html = html.replace(
    /<!-- Babel standalone[\s\S]*?babel\.min\.js"><\/script>\n*/m,
    '<!-- Scripts compilés par esbuild (aucun Babel runtime en production) -->\n'
  );

  // 2) text/babel → script classique différé (ordre préservé ; defer
  //    garantit l'exécution après parsing du DOM, comme avec Babel).
  html = html.replace(
    /<script type="text\/babel"[^>]*src="([^"]+)"[^>]*><\/script>/g,
    '<script defer src="$1"></script>'
  );

  // 3) Commentaires obsolètes mentions Babel
  html = html.replace(
     '     - Scripts JSX : chargés via text/babel (transpilés par Babel,\n       exécutés dans l\'ordre : components → views → app) -->',
     '     - Scripts JSX : précompilés par esbuild (voir build-dist.mjs),\n       exécutés dans l\'ordre : components → views → app -->'
  );
  html = html.replace(
     '<!-- Vues + routeur : compilés par Babel (type="text/babel") -->',
     '<!-- Vues + routeur : précompilés par esbuild -->'
  );

  writeFileSync(`${DIST}/index.html`, html);
}

/* Copie des assets statiques non compilés */
function copyStatic() {
  for (const f of PLAIN_JS) cpSync(f, `${DIST}/${f}`);
  cpSync('css', `${DIST}/css`, { recursive: true });
  cpSync('manifest.webmanifest', `${DIST}/manifest.webmanifest`);
  cpSync('sw.js', `${DIST}/sw.js`);
  buildHtml();
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
copyStatic();

const options = {
  entryPoints: JSX_ENTRIES,
  outbase: 'js',
  outdir: `${DIST}/js`,
  loader: { '.js': 'jsx' },
  jsx: 'transform',          // React.createElement — React reste global UMD
  bundle: false,             // fichiers indépendants (globals partagés)
  minify: true,
  sourcemap: true,
  target: ['es2018'],
  logLevel: 'info',
};

if (WATCH) {
  /* Re-build JS à chaque modification + re-copie des statiques */
  const reCopy = {
    name: 'recopy-static',
    setup(b) { b.onEnd(() => { try { copyStatic(); console.log('dist/ mis à jour'); } catch (e) {} }); },
  };
  const ctx = await context({ ...options, plugins: [reCopy] });
  await ctx.watch();
  console.log('── watch actif (Ctrl-C pour stopper) ──');
} else {
  await build(options);
  console.log('✓ dist/ prêt (Cloudflare Pages : répertoire de sortie = dist)');
}
