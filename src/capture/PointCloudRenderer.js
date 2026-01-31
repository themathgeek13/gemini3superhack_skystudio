import * as THREE from 'three';
import { Config } from '../core/Config.js';
import { ColorUtils } from '../utils/ColorUtils.js';

export class PointCloudRenderer {
    constructor(scene) {
        this.scene = scene;
        this.pointCloud = null;
        this.geometry = null;
        this.material = null;
        this.visible = true;
        this.maxPoints = Config.POINTCLOUD.maxPoints;

        this.createPointCloud();
    }

    createPointCloud() {
        // Create geometry with max capacity
        this.geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(this.maxPoints * 3);
        const colors = new Float32Array(this.maxPoints * 3);

        this.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        );
        this.geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(colors, 3)
        );

        // Material
        this.material = new THREE.PointsMaterial({
            size: Config.POINTCLOUD.pointSize,
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        // Create points object
        this.pointCloud = new THREE.Points(this.geometry, this.material);
        this.pointCloud.frustumCulled = false;
        this.scene.add(this.pointCloud);
    }

    update(points) {
        if (!points || points.length === 0) return;

        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;

        // Update point data
        const count = Math.min(points.length, this.maxPoints);

        for (let i = 0; i < count; i++) {
            const point = points[i];
            const i3 = i * 3;

            // Position
            positions[i3] = point.position.x;
            positions[i3 + 1] = point.position.y;
            positions[i3 + 2] = point.position.z;

            // Color
            let color;
            if (Config.POINTCLOUD.colorByDepth) {
                color = ColorUtils.depthColor(point.distance);
            } else {
                color = new THREE.Color(0xFFFFFF);
            }

            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        // Clear remaining points
        for (let i = count; i < this.maxPoints; i++) {
            const i3 = i * 3;
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 0;
        }

        // Update geometry
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.setDrawRange(0, count);
        this.geometry.computeBoundingSphere();
    }

    setVisible(visible) {
        this.visible = visible;
        if (this.pointCloud) {
            this.pointCloud.visible = visible;
        }
    }

    setPointSize(size) {
        if (this.material) {
            this.material.size = size;
        }
    }

    setOpacity(opacity) {
        if (this.material) {
            this.material.opacity = opacity;
        }
    }

    getPointCount() {
        return this.geometry.drawRange.count;
    }

    clear() {
        this.update([]);
    }

    dispose() {
        if (this.geometry) this.geometry.dispose();
        if (this.material) this.material.dispose();
        if (this.pointCloud) this.scene.remove(this.pointCloud);
    }
}
