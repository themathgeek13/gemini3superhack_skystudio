// Global configuration for the simulation
export const Config = {
    // Rendering
    RENDERER: {
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
    },

    // Physics
    PHYSICS: {
        gravity: { x: 0, y: -9.81, z: 0 },
        timestep: 1/60
    },

    // Football Field
    FIELD: {
        length: 109.7,  // meters (120 yards)
        width: 48.8,    // meters (53.3 yards)
        height: 15,
        fieldColor: 0x2A6E3F,  // Realistic grass green
        lineColor: 0xFFFFFF,
        endzoneColor: 0x1a4d2e
    },

    // Football
    BALL: {
        length: 0.28,   // 11 inches
        radius: 0.085,  // ~3.5 inches diameter
        mass: 0.42,     // ~14-15 oz
        restitution: 0.5,  // Less bouncy than basketball
        friction: 0.8,
        color: 0x6B4423  // Brown leather
    },

    // Players
    PLAYER: {
        height: 1.9,
        radius: 0.4,    // Bulkier than basketball players
        speed: 5.0,     // Slower, more realistic pace (was 7.0)
        count: 22,      // 11 offense + 11 defense
        helmetHeight: 0.15
    },

    // Drones
    DRONE: {
        defaultCount: 12,  // 12 drones for optimal Super Bowl coverage
        minCount: 8,
        maxCount: 16,
        size: 0.8,      // Larger for better visibility
        propellerSize: 1.0,  // Larger propellers
        speed: 10.0,    // Faster to track fast plays

        // AI parameters
        ballAttractionForce: 0.8,  // REDUCED FURTHER: Much slower, more graceful movement
        repulsionForce: 50.0,  // VERY STRONG: Aggressive repulsion to prevent ANY collisions
        repulsionRadius: 15.0,  // VERY LARGE: Start repelling from far away
        boundaryForce: 12.0,
        randomNoiseScale: 0.2,  // Reduced for smoother paths

        // Flight boundaries - ENFORCED
        minHeight: 5.0,      // Keep drones at least 5m above players
        maxHeight: 20.0,     // Increased to 20m for better height spread and separation
        maxDistanceFromCenter: 40.0,  // Stay within 40m radius of field center
        horizontalBoundary: 60.0,  // Wider for football field (deprecated - use maxDistanceFromCenter)

        // Primary tracking drones (for command center multi-view)
        primaryTrackingDrones: [0, 1, 2, 3],  // 4 drones for 2x2 grid layout
        primaryDroneMinHeight: 5.0,   // Lower height for primary tracking drones
        primaryDroneMaxHeight: 10.0,  // Keep them lower for better ground-level views

        // Camera
        cameraFOV: 75,
        cameraNear: 0.1,
        cameraFar: 150
    },

    // Point Cloud
    POINTCLOUD: {
        maxPoints: 50000,  // Reduced for better performance
        pointSize: 0.05,   // Larger points for visibility
        updateFrequency: 4,  // Update less frequently (every 4 frames)
        samplesPerDrone: 1000,  // Fewer samples per drone
        colorByDepth: true,
        noiseScale: 0.02   // Less noise
    },

    // Coverage Analysis
    COVERAGE: {
        gridSize: { x: 30, y: 12, z: 25 },  // Larger grid for football
        staticCameraCount: 6,
        staticCameraPositions: [
            { x: 0, y: 8, z: 60 },     // Endzone camera 1
            { x: 0, y: 8, z: -60 },    // Endzone camera 2
            { x: -25, y: 6, z: 25 },   // Sideline left 1
            { x: 25, y: 6, z: 25 },    // Sideline right 1
            { x: -25, y: 6, z: -25 },  // Sideline left 2
            { x: 25, y: 6, z: -25 }    // Sideline right 2
        ]
    },

    // Camera
    CAMERA: {
        fov: 60,
        near: 0.1,
        far: 1000,
        initialPosition: { x: -40, y: 25, z: 20 },  // Sideline elevated view
        broadcastPosition: { x: -30, y: 12, z: 0 }  // Traditional sideline angle
    },

    // Time Control
    TIME: {
        bulletTimeScale: 0.1,
        bulletTimeDuration: 5.0,  // seconds
        transitionDuration: 0.5
    },

    // Visual Effects
    EFFECTS: {
        trailLength: 50,
        trailOpacity: 0.5,
        shadowsEnabled: false  // Disabled for better performance
    }
};
