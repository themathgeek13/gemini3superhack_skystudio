import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { MathUtils } from '../utils/MathUtils.js';

export class DroneAI {
    constructor() {
        this.config = Config.DRONE;
    }

    calculateForces(drone, allDrones, targetPosition) {
        const forces = new THREE.Vector3();

        // 1. Attraction to target (ball) - lateral movement only
        const attractionForce = this.calculateAttractionForce(
            drone.getPosition(),
            targetPosition
        );
        forces.add(attractionForce);

        // 2. Repulsion from other drones
        const repulsionForce = this.calculateRepulsionForce(drone, allDrones);
        forces.add(repulsionForce);

        // 3. Boundary avoidance
        const boundaryForce = this.calculateBoundaryForce(drone.getPosition());
        forces.add(boundaryForce);

        // 4. Vertical tracking with damping (smooth height control)
        const verticalForce = this.calculateVerticalForce(
            drone.getPosition(),
            targetPosition
        );
        forces.y += verticalForce;

        // 5. Random noise for variety
        const noiseForce = MathUtils.randomVector3(this.config.randomNoiseScale);
        forces.add(noiseForce);

        return forces;
    }

    calculateAttractionForce(dronePos, targetPos) {
        const direction = new THREE.Vector3()
            .subVectors(targetPos, dronePos)
            .normalize();

        // Add vertical offset so drones fly above the action
        const heightOffset = this.config.minHeight + Math.random() *
            (this.config.maxHeight - this.config.minHeight);

        const targetWithHeight = targetPos.clone();
        targetWithHeight.y = heightOffset;

        const toTarget = new THREE.Vector3()
            .subVectors(targetWithHeight, dronePos);

        const distance = toTarget.length();
        const force = toTarget.normalize().multiplyScalar(
            this.config.ballAttractionForce * Math.min(distance / 5, 1)
        );

        return force;
    }

    calculateRepulsionForce(drone, allDrones) {
        const repulsion = new THREE.Vector3();
        const dronePos = drone.getPosition();

        allDrones.forEach(otherDrone => {
            if (otherDrone.id === drone.id || !otherDrone.active) return;

            const otherPos = otherDrone.getPosition();
            const distance = MathUtils.distance3D(dronePos, otherPos);

            if (distance < this.config.repulsionRadius && distance > 0.01) {
                const repulsionDir = new THREE.Vector3()
                    .subVectors(dronePos, otherPos)
                    .normalize();

                // Aggressive repulsion: squared falloff for much stronger near-field repulsion
                const normalizedDist = distance / this.config.repulsionRadius;
                const repulsionMagnitude = this.config.repulsionForce *
                    Math.pow(1 - normalizedDist, 2);  // Squared falloff = stronger nearby

                repulsion.add(repulsionDir.multiplyScalar(repulsionMagnitude));
            }
        });

        return repulsion;
    }

    calculateBoundaryForce(position) {
        const force = new THREE.Vector3();

        // HARD LIMIT: Distance from field center (0, 0, 0)
        const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
        const maxDistance = this.config.maxDistanceFromCenter || 40.0;

        if (distanceFromCenter > maxDistance) {
            // Strong repulsion force toward center
            const toCenter = new THREE.Vector3(-position.x, 0, -position.z).normalize();
            const overDistance = distanceFromCenter - maxDistance;
            const repulsionMagnitude = this.config.boundaryForce * (1 + overDistance / 10);
            force.add(toCenter.multiplyScalar(repulsionMagnitude));
        }

        // HARD LIMIT: Minimum height (stay above players)
        if (position.y < this.config.minHeight) {
            const underHeight = this.config.minHeight - position.y;
            force.y = this.config.boundaryForce * (1 + underHeight);
        }

        // HARD LIMIT: Maximum height (stay visible and focused)
        if (position.y > this.config.maxHeight) {
            const overHeight = position.y - this.config.maxHeight;
            force.y = -this.config.boundaryForce * (1 + overHeight);
        }

        return force;
    }

    calculateVerticalForce(position, targetPosition) {
        // Minimal vertical force - hard constraints handle boundaries
        // Target height: aim for upper-middle range for good field overview
        const targetHeight = 9.0;  // Between minHeight (5m) and maxHeight (12m)
        const heightError = targetHeight - position.y;

        // Small proportional gain - gentle pull toward target
        const controlForce = heightError * 0.08;

        // Very minimal gravity compensation
        const gravityComp = Math.abs(Config.PHYSICS.gravity.y) * 0.2;

        return gravityComp + controlForce;
    }

    // Calculate optimal distribution for fleet
    calculateFleetPositions(count, centerPosition) {
        const positions = [];
        const radius = 5;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const height = this.config.minHeight +
                (i / count) * (this.config.maxHeight - this.config.minHeight);

            positions.push(new THREE.Vector3(
                centerPosition.x + Math.cos(angle) * radius,
                height,
                centerPosition.z + Math.sin(angle) * radius
            ));
        }

        return positions;
    }
}
