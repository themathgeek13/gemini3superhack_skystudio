import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Config } from '../core/Config.js';

export class FreeCamera {
    constructor(canvas) {
        this.canvas = canvas;
        this.camera = new THREE.PerspectiveCamera(
            Config.CAMERA.fov,
            window.innerWidth / window.innerHeight,
            Config.CAMERA.near,
            Config.CAMERA.far
        );

        const pos = Config.CAMERA.initialPosition;
        this.camera.position.set(pos.x, pos.y, pos.z);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.1;
        this.controls.target.set(0, 1, 0);  // Look slightly above field
        this.controls.minDistance = 15;
        this.controls.maxDistance = 150;
        this.controls.update();
    }

    update(deltaTime) {
        this.controls.update();
    }

    getCamera() {
        return this.camera;
    }

    enable() {
        this.controls.enabled = true;
    }

    disable() {
        this.controls.enabled = false;
    }

    lookAt(target) {
        this.controls.target.copy(target);
        this.controls.update();
    }
}
