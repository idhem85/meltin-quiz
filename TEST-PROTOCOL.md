# 📱 Protocole de test sur vrai téléphone — MELTIN QUIZ

À exécuter **avant le jour J** (idéalement 2× : une fois chez soi, une fois **sur le wifi du lieu de l'évènement** — les portails captifs bloquent parfois les websockets Firebase).

**Durée : ~15 minutes.** Matériel : 1 ordinateur (écran animateur) + 1 téléphone (participant).

Production : **https://meltin-quiz.pages.dev**

---

## 0. Préparation (2 min)

| # | Action | ✅ Point de contrôle |
|---|--------|---------------------|
| 0.1 | Sur l'ordinateur : ouvrir https://meltin-quiz.pages.dev | La page d'accueil s'affiche, fond sombre, sans erreur visible |
| 0.2 | Cliquer **Créer (Animateur)** | Le lobby s'affiche avec **🌐 MODE EN LIGNE** |
| 0.3 | Noter le code de salle affiché (ex : `N2RKM7`) | Le QR code est net, non coupé, centré |

> ⚠️ Si le badge dit « 🔧 MODE DÉMO LOCAL » : la config Firebase n'est pas chargée — rechargez la page (Ctrl+Shift+R).

---

## 1. Scan du QR code (2 min)

| # | Action | ✅ Point de contrôle |
|---|--------|---------------------|
| 1.1 | Avec la caméra du téléphone (app Appareil photo iOS/Android), viser le QR à l'écran | La notification propose d'ouvrir `meltin-quiz.pages.dev` |
| 1.2 | Ouvrir le lien | Le téléphone atterrit **directement sur l'écran « Bienvenue ! — Salle XXXXXX — choisissez votre pseudo »** (pas la page d'accueil) |
| 1.3 | Vérifier le nom de salle affiché sur le téléphone | **Identique** au code affiché sur l'ordinateur |

> ❌ Si le téléphone arrive sur la page d'accueil avec le code pré-rempli : service worker périmé sur ce téléphone → ouvrir dans un onglet privé, ou vider les données du site (Réglages → Navigateur → Données des sites).

---

## 2. Join & lobby temps réel (1 min)

| # | Action | ✅ Point de contrôle |
|---|--------|---------------------|
| 2.1 | Taper un pseudo (2-20 caractères) et valider **Rejoindre la partie 🚀** | Un emoji aléatoire + le pseudo s'affichent |
| 2.2 | Regarder l'ordinateur | Le chip du joueur apparaît dans « Participants connectés » **en moins de 2 s**, compteur à 1 |
| 2.3 | Regarder le téléphone | Écran d'attente : « Regardez l'écran principal » avec animation |

---

## 3. Vote & haptique (3 min)

Lancer la question 1 depuis l'ordinateur (**▶ Lancer la question 1**), puis sur le téléphone :

| # | Action | ✅ Point de contrôle |
|---|--------|---------------------|
| 3.1 | Observer l'arrivée de la question | La question apparaît **en moins de 2 s** sans action sur le téléphone |
| 3.2 | Si la question a un timer (Big Quiz) : regarder la barre de temps | La barre dégringole en continu ; sous 5 s elle passe en rouge « ⏰ Dernières secondes ! » |
| 3.3 | Répondre (bouton, slider, ou champ texte selon le format) | **Léger retour haptique** (vibration) au moment du tap + son de verrouillage |
| 3.4 | Regarder la confirmation | « Réponse enregistrée — en attente des résultats… » et les inputs sont désactivés |
| 3.5 | Regarder l'ordinateur | Le compteur passe à « **1 reçu** » quasi instantanément |
| 3.6 | Attendre l'échéance du timer (ou cliquer **🔒 Clôturer les votes**) | Sur le téléphone : « Temps écoulé » si pas répondu ; sur l'ordi : bascule auto en résultats |
| 3.7 | Écran résultats des deux côtés | Le nuage/barres affiche la réponse du téléphone ; sur le téléphone : mini-récap avec sa réponse marquée |

> 🔊 Sur l'ordinateur : on doit entendre la montée au lancement, les ticks de fin, la sonnerie de temps écoulé, la révélation. Vérifier aussi le toggle 🔊 dans Dashboard → Sons & timer.

---

## 4. Boucle complète 3 formats (5 min)

Dérouler au moins : **QCM** (boutons A-D), **nuage de mots** (champ texte), **échelle 1-10** (slider) et **estimation** (pavé).

