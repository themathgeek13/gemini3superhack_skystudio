import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';

export class Ball {
    constructor(scene, physicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;

        // Visual mesh
        this.mesh = GeometryUtils.createBall();
        this.scene.add(this.mesh);

        // Physics body
        const startPos = { x: 0, y: 5, z: 0 };
        this.rigidBody = physicsManager.createBallBody(startPos);

        // Trail effect
        this.trail = [];
        this.trailMesh = null;
        this.createTrail();

        // Give initial impulse
        this.physicsManager.applyImpulse(
            this.rigidBody,
            { x: Math.random() * 2 - 1, y: 3, z: Math.random() * 2 - 1 }
        );
    }

    createTrail() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: 0xFF6600,
            transparent: true,
            opacity: 0.5,
            linewidth: 2
        });

        this.trailMesh = new THREE.Line(geometry, material);
        this.scene.add(this.trailMesh);
    }

    update(deltaTime) {
        if (!this.rigidBody) return;

        // Sync mesh with physics
        const pos = this.physicsManager.getPosition(this.rigidBody);
        this.mesh.position.set(pos.x, pos.y, pos.z);

        // Update trail
        this.trail.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        if (this.trail.length > Config.EFFECTS.trailLength) {
            this.trail.shift();
        }

        if (this.trailMesh && this.trail.length > 1) {
            this.trailMesh.geometry.setFromPoints(this.trail);
        }

        // Random impulse occasionally to keep it moving
        if (Math.random() < 0.001) {
            this.physicsManager.applyImpulse(
                this.rigidBody,
                { x: Math.random() * 3 - 1.5, y: 2, z: Math.random() * 3 - 1.5 }
            );
        }
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    setTrailVisible(visible) {
        if (this.trailMesh) {
            this.trailMesh.visible = visible;
        }
    }

    reset() {
        this.physicsManager.setPosition(this.rigidBody, { x: 0, y: 5, z: 0 });
        this.physicsManager.setVelocity(this.rigidBody, { x: 0, y: 0, z: 0 });
        this.trail = [];
    }
}
