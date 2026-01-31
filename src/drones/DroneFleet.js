import * as THREE from 'three';
import { Drone } from './Drone.js';
import { DroneAI } from './DroneAI.js';
import { CollisionAvoidance } from './CollisionAvoidance.js';
import { DroneCoordinator } from './DroneCoordinator.js';
import { FormationPlanner } from './FormationPlanner.js';
import { TrajectoryOptimizer } from './TrajectoryOptimizer.js';
import { Config } from '../core/Config.js';

export class DroneFleet {
    constructor(scene, physicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.drones = [];
        this.ai = new DroneAI();
        this.collisionAvoidance = new CollisionAvoidance();
        this.coordinator = new DroneCoordinator();

        // CMU AirLab formation control system - ENABLED
        this.formationPlanner = new FormationPlanner();
        this.trajectoryOptimizers = [];  // One per drone (decentralized)
        this.useAdvancedFormation = true;  // Using CMU paper formation planning
        this.currentFormationGoals = [];  // Current target positions for each drone

        this.deployed = false;
        this.players = [];  // Reference to players for tracking
        this.planningTime = 0;

        // Smoothing for formation centroid tracking (reduces jitter)
        this.centroidHistory = [];
        this.smoothedCentroid = new THREE.Vector3();
        this.centroidSmoothingWindow = 5;  // Average over 5 frames
    }

    deploy(count = Config.DRONE.defaultCount) {
        // Clear existing drones
        this.clear();

        // Create new drones
        const startPositions = this.ai.calculateFleetPositions(
            count,
            new THREE.Vector3(0, 5, 0)
        );

        for (let i = 0; i < count; i++) {
            const drone = new Drone(
                this.scene,
                this.physicsManager,
                i,
                startPositions[i]
            );
            this.drones.push(drone);

            // Create decentralized trajectory optimizer for this drone
            this.trajectoryOptimizers[i] = new TrajectoryOptimizer(i);

            console.log(`✅ Drone ${i} created at position:`, startPositions[i]);
        }

        this.deployed = true;
        this.planningTime = 0;
        console.log(`🚁 Deployed ${count} drones - they should be LARGE and WHITE`);
    }

    update(deltaTime, targetPosition, players = []) {
        if (!this.deployed) return;

        // Update player reference
        this.players = players;
        this.planningTime += deltaTime;

        if (this.useAdvancedFormation) {
            this.updateWithFormationPlanner(deltaTime, targetPosition, players);
        } else {
            // Fallback to original zone-based coordinator
            this.updateWithCoordinator(deltaTime, targetPosition, players);
        }
    }

    /**
     * Update using CMU AirLab formation planner
     * Direct attraction forces toward formation goals for simplicity and robustness
     */
    updateWithFormationPlanner(deltaTime, targetPosition, players) {
        // Recompute formation goals every ~0.5 seconds
        if (this.planningTime > 0.5) {
            this.currentFormationGoals = this.formationPlanner.planFormation(
                this.drones,
                targetPosition,
                players,
                []
            );
            this.planningTime = 0;
        }

        // Calculate formation centroid for primary tracking drones
        let centroidX = targetPosition.x;
        let centroidY = targetPosition.y;
        let centroidZ = targetPosition.z;
        let count = 1;

        players.forEach(player => {
            const pos = player.getPosition();
            centroidX += pos.x;
            centroidY += pos.y;
            centroidZ += pos.z;
            count++;
        });

        centroidX /= count;
        centroidY /= count;
        centroidZ /= count;

        // Use current centroid directly (smoothing was causing lag)
        const formationCentroid = new THREE.Vector3(centroidX, centroidY, centroidZ);
        const primaryTrackingIndices = Config.DRONE.primaryTrackingDrones || [0, 1, 2];

        // Each drone moves toward its formation goal using attraction forces
        this.drones.forEach((drone, idx) => {
            if (!drone.active || !this.currentFormationGoals || idx >= this.currentFormationGoals.length) {
                return;
            }

            const currentPos = drone.getPosition();
            let goalPos = this.currentFormationGoals[idx];

            // PRIMARY TRACKING DRONES: Track formation centroid directly with lower heights
            if (primaryTrackingIndices.includes(idx)) {
                // Position them around the centroid at lower heights
                const angle = (idx / primaryTrackingIndices.length) * Math.PI * 2;
                const radius = 15;  // Circle around centroid
                goalPos = new THREE.Vector3(
                    formationCentroid.x + Math.cos(angle) * radius,
                    Config.DRONE.primaryDroneMinHeight + (Math.random() *
                        (Config.DRONE.primaryDroneMaxHeight - Config.DRONE.primaryDroneMinHeight)),
                    formationCentroid.z + Math.sin(angle) * radius
                );
            }

            // Compute attraction force toward goal - SLOW and SMOOTH movement
            const toGoal = new THREE.Vector3().subVectors(goalPos, currentPos);
            const distToGoal = toGoal.length();

            // GENTLE attraction force - balanced for smooth tracking
            const attractionForce = toGoal
                .normalize()
                .multiplyScalar(Math.min(distToGoal, 1) * 2.0);  // Balanced value

            // Get repulsion from other drones
            const repulsionForce = this.ai.calculateRepulsionForce(drone, this.drones);

            // Get boundary forces
            const boundaryForce = this.ai.calculateBoundaryForce(currentPos);

            // Combine forces
            const combinedForces = new THREE.Vector3()
                .add(attractionForce)
                .add(repulsionForce)
                .add(boundaryForce);

            // Minimal vertical force - reduce gravity comp so formation goals can dominate heights
            // Let the attraction force pull drones to their target heights
            const minimalVertical = Math.abs(Config.PHYSICS.gravity.y) * 0.05;  // Very minimal
            combinedForces.y += minimalVertical;

            // Update drone with formation goal as camera tracking target
            drone.update(deltaTime, combinedForces, formationCentroid);  // Track centroid for camera
        });
    }

    /**
     * Update using original zone-based coordinator (fallback)
     */
    updateWithCoordinator(deltaTime, targetPosition, players) {
        // Use coordinator to assign zones and targets
        this.coordinator.assignDrones(this.drones, targetPosition, players);

        this.drones.forEach(drone => {
            if (!drone.active) return;

            // Get coordinated target position
            const coordinatedTarget = this.coordinator.getTargetPosition(
                drone.id,
                targetPosition,
                players
            );

            // Calculate AI forces with coordinated target
            const forces = this.ai.calculateForces(
                drone,
                this.drones,
                coordinatedTarget
            );

            // Update drone with forces AND tracking target so camera points at it
            drone.update(deltaTime, forces, coordinatedTarget);
        });
    }

    getDrones() {
        return this.drones;
    }

    getActiveDrones() {
        return this.drones.filter(d => d.active);
    }

    getDroneCount() {
        return this.drones.length;
    }

    setDroneCount(count) {
        if (this.deployed) {
            this.deploy(count);
        }
    }

    setFrustumVisible(visible) {
        this.drones.forEach(drone => drone.setFrustumVisible(visible));
    }

    setTrailVisible(visible) {
        this.drones.forEach(drone => drone.setTrailVisible(visible));
    }

    setVisible(visible) {
        this.drones.forEach(drone => drone.setVisible(visible));
    }

    getDroneCameras() {
        return this.drones.map(drone => drone.getCamera());
    }

    clear() {
        this.drones.forEach(drone => drone.dispose());
        this.drones = [];
        this.deployed = false;
    }

    isDeployed() {
        return this.deployed;
    }
}
