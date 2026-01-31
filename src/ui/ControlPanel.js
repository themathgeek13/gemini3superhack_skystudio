export class ControlPanel {
    constructor() {
        this.elements = this.getElements();
        this.callbacks = {};
        this.panelVisible = true;
        this.setupEventListeners();
        this.setupKeyboardToggle();
    }

    getElements() {
        return {
            // View mode buttons
            viewButtons: document.querySelectorAll('[data-view]'),

            // Simulation controls
            playPauseBtn: document.getElementById('play-pause'),
            timeSpeedSlider: document.getElementById('time-speed'),
            speedValue: document.getElementById('speed-value'),

            // Drone controls
            droneCountSlider: document.getElementById('drone-count'),
            droneCountValue: document.getElementById('drone-count-value'),
            deployDronesBtn: document.getElementById('deploy-drones'),

            // Effects
            showDronesCheckbox: document.getElementById('show-drones'),
            showTrailsCheckbox: document.getElementById('show-trails'),
            showFovCheckbox: document.getElementById('show-fov'),

            // Advanced
            multiViewToggle: document.getElementById('multi-view-toggle'),

            // Demo recording
            aiViewBtn: document.getElementById('ai-view-button'),
            resetSimBtn: document.getElementById('reset-sim')
        };
    }

    setupEventListeners() {
        // View mode buttons
        this.elements.viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setActiveViewButton(btn);
                const view = btn.getAttribute('data-view');
                this.trigger('viewChange', view);
            });
        });

        // Play/Pause
        this.elements.playPauseBtn.addEventListener('click', () => {
            this.trigger('playPause');
        });

        // Time speed
        this.elements.timeSpeedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.elements.speedValue.textContent = speed.toFixed(1);
            this.trigger('timeSpeedChange', speed);
        });

        // Drone count
        this.elements.droneCountSlider.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            this.elements.droneCountValue.textContent = count;
            this.trigger('droneCountChange', count);
        });

        // Deploy drones
        this.elements.deployDronesBtn.addEventListener('click', () => {
            this.trigger('deployDrones');
        });

        // Effects checkboxes
        if (this.elements.showPointcloudCheckbox) {
            this.elements.showPointcloudCheckbox.addEventListener('change', (e) => {
                this.trigger('togglePointcloud', e.target.checked);
            });
        }

        if (this.elements.showDronesCheckbox) {
            this.elements.showDronesCheckbox.addEventListener('change', (e) => {
                this.trigger('toggleDrones', e.target.checked);
            });
        }

        if (this.elements.showTrailsCheckbox) {
            this.elements.showTrailsCheckbox.addEventListener('change', (e) => {
                this.trigger('toggleTrails', e.target.checked);
            });
        }

        if (this.elements.showFovCheckbox) {
            this.elements.showFovCheckbox.addEventListener('change', (e) => {
                this.trigger('toggleFov', e.target.checked);
            });
        }

        // Multi-view
        if (this.elements.multiViewToggle) {
            this.elements.multiViewToggle.addEventListener('click', () => {
                this.trigger('toggleMultiView');
            });
        }

        // AI View - Capture moment for NeRF reconstruction
        if (this.elements.aiViewBtn) {
            this.elements.aiViewBtn.addEventListener('click', () => {
                this.trigger('aiViewCapture');
            });
        }

        // Reset Simulation
        if (this.elements.resetSimBtn) {
            this.elements.resetSimBtn.addEventListener('click', () => {
                this.trigger('resetSimulation');
            });
        }
    }

    setActiveViewButton(activeBtn) {
        this.elements.viewButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    updatePlayPauseButton(isPaused) {
        this.elements.playPauseBtn.textContent = isPaused ? 'Play (Space)' : 'Pause (Space)';
    }

    setupKeyboardToggle() {
        window.addEventListener('keydown', (e) => {
            // Press 'P' to toggle control panel visibility
            if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                this.toggleVisibility();
            }
        });
    }

    toggleVisibility() {
        const panel = document.getElementById('control-panel');
        if (panel) {
            this.panelVisible = !this.panelVisible;
            if (this.panelVisible) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
            console.log(`Control panel: ${this.panelVisible ? 'shown' : 'hidden'} (Press P to toggle)`);
        }
    }
}
