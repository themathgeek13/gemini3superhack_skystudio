import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { LevisStadium } from './LevisStadium.js';

export class FootballField {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.createField();
        this.scene.add(this.group);

        // Add Levi's Stadium
        this.stadium = new LevisStadium(scene);
    }

    createField() {
        const { length, width } = Config.FIELD;

        // Main field (green turf)
        const fieldGeometry = new THREE.PlaneGeometry(width, length);

        // Create grass texture using canvas
        const grassTexture = this.createGrassTexture();

        const fieldMaterial = new THREE.MeshStandardMaterial({
            color: Config.FIELD.fieldColor,
            map: grassTexture,
            roughness: 0.9,
            metalness: 0.1
        });

        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.rotation.x = -Math.PI / 2;
        field.receiveShadow = true;
        this.group.add(field);

        // End zones
        this.createEndZones(length, width);

        // Yard lines
        this.createYardLines(length, width);

        // Hash marks
        this.createHashMarks(length, width);

        // Goal posts
        this.createGoalPosts(length);

        // Sideline numbers
        this.createFieldNumbers(length, width);
    }

    createGrassTexture() {
        // Simplified texture to avoid stack overflow
        const texture = new THREE.DataTexture(
            new Uint8Array([42, 110, 63, 255]),
            1, 1,
            THREE.RGBAFormat
        );
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    createEndZones(length, width) {
        const endzoneDepth = 9.1;  // 10 yards in meters
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: Config.FIELD.endzoneColor,
            transparent: true,
            opacity: 0.3
        });

        // Top endzone
        const endzone1Geo = new THREE.PlaneGeometry(width, endzoneDepth);
        const endzone1 = new THREE.Mesh(endzone1Geo, lineMaterial);
        endzone1.rotation.x = -Math.PI / 2;
        endzone1.position.set(0, 0.01, length/2 - endzoneDepth/2);
        this.group.add(endzone1);

        // Bottom endzone
        const endzone2 = new THREE.Mesh(endzone1Geo, lineMaterial);
        endzone2.rotation.x = -Math.PI / 2;
        endzone2.position.set(0, 0.01, -length/2 + endzoneDepth/2);
        this.group.add(endzone2);
    }

    createYardLines(length, width) {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xFFFFFF,
            linewidth: 2
        });

        const yardInMeters = 0.9144;  // 1 yard = 0.9144 meters
        const fieldLength = length - 18.2;  // Exclude endzones
        const startZ = -fieldLength / 2;

        // Create yard lines every 5 yards
        for (let yard = 0; yard <= 100; yard += 5) {
            const z = startZ + (yard * yardInMeters);

            const points = [
                new THREE.Vector3(-width/2 + 1, 0.02, z),
                new THREE.Vector3(width/2 - 1, 0.02, z)
            ];

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.group.add(line);

            // Thicker line for goal lines and 50-yard line
            if (yard === 0 || yard === 50 || yard === 100) {
                const thickLine = new THREE.Mesh(
                    new THREE.PlaneGeometry(width - 2, 0.3),
                    new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
                );
                thickLine.rotation.x = -Math.PI / 2;
                thickLine.position.set(0, 0.02, z);
                this.group.add(thickLine);
            }
        }

        // Sidelines
        const sidelinePoints = [
            new THREE.Vector3(-width/2, 0.02, -length/2),
            new THREE.Vector3(-width/2, 0.02, length/2)
        ];
        const sidelineGeo = new THREE.BufferGeometry().setFromPoints(sidelinePoints);
        this.group.add(new THREE.Line(sidelineGeo, lineMaterial));

        const sideline2Points = [
            new THREE.Vector3(width/2, 0.02, -length/2),
            new THREE.Vector3(width/2, 0.02, length/2)
        ];
        const sideline2Geo = new THREE.BufferGeometry().setFromPoints(sideline2Points);
        this.group.add(new THREE.Line(sideline2Geo, lineMaterial));
    }

    createHashMarks(length, width) {
        const hashMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 1 });
        const yardInMeters = 0.9144;
        const fieldLength = length - 18.2;
        const startZ = -fieldLength / 2;

        const hashWidth = 0.6;  // Length of hash mark
        const hashLeft = -5.5;   // Left hash position
        const hashRight = 5.5;   // Right hash position

        // Hash marks every yard
        for (let yard = 0; yard <= 100; yard++) {
            if (yard % 5 !== 0) {  // Skip major yard lines
                const z = startZ + (yard * yardInMeters);

                // Left hash
                const leftPoints = [
                    new THREE.Vector3(hashLeft - hashWidth/2, 0.02, z),
                    new THREE.Vector3(hashLeft + hashWidth/2, 0.02, z)
                ];
                const leftGeo = new THREE.BufferGeometry().setFromPoints(leftPoints);
                this.group.add(new THREE.Line(leftGeo, hashMaterial));

                // Right hash
                const rightPoints = [
                    new THREE.Vector3(hashRight - hashWidth/2, 0.02, z),
                    new THREE.Vector3(hashRight + hashWidth/2, 0.02, z)
                ];
                const rightGeo = new THREE.BufferGeometry().setFromPoints(rightPoints);
                this.group.add(new THREE.Line(rightGeo, hashMaterial));
            }
        }
    }

    createGoalPosts(length) {
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFDD00,  // Yellow goal posts
            metalness: 0.6,
            roughness: 0.4
        });

        // Goal post 1 (north endzone)
        const goalPost1 = this.createSingleGoalPost(postMaterial);
        goalPost1.position.z = length/2;
        this.group.add(goalPost1);

        // Goal post 2 (south endzone)
        const goalPost2 = this.createSingleGoalPost(postMaterial);
        goalPost2.position.z = -length/2;
        this.group.add(goalPost2);
    }

    createSingleGoalPost(material) {
        const post = new THREE.Group();

        // Main upright posts (two vertical poles)
        const uprightGeo = new THREE.CylinderGeometry(0.1, 0.1, 10, 8);

        const leftPost = new THREE.Mesh(uprightGeo, material);
        leftPost.position.set(-3.66, 5, 0);  // 18.5 feet apart
        leftPost.castShadow = true;
        post.add(leftPost);

        const rightPost = new THREE.Mesh(uprightGeo, material);
        rightPost.position.set(3.66, 5, 0);
        rightPost.castShadow = true;
        post.add(rightPost);

        // Crossbar (horizontal)
        const crossbarGeo = new THREE.CylinderGeometry(0.1, 0.1, 7.32, 8);
        const crossbar = new THREE.Mesh(crossbarGeo, material);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(0, 3.05, 0);  // 10 feet high
        crossbar.castShadow = true;
        post.add(crossbar);

        // Base support pole
        const baseGeo = new THREE.CylinderGeometry(0.15, 0.15, 3.05, 8);
        const base = new THREE.Mesh(baseGeo, material);
        base.position.set(0, 1.525, 0);
        base.castShadow = true;
        post.add(base);

        return post;
    }

    createFieldNumbers(length, width) {
        // This could add yard number markers (10, 20, 30, etc.)
        // For now, simplified - could use TextGeometry in full version
    }

    getPlayArea() {
        return {
            minX: -Config.FIELD.width / 2,
            maxX: Config.FIELD.width / 2,
            minZ: -Config.FIELD.length / 2,
            maxZ: Config.FIELD.length / 2,
            minY: 0,
            maxY: Config.FIELD.height
        };
    }
}
