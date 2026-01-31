import * as THREE from 'three';
import { Config } from '../core/Config.js';

/**
 * AI View Controller - Cinematic reconstruction from frozen moment
 * Shows a smooth orbital camera around frozen players/ball
 * Demonstrates volumetric capture from multiple drone angles
 */
export class AIViewController {
    constructor(canvas, droneFleet) {
        this.canvas = canvas;
        this.droneFleet = droneFleet;

        this.camera = new THREE.PerspectiveCamera(
            Config.CAMERA.fov,
            window.innerWidth / window.innerHeight,
            Config.CAMERA.near,
            Config.CAMERA.far
        );

        this.active = false;
        this.orbitProgress = 0;
        this.orbitSpeed = 0.15; // Slow, cinematic speed
        this.orbitRadius = 15; // Larger radius for dramatic view
        this.orbitHeight = 8; // Higher vantage point
        this.focusPoint = new THREE.Vector3();
        this.droneCount = 0;

        // Camera control modes
        this.controlMode = 'MOVEMENT'; // 'MOVEMENT' or 'ROTATION'
        this.cameraOffset = new THREE.Vector3(0, 8, 15); // Offset from focus point
        this.movementSpeed = 30; // Units per second (increased for snappier response)
        this.zoomSpeed = 8; // Units per second
        this.rotationSpeed = 1.5; // Radians per second

        // Key state tracking for smooth continuous movement
        this.keysPressed = {
            'ArrowLeft': false,
            'ArrowRight': false,
            'ArrowUp': false,
            'ArrowDown': false,
            '+': false,
            '-': false,
            '=': false,
            '_': false,
        };

        // Create overlay canvas for text
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.width = window.innerWidth;
        this.overlayCanvas.height = window.innerHeight;
        this.overlayCtx = this.overlayCanvas.getContext('2d');

        this.setupUIOverlay();
        this.setupResizeListener();
        this.setupKeyboardControls();
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            if (this.active) {
                this.onWindowResize();
            }
        });
    }

    setupKeyboardControls() {
        // Track key states for smooth continuous movement
        window.addEventListener('keydown', (e) => {
            if (!this.active) return;

            // Mode toggle
            if (e.key.toLowerCase() === 'r') {
                e.preventDefault();
                this.toggleControlMode();
                return;
            }

            // Track key state
            if (e.key in this.keysPressed) {
                e.preventDefault();
                this.keysPressed[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!this.active) return;

            // Stop tracking key state
            if (e.key in this.keysPressed) {
                this.keysPressed[e.key] = false;
            }
        });

        // Handle zoom with mouse wheel (works in both modes)
        window.addEventListener('wheel', (e) => {
            if (!this.active) return;
            e.preventDefault();

            const zoomAmount = e.deltaY > 0 ? this.zoomSpeed : -this.zoomSpeed;
            const zoomDir = new THREE.Vector3()
                .subVectors(this.cameraOffset, this.focusPoint)
                .normalize();

            this.cameraOffset.addScaledVector(zoomDir, zoomAmount * (1/60));

            // Clamp zoom distance
            const distFromFocus = this.cameraOffset.distanceTo(this.focusPoint);
            if (distFromFocus < 3) {
                this.cameraOffset.copy(this.focusPoint).addScaledVector(zoomDir, 3);
            } else if (distFromFocus > 50) {
                this.cameraOffset.copy(this.focusPoint).addScaledVector(zoomDir, 50);
            }
        }, { passive: false });
    }

    toggleControlMode() {
        this.controlMode = this.controlMode === 'MOVEMENT' ? 'ROTATION' : 'MOVEMENT';
        console.log(`AI View control mode: ${this.controlMode}`);
    }

    updateControlsFromKeyState(deltaTime) {
        if (!this.active) return;

        if (this.controlMode === 'ROTATION') {
            this.updateRotationControls(deltaTime);
        } else if (this.controlMode === 'MOVEMENT') {
            this.updateMovementControls(deltaTime);
        }
    }

    updateRotationControls(deltaTime) {
        if (this.keysPressed['ArrowLeft']) {
            this.orbitProgress -= this.rotationSpeed * deltaTime;
        }
        if (this.keysPressed['ArrowRight']) {
            this.orbitProgress += this.rotationSpeed * deltaTime;
        }
        if (this.keysPressed['ArrowUp']) {
            this.orbitHeight = Math.min(this.orbitHeight + 15 * deltaTime, 30);
        }
        if (this.keysPressed['ArrowDown']) {
            this.orbitHeight = Math.max(this.orbitHeight - 15 * deltaTime, 2);
        }
    }

    updateMovementControls(deltaTime) {
        const moveAmount = this.movementSpeed * deltaTime;

        if (this.keysPressed['ArrowLeft']) {
            this.cameraOffset.x -= moveAmount;
        }
        if (this.keysPressed['ArrowRight']) {
            this.cameraOffset.x += moveAmount;
        }
        if (this.keysPressed['ArrowUp']) {
            // Move forward (along Z axis, towards the focus point)
            this.cameraOffset.z -= moveAmount;
        }
        if (this.keysPressed['ArrowDown']) {
            // Move backward (away from focus point)
            this.cameraOffset.z += moveAmount;
        }
        if (this.keysPressed['+'] || this.keysPressed['=']) {
            this.cameraOffset.y += moveAmount * 1.5;
        }
        if (this.keysPressed['-'] || this.keysPressed['_']) {
            this.cameraOffset.y -= moveAmount * 1.5;
        }
    }

    setupUIOverlay() {
        // Style the overlay canvas
        this.overlayCanvas.id = 'ai-view-overlay';
        this.overlayCanvas.style.position = 'fixed';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.pointerEvents = 'none';
        this.overlayCanvas.style.zIndex = '999';
        this.overlayCanvas.style.display = 'none';

        // Create invisible click target for exiting
        this.exitClickZone = document.createElement('div');
        this.exitClickZone.id = 'ai-view-exit-zone';
        this.exitClickZone.style.position = 'fixed';
        this.exitClickZone.style.top = '0';
        this.exitClickZone.style.left = '0';
        this.exitClickZone.style.width = '100%';
        this.exitClickZone.style.height = '100%';
        this.exitClickZone.style.zIndex = '998';
        this.exitClickZone.style.display = 'none';
        this.exitClickZone.style.cursor = 'pointer';
        document.body.appendChild(this.exitClickZone);
    }

    activate(focusPoint, droneCount = 0, onExitCallback = null) {
        this.active = true;
        this.orbitProgress = 0;
        this.focusPoint.copy(focusPoint);
        this.droneCount = droneCount;
        this.onExitCallback = onExitCallback;

        // Initialize camera offset for movement mode
        // Start with a nice default perspective
        this.cameraOffset.set(0, 8, 15);

        // Add overlay to DOM
        if (!this.overlayCanvas.parentElement) {
            document.body.appendChild(this.overlayCanvas);
        }
        this.overlayCanvas.style.display = 'block';

        // Show exit zone
        this.exitClickZone.style.display = 'block';
        this.exitClickZone.onclick = () => this.handleExit();

        // Disable all UI
        this.hideControlPanel();

        console.log('🤖 AI View activated - cinematically orbiting frozen moment');
    }

    deactivate() {
        this.active = false;

        // Remove overlay
        if (this.overlayCanvas.parentElement) {
            this.overlayCanvas.style.display = 'none';
        }

        // Hide exit zone
        this.exitClickZone.style.display = 'none';
        this.exitClickZone.onclick = null;

        // Show controls again
        this.showControlPanel();

        console.log('🤖 AI View deactivated');
    }

    handleExit() {
        if (this.onExitCallback) {
            this.onExitCallback();
        }
    }

    hideControlPanel() {
        const controlPanel = document.getElementById('control-panel');
        const statsDisplay = document.getElementById('stats-display');

        if (controlPanel) controlPanel.style.display = 'none';
        if (statsDisplay) statsDisplay.style.display = 'none';
    }

    showControlPanel() {
        const controlPanel = document.getElementById('control-panel');
        const statsDisplay = document.getElementById('stats-display');

        if (controlPanel) controlPanel.style.display = 'block';
        if (statsDisplay) statsDisplay.style.display = 'block';
    }

    update(deltaTime) {
        if (!this.active) return;

        // Update controls based on key state (smooth continuous movement)
        this.updateControlsFromKeyState(deltaTime);

        // Smooth orbital motion (only in rotation mode)
        if (this.controlMode === 'ROTATION') {
            this.orbitProgress += deltaTime * this.orbitSpeed;
        }

        this.updateCameraPosition();

        // Render overlay text
        this.renderOverlay();
    }

    updateCameraPosition() {
        if (this.controlMode === 'ROTATION') {
            // Orbital rotation mode
            const angle = this.orbitProgress * Math.PI * 2;

            const x = this.focusPoint.x + Math.cos(angle) * this.orbitRadius;
            const y = this.focusPoint.y + this.orbitHeight;
            const z = this.focusPoint.z + Math.sin(angle) * this.orbitRadius;

            this.camera.position.set(x, y, z);
        } else {
            // Free movement mode
            this.camera.position.copy(this.focusPoint).add(this.cameraOffset);
        }

        this.camera.lookAt(this.focusPoint);
    }

    renderOverlay() {
        const canvas = this.overlayCanvas;
        const ctx = this.overlayCtx;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Semi-transparent dark background at top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, 120);

        // Title
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.fillStyle = '#00FF88';
        ctx.textAlign = 'center';
        ctx.fillText('🤖 AI RECONSTRUCTION', canvas.width / 2, 60);

        // Subtitle
        ctx.font = '18px Arial, sans-serif';
        ctx.fillStyle = '#00FF88';
        ctx.globalAlpha = 0.8;
        ctx.fillText(`Synthesized from ${this.droneCount} drone cameras`, canvas.width / 2, 100);

        // Bottom left info - controls
        ctx.globalAlpha = 1;
        ctx.font = '14px Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';

        if (this.controlMode === 'MOVEMENT') {
            ctx.fillText('← → ↑ ↓ Move | +/- Height | Scroll Zoom | R: Rotate Mode | ESC Exit', 30, canvas.height - 30);
        } else {
            ctx.fillText('← → Rotate | ↑ ↓ Height | Scroll Zoom | R: Movement Mode | ESC Exit', 30, canvas.height - 30);
        }

        // Mode indicator
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.fillStyle = this.controlMode === 'MOVEMENT' ? '#00FF88' : '#FFD700';
        ctx.textAlign = 'right';
        ctx.fillText(`[${this.controlMode}]`, canvas.width - 30, canvas.height - 30);
    }

    getCamera() {
        return this.camera;
    }

    isActive() {
        return this.active;
    }

    onWindowResize() {
        this.overlayCanvas.width = window.innerWidth;
        this.overlayCanvas.height = window.innerHeight;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}
