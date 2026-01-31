import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { ColorUtils } from '../utils/ColorUtils.js';

export class CoverageHeatmap {
    constructor(scene) {
        this.scene = scene;
        this.grid = null;
        this.voxels = [];
        this.visible = false;
        this.gridSize = Config.COVERAGE.gridSize;

        this.createGrid();
    }

    createGrid() {
        this.grid = new THREE.Group();

        const { x, y, z } = this.gridSize;
        const cellSizeX = Config.FIELD.width / x;
        const cellSizeY = Config.FIELD.height / y;
        const cellSizeZ = Config.FIELD.length / z;

        for (let i = 0; i < x; i++) {
            for (let j = 0; j < y; j++) {
                for (let k = 0; k < z; k++) {
                    const geometry = new THREE.BoxGeometry(
                        cellSizeX * 0.8,
                        cellSizeY * 0.8,
                        cellSizeZ * 0.8
                    );
                    const material = new THREE.MeshBasicMaterial({
                        transparent: true,
                        opacity: 0.3,
                        color: 0x0000FF
                    });

                    const voxel = new THREE.Mesh(geometry, material);

                    voxel.position.set(
                        (i - x/2) * cellSizeX,
                        j * cellSizeY + cellSizeY/2,
                        (k - z/2) * cellSizeZ
                    );

                    this.voxels.push({
                        mesh: voxel,
                        coverage: 0
                    });

                    this.grid.add(voxel);
                }
            }
        }

        this.grid.visible = false;
        this.scene.add(this.grid);
    }

    update(cameras) {
        if (!this.visible) return;

        // Calculate coverage for each voxel
        this.voxels.forEach(voxel => {
            const position = voxel.mesh.position;
            let coverageCount = 0;

            cameras.forEach(camera => {
                if (this.isPointVisible(camera, position)) {
                    coverageCount++;
                }
            });

            voxel.coverage = coverageCount;

            // Update color based on coverage
            const normalizedCoverage = Math.min(coverageCount / cameras.length, 1);
            const color = ColorUtils.heatmapGradient(normalizedCoverage);
            voxel.mesh.material.color = color;
            voxel.mesh.material.opacity = 0.3 + normalizedCoverage * 0.4;
        });
    }

    isPointVisible(camera, point) {
        // Ensure camera matrices are up to date
        camera.updateMatrixWorld(true);
        camera.updateProjectionMatrix();

        // Simple frustum check
        const frustum = new THREE.Frustum();
        const projectionMatrix = new THREE.Matrix4().multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(projectionMatrix);

        return frustum.containsPoint(point);
    }

    calculateStaticCameraCoverage() {
        const staticCameras = this.createStaticCameras();
        this.update(staticCameras);

        const totalVoxels = this.voxels.length;
        const coveredVoxels = this.voxels.filter(v => v.coverage > 0).length;

        return (coveredVoxels / totalVoxels) * 100;
    }

    calculateDroneCoverage(drones) {
        const droneCameras = drones.map(d => d.getCamera());
        this.update(droneCameras);

        const totalVoxels = this.voxels.length;
        const coveredVoxels = this.voxels.filter(v => v.coverage > 0).length;

        return (coveredVoxels / totalVoxels) * 100;
    }

    createStaticCameras() {
        const cameras = [];
        Config.COVERAGE.staticCameraPositions.forEach(pos => {
            const camera = new THREE.PerspectiveCamera(
                Config.CAMERA.fov,
                window.innerWidth / window.innerHeight,
                Config.CAMERA.near,
                Config.CAMERA.far
            );
            camera.position.set(pos.x, pos.y, pos.z);
            camera.lookAt(0, 2, 0);
            camera.updateMatrixWorld();
            cameras.push(camera);
        });
        return cameras;
    }

    setVisible(visible) {
        this.visible = visible;
        if (this.grid) {
            this.grid.visible = visible;
        }
    }

    toggle() {
        this.setVisible(!this.visible);
        return this.visible;
    }
}
