import * as THREE from 'three';

export class PlayCaller {
    constructor() {
        this.currentPlay = null;
        this.playTimer = 0;
        this.playDuration = 60;  // EXTENDED: 60 seconds for realistic long plays
        this.playPhase = 0;  // 0=setup, 1=snap, 2=development, 3=completion
        this.plays = [
            'pass_short', 'pass_deep', 'run_left', 'run_right', 'run_middle',
            'screen', 'play_action', 'quarterback_scramble', 'flea_flicker', 'trick_play'
        ];
    }

    update(deltaTime) {
        this.playTimer += deltaTime;

        if (this.playTimer >= this.playDuration) {
            this.callNewPlay();
        }
    }

    callNewPlay() {
        this.playTimer = 0;
        this.currentPlay = this.plays[Math.floor(Math.random() * this.plays.length)];
        this.playDuration = 50 + Math.random() * 20;  // 50-70 seconds for extended plays
        this.playPhase = 0;
        return this.currentPlay;
    }

    getPlayAction(playType) {
        // Extended play actions with more realistic trajectories and longer developments
        const actions = {
            pass_short: {
                ballStart: { x: 0, y: 1.8, z: -10 },
                ballVelocity: { x: (Math.random() - 0.5) * 6, y: 5, z: 14 },
                spin: 25,
                description: 'Short slant pass'
            },
            pass_deep: {
                ballStart: { x: 0, y: 1.8, z: -10 },
                ballVelocity: { x: (Math.random() - 0.5) * 5, y: 12, z: 50 },
                spin: 35,
                description: 'Deep bomb down the sideline'
            },
            run_left: {
                ballStart: { x: -2, y: 1.2, z: -8 },
                ballVelocity: { x: -8, y: 0.5, z: 8 },
                spin: 8,
                description: 'Toss sweep left'
            },
            run_right: {
                ballStart: { x: 2, y: 1.2, z: -8 },
                ballVelocity: { x: 8, y: 0.5, z: 8 },
                spin: 8,
                description: 'Toss sweep right'
            },
            run_middle: {
                ballStart: { x: 0, y: 1.2, z: -8 },
                ballVelocity: { x: 0, y: 0.5, z: 12 },
                spin: 5,
                description: 'Power run up the middle'
            },
            screen: {
                ballStart: { x: 0, y: 1.5, z: -12 },
                ballVelocity: { x: (Math.random() - 0.5) * 8, y: 2, z: 6 },
                spin: 12,
                description: 'Screen pass to sideline'
            },
            play_action: {
                ballStart: { x: 0, y: 1.8, z: -10 },
                ballVelocity: { x: (Math.random() - 0.5) * 8, y: 8, z: 30 },
                spin: 28,
                description: 'Play action fake bomb'
            },
            quarterback_scramble: {
                ballStart: { x: (Math.random() - 0.5) * 4, y: 1.5, z: -10 },
                ballVelocity: { x: (Math.random() - 0.5) * 6, y: 1, z: 14 },
                spin: 10,
                description: 'QB scrambles up field'
            },
            flea_flicker: {
                ballStart: { x: 0, y: 1.2, z: -8 },
                ballVelocity: { x: 8, y: 0.5, z: 8 },
                spin: 6,
                description: 'Flea flicker - hand off then lateral pass'
            },
            trick_play: {
                ballStart: { x: -3, y: 1.2, z: -8 },
                ballVelocity: { x: -6, y: 1, z: 20 },
                spin: 12,
                description: 'Reverse with halfback pass'
            }
        };

        return actions[playType] || actions.pass_short;
    }

    getCurrentPlay() {
        return this.currentPlay;
    }
}
