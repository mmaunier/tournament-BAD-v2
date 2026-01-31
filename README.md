# Générateur de Tournois de Badminton en double V2

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Application web moderne pour la gestion complète de tournois de badminton en double (ronde suisse). Conçue pour organiser des tournois de manière efficace et équitable, avec un système de handicap intégré et un affichage vidéoprojecteur.

> 📋 **Bêta-testeurs** : consultez le [Guide de Bêta-Test](BETA_TESTING.md) pour les instructions de test.

## ✨ Fonctionnalités

### Gestion des Tournois
- **Génération automatique de matchs** en double (Ronde Suisse, sans limite de joueurs)
- **Système de poules** : autant que de terrains disponibles
- **Gestion dynamique** : retrait de joueurs en cours de tournoi avec recalcul automatique
- **Importation de joueurs** depuis fichiers Excel (.xlsx)
- **Sauvegarde automatique** dans IndexedDB (persistance locale)
- **Export Excel** des résultats et classements

### Système de Scoring
- **3 modes de comptage** : Points (21 pts), Temps (8 min), ou Aucun (affichage "VS")
- **Système de handicap** : attribution de points initiaux selon le niveau
- **Calcul automatique** des handicaps par équipe (somme des handicaps individuels)

### Interface Utilisateur
- **Design responsive** adapté mobile, tablette et desktop (5 breakpoints)
- **Mode hors-ligne** : fonctionne sans connexion internet (polices embarquées)
- **Navigation SPA** (Single Page Application) avec routeur intégré
- **Modales interactives** pour la saisie des scores
- **Statistiques des joueurs** : matchs joués, tours de repos, écarts

### Affichage Vidéoprojecteur
- **Page dédiée** (`#affichage`) pour projection grand format
- **Multi-sources** : plusieurs tournois peuvent envoyer vers le même affichage
- **Thèmes colorés** : différenciation visuelle par source (bleu, vert, orange)
- **Zone d'attente** : affichage des joueurs en attente
- **Splitter ajustable** : redimensionnement de la zone terrains/attente
- **Tooltip joueurs** : survol des noms tronqués affiche le nom complet

### Timer de Match
- **Compte à rebours** : timer configurable pour la durée des matchs
- **Contrôles intuitifs** : boutons Play/Pause/Stop et configuration par roue dentée
- **Synchronisation multi-fenêtres** : le timer est partagé entre toutes les instances
- **Contrôle partagé** : pause/stop depuis n'importe quelle fenêtre affecte toutes les autres
- **Alertes visuelles** : animation clignotante en fin de temps
- **Signal sonore** : buzzer à la fin du compte à rebours
- **Durée par défaut** : utilise le temps configuré dans les paramètres du tournoi

## ⚙️ Moteur de Génération des Tours

Le générateur utilise un algorithme de **Ronde Suisse optimisé** pour créer des matchs équilibrés :

### Contraintes respectées
- **Partenaire unique** : chaque joueur ne joue qu'une seule fois avec le même partenaire
- **Adversaires limités** : maximum 2-3 confrontations contre le même adversaire
- **Équilibrage des repos** : minimisation de l'écart entre le nombre de matchs joués par chaque joueur
- **Jamais de byes consécutifs** : un joueur au repos ne peut pas l'être au tour suivant
- **Espacement optimal des byes** : les repos d'un même joueur sont espacés au maximum
- **Rotation équitable** : les joueurs en attente ("sortants") sont priorisés au tour suivant

### Algorithme
1. **Sélection des byes** : scoring avec pénalités fortes pour éviter les byes consécutifs
2. **Analyse de l'historique** : récupération des partenaires et adversaires précédents
3. **Scoring des combinaisons** : chaque paire possible reçoit un score basé sur les contraintes
4. **Optimisation gloutonne** : sélection des meilleures paires disponibles
5. **Fallback dynamique** : si aucune solution parfaite, relaxation progressive des contraintes

