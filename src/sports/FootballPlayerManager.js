import * as THREE from 'three';
import { FootballPlayer } from './FootballPlayer.js';
import { Config } from '../core/Config.js';

export class FootballPlayerManager {
    constructor(scene, physicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.players = [];
        this.playState = 'set';  // 'set', 'play', 'tackle'
        this.playTimer = 0;
        this.createPlayers();
    }

    createPlayers() {
        // Create offensive formation (I-formation)
        const offensePositions = this.getOffensiveFormation();
        offensePositions.forEach((pos, i) => {
            const player = new FootballPlayer(
                this.scene,
                this.physicsManager,
                i,
                pos,
                'offense'
            );
            this.players.push(player);
        });

        // Create defensive formation (4-3 defense)
        const defensePositions = this.getDefensiveFormation();
        defensePositions.forEach((pos, i) => {
            const player = new FootballPlayer(
                this.scene,
                this.physicsManager,
                i + 11,
                pos,
                'defense'
            );
            this.players.push(player);
        });
    }

    getOffensiveFormation() {
        // I-formation (classic)
        const lineOfScrimmage = -10;  // Z position
        const positions = [];

        // Offensive Line (5 players)
        positions.push(new THREE.Vector3(0, 0, lineOfScrimmage));         // Center
        positions.push(new THREE.Vector3(-1.5, 0, lineOfScrimmage));      // Left Guard
        positions.push(new THREE.Vector3(1.5, 0, lineOfScrimmage));       // Right Guard
        positions.push(new THREE.Vector3(-3, 0, lineOfScrimmage));        // Left Tackle
        positions.push(new THREE.Vector3(3, 0, lineOfScrimmage));         // Right Tackle

        // Quarterback
        positions.push(new THREE.Vector3(0, 0, lineOfScrimmage - 5));

        // Running Backs (I-formation)
        positions.push(new THREE.Vector3(0, 0, lineOfScrimmage - 7));     // Fullback
        positions.push(new THREE.Vector3(0, 0, lineOfScrimmage - 9));     // Tailback

        // Wide Receivers
        positions.push(new THREE.Vector3(-12, 0, lineOfScrimmage));       // Left WR
        positions.push(new THREE.Vector3(12, 0, lineOfScrimmage));        // Right WR

        // Tight End
        positions.push(new THREE.Vector3(4.5, 0, lineOfScrimmage));

        return positions;
    }

    getDefensiveFormation() {
        // 4-3 Defense
        const lineOfScrimmage = -10;
        const positions = [];

        // Defensive Line (4 players)
        positions.push(new THREE.Vector3(-2.5, 0, lineOfScrimmage + 1));  // Left DE
        positions.push(new THREE.Vector3(-0.8, 0, lineOfScrimmage + 1));  // Left DT
        positions.push(new THREE.Vector3(0.8, 0, lineOfScrimmage + 1));   // Right DT
        positions.push(new THREE.Vector3(2.5, 0, lineOfScrimmage + 1));   // Right DE

        // Linebackers (3 players)
        positions.push(new THREE.Vector3(-3, 0, lineOfScrimmage + 5));    // Left LB
        positions.push(new THREE.Vector3(0, 0, lineOfScrimmage + 5));     // Middle LB
        positions.push(new THREE.Vector3(3, 0, lineOfScrimmage + 5));     // Right LB

        // Secondary (4 players - 2 CBs, 2 Safeties)
        positions.push(new THREE.Vector3(-10, 0, lineOfScrimmage + 8));   // Left CB
        positions.push(new THREE.Vector3(10, 0, lineOfScrimmage + 8));    // Right CB
        positions.push(new THREE.Vector3(-5, 0, lineOfScrimmage + 12));   // Free Safety
        positions.push(new THREE.Vector3(5, 0, lineOfScrimmage + 12));    // Strong Safety

        return positions;
    }

    update(deltaTime, ballPosition, currentPlay) {
        this.playTimer += deltaTime;

        // EXTENDED PLAY STATE MACHINE - allows plays up to 70 seconds
        if (this.playState === 'set' && this.playTimer > 2.0) {
            this.startPlay();
        }
        // Only reset after a VERY long time, and only if play is marked complete
        else if (this.playState === 'play' && this.playTimer > 65.0) {
            this.resetFormation();
        }

        // Update all players with extended play awareness
        this.players.forEach(player => {
            player.update(deltaTime, ballPosition, this.playState);
        });
    }

    startPlay() {
        this.playState = 'play';
        this.playTimer = 0;
        // Players will start running their routes via their AI
    }

    resetFormation() {
        this.playState = 'set';
        this.playTimer = 0;

        // Reset players to formation
        const offensePositions = this.getOffensiveFormation();
        const defensePositions = this.getDefensiveFormation();

        this.players.forEach((player, i) => {
            if (i < 11) {
                // Offense
                player.setFormationPosition(offensePositions[i]);
            } else {
                // Defense
                player.setFormationPosition(defensePositions[i - 11]);
            }
        });

        // Move line of scrimmage forward randomly (simulate progress)
        const allPositions = [...offensePositions, ...defensePositions];
        const advance = Math.random() * 10 + 5;  // 5-15 yards
        allPositions.forEach(pos => {
            pos.z += advance;
        });
    }

    getPlayers() {
        return this.players;
    }

    getOffensivePlayers() {
        return this.players.filter((p, i) => i < 11);
    }

    getDefensivePlayers() {
        return this.players.filter((p, i) => i >= 11);
    }
}
