/**
 * Cosmic Invaders: Void Defense - Retro Space Arcade Shooter
 * Player starfighter, alien formation armada, bunkers, mothership,
 * sound synth, touch controls, and high-score credit synchronization.
 */

class VoidInvadersGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.width = 640;
        this.height = 560;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.isRunning = false;
        this.isGameOver = false;

        // Player
        this.player = {
            x: this.width / 2 - 18,
            y: this.height - 50,
            w: 36,
            h: 24,
            speed: 6.0,
            lives: 3,
            score: 0,
            lastShot: 0
        };

        // Entities
        this.bullets = [];
        this.alienBullets = [];
        this.aliens = [];
        this.bunkers = [];
        this.particles = [];
        this.mothership = null;

        // Fleet Animation
        this.fleetVx = 1.2;
        this.fleetStepDown = 12;
        this.wave = 1;

        // Input
        this.keys = { left: false, right: false, fire: false };

        this.initBunkers();
        this.initFleet();
        this.setupControls();
        this.start();
    }

    initFleet() {
        this.aliens = [];
        const rows = 4;
        const cols = 8;
        const startX = 60;
        const startY = 70;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.aliens.push({
                    x: startX + c * 60,
                    y: startY + r * 42,
                    w: 32,
                    h: 24,
                    alive: true,
                    type: r, // 0: Top, 1: Mid, 2: Mid, 3: Bot
                    points: (4 - r) * 50
                });
            }
        }
    }

    initBunkers() {
        this.bunkers = [];
        const count = 4;
        const spacing = this.width / (count + 1);

        for (let i = 0; i < count; i++) {
            this.bunkers.push({
                x: spacing * (i + 1) - 30,
                y: this.height - 110,
                w: 60,
                h: 30,
                health: 12
            });
        }
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (window.cosmicAudio) window.cosmicAudio.init();
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.fire = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.fire = false;
        });

        // Touch buttons
        this.bindTouch('invader-touch-left', 'left');
        this.bindTouch('invader-touch-right', 'right');
        this.bindTouch('invader-touch-fire', 'fire');
    }

    bindTouch(id, keyName) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[keyName] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[keyName] = false; });
        btn.addEventListener('mousedown', () => { this.keys[keyName] = true; });
        btn.addEventListener('mouseup', () => { this.keys[keyName] = false; });
    }

    fireBullet() {
        const now = performance.now();
        if (now - this.player.lastShot > 280) {
            this.player.lastShot = now;
            this.bullets.push({
                x: this.player.x + this.player.w / 2 - 2,
                y: this.player.y,
                w: 4,
                h: 12,
                vy: -8.5
            });
            this.playLaserSound();
        }
    }

    playLaserSound() {
        if (!window.cosmicAudio || !window.cosmicAudio.enabled) return;
        try {
            const ctx = window.cosmicAudio.ctx;
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {}
    }

    playExplosionSound() {
        if (!window.cosmicAudio || !window.cosmicAudio.enabled) return;
        try {
            const ctx = window.cosmicAudio.ctx;
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {}
    }

    update() {
        if (this.isGameOver) return;

        // Player Move
        if (this.keys.left) {
            this.player.x = Math.max(10, this.player.x - this.player.speed);
        }
        if (this.keys.right) {
            this.player.x = Math.min(this.width - this.player.w - 10, this.player.x + this.player.speed);
        }
        if (this.keys.fire) {
            this.fireBullet();
        }

        // Bullets Update
        this.bullets.forEach((b, idx) => {
            b.y += b.vy;
            if (b.y < -20) this.bullets.splice(idx, 1);
        });

        this.alienBullets.forEach((ab, idx) => {
            ab.y += ab.vy;
            if (ab.y > this.height + 20) this.alienBullets.splice(idx, 1);
        });

        // Fleet Movement
        let hitEdge = false;
        this.aliens.forEach(a => {
            if (a.alive) {
                a.x += this.fleetVx;
                if (a.x < 15 || a.x + a.w > this.width - 15) {
                    hitEdge = true;
                }
            }
        });

        if (hitEdge) {
            this.fleetVx *= -1;
            this.aliens.forEach(a => {
                a.y += this.fleetStepDown;
                // If aliens reach bunker level -> Game Over!
                if (a.alive && a.y + a.h >= this.player.y) {
                    this.gameOver();
                }
            });
        }

        // Alien Shooting
        if (Math.random() < 0.035) {
            const livingAliens = this.aliens.filter(a => a.alive);
            if (livingAliens.length > 0) {
                const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
                this.alienBullets.push({
                    x: shooter.x + shooter.w / 2 - 2,
                    y: shooter.y + shooter.h,
                    w: 4,
                    h: 10,
                    vy: 4.2 + (this.wave * 0.4)
                });
            }
        }

        // Bullet vs Alien Collisions
        this.bullets.forEach((b, bIdx) => {
            this.aliens.forEach(a => {
                if (a.alive && b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
                    a.alive = false;
                    this.bullets.splice(bIdx, 1);
                    this.player.score += a.points;
                    this.playExplosionSound();
                    this.createExplosion(a.x + a.w / 2, a.y + a.h / 2, "#00f0ff");
                }
            });
        });

        // Alien Bullet vs Player Collision
        this.alienBullets.forEach((ab, abIdx) => {
            if (ab.x < this.player.x + this.player.w && ab.x + ab.w > this.player.x &&
                ab.y < this.player.y + this.player.h && ab.y + ab.h > this.player.y) {
                this.alienBullets.splice(abIdx, 1);
                this.player.lives--;
                this.playExplosionSound();
                this.createExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, "#ff0077");
                if (navigator.vibrate) navigator.vibrate(150);

                if (this.player.lives <= 0) {
                    this.gameOver();
                }
            }
        });

        // Bunkers Damage
        this.bunkers.forEach(bk => {
            if (bk.health > 0) {
                this.bullets.forEach((b, bIdx) => {
                    if (b.x < bk.x + bk.w && b.x + b.w > bk.x && b.y < bk.y + bk.h && b.y + b.h > bk.y) {
                        this.bullets.splice(bIdx, 1);
                        bk.health--;
                    }
                });

                this.alienBullets.forEach((ab, abIdx) => {
                    if (ab.x < bk.x + bk.w && ab.x + ab.w > bk.x && ab.y < bk.y + bk.h && ab.y + ab.h > bk.y) {
                        this.alienBullets.splice(abIdx, 1);
                        bk.health--;
                    }
                });
            }
        });

        // Check if all aliens destroyed -> Next Wave!
        if (this.aliens.every(a => !a.alive)) {
            this.wave++;
            this.player.score += 500;
            this.fleetVx = (Math.abs(this.fleetVx) + 0.3) * (this.fleetVx > 0 ? 1 : -1);
            this.initFleet();
        }

        // Particles
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(idx, 1);
        });

        // Update DOM HUD
        const scoreEl = document.getElementById('invader-hud-score');
        const livesEl = document.getElementById('invader-hud-lives');
        const waveEl = document.getElementById('invader-hud-wave');
        if (scoreEl) scoreEl.textContent = this.player.score;
        if (livesEl) livesEl.textContent = this.player.lives;
        if (waveEl) waveEl.textContent = this.wave;
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 14; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                color: color,
                radius: Math.random() * 3 + 1,
                life: 20
            });
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.submitScore();
    }

    async submitScore() {
        const payload = {
            game_slug: 'void-invaders',
            score: this.player.score
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
                score: this.player.score,
                credits_earned: Math.max(50, Math.floor(this.player.score / 6)),
                xp_earned: Math.max(30, Math.floor(this.player.score / 10))
            });
        }
    }

    showFinishModal(data) {
        const modal = document.getElementById('invader-finish-modal');
        if (!modal) return;
        document.getElementById('invader-modal-score').textContent = this.player.score;
        document.getElementById('invader-modal-wave').textContent = this.wave;
        document.getElementById('invader-modal-credits').textContent = `+${data.credits_earned || 0} CC`;
        document.getElementById('invader-modal-xp').textContent = `+${data.xp_earned || 0} XP`;
        modal.classList.add('active');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Deep Space Background
        this.ctx.fillStyle = "#030614";
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Stars
        this.ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 40; i++) {
            const sx = (i * 47) % this.width;
            const sy = (i * 31 + (Date.now() / 40)) % this.height;
            this.ctx.fillRect(sx, sy, 2, 2);
        }

        // Draw Player Starfighter
        this.ctx.fillStyle = "#00f0ff";
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.w / 2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.w, this.player.y + this.player.h);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.h);
        this.ctx.closePath();
        this.ctx.fill();

        // Cockpit
        this.ctx.fillStyle = "#ffd700";
        this.ctx.fillRect(this.player.x + this.player.w / 2 - 3, this.player.y + 8, 6, 6);

        // Draw Aliens
        const colors = ["#ff0077", "#ffaa00", "#00ff88", "#bc13fe"];
        this.aliens.forEach(a => {
            if (a.alive) {
                this.ctx.fillStyle = colors[a.type % colors.length];
                this.ctx.fillRect(a.x + 4, a.y + 4, a.w - 8, a.h - 8);

                // Antennae
                this.ctx.fillRect(a.x + 6, a.y, 4, 4);
                this.ctx.fillRect(a.x + a.w - 10, a.y, 4, 4);

                // Glowing Eyes
                this.ctx.fillStyle = "#fff";
                this.ctx.fillRect(a.x + 8, a.y + 8, 4, 4);
                this.ctx.fillRect(a.x + a.w - 12, a.y + 8, 4, 4);
            }
        });

        // Bunkers
        this.bunkers.forEach(bk => {
            if (bk.health > 0) {
                const alpha = bk.health / 12;
                this.ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.8})`;
                this.ctx.strokeStyle = "#00f0ff";
                this.ctx.lineWidth = 2;
                this.ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
                this.ctx.strokeRect(bk.x, bk.y, bk.w, bk.h);
            }
        });

        // Player Bullets (Cyan Neon)
        this.ctx.fillStyle = "#00ffff";
        this.ctx.shadowColor = "#00ffff";
        this.ctx.shadowBlur = 8;
        this.bullets.forEach(b => {
            this.ctx.fillRect(b.x, b.y, b.w, b.h);
        });
        this.ctx.shadowBlur = 0;

        // Alien Bullets (Red Plasma)
        this.ctx.fillStyle = "#ff0055";
        this.ctx.shadowColor = "#ff0055";
        this.ctx.shadowBlur = 6;
        this.alienBullets.forEach(ab => {
            this.ctx.fillRect(ab.x, ab.y, ab.w, ab.h);
        });
        this.ctx.shadowBlur = 0;

        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    start() {
        this.isRunning = true;
        const loop = () => {
            if (this.isRunning) {
                this.update();
                this.draw();
                requestAnimationFrame(loop);
            }
        };
        requestAnimationFrame(loop);
    }
}

window.VoidInvadersGame = VoidInvadersGame;
