/**
 * Générateur Dynamique de Tournoi de Badminton en Double
 * 
 * Approche en 3 phases par tour :
 * 1. Sélection des BYES (joueurs qui ne jouent pas)
 * 2. Formation des PAIRES (coéquipiers - jamais 2 fois ensemble)
 * 3. Formation des MATCHS (adversaires - max 2-3 fois contre)
 * 
 * @author Assistant IA
 * @version 2.0
 */

class GenerateurDynamique {
   /**
    * @param {number} nbJoueurs - Nombre total de joueurs
    * @param {number} nbTerrains - Nombre de terrains disponibles
    * @param {number} nbTours - Nombre de tours à générer (null = max possible)
    */
   constructor(nbJoueurs, nbTerrains, nbTours = null) {
      this.nbJoueurs = nbJoueurs;
      this.nbTerrains = nbTerrains;
      
      // Calcul du nombre max de joueurs par tour (4 par terrain)
      this.joueursParTour = Math.min(4 * nbTerrains, Math.floor(nbJoueurs / 4) * 4);
      this.byesParTour = nbJoueurs - this.joueursParTour;
      
      // Nombre max de tours = N-1 (chaque joueur peut avoir N-1 partenaires différents)
      this.nbToursMax = nbJoueurs - 1;
      this.nbTours = nbTours === null ? this.nbToursMax : Math.min(nbTours, this.nbToursMax);
      
      // Matrices de suivi des contraintes
      this.partenaireCount = this.creerMatrice(nbJoueurs); // Combien de fois i a joué avec j
      this.adversaireCount = this.creerMatrice(nbJoueurs); // Combien de fois i a joué contre j
      
      // Suivi des byes
      this.byeCount = new Array(nbJoueurs).fill(0);        // Nombre de byes par joueur
      this.dernierBye = new Array(nbJoueurs).fill(-999);   // Dernier tour où le joueur était en bye
      
      // Suivi des joueurs retirés (persistant entre les appels)
      this.joueursRetiresDefinitivement = new Set();       // Joueurs qui ont quitté le tournoi
      
      // Résultats
      this.tours = [];      // Liste des tours générés
      this.byes = [];       // Liste des byes par tour
      this.stats = null;    // Statistiques finales
      
      // Générer le tournoi
      this.generer();
   }

   /**
    * Crée une matrice NxN initialisée à 0
    */
   creerMatrice(n) {
      return Array.from({ length: n }, () => new Array(n).fill(0));
   }

   /**
    * Génère tous les tours du tournoi
    */
   generer() {
      console.log(`Génération: ${this.nbJoueurs} joueurs, ${this.nbTerrains} terrains, ${this.nbTours} tours`);
      console.log(`Joueurs par tour: ${this.joueursParTour}, Byes par tour: ${this.byesParTour}`);
      
      for (let t = 0; t < this.nbTours; t++) {
         const tour = this.genererTour(t);
         if (tour === null) {
            console.warn(`Impossible de générer le tour ${t + 1}, arrêt.`);
            break;
         }
         this.tours.push(tour.matchs);
         this.byes.push(tour.byes);
      }
      
      this.calculerStats();
      console.log('Génération terminée:', this.stats);
   }

   /**
    * Génère un tour complet
    * @param {number} numTour - Numéro du tour (0-indexed)
    * @returns {Object} - { matchs: [[paire1, paire2], ...], byes: [joueurs] }
    */
   genererTour(numTour) {
      // Phase 1: Sélectionner les byes
      const byes = this.selectionnerByes(numTour);
      const joueursActifs = this.getJoueursActifs(byes);
      
      // Phase 2: Former les paires (coéquipiers)
      const paires = this.formerPaires(joueursActifs);
      if (paires === null) {
         return null; // Impossible de former des paires valides
      }
      
      // Phase 3: Former les matchs (2 paires par terrain)
      const matchs = this.formerMatchs(paires);
      
      // Mettre à jour les matrices de contraintes
      this.mettreAJourContraintes(matchs, byes, numTour);
      
      return { matchs, byes };
   }

