/**
 * app.js - Point d'entrée de l'application
 * Initialise le router, les pages et les événements
 */

// Configuration globale
const APP_CONFIG = {
    version: '2.0.0',
    dbName: 'TournoiBadminton',
    dbVersion: 1
};

// Instance des pages
let accueilPage, tournoiPage, classementPage, affichagePage;

/**
 * Initialisation de l'application
 */
async function initApp() {
    console.log(`🏸 Tournoi Badminton v${APP_CONFIG.version}`);

    try {
        // Initialiser la base de données
        await window.TournoiDB.init();
        console.log('✓ Base de données initialisée');

        // Créer les instances des pages
        accueilPage = new AccueilPage();
        tournoiPage = new TournoiPage();
        classementPage = new ClassementPage();
        affichagePage = new AffichagePage();

        // Configurer le router
        setupRouter();
        console.log('✓ Router configuré');

        // Écouter les événements
        setupEventListeners();
        console.log('✓ Événements configurés');

        // Vérifier le hash dans l'URL (pour /affichage notamment)
        const hash = window.location.hash.replace('#', '') || '/';
        
        // Si c'est la page d'affichage, y aller directement
        if (hash === '/affichage') {
            Router.navigate('/affichage');
        } else {
            // Sinon, vérifier s'il y a un tournoi en cours
            const tournoi = await window.TournoiDB.getTournoi();
            if (tournoi && tournoi.status === 'EN_COURS') {
                Router.navigate('/tournoi');
            } else if (tournoi && tournoi.status === 'TERMINE') {
                Router.navigate('/classement');
            } else {
                Router.navigate('/');
            }
        }

        console.log('✓ Application prête');

    } catch (error) {
        console.error('Erreur initialisation:', error);
        showErrorState(error);
    }
}

/**
 * Configure le router
 */
function setupRouter() {
    const container = document.getElementById('app');

    Router.register('/', () => accueilPage.render(container));
    Router.register('/tournoi', () => tournoiPage.render(container));
    Router.register('/classement', () => classementPage.render(container));
    Router.register('/affichage', () => affichagePage.render(container));

    // Route 404
    Router.register('*', () => {
        container.innerHTML = '';
        container.appendChild(UI.emptyState({
            icon: 'info',
            title: 'Page non trouvée',
            text: 'Cette page n\'existe pas.',
            action: UI.button({
                text: 'Retour à l\'accueil',
                variant: 'primary',
                onClick: () => Router.navigate('/')
            })
        }));
    });
}

/**
 * Configure les événements globaux
 */
function setupEventListeners() {
    // Écouter les changements de tournoi
    EventBus.on('tournoi:updated', async () => {
        console.log('Tournoi mis à jour');
    });

    EventBus.on('tour:validated', async (tourIndex) => {
        console.log(`Tour ${tourIndex + 1} validé`);
    });

    EventBus.on('joueur:removed', async (joueurId) => {
        console.log(`Joueur ${joueurId} retiré`);
    });

    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        // Ctrl+S pour sauvegarder
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            EventBus.emit('save:requested');
        }
    });

    // Service Worker pour mode hors-ligne (si supporté)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/v2/sw.js').catch(() => {
            console.log('Service Worker non disponible');
        });
    }

    // Prévenir la perte de données
    window.addEventListener('beforeunload', (e) => {
        // Si tournoi en cours, avertir
        const tournoi = window.TournoiDB.cache?.tournoi;
        if (tournoi && tournoi.status === 'EN_COURS') {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

/**
 * Affiche un état d'erreur
 */
function showErrorState(error) {
    const container = document.getElementById('app');
    container.innerHTML = '';
    container.appendChild(UI.emptyState({
        icon: 'info',
        title: 'Erreur de chargement',
        text: error.message || 'Une erreur est survenue.',
        action: UI.button({
            text: 'Réessayer',
            variant: 'primary',
            onClick: () => location.reload()
        })
    }));
}

// Démarrer l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', initApp);

// Export pour debug
window.App = {
    config: APP_CONFIG,
    Router,
    EventBus,
    TournoiDB,
    UI,
    Modal
};
