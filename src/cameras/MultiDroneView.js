import * as THREE from 'three';
import { Config } from '../core/Config.js';

export class MultiDroneView {
    constructor(renderer, scene, droneFleet) {
        this.renderer = renderer;
        this.scene = scene;
        this.droneFleet = droneFleet;
        this.viewports = [];
        this.active = false;
        this.maxViewCount = 6;  // Limit to 6 views for performance

        // Use primary tracking drones for command center
        this.primaryTrackingDroneIndices = Config.DRONE.primaryTrackingDrones || [0, 1, 2];

        // Cache viewport dimensions to prevent constant recalculation
        this.cachedViewportWidth = 0;
        this.cachedViewportHeight = 0;
        this.lastCanvasWidth = 0;
        this.lastCanvasHeight = 0;

        // Create mini viewports for drone feeds
        this.setupViewports();
    }

    setupViewports() {
        // Display up to 6 drone feeds (not all 12 to save performance)
        const drones = this.droneFleet.getActiveDrones();
        const viewCount = Math.min(drones.length, this.maxViewCount);

        // Simple grid layout (2x3 for 6 drones, or adjust as needed)
        this.viewports = [];
        const cols = Math.ceil(Math.sqrt(viewCount));
        const rows = Math.ceil(viewCount / cols);
        const padding = 5;
        const vpWidth = (window.innerWidth - padding * (cols + 1)) / cols;
        const vpHeight = (window.innerHeight - padding * (rows + 1)) / rows;

        for (let i = 0; i < viewCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;

            this.viewports.push({
                droneIndex: i,
                x: padding + col * (vpWidth + padding),
                y: padding + row * (vpHeight + padding),
                width: vpWidth,
                height: vpHeight
            });
        }
    }

    render(deltaTime = 0) {
        if (!this.active) return;

        const drones = this.droneFleet.getActiveDrones();
        if (drones.length === 0) return;

        // Get PRIMARY TRACKING DRONES specifically (drones 0, 1, 2, 3) for 2x2 grid
        const primaryDrones = drones.filter(drone =>
            this.primaryTrackingDroneIndices.includes(drone.id)
        ).slice(0, 4);

        if (primaryDrones.length === 0) return;

        // Get actual renderer size
        const rendererSize = this.renderer.getSize(new THREE.Vector2());
        const canvasWidth = rendererSize.x;
        const canvasHeight = rendererSize.y;

        // Only recalculate viewport if canvas size changed
        if (canvasWidth !== this.lastCanvasWidth || canvasHeight !== this.lastCanvasHeight) {
            this.lastCanvasWidth = canvasWidth;
            this.lastCanvasHeight = canvasHeight;

            const padding = 8;
            // 2x2 grid layout
            this.cachedViewportWidth = Math.floor((canvasWidth - padding * 3) / 2);
            this.cachedViewportHeight = Math.floor((canvasHeight - padding * 3) / 2);
        }

        // Clear with black background once
        this.renderer.setClearColor(0x000000);
        this.renderer.clear(true, true, true);

        // Command center layout: 2x2 grid - USE CACHED VALUES
        const padding = 8;
        const vpWidth = this.cachedViewportWidth;
        const vpHeight = this.cachedViewportHeight;

        // Render the 4 primary tracking drones in a 2x2 grid
        primaryDrones.forEach((drone, index) => {
            const camera = drone.getCamera();
            const targetAspect = vpWidth / vpHeight;

            // Calculate 2x2 grid position
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = Math.floor(padding + col * (vpWidth + padding));
            const y = Math.floor(padding + row * (vpHeight + padding));

            // Set viewport and scissor test - EXACT INTEGER PIXELS
            this.renderer.setViewport(x, y, vpWidth, vpHeight);
            this.renderer.setScissor(x, y, vpWidth, vpHeight);
            this.renderer.setScissorTest(true);

            // Update camera aspect ratio ONLY on first render or if canvas changed
            if (Math.abs(camera.aspect - targetAspect) > 0.01) {
                camera.aspect = targetAspect;
                camera.updateProjectionMatrix();
            }

            // Render from drone camera
            this.renderer.render(this.scene, camera);
        });

        // Reset viewport and scissor to full canvas - USE EXACT RENDERER SIZE
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(0, 0, Math.floor(canvasWidth), Math.floor(canvasHeight));
    }

    getClosestDrones(drones, count) {
        // Get formation center (ball + nearby players)
        const app = window.app;
        if (!app) return drones.slice(0, count).map(d => ({ drone: d, distance: 0 }));

        const ballPos = app.gameController.getBallPosition();
        const players = app.gameController.getPlayers();

        // Calculate formation centroid
        let centerX = ballPos.x;
        let centerY = ballPos.y;
        let centerZ = ballPos.z;
        let count_pts = 1;

        players.forEach(player => {
            const pos = player.getPosition();
            centerX += pos.x;
            centerY += pos.y;
            centerZ += pos.z;
            count_pts++;
        });

        centerX /= count_pts;
        centerY /= count_pts;
        centerZ /= count_pts;

        // Calculate distance of each drone to formation center
        const droneDistances = drones.map(drone => {
            const pos = drone.getPosition();
            const dx = pos.x - centerX;
            const dy = pos.y - centerY;
            const dz = pos.z - centerZ;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            return { drone, distance };
        });

        // Sort by distance and return the closest ones
        droneDistances.sort((a, b) => a.distance - b.distance);
        return droneDistances.slice(0, Math.min(count, drones.length));
    }

    drawViewportLabel(vp, label) {
        // This would use 2D canvas overlay in a real implementation
        // For now, just set a visual indicator
    }

    setActive(active) {
        this.active = active;

        // Unfreeze cameras when exiting multi-view
        if (!active) {
            const drones = this.droneFleet.getActiveDrones();
            drones.forEach(drone => {
                drone.setCameraFrozen(false);
            });
        }
    }

    isActive() {
        return this.active;
    }

    onResize() {
        this.viewports = [];
        this.setupViewports();
    }
}