   /**
    * Phase 1: Sélectionner les joueurs qui ne jouent pas ce tour
    * Critères: équité du nombre de byes + espacement maximal
    */
   selectionnerByes(numTour) {
      if (this.byesParTour === 0) {
         return [];
      }
      
      // Calculer un score pour chaque joueur (plus le score est bas, plus il doit sortir)
      const scores = [];
      for (let j = 0; j < this.nbJoueurs; j++) {
         // Score basé sur:
         // 1. Nombre de byes déjà effectués (priorité aux joueurs avec moins de byes)
         // 2. Distance depuis le dernier bye (priorité à ceux qui n'ont pas sorti récemment)
         const distanceDepuisDernierBye = numTour - this.dernierBye[j];
         
         // Formule: on veut minimiser les byes pour les joueurs qui en ont beaucoup
         // et maximiser l'espacement
         const score = this.byeCount[j] * 1000 - distanceDepuisDernierBye;
         
         scores.push({ joueur: j, score, byeCount: this.byeCount[j], distance: distanceDepuisDernierBye });
      }
      
      // Trier par score croissant (les plus bas scores sortent en premier)
      scores.sort((a, b) => a.score - b.score);
      
      // Sélectionner les byesParTour joueurs avec les scores les plus bas
      const byes = scores.slice(0, this.byesParTour).map(s => s.joueur);
      
      return byes;
   }

   /**
    * Retourne les joueurs qui jouent (pas en bye)
    */
   getJoueursActifs(byes) {
      const byeSet = new Set(byes);
      return Array.from({ length: this.nbJoueurs }, (_, i) => i).filter(j => !byeSet.has(j));
   }

   /**
    * Phase 2: Former des paires de coéquipiers
    * Contrainte: jamais 2 fois avec le même partenaire
    * Utilise un matching glouton sur le graphe des partenaires disponibles
    */
   formerPaires(joueursActifs) {
      const n = joueursActifs.length;
      if (n % 2 !== 0) {
         console.error('Nombre impair de joueurs actifs:', n);
         return null;
      }
      
      // Construire le graphe des partenaires possibles
      // Arête entre i et j si ils n'ont jamais joué ensemble
      const disponibles = new Set(joueursActifs);
      const paires = [];
      
      // Algorithme glouton avec heuristique MRV (Minimum Remaining Values)
      // Prioriser les joueurs qui ont le moins de partenaires disponibles
      while (disponibles.size > 0) {
         // Trouver le joueur avec le moins de partenaires disponibles
         let meilleurJoueur = null;
         let minPartenaires = Infinity;
         
         for (const j of disponibles) {
            let count = 0;
            for (const k of disponibles) {
               if (k !== j && this.partenaireCount[j][k] === 0) {
                  count++;
               }
            }
            if (count < minPartenaires) {
               minPartenaires = count;
               meilleurJoueur = j;
            }
         }
         
         if (meilleurJoueur === null || minPartenaires === 0) {
            // Aucun partenaire valide trouvé, essayer avec relaxation
            return this.formerPairesAvecRelaxation(joueursActifs);
         }
         
         // Trouver le meilleur partenaire pour ce joueur
         // Priorité: celui qui a aussi le moins de choix (fail-first)
         let meilleurPartenaire = null;
         let minChoixPartenaire = Infinity;
         
         for (const k of disponibles) {
            if (k !== meilleurJoueur && this.partenaireCount[meilleurJoueur][k] === 0) {
               // Compter les choix restants pour k
               let choix = 0;
               for (const m of disponibles) {
                  if (m !== k && m !== meilleurJoueur && this.partenaireCount[k][m] === 0) {
                     choix++;
                  }
               }
               if (choix < minChoixPartenaire) {
                  minChoixPartenaire = choix;
                  meilleurPartenaire = k;
               }
            }
         }
         
         if (meilleurPartenaire === null) {
            return this.formerPairesAvecRelaxation(joueursActifs);
         }
         
         // Former la paire
         paires.push([meilleurJoueur, meilleurPartenaire]);
         disponibles.delete(meilleurJoueur);
         disponibles.delete(meilleurPartenaire);
      }
      
      return paires;
   }

