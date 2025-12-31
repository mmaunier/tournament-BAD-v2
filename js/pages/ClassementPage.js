/**
 * ClassementPage.js - Page de classement final
 * Affiche les scores et permet de séparer en poules haute/basse
 */

class ClassementPage {
    constructor() {
        this.classement = [];
        this.tournoi = null;
        this.pouleHaute = [];
        this.pouleBasse = [];
        this.separationIndex = 0;  // Index de séparation 3/7 - 4/7
    }

    /**
     * Initialise et rend la page
     * @param {HTMLElement} container 
     */
    async render(container) {
        container.className = 'page page-classement';
        container.innerHTML = '';

        // Charger les données
        await this.loadData();

        // Header
        container.appendChild(this.renderHeader());

        // Main
        const main = UI.createElement('main', { className: 'main classement-main' });

        // Section classement général
        main.appendChild(this.renderClassementSection());

        // Section poules (drag & drop)
        main.appendChild(this.renderPoulesSection());

        container.appendChild(main);

        // Footer
        container.appendChild(this.renderFooter());

        // Initialiser le drag & drop
        this.initDragAndDrop();
    }

    /**
     * Charge les données
     */
    async loadData() {
        try {
            this.tournoi = await window.TournoiDB.getTournoi();
            this.classement = await window.TournoiDB.getClassement();
            
            // Calculer la séparation 3/7 - 4/7
            const total = this.classement.length;
            this.separationIndex = Math.ceil(total * 3 / 7);
            
            // Initialiser les poules
            this.pouleHaute = this.classement.slice(0, this.separationIndex);
            this.pouleBasse = this.classement.slice(this.separationIndex);
        } catch (e) {
            console.error('Erreur chargement classement:', e);
        }
    }

    /**
     * Rendu du header
     */
    renderHeader() {
        const header = UI.createElement('header', { className: 'header' });

        const titleBlock = UI.createElement('div', { className: 'header-title-block' });
        titleBlock.appendChild(UI.createElement('h1', {
            className: 'header-title',
            text: 'Classement Final'
        }));
        titleBlock.appendChild(UI.createElement('div', {
            className: 'header-subtitle',
            text: this.tournoi?.nom || 'Tournoi'
        }));
        header.appendChild(titleBlock);

        header.appendChild(UI.createElement('span', {
            className: 'badge badge-warning',
            text: 'Terminé'
        }));

        // Bouton retour
        header.appendChild(UI.button({
            text: 'Nouveau tournoi',
            icon: 'refresh',
            variant: 'outline',
            onClick: () => this.nouveauTournoi()
        }));

        return header;
    }

