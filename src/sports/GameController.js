import { FootballField } from './FootballField.js';
import { Football } from './Football.js';
import { FootballPlayerManager } from './FootballPlayerManager.js';
import { PlayCaller } from './PlayCaller.js';

export class GameController {
    constructor(scene, physicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;

        // Create game elements
        this.field = new FootballField(scene);
        this.ball = new Football(scene, physicsManager);
        this.playerManager = new FootballPlayerManager(scene, physicsManager);
        this.playCaller = new PlayCaller();

        // Game state
        this.gameTime = 0;
        this.quarter = 1;
        this.down = 1;
        this.yardsToGo = 10;
        this.nextPlayTime = 3;  // Wait 3 seconds before first play starts
        this.playStarted = false;  // Track if current play has been initiated
        this.outOfBoundsTimer = 0;  // Timer for ball out of bounds
        this.outOfBoundsThreshold = 5;  // Reset after 5 seconds out of bounds
    }

    update(deltaTime) {
        this.gameTime += deltaTime;

        // Update play caller (handles extending plays to 50-70 seconds)
        this.playCaller.update(deltaTime);

        // Run new play ONCE at the start of each play cycle
        if (this.gameTime >= this.nextPlayTime && !this.playStarted) {
            this.runPlay();
            this.playStarted = true;
            this.outOfBoundsTimer = 0;
            this.ball.clearOutOfBounds();
        }

        const ballPosition = this.ball.getPosition();

        this.ball.update(deltaTime);
        this.playerManager.update(deltaTime, ballPosition, this.playCaller.getCurrentPlay());

        // CHECK IF BALL IS OUT OF BOUNDS
        if (this.ball.isOutOfBounds()) {
            this.outOfBoundsTimer += deltaTime;

            // If out of bounds too long, end the play and start new one
            if (this.outOfBoundsTimer >= this.outOfBoundsThreshold) {
                console.log('⚽ Ball out of bounds! Ending play and resetting...');
                this.endPlay();
            }
        } else {
            this.outOfBoundsTimer = 0;
        }

        // When play completes naturally, prepare for next play
        if (this.playStarted && this.playCaller.playTimer >= this.playCaller.playDuration) {
            this.endPlay();
        }
    }

    endPlay() {
        this.nextPlayTime = this.gameTime + 2;  // 2 second setup before next play
        this.playStarted = false;
        this.outOfBoundsTimer = 0;
        this.ball.clearOutOfBounds();
    }

    runPlay() {
        const playType = this.playCaller.callNewPlay();
        const action = this.playCaller.getPlayAction(playType);

        // Execute the play
        this.physicsManager.setPosition(this.ball.rigidBody, action.ballStart);
        this.physicsManager.setVelocity(this.ball.rigidBody, { x: 0, y: 0, z: 0 });

        setTimeout(() => {
            this.physicsManager.applyImpulse(this.ball.rigidBody, action.ballVelocity);
            this.ball.spinSpeed = action.spin;
            this.ball.spinAxis.set(
                Math.random() * 0.2,
                Math.random() * 0.2,
                1
            ).normalize();
        }, 100);
    }

    getBallPosition() {
        return this.ball.getPosition();
    }

    getPlayers() {
        return this.playerManager.getPlayers();
    }

    reset() {
        this.ball.reset();
        this.gameTime = 0;
    }
}
