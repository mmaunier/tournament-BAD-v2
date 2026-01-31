/**
 * TournoiPage.js - Page de déroulement du tournoi
 * Affiche tous les tours en scroll, permet la saisie des scores
 * et validation tour par tour avec confirmation modale
 */

class TournoiPage {
    constructor() {
        this.tournoi = null;
        this.tours = [];
        this.tourActif = 0;
        this.joueursActifs = [];
        // ID source sera défini après chargement du tournoi (basé sur tournoi.id)
        this.sourceId = null;
        this.container = null;
        // Timer
        this.timer = null;
        this.timerDuration = 8 * 60; // 8 minutes par défaut
        
        // Synchronisation du timer entre fenêtres via localStorage polling
        this.lastTimerTimestamp = 0;
        this.lastCommandTimestamp = 0; // Pour détecter les nouvelles commandes
        this.timerSyncInterval = null;
        this.isTimerRunningLocally = false; // true si le timer tourne dans CETTE fenêtre
    }
    
    /**
     * Démarre le polling pour synchroniser le timer depuis d'autres fenêtres
     * Fonctionne avec N fenêtres (1 à 7+)
     */
    startTimerSync() {
        if (this.timerSyncInterval) return;
        
        this.timerSyncInterval = setInterval(() => {
            try {
                // 1. Vérifier les commandes (play/pause/stop) d'autres fenêtres
                const cmd = JSON.parse(localStorage.getItem('timer_command') || 'null');
                if (cmd && cmd.timestamp > this.lastCommandTimestamp) {
                    this.lastCommandTimestamp = cmd.timestamp;
                    this.executeTimerCommand(cmd);
                }
                
                // 2. Synchroniser l'affichage si on n'est pas la fenêtre qui fait tourner le timer
                if (!this.isTimerRunningLocally) {
                    const data = JSON.parse(localStorage.getItem('affichage_timer') || 'null');
                    if (data && data.timestamp > this.lastTimerTimestamp) {
                        this.lastTimerTimestamp = data.timestamp;
                        this.onTimerSync(data);
                    }
                }
            } catch (e) {
                // Ignorer les erreurs de parsing
            }
        }, 200); // Vérifier toutes les 200ms
    }
    
