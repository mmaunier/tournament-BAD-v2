# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Versionnement Sémantique](https://semver.org/lang/fr/).

## [2.0.1] - 2024-12-30

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

## [2.0.0] - 2024-12-30

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
