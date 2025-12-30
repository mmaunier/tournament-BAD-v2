/**
 * AffichagePage - Page d'affichage grand format pour vidéoprojecteur
 * Reçoit les données des pages Tournoi via localStorage
 */
class AffichagePage {
    constructor() {
        this.terrainsData = {}; // { terrain1: { match, theme, tour }, ... }
        this.joueursAttente = []; // Liste combinée des joueurs en attente
        this.themes = ['blue', 'green', 'orange']; // Couleurs disponibles
        this.timerData = null; // Données du timer
        
        // Écouter les changements de localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'affichage_data') {
                this.chargerDonnees();
                this.render(document.querySelector('.page-affichage'));
            }
            if (e.key === 'affichage_timer') {
                this.chargerTimer();
                this.updateTimerCard();
            }
        });
        
        // Calculer la hauteur réelle de la fenêtre (sans barre de titre/menu navigateur)
        this.updateRealViewportHeight();
        window.addEventListener('resize', () => this.updateRealViewportHeight());
    }
    
    /**
     * Met à jour la variable CSS --real-vh avec la vraie hauteur disponible
     */
    updateRealViewportHeight() {
        // window.innerHeight donne la hauteur réelle disponible dans la fenêtre
        const realVh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--real-vh', `${realVh}px`);
    }
    
    /**
     * Charge les données du timer depuis localStorage
     */
    chargerTimer() {
        try {
            this.timerData = JSON.parse(localStorage.getItem('affichage_timer') || 'null');
        } catch (e) {
            this.timerData = null;
        }
    }
    
    /**
     * Met à jour uniquement la carte timer sans re-render complet
     */
    updateTimerCard() {
        const timerCard = document.getElementById('affichage-timer-card');
        if (!timerCard) return;
        
        if (!this.timerData) {
            timerCard.style.display = 'none';
            return;
        }
        
        timerCard.style.display = 'flex';
        
        const display = timerCard.querySelector('.timer-card-time');
        if (display) {
            display.textContent = this.formatTime(this.timerData.remaining);
            
            // Classes d'état
            display.classList.toggle('timer-warning', this.timerData.remaining > 0 && this.timerData.remaining <= 30);
            display.classList.toggle('timer-danger', this.timerData.remaining === 0);
            display.classList.toggle('timer-paused', this.timerData.state === 'paused');
        }
        
        // Indicateur d'état
        const stateIndicator = timerCard.querySelector('.timer-card-state');
        if (stateIndicator) {
            if (this.timerData.state === 'running') {
                stateIndicator.textContent = '▶ En cours';
                stateIndicator.className = 'timer-card-state state-running';
            } else if (this.timerData.state === 'paused') {
                stateIndicator.textContent = '⏸ Pause';
                stateIndicator.className = 'timer-card-state state-paused';
            } else {
                stateIndicator.textContent = '⏹ Arrêté';
                stateIndicator.className = 'timer-card-state state-stopped';
            }
        }
    }
    
    /**
     * Formate le temps en mm:ss
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        this.chargerTimer();
        
        container.innerHTML = '';
        container.className = 'page-affichage';
        
        // Zone des terrains (de terrainMin à terrainMax)
        const terrainsZone = UI.createElement('div', { className: 'affichage-terrains' });
        
        for (let t = this.terrainMin; t <= this.terrainMax; t++) {
            const terrainInfo = this.terrainsData[t];
            terrainsZone.appendChild(this.renderTerrain(t, terrainInfo));
        }
        
        // Ajouter la carte Timer après les terrains
        terrainsZone.appendChild(this.renderTimerCard());
        
        container.appendChild(terrainsZone);
        
        // Séparateur redimensionnable
        const splitter = UI.createElement('div', { className: 'affichage-splitter' });
        splitter.innerHTML = '<div class="splitter-handle"></div>';
        container.appendChild(splitter);
        
        // Zone joueurs en attente
        const attenteZone = this.renderJoueursAttente();
        container.appendChild(attenteZone);
        
        // Initialiser le redimensionnement
        this.initSplitter(splitter, terrainsZone, attenteZone, container);
    }
    
    /**
     * Rendu de la carte Timer
     */
    renderTimerCard() {
        const card = UI.createElement('div', { 
            className: 'affichage-terrain affichage-timer-card',
            attributes: { id: 'affichage-timer-card' }
        });
        
        // Header
        const header = UI.createElement('div', { className: 'terrain-header timer-header' });
        header.appendChild(UI.createElement('span', { 
            className: 'terrain-numero', 
            text: 'Timer' 
        }));
        header.appendChild(UI.createElement('span', { 
            className: 'timer-card-state state-stopped',
            text: '⏹ Arrêté'
        }));
        card.appendChild(header);
        
        // Body avec le temps
        const body = UI.createElement('div', { className: 'terrain-body timer-card-body' });
        
        const timeDisplay = UI.createElement('div', {
            className: 'timer-card-time',
            text: this.timerData ? this.formatTime(this.timerData.remaining) : '00:00'
        });
        body.appendChild(timeDisplay);
        
        card.appendChild(body);
        
        // Appliquer l'état initial
        if (!this.timerData) {
            card.style.display = 'none';
        } else {
            this.updateTimerCard();
        }
        
        return card;
    }
    
    /**
     * Initialise le comportement du splitter
     */
    initSplitter(splitter, terrainsZone, attenteZone, container) {
        let isDragging = false;
        let startY = 0;
        let startAttenteHeight = 0;
        
        // Charger la hauteur sauvegardée
        const savedHeight = localStorage.getItem('affichage_attente_height');
        if (savedHeight) {
            attenteZone.style.height = savedHeight + 'px';
            attenteZone.style.maxHeight = 'none';
        }
        
        const onMouseDown = (e) => {
            isDragging = true;
            startY = e.clientY || e.touches?.[0]?.clientY;
            startAttenteHeight = attenteZone.offsetHeight;
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const clientY = e.clientY || e.touches?.[0]?.clientY;
            const deltaY = startY - clientY;
            const newHeight = Math.max(50, Math.min(startAttenteHeight + deltaY, container.offsetHeight * 0.6));
            
            attenteZone.style.height = newHeight + 'px';
            attenteZone.style.maxHeight = 'none';
        };
        
        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                // Sauvegarder la hauteur
                localStorage.setItem('affichage_attente_height', attenteZone.offsetHeight);
            }
        };
        
        // Événements souris
        splitter.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        // Événements tactiles
        splitter.addEventListener('touchstart', onMouseDown, { passive: false });
        document.addEventListener('touchmove', onMouseMove, { passive: false });
        document.addEventListener('touchend', onMouseUp);
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
