/**
 * AccueilPage.js - Page d'accueil / préparation du tournoi
 * Tout se fait sur une seule page : sélection joueurs + configuration
 */

class AccueilPage {
    constructor() {
        this.joueurs = [];           // Joueurs sélectionnés pour le tournoi
        this.joueursDB = [];         // Tous les joueurs de la base
        this.config = {
            nom: '',
            nbTours: 10,
            nbTerrains: 7,
            premierTerrain: 1,
            modeComptage: 'POINTS',  // POINTS, TEMPS, AUCUN
            pointsMax: 21,           // Points pour gagner (mode POINTS)
            tempsMatch: 8,           // Minutes par match (mode TEMPS)
            handicaps: false,
            // Paramètres handicaps par défaut
            handicapParams: {
                // Par genre
                homme: 0,
                femme: 2,
                // Par niveau (NC=0, puis -1 par niveau)
                NC: 0,
                P12: -1,
                P11: -2,
                P10: -3,
                D9: -4,
                D8: -5,
                D7: -6,
                R6: -7,
                R5: -8,
                R4: -9,
                N3: -10,
                N2: -11,
                N1: -12
            }
        };
    }

    /**
     * Réinitialise la configuration aux valeurs par défaut
     */
    resetConfig() {
        this.config.nom = '';
        this.config.nbTours = 10;
        this.config.nbTerrains = 7;
        this.config.premierTerrain = 1;
        this.config.modeComptage = 'POINTS';
        this.config.pointsMax = 21;
        this.config.tempsMatch = 8;
        this.config.handicaps = false;
        this.config.handicapParams = {
            homme: 0,
            femme: 2,
            NC: 0,
            P12: -1,
            P11: -2,
            P10: -3,
            D9: -4,
            D8: -5,
            D7: -6,
            R6: -7,
            R5: -8,
            R4: -9,
            N3: -10,
            N2: -11,
            N1: -12
        };
    }

    /**
     * Initialise et rend la page
     * @param {HTMLElement} container 
     */
    async render(container) {
        container.innerHTML = '';
        
        // Charger les joueurs de la base
        await this.loadJoueursDB();

        // Header
        container.appendChild(this.renderHeader());

        // Main content
        const main = UI.createElement('main', { className: 'main' });

        // Section Participants
        main.appendChild(this.renderParticipantsSection());

        // Section Configuration
        main.appendChild(this.renderConfigSection());

        container.appendChild(main);

        // Footer
        container.appendChild(this.renderFooter());
    }

    /**
     * Charge les joueurs depuis la base
     */
    async loadJoueursDB() {
        try {
            this.joueursDB = window.TournoiDB.getJoueurs();
        } catch (e) {
            console.warn('Base joueurs vide ou erreur:', e);
            this.joueursDB = [];
        }
    }

    /**
     * Rendu du header
     */
    renderHeader() {
        const header = UI.createElement('header', { className: 'header' });

        // Gauche : champ nom du tournoi
        const headerLeft = UI.createElement('div', { className: 'header-left' });
        const titleInput = UI.createElement('input', {
            className: 'header-title-input',
            attributes: {
                type: 'text',
                value: this.config.nom,
                placeholder: 'Nom du tournoi'
            },
            events: {
                input: (e) => { this.config.nom = e.target.value; }
            }
        });
        headerLeft.appendChild(titleInput);
        header.appendChild(headerLeft);

        // Centre : titre principal
        const headerCenter = UI.createElement('div', { className: 'header-center' });
        headerCenter.appendChild(UI.createElement('h1', {
            className: 'header-main-title',
            text: 'Générateur de tournoi interne en DOUBLE'
        }));
        header.appendChild(headerCenter);

        // Droite : bouton paramètres (roue dentée)
        const headerRight = UI.createElement('div', { className: 'header-right' });
        headerRight.appendChild(this.renderMenu());
        header.appendChild(headerRight);

        return header;
    }