   /**
    * Formation de paires avec relaxation de contrainte si nécessaire
    * Permet de rejouer avec un partenaire si aucune solution parfaite n'existe
    */
   formerPairesAvecRelaxation(joueursActifs) {
      console.log('Relaxation des contraintes de partenaires nécessaire');
      
      const n = joueursActifs.length;
      const disponibles = new Set(joueursActifs);
      const paires = [];
      
      while (disponibles.size > 0) {
         const joueur = disponibles.values().next().value;
         disponibles.delete(joueur);
         
         // Trouver le meilleur partenaire (minimiser le nombre de fois joué ensemble)
         let meilleurPartenaire = null;
         let minFois = Infinity;
         
         for (const k of disponibles) {
            if (this.partenaireCount[joueur][k] < minFois) {
               minFois = this.partenaireCount[joueur][k];
               meilleurPartenaire = k;
            }
         }
         
         if (meilleurPartenaire === null) {
            console.error('Impossible de trouver un partenaire pour', joueur);
            return null;
         }
         
         paires.push([joueur, meilleurPartenaire]);
         disponibles.delete(meilleurPartenaire);
      }
      
      return paires;
   }

   /**
    * Phase 3: Former des matchs (grouper 2 paires par terrain)
    * Objectif: minimiser les répétitions d'adversaires
    */
   formerMatchs(paires) {
      const n = paires.length;
      if (n % 2 !== 0) {
         console.error('Nombre impair de paires:', n);
         return null;
      }
      
      const disponibles = new Set(paires.map((_, i) => i));
      const matchs = [];
      
      while (disponibles.size > 0) {
         // Prendre la première paire disponible
         const idx1 = disponibles.values().next().value;
         disponibles.delete(idx1);
         const paire1 = paires[idx1];
         
         // Trouver la meilleure paire adversaire (minimiser le score d'adversaires)
         let meilleurIdx = null;
         let minScore = Infinity;
         
         for (const idx2 of disponibles) {
            const paire2 = paires[idx2];
            const score = this.calculerScoreAdversaires(paire1, paire2);
            if (score < minScore) {
               minScore = score;
               meilleurIdx = idx2;
            }
         }
         
         if (meilleurIdx === null) {
            console.error('Impossible de trouver un adversaire pour la paire', paire1);
            return null;
         }
         
         const paire2 = paires[meilleurIdx];
         disponibles.delete(meilleurIdx);
         
         // Créer le match: [[j1, j2], [j3, j4]]
         matchs.push([paire1, paire2]);
      }
      
      return matchs;
   }

   /**
    * Calcule un score pour un match entre deux paires
    * Plus le score est bas, moins il y a de répétitions d'adversaires
    */
   calculerScoreAdversaires(paire1, paire2) {
      let score = 0;
      for (const j1 of paire1) {
         for (const j2 of paire2) {
            // Pénalité exponentielle pour les répétitions
            const count = this.adversaireCount[j1][j2];
            if (count >= 3) {
               score += 10000; // Très forte pénalité si déjà 3+ fois
            } else if (count >= 2) {
               score += 100; // Pénalité moyenne si 2 fois
            } else if (count >= 1) {
               score += 10; // Légère pénalité si 1 fois
            }
         }
      }
      return score;
   }

