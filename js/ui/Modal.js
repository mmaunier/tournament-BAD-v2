/**
 * Modal.js - Système de gestion des modales
 */

const Modal = {
    activeModals: [],
    container: null,

    /**
     * Initialise le conteneur de modales
     */
    init() {
        if (this.container) return;

        this.container = UI.createElement('div', {
            id: 'modal-container',
            className: 'modal-container'
        });
        document.body.appendChild(this.container);

        // Fermer avec Echap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.length > 0) {
                const topModal = this.activeModals[this.activeModals.length - 1];
                if (topModal.closable !== false) {
                    this.close(topModal.id);
                }
            }
        });
    },

    /**
     * Affiche une modale
     * @param {Object} options - { id, title, content, actions, closable, size, onClose }
     * @returns {string} - ID de la modale
     */
    show(options = {}) {
        this.init();

        const id = options.id || `modal-${Date.now()}`;

        // Overlay
        const overlay = UI.createElement('div', {
            className: 'modal-overlay show',
            attributes: { 'data-modal-id': id },
            events: {
                click: (e) => {
                    if (e.target === overlay && options.closable !== false) {
                        this.close(id);
                    }
                }
            }
        });

        // Modal
        const modal = UI.createElement('div', {
            className: `modal ${options.size ? 'modal-' + options.size : ''}`.trim()
        });

        // Header
        const header = UI.createElement('div', { className: 'modal-header' });
        header.appendChild(UI.createElement('h3', {
            className: 'modal-title',
            text: options.title || ''
        }));

        if (options.closable !== false) {
            header.appendChild(UI.createElement('button', {
                className: 'modal-close',
                html: UI.icons.x,
                events: { click: () => this.close(id) }
            }));
        }

        modal.appendChild(header);

        // Body
        const body = UI.createElement('div', { className: 'modal-body' });
        if (typeof options.content === 'string') {
            body.innerHTML = options.content;
        } else if (options.content instanceof HTMLElement) {
            body.appendChild(options.content);
        }
        modal.appendChild(body);

        // Footer avec actions
        if (options.actions && options.actions.length > 0) {
            const footer = UI.createElement('div', { className: 'modal-footer' });
            options.actions.forEach(action => {
                const btn = UI.button({
                    text: action.text,
                    icon: action.icon,
                    variant: action.variant || 'outline',
                    onClick: async () => {
                        if (action.onClick) {
                            const result = await action.onClick();
                            if (result !== false && action.closeOnClick !== false) {
                                this.close(id);
                            }
                        } else {
                            this.close(id);
                        }
                    }
                });
                footer.appendChild(btn);
            });
            modal.appendChild(footer);
        }

        overlay.appendChild(modal);
        this.container.appendChild(overlay);

        // Stocker la modale
        this.activeModals.push({
            id,
            overlay,
            closable: options.closable,
            onClose: options.onClose
        });

        // Animation d'entrée
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            // Callback onOpen après l'animation
            if (options.onOpen) {
                options.onOpen();
            }
        });

        return id;
    },

    /**
     * Ferme une modale
     * @param {string} id - ID de la modale
     */
    close(id) {
        const index = this.activeModals.findIndex(m => m.id === id);
        if (index === -1) return;

        const modalData = this.activeModals[index];
        modalData.overlay.classList.remove('show');

        setTimeout(() => {
            modalData.overlay.remove();
            if (modalData.onClose) modalData.onClose();
        }, 200);

        this.activeModals.splice(index, 1);
    },

    /**
     * Ferme toutes les modales
     */
    closeAll() {
        [...this.activeModals].forEach(m => this.close(m.id));
    },

    /**
     * Modale de confirmation
     * @param {Object} options - { title, message, confirmText, cancelText, onConfirm }
     * @returns {Promise<boolean>}
     */
    confirm(options = {}) {
        return new Promise((resolve) => {
            this.show({
                title: options.title || 'Confirmation',
                content: UI.createElement('p', { text: options.message || 'Êtes-vous sûr ?' }),
                closable: true,
                actions: [
                    {
                        text: options.cancelText || 'Annuler',
                        variant: 'outline',
                        onClick: () => {
                            resolve(false);
                            return true;
                        }
                    },
                    {
                        text: options.confirmText || 'Confirmer',
                        variant: options.danger ? 'danger' : 'primary',
                        onClick: () => {
                            resolve(true);
                            return true;
                        }
                    }
                ],
                onClose: () => resolve(false)
            });
        });
    },

    /**
     * Modale d'alerte
     * @param {Object} options - { title, message }
     * @returns {Promise<void>}
     */
    alert(options = {}) {
        return new Promise((resolve) => {
            this.show({
                title: options.title || 'Information',
                content: UI.createElement('p', { text: options.message || '' }),
                closable: true,
                actions: [
                    {
                        text: 'OK',
                        variant: 'primary',
                        onClick: () => {
                            resolve();
                            return true;
                        }
                    }
                ],
                onClose: () => resolve(),
                onOpen: () => {
                    // Focus sur le bouton OK et écouter Entrée
                    const okBtn = document.querySelector('.modal-footer .btn-primary');
                    if (okBtn) {
                        okBtn.focus();
                        const handleEnter = (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                okBtn.click();
                                document.removeEventListener('keydown', handleEnter);
                            }
                        };
                        document.addEventListener('keydown', handleEnter);
                    }
                }
            });
        });
    },

    /**
     * Modale de sélection de joueurs
     * @param {Array} joueurs - Liste des joueurs disponibles
     * @param {Object} options - { title, selected, multiple }
     * @returns {Promise<Array|Object|null>}
     */
    selectJoueurs(joueurs, options = {}) {
        return new Promise((resolve) => {
            const selected = new Set(options.selected || []);

            const content = UI.createElement('div', { className: 'joueurs-select-grid' });

            joueurs.forEach(joueur => {
                const tag = UI.joueurTag(joueur, {
                    onClick: () => {
                        if (options.multiple) {
                            if (selected.has(joueur.id)) {
                                selected.delete(joueur.id);
                                tag.classList.remove('selected');
                            } else {
                                selected.add(joueur.id);
                                tag.classList.add('selected');
                            }
                        } else {
                            resolve(joueur);
                            this.closeAll();
                        }
                    }
                });
                if (selected.has(joueur.id)) {
                    tag.classList.add('selected');
                }
                content.appendChild(tag);
            });

            if (joueurs.length === 0) {
                content.appendChild(UI.emptyState({
                    icon: 'users',
                    title: 'Aucun joueur',
                    text: 'Importez des joueurs depuis la base de données'
                }));
            }

            this.show({
                title: options.title || 'Sélectionner des joueurs',
                content: content,
                size: 'lg',
                closable: true,
                actions: options.multiple ? [
                    {
                        text: 'Annuler',
                        variant: 'outline',
                        onClick: () => {
                            resolve(null);
                            return true;
                        }
                    },
                    {
                        text: 'Valider',
                        variant: 'primary',
                        icon: 'check',
                        onClick: () => {
                            const selectedJoueurs = joueurs.filter(j => selected.has(j.id));
                            resolve(selectedJoueurs);
                            return true;
                        }
                    }
                ] : [],
                onClose: () => resolve(null)
            });
        });
    },

    /**
     * Modale de sélection pour retrait de joueurs
     * Les joueurs sélectionnés apparaissent en rouge/barré
     * @param {Array} joueurs - Liste des joueurs disponibles
     * @param {Object} options - { title, subtitle }
     * @returns {Promise<Array|null>}
     */
    selectJoueursRetrait(joueurs, options = {}) {
        return new Promise((resolve) => {
            const selected = new Set();

            const content = UI.createElement('div', { className: 'joueurs-retrait-modal' });
            
            // Sous-titre
            if (options.subtitle) {
                content.appendChild(UI.createElement('p', {
                    className: 'modal-subtitle',
                    text: options.subtitle
                }));
            }

            const grid = UI.createElement('div', { className: 'joueurs-select-grid' });

            joueurs.forEach(joueur => {
                const tag = UI.joueurTag(joueur, {
                    onClick: () => {
                        if (selected.has(joueur.id)) {
                            selected.delete(joueur.id);
                            tag.classList.remove('retired');
                        } else {
                            selected.add(joueur.id);
                            tag.classList.add('retired');
                        }
                        // Mettre à jour le bouton valider
                        updateValidateBtn();
                    }
                });
                grid.appendChild(tag);
            });
            
            content.appendChild(grid);

            let validateBtn = null;
            const updateValidateBtn = () => {
                if (validateBtn) {
                    validateBtn.textContent = selected.size > 0 
                        ? `Retirer ${selected.size} joueur${selected.size > 1 ? 's' : ''}`
                        : 'Sélectionnez des joueurs';
                    validateBtn.disabled = selected.size === 0;
                }
            };

            this.show({
                title: options.title || 'Retirer des joueurs',
                content: content,
                size: 'lg',
                closable: true,
                actions: [
                    {
                        text: 'Annuler',
                        variant: 'outline',
                        onClick: () => {
                            resolve(null);
                            return true;
                        }
                    },
                    {
                        text: 'Sélectionnez des joueurs',
                        variant: 'danger',
                        icon: 'x',
                        onClick: () => {
                            if (selected.size === 0) return false; // Ne pas fermer
                            const selectedJoueurs = joueurs.filter(j => selected.has(j.id));
                            resolve(selectedJoueurs);
                            return true;
                        }
                    }
                ],
                onClose: () => resolve(null),
                onOpen: () => {
                    // Récupérer le bouton valider pour le mettre à jour
                    validateBtn = this.container.querySelector('.modal-footer .btn-danger');
                    updateValidateBtn();
                }
            });
        });
    },

    /**
     * Modale de saisie de score
     * @param {Object} match - Les données du match
     * @param {Object} scoresInitiaux - Scores initiaux basés sur les handicaps { equipe1: number, equipe2: number }
     * @returns {Promise<Object|null>}
     */
    editScore(match, scoresInitiaux = { equipe1: 0, equipe2: 0 }) {
        return new Promise((resolve) => {
            const content = UI.createElement('div', { className: 'score-edit' });

            // Utiliser le score existant ou le score initial (handicap)
            const score1Default = match.score1 !== undefined ? match.score1 : scoresInitiaux.equipe1;
            const score2Default = match.score2 !== undefined ? match.score2 : scoresInitiaux.equipe2;

            // Équipe 1
            const team1 = UI.createElement('div', { className: 'score-team' });
            team1.appendChild(UI.createElement('div', {
                className: 'score-team-names',
                text: match.equipe1.map(j => j.prenom || j.nom).join(' & ')
            }));
            const score1Input = UI.createElement('input', {
                className: 'score-input',
                attributes: { type: 'number', min: '0', max: '30', value: score1Default.toString() }
            });
            team1.appendChild(score1Input);

            // VS
            const vs = UI.createElement('div', { className: 'score-vs', text: 'VS' });

            // Équipe 2
            const team2 = UI.createElement('div', { className: 'score-team' });
            team2.appendChild(UI.createElement('div', {
                className: 'score-team-names',
                text: match.equipe2.map(j => j.prenom || j.nom).join(' & ')
            }));
            const score2Input = UI.createElement('input', {
                className: 'score-input',
                attributes: { type: 'number', min: '0', max: '30', value: score2Default.toString() }
            });
            team2.appendChild(score2Input);

            content.appendChild(team1);
            content.appendChild(vs);
            content.appendChild(team2);

            // Boutons rapides 21-X
            const quickScores = UI.createElement('div', { className: 'quick-scores' });
            [
                { s1: 21, s2: 0 }, { s1: 21, s2: 15 }, { s1: 21, s2: 19 },
                { s1: 0, s2: 21 }, { s1: 15, s2: 21 }, { s1: 19, s2: 21 }
            ].forEach(({ s1, s2 }) => {
                quickScores.appendChild(UI.button({
                    text: `${s1}-${s2}`,
                    variant: 'outline',
                    size: 'sm',
                    onClick: () => {
                        score1Input.value = s1;
                        score2Input.value = s2;
                    }
                }));
            });
            content.appendChild(quickScores);

            // Handler pour validation avec Entrée
            const validateAndClose = () => {
                resolve({
                    score1: parseInt(score1Input.value) || 0,
                    score2: parseInt(score2Input.value) || 0
                });
                this.closeAll();
            };

            const handleKeyDown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    validateAndClose();
                }
            };

            score1Input.addEventListener('keydown', handleKeyDown);
            score2Input.addEventListener('keydown', handleKeyDown);

            this.show({
                title: `Terrain ${match.terrain || '?'}`,
                content: content,
                closable: true,
                actions: [
                    {
                        text: 'Annuler',
                        variant: 'outline',
                        onClick: () => {
                            resolve(null);
                            return true;
                        }
                    },
                    {
                        text: 'Valider',
                        variant: 'primary',
                        icon: 'check',
                        onClick: () => {
                            resolve({
                                score1: parseInt(score1Input.value) || 0,
                                score2: parseInt(score2Input.value) || 0
                            });
                            return true;
                        }
                    }
                ],
                onClose: () => resolve(null),
                onOpen: () => {
                    setTimeout(() => {
                        score1Input.focus();
                        score1Input.select();
                    }, 50);
                }
            });
        });
    }
};

// Export
window.Modal = Modal;