    /**
     * Rendu de la section classement
     */
    renderClassementSection() {
        const content = UI.createElement('div', { className: 'classement-content' });

        // Tableau
        const table = UI.createElement('table', { className: 'classement-table' });

        // Header - Pts = points classement (3/2/1), V/E/D = victoires/égalités/défaites, +/- = diff points badminton
        const thead = UI.createElement('thead');
        const headerRow = UI.createElement('tr');
        ['#', 'Joueur', 'Pts', 'V', 'E', 'D', '+/-'].forEach(col => {
            headerRow.appendChild(UI.createElement('th', { text: col }));
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = UI.createElement('tbody');
        this.classement.forEach((joueur, index) => {
            const row = UI.createElement('tr', {
                className: index < 3 ? 'classement-top3' : '',
                attributes: { 'data-joueur-id': joueur.id }
            });

            // Rang avec médaille pour top 3
            const rangCell = UI.createElement('td', { className: 'classement-rang' });
            if (index === 0) {
                rangCell.innerHTML = '🥇';
            } else if (index === 1) {
                rangCell.innerHTML = '🥈';
            } else if (index === 2) {
                rangCell.innerHTML = '🥉';
            } else {
                rangCell.textContent = index + 1;
            }
            row.appendChild(rangCell);

            // Joueur - juste prénom et nom en texte simple
            const nameCell = UI.createElement('td', { 
                className: 'classement-joueur',
                text: `${joueur.prenom || ''} ${joueur.nom || ''}`.trim()
            });
            row.appendChild(nameCell);

            // Points de classement (3/2/1)
            row.appendChild(UI.createElement('td', { 
                text: joueur.pointsClassement || 0,
                className: 'classement-points text-center font-bold'
            }));

            // Victoires
            row.appendChild(UI.createElement('td', { 
                text: joueur.victoires || 0,
                className: 'text-center text-success'
            }));
            
            // Égalités
            row.appendChild(UI.createElement('td', { 
                text: joueur.egalites || 0,
                className: 'text-center text-warning'
            }));
            
            // Défaites
            row.appendChild(UI.createElement('td', { 
                text: joueur.defaites || 0,
                className: 'text-center text-danger'
            }));
            
            // Différence de points badminton +/-
            const diff = joueur.pointsDiff || 0;
            row.appendChild(UI.createElement('td', {
                text: diff >= 0 ? `+${diff}` : diff,
                className: `text-center ${diff >= 0 ? 'text-success' : 'text-danger'}`
            }));

            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        content.appendChild(table);

        return UI.section({
            title: 'Classement général',
            icon: 'trophy',
            body: content
        });
    }

    /**
     * Rendu de la section poules
     */
    renderPoulesSection() {
        const content = UI.createElement('div', { className: 'poules-wrapper' });

        // Info en haut
        const info = UI.createElement('div', { className: 'poules-info' });
        info.appendChild(UI.icon('info'));
        info.appendChild(UI.createElement('span', {
            text: 'Glissez-déposez les joueurs pour ajuster la répartition entre poule haute et poule basse.'
        }));
        content.appendChild(info);

        // Fonction de tri alphabétique par prénom puis nom
        const trierAlphabetique = (a, b) => {
            const prenomA = (a.prenom || '').toLowerCase();
            const prenomB = (b.prenom || '').toLowerCase();
            if (prenomA !== prenomB) return prenomA.localeCompare(prenomB);
            const nomA = (a.nom || '').toLowerCase();
            const nomB = (b.nom || '').toLowerCase();
            return nomA.localeCompare(nomB);
        };

        // Trier les poules par ordre alphabétique
        const pouleHauteTriee = [...this.pouleHaute].sort(trierAlphabetique);
        const pouleBasseTriee = [...this.pouleBasse].sort(trierAlphabetique);

        // Conteneur des deux colonnes SOUS le texte
        const columns = UI.createElement('div', { className: 'poules-columns' });

        // Poule haute (colonne gauche)
        const pouleHauteEl = UI.createElement('div', {
            className: 'poule poule-haute',
            id: 'poule-haute'
        });
        pouleHauteEl.appendChild(UI.createElement('div', {
            className: 'poule-header',
            html: `<span class="poule-title">Poule Haute</span><span class="poule-count">${this.pouleHaute.length}</span>`
        }));
        const hauteList = UI.createElement('div', {
            className: 'poule-list',
            id: 'poule-haute-list'
        });
        pouleHauteTriee.forEach(joueur => {
            hauteList.appendChild(this.renderPouleItem(joueur));
        });
        pouleHauteEl.appendChild(hauteList);
        columns.appendChild(pouleHauteEl);

        // Poule basse (colonne droite)
        const pouleBasseEl = UI.createElement('div', {
            className: 'poule poule-basse',
            id: 'poule-basse'
        });
        pouleBasseEl.appendChild(UI.createElement('div', {
            className: 'poule-header',
            html: `<span class="poule-title">Poule Basse</span><span class="poule-count">${this.pouleBasse.length}</span>`
        }));
        const basseList = UI.createElement('div', {
            className: 'poule-list',
            id: 'poule-basse-list'
        });
        pouleBasseTriee.forEach(joueur => {
            basseList.appendChild(this.renderPouleItem(joueur));
        });
        pouleBasseEl.appendChild(basseList);
        columns.appendChild(pouleBasseEl);

        content.appendChild(columns);

        return UI.section({
            title: 'Répartition des poules',
            icon: 'users',
            actions: [
                UI.button({
                    text: 'Exporter XLSX',
                    icon: 'download',
                    variant: 'primary',
                    onClick: () => this.exporterPoules()
                })
            ],
            body: content
        });
    }

    /**
     * Rendu d'un item de poule (draggable) avec joueurTag
     */
    renderPouleItem(joueur) {
        const item = UI.createElement('div', {
            className: 'poule-item',
            attributes: {
                draggable: 'true',
                'data-joueur-id': joueur.id
            }
        });

        // Handle de drag
        item.appendChild(UI.icon('grip', 'drag-handle'));
        
        // Card du joueur (joueurTag)
        item.appendChild(UI.joueurTag(joueur));
        
        // Stats : victoires + points classement
        item.appendChild(UI.createElement('span', {
            className: 'poule-item-stats',
            text: `${joueur.victoires || 0}V - ${joueur.pointsClassement || 0}pts`
        }));

        return item;
    }

    /**
     * Rendu du footer
     */
    renderFooter() {
        const footer = UI.createElement('footer', { className: 'footer' });

        footer.appendChild(UI.createElement('div', {
            className: 'footer-info',
            text: `${this.classement.length} joueurs classés`
        }));

        const actions = UI.createElement('div', { className: 'footer-actions' });

        actions.appendChild(UI.button({
            text: 'Sauvegarder JSON',
            icon: 'download',
            variant: 'outline',
            onClick: () => this.sauvegarderJSON()
        }));

        footer.appendChild(actions);

        return footer;
    }

    /**
     * Initialise le drag & drop
     */
    initDragAndDrop() {
        const lists = document.querySelectorAll('.poule-list');
        
        lists.forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                const dragging = document.querySelector('.dragging');
                const afterElement = this.getDragAfterElement(list, e.clientY);
                
                if (afterElement) {
                    list.insertBefore(dragging, afterElement);
                } else {
                    list.appendChild(dragging);
                }
            });
        });

        const items = document.querySelectorAll('.poule-item');
        
        items.forEach(item => {
            item.addEventListener('dragstart', () => {
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.updatePoules();
            });
        });
    }