   /**
    * Met à jour les matrices de contraintes après un tour
    */
   mettreAJourContraintes(matchs, byes, numTour) {
      // Mettre à jour les partenaires et adversaires
      for (const match of matchs) {
         const [paire1, paire2] = match;
         
         // Partenaires (dans la même paire)
         this.partenaireCount[paire1[0]][paire1[1]]++;
         this.partenaireCount[paire1[1]][paire1[0]]++;
         this.partenaireCount[paire2[0]][paire2[1]]++;
         this.partenaireCount[paire2[1]][paire2[0]]++;
         
         // Adversaires (paire contre paire)
         for (const j1 of paire1) {
            for (const j2 of paire2) {
               this.adversaireCount[j1][j2]++;
               this.adversaireCount[j2][j1]++;
            }
         }
      }
      
      // Mettre à jour les byes
      for (const j of byes) {
         this.byeCount[j]++;
         this.dernierBye[j] = numTour;
      }
   }

   /**
    * Calcule les statistiques finales
    */
   calculerStats() {
      // Stats sur les byes
      const byeMin = Math.min(...this.byeCount);
      const byeMax = Math.max(...this.byeCount);
      
      // Stats sur les partenaires
      let maxPartenaire = 0;
      let partenaireViolations = 0;
      for (let i = 0; i < this.nbJoueurs; i++) {
         for (let j = i + 1; j < this.nbJoueurs; j++) {
            if (this.partenaireCount[i][j] > maxPartenaire) {
               maxPartenaire = this.partenaireCount[i][j];
            }
            if (this.partenaireCount[i][j] > 1) {
               partenaireViolations++;
            }
         }
      }
      
      // Stats sur les adversaires
      let maxAdversaire = 0;
      let adversaireViolations = 0;
      for (let i = 0; i < this.nbJoueurs; i++) {
         for (let j = i + 1; j < this.nbJoueurs; j++) {
            if (this.adversaireCount[i][j] > maxAdversaire) {
               maxAdversaire = this.adversaireCount[i][j];
            }
            if (this.adversaireCount[i][j] > 2) {
               adversaireViolations++;
            }
         }
      }
      
      // Espacement des byes
      let espacementMin = Infinity;
      let byesConsecutifs = 0;
      for (let t = 1; t < this.byes.length; t++) {
         const byesPrecedents = new Set(this.byes[t - 1]);
         for (const j of this.byes[t]) {
            if (byesPrecedents.has(j)) {
               byesConsecutifs++;
            }
         }
      }
      
      this.stats = {
         toursGeneres: this.tours.length,
         byeMin,
         byeMax,
         ecartBye: byeMax - byeMin,
         byesConsecutifs,
         maxPartenaire,
         partenaireViolations,
         maxAdversaire,
         adversaireViolations
      };
   }

   /**
    * Retourne les statistiques
    */
   getStatistiques() {
      return this.stats;
   }

   /**
    * Vérifie si la solution respecte toutes les contraintes
    */
   estValide() {
      if (!this.stats) return false;
      return this.stats.ecartBye <= 1 && 
             this.stats.maxPartenaire <= 1 && 
             this.stats.maxAdversaire <= 3;
   }

   // ============================================================
   // RÉGÉNÉRATION DYNAMIQUE (retrait de joueurs en cours de tournoi)
   // ============================================================

