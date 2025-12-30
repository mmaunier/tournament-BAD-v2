/**
 * Timer.js - Gestionnaire de compte à rebours
 * Timer configurable avec sons et callbacks
 */

class Timer {
    constructor(options = {}) {
        // Durée par défaut : 8 minutes
        this.defaultDuration = options.duration || 8 * 60;
        this.duration = this.defaultDuration;
        this.remaining = this.duration;
        this.interval = null;
        this.state = 'stopped'; // 'stopped', 'running', 'paused'
        
        // Callbacks
        this.onTick = options.onTick || (() => {});
        this.onComplete = options.onComplete || (() => {});
        this.onStateChange = options.onStateChange || (() => {});
        
        // Audio
        this.buzzerSound = null;
        this.initAudio(options.soundPath || 'assets/sons/buzzer.wav');
    }

    /**
     * Initialise l'audio
     */
    initAudio(soundPath) {
        try {
            this.buzzerSound = new Audio(soundPath);
            this.buzzerSound.volume = 1.0;
            // Précharger le son
            this.buzzerSound.load();
        } catch (e) {
            console.warn('Timer: Impossible de charger le son', e);
        }
    }

    /**
     * Démarre ou reprend le timer
     */
    play() {
        if (this.state === 'running') return;
        
        if (this.state === 'stopped') {
            this.remaining = this.duration;
        }
        
        this.state = 'running';
        this.onStateChange(this.state);
        this.onTick(this.remaining);
        
        this.interval = setInterval(() => {
            this.remaining--;
            this.onTick(this.remaining);
            
            if (this.remaining <= 0) {
                this.complete();
            }
        }, 1000);
    }

    /**
     * Met en pause le timer
     */
    pause() {
        if (this.state !== 'running') return;
        
        clearInterval(this.interval);
        this.interval = null;
        this.state = 'paused';
        this.onStateChange(this.state);
    }

    /**
     * Bascule entre play et pause
     */
    togglePlayPause() {
        if (this.state === 'running') {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Arrête et remet à zéro le timer
     */
    stop() {
        clearInterval(this.interval);
        this.interval = null;
        this.remaining = this.duration;
        this.state = 'stopped';
        this.onStateChange(this.state);
        this.onTick(this.remaining);
    }

    /**
     * Timer terminé
     */
    complete() {
        clearInterval(this.interval);
        this.interval = null;
        this.remaining = 0;
        this.state = 'stopped';
        this.onStateChange(this.state);
        this.onTick(0);
        
        // Jouer le buzzer
        this.playBuzzer();
        
        // Callback de fin
        this.onComplete();
    }

    /**
     * Joue le son du buzzer
     */
    playBuzzer() {
        if (!this.buzzerSound) return;
        
        try {
            // Remettre au début si déjà en lecture
            this.buzzerSound.currentTime = 0;
            this.buzzerSound.volume = 1.0;
            
            // Jouer le son
            const playPromise = this.buzzerSound.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.warn('Timer: Lecture audio bloquée', e);
                });
            }
        } catch (e) {
            console.warn('Timer: Erreur lecture audio', e);
        }
    }

    /**
     * Définit la durée du timer
     * @param {number} seconds - Durée en secondes
     */
    setDuration(seconds) {
        this.duration = seconds;
        this.defaultDuration = seconds;
        if (this.state === 'stopped') {
            this.remaining = seconds;
            this.onTick(this.remaining);
        }
    }

    /**
     * Parse une durée au format "8m", "40s", "8m30s", etc.
     * @param {string} str - Chaîne de durée
     * @returns {number} - Durée en secondes
     */
    static parseDuration(str) {
        if (!str) return 0;
        
        let seconds = 0;
        const minMatch = str.match(/(\d+)\s*m/i);
        const secMatch = str.match(/(\d+)\s*s/i);
        
        if (minMatch) {
            seconds += parseInt(minMatch[1], 10) * 60;
        }
        if (secMatch) {
            seconds += parseInt(secMatch[1], 10);
        }
        
        // Si juste un nombre, considérer comme minutes
        if (!minMatch && !secMatch) {
            const num = parseInt(str, 10);
            if (!isNaN(num)) {
                seconds = num * 60;
            }
        }
        
        return seconds;
    }

    /**
     * Formate le temps en mm:ss
     * @param {number} seconds - Temps en secondes
     * @returns {string} - Format mm:ss
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Retourne l'état actuel
     */
    getState() {
        return this.state;
    }

    /**
     * Retourne le temps restant
     */
    getRemaining() {
        return this.remaining;
    }

    /**
     * Retourne la durée configurée
     */
    getDuration() {
        return this.duration;
    }

    /**
     * Nettoie le timer
     */
    destroy() {
        this.stop();
        this.buzzerSound = null;
    }
}

// Export global
window.Timer = Timer;