    /**
     * Trouve l'élément après lequel insérer
     */
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.poule-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Met à jour les poules après drag & drop
     */
    updatePoules() {
        const hauteList = document.getElementById('poule-haute-list');
        const basseList = document.getElementById('poule-basse-list');

        const hauteIds = [...hauteList.querySelectorAll('.poule-item')].map(
            el => el.dataset.joueurId
        );
        const basseIds = [...basseList.querySelectorAll('.poule-item')].map(
            el => el.dataset.joueurId
        );

        this.pouleHaute = hauteIds.map(id => this.classement.find(j => j.id == id));
        this.pouleBasse = basseIds.map(id => this.classement.find(j => j.id == id));

        // MAJ titres
        document.querySelector('#poule-haute .poule-title').textContent = 
            `Poule Haute (${this.pouleHaute.length})`;
        document.querySelector('#poule-basse .poule-title').textContent = 
            `Poule Basse (${this.pouleBasse.length})`;
    }

    // ========================================
    // ACTIONS
    // ========================================

    /**
     * Exporte les poules en XLSX
     */
    async exporterPoules() {
        try {
            const wb = XLSX.utils.book_new();

            // Fonction pour formater les données d'une poule
            const formatPouleData = (poule) => poule.map((j, i) => ({
                'Sexe': j.genre || '',
                'Nom': j.nom || '',
                'Prénom': j.prenom || '',
                'Hebdo simple Classement': j.niveauSimple || '',
                'Hebdo double Classement': j.niveauDouble || '',
                'Hebdo mixte Classement': j.niveauMixte || '',
                'Rang': i + 1,
                'Victoires': j.victoires || 0,
                'Défaites': j.defaites || 0,
                'Points': j.pointsClassement || 0
            }));

            // Feuille poule haute
            const hauteData = formatPouleData(this.pouleHaute);
            const wsHaute = XLSX.utils.json_to_sheet(hauteData);
            XLSX.utils.book_append_sheet(wb, wsHaute, 'Poule Haute');

            // Feuille poule basse
            const basseData = formatPouleData(this.pouleBasse);
            const wsBasse = XLSX.utils.json_to_sheet(basseData);
            XLSX.utils.book_append_sheet(wb, wsBasse, 'Poule Basse');

            // Télécharger
            XLSX.writeFile(wb, `poules_${new Date().toISOString().slice(0,10)}.xlsx`);

            await Modal.alert({
                title: 'Export réussi',
                message: 'Le fichier Excel a été téléchargé.'
            });
        } catch (err) {
            console.error('Erreur export:', err);
            await Modal.alert({
                title: 'Erreur',
                message: 'Impossible d\'exporter: ' + err.message
            });
        }
    }

    /**
     * Sauvegarde en JSON
     */
    async sauvegarderJSON() {
        try {
            const state = await window.TournoiDB.exportState();
            state.poules = {
                haute: this.pouleHaute,
                basse: this.pouleBasse
            };

            const json = JSON.stringify(state, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `classement_${new Date().toISOString().slice(0,10)}.json`;
            a.click();

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
        }
    }

    /**
     * Nouveau tournoi
     */
    async nouveauTournoi() {
        const confirmed = await Modal.confirm({
            title: 'Nouveau tournoi ?',
            message: 'Les données du tournoi actuel seront effacées.',
            confirmText: 'Continuer',
            danger: true
        });

        if (confirmed) {
            // Réinitialiser les données d'affichage vidéoprojecteur
            localStorage.removeItem('affichage_data');
            
            await window.TournoiDB.resetAll();
            Router.navigate('/');
        }
    }
}

// Export
window.ClassementPage = ClassementPage;
