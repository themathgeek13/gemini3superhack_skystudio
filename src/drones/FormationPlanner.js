import * as THREE from 'three';
import { Config } from '../core/Config.js';

/**
 * Formation Planner based on "3D Human Reconstruction in the Wild with Collaborative Aerial Cameras"
 * (IROS 2021 - CMU AirLab)
 *
 * Implements centralized formation control that maintains optimal camera angles
 * for volumetric reconstruction while handling occlusions and obstacles.
 */
export class FormationPlanner {
    constructor() {
        // Formation parameters
        this.formationRadius = 15.0;  // meters from target
        this.optimalHeight = 12.0;     // optimal viewing height (increased from 8.0)
        this.minAngleSeparation = 30; // degrees between drones for coverage

        // Reconstruction quality parameters
        this.optimalElevationAngle = 35;  // degrees (good for human/player reconstruction)
        this.minElevationAngle = 20;
        this.maxElevationAngle = 60;

        // Dynamic parameters
        this.formationRotation = 0;  // Current rotation angle of formation
        this.rotationSpeed = 0.1;    // radians/second for adaptive rotation

        // Obstacle avoidance
        this.obstacleBuffer = 5.0;  // meters
        this.fieldBoundary = {
            x: Config.FIELD.width / 2,
            z: Config.FIELD.length / 2
        };
    }

    /**
     * Compute optimal formation positions for all drones
     * based on target positions (ball + key players)
     */
    planFormation(drones, ball, players, obstacles = []) {
        const droneCount = drones.length;
        const targetPosition = this.computeCentroid(ball, players);

        // Compute optimal viewing angles for maximum coverage
        const optimalPositions = this.computeOptimalViewpoints(
            targetPosition,
            droneCount
        );

        // Handle occlusions by adaptive rotation
        if (this.detectOcclusions(optimalPositions, targetPosition, obstacles)) {
            this.formationRotation += this.rotationSpeed * 0.016; // ~60fps
        }

        // Apply formation rotation
        const rotatedPositions = this.rotateFormation(
            optimalPositions,
            targetPosition,
            this.formationRotation
        );

        // Ensure positions are within field boundaries
        const validPositions = rotatedPositions.map(pos =>
            this.clampToFieldBoundary(pos)
        );

        return validPositions;
    }

    /**
     * Compute centroid of reconstruction targets (ball + active players)
     */
    computeCentroid(ball, players) {
        const positions = [ball];

        // Include players near the ball for focused reconstruction
        const ballPos = new THREE.Vector3(ball.x, ball.y, ball.z);
        players.forEach(player => {
            const playerPos = player.getPosition();
            if (ballPos.distanceTo(playerPos) < 20) {  // Within 20m of ball
                positions.push({
                    x: playerPos.x,
                    y: playerPos.y,
                    z: playerPos.z
                });
            }
        });

        const centroid = new THREE.Vector3(0, 0, 0);
        positions.forEach(pos => {
            centroid.x += pos.x;
            centroid.y += pos.y;
            centroid.z += pos.z;
        });
        centroid.divideScalar(positions.length);

        return centroid;
    }

    /**
     * Compute optimal viewpoint positions for reconstruction quality
     * Based on: maximizing baseline diversity + maintaining optimal elevation
     */
    computeOptimalViewpoints(target, droneCount) {
        const positions = [];
        const angleStep = (2 * Math.PI) / droneCount;

        for (let i = 0; i < droneCount; i++) {
            const azimuthAngle = i * angleStep;

            // Vary radius slightly for depth diversity
            const radiusVariation = Math.sin(i * 0.5) * 2.0;
            const radius = this.formationRadius + radiusVariation;

            // FULL height spread - drones across entire 5-20m altitude band
            // This prevents collisions and creates dramatically different camera angles
            const heightVariation = (i / (droneCount - 1)) * 15.0;  // 0 to 15m spread
            const height = 5.0 + heightVariation;  // 5m to 20m range - full height spread

            // Compute position in cylindrical coordinates around target
            const x = target.x + radius * Math.cos(azimuthAngle);
            const z = target.z + radius * Math.sin(azimuthAngle);
            const y = height;

            // Use the planned height directly - don't adjust based on elevation angle
            // The hard constraints in Drone.js will enforce the height bounds
            // This allows for better height diversity across the formation
            positions.push(new THREE.Vector3(x, y, z));
        }

        return positions;
    }

