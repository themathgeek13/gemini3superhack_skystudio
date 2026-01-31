import { Config } from './Config.js';
import { MathUtils } from '../utils/MathUtils.js';

export class TimeController {
    constructor() {
        this.timeScale = 1.0;
        this.targetTimeScale = 1.0;
        this.transitionSpeed = 1.0 / Config.TIME.transitionDuration;
        this.isPaused = false;
        this.isBulletTime = false;
        this.bulletTimeTimer = 0;
    }

    update(deltaTime) {
        // Smooth transition to target time scale
        if (Math.abs(this.timeScale - this.targetTimeScale) > 0.01) {
            const diff = this.targetTimeScale - this.timeScale;
            this.timeScale += diff * this.transitionSpeed * deltaTime;
        } else {
            this.timeScale = this.targetTimeScale;
        }

        // Bullet time auto-end
        if (this.isBulletTime) {
            this.bulletTimeTimer += deltaTime;
            if (this.bulletTimeTimer >= Config.TIME.bulletTimeDuration) {
                this.endBulletTime();
            }
        }

        return this.isPaused ? 0 : this.timeScale;
    }

    setTimeScale(scale) {
        this.targetTimeScale = MathUtils.clamp(scale, 0, 2);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    startBulletTime() {
        this.isBulletTime = true;
        this.bulletTimeTimer = 0;
        this.targetTimeScale = Config.TIME.bulletTimeScale;
    }

    endBulletTime() {
        this.isBulletTime = false;
        this.bulletTimeTimer = 0;
        this.targetTimeScale = 1.0;
    }

    toggleBulletTime() {
        if (this.isBulletTime) {
            this.endBulletTime();
        } else {
            this.startBulletTime();
        }
        return this.isBulletTime;
    }

    getEffectiveTimeScale() {
        return this.isPaused ? 0 : this.timeScale;
    }

    isInBulletTime() {
        return this.isBulletTime;
    }
}
