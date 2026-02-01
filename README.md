# Drone-Enhanced Volumetric Sports Capture Simulation

A web-based 3D simulation demonstrating autonomous drone technology for volumetric sports capture, built for the Gemini 3 Superhack.

## Overview

This project showcases how autonomous drones with AI-driven positioning can revolutionize sports broadcasting by providing superior coverage compared to traditional static cameras. The simulation features:

- **Basketball arena** with physics-based ball and player movement
- **Autonomous drone fleet** (5-10 drones) with collision avoidance
- **Real-time point cloud generation** from drone camera feeds
- **Multiple camera views** including free camera, broadcast view, and drone POV
- **Bullet-time effect** for dramatic replays
- **Coverage heatmap** visualization comparing drone vs static camera coverage

## Tech Stack

- **Three.js** - 3D rendering
- **Rapier3D** - Physics engine
- **Vite** - Build tool and dev server
- **Stats.js** - Performance monitoring

## Installation

```bash
npm install
```

**Note:** The project includes Vite configuration for WebAssembly support (required for Rapier3D physics engine). The `vite.config.js` file includes `vite-plugin-wasm` and `vite-plugin-top-level-await` plugins.

### Environment Setup (Optional - Required for Gemini Features)

To use AI-powered features and analysis scripts, set up your environment variables:

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Google Gemini API key (get one from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)):
```
VITE_GEMINI_API_KEY=your_api_key_here
GOOGLE_API_KEY=your_api_key_here
```

The main app runs fine without these for basic simulation. Only scripts in `scripts/` directory require the API keys.

## Running the Demo

```bash
npm run dev
```

Then open your browser to `http://localhost:5173`

The server will start on port 5173. You should see:
- Basketball court rendering
- Ball bouncing with physics
- Players moving on the court
- Stats display in top-left corner

## Controls

### Keyboard Shortcuts

- **1-5**: Switch camera views
  - 1: Free Camera (orbital controls)
  - 2: Broadcast View (traditional TV angle)
  - 3: Drone POV (first-person from drone)
  - 4: Point Cloud View
  - 5: Split View
- **Space**: Play/Pause simulation
- **B**: Toggle bullet-time effect
- **H**: Toggle coverage heatmap
- **D**: Deploy/redeploy drones
- **Arrow Keys**: Switch between drones (in Drone POV mode)

### UI Controls

- **View Mode**: Buttons to switch between camera views
- **Simulation**: Play/pause and time scale controls
- **Drones**: Adjust drone count and deploy fleet
- **Effects**: Toggle visibility of point cloud, drones, trails, and FOV frustums

## Features

### Autonomous Drone System

Drones use AI-driven behavior:
- **Ball attraction**: Follow the action automatically
- **Collision avoidance**: Repulsion forces prevent mid-air collisions
- **Boundary awareness**: Stay within flight zone
- **Vertical distribution**: Spread across different heights for optimal coverage
- **Random noise**: Natural-looking flight patterns

### Point Cloud Capture

Each drone "captures" depth information from its viewpoint:
- Samples 3D points from visible objects
- Merges point clouds from all drones
- Color-coded by depth for visual clarity
- Real-time updates (optimized to maintain 30+ FPS)

### Coverage Analysis

Visual heatmap comparing coverage:
- 3D voxel grid showing camera visibility
- Color gradient: Blue (low coverage) → Red (high coverage)
- Statistical comparison: Drone fleet vs static cameras
- Demonstrates ~60-90% coverage with drones vs ~30-40% with static cameras

### Bullet-Time Effect

Freeze the action and orbit around key moments:
- Slow motion time scale (0.1x)
- Smooth camera orbit around frozen position
- Showcases volumetric capture capability
- Dramatic presentation for highlight moments

## Project Structure

```
gemini3superhack/
├── src/                    # Application source code
│   ├── core/              # Scene, physics, time management
│   ├── sports/            # Basketball arena, ball, players
│   ├── drones/            # Drone fleet and AI
│   ├── capture/           # Point cloud generation
│   ├── cameras/           # Camera systems
│   ├── visualization/     # Heatmap, trails, FOV
│   ├── ui/                # Control panel and stats
│   ├── utils/             # Math and geometry helpers
│   ├── ai/                # Gemini API integration
│   └── main.js            # Application entry point
├── scripts/               # Testing, demo, and analysis scripts
├── docs/                  # Documentation files
├── analysis/              # Analysis reports and outputs
├── demo-videos/           # Generated demo video files
├── video-frames/          # Extracted video frames
├── index.html
├── styles.css
├── vite.config.js
└── package.json
```

## Future Enhancements

### Gemini API Integration (for Hackathon)

Potential integrations with Google's Gemini API:

1. **AI Commentary**: Generate real-time play-by-play commentary based on ball position and player movements
2. **Highlight Detection**: Use Gemini to analyze game state and automatically trigger bullet-time for exciting moments
3. **Strategic Analysis**: AI-powered analysis of player positioning and team strategy
4. **Automated Camera Direction**: Gemini suggests optimal camera angles based on game context
5. **Natural Language Control**: Voice commands to control drone deployment and camera views

See `GEMINI_INTEGRATION.md` for implementation details.

## Performance

Target: 30+ FPS with 100k point cloud
- Optimized point cloud updates (every 2 frames)
- Efficient frustum culling
- Spatial deduplication
- Hardware acceleration via WebGL

## Browser Support

Tested on:
- Chrome 120+ (recommended)
- Firefox 120+
- Edge 120+

Requires WebGL 2.0 support.

## Demo Presentation Flow

1. **Problem** (30s): Show static broadcast camera limitations
2. **Solution** (45s): Deploy autonomous drone fleet
3. **Magic** (90s): Point cloud view + bullet-time effect
4. **Proof** (60s): Coverage heatmap comparison
5. **Future** (30s): Discuss scalability and applications

## License

MIT

## Credits

Built for the Gemini 3 Superhack
