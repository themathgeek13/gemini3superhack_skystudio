import * as THREE from 'three';

export class GeometryUtils {
    static createCourtFloor(length, width) {
        const geometry = new THREE.PlaneGeometry(width, length);
        const material = new THREE.MeshStandardMaterial({
            color: 0xD2691E,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        return floor;
    }

    static createCourtLines(length, width) {
        const lines = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });

        // Outer boundary
        const boundaryPoints = [
            new THREE.Vector3(-width/2, 0.01, -length/2),
            new THREE.Vector3(width/2, 0.01, -length/2),
            new THREE.Vector3(width/2, 0.01, length/2),
            new THREE.Vector3(-width/2, 0.01, length/2),
            new THREE.Vector3(-width/2, 0.01, -length/2)
        ];
        const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
        lines.add(new THREE.Line(boundaryGeometry, lineMaterial));

        // Center line
        const centerPoints = [
            new THREE.Vector3(-width/2, 0.01, 0),
            new THREE.Vector3(width/2, 0.01, 0)
        ];
        const centerGeometry = new THREE.BufferGeometry().setFromPoints(centerPoints);
        lines.add(new THREE.Line(centerGeometry, lineMaterial));

        // Center circle
        const circleGeometry = new THREE.BufferGeometry();
        const circlePoints = [];
        const radius = 1.8;
        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            circlePoints.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0.01,
                Math.sin(angle) * radius
            ));
        }
        circleGeometry.setFromPoints(circlePoints);
        lines.add(new THREE.Line(circleGeometry, lineMaterial));

        return lines;
    }

    static createBasketballHoop(side = 1) {
        const hoop = new THREE.Group();
        const z = side * 13;  // Position at court end

        // Backboard
        const backboardGeometry = new THREE.BoxGeometry(1.8, 1.05, 0.05);
        const backboardMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.3
        });
        const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
        backboard.position.set(0, 3.05, z);
        hoop.add(backboard);

        // Rim
        const rimGeometry = new THREE.TorusGeometry(0.23, 0.02, 8, 32);
        const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600 });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.set(0, 3.05, z - 0.15);
        rim.rotation.x = Math.PI / 2;
        hoop.add(rim);

        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3.05, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(0, 1.525, z + 0.5);
        hoop.add(pole);

        return hoop;
    }

    static createDroneModel() {
        const drone = new THREE.Group();
        drone.userData.isDrone = true;

        console.log('🚁 Creating drone model with LARGE size');

        // VERY LARGE drone body for visibility - 2m wide!
        const bodyGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.5, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,  // Pure white for visibility
            metalness: 0.5,
            roughness: 0.3,
            emissive: 0xFFFFFF,  // Self-illuminating white
            emissiveIntensity: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = false;  // Don't cast shadows for better performance
        drone.add(body);

        console.log('✅ Drone body created: 1.0m radius cylinder');

        // LED ring for visibility - VERY LARGE AND BRIGHT
        const ledGeometry = new THREE.TorusGeometry(1.1, 0.15, 8, 16);
        const ledMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF00,  // Bright green LED
            emissive: 0x00FF00,
            emissiveIntensity: 3.0
        });
        const led = new THREE.Mesh(ledGeometry, ledMaterial);
        led.rotation.x = Math.PI / 2;
        led.position.y = -0.1;
        drone.add(led);

        console.log('✅ LED ring created: 1.1m radius torus');

        // Camera lens - LARGER
        const lensGeometry = new THREE.SphereGeometry(0.12, 12, 12);
        const lensMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.9,
            roughness: 0.1
        });
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        lens.position.set(0, -0.15, 0);
        drone.add(lens);

        // Propellers - LARGER AND MORE VISIBLE
        const propellerMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.5
        });

        const positions = [
            [-0.5, 0.15, -0.5],
            [0.5, 0.15, -0.5],
            [-0.5, 0.15, 0.5],
            [0.5, 0.15, 0.5]
        ];

        drone.propellers = [];
        positions.forEach(pos => {
            const propGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.04, 3);
            const propeller = new THREE.Mesh(propGeometry, propellerMaterial);
            propeller.position.set(pos[0], pos[1], pos[2]);
            propeller.rotation.x = Math.PI / 2;
            drone.add(propeller);
            drone.propellers.push(propeller);
        });

        return drone;
    }

    static createPlayerModel() {
        const player = new THREE.Group();

        // Body (capsule approximation)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        player.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDBAC });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.75;
        head.castShadow = true;
        player.add(head);

        return player;
    }

    static createBall() {
        const geometry = new THREE.SphereGeometry(0.12, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFF6600,
            roughness: 0.7,
            metalness: 0.1
        });
        const ball = new THREE.Mesh(geometry, material);
        ball.castShadow = true;
        ball.receiveShadow = false;
        return ball;
    }

    static createFrustumHelper(camera, color = 0x00FF00) {
        const helper = new THREE.CameraHelper(camera);
        helper.material.color.setHex(color);
        helper.material.linewidth = 1;
        helper.visible = false;
        return helper;
    }
}