   /**
    * Régénère les tours à partir d'un tour donné après retrait de joueurs
    * 
    * @param {number} depuisTour - Index du premier tour à régénérer (0-indexed)
    * @param {number[]} joueursRetires - Liste des indices des joueurs qui se retirent
    * @param {number} nouveauNbTours - Nouveau nombre total de tours (optionnel)
    * @returns {Object} - { succes: boolean, message: string, stats: Object }
    */
   regenererDepuis(depuisTour, joueursRetires, nouveauNbTours = null) {
      console.log(`=== RÉGÉNÉRATION depuis tour ${depuisTour + 1} ===`);
      console.log(`Joueurs retirés: [${joueursRetires.join(', ')}]`);
      
      // Validation
      if (depuisTour < 0 || depuisTour >= this.tours.length) {
         return { succes: false, message: `Tour ${depuisTour + 1} invalide (1-${this.tours.length})` };
      }
      
      // Conserver les tours passés
      const toursPasses = this.tours.slice(0, depuisTour);
      const byesPasses = this.byes.slice(0, depuisTour);
      
      // Ajouter les nouveaux joueurs retirés à la liste définitive
      for (const j of joueursRetires) {
         this.joueursRetiresDefinitivement.add(j);
      }
      console.log(`Joueurs retirés (total): [${[...this.joueursRetiresDefinitivement].join(', ')}]`);
      
      // Recalculer les paramètres avec les joueurs restants (tous ceux jamais retirés)
      const joueursRestants = [];
      for (let i = 0; i < this.nbJoueurs; i++) {
         if (!this.joueursRetiresDefinitivement.has(i)) {
            joueursRestants.push(i);
         }
      }
      
      const nbJoueursRestants = joueursRestants.length;
      console.log(`Joueurs restants: ${nbJoueursRestants} sur ${this.nbJoueurs}`);
      
      if (nbJoueursRestants < 4) {
         return { succes: false, message: `Pas assez de joueurs restants (${nbJoueursRestants} < 4)` };
      }
      
      // Recalculer les matchs par tour
      this.joueursParTour = Math.min(4 * this.nbTerrains, Math.floor(nbJoueursRestants / 4) * 4);
      this.byesParTour = nbJoueursRestants - this.joueursParTour;
      
      // Mettre à jour le nombre de tours
      if (nouveauNbTours !== null) {
         this.nbTours = nouveauNbTours;
      }
      
      // Réinitialiser les résultats aux tours passés UNIQUEMENT
      this.tours = toursPasses;
      this.byes = byesPasses;
      
      // IMPORTANT: Reconstruire les matrices de contraintes à partir des tours conservés
      // Cela garantit que l'historique est correct et ne contient pas de données
      // des tours qui vont être régénérés
      this.reconstruireMatricesDepuisHistorique();
      
      console.log(`Historique conservé: ${toursPasses.length} tours`);
      console.log(`  - Matrice partenaires reconstituée à partir de l'historique`);
      console.log(`  - Matrice adversaires reconstituée à partir de l'historique`);
      console.log(`  - Compteurs byes reconstitués à partir de l'historique`);
      
      // Générer les tours restants
      const toursAGenerer = this.nbTours - depuisTour;
      console.log(`Tours à générer: ${toursAGenerer}`);
      
      for (let t = depuisTour; t < this.nbTours; t++) {
         const tour = this.genererTourSansRetires(t, joueursRestants);
         if (tour === null) {
            console.warn(`Impossible de régénérer le tour ${t + 1}, arrêt.`);
            break;
         }
         this.tours.push(tour.matchs);
         this.byes.push(tour.byes);
      }
      
      // Note: On ne nettoie PAS joueursRetiresDefinitivement pour permettre les retraits successifs
      
      // Recalculer les stats
      this.calculerStats();
      
      return {
         succes: true,
         message: `${this.tours.length - depuisTour} tours régénérés avec ${nbJoueursRestants} joueurs`,
         stats: this.stats,
         joueursRestants: joueursRestants,
         joueursRetires: [...this.joueursRetiresDefinitivement]
      };
   }

   /**
    * Retourne la liste des joueurs encore actifs dans le tournoi
    * @returns {number[]} - Indices des joueurs actifs
    */
   getJoueursActifsTournoi() {
      const actifs = [];
      for (let i = 0; i < this.nbJoueurs; i++) {
         if (!this.joueursRetiresDefinitivement.has(i)) {
            actifs.push(i);
         }
      }
      return actifs;
   }

   /**
    * Retourne la liste des joueurs retirés définitivement
    * @returns {number[]} - Indices des joueurs retirés
    */
   getJoueursRetires() {
      return [...this.joueursRetiresDefinitivement];
   }