| # | Action | ✅ Point de contrôle |
|---|--------|---------------------|
| 4.1 | Voter sur chaque format | Chaque format a une UI adaptée, aucun débordement à l'écran |
| 4.2 | QCM avec bonne réponse cochée (✅ dans le dashboard) | Sur le téléphone : son « gagnant » si bonne option, son « perdant » sinon |
| 4.3 | Estimation avec cible (`target`) | L'animateur voit 🎯 « le plus proche » + cartes Min/Moyenne/Max |
| 4.4 | Passage à la question suivante | Le téléphone enchaîne tout seul : nouvelle question, vote réinitialisé |
| 4.5 | Question avec timer à 0 **sans** répondre | Le téléphone affiche « Temps écoulé — réponses verrouillées » et ne peut plus voter — la question reste comptée côté animateur |

---

## 5. PWA : installation (2 min)

| # | Action | ✅ Point de contrôle |
|---|--------|---------------------|
| 5.1 | Sur le téléphone : menu du navigateur → **« Ajouter à l'écran d'accueil »** (iOS : Partager → Sur l'écran d'accueil) | L'option est proposée (le manifest est bien servi) |
| 5.2 | Valider l'installation | Une icône 🧠 « MELTIN » apparaît sur l'écran d'accueil |
| 5.3 | Lancer l'app depuis l'icône | Ouverture **plein écran** (pas de barre d'URL — mode standalone) |
| 5.4 | **Mode avion** activé → relancer l'app | L'app-shell se charge toujours (écran accueil) — c'est le service worker ; Firebase affichera une erreur de connexion, c'est normal |

---

## 6. Robustesse (3 min) — les pièges du jour J

| # | Scénario | ✅ Point de contrôle |
|---|----------|---------------------|
| 6.1 | Couper le wifi 10 s pendant une question, le rallumer | L'animateur retrouve le joueur ; le téléphone se resynchronise (Firestore gère la reconnexion) |
| 6.2 | Tuer l'onglet/navigateur du téléphone, rouvrir le lien | La session se restaure (pseudo conservé) et le joueur réapparaît au lobby |
| 6.3 | **2 téléphones** (ou 1 téléphone + 1 onglet privé) : deux pseudos différents | Les deux chips apparaissent ; deux votes comptés ; podium cohérent |
| 6.4 | Verrouiller l'écran du téléphone 30 s pendant une question active | Au réveil, l'app rattrape l'état courant (question/résultats en cours) |
| 6.5 | Écran animateur : taille de la fenêtre réduite puis fullscreen (bouton ⛶ ou touche F) | La barre de contrôle s'efface après 4 s et revient au moindre mouvement |

---

## 7. Check-list finale jour J

- [ ] Test refait **sur le wifi du lieu** (ou en partage de connexion 4G en secours)
- [ ] Ordinateur branché en **HDMI/vidéoprojecteur**, mode plein écran testé (⛶ / F)
- [ ] Volume de l'ordinateur audibles depuis le fond de la salle
- [ ] Dashboard : questions relues, durées de timer choisies (20 s QCM / 30-45 s estimations), **PIN changé** (`js/config.js` → `ADMIN_PIN`)
- [ ] Règles Firestore déployées (`firebase deploy --only firestore:rules`) — pas en mode test expiré
- [ ] Quota Firebase : console → Firestore → onglet Utilisation (normalement < 10 % pour 300 personnes × 2 h)
- [ ] Un onglet de secours ouvert sur le téléphone animateur (si l'ordinateur plante, l'app est responsive : le lobby marche sur mobile)

---

## Dépannage rapide

| Symptôme | Cause probable | Remède |
|---|---|---|
| « MODE DÉMO LOCAL » au lieu d'EN LIGNE | `FIREBASE_CONFIG` absent/erreur | Recharger la page ; vérifier `js/config.js` |
| Le QR mène à localhost | Page servie en local (bundle de test) | Utiliser l'URL production `meltin-quiz.pages.dev` |
| « Salle introuvable » | Code mal saisi ou salle créée avant un reset | Recréer la salle côté animateur, re-scanner |
| Téléphone bloqué sur une ancienne version | Service worker périmé | Onglet privé, ou vider les données du site puis recharger |
| Aucun son sur l'ordinateur | Autoplay bloqué avant interaction | Cliquer une fois n'importe où dans la page (unlock audio) |
| Timer figé sur le téléphone | Horloge du téléphone très décalée | Régler l'heure automatique du téléphone |
