import * as THREE from 'three';

export class MathUtils {
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomVector3(scale = 1) {
        return new THREE.Vector3(
            (Math.random() - 0.5) * scale,
            (Math.random() - 0.5) * scale,
            (Math.random() - 0.5) * scale
        );
    }

    static distance3D(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    static easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    static sphericalToCartesian(radius, theta, phi) {
        return new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    static getBoundaryRepulsion(position, boundary, force) {
        const repulsion = new THREE.Vector3();

        // X boundaries
        if (Math.abs(position.x) > boundary.x) {
            repulsion.x = -Math.sign(position.x) * force;
        }

        // Z boundaries
        if (Math.abs(position.z) > boundary.z) {
            repulsion.z = -Math.sign(position.z) * force;
        }

        // Y boundaries
        if (position.y < boundary.minY) {
            repulsion.y = force;
        } else if (position.y > boundary.maxY) {
            repulsion.y = -force;
        }

        return repulsion;
    }
}
