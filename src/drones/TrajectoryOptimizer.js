import * as THREE from 'three';
import { Config } from '../core/Config.js';

/**
 * Decentralized Trajectory Optimizer
 * Based on "3D Human Reconstruction in the Wild with Collaborative Aerial Cameras"
 *
 * Runs independently on each drone for real-time responsiveness
 * Computes smooth trajectories to reach formation goals while avoiding obstacles
 */
export class TrajectoryOptimizer {
    constructor(droneId) {
        this.droneId = droneId;

        // Trajectory parameters
        this.planningHorizon = 3.0;  // seconds
        this.timeStep = 0.1;         // seconds
        this.maxVelocity = Config.DRONE.speed;
        this.maxAcceleration = 8.0;  // m/s^2

        // Optimization weights
        this.weights = {
            goalReaching: 10.0,      // Reach formation goal
            smoothness: 2.0,         // Smooth trajectory
            collision: 50.0,         // Avoid other drones
            velocityLimit: 5.0,      // Stay within velocity limits
            fieldBoundary: 20.0      // Stay in bounds
        };

        // State
        this.currentGoal = null;
        this.plannedTrajectory = [];
    }

    /**
     * Compute optimal trajectory from current position to goal
     * Uses simplified gradient descent optimization
     */
    computeTrajectory(currentPos, currentVel, goalPos, obstacles) {
        this.currentGoal = goalPos;

        // Initialize trajectory with straight line to goal
        const trajectory = this.initializeStraightTrajectory(
            currentPos,
            goalPos
        );

        // Iterative optimization (simplified for real-time performance)
        for (let iter = 0; iter < 5; iter++) {
            trajectory.forEach((waypoint, idx) => {
                if (idx === 0 || idx === trajectory.length - 1) return;

                const gradient = this.computeGradient(
                    waypoint,
                    trajectory,
                    idx,
                    obstacles
                );

                // Update waypoint position
                waypoint.x -= gradient.x * 0.1;
                waypoint.y -= gradient.y * 0.1;
                waypoint.z -= gradient.z * 0.1;
            });
        }

        this.plannedTrajectory = trajectory;
        return trajectory;
    }

    /**
     * Initialize trajectory as straight line from current to goal
     */
    initializeStraightTrajectory(start, goal) {
        const trajectory = [];
        const steps = Math.ceil(this.planningHorizon / this.timeStep);

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const waypoint = new THREE.Vector3().lerpVectors(start, goal, t);
            trajectory.push(waypoint);
        }

        return trajectory;
    }

    /**
     * Compute cost gradient at a waypoint for optimization
     */
    computeGradient(waypoint, trajectory, idx, obstacles) {
        const gradient = new THREE.Vector3(0, 0, 0);
        const epsilon = 0.01;

        // Numerical gradient computation
        ['x', 'y', 'z'].forEach(axis => {
            const originalValue = waypoint[axis];

            // Forward difference
            waypoint[axis] = originalValue + epsilon;
            const costPlus = this.computeCost(waypoint, trajectory, idx, obstacles);

            waypoint[axis] = originalValue - epsilon;
            const costMinus = this.computeCost(waypoint, trajectory, idx, obstacles);

            waypoint[axis] = originalValue;

            gradient[axis] = (costPlus - costMinus) / (2 * epsilon);
        });

        return gradient;
    }

    /**
     * Compute total cost for a waypoint
     */
    computeCost(waypoint, trajectory, idx, obstacles) {
        let cost = 0;

        // Goal reaching cost
        cost += this.weights.goalReaching *
                waypoint.distanceTo(this.currentGoal);

        // Smoothness cost (deviation from straight path)
        if (idx > 0 && idx < trajectory.length - 1) {
            const prev = trajectory[idx - 1];
            const next = trajectory[idx + 1];
            const expectedPos = new THREE.Vector3().lerpVectors(prev, next, 0.5);
            cost += this.weights.smoothness * waypoint.distanceTo(expectedPos);
        }

        // Collision avoidance cost
        obstacles.forEach(obstacle => {
            const distance = waypoint.distanceTo(obstacle.position);
            const safeDistance = Config.DRONE.repulsionRadius;

            if (distance < safeDistance) {
                cost += this.weights.collision *
                        Math.pow((safeDistance - distance) / safeDistance, 2);
            }
        });

        // Velocity limit cost
        if (idx > 0) {
            const prev = trajectory[idx - 1];
            const velocity = waypoint.distanceTo(prev) / this.timeStep;
            if (velocity > this.maxVelocity) {
                cost += this.weights.velocityLimit *
                        Math.pow(velocity - this.maxVelocity, 2);
            }
        }

        // Field boundary cost
        const boundaryX = Config.FIELD.width / 2 - 5;
        const boundaryZ = Config.FIELD.length / 2 - 5;

        if (Math.abs(waypoint.x) > boundaryX) {
            cost += this.weights.fieldBoundary *
                    Math.pow(Math.abs(waypoint.x) - boundaryX, 2);
        }
        if (Math.abs(waypoint.z) > boundaryZ) {
            cost += this.weights.fieldBoundary *
                    Math.pow(Math.abs(waypoint.z) - boundaryZ, 2);
        }

        return cost;
    }

    /**
     * Get next waypoint from planned trajectory
     */
    getNextWaypoint(currentTime) {
        if (this.plannedTrajectory.length === 0) return null;

        const index = Math.floor(currentTime / this.timeStep);
        if (index >= this.plannedTrajectory.length) {
            return this.plannedTrajectory[this.plannedTrajectory.length - 1];
        }

        return this.plannedTrajectory[index];
    }

    /**
     * Compute control forces to follow trajectory
     * Using PD controller for smooth tracking
     */
    computeControlForces(currentPos, currentVel, targetWaypoint) {
        if (!targetWaypoint) return new THREE.Vector3(0, 0, 0);

        // PD gains
        const kp = 5.0;  // Proportional gain
        const kd = 2.0;  // Derivative gain

        // Position error
        const posError = new THREE.Vector3().subVectors(
            targetWaypoint,
            currentPos
        );

        // Velocity error (assuming zero target velocity at waypoint)
        const velError = currentVel.clone().multiplyScalar(-1);

        // PD control
        const force = new THREE.Vector3()
            .addScaledVector(posError, kp)
            .addScaledVector(velError, kd);

        // Clamp to max acceleration
        const forceMag = force.length();
        if (forceMag > this.maxAcceleration) {
            force.multiplyScalar(this.maxAcceleration / forceMag);
        }

        return force;
    }

    /**
     * Replan trajectory (called when goal changes significantly)
     */
    shouldReplan(newGoal) {
        if (!this.currentGoal) return true;

        const goalChange = this.currentGoal.distanceTo(newGoal);
        return goalChange > 3.0;  // Replan if goal moved >3m
    }
}
