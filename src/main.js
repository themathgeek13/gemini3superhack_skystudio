import * as THREE from 'three';
import Stats from 'stats.js';

// Core
import { SceneManager } from './core/SceneManager.js';
import { PhysicsManager } from './core/PhysicsManager.js';
import { TimeController } from './core/TimeController.js';
import { Config } from './core/Config.js';

// Sports
import { GameController } from './sports/GameController.js';

// Drones
import { DroneFleet } from './drones/DroneFleet.js';

// Capture
import { PointCloudGenerator } from './capture/PointCloudGenerator.js';
import { PointCloudRenderer } from './capture/PointCloudRenderer.js';

// UI
import { ControlPanel } from './ui/ControlPanel.js';
import { ViewManager } from './ui/ViewManager.js';
import { StatsDisplay } from './ui/StatsDisplay.js';

// Visualization
import { CoverageHeatmap } from './visualization/CoverageHeatmap.js';
import { DroneTrails } from './visualization/DroneTrails.js';
import { FOVVisualizer } from './visualization/FOVVisualizer.js';

class App {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.clock = new THREE.Clock();
        this.running = false;

        // Performance stats
        this.stats = new Stats();
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);

        // FPS calculation
        this.fpsFrames = 0;
        this.fpsTime = 0;
        this.currentFPS = 0;

        // Initialize systems
        this.init();
    }

    async init() {
        console.log('Initializing application...');

        // Core systems
        this.sceneManager = new SceneManager(this.canvas);
        this.physicsManager = new PhysicsManager();
        this.timeController = new TimeController();

        await this.physicsManager.init();

        // Create ground collider
        this.physicsManager.createGroundCollider();

        // Game
        this.gameController = new GameController(
            this.sceneManager.scene,
            this.physicsManager
        );

        // Drones
        this.droneFleet = new DroneFleet(
            this.sceneManager.scene,
            this.physicsManager
        );

        // Deploy drones initially
        this.droneFleet.deploy(Config.DRONE.defaultCount);

        // Point cloud
        this.pointCloudGenerator = new PointCloudGenerator();
        this.pointCloudRenderer = new PointCloudRenderer(this.sceneManager.scene);

        // Visualization
        this.coverageHeatmap = new CoverageHeatmap(this.sceneManager.scene);
        this.droneTrails = new DroneTrails(this.sceneManager.scene);
        this.fovVisualizer = new FOVVisualizer(this.sceneManager.scene);

        // UI
        this.controlPanel = new ControlPanel();
        this.viewManager = new ViewManager(
            this.canvas,
            this.droneFleet,
            this.sceneManager.renderer,
            this.sceneManager.scene,
            this.sceneManager  // Pass sceneManager to disable resize during multi-view
        );
        this.statsDisplay = new StatsDisplay();

        // Setup UI callbacks
        this.setupUICallbacks();

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Start
        this.running = true;
        this.animate();

        console.log('Application initialized!');
    }

    setupUICallbacks() {
        this.controlPanel.on('viewChange', (view) => {
            this.viewManager.switchView(view);
            this.updateViewModeDisplay();
        });

        this.controlPanel.on('playPause', () => {
            const isPaused = this.timeController.togglePause();
            this.controlPanel.updatePlayPauseButton(isPaused);
        });

        this.controlPanel.on('timeSpeedChange', (speed) => {
            this.timeController.setTimeScale(speed);
        });

        this.controlPanel.on('droneCountChange', (count) => {
            // Store for next deployment
            this.pendingDroneCount = count;
        });

        this.controlPanel.on('deployDrones', () => {
            const count = this.pendingDroneCount || Config.DRONE.defaultCount;
            this.droneFleet.deploy(count);
            this.droneTrails.clear();
        });

        this.controlPanel.on('togglePointcloud', (show) => {
            this.pointCloudRenderer.setVisible(show);
        });

        this.controlPanel.on('toggleDrones', (show) => {
            this.droneFleet.setVisible(show);
        });

        this.controlPanel.on('toggleTrails', (show) => {
            this.droneFleet.setTrailVisible(show);
        });

        this.controlPanel.on('toggleFov', (show) => {
            this.droneFleet.setFrustumVisible(show);
        });

        this.controlPanel.on('toggleMultiView', () => {
            this.viewManager.toggleMultiDroneView();
        });

        this.controlPanel.on('aiViewCapture', () => {
            // Toggle AI View on/off
            if (this.viewManager.isAIViewActive()) {
                this.viewManager.deactivateAIView();
            } else {
                this.captureAIViewMoment();
            }
        });

        this.controlPanel.on('resetSimulation', () => {
            window.location.reload();
        });
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    const isPaused = this.timeController.togglePause();
                    this.controlPanel.updatePlayPauseButton(isPaused);
                    break;
                case 'd':
                    const count = this.pendingDroneCount || Config.DRONE.defaultCount;
                    this.droneFleet.deploy(count);
                    this.droneTrails.clear();
                    break;
            }
        });
    }

    updateViewModeDisplay() {
        const currentView = this.viewManager.getCurrentView();
        this.statsDisplay.setViewMode(currentView);
    }

    animate() {
        if (!this.running) return;

        requestAnimationFrame(() => this.animate());

        this.stats.begin();

        const deltaTime = this.clock.getDelta();
        const timeScale = this.timeController.update(deltaTime);

        // Calculate FPS
        this.fpsFrames++;
        this.fpsTime += deltaTime;
        if (this.fpsTime >= 1.0) {
            this.currentFPS = Math.round(this.fpsFrames / this.fpsTime);
            this.fpsFrames = 0;
            this.fpsTime = 0;
        }

        // Update physics
        this.physicsManager.update(deltaTime, timeScale);

        // Update game
        if (timeScale > 0) {
            this.gameController.update(deltaTime * timeScale);

            // Update drones with player tracking
            const ballPosition = this.gameController.getBallPosition();
            const players = this.gameController.getPlayers();
            this.droneFleet.update(deltaTime * timeScale, ballPosition, players);
        }

        // Update cameras
        const ballPosition = this.gameController.getBallPosition();
        this.viewManager.update(deltaTime, ballPosition);

        // Point cloud disabled - causing rendering issues
        // Focus on drone formation control and camera views instead

        // Set active camera
        const activeCamera = this.viewManager.getActiveCamera();
        this.sceneManager.camera = activeCamera;

        // Render multi-drone view if active (splits screen into 3-6 random drone POVs)
        const multiDroneActive = this.viewManager.renderMultiDroneView(deltaTime);

        // If not in multi-drone view, render normally
        if (!multiDroneActive) {
            this.sceneManager.render();
        }

        // Update stats display
        this.updateStatsDisplay();

        this.stats.end();
    }

    updateStatsDisplay() {
        this.statsDisplay.setFPS(this.currentFPS);
        this.statsDisplay.setDroneCount(this.droneFleet.getDroneCount());
        this.statsDisplay.setPointCount(this.pointCloudRenderer.getPointCount());
        this.statsDisplay.setTimeScale(this.timeController.getEffectiveTimeScale());
        this.statsDisplay.render();
    }

    captureAIViewMoment() {
        // Pause time if not already paused
        if (!this.timeController.isPaused) {
            this.timeController.togglePause();
            this.controlPanel.updatePlayPauseButton(true);
        }

        // Get focus point (ball + players center)
        const ballPos = this.gameController.getBallPosition();
        const players = this.gameController.getPlayers();

        let centerX = ballPos.x;
        let centerY = ballPos.y;
        let centerZ = ballPos.z;
        let count = 1;

        players.forEach(player => {
            const pos = player.getPosition();
            centerX += pos.x;
            centerY += pos.y;
            centerZ += pos.z;
            count++;
        });

        const focusPoint = new THREE.Vector3(
            centerX / count,
            centerY / count,
            centerZ / count
        );

        // Activate AI View - cinematic fullscreen orbit
        this.viewManager.activateAIView(focusPoint);

        console.log('🤖 AI View activated - time frozen, cinematic orbit started');
    }

    dispose() {
        this.running = false;
        this.droneFleet.clear();
        this.pointCloudRenderer.dispose();
    }
}

// Start the application
const app = new App();

// Expose app to window for debugging
window.app = app;

// Handle page unload
window.addEventListener('beforeunload', () => {
    app.dispose();
});
