/**
 * AffichagePage - Page d'affichage grand format pour vidéoprojecteur
 * Reçoit les données des pages Tournoi via localStorage
 */
class AffichagePage {
    constructor() {
        this.terrainsData = {}; // { terrain1: { match, theme, tour }, ... }
        this.joueursAttente = []; // Liste combinée des joueurs en attente
        this.themes = ['blue', 'green', 'orange']; // Couleurs disponibles
        
        // Écouter les changements de localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'affichage_data') {
                this.chargerDonnees();
                this.render(document.querySelector('.page-affichage'));
            }
        });
    }

    /**
     * Charge les données depuis localStorage
     */
    chargerDonnees() {
        try {
            const data = JSON.parse(localStorage.getItem('affichage_data') || '{}');
            
            // Réinitialiser
            this.terrainsData = {};
            this.joueursAttente = [];
            this.terrainMin = Infinity;
            this.terrainMax = 0;
            
            // Récupérer toutes les sources
            const sources = data.sources || {};
            
            // Trier les sources par leur premier terrain pour avoir un ordre cohérent
            const sourcesSorted = Object.entries(sources).sort((a, b) => {
                return (a[1].premierTerrain || 1) - (b[1].premierTerrain || 1);
            });
            
            // Attribuer une couleur à chaque source dans l'ordre
            sourcesSorted.forEach(([sourceId, source], index) => {
                const theme = this.themes[index % this.themes.length];
                
                // Traiter les matchs de cette source
                if (source.matchs) {
                    source.matchs.forEach(match => {
                        if (match.terrain) {
                            this.terrainsData[match.terrain] = {
                                match: match,
                                theme: theme,
                                tour: source.tour
                            };
                            // Mettre à jour les bornes
                            this.terrainMin = Math.min(this.terrainMin, match.terrain);
                            this.terrainMax = Math.max(this.terrainMax, match.terrain);
                        }
                    });
                }
                
                // Ajouter les joueurs en attente
                if (source.joueursAttente) {
                    this.joueursAttente.push(...source.joueursAttente);
                }
            });
            
            // Valeurs par défaut si aucune donnée
            if (this.terrainMin === Infinity) this.terrainMin = 1;
            if (this.terrainMax === 0) this.terrainMax = 7;
            
        } catch (err) {
            console.error('Erreur chargement données affichage:', err);
            this.terrainMin = 1;
            this.terrainMax = 7;
        }
    }

    /**
     * Réinitialise les données d'affichage (supprime toutes les sources)
     */
    reinitialiser() {
        localStorage.removeItem('affichage_data');
        this.terrainsData = {};
        this.joueursAttente = [];
        this.render(document.querySelector('.page-affichage'));
    }

    /**
     * Point d'entrée du rendu
     */
    async render(container) {
        if (!container) return;
        
        this.chargerDonnees();
        
        container.innerHTML = '';
        container.className = 'page-affichage';
        
        // Zone des terrains (de terrainMin à terrainMax)
        const terrainsZone = UI.createElement('div', { className: 'affichage-terrains' });
        
        for (let t = this.terrainMin; t <= this.terrainMax; t++) {
            const terrainInfo = this.terrainsData[t];
            terrainsZone.appendChild(this.renderTerrain(t, terrainInfo));
        }
        
        container.appendChild(terrainsZone);
        
        // Zone joueurs en attente
        container.appendChild(this.renderJoueursAttente());
    }

    /**
     * Rendu d'un terrain
     */
    renderTerrain(numero, terrainInfo) {
        const match = terrainInfo?.match;
        const theme = terrainInfo?.theme || 'blue';
        const tour = terrainInfo?.tour;
        
        const terrain = UI.createElement('div', { 
            className: `affichage-terrain ${match ? 'terrain-occupe' : 'terrain-vide'} theme-${theme}` 
        });
        
        // Header du terrain avec numéro et tour
        const header = UI.createElement('div', { className: 'terrain-header' });
        header.appendChild(UI.createElement('span', { 
            className: 'terrain-numero', 
            text: `Terrain ${numero}` 
        }));
        // Afficher le numéro du tour si disponible
        if (tour !== undefined) {
            header.appendChild(UI.createElement('span', { 
                className: 'terrain-tour', 
                text: `Tour ${tour + 1}` 
            }));
        }
        terrain.appendChild(header);
        
        // Contenu du match
        const body = UI.createElement('div', { className: 'terrain-body' });
        
        if (match) {
            // Équipe 1
            const equipe1 = UI.createElement('div', { className: 'terrain-equipe' });
            (match.equipe1 || []).forEach(joueur => {
                if (joueur) {
                    equipe1.appendChild(this.renderJoueurAffichage(joueur));
                }
            });
            body.appendChild(equipe1);
            
            // VS
            body.appendChild(UI.createElement('div', { className: 'terrain-vs', text: 'VS' }));
            
            // Équipe 2
            const equipe2 = UI.createElement('div', { className: 'terrain-equipe' });
            (match.equipe2 || []).forEach(joueur => {
                if (joueur) {
                    equipe2.appendChild(this.renderJoueurAffichage(joueur));
                }
            });
            body.appendChild(equipe2);
        } else {
            body.appendChild(UI.createElement('div', { 
                className: 'terrain-libre', 
                text: 'Libre' 
            }));
        }
        
        terrain.appendChild(body);
        
        return terrain;
    }

    /**
     * Rendu d'un joueur en grand format
     */
    renderJoueurAffichage(joueur) {
        const div = UI.createElement('div', { 
            className: `joueur-affichage joueur-${(joueur.genre || 'H').toLowerCase()}` 
        });
        
        const nom = joueur.prenom 
            ? `${joueur.prenom} ${joueur.nom?.charAt(0) || ''}.`
            : joueur.nom || 'Inconnu';
        
        div.appendChild(UI.createElement('span', { 
            className: 'joueur-nom', 
            text: nom 
        }));
        
        return div;
    }

    /**
     * Rendu de la zone joueurs en attente
     */
    renderJoueursAttente() {
        const zone = UI.createElement('div', { className: 'affichage-attente' });
        
        const titre = UI.createElement('div', { className: 'attente-titre' });
        titre.appendChild(UI.createElement('span', { text: 'En attente' }));
        if (this.joueursAttente.length > 0) {
            titre.appendChild(UI.createElement('span', { 
                className: 'attente-count', 
                text: `(${this.joueursAttente.length})` 
            }));
        }
        zone.appendChild(titre);
        
        const liste = UI.createElement('div', { className: 'attente-liste' });
        
        if (this.joueursAttente.length === 0) {
            liste.appendChild(UI.createElement('span', { 
                className: 'attente-vide', 
                text: 'Aucun joueur en attente' 
            }));
        } else {
            this.joueursAttente.forEach(joueur => {
                liste.appendChild(this.renderJoueurAffichage(joueur));
            });
        }
        
        zone.appendChild(liste);
        
        return zone;
    }
}

// Export global
window.AffichagePage = AffichagePage;
