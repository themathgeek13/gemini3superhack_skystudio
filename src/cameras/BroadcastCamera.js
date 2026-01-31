import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { MathUtils } from '../utils/MathUtils.js';

export class BroadcastCamera {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(
            Config.CAMERA.fov,
            window.innerWidth / window.innerHeight,
            Config.CAMERA.near,
            Config.CAMERA.far
        );

        const pos = Config.CAMERA.broadcastPosition;
        this.camera.position.set(pos.x, pos.y, pos.z);
        this.camera.lookAt(0, 0, 0);

        this.trackingTarget = new THREE.Vector3(0, 2, 0);
        this.smoothFactor = 0.05;
    }

    update(deltaTime, ballPosition) {
        // Smooth tracking of ball
        this.trackingTarget.lerp(ballPosition, this.smoothFactor);

        // Keep camera at fixed position but rotate to follow ball
        this.camera.lookAt(this.trackingTarget);
    }

    getCamera() {
        return this.camera;
    }

    enable() {
        // No controls for broadcast camera
    }

    disable() {
        // No controls for broadcast camera
    }
}
