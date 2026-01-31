# 🏸 Générateur de Tournoi Badminton - Guide Bêta-Testeur

## Présentation

Cette application permet de gérer des tournois de badminton en double avec rotation automatique des équipes. Elle fonctionne **100% hors-ligne** (pas besoin d'internet) et peut s'ouvrir sur plusieurs écrans simultanément.

## Comment démarrer

1. **Ouvrir** `index.html` dans un navigateur (Chrome ou Firefox recommandé)
2. **Importer des joueurs** via Menu → "Importer joueurs (XLSX)" ou créer un fichier Excel avec les colonnes : `Nom`, `Prénom`, `Genre` (H/F), `Niveau` (NC, P12, P11, etc.)
3. **Configurer** le nombre de tours, terrains et le mode de comptage (points, temps ou aucun)
4. **Lancer** le tournoi

## Fonctionnalités à tester

| Fonction | Comment tester |
|----------|----------------|
| **Génération automatique** | Vérifier que les paires changent à chaque tour et qu'on ne rejoue jamais avec le même partenaire |
| **Byes équitables** | Si plus de joueurs que de places, vérifier que les repos sont bien répartis et jamais consécutifs |
| **Saisie des scores** | Cliquer sur "Saisir score" sur un match |
| **Validation de tour** | Valider un tour et vérifier le passage au suivant |
| **Retrait de joueur** | En cours de tournoi, retirer un joueur (bouton "Retirer") |
| **Timer synchronisé** | Ouvrir 2 fenêtres, démarrer le timer → il doit se synchroniser |
| **Affichage externe** | Cliquer "Ouvrir" pour afficher les matchs sur un écran secondaire |
| **Sauvegarde/Reprise** | Sauvegarder le tournoi (JSON) puis le reprendre plus tard |

## Points d'attention particuliers

### Répartition des poules (fin de phase 1)
- La poule haute doit contenir `floor(3 × joueurs / terrains)` joueurs
- Exemple : 45 joueurs, 7 terrains → 19 en poule haute, 26 en poule basse

### Byes (joueurs au repos)
- Les byes doivent être équitablement répartis (écart max de 1 entre joueurs)
- Aucun joueur ne doit avoir 2 byes consécutifs
- L'espacement entre les byes d'un même joueur doit être maximal

### Handicaps
- Si activés, les scores initiaux doivent refléter les niveaux des joueurs
- Vérifier que le message de validation indique "selon les handicaps" et non "mis à 0"

### Mode "Aucun comptage"
- Pas de scores à saisir
- Pas de classement affiché à la fin (retour à l'accueil)

## Comment signaler un bug

Merci de noter :

1. **Ce que tu faisais** (ex: "Je validais le tour 3")
2. **Ce qui s'est passé** (ex: "Le score n'a pas été enregistré")
3. **Ce qui était attendu** (ex: "Le score aurait dû s'afficher 21-15")
4. **La configuration** (nb joueurs, terrains, tours, mode de comptage)
5. **Erreurs console** : ouvrir la console (F12) et copier les messages en rouge

## Raccourcis utiles

| Raccourci | Action |
|-----------|--------|
| **F12** | Ouvrir la console développeur (voir les logs/erreurs) |
| **F5** | Rafraîchir la page (les données sont conservées) |
| **Double-clic sur timer** | Configurer la durée du timer |

## Cas de test recommandés

### Test 1 : Tournoi standard
- 28 joueurs, 7 terrains, 10 tours
- Vérifier : pas de partenaire en double, byes équitables

### Test 2 : Beaucoup de byes
- 50 joueurs, 7 terrains, 10 tours (22 byes par tour)
- Vérifier : jamais 2 byes consécutifs

### Test 3 : Retrait de joueur
- Lancer un tournoi, valider 2 tours
- Retirer 1 joueur
- Vérifier : les tours suivants sont régénérés correctement

### Test 4 : Multi-fenêtres
- Ouvrir 2 fenêtres sur le même tournoi
- Démarrer le timer dans une fenêtre
- Vérifier : le timer se synchronise dans l'autre

---

Merci pour ton aide précieuse ! 🙏
