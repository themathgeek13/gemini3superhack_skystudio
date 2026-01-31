export class StatsDisplay {
    constructor() {
        this.element = document.getElementById('stats-display');
        this.stats = {
            fps: 0,
            pointCount: 0,
            droneCount: 0,
            viewMode: 'Free Camera',
            coverage: 0,
            timeScale: 1.0
        };
    }

    update(stats) {
        Object.assign(this.stats, stats);
        this.render();
    }

    render() {
        const viewNames = {
            'free': 'Free Camera',
            'broadcast': 'Broadcast View',
            'drone': 'Drone POV',
            'pointcloud': 'Point Cloud'
        };

        this.element.innerHTML = `
            <div><strong>Performance</strong></div>
            <div>FPS: ${this.stats.fps}</div>
            <div>Time Scale: ${this.stats.timeScale.toFixed(2)}x</div>
            <div></div>
            <div><strong>Scene</strong></div>
            <div>View: ${viewNames[this.stats.viewMode] || this.stats.viewMode}</div>
            <div>Drones: ${this.stats.droneCount} coordinated</div>
            <div>Point Cloud: ${this.stats.pointCount.toLocaleString()} pts</div>
            <div>Coverage: ${this.stats.coverage.toFixed(1)}%</div>
        `;
    }

    setFPS(fps) {
        this.stats.fps = fps;
    }

    setPointCount(count) {
        this.stats.pointCount = count;
    }

    setDroneCount(count) {
        this.stats.droneCount = count;
    }

    setViewMode(mode) {
        this.stats.viewMode = mode;
    }

    setCoverage(coverage) {
        this.stats.coverage = coverage;
    }

    setTimeScale(scale) {
        this.stats.timeScale = scale;
    }
}
