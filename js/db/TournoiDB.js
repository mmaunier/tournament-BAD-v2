/**
 * TournoiDB.js - Couche métier pour la gestion des données du tournoi
 * Encapsule toutes les opérations sur les joueurs, tournois, tours et matchs
 */

// Énumérations
const Genre = {
    HOMME: 'H',
    FEMME: 'F'
};

const Niveau = {
    NC: 'NC',
    P12: 'P12',
    P11: 'P11',
    P10: 'P10',
    D9: 'D9',
    D8: 'D8',
    D7: 'D7',
    R6: 'R6',
    R5: 'R5',
    R4: 'R4',
    N3: 'N3',
    N2: 'N2',
    N1: 'N1'
};

const ModeComptage = {
    POINTS: 'points',
    TEMPS: 'temps',
    AUCUN: 'aucun'
};

const TournoiStatus = {
    PREPARATION: 'preparation',
    EN_COURS: 'en_cours',
    TERMINE: 'termine'
};

class TournoiDB {
    constructor(sessionId = null) {
        // Chaque instance peut avoir sa propre session (pour multi-onglets)
        this.sessionId = sessionId || this.generateSessionId();
        this.db = new Database(`TournoiBad_${this.sessionId}`);
        this.isReady = false;
        
        // Cache en mémoire pour performance
        this.cache = {
            joueurs: [],
            tournoi: null,
            tours: [],
            config: {}
        };
    }

