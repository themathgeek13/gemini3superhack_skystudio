import * as THREE from 'three';

export class ColorUtils {
    static heatmapGradient(value) {
        // value from 0 to 1
        // 0 = blue (cold, low coverage)
        // 1 = red (hot, high coverage)
        const color = new THREE.Color();

        if (value < 0.25) {
            // Blue to Cyan
            const t = value / 0.25;
            color.setRGB(0, t, 1);
        } else if (value < 0.5) {
            // Cyan to Green
            const t = (value - 0.25) / 0.25;
            color.setRGB(0, 1, 1 - t);
        } else if (value < 0.75) {
            // Green to Yellow
            const t = (value - 0.5) / 0.25;
            color.setRGB(t, 1, 0);
        } else {
            // Yellow to Red
            const t = (value - 0.75) / 0.25;
            color.setRGB(1, 1 - t, 0);
        }

        return color;
    }

    static depthColor(depth, maxDepth = 20) {
        const normalized = Math.min(depth / maxDepth, 1);
        const color = new THREE.Color();

        // Near = white/cyan, Far = blue/purple
        const r = 0.5 + (1 - normalized) * 0.5;
        const g = 0.7 + (1 - normalized) * 0.3;
        const b = 1.0;

        color.setRGB(r, g, b);
        return color;
    }

    static randomBrightColor() {
        const hue = Math.random();
        const saturation = 0.7 + Math.random() * 0.3;
        const lightness = 0.5 + Math.random() * 0.2;
        const color = new THREE.Color();
        color.setHSL(hue, saturation, lightness);
        return color;
    }

    static interpolateColors(color1, color2, t) {
        const c1 = new THREE.Color(color1);
        const c2 = new THREE.Color(color2);
        return c1.lerp(c2, t);
    }
}
