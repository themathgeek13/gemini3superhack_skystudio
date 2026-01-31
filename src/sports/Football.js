import * as THREE from 'three';
import { Config } from '../core/Config.js';

export class Football {
    constructor(scene, physicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;

        // Visual mesh - football is ellipsoid, not sphere
        this.mesh = this.createFootballMesh();
        this.scene.add(this.mesh);

        // Physics body (simplified as sphere for physics)
        const startPos = { x: 0, y: 2, z: 0 };
        this.rigidBody = physicsManager.createBallBody(startPos);

        // Trail effect
        this.trail = [];
        this.trailMesh = null;
        this.createTrail();

        // Rotation for spiral effect
        this.spinSpeed = 0;
        this.spinAxis = new THREE.Vector3(1, 0, 0);

        // Out of bounds tracking
        this.outOfBounds = false;

        // Give initial impulse (simulate kickoff)
        this.kickoff();
    }

    createFootballMesh() {
        // Create football shape (prolate spheroid)
        const geometry = new THREE.SphereGeometry(Config.BALL.radius, 16, 16);

        // Stretch to make football shape
        geometry.scale(1, 1, 1.6);

        // Brown leather material with laces texture
        const material = new THREE.MeshStandardMaterial({
            color: Config.BALL.color,
            roughness: 0.8,
            metalness: 0.1,
            map: this.createLeatherTexture()
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        mesh.userData.isBall = true;  // Mark for point cloud sampling

        // Add white laces
        this.addLaces(mesh);

        return mesh;
    }

    createLeatherTexture() {
        // Simplified texture
        const texture = new THREE.DataTexture(
            new Uint8Array([107, 68, 35, 255]),
            1, 1,
            THREE.RGBAFormat
        );
        return texture;
    }

    addLaces(mesh) {
        // White laces on top of football
        const laceGeometry = new THREE.BoxGeometry(0.01, 0.003, 0.06);
        const laceMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        for (let i = 0; i < 4; i++) {
            const lace = new THREE.Mesh(laceGeometry, laceMaterial);
            lace.position.set(0, Config.BALL.radius + 0.001, -0.08 + i * 0.05);
            mesh.add(lace);
        }

        // Center stripe
        const stripeGeometry = new THREE.BoxGeometry(0.01, 0.002, 0.15);
        const stripe = new THREE.Mesh(stripeGeometry, laceMaterial);
        stripe.position.set(0, Config.BALL.radius + 0.001, 0);
        mesh.add(stripe);
    }

    createTrail() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: 0x8B4513,  // Brown trail
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
        let pos = this.physicsManager.getPosition(this.rigidBody);

        // ENFORCE FIELD BOUNDARIES - keep ball on field
        const fieldHalfWidth = 24.4;   // Half of 48.8m width
        const fieldHalfLength = 54.85;  // Half of 109.7m length

        let ballOutOfBounds = false;

        if (Math.abs(pos.x) > fieldHalfWidth || Math.abs(pos.z) > fieldHalfLength) {
            ballOutOfBounds = true;
        }

        // If ball goes out of bounds, mark it for reset
        if (ballOutOfBounds) {
            this.outOfBounds = true;
        }

        // Clamp position to field
        pos.x = Math.max(-fieldHalfWidth, Math.min(fieldHalfWidth, pos.x));
        pos.z = Math.max(-fieldHalfLength, Math.min(fieldHalfLength, pos.z));

        this.mesh.position.set(pos.x, pos.y, pos.z);
        this.physicsManager.setPosition(this.rigidBody, pos);

        // Spin the football for realistic spiral
        this.mesh.rotateOnAxis(this.spinAxis, this.spinSpeed * deltaTime);

        // Update trail
        this.trail.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        if (this.trail.length > Config.EFFECTS.trailLength) {
            this.trail.shift();
        }

        if (this.trailMesh && this.trail.length > 1) {
            this.trailMesh.geometry.setFromPoints(this.trail);
        }

        // Slow down spin over time (air resistance)
        this.spinSpeed *= 0.99;
    }

    isOutOfBounds() {
        return this.outOfBounds || false;
    }

    clearOutOfBounds() {
        this.outOfBounds = false;
    }

    kickoff() {
        // Simulate kickoff - high arcing kick from 35-yard line
        const kickZ = -30;  // About 35-yard line
        this.physicsManager.setPosition(this.rigidBody, { x: 0, y: 0.5, z: kickZ });

        // High arcing kickoff
        this.physicsManager.setVelocity(this.rigidBody, { x: 0, y: 0, z: 0 });
        this.physicsManager.applyImpulse(
            this.rigidBody,
            { x: (Math.random() - 0.5) * 3, y: 12, z: 50 }
        );
        this.spinSpeed = 18;  // Fast end-over-end spiral
        this.spinAxis.set(0, 0.1, 1).normalize();
    }

    startNewPlay() {
        // Simulate various football plays
        const playTypes = ['pass', 'run', 'punt', 'fieldgoal'];
        const play = playTypes[Math.floor(Math.random() * playTypes.length)];

        switch(play) {
            case 'pass':
                // Forward pass
                this.physicsManager.setPosition(this.rigidBody, {
                    x: Math.random() * 10 - 5,
                    y: 2,
                    z: Math.random() * 20 - 10
                });
                this.physicsManager.applyImpulse(
                    this.rigidBody,
                    { x: Math.random() * 3 - 1.5, y: 6, z: 15 }
                );
                this.spinSpeed = 20;  // Tight spiral
                break;

            case 'run':
                // Running play - low trajectory
                this.physicsManager.setPosition(this.rigidBody, {
                    x: Math.random() * 5,
                    y: 1,
                    z: 0
                });
                this.physicsManager.applyImpulse(
                    this.rigidBody,
                    { x: Math.random() * 2 - 1, y: 2, z: 8 }
                );
                this.spinSpeed = 5;  // Tumbling
                break;

            case 'punt':
                // High punt
                this.physicsManager.setPosition(this.rigidBody, {
                    x: 0,
                    y: 1.5,
                    z: -20
                });
                this.physicsManager.applyImpulse(
                    this.rigidBody,
                    { x: 0, y: 12, z: 25 }
                );
                this.spinSpeed = 10;
                break;

            case 'fieldgoal':
                // Field goal attempt
                this.physicsManager.setPosition(this.rigidBody, {
                    x: 0,
                    y: 0.5,
                    z: -30
                });
                this.physicsManager.applyImpulse(
                    this.rigidBody,
                    { x: 0, y: 10, z: 35 }
                );
                this.spinSpeed = 18;
                break;
        }

        // Random spin axis
        this.spinAxis.set(
            Math.random() * 0.3,
            Math.random() * 0.3,
            1
        ).normalize();
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
        this.kickoff();
        this.trail = [];
    }
}
