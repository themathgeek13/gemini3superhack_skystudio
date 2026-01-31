import { FreeCamera } from '../cameras/FreeCamera.js';
import { BroadcastCamera } from '../cameras/BroadcastCamera.js';
import { DroneCamera } from '../cameras/DroneCamera.js';
import { GeminiBulletTime } from '../cameras/GeminiBulletTime.js';
import { MultiDroneView } from '../cameras/MultiDroneView.js';
import { AIViewController } from '../cameras/AIViewController.js';

export class ViewManager {
    constructor(canvas, droneFleet, renderer, scene, sceneManager) {
        this.canvas = canvas;
        this.droneFleet = droneFleet;
        this.renderer = renderer;
        this.scene = scene;
        this.sceneManager = sceneManager;

        // Create cameras
        this.freeCamera = new FreeCamera(canvas);
        this.broadcastCamera = new BroadcastCamera();
        this.droneCamera = new DroneCamera(droneFleet);
        this.bulletTimeController = new GeminiBulletTime(canvas, droneFleet);
        this.aiViewController = new AIViewController(canvas, droneFleet);
        this.multiDroneView = new MultiDroneView(renderer, scene, droneFleet);

        // Current view
        this.currentView = 'free';
        this.currentCamera = this.freeCamera;

        // Setup keyboard shortcuts
        this.setupKeyboardControls();
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case '1':
                    this.switchView('free');
                    break;
                case '2':
                    this.switchView('broadcast');
                    break;
                case '3':
                    this.switchView('drone');
                    break;
                case '4':
                    this.switchView('pointcloud');
                    break;
                case 'm':
                case 'M':
                    this.toggleMultiDroneView();
                    break;
                case 'Escape':
                    if (this.aiViewController.isActive()) {
                        this.deactivateAIView();
                    }
                    break;
                case 'ArrowLeft':
                    if (this.currentView === 'drone') {
                        this.droneCamera.previousDrone();
                    }
                    break;
                case 'ArrowRight':
                    if (this.currentView === 'drone') {
                        this.droneCamera.nextDrone();
                    }
                    break;
            }
        });
    }

    switchView(viewName) {
        this.currentView = viewName;

        // Disable all camera controls
        this.freeCamera.disable();
        this.broadcastCamera.disable();
        this.droneCamera.disable();

        switch(viewName) {
            case 'free':
                this.currentCamera = this.freeCamera;
                this.freeCamera.enable();
                break;
            case 'broadcast':
                this.currentCamera = this.broadcastCamera;
                break;
            case 'drone':
                this.currentCamera = this.droneCamera;
                break;
            case 'pointcloud':
                // Use free camera for point cloud view
                this.currentCamera = this.freeCamera;
                this.freeCamera.enable();
                break;
            default:
                this.currentCamera = this.freeCamera;
                this.freeCamera.enable();
        }
    }

    update(deltaTime, ballPosition) {
        // Update active camera
        if (this.aiViewController.isActive()) {
            this.aiViewController.update(deltaTime);
        } else if (this.bulletTimeController.isActive()) {
            this.bulletTimeController.update(deltaTime);
        } else {
            this.freeCamera.update(deltaTime);
            this.broadcastCamera.update(deltaTime, ballPosition);
            this.droneCamera.update(deltaTime);
        }
    }

    getActiveCamera() {
        if (this.aiViewController.isActive()) {
            return this.aiViewController.getCamera();
        }
        if (this.bulletTimeController.isActive()) {
            return this.bulletTimeController.getCamera();
        }
        return this.currentCamera.getCamera();
    }

    activateBulletTime(focusPoint) {
        this.bulletTimeController.activate(focusPoint);
    }

    deactivateBulletTime() {
        this.bulletTimeController.deactivate();
    }

    isBulletTimeActive() {
        return this.bulletTimeController.isActive();
    }

    getCurrentView() {
        return this.currentView;
    }

    toggleMultiDroneView() {
        const newState = !this.multiDroneView.isActive();
        this.multiDroneView.setActive(newState);

        // Prevent resize events from interfering with multi-view rendering
        if (this.sceneManager) {
            this.sceneManager.ignoreResize = newState;
            // Also disable orbit controls to prevent camera shifts
            this.sceneManager.controls.enabled = !newState;
        }

        // Disable free camera controls during multi-view
        if (newState) {
            this.freeCamera.disable();
        } else {
            this.freeCamera.enable();
        }

        console.log(`Multi-drone view: ${newState ? 'ON (controls locked)' : 'OFF (controls enabled)'}`);
        return newState;
    }

    renderMultiDroneView(deltaTime = 0) {
        // Don't render multi-view if AI View is active
        if (this.aiViewController.isActive()) {
            return false;
        }
        if (this.multiDroneView.isActive()) {
            this.multiDroneView.render(deltaTime);
            return true;
        }
        return false;
    }

    activateAIView(focusPoint) {
        // Pause all UI controls during AI View
        if (this.sceneManager) {
            this.sceneManager.ignoreResize = true;
            this.sceneManager.controls.enabled = false;
        }

        // Disable free camera
        this.freeCamera.disable();

        // Get drone count for overlay
        const drones = this.droneFleet.getActiveDrones();

        // Pass exit callback to AI View
        this.aiViewController.activate(
            focusPoint,
            drones.length,
            () => this.deactivateAIView()
        );

        console.log('AI View activated - fullscreen cinematic mode');
    }

    deactivateAIView() {
        // Re-enable controls
        if (this.sceneManager) {
            this.sceneManager.ignoreResize = false;
            this.sceneManager.controls.enabled = true;
        }

        // Re-enable free camera
        this.freeCamera.enable();

        // Deactivate AI View
        this.aiViewController.deactivate();

        console.log('AI View deactivated');
    }

    isAIViewActive() {
        return this.aiViewController.isActive();
    }

    onWindowResize() {
        if (this.aiViewController) {
            this.aiViewController.onWindowResize();
        }
    }
}
