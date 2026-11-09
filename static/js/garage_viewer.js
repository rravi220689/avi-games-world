/**
 * The Hangar 3D Vehicle Showcase & Customizer
 * Robust, standalone 3D renderer for inspecting and customizing space craft.
 */
class HangarViewer {
    constructor(canvasId) {
        this.container = document.getElementById(canvasId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentMesh = null;
        this.rotSpeed = 0.01;
        this.isInteracting = false;
        this.prevMouseX = 0;

        this.init();
    }

    init() {
        const w = this.container.clientWidth || 600;
        const h = this.container.clientHeight || 450;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        this.camera.position.set(0, 5, 16);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Studio lighting
        const ambient = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(10, 15, 10);
        this.scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.5);
        rimLight.position.set(-10, -5, -10);
        this.scene.add(rimLight);

        // Pedestal Platform
        const platformGeo = new THREE.CylinderGeometry(6.5, 7.0, 0.5, 32);
        const platformMat = new THREE.MeshStandardMaterial({
            color: 0x111633,
            metalness: 0.9,
            roughness: 0.2
        });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.y = -1.5;
        this.scene.add(platform);

        // Glowing Neon Ring on pedestal
        const ringGeo = new THREE.RingGeometry(6.0, 6.4, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -1.24;
        this.scene.add(ring);

        // Interaction
        this.container.addEventListener('mousedown', (e) => {
            this.isInteracting = true;
            this.prevMouseX = e.clientX;
        });
        window.addEventListener('mouseup', () => { this.isInteracting = false; });
        window.addEventListener('mousemove', (e) => {
            if (this.isInteracting && this.currentMesh) {
                const deltaX = e.clientX - this.prevMouseX;
                this.currentMesh.rotation.y += deltaX * 0.012;
                this.prevMouseX = e.clientX;
            }
        });

        // Touch Interaction
        this.container.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.isInteracting = true;
                this.prevMouseX = e.touches[0].clientX;
            }
        }, { passive: true });
        window.addEventListener('touchend', () => { this.isInteracting = false; });
        window.addEventListener('touchmove', (e) => {
            if (this.isInteracting && this.currentMesh && e.touches.length > 0) {
                const deltaX = e.touches[0].clientX - this.prevMouseX;
                this.currentMesh.rotation.y += deltaX * 0.012;
                this.prevMouseX = e.touches[0].clientX;
            }
        }, { passive: true });

        // Resize
        window.addEventListener('resize', () => {
            if (!this.renderer || !this.camera) return;
            const nw = this.container.clientWidth;
            const nh = this.container.clientHeight;
            this.camera.aspect = nw / nh;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(nw, nh);
        });

        this.animate();
    }

    loadVehicle(modelType, primaryColor, secondaryColor, trailColor) {
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
        }

        const group = new THREE.Group();
        const primaryCol = new THREE.Color(primaryColor || 0x00f0ff);
        const secondaryCol = new THREE.Color(secondaryColor || 0xff0077);
        const trailCol = new THREE.Color(trailColor || 0x00f0ff);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: primaryCol,
            metalness: 0.9,
            roughness: 0.2,
        });

        const trimMat = new THREE.MeshStandardMaterial({
            color: secondaryCol,
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
            color: trailCol
        });

        if (modelType === 'dart') {
            const nose = new THREE.Mesh(new THREE.ConeGeometry(2.0, 10, 6), bodyMat);
            nose.rotation.x = Math.PI / 2;
            group.add(nose);

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

        // Dual Thrusters
        const thrusterGeo = new THREE.CylinderGeometry(0.75, 0.9, 1.8, 12);
        thrusterGeo.rotateX(Math.PI / 2);
        const lTh = new THREE.Mesh(thrusterGeo, trimMat);
        lTh.position.set(-1.4, 0.1, -4.0);
        group.add(lTh);

        const rTh = lTh.clone();
        rTh.position.set(1.4, 0.1, -4.0);
        group.add(rTh);

        // Ion Flame Jets
        const flameGeo = new THREE.ConeGeometry(0.7, 3.5, 8);
        flameGeo.rotateX(-Math.PI / 2);
        const lFlame = new THREE.Mesh(flameGeo, flameMat);
        lFlame.position.set(-1.4, 0.1, -5.8);
        group.add(lFlame);

        const rFlame = lFlame.clone();
        rFlame.position.set(1.4, 0.1, -5.8);
        group.add(rFlame);

        group.scale.set(1.3, 1.3, 1.3);
        group.position.set(0, 0, 0);
        this.scene.add(group);
        this.currentMesh = group;
    }

    updateColors(primaryHex, trailHex) {
        if (!this.currentMesh) return;
        this.currentMesh.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.material.metalness !== undefined && child.material.metalness > 0.5) {
                    child.material.color.set(primaryHex);
                } else if (child.material.isMeshBasicMaterial) {
                    child.material.color.set(trailHex);
                }
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.currentMesh && !this.isInteracting) {
            this.currentMesh.rotation.y += this.rotSpeed;
            this.currentMesh.position.y = Math.sin(Date.now() * 0.002) * 0.15;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

window.HangarViewer = HangarViewer;
