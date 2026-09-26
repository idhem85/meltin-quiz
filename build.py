#!/usr/bin/env python3
"""Bundler de test : inline les sources multi-fichiers dans un artefact
unique (preview-bundle.html) pour exécution dans les environnements qui
ne servent qu'un fichier. Les sources multi-fichiers restent la référence
de déploiement ; ce bundle est un artefact de test/présentation."""
import pathlib

ROOT = pathlib.Path(__file__).parent

src = (ROOT / 'index.html').read_text(encoding='utf-8')

# 1) CSS inline
css = (ROOT / 'css/styles.css').read_text(encoding='utf-8')
src = src.replace(
    '<link rel="stylesheet" href="css/styles.css" />',
    '<style>\n' + css + '\n</style>'
)

# 2) Manifest inline (data URL) — retire la référence fichier
manifest_json = (ROOT / 'manifest.webmanifest').read_text(encoding='utf-8')
import json, urllib.parse
data_url = 'data:application/manifest+json,' + urllib.parse.quote(manifest_json)
src = src.replace('href="manifest.webmanifest"', 'href="' + data_url + '"')

# 3) JS classiques inline (config, data, core)
for path in ['js/config.js', 'js/data/defaultQuiz.js', 'js/core/utils.js',
             'js/core/results.js', 'js/core/theme.js', 'js/core/sync.js']:
    code = (ROOT / path).read_text(encoding='utf-8')
    tag = f'<script src="{path}"></script>'
    src = src.replace(tag, '<script>\n' + code + '\n</script>')

# 4) JSX (text/babel) : Babel standalone gère les scripts inline
for path in ['js/ui/components.js', 'js/views/home.js', 'js/views/participant.js',
             'js/views/host.js', 'js/views/dashboard.js', 'js/app.js']:
    code = (ROOT / path).read_text(encoding='utf-8')
    if path == 'js/app.js':
        tag = '<script type="text/babel" data-presets="react" src="js/app.js"></script>'
    else:
        tag = f'<script type="text/babel" data-presets="react" src="{path}"></script>'
    src = src.replace(tag, '<script type="text/babel" data-presets="react">\n' + code + '\n</script>')

# 5) Service worker : désactivé dans le bundle (scope inline non applicable)
src = src.replace(
    "if ('serviceWorker' in navigator && location.protocol !== 'file:') {",
    "if (false) { // SW désactivé dans le bundle de test"
)

out = ROOT / 'preview-bundle.html'
out.write_text(src, encoding='utf-8')
print('wrote', out, f'({out.stat().st_size // 1024} Ko)')

# Vérification : plus aucune référence locale externe
import re
leftovers = re.findall(r'(?:src|href)="(?:js|css)/[^"]+"', src)
print('références locales restantes :', leftovers or 'aucune ✓')