    /**
     * Compute elevation angle from camera to target
     */
    computeElevationAngle(cameraPos, targetPos) {
        const dx = cameraPos.x - targetPos.x;
        const dy = cameraPos.y - targetPos.y;
        const dz = cameraPos.z - targetPos.z;

        const horizontalDist = Math.sqrt(dx * dx + dz * dz);
        const elevationRad = Math.atan2(dy, horizontalDist);

        return elevationRad * 180 / Math.PI;
    }

    /**
     * Rotate entire formation around target (for occlusion handling)
     */
    rotateFormation(positions, center, rotationAngle) {
        return positions.map(pos => {
            // Translate to origin
            const relX = pos.x - center.x;
            const relZ = pos.z - center.z;

            // Rotate
            const cos = Math.cos(rotationAngle);
            const sin = Math.sin(rotationAngle);
            const newX = relX * cos - relZ * sin;
            const newZ = relX * sin + relZ * cos;

            // Translate back
            return new THREE.Vector3(
                newX + center.x,
                pos.y,
                newZ + center.z
            );
        });
    }

    /**
     * Detect if current formation has significant occlusions
     */
    detectOcclusions(positions, target, obstacles) {
        // Simplified occlusion check
        // In the full paper, this uses raycasting against scene geometry
        let occlusionCount = 0;

        positions.forEach(pos => {
            obstacles.forEach(obstacle => {
                if (this.lineIntersectsObstacle(pos, target, obstacle)) {
                    occlusionCount++;
                }
            });
        });

        // If >30% of viewpoints are occluded, trigger rotation
        return (occlusionCount / positions.length) > 0.3;
    }

    /**
     * Simple line-obstacle intersection check
     */
    lineIntersectsObstacle(start, end, obstacle) {
        // Placeholder - would use proper raycast in full implementation
        const midpoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
        const obstaclePos = new THREE.Vector3(obstacle.x, obstacle.y, obstacle.z);
        return midpoint.distanceTo(obstaclePos) < obstacle.radius;
    }

    /**
     * Clamp drone position to stay within field boundaries
     */
    clampToFieldBoundary(position) {
        const clamped = position.clone();

        clamped.x = Math.max(
            -this.fieldBoundary.x + this.obstacleBuffer,
            Math.min(this.fieldBoundary.x - this.obstacleBuffer, clamped.x)
        );

        clamped.z = Math.max(
            -this.fieldBoundary.z + this.obstacleBuffer,
            Math.min(this.fieldBoundary.z - this.obstacleBuffer, clamped.z)
        );

        clamped.y = Math.max(
            Config.DRONE.minHeight,
            Math.min(Config.DRONE.maxHeight, clamped.y)
        );

        return clamped;
    }

    /**
     * Compute reconstruction quality score for a given formation
     * Based on: baseline diversity + coverage uniformity + elevation optimality
     */
    evaluateFormationQuality(positions, target) {
        let baselineDiversity = 0;
        let elevationScore = 0;

        // Baseline diversity: measure angular separation
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const angle = this.computeBaselineAngle(
                    positions[i], positions[j], target
                );
                baselineDiversity += Math.abs(angle);
            }
        }

        // Elevation score: how close to optimal
        positions.forEach(pos => {
            const elevation = this.computeElevationAngle(pos, target);
            const error = Math.abs(elevation - this.optimalElevationAngle);
            elevationScore += Math.exp(-error / 10); // Gaussian-like penalty
        });

        return {
            baseline: baselineDiversity / (positions.length * (positions.length - 1) / 2),
            elevation: elevationScore / positions.length,
            overall: (baselineDiversity + elevationScore * 100) / positions.length
        };
    }

    /**
     * Compute baseline angle between two cameras viewing a target
     */
    computeBaselineAngle(pos1, pos2, target) {
        const v1 = new THREE.Vector3().subVectors(pos1, target).normalize();
        const v2 = new THREE.Vector3().subVectors(pos2, target).normalize();
        return Math.acos(v1.dot(v2)) * 180 / Math.PI;
    }
}