    /**
     * Rendu du menu dropdown
     */
    renderMenu() {
        const dropdown = UI.createElement('div', { className: 'dropdown' });

        // Bouton menu hamburger avec texte
        const trigger = UI.createElement('button', {
            className: 'btn-menu dropdown-trigger'
        });
        trigger.appendChild(UI.icon('menu'));
        trigger.appendChild(UI.createElement('span', { text: 'Menu', className: 'btn-menu-text' }));
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        const menu = UI.createElement('div', { className: 'dropdown-menu' });

        // Fonction pour fermer le menu
        const closeMenu = () => dropdown.classList.remove('open');

        // Import joueurs XLSX
        const importJoueurs = UI.createElement('div', {
            className: 'dropdown-item',
            events: { click: () => { closeMenu(); this.importerJoueurs(); } }
        });
        importJoueurs.appendChild(UI.icon('upload'));
        importJoueurs.appendChild(document.createTextNode('Importer joueurs (XLSX)'));
        menu.appendChild(importJoueurs);

        // Import tournoi JSON
        const importTournoi = UI.createElement('div', {
            className: 'dropdown-item',
            events: { click: () => { closeMenu(); this.importerTournoi(); } }
        });
        importTournoi.appendChild(UI.icon('download'));
        importTournoi.appendChild(document.createTextNode('Reprendre tournoi (JSON)'));
        menu.appendChild(importTournoi);

        // Séparateur
        menu.appendChild(UI.createElement('div', { className: 'dropdown-divider' }));

        // Reset - Vide la base et recharge
        const reset = UI.createElement('div', {
            className: 'dropdown-item dropdown-item-danger',
            events: { click: async () => { 
                closeMenu(); 
                if (confirm('Voulez-vous vraiment tout réinitialiser ? Cela supprimera tous les joueurs et rechargera la page.')) {
                    this.resetConfig();
                    await window.TournoiDB.reset();
                    window.location.reload();
                }
            } }
        });
        reset.appendChild(UI.icon('trash'));
        reset.appendChild(document.createTextNode('Réinitialiser'));
        menu.appendChild(reset);

        dropdown.appendChild(trigger);
        dropdown.appendChild(menu);

        // Fermer le menu au clic ailleurs
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                closeMenu();
            }
        });

        return dropdown;
    }

    /**
     * Rendu de la section Participants
     */
    renderParticipantsSection() {
        const joueursContainer = UI.createElement('div', { 
            className: 'joueurs-list',
            id: 'joueurs-container'
        });

        this.updateJoueursDisplay(joueursContainer);

        return UI.section({
            title: 'Participants',
            icon: 'users',
            actions: [
                UI.createElement('span', {
                    className: 'badge badge-primary',
                    text: `${this.joueurs.length} joueurs`,
                    id: 'joueurs-count'
                })
            ],
            body: joueursContainer,
            bodyClass: 'joueurs-grid'
        });
    }

    /**
     * Met à jour l'affichage des joueurs
     */
    updateJoueursDisplay(container) {
        container = container || document.getElementById('joueurs-container');
        if (!container) return;

        container.innerHTML = '';

        if (this.joueurs.length === 0) {
            container.appendChild(UI.emptyState({
                icon: 'users',
                title: 'Aucun participant',
                text: 'Ajoutez des joueurs pour commencer'
            }));
        } else {
            this.joueurs.forEach(joueur => {
                container.appendChild(UI.joueurTag(joueur, {
                    removable: true,
                    onRemove: (j) => this.retirerJoueur(j)
                }));
            });
        }

        // MAJ compteur
        const countEl = document.getElementById('joueurs-count');
        if (countEl) {
            countEl.textContent = `${this.joueurs.length} joueurs`;
        }
    }

    /**
     * Rendu de la section Configuration
     */
    renderConfigSection() {
        const wrapper = UI.createElement('div', { className: 'config-wrapper' });
        
        // Ligne principale avec les paramètres de base (horizontale)
        const configLine = UI.createElement('div', { className: 'config-line' });

        // Nombre de tours
        const toursGroup = UI.createElement('div', { className: 'config-item' });
        toursGroup.appendChild(UI.createElement('label', {
            className: 'form-label',
            text: 'Nombre de tours'
        }));
        toursGroup.appendChild(UI.numberSpinner({
            value: this.config.nbTours,
            min: 1,
            max: 50,
            onChange: (v) => { this.config.nbTours = v; }
        }));
        configLine.appendChild(toursGroup);

        // Nombre de terrains
        const terrainsGroup = UI.createElement('div', { className: 'config-item' });
        terrainsGroup.appendChild(UI.createElement('label', {
            className: 'form-label',
            text: 'Nombre de terrains'
        }));
        terrainsGroup.appendChild(UI.numberSpinner({
            value: this.config.nbTerrains,
            min: 1,
            max: 20,
            onChange: (v) => { this.config.nbTerrains = v; }
        }));
        configLine.appendChild(terrainsGroup);

        // Premier terrain
        const premierGroup = UI.createElement('div', { className: 'config-item' });
        premierGroup.appendChild(UI.createElement('label', {
            className: 'form-label',
            text: 'Premier terrain'
        }));
        premierGroup.appendChild(UI.numberSpinner({
            value: this.config.premierTerrain,
            min: 1,
            max: 20,
            onChange: (v) => { this.config.premierTerrain = v; }
        }));
        configLine.appendChild(premierGroup);

        // Mode de comptage
        const modeGroup = UI.createElement('div', { className: 'config-item' });
        modeGroup.appendChild(UI.createElement('label', {
            className: 'form-label',
            text: 'Mode de comptage'
        }));
        const modeSelect = UI.createElement('select', {
            className: 'form-input form-select',
            events: { 
                change: (e) => { 
                    this.config.modeComptage = e.target.value;
                    // Afficher/masquer les champs conditionnels
                    const pointsField = document.getElementById('config-points-max');
                    const tempsField = document.getElementById('config-temps-match');
                    if (pointsField) pointsField.style.display = e.target.value === 'POINTS' ? 'flex' : 'none';
                    if (tempsField) tempsField.style.display = e.target.value === 'TEMPS' ? 'flex' : 'none';
                } 
            }
        });
        [
            { value: 'POINTS', label: 'Aux points' },
            { value: 'TEMPS', label: 'Au temps' },
            { value: 'AUCUN', label: 'Pas de comptage' }
        ].forEach(opt => {
            const optEl = UI.createElement('option', { text: opt.label, attributes: { value: opt.value } });
            if (opt.value === this.config.modeComptage) optEl.selected = true;
            modeSelect.appendChild(optEl);
        });
        modeGroup.appendChild(modeSelect);
        configLine.appendChild(modeGroup);

        // Points max (visible si mode POINTS)
        const pointsGroup = UI.createElement('div', { 
            className: 'config-item',
            id: 'config-points-max',
            style: { display: this.config.modeComptage === 'POINTS' ? 'flex' : 'none' }
        });
        pointsGroup.appendChild(UI.createElement('label', {
            className: 'form-label',
            text: 'Points pour gagner'
        }));
        pointsGroup.appendChild(UI.numberSpinner({
            value: this.config.pointsMax,
            min: 1,
            max: 50,
            onChange: (v) => { this.config.pointsMax = v; }
        }));
        configLine.appendChild(pointsGroup);

        // Temps match (visible si mode TEMPS)
        const tempsGroup = UI.createElement('div', { 
            className: 'config-item',
            id: 'config-temps-match',
            style: { display: this.config.modeComptage === 'TEMPS' ? 'flex' : 'none' }
        });
        tempsGroup.appendChild(UI.createElement('label', {
            className: 'form-label',
            text: 'Durée (minutes)'
        }));
        tempsGroup.appendChild(UI.numberSpinner({
            value: this.config.tempsMatch,
            min: 1,
            max: 30,
            onChange: (v) => { this.config.tempsMatch = v; }
        }));
        configLine.appendChild(tempsGroup);

        // Handicaps checkbox
        const handicapGroup = UI.createElement('div', { className: 'config-item config-item-checkbox' });
        const handicapLabel = UI.createElement('label', { className: 'form-check' });
        const handicapCheck = UI.createElement('input', {
            className: 'form-check-input',
            attributes: { type: 'checkbox' },
            events: { 
                change: (e) => { 
                    this.config.handicaps = e.target.checked;
                    const zone = document.getElementById('handicaps-zone');
                    if (zone) {
                        zone.classList.toggle('visible', e.target.checked);
                    }
                } 
            }
        });
        handicapLabel.appendChild(handicapCheck);
        handicapLabel.appendChild(UI.createElement('span', { 
            className: 'form-check-label', 
            text: 'Activer les handicaps' 
        }));
        handicapGroup.appendChild(handicapLabel);
        configLine.appendChild(handicapGroup);

        wrapper.appendChild(configLine);

        // Zone paramètres handicaps (masquée par défaut, EN DESSOUS de la ligne)
        const handicapsZone = UI.createElement('div', { 
            className: 'handicaps-zone',
            id: 'handicaps-zone'
        });

        // Section Genre
        const genreSection = UI.createElement('div', { className: 'handicap-section' });
        genreSection.appendChild(UI.createElement('h5', {
            text: 'Handicap par genre',
            className: 'handicap-section-title'
        }));
        
        const genreGrid = UI.createElement('div', { className: 'handicap-grid-small' });
        
        // Homme
        const hommeItem = UI.createElement('div', { className: 'handicap-item-small' });
        hommeItem.appendChild(UI.createElement('span', { className: 'handicap-label-small', text: 'Homme' }));
        hommeItem.appendChild(UI.numberSpinner({
            value: this.config.handicapParams.homme,
            min: -20,
            max: 20,
            onChange: (v) => { this.config.handicapParams.homme = v; }
        }));
        genreGrid.appendChild(hommeItem);

        // Femme
        const femmeItem = UI.createElement('div', { className: 'handicap-item-small' });
        femmeItem.appendChild(UI.createElement('span', { className: 'handicap-label-small', text: 'Femme' }));
        femmeItem.appendChild(UI.numberSpinner({
            value: this.config.handicapParams.femme,
            min: -20,
            max: 20,
            onChange: (v) => { this.config.handicapParams.femme = v; }
        }));
        genreGrid.appendChild(femmeItem);

        genreSection.appendChild(genreGrid);
        handicapsZone.appendChild(genreSection);

        // Section Niveaux
        const niveauSection = UI.createElement('div', { className: 'handicap-section' });
        niveauSection.appendChild(UI.createElement('h5', {
            text: 'Handicap par niveau',
            className: 'handicap-section-title'
        }));

        const niveauGrid = UI.createElement('div', { className: 'handicap-grid-small' });
        const niveaux = ['NC', 'P12', 'P11', 'P10', 'D9', 'D8', 'D7', 'R6', 'R5', 'R4', 'N3', 'N2', 'N1'];
        
        niveaux.forEach(niveau => {
            const item = UI.createElement('div', { className: 'handicap-item-small' });
            item.appendChild(UI.createElement('span', { className: 'handicap-label-small', text: niveau }));
            item.appendChild(UI.numberSpinner({
                value: this.config.handicapParams[niveau],
                min: -20,
                max: 20,
                onChange: (v) => { this.config.handicapParams[niveau] = v; }
            }));
            niveauGrid.appendChild(item);
        });

        niveauSection.appendChild(niveauGrid);
        handicapsZone.appendChild(niveauSection);
        wrapper.appendChild(handicapsZone);

        return UI.section({
            title: 'Configuration',
            icon: 'settings',
            body: wrapper
        });
    }

    /**
     * Rendu du footer
     */
    renderFooter() {
        const footer = UI.createElement('footer', { className: 'footer' });

        // Infos
        const info = UI.createElement('div', { className: 'footer-info' });
        info.appendChild(UI.icon('info', 'footer-icon'));
        info.appendChild(UI.createElement('span', {
            text: 'Tournoi Badminton v2.0 - Mode hors-ligne supporté'
        }));
        footer.appendChild(info);

        // Bouton Lancer
        const launchBtn = UI.button({
            text: 'Lancer le tournoi',
            icon: 'play',
            variant: 'primary',
            size: 'lg',
            onClick: () => this.lancerTournoi()
        });
        footer.appendChild(launchBtn);

        return footer;
    }

    // ========================================
    // ACTIONS
    // ========================================

    /**
     * Ouvre la modale de sélection des joueurs
     */
    async ouvrirSelectionJoueurs() {
        const selectedIds = this.joueurs.map(j => j.id);
        const result = await Modal.selectJoueurs(this.joueursDB, {
            title: 'Sélectionner les participants',
            selected: selectedIds,
            multiple: true
        });

        if (result) {
            this.joueurs = result;
            this.updateJoueursDisplay();
        }
    }

    /**
     * Retire un joueur de la sélection
     */
    retirerJoueur(joueur) {
        this.joueurs = this.joueurs.filter(j => j.id !== joueur.id);
        this.updateJoueursDisplay();
    }

    /**
     * Importe des joueurs depuis un fichier XLSX (multi-feuilles)
     */
    async importerJoueurs() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // Réinitialiser les données d'affichage vidéoprojecteur
                localStorage.removeItem('affichage_data');
                
                // Lire le workbook
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const sheetNames = workbook.SheetNames;
                
                console.log('Feuilles trouvées:', sheetNames);

                // Si une seule feuille, importer directement
                if (sheetNames.length === 1) {
                    console.log('Une seule feuille, import direct');
                    await this.importerFeuillesSelectionnees(workbook, sheetNames);
                    return;
                }

                // Sinon, afficher le modal de sélection des feuilles
                console.log('Plusieurs feuilles, affichage du modal');
                const selectedSheets = await this.afficherModalSelectionFeuilles(sheetNames);
                
                if (selectedSheets && selectedSheets.length > 0) {
                    await this.importerFeuillesSelectionnees(workbook, selectedSheets);
                }
            } catch (err) {
                console.error('Erreur import:', err);
                await Modal.alert({
                    title: 'Erreur',
                    message: 'Impossible de lire le fichier.'
                });
            }
        };

        input.click();
    }

    /**
     * Affiche un modal pour sélectionner les feuilles à importer
     * @param {string[]} sheetNames - Liste des noms de feuilles
     * @returns {Promise<string[]>} - Feuilles sélectionnées
     */
    afficherModalSelectionFeuilles(sheetNames) {
        console.log('Affichage modal sélection feuilles:', sheetNames);
        
        return new Promise((resolve) => {
            // Créer le contenu du modal
            const content = UI.createElement('div', { className: 'sheet-selection' });
            
            content.appendChild(UI.createElement('p', {
                text: 'Sélectionnez les feuilles à importer :',
                className: 'sheet-selection-info'
            }));

            const checkboxList = UI.createElement('div', { className: 'sheet-checkbox-list' });
            
            // Créer les checkboxes pour chaque feuille
            const checkboxes = [];
            sheetNames.forEach(name => {
                const item = UI.createElement('label', { className: 'form-check sheet-checkbox-item' });
                const checkbox = UI.createElement('input', {
                    className: 'form-check-input',
                    attributes: { 
                        type: 'checkbox', 
                        value: name
                    }
                });
                // Cocher par défaut (propriété, pas attribut)
                checkbox.checked = true;
                
                item.appendChild(checkbox);
                item.appendChild(UI.createElement('span', { 
                    className: 'form-check-label', 
                    text: name 
                }));
                checkboxList.appendChild(item);
                checkboxes.push(checkbox);
            });

            content.appendChild(checkboxList);

            // Boutons tout sélectionner / tout désélectionner
            const btnGroup = UI.createElement('div', { className: 'sheet-btn-group' });
            btnGroup.appendChild(UI.button({
                text: 'Tout sélectionner',
                variant: 'ghost',
                size: 'sm',
                onClick: () => checkboxes.forEach(cb => cb.checked = true)
            }));
            btnGroup.appendChild(UI.button({
                text: 'Tout désélectionner',
                variant: 'ghost',
                size: 'sm',
                onClick: () => checkboxes.forEach(cb => cb.checked = false)
            }));
            content.appendChild(btnGroup);

            // Afficher le modal
            Modal.show({
                title: 'Sélection des feuilles',
                content: content,
                size: 'sm',
                actions: [
                    {
                        text: 'Annuler',
                        variant: 'outline',
                        onClick: () => { resolve(null); }
                    },
                    {
                        text: 'Importer',
                        variant: 'primary',
                        onClick: () => {
                            const selected = checkboxes
                                .filter(cb => cb.checked)
                                .map(cb => cb.value);
                            resolve(selected);
                        }
                    }
                ]
            });
        });
    }

    /**
     * Importe les joueurs des feuilles sélectionnées
     * @param {Object} workbook - Workbook XLSX
     * @param {string[]} sheetNames - Noms des feuilles à importer
     */
    async importerFeuillesSelectionnees(workbook, sheetNames) {
        let totalImported = 0;

        // Réinitialiser le tournoi avant l'import (vider joueurs retirés, tours, etc.)
        await window.TournoiDB.updateTournoi({ 
            joueursRetires: [],
            joueurs: [],
            status: 'config',
            tourActuel: -1
        });
        
        // Vider les tours existants
        await window.TournoiDB.db.clear('tours');
        window.TournoiDB.cache.tours = [];
        
        // Vider la liste locale des joueurs
        this.joueurs = [];
        
        // Réinitialiser la configuration aux valeurs par défaut
        this.resetConfig();

        for (const sheetName of sheetNames) {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) continue;

            // Structure attendue par position :
            // [0] Sexe, [1] Nom, [2] Prénom, [3] Simple, [4] Double, [5] Mixte
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Ignorer la première ligne (en-têtes)
            const dataRows = rows.slice(1).filter(row => row && row.length > 0);

            for (const row of dataRows) {
                // Colonne 0 : Sexe (F ou H)
                const genreRaw = String(row[0] || 'H').toUpperCase().trim();
                const genre = (genreRaw.charAt(0) === 'F') ? 'F' : 'H';
                
                // Colonne 1 : Nom
                const nom = String(row[1] || '').trim();
                
                // Colonne 2 : Prénom
                const prenom = String(row[2] || '').trim();
                
                // Colonne 3 : Classement Simple
                const classementSimple = String(row[3] || 'NC').toUpperCase().trim() || 'NC';
                
                // Colonne 4 : Classement Double
                const classementDouble = String(row[4] || 'NC').toUpperCase().trim() || 'NC';
                
                // Colonne 5 : Classement Mixte
                const classementMixte = String(row[5] || 'NC').toUpperCase().trim() || 'NC';
                
                // Ignorer les lignes vides (sans nom)
                if (!nom) continue;
                
                const joueur = {
                    id: Date.now() + Math.random(),
                    nom: nom,
                    prenom: prenom,
                    genre: genre,
                    niveauSimple: classementSimple,
                    niveauDouble: classementDouble,
                    niveauMixte: classementMixte,
                    feuille: sheetName  // Stocker la feuille d'origine
                };
                await window.TournoiDB.addJoueur(joueur);
                this.joueurs.push(joueur);
                totalImported++;
            }
        }

        await this.loadJoueursDB();
        this.updateJoueursDisplay();
        
        const sheetsInfo = sheetNames.length > 1 
            ? ` (${sheetNames.length} feuilles)` 
            : '';
        
        await Modal.alert({
            title: 'Import réussi',
            message: `${totalImported} joueurs importés${sheetsInfo}.`
        });
    }

    /**
     * Importe un tournoi sauvegardé
     */
    async importerTournoi() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                await window.TournoiDB.importState(data);
                
                // Navigation vers la page tournoi
                Router.navigate('/tournoi');
            } catch (err) {
                console.error('Erreur import tournoi:', err);
                await Modal.alert({
                    title: 'Erreur',
                    message: 'Fichier de sauvegarde invalide.'
                });
            }
        };

        input.click();
    }

    /**
     * Réinitialise tout
     */
    async resetTournoi() {
        const confirmed = await Modal.confirm({
            title: 'Réinitialiser ?',
            message: 'Cette action effacera tous les joueurs sélectionnés et la configuration.',
            confirmText: 'Réinitialiser',
            danger: true
        });

        if (confirmed) {
            this.joueurs = [];
            this.config = {
                nom: 'Tournoi Interne',
                nbTours: 10,
                nbTerrains: 7,
                premierTerrain: 1,
                modeComptage: 'POINTS',
                handicaps: false
            };
            
            await window.TournoiDB.resetAll();
            Router.navigate('/');
        }
    }

    /**
     * Lance le tournoi
     */
    async lancerTournoi() {
        // Vérifications
        if (this.joueurs.length < 4) {
            await Modal.alert({
                title: 'Impossible',
                message: 'Il faut au moins 4 joueurs pour lancer un tournoi.'
            });
            return;
        }

        try {
            // Sauvegarder la config et les joueurs
            await window.TournoiDB.lancerTournoi({
                ...this.config,
                joueurs: this.joueurs
            });

            // Générer les matchs
            const generateur = new TournoiGenerateur({
                joueurs: this.joueurs,
                nbTours: this.config.nbTours,
                nbTerrains: this.config.nbTerrains,
                premierTerrain: this.config.premierTerrain
            });
            
            console.log(`Génération: ${this.joueurs.length} joueurs, ${generateur.liste.length} tours générés`);
            
            await window.TournoiDB.setTours(generateur.liste);

            // Navigation
            Router.navigate('/tournoi');
        } catch (err) {
            console.error('Erreur lancement:', err);
            await Modal.alert({
                title: 'Erreur',
                message: 'Impossible de générer le tournoi: ' + err.message
            });
        }
    }
}

// Export
window.AccueilPage = AccueilPage;
