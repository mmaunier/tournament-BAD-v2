# Générateur de Tournois de Badminton en double V2

Application web moderne pour la gestion complète de tournois de badminton en double (ronde suisse). Conçue pour organiser des tournois de manière efficace et équitable, avec un système de handicap intégré et un affichage vidéoprojecteur.

## ✨ Fonctionnalités

### Gestion des Tournois
- **Génération automatique de matchs** en double (Ronde Suisse, sans limite de joueurs)
- **Système de poules** : de 1 à 7 poules (1 par terrain disponible)
- **Gestion dynamique** : retrait de joueurs en cours de tournoi avec recalcul automatique
- **Importation de joueurs** depuis fichiers Excel (.xlsx)
- **Sauvegarde automatique** dans IndexedDB (persistance locale)
- **Export Excel** des résultats et classements

### Système de Scoring
- **3 modes de comptage** : Points (21 pts), Temps (8 min), ou Aucun (affichage "VS")
- **Système de handicap** : attribution de points initiaux selon le niveau
- **Calcul automatique** des handicaps par équipe (somme des handicaps individuels)

### Interface Utilisateur
- **Design responsive** adapté mobile et desktop
- **Navigation SPA** (Single Page Application) avec routeur intégré
- **Modales interactives** pour la saisie des scores
- **Statistiques des joueurs** : matchs joués, tours de repos, écarts

### Affichage Vidéoprojecteur
- **Page dédiée** (`#affichage`) pour projection grand format
- **Multi-sources** : plusieurs tournois peuvent envoyer vers le même affichage
- **Thèmes colorés** : différenciation visuelle par source (bleu, vert, orange)
- **Zone d'attente** : affichage des joueurs en attente

## ⚙️ Moteur de Génération des Tours

Le générateur utilise un algorithme de **Ronde Suisse optimisé** pour créer des matchs équilibrés :

### Contraintes respectées
- **Partenaire unique** : chaque joueur ne joue qu'une seule fois avec le même partenaire
- **Adversaires limités** : maximum 2-3 confrontations contre le même adversaire
- **Équilibrage des repos** : minimisation de l'écart entre le nombre de matchs joués par chaque joueur
- **Rotation équitable** : les joueurs en attente ("sortants") sont priorisés au tour suivant

### Algorithme
1. **Analyse de l'historique** : récupération des partenaires et adversaires précédents
2. **Scoring des combinaisons** : chaque paire possible reçoit un score basé sur les contraintes
3. **Optimisation gloutonne** : sélection des meilleures paires disponibles
4. **Fallback dynamique** : si aucune solution parfaite, relaxation progressive des contraintes

### Gestion dynamique
Lorsqu'un joueur est retiré en cours de tournoi :
- Les tours futurs sont recalculés avec les mêmes contraintes
- L'historique des matchs passés est préservé
- L'équilibrage des repos est ajusté automatiquement

## 🏗️ Architecture

```
tournament-BAD-v2/
├── index.html          # Point d'entrée unique (SPA)
├── css/
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
    │   ├── AccueilPage.js    # Liste des tournois
    │   ├── TournoiPage.js    # Gestion d'un tournoi
    │   ├── ClassementPage.js # Classements et exports
    │   └── AffichagePage.js  # Affichage vidéoprojecteur
    ├── ui/
    │   ├── Components.js # Composants UI réutilisables
    │   └── Modal.js      # Système de modales
    ├── utils/
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

Aucune dépendance npm requise. L'application fonctionne directement dans le navigateur.

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