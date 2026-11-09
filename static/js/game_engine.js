/**
 * COSMIC OVERDRIVE - 3D Space Car Racing Engine
 * Instant Loading, 60 FPS, Visible 3D Vessels, Simple & Ultra-Responsive Controls!
 */

class SpaceRaceGame {
    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        this.config = config || {};
        this.trackConfig = this.config.track || {};
        this.playerConfig = this.config.player || {};

        // Three.js Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Game State - Starts immediately so controls work without delay!
        this.isRunning = true;
        this.isFinished = false;
        this.isStarted = true; // Active immediately!
        this.cameraMode = 0;   // 0: Dynamic Chase, 1: Close Action, 2: Cockpit
        this.difficulty = this.trackConfig.difficulty_mode || 'MEDIUM'; // EASY, MEDIUM, HARD

        // Track Spline & Objects
        this.trackSpline = null;
        this.trackMesh = null;
        this.speedPads = [];
        this.hurdles = [];     // Dynamic Electric Laser Hurdles!
        this.asteroids = [];
        this.trackLength = 1000;

        // Player State
        this.player = {
            mesh: null,
            speed: 130, // Starts cruising immediately!
            baseMaxSpeed: this.playerConfig.top_speed || 260,
            maxSpeed: this.playerConfig.top_speed || 260,
            accel: (this.playerConfig.acceleration || 7) * 3.0,
            handling: (this.playerConfig.handling || 6.5) * 0.75,
            shield: this.playerConfig.shield || 100,
            maxShield: this.playerConfig.shield || 100,
            boost: 100,
            maxBoost: this.playerConfig.boost || 100,
            isBoosting: false,
            trackProgress: 0.002, // Just ahead of start line
            lateralOffset: 0.0,   // -1.0 to 1.0 across track
            targetOffset: 0.0,
            lap: 1,
            maxLaps: this.trackConfig.laps || 3,
            lapStartTime: performance.now(),
            totalStartTime: performance.now(),
            bestLapMs: Infinity,
            totalTimeMs: 0,
            position: 1,
            rollAngle: 0,
            thrusterFires: [],
            shieldGlow: null,
        };

