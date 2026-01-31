/**
 * TournoiGenerateur.js - Wrapper pour adapter GenerateurV2 au format v2
 * 
 * Le GenerateurV2 existant retourne des indices de joueurs.
 * Ce wrapper convertit ces indices en objets joueurs complets
 * avec le format attendu par TournoiPage (equipe1, equipe2, byes).
 */

class TournoiGenerateur {
    /**
     * @param {Object} config - Configuration
     * @param {Array} config.joueurs - Liste des joueurs (objets)
     * @param {number} config.nbTours - Nombre de tours à générer
     * @param {number} config.nbTerrains - Nombre de terrains
     * @param {number} config.premierTerrain - Numéro du premier terrain (défaut: 1)
     */
    constructor(config) {
        this.joueurs = config.joueurs || [];
        this.nbTours = config.nbTours || 10;
        this.nbTerrains = config.nbTerrains || 7;
        this.premierTerrain = config.premierTerrain || 1;
        
        // Résultats
        this.liste = [];  // Tours avec matchs formatés pour v2
        this.byes = [];   // Byes par tour (objets joueurs)
        this.stats = null;
        
        // Générer si on a assez de joueurs
        if (this.joueurs.length >= 4) {
            this.generer();
        } else {
            console.warn('TournoiGenerateur: pas assez de joueurs', this.joueurs.length);
        }
    }

    /**
     * Génère le tournoi en utilisant GenerateurV2 existant
     */
    generer() {
        try {
            // Créer le générateur avec les paramètres numériques
            const gen = new GenerateurV2(
                this.joueurs.length,
                this.nbTerrains,
                this.nbTours
            );

            this.stats = gen.stats;
            
            console.log(`TournoiGenerateur: GenerateurV2 a généré ${gen.liste.length} tours`);
            
            // Convertir chaque tour
            // gen.liste[t] = [[j1, j2], [j3, j4], [j5, j6], [j7, j8], ...]
            // = paires successives, 2 paires = 1 match
            // gen.byes[t] = [indice1, indice2, ...]
            
            for (let t = 0; t < gen.liste.length; t++) {
                const tourPaires = gen.liste[t];  // [[j1, j2], [j3, j4], ...]
                const tourByes = gen.byes[t] || [];
                
                // Convertir les paires en matchs
                const matchs = this.convertirEnMatchs(tourPaires, t);
                
                // Convertir les indices de byes en objets joueurs avec détection des undefined
                const byesRaw = tourByes.map(idx => ({ idx, joueur: this.joueurs[idx] }));
                const byesUndefined = byesRaw.filter(b => !b.joueur);
                
                if (byesUndefined.length > 0) {
                    console.warn(`⚠️ Tour ${t + 1}: ${byesUndefined.length} bye(s) avec joueur undefined!`);
                    console.warn(`   Indices concernés: [${byesUndefined.map(b => b.idx).join(', ')}]`);
                    console.warn(`   Nombre de joueurs disponibles: ${this.joueurs.length}`);
                }
                
                const byesConverted = byesRaw.map(b => b.joueur).filter(j => j);
                
                this.liste.push({
                    matchs: matchs,
                    byes: byesConverted
                });
                
                this.byes.push(byesConverted);
            }

            console.log(`TournoiGenerateur: ${this.liste.length} tours convertis`);
            
        } catch (error) {
            console.error('Erreur génération tournoi:', error);
            throw error;
        }
    }

    /**
     * Convertit les paires d'un tour en matchs
     * @param {Array} tourPaires - [[j1, j2], [j3, j4], ...] (paires, 2 par match)
     * @param {number} tourNum - Numéro du tour
     * @returns {Array} - Matchs avec objets joueurs
     */
    convertirEnMatchs(tourPaires, tourNum) {
        const matchs = [];
        
        // Les paires viennent par 2 : paire[0] vs paire[1], paire[2] vs paire[3], etc.
        for (let i = 0; i < tourPaires.length; i += 2) {
            const paire1 = tourPaires[i];     // [indice1, indice2]
            const paire2 = tourPaires[i + 1]; // [indice3, indice4]
            
            if (!paire1 || !paire2) {
                console.warn(`Tour ${tourNum}: paire manquante à l'index ${i}`);
                continue;
            }
            
            const matchIndex = i / 2;
            
            // Construire les équipes avec détection des joueurs undefined
            const equipe1Raw = [
                this.joueurs[paire1[0]],
                this.joueurs[paire1[1]]
            ];
            const equipe2Raw = [
                this.joueurs[paire2[0]],
                this.joueurs[paire2[1]]
            ];
            
            // Vérifier si des joueurs sont undefined (bug potentiel en amont)
            const undefinedEquipe1 = equipe1Raw.filter(j => !j);
            const undefinedEquipe2 = equipe2Raw.filter(j => !j);
            
            if (undefinedEquipe1.length > 0 || undefinedEquipe2.length > 0) {
                console.warn(`⚠️ Tour ${tourNum + 1}, Match ${matchIndex + 1}: joueur(s) undefined détecté(s)!`);
                console.warn(`   Indices paire1: [${paire1[0]}, ${paire1[1]}], paire2: [${paire2[0]}, ${paire2[1]}]`);
                console.warn(`   Nombre de joueurs disponibles: ${this.joueurs.length}`);
                if (undefinedEquipe1.length > 0) {
                    console.warn(`   Équipe 1: ${undefinedEquipe1.length} joueur(s) manquant(s)`);
                }
                if (undefinedEquipe2.length > 0) {
                    console.warn(`   Équipe 2: ${undefinedEquipe2.length} joueur(s) manquant(s)`);
                }
            }
            
            matchs.push({
                terrain: this.premierTerrain + matchIndex,
                equipe1: equipe1Raw.filter(j => j), // Filtrer les undefined pour éviter les crashs
                equipe2: equipe2Raw.filter(j => j),
                score1: undefined,
                score2: undefined
            });
        }
        
        return matchs;
    }
}

// Export global - utiliser ce nom dans le code v2
window.TournoiGenerateur = TournoiGenerateur;
