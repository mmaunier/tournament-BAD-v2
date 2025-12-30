/**
 * Router.js - Gestion de la navigation entre les pages
 * Système de routing simple pour SPA
 */

const Router = {
    currentRoute: null,
    routes: {},
    container: null,

    /**
     * Enregistre une route
     * @param {string} path - Chemin de la route ('/', '/tournoi', etc.)
     * @param {Function} handler - Fonction à exécuter
     */
    register(path, handler) {
        this.routes[path] = handler;
    },

    /**
     * Navigue vers une route
     * @param {string} path - Chemin de la route
     * @param {boolean} pushState - Ajouter à l'historique
     */
    async navigate(path, pushState = true) {
        // Obtenir le container
        if (!this.container) {
            this.container = document.getElementById('app');
        }

        if (!this.container) {
            console.error('Container #app non trouvé');
            return;
        }

        // Trouver le handler
        let handler = this.routes[path];
        
        // Fallback vers route 404 si non trouvé
        if (!handler && this.routes['*']) {
            handler = this.routes['*'];
        }

        if (!handler) {
            console.error(`Route "${path}" non trouvée`);
            return;
        }

        // Mettre à jour l'état
        this.currentRoute = path;

        // Ajouter à l'historique
        if (pushState) {
            history.pushState({ path }, '', `#${path}`);
        }

        // Exécuter le handler
        try {
            await handler();
        } catch (error) {
            console.error('Erreur navigation:', error);
            this.container.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
        }

        // Émettre l'événement de navigation
        EventBus.emit('router:navigate', { path });
    },

    /**
     * Retour en arrière
     */
    back() {
        history.back();
    },

    /**
     * Récupère la route actuelle
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
};

// Écouter les changements d'URL (back/forward)
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.path) {
        Router.navigate(e.state.path, false);
    }
});

// Export
window.Router = Router;
