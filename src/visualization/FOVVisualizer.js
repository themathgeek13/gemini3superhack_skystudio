import * as THREE from 'three';

export class FOVVisualizer {
    constructor(scene) {
        this.scene = scene;
        this.helpers = new Map();
    }

    addCamera(cameraId, camera, color = 0x00FF00) {
        if (this.helpers.has(cameraId)) return;

        const helper = new THREE.CameraHelper(camera);
        helper.material.color.setHex(color);
        helper.visible = false;
        this.scene.add(helper);

        this.helpers.set(cameraId, helper);
    }

    update() {
        this.helpers.forEach(helper => {
            helper.update();
        });
    }

    setVisible(visible) {
        this.helpers.forEach(helper => {
            helper.visible = visible;
        });
    }

    removeCamera(cameraId) {
        const helper = this.helpers.get(cameraId);
        if (helper) {
            this.scene.remove(helper);
            this.helpers.delete(cameraId);
        }
    }

    clear() {
        this.helpers.forEach(helper => {
            this.scene.remove(helper);
        });
        this.helpers.clear();
    }
}