    /**
     * Génère un ID de session unique
     */
    generateSessionId() {
        // Vérifie si on a déjà une session en localStorage
        let sessionId = localStorage.getItem('tournoi_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tournoi_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Initialise la base de données
     */
    async init() {
        await this.db.open();
        await this.loadCache();
        this.isReady = true;
        console.log(`TournoiDB initialisé (session: ${this.sessionId})`);
    }

    /**
     * Charge toutes les données en cache
     */
    async loadCache() {
        this.cache.joueurs = await this.db.getAll('joueurs');
        this.cache.tours = await this.db.getAll('tours');
        
        const tournoiData = await this.db.get('tournoi', 'current');
        this.cache.tournoi = tournoiData || this.getDefaultTournoi();
        
        const configData = await this.db.getAll('config');
        this.cache.config = {};
        configData.forEach(c => this.cache.config[c.key] = c.value);
    }

    /**
     * Configuration par défaut du tournoi
     */
    getDefaultTournoi() {
        return {
            id: 'current',
            nom: 'Mon Tournoi',
            phase: 1,
            status: TournoiStatus.PREPARATION,
            nbTours: 10,
            nbTerrains: 7,
            premierTerrain: 1,
            modeComptage: ModeComptage.POINTS,
            prendreEnCompteHandicaps: false,
            tourActuel: -1,
            dateCreation: new Date().toISOString(),
            generateur: null // Instance du GenerateurDynamique
        };
    }

    // ========================================
    // JOUEURS
    // ========================================

    /**
     * Ajoute un joueur
     */
    async addJoueur(joueur) {
        const newJoueur = {
            nom: joueur.nom || '',
            prenom: joueur.prenom || '',
            genre: joueur.genre || Genre.HOMME,
            niveauSimple: joueur.niveauSimple || Niveau.NC,
            niveauDouble: joueur.niveauDouble || Niveau.NC,
            niveauMixte: joueur.niveauMixte || Niveau.NC,
            selected: joueur.selected !== undefined ? joueur.selected : true,
            // Stats du tournoi
            matchsJoues: 0,
            matchsGagnes: 0,
            pointsMarques: 0,
            pointsEncaisses: 0,
            nbByes: 0,
            partenaires: [],
            adversaires: []
        };

        const id = await this.db.put('joueurs', newJoueur);
        newJoueur.id = id;
        this.cache.joueurs.push(newJoueur);
        
        EventBus.emit('joueur:added', newJoueur);
        return newJoueur;
    }

    /**
     * Met à jour un joueur
     */
    async updateJoueur(id, updates) {
        const index = this.cache.joueurs.findIndex(j => j.id === id);
        if (index === -1) throw new Error('Joueur non trouvé');

        const joueur = { ...this.cache.joueurs[index], ...updates };
        await this.db.put('joueurs', joueur);
        this.cache.joueurs[index] = joueur;

        EventBus.emit('joueur:updated', joueur);
        return joueur;
    }

    /**
     * Supprime un joueur
     */
    async deleteJoueur(id) {
        await this.db.delete('joueurs', id);
        this.cache.joueurs = this.cache.joueurs.filter(j => j.id !== id);
        EventBus.emit('joueur:deleted', id);
    }

    /**
     * Récupère tous les joueurs
     */
    getJoueurs() {
        return this.cache.joueurs;
    }

    /**
     * Récupère les joueurs sélectionnés
     */
    getJoueursSelectionnes() {
        return this.cache.joueurs.filter(j => j.selected);
    }

    /**
     * Sélectionne/désélectionne un joueur
     */
    async toggleJoueurSelection(id) {
        const joueur = this.cache.joueurs.find(j => j.id === id);
        if (joueur) {
            await this.updateJoueur(id, { selected: !joueur.selected });
        }
    }

    /**
     * Importe une liste de joueurs
     * Réinitialise complètement le tournoi (joueurs retirés, tours, etc.)
     */
    async importJoueurs(joueurs) {
        const imported = [];
        for (const j of joueurs) {
            const newJoueur = await this.addJoueur(j);
            imported.push(newJoueur);
        }
        
        // Réinitialiser complètement le tournoi lors d'une nouvelle importation
        // Vider les joueurs retirés, les joueurs du tournoi, et les tours
        await this.updateTournoi({ 
            joueursRetires: [],
            joueurs: [],
            status: 'config',
            tourActuel: -1
        });
        
        // Vider les tours existants
        await this.db.clear('tours');
        this.cache.tours = [];
        
        EventBus.emit('joueurs:imported', imported);
        EventBus.emit('tours:set', []);
        return imported;
    }

    // ========================================
    // TOURNOI
    // ========================================

    /**
     * Met à jour la configuration du tournoi
     */
    async updateTournoi(updates) {
        this.cache.tournoi = { ...this.cache.tournoi, ...updates };
        await this.db.put('tournoi', this.cache.tournoi);
        EventBus.emit('tournoi:updated', this.cache.tournoi);
        return this.cache.tournoi;
    }

    /**
     * Récupère le tournoi
     */
    getTournoi() {
        return this.cache.tournoi;
    }

    /**
     * Lance le tournoi
     * @param {Object} config - Configuration optionnelle { nom, nbTours, nbTerrains, joueurs, ... }
     */
    async lancerTournoi(config = {}) {
        // Appliquer la config si fournie
        if (config.nom) this.cache.tournoi.nom = config.nom;
        if (config.nbTours) this.cache.tournoi.nbTours = config.nbTours;
        if (config.nbTerrains) this.cache.tournoi.nbTerrains = config.nbTerrains;
        if (config.premierTerrain) this.cache.tournoi.premierTerrain = config.premierTerrain;
        if (config.modeComptage) this.cache.tournoi.modeComptage = config.modeComptage;
        
        // Sauvegarder les paramètres de handicap
        if (config.handicaps !== undefined) this.cache.tournoi.handicaps = config.handicaps;
        if (config.handicapParams) this.cache.tournoi.handicapParams = config.handicapParams;
        
        // Si des joueurs sont fournis, les ajouter à la cache
        if (config.joueurs && Array.isArray(config.joueurs)) {
            this.cache.joueurs = config.joueurs;
            // Sauvegarder en DB
            await this.db.clear('joueurs');
            for (const j of config.joueurs) {
                await this.db.put('joueurs', j);
            }
        }
        
        // Sauvegarder le tournoi mis à jour
        await this.updateTournoi({
            status: TournoiStatus.EN_COURS,
            joueurs: this.cache.joueurs  // Stocker les objets complets, pas les IDs
        });
        
        EventBus.emit('tournoi:started', this.cache.tournoi);
    }

    /**
     * Retire des joueurs en cours de tournoi
     */
    async retirerJoueurs(joueursIds, depuisTour) {
        // Utiliser les joueurs actifs du tournoi (pas getJoueursSelectionnes)
        const joueursActifs = this.cache.tournoi.joueurs || [];
        const anciensRetires = this.cache.tournoi.joueursRetires || [];
        const anciensRetiresIds = new Set(anciensRetires.map(j => j.id));
        
        // Filtrer pour ne garder que les joueurs vraiment actifs (pas déjà retirés)
        const vraimentActifs = joueursActifs.filter(j => !anciensRetiresIds.has(j.id));
        
        // Filtrer les IDs pour éviter de retirer des joueurs déjà retirés
        const idsARetirer = joueursIds.filter(id => !anciensRetiresIds.has(id));
        
        if (idsARetirer.length === 0) {
            console.warn('Tous les joueurs sélectionnés sont déjà retirés');
            return { success: false, message: 'Joueurs déjà retirés' };
        }
        
        // Trouver les objets joueurs complets à retirer
        const joueursARetirer = vraimentActifs.filter(j => idsARetirer.includes(j.id));
        const joueursRestants = vraimentActifs.filter(j => !idsARetirer.includes(j.id));
        
        // Stocker les joueurs retirés avec le tour où ils ont été retirés
        const joueursRetiresAvecInfo = joueursARetirer.map(j => ({
            ...j,
            retireDuTour: depuisTour,
            retired: true
        }));
        
        // Fusionner avec les anciens retirés (sans doublons)
        const nouveauxRetires = [...anciensRetires, ...joueursRetiresAvecInfo];
        
        // Marquer les joueurs comme non sélectionnés dans la DB
        for (const id of idsARetirer) {
            await this.updateJoueur(id, { selected: false });
        }
        
        // Régénérer les tours non validés avec les joueurs restants
        const gen = new TournoiGenerateur({
            joueurs: joueursRestants,
            nbTours: this.cache.tournoi.nbTours - depuisTour,
            nbTerrains: this.cache.tournoi.nbTerrains,
            premierTerrain: this.cache.tournoi.premierTerrain
        });
        
        // Garder les tours validés et ajouter les nouveaux
        const toursValides = this.cache.tours.slice(0, depuisTour);
        const nouveauxTours = [...toursValides, ...gen.liste];
        
        // Ajouter TOUS les joueurs retirés à chaque nouveau tour
        nouveauxTours.forEach((tour, index) => {
            if (index >= depuisTour) {
                tour.joueursRetires = nouveauxRetires;
            }
        });
        
        await this.setTours(nouveauxTours);
        
        // Mettre à jour le tournoi avec les joueurs restants et retirés
        await this.updateTournoi({
            joueurs: joueursRestants,
            joueursRetires: nouveauxRetires
        });
        
        EventBus.emit('tournoi:joueursRetires', { joueursIds, depuisTour, joueursRetires: joueursRetiresAvecInfo });
        return { success: true, toursGeneres: gen.liste.length };
    }

    // ========================================
    // TOURS & MATCHS
    // ========================================

    /**
     * Récupère tous les tours
     */
    getTours() {
        return this.cache.tours;
    }

    /**
     * Récupère le tour actuel
     */
    getTourActuel() {
        if (this.cache.tournoi.tourActuel < 0) return null;
        return this.cache.tours[this.cache.tournoi.tourActuel];
    }

    /**
     * Définit les tours générés
     */
    async setTours(tours) {
        // Nettoyer les anciens tours
        await this.db.clear('tours');
        
        // Ajouter les nouveaux
        this.cache.tours = [];
        for (let i = 0; i < tours.length; i++) {
            const tour = {
                id: i + 1,
                numero: i + 1,
                matchs: tours[i].matchs || tours[i],
                byes: tours[i].byes || [],
                joueursRetires: tours[i].joueursRetires || [],
                valide: tours[i].valide || false  // Préserver le statut valide
            };
            await this.db.put('tours', tour);
            this.cache.tours.push(tour);
        }
        
        EventBus.emit('tours:set', this.cache.tours);
    }

    /**
     * Met à jour un match (API simplifiée pour les pages)
     */
    async updateMatch(tourIndex, matchIndex, scores) {
        if (tourIndex >= this.cache.tours.length) {
            throw new Error('Tour non trouvé');
        }
        
        const tour = this.cache.tours[tourIndex];
        const match = tour.matchs[matchIndex];
        
        if (scores.score1 !== undefined) match.score1 = scores.score1;
        if (scores.score2 !== undefined) match.score2 = scores.score2;
        
        await this.db.put('tours', tour);
        EventBus.emit('match:updated', { tourIndex, matchIndex, match });
        
        return match;
    }

    /**
     * Valide un tour et passe au suivant
     * @param {number} tourIndex - Index du tour à valider (optionnel, défaut: tour actuel)
     */
    async validerTour(tourIndex = null) {
        // Si tourIndex est fourni, utiliser ce tour, sinon le tour actuel
        let tour;
        if (tourIndex !== null && tourIndex >= 0 && tourIndex < this.cache.tours.length) {
            tour = this.cache.tours[tourIndex];
        } else {
            tour = this.getTourActuel();
            tourIndex = this.cache.tournoi.tourActuel;
        }
        
        if (!tour) throw new Error('Pas de tour à valider');

        // Marquer le tour comme validé
        tour.valide = true;
        tour.status = 'termine';
        await this.db.put('tours', tour);

        // Passer au tour suivant si possible
        const nextTourIndex = tourIndex + 1;
        
        if (nextTourIndex < this.cache.tours.length) {
            this.cache.tours[nextTourIndex].status = 'actif';
            await this.db.put('tours', this.cache.tours[nextTourIndex]);
            
            await this.updateTournoi({ tourActuel: nextTourIndex });
            EventBus.emit('tour:validated', { tourIndex, next: nextTourIndex });
        } else {
            // Dernier tour validé
            EventBus.emit('tour:validated', { tourIndex, next: null });
        }
    }

    /**
     * Termine le tournoi
     */
    async terminerTournoi() {
        await this.updateTournoi({
            status: TournoiStatus.TERMINE,
            dateFin: new Date().toISOString()
        });
        EventBus.emit('tournoi:finished', this.cache.tournoi);
    }

    // ========================================
    // CLASSEMENT
    // ========================================

    /**
     * Calcule le classement des joueurs
     * Exclut les joueurs retirés du tournoi
     * Calcule les stats à partir des tours validés
     * Système de points : Victoire=3pts, Égalité=2pts (diff≤2), Défaite=1pt
     */
    getClassement() {
        // Utiliser les joueurs actifs du tournoi (exclut les retirés)
        const joueursActifs = this.cache.tournoi.joueurs || [];
        const joueursRetiresIds = new Set((this.cache.tournoi.joueursRetires || []).map(j => j.id));
        
        // Initialiser les stats pour chaque joueur actif
        const statsParJoueur = {};
        joueursActifs
            .filter(j => !joueursRetiresIds.has(j.id) && !j.retired)
            .forEach(j => {
                statsParJoueur[j.id] = {
                    ...j,
                    victoires: 0,
                    defaites: 0,
                    egalites: 0,
                    matchsJoues: 0,
                    pointsMarques: 0,      // Points de badminton marqués
                    pointsEncaisses: 0,    // Points de badminton encaissés
                    pointsClassement: 0    // Points pour le classement (3/2/1)
                };
            });
        
        // Parcourir tous les tours validés pour calculer les stats
        const toursValides = this.cache.tours.filter(t => t.valide);
        
        for (const tour of toursValides) {
            for (const match of (tour.matchs || [])) {
                const equipe1 = match.equipe1 || [];
                const equipe2 = match.equipe2 || [];
                const score1 = match.score1 || 0;
                const score2 = match.score2 || 0;
                
                // Calculer la différence de score
                const diff = Math.abs(score1 - score2);
                
                // Déterminer le résultat : égalité si diff <= 2
                const isEgalite = diff <= 2;
                const equipe1Gagne = !isEgalite && score1 > score2;
                const equipe2Gagne = !isEgalite && score2 > score1;
                
                // Mettre à jour les stats de l'équipe 1
                equipe1.forEach(joueur => {
                    if (joueur && statsParJoueur[joueur.id]) {
                        const stats = statsParJoueur[joueur.id];
                        stats.matchsJoues++;
                        stats.pointsMarques += score1;
                        stats.pointsEncaisses += score2;
                        
                        if (isEgalite) {
                            stats.egalites++;
                            stats.pointsClassement += 2;
                        } else if (equipe1Gagne) {
                            stats.victoires++;
                            stats.pointsClassement += 3;
                        } else {
                            stats.defaites++;
                            stats.pointsClassement += 1;
                        }
                    }
                });
                
                // Mettre à jour les stats de l'équipe 2
                equipe2.forEach(joueur => {
                    if (joueur && statsParJoueur[joueur.id]) {
                        const stats = statsParJoueur[joueur.id];
                        stats.matchsJoues++;
                        stats.pointsMarques += score2;
                        stats.pointsEncaisses += score1;
                        
                        if (isEgalite) {
                            stats.egalites++;
                            stats.pointsClassement += 2;
                        } else if (equipe2Gagne) {
                            stats.victoires++;
                            stats.pointsClassement += 3;
                        } else {
                            stats.defaites++;
                            stats.pointsClassement += 1;
                        }
                    }
                });
            }
        }
        
        // Convertir en tableau et calculer les totaux
        const joueurs = Object.values(statsParJoueur).map(j => ({
            ...j,
            pointsDiff: j.pointsMarques - j.pointsEncaisses,  // Différence de points badminton
            points: j.pointsClassement  // Points pour le classement (3/2/1)
        }));

        // Tri par: points classement, puis différence de points badminton, puis points marqués
        joueurs.sort((a, b) => {
            if (b.pointsClassement !== a.pointsClassement) return b.pointsClassement - a.pointsClassement;
            if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
            return b.pointsMarques - a.pointsMarques;
        });

        return joueurs;
    }

    // ========================================
    // RESET & EXPORT
    // ========================================

    /**
     * Réinitialise tout
     */
    async reset() {
        await this.db.clearAll();
        this.cache = {
            joueurs: [],
            tournoi: this.getDefaultTournoi(),
            tours: [],
            config: {}
        };
        await this.db.put('tournoi', this.cache.tournoi);
        EventBus.emit('tournoi:reset');
    }

    /**
     * Alias pour reset (compatibilité)
     */
    async resetAll() {
        return this.reset();
    }

    /**
     * Exporte l'état complet du tournoi
     */
    exportState() {
        return {
            tournoi: this.cache.tournoi,
            joueurs: this.cache.joueurs,
            tours: this.cache.tours
        };
    }

    /**
     * Importe un état de tournoi
     */
    async importState(data) {
        return this.importJSON(data);
    }

    /**
     * Importe un tournoi depuis JSON
     */
    async importJSON(jsonData) {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        await this.reset();
        
        // Importer les joueurs
        for (const j of data.joueurs) {
            await this.db.put('joueurs', j);
        }
        
        // Importer le tournoi
        await this.db.put('tournoi', data.tournoi);
        
        // Importer les tours
        for (const t of data.tours) {
            await this.db.put('tours', t);
        }
        
        await this.loadCache();
        EventBus.emit('tournoi:imported', this.cache.tournoi);
    }
}

// Créer une instance singleton
const tournoiDB = new TournoiDB();

// Export - instance singleton + classe pour cas spéciaux
window.TournoiDB = tournoiDB;
window.TournoiDBClass = TournoiDB;
window.Genre = Genre;
window.Niveau = Niveau;
window.ModeComptage = ModeComptage;
window.TournoiStatus = TournoiStatus;