   /**
    * Réintègre un joueur qui avait été retiré
    * ATTENTION: Nécessite une régénération après
    * @param {number} joueur - Index du joueur à réintégrer
    * @returns {boolean} - true si le joueur a été réintégré
    */
   reintegrerJoueur(joueur) {
      if (this.joueursRetiresDefinitivement.has(joueur)) {
         this.joueursRetiresDefinitivement.delete(joueur);
         console.log(`Joueur ${joueur} réintégré (nécessite régénération)`);
         return true;
      }
      return false;
   }

   /**
    * Génère un tour en excluant les joueurs retirés
    * @param {number} numTour - Numéro du tour
    * @param {number[]} joueursDisponibles - Liste des joueurs encore dans le tournoi
    */
   genererTourSansRetires(numTour, joueursDisponibles) {
      // Phase 1: Sélectionner les byes parmi les joueurs disponibles
      const byes = this.selectionnerByesPourJoueurs(numTour, joueursDisponibles);
      
      // Joueurs actifs = disponibles - byes
      const byeSet = new Set(byes);
      const joueursActifs = joueursDisponibles.filter(j => !byeSet.has(j));
      
      // Phase 2: Former les paires
      const paires = this.formerPairesPourJoueurs(joueursActifs);
      if (paires === null) {
         return null;
      }
      
      // Phase 3: Former les matchs
      const matchs = this.formerMatchs(paires);
      
      // Mettre à jour les contraintes
      this.mettreAJourContraintes(matchs, byes, numTour);
      
      return { matchs, byes };
   }

   /**
    * Sélectionne les byes parmi un sous-ensemble de joueurs
    */
   selectionnerByesPourJoueurs(numTour, joueurs) {
      if (this.byesParTour === 0) {
         return [];
      }
      
      const scores = [];
      for (const j of joueurs) {
         const distanceDepuisDernierBye = numTour - this.dernierBye[j];
         const score = this.byeCount[j] * 1000 - distanceDepuisDernierBye;
         scores.push({ joueur: j, score });
      }
      
      scores.sort((a, b) => a.score - b.score);
      return scores.slice(0, this.byesParTour).map(s => s.joueur);
   }

   /**
    * Forme des paires parmi un sous-ensemble de joueurs
    */
   formerPairesPourJoueurs(joueursActifs) {
      const n = joueursActifs.length;
      if (n % 2 !== 0 || n === 0) {
         console.error('Nombre invalide de joueurs actifs:', n);
         return null;
      }
      
      const disponibles = new Set(joueursActifs);
      const paires = [];
      
      while (disponibles.size > 0) {
         // Trouver le joueur avec le moins de partenaires disponibles
         let meilleurJoueur = null;
         let minPartenaires = Infinity;
         
         for (const j of disponibles) {
            let count = 0;
            for (const k of disponibles) {
               if (k !== j && this.partenaireCount[j][k] === 0) {
                  count++;
               }
            }
            if (count < minPartenaires) {
               minPartenaires = count;
               meilleurJoueur = j;
            }
         }
         
         if (meilleurJoueur === null) {
            return null; // Impossible
         }
         
         // Si aucun partenaire valide, relaxer la contrainte
         if (minPartenaires === 0) {
            // Prendre le partenaire avec lequel on a joué le moins
            let meilleurPartenaire = null;
            let minJoue = Infinity;
            for (const k of disponibles) {
               if (k !== meilleurJoueur && this.partenaireCount[meilleurJoueur][k] < minJoue) {
                  minJoue = this.partenaireCount[meilleurJoueur][k];
                  meilleurPartenaire = k;
               }
            }
            if (meilleurPartenaire !== null) {
               paires.push([meilleurJoueur, meilleurPartenaire]);
               disponibles.delete(meilleurJoueur);
               disponibles.delete(meilleurPartenaire);
               continue;
            }
            return null;
         }
         
         // Trouver le meilleur partenaire
         let meilleurPartenaire = null;
         let minChoix = Infinity;
         
         for (const k of disponibles) {
            if (k !== meilleurJoueur && this.partenaireCount[meilleurJoueur][k] === 0) {
               let choix = 0;
               for (const m of disponibles) {
                  if (m !== k && m !== meilleurJoueur && this.partenaireCount[k][m] === 0) {
                     choix++;
                  }
               }
               if (choix < minChoix) {
                  minChoix = choix;
                  meilleurPartenaire = k;
               }
            }
         }
         
         if (meilleurPartenaire === null) {
            return null;
         }
         
         paires.push([meilleurJoueur, meilleurPartenaire]);
         disponibles.delete(meilleurJoueur);
         disponibles.delete(meilleurPartenaire);
      }
      
      return paires;
   }

