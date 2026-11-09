/**
 * Cosmic Audio Synthesizer - Safe Web Audio API
 * Never throws unhandled errors, gracefully waits for first user gesture.
 */
class CosmicAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.musicEnabled = true;
        this.engineOsc = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.isEngineRunning = false;
        this.musicInterval = null;

        const savedSound = localStorage.getItem('cosmic_sound');
        if (savedSound !== null) this.enabled = (savedSound === 'true');
        const savedMusic = localStorage.getItem('cosmic_music');
        if (savedMusic !== null) this.musicEnabled = (savedMusic === 'true');
    }

    init() {
        try {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        } catch (e) {}
    }

    toggleSound() {
        this.enabled = !this.enabled;
        localStorage.setItem('cosmic_sound', this.enabled);
        if (!this.enabled && this.engineGain && this.ctx) {
            try { this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime); } catch (e) {}
        }
        return this.enabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('cosmic_music', this.musicEnabled);
        if (!this.musicEnabled) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.musicEnabled;
    }

    startEngine() {
        if (!this.enabled || this.isEngineRunning) return;
        this.init();
        if (!this.ctx) return;

        try {
            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

            this.engineFilter = this.ctx.createBiquadFilter();
            this.engineFilter.type = 'lowpass';
            this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

            this.engineOsc.connect(this.engineFilter);
            this.engineFilter.connect(this.engineGain);
            this.engineGain.connect(this.ctx.destination);

            this.engineOsc.start();
            this.isEngineRunning = true;
        } catch (e) {}
    }

    updateEngine(speedRatio, isBoosting) {
        if (!this.ctx || !this.isEngineRunning || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            const targetFreq = 55 + (speedRatio * 180) + (isBoosting ? 80 : 0);
            this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);

            const targetFilter = 250 + (speedRatio * 800) + (isBoosting ? 500 : 0);
            this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.05);

            const targetVol = isBoosting ? 0.15 : (0.04 + speedRatio * 0.06);
            this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
        } catch (e) {}
    }

    stopEngine() {
        if (this.engineOsc) {
            try {
                this.engineOsc.stop();
                this.engineOsc.disconnect();
            } catch (e) {}
            this.isEngineRunning = false;
        }
    }

    playBoost() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) {}
    }

    playCrash() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {}
    }

    playCheckpoint(isFinalLap = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const notes = isFinalLap ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880.0];

            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);

                gain.gain.setValueAtTime(0.15, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.27);
            });
        } catch (e) {}
    }

    playSpeedPad() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.2);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {}
    }

    playCountdown(isGo = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.5 : 0.2));

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + (isGo ? 0.5 : 0.2));
        } catch (e) {}
    }

    startMusic() {
        if (!this.musicEnabled || this.musicInterval) return;
        this.init();
        if (!this.ctx) return;

        const scale = [130.81, 146.83, 155.56, 174.61, 196.00, 220.00, 233.08];
        let step = 0;

        this.musicInterval = setInterval(() => {
            if (!this.ctx || !this.musicEnabled) return;
            try {
                const now = this.ctx.currentTime;
                const bassNote = (step % 4 === 0) ? scale[0] / 2 : (step % 4 === 2 ? scale[2] / 2 : scale[4] / 2);
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sawtooth';
                bOsc.frequency.setValueAtTime(bassNote, now);

                bGain.gain.setValueAtTime(0.03, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                bOsc.connect(bGain);
                bGain.connect(this.ctx.destination);
                bOsc.start(now);
                bOsc.stop(now + 0.16);

                if (step % 2 === 0) {
                    const arpIdx = (step % scale.length);
                    const arpFreq = scale[arpIdx] * 2;
                    const aOsc = this.ctx.createOscillator();
                    const aGain = this.ctx.createGain();
                    aOsc.type = 'sine';
                    aOsc.frequency.setValueAtTime(arpFreq, now);

                    aGain.gain.setValueAtTime(0.025, now);
                    aGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

                    aOsc.connect(aGain);
                    aGain.connect(this.ctx.destination);
                    aOsc.start(now);
                    aOsc.stop(now + 0.2);
                }
                step = (step + 1) % 16;
            } catch (e) {}
        }, 150);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

window.cosmicAudio = new CosmicAudio();