    /**
     * Exécute une commande de timer reçue (depuis cette fenêtre ou une autre)
     */
    executeTimerCommand(cmd) {
        if (!this.timer) return;
        
        // Générer un ID unique pour cette fenêtre si pas encore fait
        if (!this.windowId) {
            this.windowId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
        
        switch (cmd.action) {
            case 'play':
                // Seule la fenêtre désignée comme maître peut démarrer le timer
                if (cmd.masterId === this.windowId) {
                    // Synchroniser le temps restant avant de démarrer
                    if (cmd.remaining != null) {
                        this.timer.remaining = cmd.remaining;
                    }
                    if (cmd.duration != null) {
                        this.timerDuration = cmd.duration;
                        this.timer.duration = cmd.duration;
                    }
                    this.timer.play();
                    this.isTimerRunningLocally = true;
                } else {
                    // Les autres fenêtres ne font que synchroniser l'affichage
                    this.isTimerRunningLocally = false;
                }
                // Mettre à jour l'affichage pour toutes les fenêtres
                this.updateTimerButtons('running');
                break;
                
            case 'pause':
                if (this.isTimerRunningLocally) {
                    this.timer.pause();
                }
                this.isTimerRunningLocally = false;
                // Synchroniser le temps restant depuis la commande
                if (cmd.remaining != null) {
                    this.timer.remaining = cmd.remaining;
                    this.updateTimerDisplayLocal(cmd.remaining);
                }
                // Mettre à jour l'affichage pour toutes les fenêtres
                this.updateTimerButtons('paused');
                break;
                
            case 'stop':
                if (this.isTimerRunningLocally) {
                    this.timer.stop();
                }
                this.isTimerRunningLocally = false;
                // Mettre à jour l'affichage pour toutes les fenêtres
                this.updateTimerButtons('stopped');
                this.updateTimerDisplayLocal(this.timerDuration);
                break;
        }
    }
    
    /**
     * Envoie une commande de timer à toutes les fenêtres
     * @param {string} action - 'play', 'pause' ou 'stop'
     * @param {boolean} iAmMaster - Si true, cette fenêtre devient le maître du timer
     */
    sendTimerCommand(action, iAmMaster = false) {
        // Générer un ID unique pour cette fenêtre si pas encore fait
        if (!this.windowId) {
            this.windowId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
        
        const cmd = {
            action: action,
            timestamp: Date.now(),
            remaining: this.timer?.getRemaining() || this.timerDuration,
            duration: this.timerDuration,
            masterId: iAmMaster ? this.windowId : null // ID de la fenêtre qui doit être maître
        };
        this.lastCommandTimestamp = cmd.timestamp;
        localStorage.setItem('timer_command', JSON.stringify(cmd));
        
        // Exécuter aussi localement (avec notre ID)
        this.executeTimerCommand(cmd);
    }
    
    /**
     * Toggle Play/Pause partagé
     */
    togglePlayPauseShared() {
        // Vérifier l'état global du timer (depuis localStorage)
        const data = JSON.parse(localStorage.getItem('affichage_timer') || 'null');
        const currentState = data?.state || this.timer?.getState() || 'stopped';
        
        if (currentState === 'running') {
            this.sendTimerCommand('pause');
        } else {
            // Synchroniser le temps restant depuis localStorage avant de reprendre
            if (data?.remaining != null && !this.isTimerRunningLocally) {
                this.timer.remaining = data.remaining;
            }
            if (data?.duration != null) {
                this.timerDuration = data.duration;
                this.timer.duration = data.duration;
            }
            // Cette fenêtre devient le maître du timer
            this.sendTimerCommand('play', true);
        }
    }
    
    /**
     * Stop partagé
     */
    stopShared() {
        this.sendTimerCommand('stop');
    }
    
    /**
     * Met à jour l'affichage local du timer (sans envoyer aux autres)
     */
    updateTimerDisplayLocal(remaining) {
        const display = document.getElementById('timer-display');
        if (display) {
            display.textContent = Timer.formatTime(remaining);
            display.classList.toggle('timer-warning', remaining > 0 && remaining <= 30);
            display.classList.toggle('timer-danger', remaining === 0);
        }
    }
    
    /**
     * Arrête le polling de synchronisation
     */
    stopTimerSync() {
        if (this.timerSyncInterval) {
            clearInterval(this.timerSyncInterval);
            this.timerSyncInterval = null;
        }
    }
    
    /**
     * Reçoit une mise à jour de synchronisation timer d'une autre fenêtre
     */
    onTimerSync(data) {
        // Mettre à jour l'affichage local du timer
        const display = document.getElementById('timer-display');
        if (display) {
            display.textContent = Timer.formatTime(data.remaining);
            display.classList.toggle('timer-warning', data.remaining > 0 && data.remaining <= 30);
            display.classList.toggle('timer-danger', data.remaining === 0);
        }
        
        // Mettre à jour l'état des boutons
        const btnPlay = document.getElementById('timer-btn-play');
        if (btnPlay) {
            if (data.state === 'running') {
                btnPlay.innerHTML = UI.icons.pause;
                btnPlay.classList.add('timer-btn-active');
            } else {
                btnPlay.innerHTML = UI.icons.play;
                btnPlay.classList.remove('timer-btn-active');
            }
        }
        
        // Synchroniser la durée si elle a changé
        if (this.timer && data.duration && data.duration !== this.timerDuration) {
            this.timerDuration = data.duration;
            this.timer.setDuration(data.duration);
        }
    }
    
    /**
     * Met à jour l'apparence des boutons du timer selon l'état
     * @param {string} state - 'running', 'paused' ou 'stopped'
     */
    updateTimerButtons(state) {
        const btnPlay = document.getElementById('timer-btn-play');
        if (btnPlay) {
            if (state === 'running') {
                btnPlay.innerHTML = UI.icons.pause;
                btnPlay.classList.add('timer-btn-active');
            } else {
                btnPlay.innerHTML = UI.icons.play;
                btnPlay.classList.remove('timer-btn-active');
            }
        }
        
        // Si c'est cette fenêtre qui fait tourner le timer, envoyer l'état aux autres
        if (this.isTimerRunningLocally || state === 'running') {
            this.envoyerTimerAffichage(this.timer?.getRemaining() || this.timerDuration);
        }
    }

    /**
     * Initialise et rend la page
     * @param {HTMLElement} container 
     */
    async render(container) {
        this.container = container;
        container.innerHTML = '';
        container.className = 'page page-tournoi';

        // Charger les données
        await this.loadData();

        if (!this.tournoi || this.tours.length === 0) {
            container.appendChild(UI.emptyState({
                icon: 'info',
                title: 'Aucun tournoi en cours',
                text: 'Retournez à l\'accueil pour créer un tournoi',
                action: UI.button({
                    text: 'Accueil',
                    icon: 'arrowRight',
                    variant: 'primary',
                    onClick: () => Router.navigate('/')
                })
            }));
            return;
        }

        // Header
        container.appendChild(this.renderHeader());

        // Main avec tous les tours
        const main = UI.createElement('main', { className: 'main tournoi-main' });
        main.appendChild(this.renderTours());
        container.appendChild(main);

        // Footer
        container.appendChild(this.renderFooter());

        // Initialiser le calcul de la hauteur réelle
        this.updateRealViewportHeight();
        window.addEventListener('resize', () => this.updateRealViewportHeight());

        // Démarrer la synchronisation du timer avec les autres fenêtres
        this.startTimerSync();

        // Scroll vers le tour actif après render
        setTimeout(() => {
            this.scrollToTour(this.tourActif);
        }, 100);
    }
    
    /**
     * Met à jour la variable CSS --real-vh
     */
    updateRealViewportHeight() {
        const realVh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--real-vh', `${realVh}px`);
    }

    /**
     * Charge les données du tournoi
     */
    async loadData() {
        try {
            this.tournoi = await window.TournoiDB.getTournoi();
            this.tours = await window.TournoiDB.getTours();
            
            // Récupérer les joueurs retirés pour les exclure
            const joueursRetiresIds = new Set(
                (this.tournoi?.joueursRetires || []).map(j => j.id)
            );
            
            // Récupérer les joueurs actifs - résoudre les IDs en objets si nécessaire
            const tournoiJoueurs = this.tournoi?.joueurs || [];
            if (tournoiJoueurs.length > 0) {
                // Vérifier si ce sont des objets complets ou des IDs
                let joueursList;
                if (typeof tournoiJoueurs[0] === 'object' && tournoiJoueurs[0].prenom) {
                    // Ce sont des objets complets
                    joueursList = tournoiJoueurs;
                } else {
                    // Ce sont des IDs, on doit les résoudre
                    const allJoueurs = window.TournoiDB.getJoueurs();
                    joueursList = tournoiJoueurs.map(idOrObj => {
                        if (typeof idOrObj === 'object') return idOrObj;
                        return allJoueurs.find(j => j.id === idOrObj) || { id: idOrObj, prenom: '?', nom: '?' };
                    });
                }
                // Exclure les joueurs retirés de la liste des actifs
                this.joueursActifs = joueursList.filter(j => !joueursRetiresIds.has(j.id));
            } else {
                this.joueursActifs = [];
            }
            
            console.log(`TournoiPage: ${this.tours.length} tours chargés, ${this.joueursActifs.length} joueurs actifs, ${joueursRetiresIds.size} retirés`);
            
            // Récupérer le temps du match configuré dans le tournoi
            if (this.tournoi?.tempsMatch) {
                this.timerDuration = this.tournoi.tempsMatch * 60; // Convertir minutes en secondes
            }
            
            // Trouver le premier tour non validé
            this.tourActif = this.tours.findIndex(t => !t.valide);
            if (this.tourActif === -1) {
                // Tous validés, on affiche le dernier
                this.tourActif = Math.max(0, this.tours.length - 1);
            }
        } catch (e) {
            console.error('Erreur chargement tournoi:', e);
        }
    }

    /**
     * Rendu du header
     */
    renderHeader() {
        const header = UI.createElement('header', { className: 'header header-tournoi' });

        // Ligne 1: Titre + Infos + Actions
        const headerRow1 = UI.createElement('div', { className: 'header-row' });
        
        // Titre (plus compact)
        const titleBlock = UI.createElement('div', { className: 'header-title-block' });
        titleBlock.appendChild(UI.createElement('h1', {
            className: 'header-title header-title-sm',
            text: this.tournoi?.nom || 'Tournoi'
        }));
        headerRow1.appendChild(titleBlock);
        
        const toursValides = this.tours.filter(t => t.valide).length;

        // Infos tournoi
        const infos = UI.createElement('div', { className: 'header-infos' });
        const nbJoueurs = this.joueursActifs?.length || window.TournoiDB?.getJoueursSelectionnes()?.length || 0;
        infos.appendChild(UI.createElement('span', {
            className: 'header-info-item',
            text: `${nbJoueurs} joueurs`
        }));
        infos.appendChild(UI.createElement('span', {
            className: 'header-info-item',
            text: `${toursValides} / ${this.tours.length} tours`
        }));
        headerRow1.appendChild(infos);

        // Actions
        const actions = UI.createElement('div', { className: 'header-actions' });
        
        // Bouton Sauvegarder
        actions.appendChild(UI.button({
            text: 'Sauvegarder',
            icon: 'download',
            variant: 'outline',
            size: 'sm',
            onClick: () => this.sauvegarder()
        }));

        actions.appendChild(UI.button({
            text: 'Stats',
            icon: 'info',
            variant: 'outline',
            size: 'sm',
            onClick: () => this.afficherStatistiques()
        }));

        actions.appendChild(UI.button({
            text: 'Retirer',
            icon: 'userMinus',
            variant: 'outline',
            size: 'sm',
            onClick: () => this.retirerJoueur()
        }));

        actions.appendChild(UI.button({
            text: 'Terminer',
            icon: 'flag',
            variant: 'danger',
            size: 'sm',
            onClick: () => this.terminerTournoi()
        }));

        headerRow1.appendChild(actions);
        header.appendChild(headerRow1);

        // Ligne 2: Contrôle d'affichage
        header.appendChild(this.renderControleAffichage());

        return header;
    }

    /**
     * Rendu de tous les tours
     */
    renderTours() {
        const toursContainer = UI.createElement('div', { className: 'tours-container' });

        this.tours.forEach((tour, index) => {
            const isActive = index === this.tourActif;
            const isValidated = tour.valide;
            const isFuture = index > this.tourActif;

            const tourEl = UI.createElement('div', {
                className: `tour ${isActive ? 'tour-actif' : ''} ${isValidated ? 'tour-valide' : ''} ${isFuture ? 'tour-futur' : ''}`,
                attributes: { 'data-tour': index, 'id': `tour-${index}` }
            });

            // Header du tour
            const tourHeader = UI.createElement('div', { className: 'tour-header' });
            
            // Titre avec numéro
            const titleContainer = UI.createElement('div', { className: 'tour-title' });
            titleContainer.appendChild(UI.createElement('span', {
                className: 'tour-numero',
                text: `${index + 1}`
            }));
            titleContainer.appendChild(UI.createElement('span', {
                text: `Tour ${index + 1}`
            }));
            tourHeader.appendChild(titleContainer);

            // Status et bouton validation
            const tourActions = UI.createElement('div', { className: 'tour-actions' });
            
            if (isValidated) {
                tourActions.appendChild(UI.createElement('span', {
                    className: 'badge badge-success',
                    html: `${UI.icons?.check || '✓'} Validé`
                }));
            } else {
                // Bouton valider le tour
                tourActions.appendChild(UI.button({
                    text: 'Valider ce tour',
                    icon: 'check',
                    variant: isActive ? 'success' : 'outline',
                    size: 'sm',
                    onClick: () => this.validerTour(index)
                }));
            }
            
            tourHeader.appendChild(tourActions);
            tourEl.appendChild(tourHeader);

            // Body avec les matchs
            const tourBody = UI.createElement('div', { className: 'tour-body' });
            const matchsGrid = UI.createElement('div', { className: 'matchs-grid' });
            
            (tour.matchs || []).forEach((match, matchIndex) => {
                matchsGrid.appendChild(this.renderMatch(match, index, matchIndex, !isValidated));
            });

            tourBody.appendChild(matchsGrid);

            // Byes (joueurs au repos)
            const hasByes = tour.byes && tour.byes.length > 0;
            const hasRetires = tour.joueursRetires && tour.joueursRetires.length > 0;
            
            if (hasByes || hasRetires) {
                const byesEl = UI.createElement('div', { className: 'tour-byes' });
                
                // Nombre total de joueurs en repos (byes + retirés)
                const totalRepos = (tour.byes?.length || 0) + (tour.joueursRetires?.length || 0);
                
                byesEl.appendChild(UI.createElement('span', {
                    className: 'tour-byes-label',
                    text: `Repos (${totalRepos}) :`
                }));
                
                const byesList = UI.createElement('div', { className: 'tour-byes-list' });
                
                // Afficher les joueurs retirés d'abord
                if (hasRetires) {
                    tour.joueursRetires.forEach(joueur => {
                        if (joueur) {
                            byesList.appendChild(UI.joueurTag(joueur, { retired: true }));
                        }
                    });
                }
                
                // Puis les byes normaux
                if (hasByes) {
                    tour.byes.forEach(joueur => {
                        if (joueur) {
                            byesList.appendChild(UI.joueurTag(joueur));
                        }
                    });
                }
                
                byesEl.appendChild(byesList);
                tourBody.appendChild(byesEl);
            }

            tourEl.appendChild(tourBody);
            toursContainer.appendChild(tourEl);
        });

        return toursContainer;
    }

    /**
     * Rendu de la navigation des tours (pour le mode fullscreen)
     */
    /**
     * Rendu d'un match
     */
    renderMatch(match, tourIndex, matchIndex, editable) {
        const hasScore = match.score1 !== undefined && match.score2 !== undefined;
        
        const card = UI.createElement('div', {
            className: `match-card ${hasScore ? 'match-scored' : ''}`,
            attributes: {
                'data-tour': tourIndex,
                'data-match': matchIndex
            }
        });

        // Header terrain
        const matchHeader = UI.createElement('div', { className: 'match-header' });
        matchHeader.appendChild(UI.createElement('span', {
            className: 'match-terrain',
            text: `Terrain ${match.terrain || matchIndex + 1}`
        }));
        card.appendChild(matchHeader);

        // Body avec équipes
        const matchBody = UI.createElement('div', { className: 'match-body' });

        // Équipe 1
        const team1Class = hasScore && match.score1 > match.score2 ? 'gagnant' : (hasScore ? 'perdant' : '');
        const team1 = UI.createElement('div', { className: `match-equipe ${team1Class}` });
        const joueurs1 = UI.createElement('div', { className: 'equipe-joueurs' });
        (match.equipe1 || []).forEach(joueur => {
            if (joueur) {
                joueurs1.appendChild(UI.joueurTag(joueur));
            }
        });
        team1.appendChild(joueurs1);
        
        if (hasScore) {
            const scoreClass = match.score1 > match.score2 ? 'gagnant' : (match.score1 < match.score2 ? 'perdant' : 'egalite');
            team1.appendChild(UI.createElement('div', {
                className: `equipe-score ${scoreClass}`
            }));
        }
        matchBody.appendChild(team1);

        // VS ou Score central
        const modeComptage = (this.tournoi?.modeComptage || 'points').toLowerCase();
        const vsContainer = UI.createElement('div', { className: 'match-vs-container' });
        if (hasScore) {
            vsContainer.appendChild(UI.createElement('div', {
                className: 'match-score-display',
                text: `${match.score1} : ${match.score2}`
            }));
        } else if (modeComptage === 'aucun') {
            // Mode sans comptage : afficher VS
            vsContainer.appendChild(UI.createElement('div', {
                className: 'match-vs',
                text: 'VS'
            }));
        } else {
            // Calculer le score initial avec handicaps si activés
            const scoreInitial = this.calculerScoreInitial(match.equipe1 || [], match.equipe2 || []);
            vsContainer.appendChild(UI.createElement('div', {
                className: 'match-score-initial',
                text: `${scoreInitial.equipe1} : ${scoreInitial.equipe2}`
            }));
        }
        matchBody.appendChild(vsContainer);

        // Équipe 2
        const team2Class = hasScore && match.score2 > match.score1 ? 'gagnant' : (hasScore ? 'perdant' : '');
        const team2 = UI.createElement('div', { className: `match-equipe ${team2Class}` });
        const joueurs2 = UI.createElement('div', { className: 'equipe-joueurs' });
        (match.equipe2 || []).forEach(joueur => {
            if (joueur) {
                joueurs2.appendChild(UI.joueurTag(joueur));
            }
        });
        team2.appendChild(joueurs2);
        
        if (hasScore) {
            const scoreClass = match.score2 > match.score1 ? 'gagnant' : (match.score2 < match.score1 ? 'perdant' : 'egalite');
            team2.appendChild(UI.createElement('div', {
                className: `equipe-score ${scoreClass}`
            }));
        }
        matchBody.appendChild(team2);

        card.appendChild(matchBody);

        // Bouton saisie score
        if (editable) {
            const matchFooter = UI.createElement('div', { className: 'match-footer' });
            matchFooter.appendChild(UI.button({
                text: hasScore ? 'Modifier score' : 'Saisir score',
                variant: hasScore ? 'ghost' : 'primary',
                size: 'sm',
                onClick: () => this.editerScore(tourIndex, matchIndex, match)
            }));
            card.appendChild(matchFooter);
        }

        return card;
    }

    /**
     * Rendu du footer - désactivé, les contrôles sont dans le header
     */
    renderFooter() {
        // Footer vide - les contrôles ont été déplacés dans le header
        return UI.createElement('div');
    }

    /**
     * Scroll vers un tour spécifique
     */
    scrollToTour(index) {
        this.tourActif = index;
        const tourEl = document.getElementById(`tour-${index}`);
        if (tourEl) {
            // Récupérer la hauteur du header
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 0;
            const offset = headerHeight + 5; // 5px de marge
            
            // Calculer la position de scroll
            const elementPosition = tourEl.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Mettre à jour le sélecteur
            const selector = document.querySelector('.tour-selector');
            if (selector) selector.value = index;
        }
    }

    /**
     * Rendu du panneau de contrôle d'affichage
     */
    renderControleAffichage() {
        const panel = UI.createElement('div', { className: 'affichage-control' });
        
        // === GROUPE GAUCHE (Timer) ===
        const leftGroup = UI.createElement('div', { className: 'affichage-control-left' });
        leftGroup.appendChild(this.renderTimer());
        panel.appendChild(leftGroup);
        
        // === GROUPE DROITE (Terrains, Tour, Afficher, Ouvrir) ===
        const rightGroup = UI.createElement('div', { className: 'affichage-control-right' });
        
        // Calculer les terrains automatiquement
        const premierTerrain = this.tournoi?.premierTerrain || 1;
        const nbTerrains = this.tournoi?.nbTerrains || 7;
        const dernierTerrain = premierTerrain + nbTerrains - 1;
        
        // Affichage des terrains (lecture seule)
        const terrainsGroup = UI.createElement('div', { className: 'control-group' });
        terrainsGroup.appendChild(UI.createElement('label', { text: 'Terrains:', className: 'control-label' }));
        
        const terrainsInfo = nbTerrains === 7 && premierTerrain === 1 
            ? 'Tous (1-7)' 
            : `${premierTerrain} à ${dernierTerrain}`;
        terrainsGroup.appendChild(UI.createElement('span', { 
            text: terrainsInfo, 
            className: 'control-value' 
        }));
        rightGroup.appendChild(terrainsGroup);
        
        // Sélecteur de tour à afficher
        const tourGroup = UI.createElement('div', { className: 'control-group' });
        tourGroup.appendChild(UI.createElement('label', { text: 'Tour:', className: 'control-label' }));
        
        const tourSelect = UI.createElement('select', { className: 'control-select affichage-tour-select' });
        this.tours.forEach((tour, i) => {
            const option = UI.createElement('option', { 
                text: `${i + 1}${tour.valide ? ' ✓' : ''}`, 
                attributes: { value: i.toString() } 
            });
            if (i === this.tourActif) option.selected = true;
            tourSelect.appendChild(option);
        });
        this.tourAffichage = this.tourActif;
        tourSelect.addEventListener('change', (e) => {
            this.tourAffichage = parseInt(e.target.value);
        });
        tourGroup.appendChild(tourSelect);
        
        // Boutons raccourcis +1, +2
        const btnPlus1 = UI.createElement('button', { 
            className: 'btn btn-xs btn-outline',
            text: '+1'
        });
        btnPlus1.addEventListener('click', () => {
            const newTour = Math.min(this.tours.length - 1, this.tourAffichage + 1);
            tourSelect.value = newTour;
            this.tourAffichage = newTour;
        });
        tourGroup.appendChild(btnPlus1);
        
        const btnPlus2 = UI.createElement('button', { 
            className: 'btn btn-xs btn-outline',
            text: '+2'
        });
        btnPlus2.addEventListener('click', () => {
            const newTour = Math.min(this.tours.length - 1, this.tourAffichage + 2);
            tourSelect.value = newTour;
            this.tourAffichage = newTour;
        });
        tourGroup.appendChild(btnPlus2);
        
        rightGroup.appendChild(tourGroup);
        
        // Bouton envoyer
        rightGroup.appendChild(UI.button({
            text: 'Afficher',
            icon: 'play',
            variant: 'primary',
            size: 'sm',
            onClick: () => this.envoyerAffichage()
        }));
        
        // Bouton ouvrir fenêtre
        rightGroup.appendChild(UI.button({
            text: 'Ouvrir',
            variant: 'outline',
            size: 'sm',
            onClick: () => this.ouvrirFenetreAffichage()
        }));
        
        panel.appendChild(rightGroup);
        
        return panel;
    }

    /**
     * Rendu du timer
     */
    renderTimer() {
        const timerContainer = UI.createElement('div', { className: 'timer-container' });
        
        // Initialiser le timer si pas encore fait
        if (!this.timer) {
            this.timer = new Timer({
                duration: this.timerDuration,
                soundPath: 'assets/sons/buzzer.wav',
                onTick: (remaining) => this.updateTimerDisplay(remaining),
                onStateChange: (state) => this.updateTimerButtons(state),
                onComplete: () => this.onTimerComplete()
            });
        }
        
        // Label Timer
        timerContainer.appendChild(UI.createElement('label', { text: 'Timer :', className: 'control-label' }));
        
        // Bouton Play/Pause
        const btnPlayPause = UI.createElement('button', {
            className: 'timer-btn timer-btn-play',
            attributes: { id: 'timer-btn-play', title: 'Démarrer / Pause' }
        });
        btnPlayPause.innerHTML = UI.icons.play;
        btnPlayPause.addEventListener('click', () => this.togglePlayPauseShared());
        timerContainer.appendChild(btnPlayPause);
        
        // Bouton Stop
        const btnStop = UI.createElement('button', {
            className: 'timer-btn timer-btn-stop',
            attributes: { id: 'timer-btn-stop', title: 'Arrêter' }
        });
        btnStop.innerHTML = UI.icons.stop;
        btnStop.addEventListener('click', () => this.stopShared());
        timerContainer.appendChild(btnStop);
        
        // Affichage du temps
        const display = UI.createElement('div', {
            className: 'timer-display',
            attributes: { id: 'timer-display', title: 'Double-clic pour configurer' },
            text: Timer.formatTime(this.timer.getRemaining())
        });
        display.style.cursor = 'pointer';
        display.addEventListener('dblclick', () => this.showTimerConfigModal());
        timerContainer.appendChild(display);
        
        // Bouton Settings
        const btnSettings = UI.createElement('button', {
            className: 'timer-btn timer-btn-settings',
            attributes: { id: 'timer-btn-settings', title: 'Configurer le temps' }
        });
        btnSettings.innerHTML = UI.icons.settings;
        btnSettings.addEventListener('click', () => this.showTimerConfigModal());
        timerContainer.appendChild(btnSettings);
        
        return timerContainer;
    }

    /**
     * Met à jour l'affichage du timer
     */
    updateTimerDisplay(remaining) {
        const display = document.getElementById('timer-display');
        if (display) {
            display.textContent = Timer.formatTime(remaining);
            
            // Ajouter une classe warning si moins de 30 secondes
            display.classList.toggle('timer-warning', remaining > 0 && remaining <= 30);
            display.classList.toggle('timer-danger', remaining === 0);
        }
        
        // Envoyer le timer à la page d'affichage via localStorage
        this.envoyerTimerAffichage(remaining);
    }
    
    /**
     * Envoie les données du timer vers la page d'affichage et les autres fenêtres
     */
    envoyerTimerAffichage(remaining) {
        const state = this.timer?.getState() || 'stopped';
        const now = Date.now();
        const timerData = {
            remaining: remaining,
            state: state,
            duration: this.timerDuration,
            timestamp: now
        };
        
        // Mettre à jour notre timestamp pour éviter de retraiter nos propres mises à jour
        this.lastTimerTimestamp = now;
        
        // Sauvegarder dans localStorage pour synchronisation avec toutes les fenêtres
        localStorage.setItem('affichage_timer', JSON.stringify(timerData));
    }

    /**
     * Appelé quand le timer se termine
     */
    onTimerComplete() {
        console.log('Timer terminé !');
        // Flash visuel sur l'affichage
        const display = document.getElementById('timer-display');
        if (display) {
            display.classList.add('timer-complete-flash');
            setTimeout(() => display.classList.remove('timer-complete-flash'), 3000);
        }
    }

    /**
     * Affiche le modal de configuration du timer
     */
    showTimerConfigModal() {
        // Arrêter le timer si en cours
        if (this.timer.getState() === 'running') {
            this.timer.pause();
        }
        
        const content = UI.createElement('div', { className: 'timer-config-content' });
        
        // Instructions
        content.appendChild(UI.createElement('p', {
            className: 'timer-config-help',
            text: 'Entrez la durée (ex: 8m, 40s, 8m30s, ou un nombre pour les minutes)'
        }));
        
        // Input
        const inputGroup = UI.createElement('div', { className: 'timer-config-input-group' });
        const input = UI.createElement('input', {
            className: 'timer-config-input',
            attributes: {
                type: 'text',
                placeholder: '8m',
                value: this.formatDurationForInput(this.timerDuration)
            }
        });
        inputGroup.appendChild(input);
        
        // Boutons raccourcis
        const shortcuts = UI.createElement('div', { className: 'timer-config-shortcuts' });
        ['5m', '8m', '10m', '15m', '30s', '1m'].forEach(preset => {
            const btn = UI.createElement('button', {
                className: 'btn btn-sm btn-outline',
                text: preset
            });
            btn.addEventListener('click', () => {
                input.value = preset;
            });
            shortcuts.appendChild(btn);
        });
        content.appendChild(inputGroup);
        content.appendChild(shortcuts);
        
        Modal.show({
            title: 'Configurer le timer',
            content: content,
            actions: [
                {
                    text: 'Annuler',
                    variant: 'outline'
                },
                {
                    text: 'Appliquer',
                    variant: 'primary',
                    onClick: () => {
                        const duration = Timer.parseDuration(input.value);
                        if (duration > 0) {
                            this.timerDuration = duration;
                            this.timer.setDuration(duration);
                            return true; // Ferme le modal
                        } else {
                            input.classList.add('input-error');
                            setTimeout(() => input.classList.remove('input-error'), 1000);
                            return false; // Empêche la fermeture
                        }
                    }
                }
            ]
        });
        
        // Focus sur l'input
        setTimeout(() => input.focus(), 100);
    }

    /**
     * Formate la durée pour l'affichage dans l'input
     */
    formatDurationForInput(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (secs === 0) {
            return `${mins}m`;
        }
        return `${mins}m${secs}s`;
    }

    /**
     * Envoie les données vers la page d'affichage via localStorage
     */
    envoyerAffichage() {
        const tourIndex = this.tourAffichage ?? this.tourActif;
        const tour = this.tours[tourIndex];
        if (!tour) return;
        
        // Utiliser les terrains du tournoi automatiquement
        const premierTerrain = this.tournoi?.premierTerrain || 1;
        const nbTerrains = this.tournoi?.nbTerrains || 7;
        const dernierTerrain = premierTerrain + nbTerrains - 1;
        
        // Générer un sourceId stable basé sur l'ID du tournoi ET la plage de terrains
        // Cela permet à 2 instances du même tournoi avec des terrains différents de coexister
        if (!this.sourceId) {
            const tournoiId = this.tournoi?.id || 'default';
            this.sourceId = `source_${tournoiId}_t${premierTerrain}-${dernierTerrain}`;
        }
        
        // Trouver les joueurs en attente pour ce tour
        const joueursEnMatch = new Set();
        tour.matchs.forEach(match => {
            (match.equipe1 || []).forEach(j => j && joueursEnMatch.add(j.id));
            (match.equipe2 || []).forEach(j => j && joueursEnMatch.add(j.id));
        });
        const joueursAttente = (this.joueursActifs || []).filter(j => !joueursEnMatch.has(j.id));
        
        // Récupérer les données existantes
        let data = {};
        try {
            data = JSON.parse(localStorage.getItem('affichage_data') || '{}');
        } catch (e) {}
        
        // Initialiser le conteneur de sources si nécessaire
        if (!data.sources) data.sources = {};
        
        // Envoyer les données avec notre sourceId unique
        data.sources[this.sourceId] = {
            tour: tourIndex,
            premierTerrain: premierTerrain,
            dernierTerrain: dernierTerrain,
            matchs: tour.matchs,
            joueursAttente: joueursAttente
        };
        
        // Ajouter un timestamp pour le polling (synchronisation avec file://)
        data.timestamp = Date.now();
        
        // Sauvegarder
        localStorage.setItem('affichage_data', JSON.stringify(data));
        
        // Notifier (pour les autres fenêtres)
        // Note: storage event ne se déclenche pas sur la fenêtre courante
        // On force donc un event custom
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'affichage_data',
            newValue: JSON.stringify(data)
        }));
    }

    /**
     * Ouvre une nouvelle fenêtre pour l'affichage
     */
    ouvrirFenetreAffichage() {
        // D'abord envoyer les données
        this.envoyerAffichage();
        
        // Ouvrir la fenêtre
        window.open('#/affichage', 'affichage_tournoi', 'width=1920,height=1080');
    }

    /**
     * Calcule le score initial d'un match en fonction des handicaps
     * @param {Array} equipe1 - Joueurs de l'équipe 1
     * @param {Array} equipe2 - Joueurs de l'équipe 2
     * @returns {Object} - { equipe1: number, equipe2: number }
     */
    calculerScoreInitial(equipe1, equipe2) {
        // Si les handicaps ne sont pas activés, retourner 0:0
        if (!this.tournoi?.handicaps && !this.tournoi?.prendreEnCompteHandicaps) {
            return { equipe1: 0, equipe2: 0 };
        }

        const params = this.tournoi?.handicapParams || {};
        
        // Fonction pour calculer le handicap d'un joueur
        const getHandicapJoueur = (joueur) => {
            if (!joueur) return 0;
            let handicap = 0;
            
            // Handicap genre
            if (joueur.genre === 'F') {
                handicap += params.femme || 0;
            } else {
                handicap += params.homme || 0;
            }
            
            // Handicap niveau (utiliser niveauDouble en priorité)
            const niveau = joueur.niveauDouble || joueur.niveauSimple || joueur.niveau || 'NC';
            handicap += params[niveau] || 0;
            
            return handicap;
        };

        // Calculer le handicap total de chaque équipe
        // Le handicap = points donnés au joueur au départ (positif = bonus, négatif = malus)
        let handicapEquipe1 = 0;
        let handicapEquipe2 = 0;
        
        equipe1.forEach(j => { handicapEquipe1 += getHandicapJoueur(j); });
        equipe2.forEach(j => { handicapEquipe2 += getHandicapJoueur(j); });

        return { 
            equipe1: handicapEquipe1, 
            equipe2: handicapEquipe2 
        };
    }

    // ========================================
    // ACTIONS
    // ========================================

    /**
     * Édite le score d'un match
     */
    async editerScore(tourIndex, matchIndex, match) {
        // Calculer les scores initiaux basés sur les handicaps
        const scoresInitiaux = this.calculerScoreInitial(match.equipe1, match.equipe2);
        const result = await Modal.editScore(match, scoresInitiaux);
        
        if (result) {
            // MAJ locale
            this.tours[tourIndex].matchs[matchIndex].score1 = result.score1;
            this.tours[tourIndex].matchs[matchIndex].score2 = result.score2;
            
            // Sauvegarder
            await window.TournoiDB.updateMatch(tourIndex, matchIndex, result);
            
            // Re-render le match
            const isValidated = this.tours[tourIndex].valide;
            const matchCard = document.querySelector(`[data-tour="${tourIndex}"][data-match="${matchIndex}"]`);
            if (matchCard) {
                const newCard = this.renderMatch(
                    this.tours[tourIndex].matchs[matchIndex],
                    tourIndex,
                    matchIndex,
                    !isValidated
                );
                matchCard.replaceWith(newCard);
            }
        }
    }

    /**
     * Valide un tour avec confirmation modale
     */
    async validerTour(tourIndex) {
        const tour = this.tours[tourIndex];
        const modeComptage = (this.tournoi?.modeComptage || 'points').toLowerCase();
        
        // Vérifier les scores manquants
        const matchsSansScore = tour.matchs.filter(m => m.score1 === undefined || m.score2 === undefined);
        
        // Construire le message selon le mode et les scores manquants
        let title, message, confirmText;
        
        if (modeComptage === 'aucun') {
            // Mode sans comptage : message simple
            title = `Passer au tour suivant ?`;
            message = `Tour ${tourIndex + 1} terminé.`;
            confirmText = 'Continuer';
        } else if (matchsSansScore.length > 0) {
            // Mode temps/points avec scores manquants
            title = 'Valider le tour ?';
            // Le message reflète le comportement réel : scores initiaux (handicaps) ou 0:0 si pas de handicaps
            const hasHandicaps = this.tournoi?.handicaps || this.tournoi?.prendreEnCompteHandicaps;
            const scoreInfo = hasHandicaps 
                ? 'Les scores manquants seront initialisés selon les handicaps (égalité).'
                : 'Les scores manquants seront mis à 0:0 (égalité).';
            message = `Il reste ${matchsSansScore.length} match(s) sans score.\n${scoreInfo}`;
            confirmText = 'Valider';
        } else {
            // Mode temps/points, tous les scores saisis
            title = `Valider le Tour ${tourIndex + 1} ?`;
            message = `Passer au tour suivant ?`;
            confirmText = 'Valider';
        }
        
        // Une seule confirmation
        const confirmed = await Modal.confirm({
            title,
            message,
            confirmText,
            cancelText: 'Annuler'
        });
        
        if (!confirmed) return;

        // Procéder à la validation
        try {
            // Mettre les scores initiaux (handicaps) pour les matchs non saisis (mode temps/points)
            if (modeComptage !== 'aucun' && matchsSansScore.length > 0) {
                for (const match of matchsSansScore) {
                    const matchIndex = tour.matchs.indexOf(match);
                    const scoresInitiaux = this.calculerScoreInitial(match.equipe1, match.equipe2);
                    await window.TournoiDB.updateMatch(tourIndex, matchIndex, { 
                        score1: scoresInitiaux.equipe1, 
                        score2: scoresInitiaux.equipe2 
                    });
                }
            }
            
            // Marquer comme validé
            this.tours[tourIndex].valide = true;
            await window.TournoiDB.validerTour(tourIndex);
            
            // Passer au tour suivant si possible
            if (tourIndex < this.tours.length - 1) {
                this.tourActif = tourIndex + 1;
            }
            
            // Refresh complet de la page
            const container = document.querySelector('.page-tournoi');
            if (container) {
                await this.render(container);
            }
            
        } catch (err) {
            console.error('Erreur validation tour:', err);
            await Modal.alert({
                title: 'Erreur',
                message: 'Impossible de valider le tour: ' + err.message
            });
        }
    }

    /**
     * Retire un ou plusieurs joueurs du tournoi
     */
    async retirerJoueur() {
        // Utiliser les joueurs actifs du tournoi (pas getJoueursSelectionnes qui est pour l'accueil)
        const joueurs = this.joueursActifs || [];
        
        if (!joueurs || joueurs.length === 0) {
            await Modal.alert({
                title: 'Aucun joueur',
                message: 'Aucun joueur disponible.'
            });
            return;
        }

        // Sélection multiple avec style visuel pour les joueurs sélectionnés
        const result = await Modal.selectJoueursRetrait(joueurs, {
            title: 'Retirer des joueurs',
            subtitle: 'Cliquez sur les joueurs à retirer'
        });

        if (result && result.length > 0) {
            const noms = result.map(j => `${j.prenom} ${j.nom}`).join(', ');
            const pluriel = result.length > 1;
            
            const confirmed = await Modal.confirm({
                title: `Retirer ${result.length} joueur${pluriel ? 's' : ''} ?`,
                message: `${noms} ${pluriel ? 'seront retirés' : 'sera retiré'} du tournoi.\nLes tours non validés seront régénérés.`,
                confirmText: 'Retirer',
                danger: true
            });

            if (confirmed) {
                try {
                    const ids = result.map(j => j.id);
                    await window.TournoiDB.retirerJoueurs(ids, this.tourActif);
                    Router.navigate('/tournoi');
                } catch (err) {
                    console.error('Erreur retrait joueur:', err);
                    await Modal.alert({
                        title: 'Erreur',
                        message: 'Impossible de retirer le(s) joueur(s): ' + err.message
                    });
                }
            }
        }
    }

    /**
     * Affiche les statistiques de participation des joueurs
     */
    async afficherStatistiques() {
        const joueurs = this.joueursActifs || [];
        const tours = this.tours || [];
        
        if (joueurs.length === 0) {
            await Modal.alert({
                title: 'Aucun joueur',
                message: 'Aucun joueur dans le tournoi.'
            });
            return;
        }

        // Calculer les statistiques pour chaque joueur
        const stats = joueurs.map(joueur => {
            // Trouver les tours où le joueur joue
            const toursJoues = [];
            const toursBye = [];
            
            tours.forEach((tour, tourIndex) => {
                const joue = tour.matchs?.some(match => {
                    const equipe1Ids = (match.equipe1 || []).map(j => j?.id);
                    const equipe2Ids = (match.equipe2 || []).map(j => j?.id);
                    return equipe1Ids.includes(joueur.id) || equipe2Ids.includes(joueur.id);
                });
                
                if (joue) {
                    toursJoues.push(tourIndex + 1);
                } else {
                    toursBye.push(tourIndex + 1);
                }
            });

            // Calculer l'écart minimum entre deux byes consécutifs
            let ecartMinBye = '-';
            if (toursBye.length >= 2) {
                let minEcart = Infinity;
                for (let i = 1; i < toursBye.length; i++) {
                    const ecart = toursBye[i] - toursBye[i - 1];
                    if (ecart < minEcart) {
                        minEcart = ecart;
                    }
                }
                ecartMinBye = minEcart === Infinity ? '-' : minEcart.toString();
            }

            return {
                nom: joueur.nom || '',
                prenom: joueur.prenom || '',
                nbMatchs: toursJoues.length,
                toursBye: toursBye.length > 0 ? toursBye.join(', ') : '-',
                ecartMinBye: ecartMinBye
            };
        });

        // Trier par nombre de matchs (décroissant), puis par nom
        stats.sort((a, b) => b.nbMatchs - a.nbMatchs || a.nom.localeCompare(b.nom));

        // Créer le contenu du modal
        const content = UI.createElement('div', { className: 'stats-modal' });
        
        const table = UI.createElement('table', { className: 'stats-table' });
        
        // En-tête
        const thead = UI.createElement('thead');
        const headerRow = UI.createElement('tr');
        ['Nom', 'Prénom', 'Matchs', 'Tours bye', 'Écart min'].forEach(text => {
            headerRow.appendChild(UI.createElement('th', { text }));
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Corps
        const tbody = UI.createElement('tbody');
        stats.forEach(stat => {
            const row = UI.createElement('tr');
            row.appendChild(UI.createElement('td', { text: stat.nom }));
            row.appendChild(UI.createElement('td', { text: stat.prenom }));
            row.appendChild(UI.createElement('td', { text: stat.nbMatchs.toString(), className: 'text-center' }));
            row.appendChild(UI.createElement('td', { text: stat.toursBye, className: 'text-center' }));
            row.appendChild(UI.createElement('td', { text: stat.ecartMinBye, className: 'text-center' }));
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        
        content.appendChild(table);

        // Afficher le modal
        await Modal.show({
            title: `Statistiques (${tours.length} tours)`,
            content: content,
            size: 'lg',
            closable: true,
            actions: [
                {
                    text: 'Fermer',
                    variant: 'primary',
                    onClick: () => true
                }
            ]
        });
    }

    /**
     * Termine le tournoi
     */
    async terminerTournoi() {
        const toursNonValides = this.tours.filter(t => !t.valide).length;
        const modeComptage = (this.tournoi?.modeComptage || 'points').toLowerCase();
        
        // En mode "aucun", pas de classement à afficher
        const isModeAucun = modeComptage === 'aucun';
        
        let message;
        if (isModeAucun) {
            message = 'Le tournoi sera terminé.';
            if (toursNonValides > 0) {
                message = `Attention : ${toursNonValides} tour(s) non validé(s).\n\nVoulez-vous quand même terminer le tournoi ?`;
            }
        } else {
            message = 'Vous allez passer à l\'écran de classement final.';
            if (toursNonValides > 0) {
                message = `Attention : ${toursNonValides} tour(s) non validé(s).\n\nVoulez-vous quand même terminer le tournoi ?`;
            }
        }
        
        const confirmed = await Modal.confirm({
            title: 'Terminer le tournoi ?',
            message: message,
            confirmText: 'Terminer',
            danger: toursNonValides > 0
        });

        if (confirmed) {
            await window.TournoiDB.terminerTournoi();
            // En mode "aucun", retour à l'accueil; sinon afficher le classement
            if (isModeAucun) {
                await Modal.alert({
                    title: 'Tournoi terminé',
                    message: 'Le tournoi est terminé. Vous allez revenir à l\'accueil.'
                });
                Router.navigate('/');
            } else {
                Router.navigate('/classement');
            }
        }
    }

    /**
     * Sauvegarde le tournoi
     */
    async sauvegarder() {
        try {
            const state = await window.TournoiDB.exportState();
            const json = JSON.stringify(state, null, 2);
            
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `tournoi_${this.tournoi?.nom || 'backup'}_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            await Modal.alert({
                title: 'Sauvegarde réussie',
                message: 'Le fichier a été téléchargé.'
            });
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            await Modal.alert({
                title: 'Erreur',
                message: 'Impossible de sauvegarder: ' + err.message
            });
        }
    }
}

// Export
window.TournoiPage = TournoiPage;