   /**
    * Recalcule les matrices à partir de l'historique des tours
    * Utile après chargement d'un état sauvegardé
    */
   reconstruireMatricesDepuisHistorique() {
      // Réinitialiser les matrices
      this.partenaireCount = this.creerMatrice(this.nbJoueurs);
      this.adversaireCount = this.creerMatrice(this.nbJoueurs);
      this.byeCount = new Array(this.nbJoueurs).fill(0);
      this.dernierBye = new Array(this.nbJoueurs).fill(-999);
      
      // Reconstruire à partir des tours
      for (let t = 0; t < this.tours.length; t++) {
         const matchs = this.tours[t];
         const byes = this.byes[t];
         
         // Mettre à jour les partenaires et adversaires
         for (const match of matchs) {
            const [paire1, paire2] = match;
            const [j1, j2] = paire1;
            const [j3, j4] = paire2;
            
            // Partenaires
            this.partenaireCount[j1][j2]++;
            this.partenaireCount[j2][j1]++;
            this.partenaireCount[j3][j4]++;
            this.partenaireCount[j4][j3]++;
            
            // Adversaires
            for (const ja of paire1) {
               for (const jb of paire2) {
                  this.adversaireCount[ja][jb]++;
                  this.adversaireCount[jb][ja]++;
               }
            }
         }
         
         // Mettre à jour les byes
         for (const j of byes) {
            this.byeCount[j]++;
            this.dernierBye[j] = t;
         }
      }
   }

   /**
    * Exporte l'état actuel pour sauvegarde
    */
   exporterEtat() {
      return {
         nbJoueurs: this.nbJoueurs,
         nbTerrains: this.nbTerrains,
         nbTours: this.nbTours,
         tours: JSON.parse(JSON.stringify(this.tours)),
         byes: JSON.parse(JSON.stringify(this.byes)),
         partenaireCount: JSON.parse(JSON.stringify(this.partenaireCount)),
         adversaireCount: JSON.parse(JSON.stringify(this.adversaireCount)),
         byeCount: [...this.byeCount],
         dernierBye: [...this.dernierBye]
      };
   }

   /**
    * Importe un état sauvegardé
    */
   importerEtat(etat) {
      this.nbJoueurs = etat.nbJoueurs;
      this.nbTerrains = etat.nbTerrains;
      this.nbTours = etat.nbTours;
      this.tours = etat.tours;
      this.byes = etat.byes;
      this.partenaireCount = etat.partenaireCount;
      this.adversaireCount = etat.adversaireCount;
      this.byeCount = etat.byeCount;
      this.dernierBye = etat.dernierBye;
      
      // Recalculer les paramètres dérivés
      this.joueursParTour = Math.min(4 * this.nbTerrains, Math.floor(this.nbJoueurs / 4) * 4);
      this.byesParTour = this.nbJoueurs - this.joueursParTour;
      
      this.calculerStats();
   }

   /**
    * Convertit au format attendu par le système existant
    * @returns {Object} - { liste: [...], byes: [...] }
    */
   versFormatLegacy() {
      // Convertir les matchs en format paires
      const liste = this.tours.map(tour => {
         const paires = [];
         for (const match of tour) {
            paires.push(match[0]); // Première paire
            paires.push(match[1]); // Deuxième paire
         }
         return paires;
      });
      
      return {
         liste,
         byes: this.byes,
         stats: this.stats
      };
   }

