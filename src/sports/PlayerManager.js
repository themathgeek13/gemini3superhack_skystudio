import * as THREE from 'three';
import { Player } from './Player.js';
import { Config } from '../core/Config.js';

export class PlayerManager {
    constructor(scene, physicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.players = [];
        this.createPlayers();
    }

    createPlayers() {
        const positions = [
            new THREE.Vector3(-4, 0, 5),
            new THREE.Vector3(4, 0, 5),
            new THREE.Vector3(-4, 0, -5),
            new THREE.Vector3(4, 0, -5)
        ];

        for (let i = 0; i < Config.PLAYER.count; i++) {
            const player = new Player(
                this.scene,
                this.physicsManager,
                i,
                positions[i]
            );
            this.players.push(player);
        }
    }

    update(deltaTime, ballPosition) {
        this.players.forEach(player => {
            player.update(deltaTime, ballPosition);
        });
    }

    getPlayers() {
        return this.players;
    }
}
