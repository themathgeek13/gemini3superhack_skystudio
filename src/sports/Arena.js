import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';

export class Arena {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.createArena();
        this.scene.add(this.group);
    }

    createArena() {
        const { length, width } = Config.COURT;

        // Floor
        const floor = GeometryUtils.createCourtFloor(length, width);
        this.group.add(floor);

        // Court lines
        const lines = GeometryUtils.createCourtLines(length, width);
        this.group.add(lines);

        // Hoops
        const hoop1 = GeometryUtils.createBasketballHoop(1);
        const hoop2 = GeometryUtils.createBasketballHoop(-1);
        this.group.add(hoop1);
        this.group.add(hoop2);

        // Court boundaries (invisible walls)
        this.createBoundaryWalls(length, width);
    }

    createBoundaryWalls(length, width) {
        const wallMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });

        const height = 10;

        // Side walls
        const sideWall = new THREE.Mesh(
            new THREE.PlaneGeometry(length, height),
            wallMaterial
        );
        sideWall.position.set(width/2, height/2, 0);
        sideWall.rotation.y = Math.PI / 2;

        const sideWall2 = sideWall.clone();
        sideWall2.position.set(-width/2, height/2, 0);

        // End walls
        const endWall = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            wallMaterial
        );
        endWall.position.set(0, height/2, length/2);

        const endWall2 = endWall.clone();
        endWall2.position.set(0, height/2, -length/2);
        endWall2.rotation.y = Math.PI;

        // Don't add walls to scene (they're just visual reference)
        // Physics will handle boundaries in PhysicsManager
    }

    getPlayArea() {
        return {
            minX: -Config.COURT.width / 2,
            maxX: Config.COURT.width / 2,
            minZ: -Config.COURT.length / 2,
            maxZ: Config.COURT.length / 2,
            minY: 0,
            maxY: Config.COURT.height
        };
    }
}
