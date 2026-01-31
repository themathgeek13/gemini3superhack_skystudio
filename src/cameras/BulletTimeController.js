import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { MathUtils } from '../utils/MathUtils.js';

export class BulletTimeController {
    constructor(canvas) {
        this.canvas = canvas;
        this.camera = new THREE.PerspectiveCamera(
            Config.CAMERA.fov,
            window.innerWidth / window.innerHeight,
            Config.CAMERA.near,
            Config.CAMERA.far
        );

        this.active = false;
        this.orbitProgress = 0;
        this.orbitSpeed = 0.3;
        this.orbitRadius = 8;
        this.orbitHeight = 3;
        this.focusPoint = new THREE.Vector3();
    }

    activate(focusPoint) {
        this.active = true;
        this.orbitProgress = 0;
        this.focusPoint.copy(focusPoint);

        // Set initial camera position
        this.updateCameraPosition();
    }

    deactivate() {
        this.active = false;
    }

    update(deltaTime) {
        if (!this.active) return;

        // Orbit around focus point
        this.orbitProgress += deltaTime * this.orbitSpeed;
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        const angle = this.orbitProgress * Math.PI * 2;

        const x = this.focusPoint.x + Math.cos(angle) * this.orbitRadius;
        const y = this.focusPoint.y + this.orbitHeight;
        const z = this.focusPoint.z + Math.sin(angle) * this.orbitRadius;

        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.focusPoint);
    }

    getCamera() {
        return this.camera;
    }

    isActive() {
        return this.active;
    }

    enable() {
        // Bullet time camera is controlled automatically
    }

    disable() {
        // Bullet time camera is controlled automatically
    }

    setOrbitSpeed(speed) {
        this.orbitSpeed = speed;
    }

    setOrbitRadius(radius) {
        this.orbitRadius = radius;
    }
}
