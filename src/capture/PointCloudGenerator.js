import { DepthSensor } from './DepthSensor.js';
import { Config } from '../core/Config.js';

export class PointCloudGenerator {
    constructor() {
        this.depthSensor = new DepthSensor();
        this.updateCounter = 0;
    }

    generateFromDrones(drones, scene) {
        // Update at reduced frequency for performance
        this.updateCounter++;
        if (this.updateCounter % Config.POINTCLOUD.updateFrequency !== 0) {
            return null;
        }

        const allPoints = [];

        // Collect points from each drone camera
        drones.forEach(drone => {
            if (!drone.active) return;

            const camera = drone.getCamera();
            camera.userData.droneId = drone.id;

            const points = this.depthSensor.sampleScene(camera, scene);
            allPoints.push(...points);
        });

        // Limit total points
        if (allPoints.length > Config.POINTCLOUD.maxPoints) {
            return this.downsample(allPoints, Config.POINTCLOUD.maxPoints);
        }

        return allPoints;
    }

    generateFromObjects(cameras, objects) {
        const allPoints = [];

        cameras.forEach(camera => {
            const points = this.depthSensor.sampleDepthFromCamera(camera, objects);
            allPoints.push(...points);
        });

        if (allPoints.length > Config.POINTCLOUD.maxPoints) {
            return this.downsample(allPoints, Config.POINTCLOUD.maxPoints);
        }

        return allPoints;
    }

    downsample(points, targetCount) {
        if (points.length <= targetCount) return points;

        const downsampled = [];
        const step = points.length / targetCount;

        for (let i = 0; i < targetCount; i++) {
            const index = Math.floor(i * step);
            downsampled.push(points[index]);
        }

        return downsampled;
    }

    mergePointClouds(pointClouds) {
        const merged = [];

        pointClouds.forEach(cloud => {
            merged.push(...cloud);
        });

        return merged;
    }

    filterByDistance(points, maxDistance) {
        return points.filter(p => p.distance <= maxDistance);
    }

    deduplicatePoints(points, threshold = 0.1) {
        // Simple spatial deduplication
        const deduplicated = [];
        const grid = new Map();
        const gridSize = threshold;

        points.forEach(point => {
            const key = `${Math.floor(point.position.x / gridSize)}_${Math.floor(point.position.y / gridSize)}_${Math.floor(point.position.z / gridSize)}`;

            if (!grid.has(key)) {
                grid.set(key, true);
                deduplicated.push(point);
            }
        });

        return deduplicated;
    }
}
