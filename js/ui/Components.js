/**
 * Components.js - Composants UI réutilisables
 * Factory functions pour créer des éléments HTML
 */

const UI = {
    /**
     * Crée un élément HTML
     * @param {string} tag - Tag HTML
     * @param {Object} options - { className, id, attributes, text, html, children, events }
     * @returns {HTMLElement}
     */
    createElement(tag, options = {}) {
        const el = document.createElement(tag);

        if (options.className) {
            el.className = options.className;
        }

        if (options.id) {
            el.id = options.id;
        }

        if (options.attributes) {
            for (const [key, value] of Object.entries(options.attributes)) {
                el.setAttribute(key, value);
            }
        }

        if (options.text) {
            el.textContent = options.text;
        }

        if (options.html) {
            el.innerHTML = options.html;
        }

        if (options.children) {
            options.children.forEach(child => {
                if (child) el.appendChild(child);
            });
        }

        if (options.events) {
            for (const [event, handler] of Object.entries(options.events)) {
                el.addEventListener(event, handler);
            }
        }

        if (options.style) {
            Object.assign(el.style, options.style);
        }

        return el;
    },

    // ========================================
    // ICÔNES SVG
    // ========================================
    
    icons: {
        users: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        settings: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>`,
        play: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        x: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        plus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        minus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        trash: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
        upload: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
        download: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
        menu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
        info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        trophy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
        refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
        flag: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
        chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
        arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
        grip: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,
        userMinus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`
    },

    /**
     * Crée une icône SVG
     * @param {string} name - Nom de l'icône
     * @param {string} className - Classe CSS additionnelle
     * @returns {HTMLElement}
     */
    icon(name, className = '') {
        const wrapper = this.createElement('span', {
            className: `icon ${className}`.trim(),
            html: this.icons[name] || ''
        });
        return wrapper;
    },

    // ========================================
    // COMPOSANTS
    // ========================================

    /**
     * Crée un bouton
     * @param {Object} options - { text, icon, variant, size, onClick, disabled }
     * @returns {HTMLElement}
     */
    button(options = {}) {
        const btn = this.createElement('button', {
            className: `btn ${options.variant ? 'btn-' + options.variant : 'btn-primary'} ${options.size ? 'btn-' + options.size : ''} ${options.className || ''}`.trim(),
            attributes: options.disabled ? { disabled: 'disabled' } : {},
            events: options.onClick ? { click: options.onClick } : {}
        });

        if (options.icon) {
            btn.appendChild(this.icon(options.icon, 'btn-icon'));
        }

        if (options.text) {
            btn.appendChild(document.createTextNode(options.text));
        }

        return btn;
    },

    /**
     * Crée un champ de saisie
     * @param {Object} options - { type, name, value, placeholder, label, onChange }
     * @returns {HTMLElement}
     */
    input(options = {}) {
        const wrapper = this.createElement('div', { className: 'form-group' });

        if (options.label) {
            wrapper.appendChild(this.createElement('label', {
                className: 'form-label',
                text: options.label,
                attributes: options.name ? { for: options.name } : {}
            }));
        }

        const input = this.createElement('input', {
            className: 'form-input form-select',
            attributes: {
                type: options.type || 'text',
                name: options.name || '',
                value: options.value || '',
                placeholder: options.placeholder || ''
            },
            events: options.onChange ? { change: options.onChange, input: options.onChange } : {}
        });

        wrapper.appendChild(input);
        return wrapper;
    },

    /**
     * Crée un select
     * @param {Object} options - { name, value, options: [{value, label}], label, onChange }
     * @returns {HTMLElement}
     */
    select(options = {}) {
        const wrapper = this.createElement('div', { className: 'form-group' });

        if (options.label) {
            wrapper.appendChild(this.createElement('label', {
                className: 'form-label',
                text: options.label
            }));
        }

        const select = this.createElement('select', {
            className: 'form-input form-select',
            attributes: { name: options.name || '' },
            events: options.onChange ? { change: options.onChange } : {}
        });

        (options.options || []).forEach(opt => {
            const optEl = this.createElement('option', {
                text: opt.label,
                attributes: { value: opt.value }
            });
            if (opt.value === options.value) {
                optEl.selected = true;
            }
            select.appendChild(optEl);
        });

        wrapper.appendChild(select);
        return wrapper;
    },

    /**
     * Crée un number spinner
     * @param {Object} options - { value, min, max, step, onChange }
     * @returns {HTMLElement}
     */
    numberSpinner(options = {}) {
        const value = options.value || 0;
        const min = options.min ?? 0;
        const max = options.max ?? 100;
        const step = options.step || 1;

        const wrapper = this.createElement('div', { className: 'number-spinner' });

        const minusBtn = this.createElement('button', {
            className: 'number-spinner-btn',
            html: this.icons.minus,
            events: {
                click: () => {
                    const current = parseInt(input.value);
                    if (current > min) {
                        input.value = current - step;
                        if (options.onChange) options.onChange(parseInt(input.value));
                    }
                }
            }
        });

        const input = this.createElement('input', {
            className: 'number-spinner-value',
            attributes: {
                type: 'number',
                value: value,
                min: min,
                max: max,
                step: step
            },
            events: {
                change: (e) => {
                    if (options.onChange) options.onChange(parseInt(e.target.value));
                }
            }
        });

        const plusBtn = this.createElement('button', {
            className: 'number-spinner-btn',
            html: this.icons.plus,
            events: {
                click: () => {
                    const current = parseInt(input.value);
                    if (current < max) {
                        input.value = current + step;
                        if (options.onChange) options.onChange(parseInt(input.value));
                    }
                }
            }
        });

        wrapper.appendChild(minusBtn);
        wrapper.appendChild(input);
        wrapper.appendChild(plusBtn);

        return wrapper;
    },

    /**
     * Crée un tag joueur
     * @param {Object} joueur - { id, nom, prenom, genre }
     * @param {Object} options - { removable, onClick, onRemove }
     * @returns {HTMLElement}
    */
    joueurTag(joueur, options = {}) {
        // Déterminer si le joueur est retiré (via option ou propriété du joueur)
        const isRetired = options.retired || joueur.retired;
        
        const tag = this.createElement('div', {
            className: `joueur-tag ${joueur.genre === 'F' ? 'femme' : 'homme'} ${options.removable ? 'with-remove' : ''} ${isRetired ? 'retired' : ''}`.trim(),
            attributes: { 'data-id': joueur.id },
            events: options.onClick ? { click: () => options.onClick(joueur) } : {}
        });

        // Prénom sur une ligne
        if (joueur.prenom) {
            tag.appendChild(this.createElement('span', { 
                className: 'joueur-tag-prenom',
                text: joueur.prenom 
            }));
        }
        
        // Nom sur une ligne
        tag.appendChild(this.createElement('span', { 
            className: 'joueur-tag-nom',
            text: joueur.nom || '' 
        }));

        // Badge niveau (classement Double)
        const niveau = joueur.niveauDouble || joueur.niveau || null;
        if (niveau) {
            const niveauClass = this.getNiveauClass(niveau);
            tag.appendChild(this.createElement('span', {
                className: `joueur-tag-niveau ${niveauClass}`,
                text: niveau
            }));
        }
        
        // Icône retiré (croix)
        if (isRetired) {
            tag.appendChild(this.createElement('span', {
                className: 'joueur-tag-retired-icon',
                html: this.icons.x
            }));
        }

        // Bouton supprimer
        if (options.removable) {
            const removeBtn = this.createElement('span', {
                className: 'joueur-tag-remove',
                html: this.icons.x,
                events: {
                    click: (e) => {
                        e.stopPropagation();
                        if (options.onRemove) options.onRemove(joueur);
                    }
                }
            });
            tag.appendChild(removeBtn);
        }

        return tag;
    },

    /**
     * Retourne la classe CSS pour le niveau
     * @param {string} niveau - Niveau du joueur (NC, D9, D8, etc.)
     * @returns {string}
     */
    getNiveauClass(niveau) {
        if (!niveau || niveau === '') return 'nc';
        // Convertir en string si c'est un nombre ou autre
        const str = String(niveau).toUpperCase().trim();
        if (str === 'NC' || str === 'NON CLASSÉ' || str === '0') return 'nc';
        // Retourne directement le niveau en minuscules (d9, d8, r6, n1, p10, etc.)
        return str.toLowerCase();
    },

    /**
     * Crée une section/bandeau
     * @param {Object} options - { title, icon, actions, body }
     * @returns {HTMLElement}
     */
    section(options = {}) {
        const section = this.createElement('section', { className: 'section' });

        // Header
        const header = this.createElement('div', { className: 'section-header' });
        
        const titleEl = this.createElement('h2', { className: 'section-title' });
        if (options.icon) {
            titleEl.appendChild(this.icon(options.icon, 'section-title-icon'));
        }
        titleEl.appendChild(document.createTextNode(options.title || ''));
        header.appendChild(titleEl);

        if (options.actions) {
            const actionsEl = this.createElement('div', { className: 'section-actions' });
            options.actions.forEach(action => actionsEl.appendChild(action));
            header.appendChild(actionsEl);
        }

        section.appendChild(header);

        // Body
        if (options.body) {
            const body = this.createElement('div', { 
                className: `section-body ${options.bodyClass || ''}`.trim() 
            });
            if (typeof options.body === 'string') {
                body.innerHTML = options.body;
            } else if (options.body instanceof HTMLElement) {
                body.appendChild(options.body);
            }
            section.appendChild(body);
        }

        return section;
    },

    /**
     * Crée un état vide
     * @param {Object} options - { icon, title, text, action }
     * @returns {HTMLElement}
     */
    emptyState(options = {}) {
        const el = this.createElement('div', { className: 'empty-state' });

        if (options.icon) {
            el.appendChild(this.icon(options.icon, 'empty-state-icon icon-xl'));
        }

        if (options.title) {
            el.appendChild(this.createElement('div', {
                className: 'empty-state-title',
                text: options.title
            }));
        }

        if (options.text) {
            el.appendChild(this.createElement('div', {
                className: 'empty-state-text',
                text: options.text
            }));
        }

        if (options.action) {
            el.appendChild(options.action);
        }

        return el;
    }
};

// Export
window.UI = UI;
