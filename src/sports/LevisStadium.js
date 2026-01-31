import * as THREE from 'three';
import { Config } from '../core/Config.js';

export class LevisStadium {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.createStadium();
        this.scene.add(this.group);
    }

    createStadium() {
        // Simplified stadium - no stands for better visibility
        this.createStadiumLights();
        this.createJumboTron();
        this.createSuperBowlBranding();
    }

    createSeating() {
        const fieldLength = Config.FIELD.length;
        const fieldWidth = Config.FIELD.width;

        // Lower bowl seating (distinctive Levi's Stadium bowl shape)
        const seatMaterial = new THREE.MeshStandardMaterial({
            color: 0x1E3A8A,  // Deep blue seats
            roughness: 0.8,
            metalness: 0.2
        });

        // Create seating sections around field
        const sections = [
            // Home sideline (west)
            { x: -fieldWidth/2 - 8, z: 0, width: 6, length: fieldLength * 0.9, height: 12, rotation: 0 },
            // Visitor sideline (east)
            { x: fieldWidth/2 + 8, z: 0, width: 6, length: fieldLength * 0.9, height: 12, rotation: 0 },
            // North endzone
            { x: 0, z: fieldLength/2 + 8, width: fieldWidth + 16, length: 8, height: 15, rotation: 0 },
            // South endzone
            { x: 0, z: -fieldLength/2 - 8, width: fieldWidth + 16, length: 8, height: 15, rotation: 0 }
        ];

        sections.forEach(section => {
            const seatGeometry = new THREE.BoxGeometry(section.width, section.height, section.length);
            const seats = new THREE.Mesh(seatGeometry, seatMaterial);
            seats.position.set(section.x, section.height / 2, section.z);
            seats.castShadow = true;
            seats.receiveShadow = true;
            this.group.add(seats);
        });
    }

    createUpperDeck() {
        const fieldLength = Config.FIELD.length;
        const fieldWidth = Config.FIELD.width;

        const upperMaterial = new THREE.MeshStandardMaterial({
            color: 0x374151,  // Gray concrete
            roughness: 0.9,
            metalness: 0.1
        });

        // Upper deck structure (Levi's has distinctive open corners)
        const upperSections = [
            { x: -fieldWidth/2 - 16, z: 0, width: 4, length: fieldLength * 0.7, height: 8, y: 18 },
            { x: fieldWidth/2 + 16, z: 0, width: 4, length: fieldLength * 0.7, height: 8, y: 18 }
        ];

        upperSections.forEach(section => {
            const geometry = new THREE.BoxGeometry(section.width, section.height, section.length);
            const upper = new THREE.Mesh(geometry, upperMaterial);
            upper.position.set(section.x, section.y, section.z);
            upper.castShadow = true;
            this.group.add(upper);
        });
    }

    createLuxuryBoxes() {
        // Levi's Stadium signature glass luxury suites
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.9,
            reflectivity: 0.9
        });

        const boxGeometry = new THREE.BoxGeometry(2, 3, 80);

        const westBox = new THREE.Mesh(boxGeometry, glassMaterial);
        westBox.position.set(-32, 14, 0);
        this.group.add(westBox);

        const eastBox = new THREE.Mesh(boxGeometry, glassMaterial);
        eastBox.position.set(32, 14, 0);
        this.group.add(eastBox);
    }

    createStadiumLights() {
        // Simplified light towers to avoid stack overflow
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x4B5563,
            roughness: 0.7,
            metalness: 0.6
        });

        const positions = [
            { x: -40, z: 40 },
            { x: 40, z: 40 },
            { x: -40, z: -40 },
            { x: 40, z: -40 }
        ];

        positions.forEach(pos => {
            // Simple pole
            const poleGeometry = new THREE.CylinderGeometry(0.5, 0.8, 25, 8);
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 12.5, pos.z);
            pole.castShadow = true;
            this.group.add(pole);

            // Light at top (simplified)
            const light = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1, 2),
                new THREE.MeshBasicMaterial({ color: 0xFFFFAA, emissive: 0xFFFFAA, emissiveIntensity: 0.5 })
            );
            light.position.set(pos.x, 25, pos.z);
            this.group.add(light);
        });
    }

    createJumboTron() {
        // Levi's Stadium massive video boards
        const screenMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            emissive: 0x111111
        });

        // North endzone board
        const northScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(35, 15),
            screenMaterial
        );
        northScreen.position.set(0, 18, Config.FIELD.length/2 + 15);
        this.group.add(northScreen);

        // South endzone board
        const southScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(35, 15),
            screenMaterial
        );
        southScreen.position.set(0, 18, -Config.FIELD.length/2 - 15);
        southScreen.rotation.y = Math.PI;
        this.group.add(southScreen);
    }

    createSuperBowlBranding() {
        // Super Bowl LX (60) 2026 branding
        const logoMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,  // Gold
            emissive: 0xFFD700,
            emissiveIntensity: 0.5
        });

        // "LX" on field (50-yard line)
        const lxGeometry = new THREE.PlaneGeometry(8, 8);
        const lx = new THREE.Mesh(lxGeometry, logoMaterial);
        lx.rotation.x = -Math.PI / 2;
        lx.position.set(0, 0.03, 0);  // At 50-yard line
        this.group.add(lx);

        // Add Super Bowl banners
        this.createBanners();
    }

    createBanners() {
        const bannerMaterial = new THREE.MeshStandardMaterial({
            color: 0x9D174D,  // Super Bowl red/purple
            roughness: 0.6,
            metalness: 0.2
        });

        const positions = [
            { x: -25, y: 20, z: 30 },
            { x: 25, y: 20, z: 30 },
            { x: -25, y: 20, z: -30 },
            { x: 25, y: 20, z: -30 }
        ];

        positions.forEach(pos => {
            const banner = new THREE.Mesh(
                new THREE.PlaneGeometry(4, 8),
                bannerMaterial
            );
            banner.position.set(pos.x, pos.y, pos.z);
            this.group.add(banner);
        });
    }
}
