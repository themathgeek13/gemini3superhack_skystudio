import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { GeometryUtils } from '../utils/GeometryUtils.js';

export class Drone {
    constructor(scene, physicsManager, id, startPosition) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.id = id;

        // Visual mesh
        this.mesh = GeometryUtils.createDroneModel();
        this.mesh.position.copy(startPosition);
        this.scene.add(this.mesh);

        // Physics body
        this.rigidBody = physicsManager.createDroneBody(startPosition);

        // Camera for this drone
        this.camera = new THREE.PerspectiveCamera(
            Config.DRONE.cameraFOV,
            window.innerWidth / window.innerHeight,
            Config.DRONE.cameraNear,
            Config.DRONE.cameraFar
        );
        this.mesh.add(this.camera);

        // Camera frustum helper (for visualization)
        this.frustumHelper = GeometryUtils.createFrustumHelper(this.camera, 0x00FF00);
        this.scene.add(this.frustumHelper);

        // Trail for visualization
        this.trail = [];
        this.trailMesh = null;
        this.createTrail();

        // State
        this.active = true;
        this.propellerRotation = 0;
        this.freezeCamera = false;  // Flag to lock camera during multi-view
        this.lastValidQuaternion = new THREE.Quaternion();  // Cache camera rotation
    }

    createTrail() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: 0x00FF00,
            transparent: true,
            opacity: 0.3,
            linewidth: 1
        });

        this.trailMesh = new THREE.Line(geometry, material);
        this.scene.add(this.trailMesh);
    }

    update(deltaTime, forces, trackingTarget) {
        if (!this.active || !this.rigidBody) return;

        // Apply AI forces
        this.physicsManager.applyForce(this.rigidBody, forces);

        // Get physics position
        let pos = this.physicsManager.getPosition(this.rigidBody);

        // === HARD CONSTRAINTS: Keep drone in bounded region ===
        // This prevents physics runaway without using excessive forces
        let constrained = false;

        // Clamp horizontal distance from center (field boundary)
        const horizontalDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        const maxDist = Config.DRONE.maxDistanceFromCenter || 40.0;
        if (horizontalDist > maxDist) {
            const scale = maxDist / horizontalDist;
            pos.x *= scale;
            pos.z *= scale;
            constrained = true;
        }

        // Clamp vertical position (height bounds)
        const minHeight = Config.DRONE.minHeight || 5.0;
        const maxHeight = Config.DRONE.maxHeight || 12.0;
        if (pos.y < minHeight) {
            pos.y = minHeight;
            constrained = true;
        } else if (pos.y > maxHeight) {
            pos.y = maxHeight;
            constrained = true;
        }

        // If position was constrained, update physics body and reset velocity in that direction
        if (constrained) {
            this.physicsManager.setPosition(this.rigidBody, pos);
            // Stop vertical velocity if we hit a height boundary
            if (pos.y === minHeight || pos.y === maxHeight) {
                const vel = this.rigidBody.linvel();
                this.rigidBody.setLinvel({ x: vel.x, y: 0, z: vel.z }, true);
            }
        }

        // Sync mesh with (possibly constrained) physics position
        this.mesh.position.set(pos.x, pos.y, pos.z);

        // Update camera to track the formation center (ball + players)
        this.camera.position.copy(this.mesh.position);

        if (trackingTarget) {
            // Point camera at the tracking target (formation center)
            this.camera.lookAt(trackingTarget.x, trackingTarget.y, trackingTarget.z);
        } else {
            // Fallback: look at ground below
            this.camera.lookAt(pos.x, 0, pos.z);
        }

        // Update frustum helper
        if (this.frustumHelper) {
            this.frustumHelper.update();
        }

        // Animate propellers
        this.animatePropellers(deltaTime);

        // Update trail
        this.updateTrail(pos);
    }

    animatePropellers(deltaTime) {
        if (this.mesh.propellers) {
            this.propellerRotation += deltaTime * 30;
            this.mesh.propellers.forEach(prop => {
                prop.rotation.z = this.propellerRotation;
            });
        }
    }

    updateTrail(position) {
        this.trail.push(new THREE.Vector3(position.x, position.y, position.z));
        if (this.trail.length > Config.EFFECTS.trailLength) {
            this.trail.shift();
        }

        if (this.trailMesh && this.trail.length > 1) {
            this.trailMesh.geometry.setFromPoints(this.trail);
        }
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    getCamera() {
        return this.camera;
    }

    setFrustumVisible(visible) {
        if (this.frustumHelper) {
            this.frustumHelper.visible = visible;
        }
    }

    setTrailVisible(visible) {
        if (this.trailMesh) {
            this.trailMesh.visible = visible;
        }
    }

    setCameraFrozen(frozen) {
        this.freezeCamera = frozen;
    }

    isCameraFrozen() {
        return this.freezeCamera;
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    dispose() {
        this.active = false;
        this.scene.remove(this.mesh);
        this.scene.remove(this.trailMesh);
        this.scene.remove(this.frustumHelper);
        if (this.rigidBody) {
            this.physicsManager.removeBody(this.rigidBody);
        }
    }
}
