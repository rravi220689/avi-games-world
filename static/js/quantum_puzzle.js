/**
 * Quantum Nova: Space Gem Match Puzzle Game
 * Cyberpunk Match-3 with cascading physics, supernova bombs,
 * chain reaction combos, and Cosmic Credit rewards.
 */

class QuantumPuzzleGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.rows = 8;
        this.cols = 8;
        this.tileSize = 56;
        this.canvas.width = this.cols * this.tileSize;
        this.canvas.height = this.rows * this.tileSize;

        this.grid = [];
        this.selectedTile = null;
        this.score = 0;
        this.movesLeft = 25;
        this.combo = 1;
        this.isProcessing = false;
        this.particles = [];
        this.floatingTexts = [];

        // Gem Colors & Icons
        this.gemTypes = [
            { id: 0, name: 'Plasma Ruby', color: '#ff0055', icon: 'diamond' },
            { id: 1, name: 'Ion Cyan', color: '#00f0ff', icon: 'atom' },
            { id: 2, name: 'Warp Gold', color: '#ffd700', icon: 'bolt' },
            { id: 3, name: 'Bio Emerald', color: '#00ff88', icon: 'leaf' },
            { id: 4, name: 'Void Amethyst', color: '#bc13fe', icon: 'star' },
        ];

        this.initGrid();
        this.setupEvents();
        this.animate();
    }

    initGrid() {
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                let gemId;
                do {
                    gemId = Math.floor(Math.random() * this.gemTypes.length);
                } while (
                    (r >= 2 && this.grid[r - 1][c].type === gemId && this.grid[r - 2][c].type === gemId) ||
                    (c >= 2 && this.grid[r][c - 1].type === gemId && this.grid[r][c - 2].type === gemId)
                );
                this.grid[r][c] = {
                    type: gemId,
                    r: r,
                    c: c,
                    yOffset: 0,
                    alpha: 1.0,
                    isBomb: false
                };
            }
        }
    }

    setupEvents() {
        const handleSelect = (clientX, clientY) => {
            if (this.isProcessing || this.movesLeft <= 0) return;
            if (window.cosmicAudio) window.cosmicAudio.init();

            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            const c = Math.floor((clientX - rect.left) * scaleX / this.tileSize);
            const r = Math.floor((clientY - rect.top) * scaleY / this.tileSize);

            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;

            if (!this.selectedTile) {
                this.selectedTile = { r, c };
                this.playClickSound();
            } else {
                const dr = Math.abs(this.selectedTile.r - r);
                const dc = Math.abs(this.selectedTile.c - c);

                if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                    this.swapAndCheck(this.selectedTile.r, this.selectedTile.c, r, c);
                }
                this.selectedTile = null;
            }
        };

        this.canvas.addEventListener('mousedown', (e) => handleSelect(e.clientX, e.clientY));
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                e.preventDefault();
                handleSelect(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });
    }

    playClickSound() {
        if (!window.cosmicAudio || !window.cosmicAudio.enabled) return;
        try {
            const ctx = window.cosmicAudio.ctx;
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {}
    }

    playMatchSound(combo) {
        if (!window.cosmicAudio || !window.cosmicAudio.enabled) return;
        try {
            const ctx = window.cosmicAudio.ctx;
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const freq = 400 + Math.min(1200, combo * 180);
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.2);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {}
    }

    async swapAndCheck(r1, c1, r2, c2) {
        this.isProcessing = true;

        // Perform Swap
        this.swap(r1, c1, r2, c2);

        const matches = this.findMatches();
        if (matches.length > 0) {
            this.movesLeft--;
            this.combo = 1;
            await this.processMatches();
        } else {
            // Revert swap
            await this.wait(180);
            this.swap(r1, c1, r2, c2);
            this.isProcessing = false;
        }

        this.updateHUD();

        if (this.movesLeft <= 0) {
            this.completeGame();
        }
    }

    swap(r1, c1, r2, c2) {
        const temp = this.grid[r1][c1].type;
        this.grid[r1][c1].type = this.grid[r2][c2].type;
        this.grid[r2][c2].type = temp;
    }

    findMatches() {
        const matched = new Set();

        // Horizontal matches
        for (let r = 0; r < this.rows; r++) {
            let matchCount = 1;
            for (let c = 1; c < this.cols; c++) {
                if (this.grid[r][c].type !== -1 && this.grid[r][c].type === this.grid[r][c - 1].type) {
                    matchCount++;
                } else {
                    if (matchCount >= 3) {
                        for (let k = 0; k < matchCount; k++) matched.add(`${r},${c - 1 - k}`);
                    }
                    matchCount = 1;
                }
            }
            if (matchCount >= 3) {
                for (let k = 0; k < matchCount; k++) matched.add(`${r},${this.cols - 1 - k}`);
            }
        }

        // Vertical matches
        for (let c = 0; c < this.cols; c++) {
            let matchCount = 1;
            for (let r = 1; r < this.rows; r++) {
                if (this.grid[r][c].type !== -1 && this.grid[r][c].type === this.grid[r - 1][c].type) {
                    matchCount++;
                } else {
                    if (matchCount >= 3) {
                        for (let k = 0; k < matchCount; k++) matched.add(`${r - 1 - k},${c}`);
                    }
                    matchCount = 1;
                }
            }
            if (matchCount >= 3) {
                for (let k = 0; k < matchCount; k++) matched.add(`${this.rows - 1 - k},${c}`);
            }
        }

        return Array.from(matched).map(str => {
            const [r, c] = str.split(',').map(Number);
            return { r, c };
        });
    }

    async processMatches() {
        let matches = this.findMatches();

        while (matches.length > 0) {
            this.playMatchSound(this.combo);

            const pointsEarned = matches.length * 50 * this.combo;
            this.score += pointsEarned;

            // Spawn Particles & Floating Score
            matches.forEach(m => {
                const gem = this.grid[m.r][m.c];
                const color = this.gemTypes[gem.type]?.color || '#00f0ff';
                const px = m.c * this.tileSize + this.tileSize / 2;
                const py = m.r * this.tileSize + this.tileSize / 2;

                for (let i = 0; i < 8; i++) {
                    this.particles.push({
                        x: px,
                        y: py,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        color: color,
                        radius: Math.random() * 4 + 2,
                        life: 25
                    });
                }

                // Mark cleared
                this.grid[m.r][m.c].type = -1;
            });

            if (this.combo > 1) {
                this.addFloatingText(`COMBO x${this.combo}! +${pointsEarned}`, this.canvas.width / 2, 80, "#ffd700");
                if (navigator.vibrate) navigator.vibrate(60);
            }

            await this.wait(200);

            // Apply Gravity (Drop down)
            this.applyGravity();
            await this.wait(250);

            // Refill Empty Slots
            this.refillGrid();
            await this.wait(200);

            this.combo++;
            matches = this.findMatches();
        }

        this.isProcessing = false;
    }

    applyGravity() {
        for (let c = 0; c < this.cols; c++) {
            let emptyRow = this.rows - 1;
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.grid[r][c].type !== -1) {
                    if (r !== emptyRow) {
                        this.grid[emptyRow][c].type = this.grid[r][c].type;
                        this.grid[r][c].type = -1;
                    }
                    emptyRow--;
                }
            }
        }
    }

    refillGrid() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].type === -1) {
                    this.grid[r][c].type = Math.floor(Math.random() * this.gemTypes.length);
                    this.grid[r][c].yOffset = -this.tileSize;
                }
            }
        }
    }

    addFloatingText(text, x, y, color) {
        this.floatingTexts.push({ text, x, y, vy: -1.2, color, alpha: 1.0 });
    }

    wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    updateHUD() {
        const scoreEl = document.getElementById('puzzle-hud-score');
        const movesEl = document.getElementById('puzzle-hud-moves');
        if (scoreEl) scoreEl.textContent = this.score;
        if (movesEl) movesEl.textContent = this.movesLeft;
    }

    async completeGame() {
        const payload = {
            game_slug: 'quantum-puzzle',
            score: this.score
        };

        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';

        try {
            const resp = await fetch('/api/arcade/score/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            this.showFinishModal(data);
        } catch (e) {
            this.showFinishModal({
                score: this.score,
                credits_earned: Math.max(50, Math.floor(this.score / 7)),
                xp_earned: Math.max(30, Math.floor(this.score / 12))
            });
        }
    }

    showFinishModal(data) {
        const modal = document.getElementById('puzzle-finish-modal');
        if (!modal) return;
        document.getElementById('puzzle-modal-score').textContent = this.score;
        document.getElementById('puzzle-modal-credits').textContent = `+${data.credits_earned || 0} CC`;
        document.getElementById('puzzle-modal-xp').textContent = `+${data.xp_earned || 0} XP`;
        modal.classList.add('active');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Cyber Grid Background
        this.ctx.fillStyle = "#070a1a";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid Cells & Gems
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * this.tileSize;
                const y = r * this.tileSize;

                // Cell Border
                this.ctx.strokeStyle = "rgba(0, 240, 255, 0.1)";
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);

                // Highlight selected tile
                if (this.selectedTile && this.selectedTile.r === r && this.selectedTile.c === c) {
                    this.ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
                    this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
                    this.ctx.strokeStyle = "#00f0ff";
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
                }

                const gem = this.grid[r][c];
                if (gem.type !== -1) {
                    const gemInfo = this.gemTypes[gem.type];
                    const cx = x + this.tileSize / 2;
                    const cy = y + this.tileSize / 2;

                    // Draw Glowing Quantum Core Gem
                    this.ctx.save();
                    this.ctx.shadowColor = gemInfo.color;
                    this.ctx.shadowBlur = 10;
                    this.ctx.fillStyle = gemInfo.color;

                    this.ctx.beginPath();
                    this.ctx.arc(cx, cy, 18, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Inner bright highlight
                    this.ctx.fillStyle = "#ffffff";
                    this.ctx.beginPath();
                    this.ctx.arc(cx - 5, cy - 5, 5, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.restore();
                }
            }
        }

        // Draw Particles
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            if (p.life <= 0) this.particles.splice(idx, 1);
        });

        // Draw Floating Text
        this.floatingTexts.forEach((ft, idx) => {
            ft.y += ft.vy;
            ft.alpha -= 0.02;
            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = Math.max(0, ft.alpha);
            this.ctx.font = "bold 16px 'Orbitron', monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.globalAlpha = 1.0;
            if (ft.alpha <= 0) this.floatingTexts.splice(idx, 1);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.draw();
    }
}

window.QuantumPuzzleGame = QuantumPuzzleGame;
