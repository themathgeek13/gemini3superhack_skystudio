# Gemini API Integration Ideas

This document outlines potential integrations of Google's Gemini API into the drone volumetric capture simulation.

## 1. AI-Powered Commentary System

### Implementation
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiCommentary {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async generateCommentary(gameState) {
    const prompt = `You are a sports commentator for a basketball game. Based on this game state, provide exciting commentary:

    Ball position: (${gameState.ball.x.toFixed(1)}, ${gameState.ball.y.toFixed(1)}, ${gameState.ball.z.toFixed(1)})
    Ball velocity: ${gameState.ball.velocity.toFixed(2)} m/s
    Players near ball: ${gameState.nearbyPlayers}
    Current drone coverage: ${gameState.droneCoverage.toFixed(1)}%

    Provide a single sentence of exciting commentary:`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}
```

### Usage in App
- Trigger commentary every 5-10 seconds
- Display in overlay UI
- Voice synthesis using Web Speech API

## 2. Intelligent Highlight Detection

### Implementation
```javascript
class GeminiHighlightDetector {
  async analyzeForHighlight(gameState, history) {
    const prompt = `Analyze this basketball game sequence to determine if this is a highlight moment:

    Ball height: ${gameState.ball.y.toFixed(2)}m (court height: 3.05m)
    Ball speed: ${gameState.ball.speed.toFixed(2)} m/s
    Ball trajectory: ${gameState.ball.trajectory}
    Players clustered: ${gameState.playerCluster}

    Recent history: ${JSON.stringify(history)}

    Is this a highlight moment worthy of bullet-time replay? Respond with JSON:
    {
      "isHighlight": true/false,
      "confidence": 0-1,
      "reason": "brief explanation",
      "suggestedCameraAngle": "top/side/closeup"
    }`;

    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

### Auto-Trigger Bullet Time
- Monitor game state continuously
- When Gemini detects highlight (confidence > 0.7), trigger bullet-time
- Automatically select best camera angle

## 3. Strategic Game Analysis

### Implementation
```javascript
class GeminiStrategicAnalyzer {
  async analyzeStrategy(playerPositions, ballPosition) {
    const prompt = `You are a basketball strategy analyst. Analyze the current court positions:

    Team A positions: ${JSON.stringify(playerPositions.teamA)}
    Team B positions: ${JSON.stringify(playerPositions.teamB)}
    Ball position: ${JSON.stringify(ballPosition)}

    Provide brief strategic insights (2-3 sentences):`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}
```

### Display
- Show analysis in sidebar
- Update every 15 seconds
- Highlight tactical formations

## 4. Natural Language Camera Control

### Implementation
```javascript
class GeminiCameraController {
  async parseCommand(userInput) {
    const prompt = `Convert this natural language command into camera control parameters:

    User said: "${userInput}"

    Available actions:
    - switch_view: free, broadcast, drone, pointcloud, split
    - deploy_drones: count (3-10)
    - toggle_bullettime
    - follow_player: id (0-3)
    - zoom: in/out

    Respond with JSON command object:`;

    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

### Voice Integration
```javascript
const recognition = new webkitSpeechRecognition();
recognition.onresult = async (event) => {
  const command = event.results[0][0].transcript;
  const action = await geminiController.parseCommand(command);
  executeCommand(action);
};
```

## 5. Optimal Drone Positioning Advisor

### Implementation
```javascript
class GeminiDronePositioner {
  async suggestOptimalPositions(currentPositions, ballPosition, coverage) {
    const prompt = `You are an expert in volumetric capture. Suggest optimal drone positions:

    Current drone positions: ${JSON.stringify(currentPositions)}
    Ball position: ${JSON.stringify(ballPosition)}
    Current coverage: ${coverage}%
    Court dimensions: 28m x 15m x 10m (L x W x H)

    Suggest improved positions to maximize coverage while avoiding collisions.
    Respond with JSON array of positions:`;

    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

### Use Cases
- User clicks "Optimize Drones" button
- Gemini calculates ideal positions
- Drones smoothly transition to new positions

## 6. Image Analysis for Point Cloud Quality

### Implementation with Gemini Vision
```javascript
class GeminiQualityAnalyzer {
  async analyzePointCloud(screenshotBlob) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const prompt = `Analyze this point cloud visualization. Rate the quality:
    - Density (sparse vs dense)
    - Coverage (areas visible)
    - Artifacts or noise

    Provide a quality score (0-10) and suggestions for improvement:`;

    const imagePart = {
      inlineData: {
        data: await blobToBase64(screenshotBlob),
        mimeType: "image/png"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
  }
}
```

## Implementation Priority

For the hackathon, focus on:

1. **High Impact, Low Effort**: AI Commentary (Priority 1)
   - Easy to implement
   - Impressive demo feature
   - Showcases Gemini's language capabilities

2. **Moderate Impact, Moderate Effort**: Highlight Detection (Priority 2)
   - Automated bullet-time triggers
   - Demonstrates AI decision-making
   - Enhances user experience

3. **High Impact, High Effort**: Natural Language Control (Priority 3)
   - Voice commands are impressive
   - Requires more integration work
   - Great for live demos

## Installation

```bash
npm install @google/generative-ai
```

## Environment Setup

Create `.env` file:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

## Code Integration Points

Add to `src/main.js`:

```javascript
import { GeminiCommentary } from './ai/GeminiCommentary.js';

class App {
  async init() {
    // ... existing code ...

    // Add Gemini features
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      this.geminiCommentary = new GeminiCommentary(
        import.meta.env.VITE_GEMINI_API_KEY
      );
      this.startCommentary();
    }
  }

  async startCommentary() {
    setInterval(async () => {
      const gameState = this.getGameState();
      const commentary = await this.geminiCommentary.generateCommentary(gameState);
      this.displayCommentary(commentary);
    }, 10000); // Every 10 seconds
  }
}
```

## UI Additions

Add commentary overlay to `index.html`:

```html
<div id="commentary-overlay">
  <div id="commentary-text"></div>
</div>
```

```css
#commentary-overlay {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 15px 30px;
  border-radius: 10px;
  max-width: 600px;
  text-align: center;
}

#commentary-text {
  font-size: 18px;
  color: #fff;
  font-weight: bold;
}
```

## Demo Script

1. Start simulation with drones deployed
2. Show AI commentary generating in real-time
3. Trigger highlight detection → automatic bullet-time
4. Use voice command: "Show me the broadcast view"
5. Display coverage optimization suggestion

This integration showcases Gemini's capabilities while enhancing the core volumetric capture demo.
