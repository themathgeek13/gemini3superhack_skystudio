import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { MathUtils } from '../utils/MathUtils.js';

export class DepthSensor {
    constructor() {
        this.maxDepth = Config.DRONE.cameraFar;
        this.samplesPerObject = 500;
    }

    sampleDepthFromCamera(camera, objects) {
        const points = [];
        const cameraPos = new THREE.Vector3();
        camera.getWorldPosition(cameraPos);

        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);

        // Sample points from each object
        objects.forEach(obj => {
            const objPoints = this.sampleObject(obj, camera, cameraPos, cameraDir);
            points.push(...objPoints);
        });

        return points;
    }

    sampleObject(object, camera, cameraPos, cameraDir) {
        const points = [];

        if (!object.mesh || !object.mesh.geometry) return points;

        const mesh = object.mesh;
        const geometry = mesh.geometry;

        // Get position attribute
        const positions = geometry.attributes.position;
        if (!positions) return points;

        // Sample random vertices
        const sampleCount = Math.min(
            this.samplesPerObject,
            positions.count
        );

        const frustum = new THREE.Frustum();
        const projectionMatrix = new THREE.Matrix4().multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(projectionMatrix);

        for (let i = 0; i < sampleCount; i++) {
            const index = Math.floor(Math.random() * positions.count);

            // Get vertex position in world space
            const vertex = new THREE.Vector3(
                positions.getX(index),
                positions.getY(index),
                positions.getZ(index)
            );

            vertex.applyMatrix4(mesh.matrixWorld);

            // Check if in camera frustum
            if (!frustum.containsPoint(vertex)) continue;

            // Calculate distance
            const distance = cameraPos.distanceTo(vertex);
            if (distance > this.maxDepth) continue;

            // Add noise for realism
            const noise = MathUtils.randomVector3(Config.POINTCLOUD.noiseScale);
            vertex.add(noise);

            points.push({
                position: vertex,
                distance: distance,
                cameraId: camera.userData.droneId || 0
            });
        }

        return points;
    }

    sampleScene(camera, scene) {
        const points = [];
        const cameraPos = new THREE.Vector3();
        camera.getWorldPosition(cameraPos);

        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);

        // Traverse scene and sample meshes
        scene.traverse(obj => {
            if (obj.isMesh && obj.visible) {
                // Skip drone meshes and certain objects
                if (obj.parent && obj.parent.userData && obj.parent.userData.isDrone) {
                    return;
                }

                const objPoints = this.sampleMesh(obj, camera, cameraPos);
                points.push(...objPoints);
            }
        });

        return points;
    }

    sampleMesh(mesh, camera, cameraPos) {
        const points = [];
        const geometry = mesh.geometry;

        if (!geometry || !geometry.attributes.position) return points;

        const positions = geometry.attributes.position;

        // Only sample player meshes, ball, and key field objects
        const isImportant = mesh.userData.isPlayer ||
                           mesh.userData.isBall ||
                           mesh.userData.isFieldMarker ||
                           mesh.name?.includes('player') ||
                           mesh.name?.includes('ball');

        const sampleCount = isImportant ?
            Math.min(200, positions.count) :  // More samples for important objects
            Math.min(30, positions.count);     // Fewer for field/background

        const frustum = new THREE.Frustum();
        const projectionMatrix = new THREE.Matrix4().multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(projectionMatrix);

        for (let i = 0; i < sampleCount; i++) {
            const index = Math.floor(Math.random() * positions.count);

            const vertex = new THREE.Vector3(
                positions.getX(index),
                positions.getY(index),
                positions.getZ(index)
            );

            vertex.applyMatrix4(mesh.matrixWorld);

            if (!frustum.containsPoint(vertex)) continue;

            const distance = cameraPos.distanceTo(vertex);
            if (distance > this.maxDepth) continue;

            const noise = MathUtils.randomVector3(Config.POINTCLOUD.noiseScale);
            vertex.add(noise);

            points.push({
                position: vertex,
                distance: distance,
                normal: new THREE.Vector3(0, 1, 0)
            });
        }

        return points;
    }
}
