/**
 * Super Cosmic Gold Rush - Mario-Style Space Gold Miner Platformer
 * Canvas 60 FPS platformer with jump physics, prize mystery blocks,
 * spinning gold coins, power stars, stomping alien crawlers, and audio synth.
 */

class GoldRushGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.width = 800;
        this.height = 480;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.isRunning = false;
        this.isGameOver = false;

        // Player Astronaut
        this.player = {
            x: 80,
            y: 350,
            w: 28,
            h: 38,
            vx: 0,
            vy: 0,
            speed: 5.5,
            jumpStrength: -11.5,
            isGrounded: false,
            canDoubleJump: true,
            facingRight: true,
            score: 0,
            coins: 0,
            lives: 3
        };

        this.gravity = 0.55;
        this.friction = 0.82;
        this.cameraX = 0;

        // Level Elements
        this.platforms = [];
        this.mysteryBlocks = [];
        this.coins = [];
        this.enemies = [];
        this.particles = [];
        this.floatingTexts = [];

        // Input
        this.keys = { left: false, right: false, jump: false };

        this.initLevel();
        this.setupControls();
        this.start();
    }

    initLevel() {
        this.platforms = [
            // Ground segments with gaps
            { x: 0, y: 420, w: 900, h: 60 },
            { x: 1000, y: 420, w: 800, h: 60 },
            { x: 1900, y: 420, w: 1000, h: 60 },
            { x: 3000, y: 420, w: 1200, h: 60 },

            // Floating platforms
            { x: 200, y: 310, w: 140, h: 22 },
            { x: 400, y: 230, w: 160, h: 22 },
            { x: 680, y: 280, w: 140, h: 22 },
            { x: 1100, y: 320, w: 130, h: 22 },
            { x: 1300, y: 220, w: 180, h: 22 },
            { x: 1600, y: 290, w: 140, h: 22 },
            { x: 2100, y: 300, w: 150, h: 22 },
            { x: 2350, y: 210, w: 170, h: 22 },
            { x: 2650, y: 280, w: 150, h: 22 },
            { x: 3200, y: 310, w: 200, h: 22 },
            { x: 3500, y: 230, w: 180, h: 22 },
        ];

        // Prize Mystery `[?]` Blocks
        this.mysteryBlocks = [
            { x: 250, y: 190, w: 32, h: 32, hit: false, coinsLeft: 3 },
            { x: 450, y: 120, w: 32, h: 32, hit: false, coinsLeft: 5 },
            { x: 730, y: 160, w: 32, h: 32, hit: false, coinsLeft: 3 },
            { x: 1350, y: 110, w: 32, h: 32, hit: false, coinsLeft: 5 },
            { x: 1650, y: 170, w: 32, h: 32, hit: false, coinsLeft: 4 },
            { x: 2400, y: 100, w: 32, h: 32, hit: false, coinsLeft: 6 },
            { x: 3550, y: 120, w: 32, h: 32, hit: false, coinsLeft: 10 },
        ];

        // Collectible Gold Coins scattered across platforms
        this.coins = [
            { x: 220, y: 270, collected: false },
            { x: 260, y: 270, collected: false },
            { x: 430, y: 190, collected: false },
            { x: 470, y: 190, collected: false },
            { x: 510, y: 190, collected: false },
            { x: 710, y: 240, collected: false },
            { x: 750, y: 240, collected: false },
            { x: 1130, y: 280, collected: false },
            { x: 1350, y: 180, collected: false },
            { x: 1400, y: 180, collected: false },
            { x: 1630, y: 250, collected: false },
            { x: 2130, y: 260, collected: false },
            { x: 2380, y: 170, collected: false },
            { x: 2420, y: 170, collected: false },
            { x: 2680, y: 240, collected: false },
            { x: 3230, y: 270, collected: false },
            { x: 3280, y: 270, collected: false },
            { x: 3530, y: 190, collected: false },
        ];

        // Alien Spiked Crawlers
        this.enemies = [
            { x: 500, y: 395, w: 26, h: 25, vx: -1.6, minX: 350, maxX: 700, alive: true },
            { x: 720, y: 255, w: 26, h: 25, vx: 1.5, minX: 680, maxX: 810, alive: true },
            { x: 1200, y: 395, w: 26, h: 25, vx: -2.0, minX: 1050, maxX: 1550, alive: true },
            { x: 1400, y: 195, w: 26, h: 25, vx: 1.4, minX: 1300, maxX: 1460, alive: true },
            { x: 2200, y: 395, w: 26, h: 25, vx: -2.2, minX: 1950, maxX: 2550, alive: true },
            { x: 2700, y: 255, w: 26, h: 25, vx: 1.6, minX: 2650, maxX: 2790, alive: true },
            { x: 3300, y: 395, w: 26, h: 25, vx: -2.5, minX: 3050, maxX: 3800, alive: true },
        ];

        // Cosmic Exit Portal at the end of the run
        this.portal = { x: 4050, y: 330, w: 45, h: 90 };
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (window.cosmicAudio) window.cosmicAudio.init();
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                if (!this.keys.jump) this.jump();
                this.keys.jump = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.keys.jump = false;
        });

        // Touch buttons
        this.bindTouch('gold-touch-left', 'left');
        this.bindTouch('gold-touch-right', 'right');
        const jumpBtn = document.getElementById('gold-touch-jump');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.jump(); });
            jumpBtn.addEventListener('mousedown', () => this.jump());
        }
    }

    bindTouch(id, keyName) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[keyName] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[keyName] = false; });
        btn.addEventListener('mousedown', () => { this.keys[keyName] = true; });
        btn.addEventListener('mouseup', () => { this.keys[keyName] = false; });
    }

    jump() {
        if (this.player.isGrounded) {
            this.player.vy = this.player.jumpStrength;
            this.player.isGrounded = false;
            this.player.canDoubleJump = true;
            this.playJumpSound();
            this.createJetSparks();
        } else if (this.player.canDoubleJump) {
            this.player.vy = this.player.jumpStrength * 0.9;
            this.player.canDoubleJump = false;
            this.playJumpSound();
            this.createJetSparks();
            this.addFloatingText("THRUST JUMP!", this.player.x, this.player.y - 15, "#00f0ff");
        }
    }

    playJumpSound() {
        if (!window.cosmicAudio || !window.cosmicAudio.enabled) return;
        try {
            const ctx = window.cosmicAudio.ctx;
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {}
    }

    playCoinSound() {
        if (!window.cosmicAudio || !window.cosmicAudio.enabled) return;
        try {
            const ctx = window.cosmicAudio.ctx;
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
        } catch (e) {}
    }

    playBlockBumpSound() {
        if (!window.cosmicAudio || !window.cosmicAudio.enabled) return;
        try {
            const ctx = window.cosmicAudio.ctx;
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {}
    }

    createJetSparks() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + this.player.w / 2,
                y: this.player.y + this.player.h,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                color: Math.random() < 0.5 ? "#00f0ff" : "#ff0077",
                radius: Math.random() * 3 + 2,
                life: 20
            });
        }
    }

    addFloatingText(text, x, y, color) {
        this.floatingTexts.push({ text, x, y, vy: -1.5, color, alpha: 1.0 });
    }

    update() {
        if (this.isGameOver) return;

        // Horizontal Movement
        if (this.keys.left) {
            this.player.vx = -this.player.speed;
            this.player.facingRight = false;
        } else if (this.keys.right) {
            this.player.vx = this.player.speed;
            this.player.facingRight = true;
        } else {
            this.player.vx *= this.friction;
        }

        // Apply Gravity
        this.player.vy += this.gravity;

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        // Platform Collisions
        this.player.isGrounded = false;
        this.platforms.forEach(p => {
            if (this.player.x + this.player.w > p.x &&
                this.player.x < p.x + p.w &&
                this.player.y + this.player.h >= p.y &&
                this.player.y + this.player.h <= p.y + 15 &&
                this.player.vy >= 0) {
                this.player.y = p.y - this.player.h;
                this.player.vy = 0;
                this.player.isGrounded = true;
            }
        });

        // Mystery `[?]` Blocks Collisions (Hit from bottom like Mario!)
        this.mysteryBlocks.forEach(b => {
            // Hit from underneath
            if (this.player.x + this.player.w > b.x &&
                this.player.x < b.x + b.w &&
                this.player.y <= b.y + b.h &&
                this.player.y >= b.y + b.h - 14 &&
                this.player.vy < 0) {

                this.player.vy = 2; // Bounce down
                this.playBlockBumpSound();

                if (b.coinsLeft > 0) {
                    b.coinsLeft--;
                    this.player.coins += 1;
                    this.player.score += 100;
                    this.playCoinSound();
                    this.addFloatingText("+100 GOLD CC", b.x, b.y - 20, "#ffd700");

                    // Spawn coin popup particle
                    for (let i = 0; i < 10; i++) {
                        this.particles.push({
                            x: b.x + b.w / 2,
                            y: b.y,
                            vx: (Math.random() - 0.5) * 5,
                            vy: -(Math.random() * 5 + 3),
                            color: "#ffd700",
                            radius: 3,
                            life: 25
                        });
                    }
                }
                b.hit = (b.coinsLeft === 0);
            }
            // Stand on top of block
            else if (this.player.x + this.player.w > b.x &&
                this.player.x < b.x + b.w &&
                this.player.y + this.player.h >= b.y &&
                this.player.y + this.player.h <= b.y + 12 &&
                this.player.vy >= 0) {
                this.player.y = b.y - this.player.h;
                this.player.vy = 0;
                this.player.isGrounded = true;
            }
        });

        // Collect Gold Coins
        this.coins.forEach(c => {
            if (!c.collected) {
                const dist = Math.hypot((this.player.x + this.player.w / 2) - c.x, (this.player.y + this.player.h / 2) - c.y);
                if (dist < 26) {
                    c.collected = true;
                    this.player.coins += 1;
                    this.player.score += 50;
                    this.playCoinSound();
                    this.addFloatingText("+50 CC", c.x, c.y - 10, "#ffd700");
                }
            }
        });

        // Enemies Update & Collisions
        this.enemies.forEach(e => {
            if (e.alive) {
                e.x += e.vx;
                if (e.x < e.minX || e.x > e.maxX) e.vx *= -1;

                // Player stomping enemy from above
                if (this.player.x + this.player.w > e.x &&
                    this.player.x < e.x + e.w &&
                    this.player.y + this.player.h >= e.y &&
                    this.player.y + this.player.h <= e.y + 16 &&
                    this.player.vy > 0) {
                    e.alive = false;
                    this.player.vy = -8.5; // Bounce up
                    this.player.score += 200;
                    this.playJumpSound();
                    this.addFloatingText("+200 STOMP!", e.x, e.y - 15, "#00ff88");
                }
                // Enemy hurting player
                else if (this.player.x + this.player.w > e.x + 4 &&
                    this.player.x < e.x + e.w - 4 &&
                    this.player.y + this.player.h > e.y + 6 &&
                    this.player.y < e.y + e.h) {
                    this.hurtPlayer();
                }
            }
        });

        // Void Fall check
        if (this.player.y > this.height + 50) {
            this.hurtPlayer(true);
        }

        // Victory Portal Trigger
        if (this.player.x > this.portal.x) {
            this.completeGame();
        }

        // Camera Smooth Follow
        this.cameraX = THREE.MathUtils.lerp(this.cameraX, this.player.x - 220, 0.1);

        // Update Particles
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(idx, 1);
        });

        // Update Floating Texts
        this.floatingTexts.forEach((ft, idx) => {
            ft.y += ft.vy;
            ft.alpha -= 0.025;
            if (ft.alpha <= 0) this.floatingTexts.splice(idx, 1);
        });

        // Update HUD DOM
        const scoreEl = document.getElementById('gold-hud-score');
        const coinsEl = document.getElementById('gold-hud-coins');
        const livesEl = document.getElementById('gold-hud-lives');
        if (scoreEl) scoreEl.textContent = this.player.score;
        if (coinsEl) coinsEl.textContent = this.player.coins;
        if (livesEl) livesEl.textContent = this.player.lives;
    }

    hurtPlayer(respawn = false) {
        this.player.lives--;
        if (window.cosmicAudio) window.cosmicAudio.playCrash();
        if (navigator.vibrate) navigator.vibrate(150);

        if (this.player.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn
            this.player.x = Math.max(80, this.player.x - 250);
            this.player.y = 250;
            this.player.vy = 0;
            this.player.vx = 0;
            this.addFloatingText("LIFE LOST!", this.player.x, this.player.y - 20, "#ff0077");
        }
    }

    completeGame() {
        this.isGameOver = true;
        this.player.score += 1500; // Finish bonus
        this.submitScore();
    }

    gameOver() {
        this.isGameOver = true;
        this.submitScore();
    }

    async submitScore() {
        const payload = {
            game_slug: 'super-gold-rush',
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
            this.showGameOverModal(data);
        } catch (e) {
            this.showGameOverModal({
                score: this.player.score,
                credits_earned: Math.max(50, Math.floor(this.player.score / 8)),
                xp_earned: Math.max(30, Math.floor(this.player.score / 15))
            });
        }
    }

    showGameOverModal(data) {
        const modal = document.getElementById('gold-finish-modal');
        if (!modal) return;
        document.getElementById('gold-modal-score').textContent = this.player.score;
        document.getElementById('gold-modal-coins').textContent = this.player.coins;
        document.getElementById('gold-modal-credits').textContent = `+${data.credits_earned || 0} CC`;
        document.getElementById('gold-modal-xp').textContent = `+${data.xp_earned || 0} XP`;
        modal.classList.add('active');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Cyber Deep Space Sky Background
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, "#050616");
        grad.addColorStop(1, "#12092b");
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Distant Glowing Space Mountains / Skyline
        this.ctx.fillStyle = "rgba(0, 240, 255, 0.05)";
        this.ctx.beginPath();
        for (let i = 0; i < 15; i++) {
            const mx = i * 160 - (this.cameraX * 0.2 % 160);
            this.ctx.lineTo(mx, 380 - (i % 3) * 60);
            this.ctx.lineTo(mx + 80, 420);
        }
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);

        // Platforms (Neon Cyber Blocks)
        this.platforms.forEach(p => {
            this.ctx.fillStyle = "#0c1538";
            this.ctx.fillRect(p.x, p.y, p.w, p.h);

            // Glowing neon top rim
            this.ctx.fillStyle = "#00f0ff";
            this.ctx.fillRect(p.x, p.y, p.w, 4);

            // Tech grid lines
            this.ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
            this.ctx.lineWidth = 1;
            for (let gx = p.x; gx < p.x + p.w; gx += 40) {
                this.ctx.strokeRect(gx, p.y + 4, 40, p.h - 4);
            }
        });

        // Mystery `[?]` Prize Blocks
        this.mysteryBlocks.forEach(b => {
            this.ctx.fillStyle = b.hit ? "#445566" : "#ffaa00";
            this.ctx.fillRect(b.x, b.y, b.w, b.h);

            this.ctx.strokeStyle = b.hit ? "#223344" : "#ffdd44";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(b.x, b.y, b.w, b.h);

            this.ctx.fillStyle = b.hit ? "#8899aa" : "#000";
            this.ctx.font = "bold 18px 'Orbitron', monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText(b.hit ? "–" : "?", b.x + b.w / 2, b.y + 23);
        });

        // Spinning Gold Coins
        const coinFrame = Math.floor(Date.now() / 120) % 6;
        const coinWidthScale = Math.cos(coinFrame * Math.PI / 3);
        this.coins.forEach(c => {
            if (!c.collected) {
                this.ctx.save();
                this.ctx.translate(c.x, c.y);
                this.ctx.scale(coinWidthScale, 1);
                this.ctx.fillStyle = "#ffd700";
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = "#fff";
                this.ctx.font = "bold 10px monospace";
                this.ctx.textAlign = "center";
                this.ctx.fillText("$", 0, 3);
                this.ctx.restore();
            }
        });

        // Alien Spiked Crawlers
        this.enemies.forEach(e => {
            if (e.alive) {
                this.ctx.fillStyle = "#ff0077";
                this.ctx.beginPath();
                this.ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI, true);
                this.ctx.closePath();
                this.ctx.fill();

                // Spikes
                this.ctx.fillStyle = "#ffaa00";
                for (let s = 0; s < 3; s++) {
                    this.ctx.fillRect(e.x + 4 + s * 8, e.y - 4, 4, 5);
                }

                // Glowing Eye
                this.ctx.fillStyle = "#00ffff";
                this.ctx.beginPath();
                this.ctx.arc(e.x + (e.vx > 0 ? e.w - 8 : 8), e.y + 10, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Cosmic Exit Portal
        const pGrad = this.ctx.createRadialGradient(
            this.portal.x + this.portal.w / 2, this.portal.y + this.portal.h / 2, 5,
            this.portal.x + this.portal.w / 2, this.portal.y + this.portal.h / 2, 45
        );
        pGrad.addColorStop(0, "#00ff88");
        pGrad.addColorStop(0.5, "#00f0ff");
        pGrad.addColorStop(1, "transparent");
        this.ctx.fillStyle = pGrad;
        this.ctx.fillRect(this.portal.x - 20, this.portal.y - 20, this.portal.w + 40, this.portal.h + 40);

        this.ctx.strokeStyle = "#00ff88";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.portal.x, this.portal.y, this.portal.w, this.portal.h);

        // Player Astronaut
        this.drawPlayer();

        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Floating Scores
        this.floatingTexts.forEach(ft => {
            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = Math.max(0, ft.alpha);
            this.ctx.font = "bold 13px 'Orbitron', monospace";
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.globalAlpha = 1.0;
        });

        this.ctx.restore();
    }

    drawPlayer() {
        const p = this.player;

        // Spacesuit Body
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(p.x + 4, p.y + 12, p.w - 8, p.h - 14);

        // Helmet
        this.ctx.fillStyle = "#00d4ff";
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.w / 2, p.y + 8, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Visor (Gold / Cyan)
        this.ctx.fillStyle = "#ffd700";
        const visorOffset = p.facingRight ? 3 : -3;
        this.ctx.fillRect(p.x + p.w / 2 - 4 + visorOffset, p.y + 4, 7, 6);

        // Oxygen Jetpack on back
        this.ctx.fillStyle = "#ff0077";
        const packX = p.facingRight ? p.x : p.x + p.w - 5;
        this.ctx.fillRect(packX, p.y + 14, 5, 16);

        // Thruster flame when jumping
        if (!p.isGrounded) {
            this.ctx.fillStyle = "#00f0ff";
            this.ctx.beginPath();
            this.ctx.moveTo(packX, p.y + 30);
            this.ctx.lineTo(packX + 5, p.y + 30);
            this.ctx.lineTo(packX + 2.5, p.y + 38);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Boots
        this.ctx.fillStyle = "#0a1020";
        this.ctx.fillRect(p.x + 3, p.y + p.h - 4, 9, 5);
        this.ctx.fillRect(p.x + p.w - 12, p.y + p.h - 4, 9, 5);
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

window.GoldRushGame = GoldRushGame;
