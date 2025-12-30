/**
 * Database.js - Gestionnaire de base de données IndexedDB
 * Permet de stocker les données du tournoi de manière persistante
 * et de gérer plusieurs instances sans conflits
 */

class Database {
    constructor(dbName = 'TournoiBadminton') {
        this.dbName = dbName;
        this.dbVersion = 1;
        this.db = null;
    }

    /**
     * Ouvre la connexion à la base de données
     * @returns {Promise<IDBDatabase>}
     */
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Erreur ouverture base de données'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    /**
     * Crée les object stores nécessaires
     * @param {IDBDatabase} db 
     */
    createStores(db) {
        // Store pour les joueurs
        if (!db.objectStoreNames.contains('joueurs')) {
            const joueurStore = db.createObjectStore('joueurs', { keyPath: 'id', autoIncrement: true });
            joueurStore.createIndex('nom', 'nom', { unique: false });
            joueurStore.createIndex('selected', 'selected', { unique: false });
        }

        // Store pour le tournoi
        if (!db.objectStoreNames.contains('tournoi')) {
            db.createObjectStore('tournoi', { keyPath: 'id' });
        }

        // Store pour les tours
        if (!db.objectStoreNames.contains('tours')) {
            const tourStore = db.createObjectStore('tours', { keyPath: 'id', autoIncrement: true });
            tourStore.createIndex('numero', 'numero', { unique: true });
        }

        // Store pour les matchs
        if (!db.objectStoreNames.contains('matchs')) {
            const matchStore = db.createObjectStore('matchs', { keyPath: 'id', autoIncrement: true });
            matchStore.createIndex('tourId', 'tourId', { unique: false });
        }

        // Store pour la configuration
        if (!db.objectStoreNames.contains('config')) {
            db.createObjectStore('config', { keyPath: 'key' });
        }
    }

    /**
     * Ajoute ou met à jour un élément
     * @param {string} storeName 
     * @param {Object} data 
     * @returns {Promise<number>} ID de l'élément
     */
    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Récupère un élément par sa clé
     * @param {string} storeName 
     * @param {*} key 
     * @returns {Promise<Object>}
     */
    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Récupère tous les éléments d'un store
     * @param {string} storeName 
     * @returns {Promise<Array>}
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Récupère des éléments par index
     * @param {string} storeName 
     * @param {string} indexName 
     * @param {*} value 
     * @returns {Promise<Array>}
     */
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Supprime un élément
     * @param {string} storeName 
     * @param {*} key 
     * @returns {Promise<void>}
     */
    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Vide un store
     * @param {string} storeName 
     * @returns {Promise<void>}
     */
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Vide toute la base de données
     * @returns {Promise<void>}
     */
    async clearAll() {
        const stores = ['joueurs', 'tournoi', 'tours', 'matchs', 'config'];
        for (const store of stores) {
            await this.clear(store);
        }
    }

    /**
     * Ferme la connexion
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Export pour utilisation globale
window.Database = Database;
