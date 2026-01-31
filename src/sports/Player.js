import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';
import { MathUtils } from '../utils/MathUtils.js';

export class Player {
    constructor(scene, physicsManager, id, startPosition) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.id = id;

        // Visual mesh
        this.mesh = GeometryUtils.createPlayerModel();
        this.mesh.position.copy(startPosition);
        this.scene.add(this.mesh);

        // Physics body
        this.rigidBody = physicsManager.createPlayerBody(startPosition);

        // Movement
        this.targetPosition = startPosition.clone();
        this.speed = Config.PLAYER.speed;
        this.movementTimer = 0;
        this.movementPattern = Math.random() * Math.PI * 2;
    }

    update(deltaTime, ballPosition) {
        this.movementTimer += deltaTime;

        // Simple AI: move in patterns around the court
        if (this.movementTimer > 2.0) {
            this.movementTimer = 0;
            this.updateTargetPosition(ballPosition);
        }

        // Move towards target
        const currentPos = this.mesh.position;
        const direction = new THREE.Vector3()
            .subVectors(this.targetPosition, currentPos)
            .normalize();

        const newPos = currentPos.clone().add(
            direction.multiplyScalar(this.speed * deltaTime)
        );

        // Update position
        this.mesh.position.copy(newPos);
        if (this.rigidBody) {
            this.physicsManager.setPosition(this.rigidBody, newPos);
        }

        // Face movement direction
        if (direction.lengthSq() > 0.01) {
            this.mesh.lookAt(newPos.x + direction.x, newPos.y, newPos.z + direction.z);
        }
    }

    updateTargetPosition(ballPosition) {
        // Move somewhat towards ball with random offset
        const offset = MathUtils.randomVector3(3);
        this.targetPosition = new THREE.Vector3(
            MathUtils.clamp(ballPosition.x + offset.x, -6, 6),
            0,
            MathUtils.clamp(ballPosition.z + offset.z, -12, 12)
        );
    }

    getPosition() {
        return this.mesh.position.clone();
    }
}