        // Inputs
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            boost: false
        };

        // Pointer Steering (Mouse/Touch Drag)
        this.pointerSteer = 0;
        this.isPointerDown = false;

        // AI Opponents
        this.aiRacers = [];

        // FX
        this.warpGroup = null;
        this.warpLines = null;

        // Minimap
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

        this.init();
    }

    init() {
        if (!this.container) return;

        // 1. Scene
        this.scene = new THREE.Scene();
        const skyHex = this.trackConfig.skybox_color ? parseInt(this.trackConfig.skybox_color.replace('#', '0x')) : 0x030616;
        this.scene.fog = new THREE.FogExp2(skyHex, 0.0006);

        // 2. Camera - Positioned immediately so screen is NEVER black!
        const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
        this.camera = new THREE.PerspectiveCamera(65, aspect, 0.5, 9000);
        this.camera.position.set(0, 10, -25);
        this.camera.lookAt(0, 0, 50);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.3;
        this.container.appendChild(this.renderer.domElement);

        // 4. Vibrant Lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x223366, 1.2);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
        dirLight.position.set(400, 600, 200);
        this.scene.add(dirLight);

        const cyanFill = new THREE.PointLight(0x00f0ff, 2.5, 1200);
        cyanFill.position.set(0, 50, 0);
        this.scene.add(cyanFill);

        // 5. Build Environment & Track
        this.buildCosmicEnvironment();
        this.buildTrack();

        // 6. Build Player Vehicle
        this.player.mesh = this.createVehicleMesh(this.playerConfig, true);
        this.scene.add(this.player.mesh);

        // 7. Build AI Opponents
        this.buildAIOpponents();

        // 8. CRITICAL: Immediately position player, AI, and camera on the track starting grid!
        this.updateVehicleTransform(this.player);
        this.aiRacers.forEach(ai => this.updateVehicleTransform(ai));
        this.instantAlignCamera();

        // 9. Controls & Events
        this.setupEventListeners();

        // 10. Start Engine Audio & Audio prompt
        if (window.cosmicAudio) {
            window.cosmicAudio.startEngine();
            window.cosmicAudio.startMusic();
        }

        // 11. Quick Launch Banner (Non-blocking!)
        this.showLaunchBanner();

        // 12. Run Animation Loop
        this.animate();
    }

    showLaunchBanner() {
        const hudCountdown = document.getElementById('hud-countdown');
        if (hudCountdown) {
            hudCountdown.style.display = 'block';
            hudCountdown.textContent = 'ENGAGE!';
            hudCountdown.style.color = '#00ff88';
            setTimeout(() => {
                hudCountdown.style.display = 'none';
            }, 1200);
        }
    }

    buildCosmicEnvironment() {
        // Multi-colored Starfield
        const starCount = 3500;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        const starCol = new Float32Array(starCount * 3);

        const palette = [
            new THREE.Color(0x00f0ff),
            new THREE.Color(0xff00aa),
            new THREE.Color(0xffd700),
            new THREE.Color(0x00ff88),
            new THREE.Color(0xffffff)
        ];

        for (let i = 0; i < starCount; i++) {
            const r = 2400 + Math.random() * 2400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPos[i * 3 + 2] = r * Math.cos(phi);

            const c = palette[Math.floor(Math.random() * palette.length)];
            starCol[i * 3] = c.r;
            starCol[i * 3 + 1] = c.g;
            starCol[i * 3 + 2] = c.b;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));

        const starMat = new THREE.PointsMaterial({
            size: 4.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });
        this.scene.add(new THREE.Points(starGeo, starMat));

        // Giant Planet in the background
        const planetGeo = new THREE.SphereGeometry(360, 32, 32);
        const planetMat = new THREE.MeshStandardMaterial({
            color: this.trackConfig.theme === 'black_hole' ? 0x050010 : 0x0088ff,
            roughness: 0.6,
            metalness: 0.3
        });
        const planet = new THREE.Mesh(planetGeo, planetMat);
        planet.position.set(-1500, 450, -2200);
        this.scene.add(planet);

        // Planetary Glowing Ring
        const ringGeo = new THREE.RingGeometry(440, 800, 48);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.65
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.3;
        ring.position.set(-1500, 450, -2200);
        this.scene.add(ring);

        // Warp Speed Lines
        this.warpGroup = new THREE.Group();
        const lineGeo = new THREE.BufferGeometry();
        const linePos = new Float32Array(250 * 6);
        for (let i = 0; i < 250; i++) {
            const x = (Math.random() - 0.5) * 60;
            const y = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 70;
            linePos[i * 6] = x; linePos[i * 6 + 1] = y; linePos[i * 6 + 2] = z;
            linePos[i * 6 + 3] = x; linePos[i * 6 + 4] = y; linePos[i * 6 + 5] = z + 18;
        }
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0 });
        this.warpLines = new THREE.LineSegments(lineGeo, lineMat);
        this.warpGroup.add(this.warpLines);
        this.scene.add(this.warpGroup);
    }

    buildTrack() {
        const scale = 2.0;
        let points = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(380, 50, -480),
            new THREE.Vector3(780, -40, -750),
            new THREE.Vector3(1100, 70, -380),
            new THREE.Vector3(900, -50, 280),
            new THREE.Vector3(480, 60, 580),
            new THREE.Vector3(-180, -30, 680),
            new THREE.Vector3(-700, 80, 420),
            new THREE.Vector3(-900, -60, -160),
            new THREE.Vector3(-640, 40, -640),
            new THREE.Vector3(-270, 0, -370),
        ];

        if (this.trackConfig.slug === 'asteroid-belt-havoc') {
            points = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(350, 60, -450),
                new THREE.Vector3(700, -40, -800),
                new THREE.Vector3(950, 110, -500),
                new THREE.Vector3(750, 90, 120),
                new THREE.Vector3(420, -70, 480),
                new THREE.Vector3(0, 50, 650),
                new THREE.Vector3(-480, -90, 520),
                new THREE.Vector3(-800, 70, 180),
                new THREE.Vector3(-850, -30, -380),
                new THREE.Vector3(-550, 80, -750),
                new THREE.Vector3(-220, 0, -380),
            ];
        } else if (this.trackConfig.slug === 'cygnus-nebula-highway') {
            points = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(420, 160, -520),
                new THREE.Vector3(850, -110, -900),
                new THREE.Vector3(1250, 90, -420),
                new THREE.Vector3(950, 210, 220),
                new THREE.Vector3(420, -130, 680),
                new THREE.Vector3(-220, 100, 850),
                new THREE.Vector3(-750, -160, 520),
                new THREE.Vector3(-1050, 130, -220),
                new THREE.Vector3(-650, -60, -750),
            ];
        } else if (this.trackConfig.slug === 'singularity-abyss') {
            points = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(520, -130, -620),
                new THREE.Vector3(980, -300, -950),
                new THREE.Vector3(1350, -420, -320),
                new THREE.Vector3(1050, -260, 420),
                new THREE.Vector3(480, -110, 880),
                new THREE.Vector3(-320, 60, 940),
                new THREE.Vector3(-900, 220, 480),
                new THREE.Vector3(-1150, 160, -320),
                new THREE.Vector3(-740, 60, -840),
            ];
        }

        points = points.map(p => p.multiplyScalar(scale));
        this.trackSpline = new THREE.CatmullRomCurve3(points, true, 'centripetal');
        this.trackLength = this.trackSpline.getLength();

        // Build Road Surface Geometry
        const trackSegments = 280;
        const trackWidth = 44;
        const roadGeo = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i <= trackSegments; i++) {
            const t = (i % trackSegments) / trackSegments;
            const pt = this.trackSpline.getPointAt(t);
            const tangent = this.trackSpline.getTangentAt(t).normalize();
            let normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
            if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);
            const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize();

            const left = pt.clone().add(normal.clone().multiplyScalar(-trackWidth / 2));
            const right = pt.clone().add(normal.clone().multiplyScalar(trackWidth / 2));

            vertices.push(left.x, left.y, left.z);
            vertices.push(right.x, right.y, right.z);

            normals.push(binormal.x, binormal.y, binormal.z);
            normals.push(binormal.x, binormal.y, binormal.z);

            uvs.push(0, i * 0.5);
            uvs.push(1, i * 0.5);

            if (i < trackSegments) {
                const idx = i * 2;
                indices.push(idx, idx + 1, idx + 2);
                indices.push(idx + 1, idx + 3, idx + 2);
            }
        }

        roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        roadGeo.setIndex(indices);

        const roadMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(this.trackConfig.road_grid_color || 0x0c122e),
            roughness: 0.35,
            metalness: 0.8
        });

        this.trackMesh = new THREE.Mesh(roadGeo, roadMat);
        this.scene.add(this.trackMesh);

        // Glowing Neon Rails
        const glowColor = new THREE.Color(this.trackConfig.glow_color || 0x00f0ff);
        const railMat = new THREE.MeshBasicMaterial({ color: glowColor });

        const leftRailPts = [];
        const rightRailPts = [];
        for (let i = 0; i <= trackSegments; i++) {
            const t = (i % trackSegments) / trackSegments;
            const pt = this.trackSpline.getPointAt(t);
            const tangent = this.trackSpline.getTangentAt(t).normalize();
            let normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
            if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);

            leftRailPts.push(pt.clone().add(normal.clone().multiplyScalar(-trackWidth / 2)).add(new THREE.Vector3(0, 1.4, 0)));
            rightRailPts.push(pt.clone().add(normal.clone().multiplyScalar(trackWidth / 2)).add(new THREE.Vector3(0, 1.4, 0)));
        }

        const lCurve = new THREE.CatmullRomCurve3(leftRailPts, true);
        const rCurve = new THREE.CatmullRomCurve3(rightRailPts, true);

        this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(lCurve, trackSegments, 0.9, 6, true), railMat));
        this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(rCurve, trackSegments, 0.9, 6, true), railMat));

        // Speed Booster Pads
        this.speedPads = [];
        [0.12, 0.35, 0.60, 0.82].forEach(t => {
            const pt = this.trackSpline.getPointAt(t);
            const tangent = this.trackSpline.getTangentAt(t).normalize();

            const padGeo = new THREE.BoxGeometry(trackWidth * 0.75, 0.5, 16);
            const padMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
            const pad = new THREE.Mesh(padGeo, padMat);

            pad.position.copy(pt).add(new THREE.Vector3(0, 0.4, 0));
            pad.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

            this.scene.add(pad);
            this.speedPads.push({ mesh: pad, t: t });
        });

        // Dynamic Electric Laser Hurdle Barriers
        this.hurdles = [];
        const hurdleConfigs = this.difficulty === 'EASY' 
            ? [{ t: 0.45, gapSide: 'right' }] 
            : (this.difficulty === 'HARD'
                ? [{ t: 0.20, gapSide: 'left' }, { t: 0.42, gapSide: 'right' }, { t: 0.68, gapSide: 'left' }, { t: 0.88, gapSide: 'right' }]
                : [{ t: 0.25, gapSide: 'left' }, { t: 0.50, gapSide: 'right' }, { t: 0.75, gapSide: 'left' }]);

        hurdleConfigs.forEach(hc => {
            const pt = this.trackSpline.getPointAt(hc.t);
            const tangent = this.trackSpline.getTangentAt(hc.t).normalize();
            let normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
            if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);

            // Left & Right Electric Pylons
            const pylonGeo = new THREE.CylinderGeometry(1.2, 1.6, 12, 12);
            const pylonMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0033, emissiveIntensity: 0.8 });
            
            const lPylon = new THREE.Mesh(pylonGeo, pylonMat);
            lPylon.position.copy(pt).add(normal.clone().multiplyScalar(-trackWidth / 2)).add(new THREE.Vector3(0, 6, 0));
            this.scene.add(lPylon);

            const rPylon = new THREE.Mesh(pylonGeo, pylonMat);
            rPylon.position.copy(pt).add(normal.clone().multiplyScalar(trackWidth / 2)).add(new THREE.Vector3(0, 6, 0));
            this.scene.add(rPylon);

            // Pulsing Electric Laser Beam
            const beamWidth = trackWidth * 0.65;
            const beamGeo = new THREE.BoxGeometry(beamWidth, 2.0, 1.4);
            const beamMat = new THREE.MeshBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0.85 });
            const beamMesh = new THREE.Mesh(beamGeo, beamMat);

            let beamOffset = 0;
            let safeRange = [-0.3, 0.3];
            if (hc.gapSide === 'left') {
                beamOffset = (trackWidth * 0.2);
                safeRange = [-1.02, -0.15];
            } else if (hc.gapSide === 'right') {
                beamOffset = -(trackWidth * 0.2);
                safeRange = [0.15, 1.02];
            }

            beamMesh.position.copy(pt).add(normal.clone().multiplyScalar(beamOffset)).add(new THREE.Vector3(0, 2.5, 0));
            beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
            this.scene.add(beamMesh);

            this.hurdles.push({
                t: hc.t,
                mesh: beamMesh,
                safeRange: safeRange,
                lastHitTime: 0
            });
        });

        // Floating Start Arch
        const startPt = this.trackSpline.getPointAt(0);
        const startTangent = this.trackSpline.getTangentAt(0).normalize();
        const arch = new THREE.Mesh(
            new THREE.TorusGeometry(trackWidth * 0.85, 2.5, 8, 32, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0x112244, emissive: glowColor, emissiveIntensity: 0.6 })
        );
        arch.position.copy(startPt);
        arch.lookAt(startPt.clone().add(startTangent));
        this.scene.add(arch);

        // Floating Asteroids
        const rockGeo = new THREE.DodecahedronGeometry(25, 1);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9 });
        for (let i = 0; i < 35; i++) {
            const rock = new THREE.Mesh(rockGeo, rockMat);
            const t = Math.random();
            const pt = this.trackSpline.getPointAt(t);
            rock.position.copy(pt).add(new THREE.Vector3(
                (Math.random() - 0.5) * 500,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 500
            ));
            const s = 0.5 + Math.random() * 2.5;
            rock.scale.set(s, s, s);
            this.scene.add(rock);
            this.asteroids.push(rock);
        }
    }

    createVehicleMesh(vehicleData, isPlayer = false) {
        const group = new THREE.Group();
        const primaryColor = new THREE.Color(vehicleData.color || vehicleData.primary_color || 0x00f0ff);
        const secondaryColor = new THREE.Color(vehicleData.secondary_color || 0xff0077);
        const trailColor = new THREE.Color(vehicleData.trail_color || vehicleData.color || 0x00f0ff);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: primaryColor,
            metalness: 0.9,
            roughness: 0.2,
        });

        const trimMat = new THREE.MeshStandardMaterial({
            color: secondaryColor,
            metalness: 0.95,
            roughness: 0.15,
        });

        const canopyMat = new THREE.MeshStandardMaterial({
            color: 0x0a1020,
            metalness: 0.95,
            roughness: 0.1,
            transparent: true,
            opacity: 0.9
        });

        const flameMat = new THREE.MeshBasicMaterial({
            color: trailColor
        });

        const modelType = vehicleData.model_type || 'speeder';

        if (modelType === 'dart') {
            const noseGeo = new THREE.ConeGeometry(2.0, 10, 6);
            noseGeo.rotateX(Math.PI / 2);
            group.add(new THREE.Mesh(noseGeo, bodyMat));

            const wings = new THREE.Mesh(new THREE.BoxGeometry(9, 0.3, 4.0), trimMat);
            wings.position.set(0, 0, -1.5);
            group.add(wings);
        } else if (modelType === 'tanker') {
            const hull = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.0, 9.0), bodyMat);
            group.add(hull);

            const ram = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.5, 3.0), trimMat);
            ram.position.set(0, 0, 4.0);
            group.add(ram);
        } else if (modelType === 'hyperwing') {
            const fuselage = new THREE.Mesh(new THREE.ConeGeometry(2.6, 9.0, 6), bodyMat);
            fuselage.rotation.x = Math.PI / 2;
            group.add(fuselage);

            const lWing = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 3.2), trimMat);
            lWing.position.set(-4.0, 0, 1.0);
            lWing.rotation.y = 0.35;
            group.add(lWing);

            const rWing = lWing.clone();
            rWing.position.set(4.0, 0, 1.0);
            rWing.rotation.y = -0.35;
            group.add(rWing);
        } else {
            // Speeder
            const body = new THREE.Mesh(new THREE.ConeGeometry(2.8, 8.8, 6), bodyMat);
            body.rotation.x = Math.PI / 2;
            group.add(body);

            const wings = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.4, 3.5), trimMat);
            wings.position.set(0, 0, -1.6);
            group.add(wings);

            const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), canopyMat);
            canopy.scale.set(0.9, 0.7, 2.4);
            canopy.position.set(0, 1.0, 0.6);
            group.add(canopy);
        }

        // Dual Thruster Engines
        const thrusterGeo = new THREE.CylinderGeometry(0.75, 0.9, 1.8, 12);
        thrusterGeo.rotateX(Math.PI / 2);

        const lTh = new THREE.Mesh(thrusterGeo, trimMat);
        lTh.position.set(-1.4, 0.1, -4.0);
        group.add(lTh);

        const rTh = lTh.clone();
        rTh.position.set(1.4, 0.1, -4.0);
        group.add(rTh);

        // Animated Ion Exhaust Flames
        const flameGeo = new THREE.ConeGeometry(0.7, 3.5, 8);
        flameGeo.rotateX(-Math.PI / 2);

        const lFlame = new THREE.Mesh(flameGeo, flameMat);
        lFlame.position.set(-1.4, 0.1, -5.8);
        group.add(lFlame);

        const rFlame = lFlame.clone();
        rFlame.position.set(1.4, 0.1, -5.8);
        group.add(rFlame);

        if (isPlayer) {
            this.player.thrusterFires = [lFlame, rFlame];

            const shieldGeo = new THREE.SphereGeometry(5.5, 16, 16);
            const shieldMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.0,
                wireframe: true
            });
            this.player.shieldGlow = new THREE.Mesh(shieldGeo, shieldMat);
            group.add(this.player.shieldGlow);
        }

        group.scale.set(1.2, 1.2, 1.2);
        return group;
    }

    buildAIOpponents() {
        let diffFactor = 0.97;
        if (this.difficulty === 'EASY') diffFactor = 0.86;
        if (this.difficulty === 'HARD') diffFactor = 1.08;

        const aiDefs = [
            { name: "Nova-7 [Hunter]", color: "#ff0077", trail_color: "#ff0077", speedFactor: 0.95 * diffFactor, offset: -0.4, model_type: 'dart' },
            { name: "Apex-V [Tactician]", color: "#00f0ff", trail_color: "#00f0ff", speedFactor: 0.98 * diffFactor, offset: 0.4, model_type: 'speeder' },
            { name: "Vortex-X [Apex Rival]", color: "#ffd700", trail_color: "#ffaa00", speedFactor: 0.93 * diffFactor, offset: 0.0, model_type: 'hyperwing' }
        ];

        this.aiRacers = aiDefs.map((def, idx) => {
            const mesh = this.createVehicleMesh(def);
            this.scene.add(mesh);
            return {
                name: def.name,
                mesh: mesh,
                speedFactor: def.speedFactor,
                speed: 120,
                maxSpeed: this.player.baseMaxSpeed * def.speedFactor,
                trackProgress: 0.012 + (idx * 0.008), // Starting grid slots
                lateralOffset: def.offset,
                targetOffset: def.offset,
                lap: 1,
                rollAngle: 0,
                color: def.color,
                isDrafting: false
            };
        });
    }

    updateVehicleTransform(entity) {
        if (!this.trackSpline || !entity.mesh) return;
        const t = (entity.trackProgress % 1.0 + 1.0) % 1.0;
        const pt = this.trackSpline.getPointAt(t);
        const tangent = this.trackSpline.getTangentAt(t).normalize();
        let normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
        if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);
        const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize();

        const trackWidth = 44;
        const lateralDist = entity.lateralOffset * (trackWidth * 0.42);
        const worldPos = pt.clone().add(normal.clone().multiplyScalar(lateralDist)).add(binormal.clone().multiplyScalar(1.5));

        entity.mesh.position.copy(worldPos);
        entity.mesh.lookAt(worldPos.clone().add(tangent));
        if (entity.rollAngle) {
            entity.mesh.rotateZ(entity.rollAngle);
        }

        return { worldPos, tangent, binormal, normal };
    }

    instantAlignCamera() {
        const tf = this.updateVehicleTransform(this.player);
        if (!tf) return;
        const camOffset = tf.tangent.clone().multiplyScalar(-20).add(tf.binormal.clone().multiplyScalar(6.5));
        this.camera.position.copy(tf.worldPos.clone().add(camOffset));
        this.camera.lookAt(tf.worldPos.clone().add(tf.tangent.clone().multiplyScalar(30)));
    }

    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (window.cosmicAudio) window.cosmicAudio.init();

            switch (e.code) {
                case 'KeyW': case 'ArrowUp':
                    this.keys.up = true; break;
                case 'KeyS': case 'ArrowDown':
                    this.keys.down = true; break;
                case 'KeyA': case 'ArrowLeft':
                    this.keys.left = true; break;
                case 'KeyD': case 'ArrowRight':
                    this.keys.right = true; break;
                case 'ShiftLeft': case 'ShiftRight':
                    this.keys.boost = true; break;
                case 'Space':
                    this.triggerInstantBoost(); break;
                case 'KeyC':
                    this.toggleCamera(); break;
                case 'KeyR':
                    this.resetVehicle(); break;
                case 'KeyM':
                    if (window.cosmicAudio) {
                        const s = window.cosmicAudio.toggleSound();
                        this.showNotification(s ? "Sound Enabled" : "Sound Muted");
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp':
                    this.keys.up = false; break;
                case 'KeyS': case 'ArrowDown':
                    this.keys.down = false; break;
                case 'KeyA': case 'ArrowLeft':
                    this.keys.left = false; break;
                case 'KeyD': case 'ArrowRight':
                    this.keys.right = false; break;
                case 'ShiftLeft': case 'ShiftRight':
                    this.keys.boost = false; break;
            }
        });

        // Mouse Drag Steering
        const onPointerMove = (clientX) => {
            const w = window.innerWidth;
            const normX = (clientX / w) * 2 - 1;
            this.pointerSteer = THREE.MathUtils.clamp(normX * 1.4, -1.0, 1.0);
        };

        this.container.addEventListener('mousedown', (e) => {
            if (window.cosmicAudio) window.cosmicAudio.init();
            this.isPointerDown = true;
            onPointerMove(e.clientX);
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPointerDown) {
                onPointerMove(e.clientX);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isPointerDown = false;
            this.pointerSteer = 0;
        });

        // Touch Steering on Canvas
        this.container.addEventListener('touchstart', (e) => {
            if (window.cosmicAudio) window.cosmicAudio.init();
            if (e.touches.length > 0) {
                this.isPointerDown = true;
                onPointerMove(e.touches[0].clientX);
            }
        }, { passive: false });

        this.container.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.isPointerDown = true;
                onPointerMove(e.touches[0].clientX);
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            this.isPointerDown = false;
            this.pointerSteer = 0;
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
            this.keys.boost = false;
        });

        window.addEventListener('touchcancel', () => {
            this.isPointerDown = false;
            this.pointerSteer = 0;
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
            this.keys.boost = false;
        });

        // Touch & Click On-Screen Buttons
        this.bindTouchButton('btn-touch-accel', 'up');
        this.bindTouchButton('btn-touch-brake', 'down');
        this.bindTouchButton('btn-touch-left', 'left');
        this.bindTouchButton('btn-touch-right', 'right');
        this.bindTouchButton('btn-touch-boost', 'boost');

        const boostBtn = document.getElementById('btn-touch-boost');
        if (boostBtn) {
            boostBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.triggerInstantBoost();
            });
            boostBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerInstantBoost();
            }, { passive: false });
        }

        // Global mouseup release safety
        window.addEventListener('mouseup', () => {
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
            this.keys.boost = false;
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (!this.renderer || !this.camera) return;
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    bindTouchButton(id, keyName) {
        const btn = document.getElementById(id);
        if (!btn) return;
        const setKey = (val) => {
            if (window.cosmicAudio) window.cosmicAudio.init();
            this.keys[keyName] = val;
            if (val && navigator.vibrate) {
                try { navigator.vibrate(35); } catch(err) {}
            }
        };

        btn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); setKey(true); }, { passive: false });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); setKey(false); }, { passive: false });
        btn.addEventListener('touchcancel', (e) => { e.preventDefault(); e.stopPropagation(); setKey(false); }, { passive: false });
        btn.addEventListener('mousedown', (e) => { e.preventDefault(); setKey(true); });
        btn.addEventListener('mouseup', (e) => { e.preventDefault(); setKey(false); });

        // Immediate click nudge
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (keyName === 'left') {
                this.player.lateralOffset = Math.max(-1.02, this.player.lateralOffset - 0.28);
                this.player.rollAngle = 0.4;
            } else if (keyName === 'right') {
                this.player.lateralOffset = Math.min(1.02, this.player.lateralOffset + 0.28);
                this.player.rollAngle = -0.4;
            } else if (keyName === 'up') {
                this.player.speed = Math.min(this.player.maxSpeed * 1.3, this.player.speed + 40);
            }
        });
    }

    triggerInstantBoost() {
        if (this.player.boost >= 20) {
            this.player.boost = Math.max(0, this.player.boost - 30);
            this.player.speed = Math.min(this.player.maxSpeed * 1.45, this.player.speed + 90);
            if (window.cosmicAudio) window.cosmicAudio.playBoost();
            this.showNotification("WARP NITRO ENGAGED!");
        } else {
            this.showNotification("Nitro Charging...");
        }
    }

    toggleCamera() {
        this.cameraMode = (this.cameraMode + 1) % 3;
        const names = ["Dynamic Chase", "Close Action", "Cockpit Cam"];
        this.showNotification(`View: ${names[this.cameraMode]}`);
    }

    resetVehicle() {
        this.player.lateralOffset = 0;
        this.player.speed = 140;
        this.showNotification("Position Re-aligned");
    }

    showNotification(msg) {
        const notif = document.getElementById('hud-notification');
        if (!notif) return;
        notif.textContent = msg;
        notif.style.opacity = '1';
        clearTimeout(this.notifTimeout);
        this.notifTimeout = setTimeout(() => {
            notif.style.opacity = '0';
        }, 1400);
    }

    updatePlayer(delta) {
        if (this.isFinished) return;

        // Auto Cruise + Boost + Brake
        const isBoosting = this.keys.boost && this.player.boost > 5;
        if (isBoosting) {
            this.player.boost = Math.max(0, this.player.boost - delta * 30);
            this.player.isBoosting = true;
            if (window.cosmicAudio) window.cosmicAudio.playBoost();
        } else {
            this.player.isBoosting = false;
            this.player.boost = Math.min(this.player.maxBoost, this.player.boost + delta * 9);
        }

        const effectiveMax = isBoosting ? this.player.maxSpeed * 1.38 : this.player.maxSpeed;

        if (this.keys.down) {
            this.player.speed = THREE.MathUtils.lerp(this.player.speed, 60, delta * 3.5);
        } else if (this.keys.up) {
            this.player.speed = THREE.MathUtils.lerp(this.player.speed, effectiveMax, delta * 3.0);
        } else {
            // Auto cruise maintains standard high speed
            this.player.speed = THREE.MathUtils.lerp(this.player.speed, effectiveMax * 0.9, delta * 1.5);
        }

        // Steering
        let steerInput = 0;
        if (this.keys.left) steerInput -= 1;
        if (this.keys.right) steerInput += 1;
        if (this.isPointerDown && this.pointerSteer !== 0) {
            steerInput = this.pointerSteer;
        }

        const steerSpeed = this.player.handling * delta * 1.35;
        this.player.lateralOffset = THREE.MathUtils.clamp(
            this.player.lateralOffset + (steerInput * steerSpeed),
            -1.02, 1.02
        );

        // Magnetic centering assist
        if (steerInput === 0) {
            this.player.lateralOffset = THREE.MathUtils.lerp(this.player.lateralOffset, 0, delta * 0.35);
        }

        // Banking roll
        this.player.rollAngle = THREE.MathUtils.lerp(this.player.rollAngle, -steerInput * 0.45, delta * 7.5);

        // Boundary collision check
        if (Math.abs(this.player.lateralOffset) >= 0.98) {
            this.player.speed *= 0.985;
            this.player.shield = Math.max(0, this.player.shield - delta * 10);
            if (this.player.shieldGlow) this.player.shieldGlow.material.opacity = 0.4;
            if (Math.random() < 0.1 && window.cosmicAudio) window.cosmicAudio.playCrash();
        } else {
            if (this.player.shieldGlow) this.player.shieldGlow.material.opacity = 0.0;
        }

        // Advance track progress
        const speedWorldUnits = (this.player.speed * 0.2778) * delta * 1.6;
        this.player.trackProgress += (speedWorldUnits / this.trackLength);

        if (this.player.trackProgress >= 1.0) {
            this.player.trackProgress -= 1.0;
            this.onLapCompleted();
        }

        // Position vessel in 3D
        const tf = this.updateVehicleTransform(this.player);

        // Animated Thruster exhaust flame modulation
        const flameScale = 0.7 + (this.player.speed / this.player.maxSpeed) * (isBoosting ? 3.0 : 1.3);
        this.player.thrusterFires.forEach(flame => {
            flame.scale.set(1, flameScale, 1);
        });

        // Speed Pad trigger
        const t = (this.player.trackProgress % 1.0 + 1.0) % 1.0;
        this.speedPads.forEach(pad => {
            if (Math.abs(t - pad.t) < 0.010 && Math.abs(this.player.lateralOffset) < 0.75) {
                this.player.speed = Math.min(this.player.maxSpeed * 1.55, this.player.speed + 80);
                this.player.boost = Math.min(this.player.maxBoost, this.player.boost + 40);
                if (window.cosmicAudio) window.cosmicAudio.playSpeedPad();
                if (navigator.vibrate) navigator.vibrate(50);
                this.showNotification("HYPER SPEED PAD!");
            }
        });

        // Dynamic Hurdle Collision Trigger
        const nowMs = performance.now();
        this.hurdles.forEach(h => {
            if (Math.abs(t - h.t) < 0.009 && (nowMs - h.lastHitTime > 1500)) {
                const isSafe = (this.player.lateralOffset >= h.safeRange[0] && this.player.lateralOffset <= h.safeRange[1]);
                if (!isSafe) {
                    h.lastHitTime = nowMs;
                    this.player.shield = Math.max(0, this.player.shield - 20);
                    this.player.speed = Math.max(60, this.player.speed * 0.72);
                    if (this.player.shieldGlow) this.player.shieldGlow.material.opacity = 0.8;
                    if (window.cosmicAudio) window.cosmicAudio.playCrash();
                    if (navigator.vibrate) navigator.vibrate(120);
                    this.showNotification("⚡ LASER HURDLE COLLISION! -20 SHIELD");
                }
            }
        });

        // Audio update
        if (window.cosmicAudio) {
            window.cosmicAudio.updateEngine(this.player.speed / this.player.maxSpeed, this.player.isBoosting);
        }

        // Camera Follower
        if (tf) {
            this.updateCamera(tf.worldPos, tf.tangent, tf.binormal, delta);
        }
    }

    updateCamera(shipPos, tangent, binormal, delta) {
        let camOffset;
        let lookTarget;

        if (this.cameraMode === 2) {
            // Cockpit Cam
            camOffset = tangent.clone().multiplyScalar(1.6).add(binormal.clone().multiplyScalar(1.4));
            lookTarget = shipPos.clone().add(tangent.clone().multiplyScalar(60));
        } else if (this.cameraMode === 1) {
            // Close Action Cam
            camOffset = tangent.clone().multiplyScalar(-11).add(binormal.clone().multiplyScalar(3.8));
            lookTarget = shipPos.clone().add(tangent.clone().multiplyScalar(25));
        } else {
            // Dynamic Chase Cam
            camOffset = tangent.clone().multiplyScalar(-19).add(binormal.clone().multiplyScalar(6.0));
            lookTarget = shipPos.clone().add(tangent.clone().multiplyScalar(30));
        }

        const targetCamPos = shipPos.clone().add(camOffset);
        this.camera.position.lerp(targetCamPos, delta * 9.5);
        this.camera.lookAt(lookTarget);

        const targetFOV = this.player.isBoosting ? 84 : (65 + (this.player.speed / this.player.maxSpeed) * 10);
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, delta * 4.5);
        this.camera.updateProjectionMatrix();

        if (this.warpLines) {
            this.warpGroup.position.copy(shipPos);
            this.warpLines.material.opacity = this.player.isBoosting ? 0.75 : 0;
        }
    }

    updateAI(delta) {
        if (this.isFinished) return;

        this.aiRacers.forEach(ai => {
            // Competitive Slipstream Drafting: If behind player, get draft acceleration boost and steer to overtake!
            const distBehind = this.player.trackProgress - ai.trackProgress;
            let targetSpeed = ai.maxSpeed;
            if (distBehind > 0 && distBehind < 0.035 && Math.abs(ai.lateralOffset - this.player.lateralOffset) < 0.4) {
                targetSpeed = ai.maxSpeed * 1.14; // Slipstream draft boost!
                if (Math.random() < 0.05) {
                    ai.targetOffset = this.player.lateralOffset > 0 ? -0.55 : 0.55; // Steer into clear lane to pass!
                }
            }

            ai.speed = THREE.MathUtils.lerp(ai.speed, targetSpeed, delta * 1.6);
            const speedUnits = (ai.speed * 0.2778) * delta * 1.6;
            ai.trackProgress += (speedUnits / this.trackLength);

            if (ai.trackProgress >= 1.0) {
                ai.trackProgress -= 1.0;
                ai.lap++;
            }

            if (Math.random() < 0.02) {
                ai.targetOffset = (Math.random() - 0.5) * 1.2;
            }
            ai.lateralOffset = THREE.MathUtils.lerp(ai.lateralOffset, ai.targetOffset, delta * 0.7);

            this.updateVehicleTransform(ai);
        });

        this.calculateRankings();
    }

    calculateRankings() {
        const competitors = [
            { isPlayer: true, score: this.player.lap * 10.0 + this.player.trackProgress },
            ...this.aiRacers.map(ai => ({ isPlayer: false, score: ai.lap * 10.0 + ai.trackProgress }))
        ];

        competitors.sort((a, b) => b.score - a.score);
        this.player.position = competitors.findIndex(c => c.isPlayer) + 1;
    }

    onLapCompleted() {
        const now = performance.now();
        const lapDuration = now - this.player.lapStartTime;
        this.player.lapStartTime = now;

        if (lapDuration < this.player.bestLapMs) {
            this.player.bestLapMs = lapDuration;
        }

        const isFinalLap = this.player.lap === this.player.maxLaps;
        if (window.cosmicAudio) window.cosmicAudio.playCheckpoint(isFinalLap);

        if (this.player.lap >= this.player.maxLaps) {
            this.finishRace();
        } else {
            this.player.lap++;
            this.showNotification(`LAP ${this.player.lap} / ${this.player.maxLaps}`);
        }
    }

    finishRace() {
        this.isFinished = true;
        this.player.totalTimeMs = Math.round(performance.now() - this.player.totalStartTime);

        if (window.cosmicAudio) {
            window.cosmicAudio.stopEngine();
        }

        this.submitRaceResult();
    }

    async submitRaceResult() {
        const payload = {
            track_id: this.trackConfig.id,
            total_time_ms: this.player.totalTimeMs,
            best_lap_ms: Math.round(this.player.bestLapMs),
            position: this.player.position,
            max_speed: Math.round(this.player.maxSpeed),
            difficulty: this.difficulty,
            mode: 'GRAND_PRIX'
        };

        const csrfToken = this.getCsrfToken();

        try {
            const resp = await fetch('/api/race/finish/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();
            this.showVictoryModal(data);
        } catch (err) {
            this.showVictoryModal({
                success: true,
                position: this.player.position,
                credits_earned: this.player.position === 1 ? this.trackConfig.first_reward : 600,
                xp_earned: this.trackConfig.xp_reward || 350,
                formatted_time: this.formatTime(this.player.totalTimeMs),
                formatted_best_lap: this.formatTime(this.player.bestLapMs),
                unlocked_achievements: []
            });
        }
    }

    showVictoryModal(result) {
        const modal = document.getElementById('victory-modal');
        if (!modal) return;

        const titleEl = document.getElementById('modal-title');
        const posEl = document.getElementById('modal-position');
        const timeEl = document.getElementById('modal-time');
        const bestLapEl = document.getElementById('modal-best-lap');
        const creditsEl = document.getElementById('modal-credits');
        const xpEl = document.getElementById('modal-xp');
        const achList = document.getElementById('modal-achievements');

        const posSuffix = ['ST', 'ND', 'RD', 'TH'][Math.min(3, (result.position || this.player.position) - 1)];
        if (posEl) posEl.textContent = `${result.position || this.player.position}${posSuffix} PLACE`;
        if (titleEl) {
            titleEl.textContent = result.position === 1 ? "CHAMPION VICTORY!" : (result.position <= 3 ? "PODIUM FINISH!" : "RACE COMPLETED");
        }
        if (timeEl) timeEl.textContent = result.formatted_time || this.formatTime(this.player.totalTimeMs);
        if (bestLapEl) bestLapEl.textContent = result.formatted_best_lap || this.formatTime(this.player.bestLapMs);
        if (creditsEl) creditsEl.textContent = `+${result.credits_earned || 0}`;
        if (xpEl) xpEl.textContent = `+${result.xp_earned || 0} XP`;

        if (achList) {
            achList.innerHTML = '';
            if (result.unlocked_achievements && result.unlocked_achievements.length > 0) {
                result.unlocked_achievements.forEach(ach => {
                    const div = document.createElement('div');
                    div.className = 'achievement-unlocked-card';
                    div.innerHTML = `<strong><i class="fa fa-trophy"></i> Achievement Unlocked: ${ach.title}</strong><p>${ach.description} (+${ach.reward} Credits)</p>`;
                    achList.appendChild(div);
                });
            }
        }

        modal.classList.add('active');
    }

    updateHUD() {
        const speedEl = document.getElementById('hud-speed');
        if (speedEl) speedEl.textContent = Math.round(this.player.speed);

        const posEl = document.getElementById('hud-position');
        if (posEl) {
            const suffix = ['ST', 'ND', 'RD', 'TH'][Math.min(3, this.player.position - 1)];
            posEl.textContent = `${this.player.position}${suffix}`;
        }

        const lapEl = document.getElementById('hud-lap');
        if (lapEl) lapEl.textContent = `${Math.min(this.player.maxLaps, this.player.lap)} / ${this.player.maxLaps}`;

        if (!this.isFinished) {
            const now = performance.now();
            const currentLapDuration = now - this.player.lapStartTime;
            const lapTimerEl = document.getElementById('hud-lap-time');
            if (lapTimerEl) lapTimerEl.textContent = this.formatTime(currentLapDuration);

            const totalTimeEl = document.getElementById('hud-total-time');
            if (totalTimeEl) totalTimeEl.textContent = this.formatTime(now - this.player.totalStartTime);
        }

        const shieldBar = document.getElementById('hud-shield-fill');
        if (shieldBar) {
            const shieldPct = Math.max(0, Math.min(100, (this.player.shield / this.player.maxShield) * 100));
            shieldBar.style.width = `${shieldPct}%`;
        }

        const boostBar = document.getElementById('hud-boost-fill');
        if (boostBar) {
            const boostPct = Math.max(0, Math.min(100, (this.player.boost / this.player.maxBoost) * 100));
            boostBar.style.width = `${boostPct}%`;
        }

        this.renderMinimap();
    }

    renderMinimap() {
        if (!this.minimapCtx || !this.trackSpline) return;
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const bounds = 2500;
        const toScreen = (x, z) => ({
            x: (x / bounds) * (w * 0.42) + w / 2,
            y: (z / bounds) * (h * 0.42) + h / 2
        });

        // Track Path
        ctx.strokeStyle = "rgba(0, 240, 255, 0.45)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
            const t = i / 60;
            const pt = this.trackSpline.getPointAt(t);
            const p = toScreen(pt.x, pt.z);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();

        // AI opponent dots
        this.aiRacers.forEach(ai => {
            const pt = ai.mesh.position;
            const p = toScreen(pt.x, pt.z);
            ctx.fillStyle = ai.color || "#ff0055";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Player dot with neon green glow
        const playerPt = this.player.mesh.position;
        const pp = toScreen(playerPt.x, playerPt.z);
        ctx.fillStyle = "#00ff88";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    formatTime(ms) {
        if (!ms || ms === Infinity) return "--:--.---";
        const totalSec = ms / 1000;
        const minutes = Math.floor(totalSec / 60);
        const seconds = Math.floor(totalSec % 60);
        const millis = Math.floor(ms % 1000);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
    }

    getCsrfToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(this.clock.getDelta(), 0.08);

        this.asteroids.forEach(rock => {
            rock.rotation.x += delta * 0.15;
            rock.rotation.y += delta * 0.2;
        });

        this.updatePlayer(delta);
        this.updateAI(delta);
        this.updateHUD();

        this.renderer.render(this.scene, this.camera);
    }
}
