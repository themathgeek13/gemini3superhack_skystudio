import * as THREE from 'three';

export class DroneCamera {
    constructor(droneFleet) {
        this.droneFleet = droneFleet;
        this.currentDroneIndex = 0;
    }

    update(deltaTime) {
        // Nothing to update - camera is attached to drone
    }

    getCamera() {
        const drones = this.droneFleet.getActiveDrones();
        if (drones.length === 0) {
            // Return a default camera if no drones
            return new THREE.PerspectiveCamera();
        }

        const drone = drones[this.currentDroneIndex % drones.length];
        return drone.getCamera();
    }

    nextDrone() {
        const drones = this.droneFleet.getActiveDrones();
        if (drones.length > 0) {
            this.currentDroneIndex = (this.currentDroneIndex + 1) % drones.length;
        }
    }

    previousDrone() {
        const drones = this.droneFleet.getActiveDrones();
        if (drones.length > 0) {
            this.currentDroneIndex = (this.currentDroneIndex - 1 + drones.length) % drones.length;
        }
    }

    enable() {
        // No controls for drone camera
    }

    disable() {
        // No controls for drone camera
    }
}