   /**
    * Affiche un résumé du tournoi
    */
   afficherResume() {
      console.log('='.repeat(60));
      console.log('RÉSUMÉ DU TOURNOI');
      console.log('='.repeat(60));
      console.log(`Joueurs: ${this.nbJoueurs}, Terrains: ${this.nbTerrains}, Tours: ${this.tours.length}`);
      console.log('-'.repeat(60));
      
      for (let t = 0; t < this.tours.length; t++) {
         console.log(`Tour ${t + 1}:`);
         console.log(`  Matchs: ${this.tours[t].map(m => `[${m[0].join('-')} vs ${m[1].join('-')}]`).join(', ')}`);
         if (this.byes[t].length > 0) {
            console.log(`  Byes: [${this.byes[t].join(', ')}]`);
         }
      }
      
      console.log('-'.repeat(60));
      console.log('STATISTIQUES:');
      console.log(`  Byes: min=${this.stats.byeMin}, max=${this.stats.byeMax}, écart=${this.stats.ecartBye}`);
      console.log(`  Byes consécutifs: ${this.stats.byesConsecutifs}`);
      console.log(`  Max partenaire répété: ${this.stats.maxPartenaire} (violations: ${this.stats.partenaireViolations})`);
      console.log(`  Max adversaire répété: ${this.stats.maxAdversaire} (violations: ${this.stats.adversaireViolations})`);
      console.log(`  Solution valide: ${this.estValide() ? 'OUI ✓' : 'NON ✗'}`);
      console.log('='.repeat(60));
   }
}

/**
 * Wrapper pour compatibilité avec l'ancien système Generateur
 * Compatible avec tournament2.js qui utilise g.liste et g.byes
 */
class GenerateurV2 extends GenerateurDynamique {
   constructor(N = 8, nbTerrains = 7, nbTours = null) {
      super(N, nbTerrains, nbTours);
      
      // Compatibilité avec l'ancien format
      this.N = N;
      const legacy = this.versFormatLegacy();
      this.liste = legacy.liste;
      // Note: this.byes est déjà défini par la classe parente GenerateurDynamique
      this.coutbyes = 0;
   }
   
   /**
    * Réinitialise et régénère le tournoi
    */
   resetListe() {
      this.tours = [];
      this.byes = [];
      this.partenaireCount = this.creerMatrice(this.nbJoueurs);
      this.adversaireCount = this.creerMatrice(this.nbJoueurs);
      this.byeCount = new Array(this.nbJoueurs).fill(0);
      this.dernierBye = new Array(this.nbJoueurs).fill(-999);
      
      this.generer();
      const legacy = this.versFormatLegacy();
      this.liste = legacy.liste;
      // this.byes est déjà mis à jour par generer()
   }
   
   /**
    * Régénère les tours futurs après retrait de joueurs
    * Met à jour this.liste et this.byes pour la compatibilité
    * 
    * @param {number} depuisTour - Index du tour à partir duquel régénérer (0-indexed)
    * @param {number[]} joueursRetires - Indices des joueurs qui se retirent
    * @param {number} nouveauNbTours - Nouveau nombre de tours (optionnel)
    * @returns {Object} - { succes, message, stats }
    */
   retirerJoueurs(depuisTour, joueursRetires, nouveauNbTours = null) {
      const resultat = this.regenererDepuis(depuisTour, joueursRetires, nouveauNbTours);
      
      if (resultat.succes) {
         // Mettre à jour this.liste pour la compatibilité
         const legacy = this.versFormatLegacy();
         this.liste = legacy.liste;
      }
      
      return resultat;
   }
   
   toString() {
      return JSON.stringify(this.liste);
   }
}

// Export pour le navigateur
window.GenerateurDynamique = GenerateurDynamique;
window.GenerateurV2 = GenerateurV2;
