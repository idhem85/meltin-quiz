# 🧠 MELTIN QUIZ

> **🌐 En ligne : https://meltin-quiz.pages.dev** (Cloudflare Pages) · https://idhem85.github.io/meltin-quiz/ (miroir GitHub Pages)
>
> Build : `npm run build` → `dist/` (esbuild, JSX précompilé, aucun Babel runtime).
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA](https://img.shields.io/badge/PWA-Ready-blueviolet)](https://web.dev/progressive-web-apps/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)](https://firebase.google.com/)
[![Build](https://img.shields.io/badge/Build-esbuild-cyan)](https://esbuild.github.io/)

**Meltin Quiz** est une application PWA de quiz et icebreakers interactifs en temps réel. Conçue pour les séminaires et conférences, elle combine la dynamique de *Kahoot*, l'élégance de *Mentimeter* et la simplicité de *Slido*.

L'application permet de gérer jusqu'à 300 participants simultanément sur le plan gratuit de Firebase.

## ✨ Fonctionnalités

- **5 formats de questions interactives** :
  - 🔘 **QCM** : 2 à 4 options.
  - ☁️ **Nuage de mots** : Agrégation visuelle des réponses.
  - 🎯 **Estimation chiffrée** : Compétition sur la valeur la plus proche de la cible.
  - 📈 **Échelle 1-10** : Mesure de sentiment ou d'opinion.
  - ✅ **Vrai/Faux** : Rapidité et efficacité.
- **Dashboard Administrateur (`#/admin`)** :
  - Gestion complète du quiz (ajout, modification, réordonnancement).
  - Personnalisation visuelle live (couleurs, polices Google Fonts, arrondis).
  - Import/Export de quiz via JSON.
- **Expérience Utilisateur (UX)** :
  - **PWA Installable** : Mode offline pour l'app shell.
  - **Design Moderne** : Glassmorphism, thèmes Dark Mode Navy/Néon, animations fluides.
  - **Mode Double** : Bascule transparente entre démo locale (via `BroadcastChannel`) et production (Firebase).

## 🛠️ Architecture Technique

L'application est bâtie sur une architecture "Lean" pour maximiser la performance et minimiser les coûts d'infrastructure.

### Stack Technique
- **Frontend** : React (via esbuild pour une compilation ultra-rapide).
- **Styling** : Tailwind CSS (Design System basé sur des variables CSS thémables).
- **Backend** : Firebase Firestore (Base de données temps réel).
- **Déploiement** : Cloudflare Pages.

### Optimisations Clés
- **Réduction des Quotas Firebase** : Les résultats sont pré-calculés côté animateur et stockés dans un document unique (`lastResults`), évitant ainsi des milliers de lectures inutiles sur les appareils des participants.
- **Synchronisation Agnostique** : Une couche `sync.js` unifie le transport des données, permettant de passer du mode démo au mode cloud sans modifier la logique métier.
- **Performance de Rendu** : Passage d'un runtime Babel à une compilation statique via `esbuild` pour un temps de chargement quasi instantané.

## 🚀 Installation & Démarrage

### 1. Mode Démo (Local)
Pour tester l'application sans configuration Firebase :
```bash
# Installer esbuild
npm install

# Compiler l'application
npm run build

# Lancer un serveur statique
python3 -m http.server 8080
```
Accédez à `http://localhost:8080`. Ouvrez deux onglets : un pour l'animateur, un pour le participant.

### 2. Mode Production (Firebase)
1. Créez un projet sur la [Console Firebase](https://console.firebase.google.com).
2. Activez **Firestore** en mode production et appliquez les règles contenues dans `firestore.rules`.
3. Copiez vos clés de configuration dans `js/config.js` $\rightarrow$ `FIREBASE_CONFIG`.
4. Déployez via Cloudflare Pages ou Firebase Hosting.

## 📁 Structure du Projet

```
├── css/styles.css           # Design system & Variables CSS
├── js/
│   ├── app.js               # Routeur & Montage React
│   ├── config.js            # Configuration Firebase & Thèmes
│   ├── core/                # Logique métier (Sync, Results, Utils)
│   ├── ui/                  # Composants React partagés
│   └── views/               # Pages (Home, Participant, Host, Dashboard)
├── manifest.webmanifest     # Configuration PWA
└── sw.js                    # Service Worker pour le cache offline
```

## 📄 Licence
Distribué sous licence MIT. Voir `LICENSE` pour plus d'informations.
