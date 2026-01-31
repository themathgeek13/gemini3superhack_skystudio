import * as THREE from 'three';
import { Config } from '../core/Config.js';

export class DroneTrails {
    constructor(scene) {
        this.scene = scene;
        this.trails = new Map();
    }

    addDrone(droneId) {
        if (this.trails.has(droneId)) return;

        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: 0x00FF00,
            transparent: true,
            opacity: Config.EFFECTS.trailOpacity,
            linewidth: 1
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);

        this.trails.set(droneId, {
            line: line,
            points: []
        });
    }

    update(drone) {
        if (!this.trails.has(drone.id)) {
            this.addDrone(drone.id);
        }

        const trail = this.trails.get(drone.id);
        const position = drone.getPosition();

        trail.points.push(position.clone());

        if (trail.points.length > Config.EFFECTS.trailLength) {
            trail.points.shift();
        }

        if (trail.points.length > 1) {
            trail.line.geometry.setFromPoints(trail.points);
        }
    }

    clear() {
        this.trails.forEach(trail => {
            this.scene.remove(trail.line);
            trail.line.geometry.dispose();
            trail.line.material.dispose();
        });
        this.trails.clear();
    }

    setVisible(visible) {
        this.trails.forEach(trail => {
            trail.line.visible = visible;
        });
    }
}