### Gestion dynamique
Lorsqu'un joueur est retiré en cours de tournoi :
- Les tours futurs sont recalculés avec les mêmes contraintes
- L'historique des matchs passés est préservé
- L'équilibrage des repos est ajusté automatiquement

### Répartition en poules (fin de phase)
- **Poule haute** : `floor(3 × joueurs / nbTerrains)` joueurs (médiane inférieure)
- **Poule basse** : le reste des joueurs
- Exemple : 45 joueurs, 7 terrains → 19 en haute, 26 en basse

## 🏗️ Architecture

```
tournament-BAD-v2/
├── index.html          # Point d'entrée unique (SPA)
├── assets/
│   ├── fonts/          # Polices locales (Inter, Poppins, Oswald)
│   │   ├── inter-variable.woff2
│   │   ├── poppins-600.woff2
│   │   ├── poppins-700.woff2
│   │   └── oswald-600.woff2
│   └── sons/
│       └── buzzer.wav  # Son de fin de timer
├── css/
│   ├── fonts.css       # Définitions @font-face
│   ├── variables.css   # Variables CSS (couleurs, espacements)
│   ├── base.css        # Styles de base
│   ├── components.css  # Composants réutilisables
│   ├── layout.css      # Mise en page
│   └── pages.css       # Styles spécifiques aux pages
└── js/
    ├── app.js          # Point d'entrée, initialisation
    ├── core/
    │   ├── Router.js   # Routeur SPA (hash-based)
    │   └── EventBus.js # Bus d'événements global
    ├── db/
    │   ├── Database.js # Wrapper IndexedDB
    │   └── TournoiDB.js# Opérations CRUD tournois
    ├── pages/
    │   ├── AccueilPage.js    # Configuration du tournoi
    │   ├── TournoiPage.js    # Gestion d'un tournoi + timer
    │   ├── ClassementPage.js # Classements et exports
    │   └── AffichagePage.js  # Affichage vidéoprojecteur
    ├── ui/
    │   ├── Components.js # Composants UI réutilisables
    │   └── Modal.js      # Système de modales
    ├── utils/
    │   ├── Timer.js           # Gestionnaire de compte à rebours
    │   ├── TournoiGenerateur.js   # Génération des tours
    │   └── GenerateurDynamique.js # Algorithmes de rotation
    └── ext/
        └── xlsx.full.min.js # Librairie SheetJS
```

## 🚀 Installation

```bash
git clone https://github.com/mmaunier/tournament-BAD-v2
cd tournament-BAD-v2
```

Aucune dépendance npm requise. L'application fonctionne directement dans le navigateur, même sans connexion internet.

## 📖 Utilisation

1. Ouvrez `index.html` dans votre navigateur (ou servez via un serveur local)
2. Créez un nouveau tournoi ou importez des joueurs depuis Excel
3. Configurez les terrains, le mode de comptage et les handicaps
4. Générez les tours et saisissez les scores
5. Pour l'affichage vidéoprojecteur : ouvrez `#affichage` dans une nouvelle fenêtre

### Affichage Multi-Sources

Plusieurs onglets de tournoi peuvent envoyer leurs données vers la même page d'affichage :
- Chaque source reçoit automatiquement une couleur distincte
- Les terrains sont triés par numéro
- Les joueurs en attente sont combinés

## 🔧 Configuration

### Modes de Comptage
| Mode | Description | Score initial avec handicap |
|------|-------------|----------------------------|
| Points | Match en 21 points | Handicap ajouté au score |
| Temps | Match en 8 minutes | Handicap ajouté au score |
| Aucun | Pas de score affiché | Affichage "VS" uniquement |

### Système de Handicap
- Chaque joueur peut avoir un handicap positif ou négatif
- Le handicap d'équipe = somme des handicaps des 2 joueurs
- L'équipe avec le handicap le plus faible commence avec des points de compensation

## 🙏 Crédits

Ce projet est un fork entièrement réécrit du dépôt original [orykami/badminton-tournament](https://github.com/orykami/badminton-tournament).

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📋 Changelog

Voir le fichier [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.   