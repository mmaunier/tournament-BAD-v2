# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Versionnement Sémantique](https://semver.org/lang/fr/).

## [2.1.0] - 2026-01-31

### Added
- **Guide bêta-testeur** : nouveau fichier `BETA_TESTING.md` avec instructions de test complètes
- **Diagnostic joueurs undefined** : warnings dans la console pour détecter les indices invalides lors de la génération

### Changed
- **Algorithme de byes amélioré** : pénalités fortes pour éviter les byes consécutifs
  - Bye au tour précédent : pénalité de 100 000 points
  - Bye il y a 2 tours : pénalité de 10 000 points
  - Garantit un espacement optimal entre les repos d'un même joueur
- **Calcul répartition poules** : utilise maintenant `floor(3 × joueurs / nbTerrains)` pour la poule haute
  - Exemple : 45 joueurs, 7 terrains → 19 en haute (au lieu de 20), 26 en basse
  - Utilise le nombre de terrains réel du tournoi (plus de 7 en dur)
- **Champs de saisie de score agrandis** : largeur 40px → 60px, police plus grande

### Fixed
- **Message validation tour incohérent** : le message reflète maintenant le comportement réel
  - Avec handicaps : "initialisés selon les handicaps (égalité)"
  - Sans handicaps : "mis à 0:0 (égalité)"

## [2.0.3] - 2026-01-01

### Added
- **Contrôle partagé du timer** : les boutons Play/Pause/Stop fonctionnent depuis n'importe quelle fenêtre et affectent toutes les instances
- **Système de commandes synchronisées** : les actions du timer sont propagées via localStorage à toutes les fenêtres ouvertes
- **Transfert de maîtrise** : la fenêtre qui clique sur "Play" devient automatiquement le maître du timer

### Changed
- **Architecture du timer** : refactorisation complète du système de synchronisation avec gestion des commandes partagées
- **Fréquence de polling** : passage de 250ms à 200ms pour une meilleure réactivité
- **Spinners numériques** : masquage des flèches natives des champs de saisie numérique (handicaps, scores) pour une interface plus épurée

### Fixed
- **Pause/Stop multi-fenêtres** : correction du problème où seule la fenêtre "maître" pouvait contrôler le timer

## [2.0.2] - 2025-12-31

### Added
- **Mode hors-ligne complet** : toutes les polices (Inter, Poppins, Oswald) sont maintenant stockées localement dans `assets/fonts/`
- **Polices personnalisées** : ajout de la police Oswald Semi-Bold pour les titres principaux
- **Tooltip joueurs** : survol des noms de joueurs sur la page vidéoprojecteur affiche le nom complet
- **Design responsive avancé** : 5 breakpoints adaptatifs (smartphone, tablette, desktop, grand écran, très grand écran)

### Changed
- **Typographie des titres** : utilisation de la police Oswald pour les titres des pages Accueil et Classement
- **Page d'accueil améliorée** : distribution verticale uniforme des sections avec Flexbox
- **Tags joueurs adaptatifs** : taille de police et padding ajustés selon la taille d'écran
- **Badge compteur joueurs** : nouveau style avec fond bleu clair et texte foncé pour meilleure lisibilité
- **Harmonisation CSS** : remplacement des valeurs en pixels par des variables CSS (`--spacing-*`)
- **Suppression des dépendances externes** : plus besoin de connexion internet (Google Fonts remplacé par polices locales)

### Fixed
- **Layout grandes résolutions** : correction de l'affichage sur écrans ≥1400px et ≥1800px (sections coupées)
- **Classes de page** : ajout des classes `page-accueil` et `page-classement` pour un ciblage CSS correct

## [2.0.1] - 2025-12-30

### Added
- **Timer de match** : compte à rebours configurable avec contrôles Play/Pause/Stop
- **Configuration du timer** : modal de paramétrage accessible via roue dentée ou double-clic
- **Synchronisation timer** : affichage du timer sur la page vidéoprojecteur en temps réel
- **Signal sonore** : buzzer (`assets/sons/buzzer.wav`) à la fin du compte à rebours
- **Alertes visuelles** : animation clignotante quand le timer atteint les 30 dernières secondes
- **Durée par défaut** : le timer utilise automatiquement le `tempsMatch` configuré dans le tournoi
- **Splitter ajustable** : séparateur redimensionnable entre terrains et zone d'attente sur la page d'affichage

### Changed
- **Affichage responsive** : les noms des joueurs s'adaptent maintenant à la hauteur de la fenêtre (clamp CSS)
- **Réinitialisation des paramètres** : lors de l'import d'un nouveau fichier joueurs ou de la réinitialisation, les paramètres reviennent aux valeurs par défaut (temps=8min, points=21, handicaps)
- **Sauvegarde complète** : `tempsMatch` et `pointsMax` sont maintenant sauvegardés avec le tournoi

### Removed
- **Mode plein écran** : fonctionnalité retirée (remplacée par le timer plus pratique)

### Fixed
- **Affichage joueurs** : correction du problème où les noms disparaissaient quand la fenêtre était réduite en hauteur
- **Configuration timer** : la valeur configurée dans la préparation du tournoi est maintenant correctement utilisée

## [2.0.0] - 2025-12-30

### Added
- **Architecture SPA** : Refonte complète en Single Page Application
- **Routeur hash-based** : Navigation fluide sans rechargement de page
- **Bus d'événements** : Communication découplée entre composants
- **IndexedDB** : Persistance locale des tournois avec sauvegarde automatique
- **Page d'affichage vidéoprojecteur** : Nouvelle page dédiée (`#affichage`) pour projection grand format
- **Multi-sources** : Support de plusieurs tournois envoyant vers le même affichage
- **Thèmes colorés** : Différenciation visuelle automatique par source (bleu, vert, orange)
- **Mode "Aucun"** : Nouveau mode de comptage sans score (affichage "VS")
- **Statistiques joueurs** : Modal affichant les matchs joués, tours de repos et écarts
- **Panneau de contrôle** : Envoi des données vers l'affichage depuis l'en-tête du tournoi
- **Numéro de tour** : Affichage du tour en cours dans l'en-tête des terrains

### Changed
- **Calcul des handicaps** : Somme directe des handicaps par équipe (peut être négatif)
- **Pré-remplissage des scores** : Modal de score initialisée avec les handicaps
- **Validation des matchs** : Utilise les scores initiaux (handicaps) au lieu de 0-0
- **Interface responsive** : Design adapté mobile et desktop
- **Structure CSS modulaire** : Variables, base, composants, layout, pages

### Fixed
- **Mode "aucun"** : Affichage "VS" et pas de modification des scores à la validation
- **Sensibilité à la casse** : Mode de comptage comparé en minuscules
- **Route /affichage** : Respect du hash dans l'URL au démarrage

### Removed
- Ancienne structure multi-fichiers HTML
- Dépendance au fichier `import.js` pour les rotations

## [1.x.x] - Versions précédentes

Voir le dépôt original [orykami/badminton-tournament](https://github.com/orykami/badminton-tournament) pour l'historique des versions antérieures.
