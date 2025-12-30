/**
 * EventBus.js - Système d'événements pour la communication entre modules
 * Pattern Pub/Sub pour découpler les composants
 */

const EventBus = {
    events: {},

    /**
     * S'abonne à un événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à appeler
     * @returns {Function} - Fonction pour se désabonner
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);

        // Retourne une fonction pour se désabonner
        return () => this.off(event, callback);
    },

    /**
     * S'abonne à un événement une seule fois
     * @param {string} event 
     * @param {Function} callback 
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    },

    /**
     * Se désabonne d'un événement
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    },

    /**
     * Émet un événement
     * @param {string} event 
     * @param {*} data 
     */
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Erreur dans le handler de l'événement ${event}:`, error);
            }
        });
    },

    /**
     * Supprime tous les abonnements à un événement
     * @param {string} event 
     */
    clear(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    },

    /**
     * Debug: affiche tous les événements enregistrés
     */
    debug() {
        console.log('EventBus - Événements enregistrés:');
        for (const [event, callbacks] of Object.entries(this.events)) {
            console.log(`  ${event}: ${callbacks.length} handler(s)`);
        }
    }
};

// Export
window.EventBus = EventBus;
