import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { MathUtils } from '../utils/MathUtils.js';

export class FootballPlayer {
    constructor(scene, physicsManager, id, startPosition, team) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.id = id;
        this.team = team;  // 'offense' or 'defense'

        // Visual mesh
        this.mesh = this.createPlayerModel(team);
        this.mesh.position.copy(startPosition);
        this.scene.add(this.mesh);

        // Physics body
        this.rigidBody = physicsManager.createPlayerBody(startPosition);

        // Movement
        this.targetPosition = startPosition.clone();
        this.speed = Config.PLAYER.speed;
        this.movementTimer = 0;
        this.isRunning = false;
        this.route = null;
    }

    createPlayerModel(team) {
        const player = new THREE.Group();
        player.userData.isPlayer = true;  // Mark for point cloud sampling

        // Team colors
        const teamColors = {
            offense: {
                jersey: 0x0066CC,   // Blue (home team)
                helmet: 0x003366,
                pants: 0xCCCCCC
            },
            defense: {
                jersey: 0xCC0000,   // Red (away team)
                helmet: 0x660000,
                pants: 0xFFFFFF
            }
        };

        const colors = teamColors[team];

        // Body (jersey)
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: colors.jersey,
            roughness: 0.7,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.0;
        body.castShadow = true;
        player.add(body);

        // Shoulder pads (wider)
        const shoulderGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.35);
        const shoulder = new THREE.Mesh(shoulderGeometry, bodyMaterial);
        shoulder.position.y = 1.25;
        shoulder.castShadow = true;
        player.add(shoulder);

        // Helmet
        const helmetGeometry = new THREE.SphereGeometry(0.18, 12, 12);
        const helmetMaterial = new THREE.MeshStandardMaterial({
            color: colors.helmet,
            roughness: 0.3,
            metalness: 0.7
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 1.7;
        helmet.scale.set(1, 1.1, 1.1);  // Slightly elongated
        helmet.castShadow = true;
        player.add(helmet);

        // Face mask
        const faceMaskGeometry = new THREE.BoxGeometry(0.25, 0.02, 0.02);
        const faceMaskMaterial = new THREE.MeshStandardMaterial({
            color: 0xDDDDDD,
            metalness: 0.8,
            roughness: 0.2
        });

        for (let i = 0; i < 3; i++) {
            const bar = new THREE.Mesh(faceMaskGeometry, faceMaskMaterial);
            bar.position.set(0, 1.65 + i * 0.05, 0.18);
            player.add(bar);
        }

        // Legs/Pants
        const legGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 8);
        const pantsMaterial = new THREE.MeshStandardMaterial({
            color: colors.pants,
            roughness: 0.8,
            metalness: 0.1
        });

        const leftLeg = new THREE.Mesh(legGeometry, pantsMaterial);
        leftLeg.position.set(-0.15, 0.4, 0);
        leftLeg.castShadow = true;
        player.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, pantsMaterial);
        rightLeg.position.set(0.15, 0.4, 0);
        rightLeg.castShadow = true;
        player.add(rightLeg);

        // Jersey number (simplified)
        const numberGeometry = new THREE.PlaneGeometry(0.2, 0.3);
        const numberMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF
        });
        const number = new THREE.Mesh(numberGeometry, numberMaterial);
        number.position.set(0, 1.0, 0.16);
        player.add(number);

        return player;
    }

    update(deltaTime, ballPosition, playState) {
        this.movementTimer += deltaTime;

        // AI behavior based on team and ball position
        if (this.team === 'offense') {
            this.updateOffenseAI(ballPosition, playState);
        } else {
            this.updateDefenseAI(ballPosition, playState);
        }

        // Move towards target
        const currentPos = this.mesh.position;
        const direction = new THREE.Vector3()
            .subVectors(this.targetPosition, currentPos)
            .normalize();

        const speed = this.isRunning ? this.speed : this.speed * 0.5;
        let newPos = currentPos.clone().add(
            direction.multiplyScalar(speed * deltaTime)
        );

        // ENFORCE FIELD BOUNDARIES - keep players on field
        const fieldHalfWidth = 24.4;   // Half of 48.8m width
        const fieldHalfLength = 54.85;  // Half of 109.7m length

        newPos.x = MathUtils.clamp(newPos.x, -fieldHalfWidth, fieldHalfWidth);
        newPos.z = MathUtils.clamp(newPos.z, -fieldHalfLength, fieldHalfLength);

        // Update position
        this.mesh.position.copy(newPos);
        if (this.rigidBody) {
            this.physicsManager.setPosition(this.rigidBody, newPos);
        }

        // Face movement direction
        if (direction.lengthSq() > 0.01) {
            this.mesh.lookAt(newPos.x + direction.x, newPos.y, newPos.z + direction.z);
        }

        // Animate running (bob up and down)
        if (this.isRunning) {
            this.mesh.position.y += Math.sin(this.movementTimer * 10) * 0.02;
        }
    }

    updateOffenseAI(ballPosition, playState) {
        // Offense runs realistic routes - STABLE and PREDICTABLE
        if (this.movementTimer > 4.0) {  // Even longer intervals for stability
            this.movementTimer = 0;

            // Field boundaries
            const fieldHalfWidth = 24.4;
            const fieldHalfLength = 54.85;

            // All players move downfield toward the ball with MINIMAL lateral variation
            // This creates stable, cohesive movement that's easier for drones to track
            const lateralDeviation = (Math.random() - 0.5) * 3;  // Small random movement
            const downfieldDistance = 12 + Math.random() * 6;    // 12-18 yards forward

            this.targetPosition.set(
                MathUtils.clamp(this.mesh.position.x + lateralDeviation, -fieldHalfWidth, fieldHalfWidth),
                0,
                MathUtils.clamp(this.mesh.position.z + downfieldDistance, -fieldHalfLength, fieldHalfLength)
            );

            this.isRunning = true;
        }
    }

    updateDefenseAI(ballPosition, playState) {
        // Defense follows the ball and tries to tackle
        if (this.movementTimer > 1.5) {
            this.movementTimer = 0;

            // Field boundaries
            const fieldHalfWidth = 24.4;
            const fieldHalfLength = 54.85;

            // Move toward ball with some offset
            const offset = MathUtils.randomVector3(5);
            this.targetPosition = new THREE.Vector3(
                MathUtils.clamp(ballPosition.x + offset.x, -fieldHalfWidth, fieldHalfWidth),
                0,
                MathUtils.clamp(ballPosition.z + offset.z, -fieldHalfLength, fieldHalfLength)
            );

            this.isRunning = true;
        }
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    setFormationPosition(position) {
        this.mesh.position.copy(position);
        this.targetPosition = position.clone();
        if (this.rigidBody) {
            this.physicsManager.setPosition(this.rigidBody, position);
        }
        this.isRunning = false;
    }
}
