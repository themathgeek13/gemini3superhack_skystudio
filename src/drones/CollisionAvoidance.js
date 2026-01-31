import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js';

export class CollisionAvoidance {
    constructor() {
        this.avoidanceRadius = 2.0;
        this.avoidanceForce = 8.0;
    }

    checkCollisions(drone, obstacles) {
        const dronePos = drone.getPosition();
        const avoidanceVector = new THREE.Vector3();

        obstacles.forEach(obstacle => {
            const obstaclePos = obstacle.getPosition();
            const distance = MathUtils.distance3D(dronePos, obstaclePos);

            if (distance < this.avoidanceRadius && distance > 0.1) {
                const awayDirection = new THREE.Vector3()
                    .subVectors(dronePos, obstaclePos)
                    .normalize();

                const forceMagnitude = this.avoidanceForce *
                    (1 - distance / this.avoidanceRadius);

                avoidanceVector.add(
                    awayDirection.multiplyScalar(forceMagnitude)
                );
            }
        });

        return avoidanceVector;
    }

    predictCollision(drone, others, lookaheadTime = 1.0) {
        // Simple collision prediction
        // Could be extended with velocity-based prediction
        const dronePos = drone.getPosition();

        for (const other of others) {
            if (other.id === drone.id) continue;

            const otherPos = other.getPosition();
            const distance = MathUtils.distance3D(dronePos, otherPos);

            if (distance < this.avoidanceRadius) {
                return true;
            }
        }

        return false;
    }
}
