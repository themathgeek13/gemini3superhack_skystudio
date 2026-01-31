import { Config } from './Config.js';

export class PhysicsManager {
    constructor() {
        this.world = null;
        this.bodies = new Map();
        this.ready = false;
        this.RAPIER = null;
    }

    async init() {
        // Dynamic import for WASM module
        const RAPIER_MODULE = await import('@dimforge/rapier3d');

        // Handle both default and named exports
        this.RAPIER = RAPIER_MODULE.default || RAPIER_MODULE;

        // Initialize WASM
        if (typeof this.RAPIER.init === 'function') {
            await this.RAPIER.init();
        }

        const gravity = Config.PHYSICS.gravity;
        this.world = new this.RAPIER.World(gravity);
        this.ready = true;
        console.log('Physics initialized');
    }

    createGroundCollider() {
        if (!this.ready) return null;

        const groundDesc = this.RAPIER.ColliderDesc.cuboid(50, 0.1, 50)
            .setTranslation(0, -0.1, 0)
            .setFriction(Config.BALL.friction);

        return this.world.createCollider(groundDesc);
    }

    createBallBody(position) {
        if (!this.ready) return null;

        const rigidBodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z);

        const rigidBody = this.world.createRigidBody(rigidBodyDesc);

        const colliderDesc = this.RAPIER.ColliderDesc.ball(Config.BALL.radius)
            .setRestitution(Config.BALL.restitution)
            .setFriction(Config.BALL.friction)
            .setDensity(Config.BALL.mass / (4/3 * Math.PI * Math.pow(Config.BALL.radius, 3)));

        this.world.createCollider(colliderDesc, rigidBody);

        return rigidBody;
    }

    createDroneBody(position) {
        if (!this.ready) return null;

        const rigidBodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z)
            .setLinearDamping(2.0)  // Air resistance
            .setAngularDamping(5.0);  // Stabilization

        const rigidBody = this.world.createRigidBody(rigidBodyDesc);

        // Small sphere collider for drone
        const colliderDesc = this.RAPIER.ColliderDesc.ball(Config.DRONE.size / 2)
            .setDensity(0.5);

        this.world.createCollider(colliderDesc, rigidBody);

        return rigidBody;
    }

    createPlayerBody(position) {
        if (!this.ready) return null;

        const rigidBodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(position.x, position.y, position.z);

        const rigidBody = this.world.createRigidBody(rigidBodyDesc);

        // Capsule collider for player
        const colliderDesc = this.RAPIER.ColliderDesc.capsule(
            Config.PLAYER.height / 2 - Config.PLAYER.radius,
            Config.PLAYER.radius
        );

        this.world.createCollider(colliderDesc, rigidBody);

        return rigidBody;
    }

    update(deltaTime, timeScale = 1.0) {
        if (!this.ready) return;

        const scaledDelta = deltaTime * timeScale;
        this.world.timestep = Math.min(scaledDelta, Config.PHYSICS.timestep);
        this.world.step();
    }

    applyForce(rigidBody, force) {
        if (!rigidBody) return;
        rigidBody.addForce(force, true);
    }

    applyImpulse(rigidBody, impulse) {
        if (!rigidBody) return;
        rigidBody.applyImpulse(impulse, true);
    }

    setVelocity(rigidBody, velocity) {
        if (!rigidBody) return;
        rigidBody.setLinvel(velocity, true);
    }

    getPosition(rigidBody) {
        if (!rigidBody) return { x: 0, y: 0, z: 0 };
        return rigidBody.translation();
    }

    setPosition(rigidBody, position) {
        if (!rigidBody) return;
        rigidBody.setTranslation(position, true);
    }

    removeBody(rigidBody) {
        if (!rigidBody || !this.world) return;
        this.world.removeRigidBody(rigidBody);
    }
}
