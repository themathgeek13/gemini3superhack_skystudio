import * as THREE from 'three';
import { Config } from '../core/Config.js';

export class DroneCoordinator {
    constructor() {
        // Zone-based coordination for better coverage
        this.zones = this.defineZones();
        this.assignments = new Map();  // drone.id -> zone
        this.playerTracking = new Map(); // drone.id -> player.id
    }

    defineZones() {
        // Divide field into strategic zones for Super Bowl coverage
        return [
            // Primary action zones (8 drones)
            { name: 'QB_Close', center: { x: 0, y: 5, z: -10 }, radius: 8, priority: 10 },
            { name: 'Receivers_L', center: { x: -15, y: 6, z: 0 }, radius: 12, priority: 8 },
            { name: 'Receivers_R', center: { x: 15, y: 6, z: 0 }, radius: 12, priority: 8 },
            { name: 'Midfield_High', center: { x: 0, y: 12, z: 0 }, radius: 20, priority: 7 },

            // Secondary coverage (4 drones)
            { name: 'Endzone_N', center: { x: 0, y: 8, z: 45 }, radius: 15, priority: 6 },
            { name: 'Endzone_S', center: { x: 0, y: 8, z: -45 }, radius: 15, priority: 6 },
            { name: 'Sideline_L', center: { x: -20, y: 7, z: 0 }, radius: 25, priority: 5 },
            { name: 'Sideline_R', center: { x: 20, y: 7, z: 0 }, radius: 25, priority: 5 },

            // Aerial overview
            { name: 'Aerial', center: { x: 0, y: 20, z: 0 }, radius: 30, priority: 9 },

            // Dynamic tracking zones
            { name: 'Ball_Track', center: { x: 0, y: 8, z: 0 }, radius: 10, priority: 10 },
            { name: 'Play_Side_L', center: { x: -10, y: 6, z: 0 }, radius: 15, priority: 7 },
            { name: 'Play_Side_R', center: { x: 10, y: 6, z: 0 }, radius: 15, priority: 7 }
        ];
    }

    assignDrones(drones, ballPosition, players) {
        // Clear old assignments
        this.assignments.clear();

        // Update dynamic zones based on ball
        this.updateDynamicZones(ballPosition);

        // Sort zones by priority
        const sortedZones = [...this.zones].sort((a, b) => b.priority - a.priority);

        // Assign each drone to optimal zone
        drones.forEach((drone, index) => {
            if (index < sortedZones.length) {
                this.assignments.set(drone.id, sortedZones[index]);
            }
        });

        // Assign player tracking for close-up drones
        this.assignPlayerTracking(drones, players, ballPosition);
    }

    updateDynamicZones(ballPosition) {
        // Update ball tracking zone
        const ballTrackZone = this.zones.find(z => z.name === 'Ball_Track');
        if (ballTrackZone) {
            ballTrackZone.center.x = ballPosition.x;
            ballTrackZone.center.z = ballPosition.z;
        }

        // Update play-side zones
        const playSideL = this.zones.find(z => z.name === 'Play_Side_L');
        const playSideR = this.zones.find(z => z.name === 'Play_Side_R');

        if (playSideL && playSideR) {
            const ballSide = ballPosition.x < 0 ? playSideL : playSideR;
            ballSide.priority = 9;  // Boost priority of active side
            const otherSide = ballPosition.x < 0 ? playSideR : playSideL;
            otherSide.priority = 5;  // Lower priority of inactive side
        }
    }

    assignPlayerTracking(drones, players, ballPosition) {
        this.playerTracking.clear();

        // Find key players near ball
        const nearbyPlayers = players
            .map(player => ({
                player,
                distance: ballPosition.distanceTo(player.getPosition())
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 6);  // Track 6 closest players

        // Assign drones to track these players
        nearbyPlayers.forEach((item, index) => {
            if (index < drones.length) {
                this.playerTracking.set(drones[index].id, item.player.id);
            }
        });
    }

    getTargetPosition(droneId, ballPosition, players) {
        const zone = this.assignments.get(droneId);
        const trackedPlayerId = this.playerTracking.get(droneId);

        if (!zone) {
            return new THREE.Vector3(
                ballPosition.x,
                Config.DRONE.minHeight + 3,
                ballPosition.z
            );
        }

        let target = new THREE.Vector3(
            zone.center.x,
            zone.center.y,
            zone.center.z
        );

        // If tracking a specific player, offset from player
        if (trackedPlayerId !== undefined) {
            const player = players.find(p => p.id === trackedPlayerId);
            if (player) {
                const playerPos = player.getPosition();
                target = new THREE.Vector3(
                    playerPos.x + (Math.random() - 0.5) * 3,
                    zone.center.y,
                    playerPos.z + (Math.random() - 0.5) * 3
                );
            }
        }

        // Add some variation within zone
        const variation = zone.radius * 0.3;
        target.x += (Math.random() - 0.5) * variation;
        target.z += (Math.random() - 0.5) * variation;

        return target;
    }

    getZoneInfo(droneId) {
        return this.assignments.get(droneId);
    }
}
