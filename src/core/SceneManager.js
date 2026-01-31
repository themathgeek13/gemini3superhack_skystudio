import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Config } from './Config.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.ignoreResize = false;  // Flag to prevent resize during multi-view
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupControls();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            ...Config.RENDERER
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = Config.EFFECTS.shadowsEnabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB);

        window.addEventListener('resize', () => {
            if (!this.ignoreResize) {
                this.onResize();
            }
        });
    }

    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            Config.CAMERA.fov,
            aspect,
            Config.CAMERA.near,
            Config.CAMERA.far
        );

        const pos = Config.CAMERA.initialPosition;
        this.camera.position.set(pos.x, pos.y, pos.z);
        this.camera.lookAt(0, 0, 0);  // Look at center of field
        this.camera.updateProjectionMatrix();
    }

    setupLights() {
        // Bright ambient light - main source (no shadows needed)
        const ambient = new THREE.AmbientLight(0xFFFFFF, 1.0);
        this.scene.add(ambient);

        // Single directional light for depth perception
        const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(10, 30, 10);
        dirLight.castShadow = false;  // Disabled for performance
        this.scene.add(dirLight);

        // That's it - minimal lighting for maximum performance
        // The high ambient light ensures everything is visible
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.1;
        this.controls.target.set(0, 0, 0);  // Look at field center
        this.controls.minDistance = 10;  // Don't get too close
        this.controls.maxDistance = 200;  // Allow zooming out for full field
        this.controls.update();
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(deltaTime) {
        this.controls.update();
    }

    render() {
        // Ensure proper viewport and scissor state before rendering
        const size = this.renderer.getSize(new THREE.Vector2());
        this.renderer.setViewport(0, 0, size.x, size.y);
        this.renderer.setScissorTest(false);
        this.renderer.render(this.scene, this.camera);
    }

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }

    setCamera(camera) {
        this.camera = camera;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    getCamera() {
        return this.camera;
    }

    enableControls(enabled) {
        this.controls.enabled = enabled;
    }
}
