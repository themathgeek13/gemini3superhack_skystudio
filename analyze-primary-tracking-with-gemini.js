import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyA6ku2x9helAoJyRJvXkIBvDhHjiaFGLC0';
const genAI = new GoogleGenerativeAI(API_KEY);

async function analyzePrimaryTrackingFrames() {
    console.log('🔍 Analyzing Primary Tracking Drone Demo with Gemini 2.0\n');

    const framesDir = '/tmp/primary-tracking-frames';
    const frameFiles = fs.readdirSync(framesDir)
        .filter(f => f.endsWith('.png'))
        .sort()
        .slice(0, 6);  // Analyze first 6 frames for Gemini

    if (frameFiles.length === 0) {
        console.error('❌ No frames found. Run record-primary-tracking-demo.js first.');
        process.exit(1);
    }

    console.log(`📊 Analyzing ${frameFiles.length} keyframes:\n`);
    frameFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    console.log();

    // Convert images to base64
    const frames = frameFiles.map(f => {
        const fullPath = path.join(framesDir, f);
        const data = fs.readFileSync(fullPath);
        return {
            filename: f,
            base64: data.toString('base64')
        };
    });

    // Use Gemini 2.0 Flash with vision
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build multi-image analysis prompt
    const imageParts = frames.map(frame => ({
        inlineData: {
            mimeType: 'image/png',
            data: frame.base64
        }
    }));

    const analysisPrompt = `Analyze these 6 keyframes from a drone-based volumetric capture system. These frames show a PRIMARY TRACKING configuration where drones 0, 1, 2 are specifically assigned to always track the formation centroid (ball + players) at lower heights (5-10m).

EVALUATE THE FOLLOWING:

1. **PRIMARY TRACKING DRONE BEHAVIOR (Drones 0, 1, 2)**
   - Do you see 3 drone camera feeds shown in a horizontal command center layout?
   - Are these feeds STABLE and tracking the same central subject (ball/players)?
   - Do the 3 feeds show different angles/perspectives of the same scene?
   - Score: 0-10

2. **HEIGHT DISTRIBUTION**
   - Are the 3 primary tracking drones at LOWER heights compared to any other visible drones?
   - Do the camera angles suggest lower altitude positioning (more downward view angles)?
   - Score: 0-10

3. **FORMATION CENTROID TRACKING**
   - Does each drone camera track the same formation center point?
   - Are the 3 feeds showing consistent movement together (same subject in view)?
   - Does the formation centroid appear to be the ball/players?
   - Score: 0-10

4. **CAMERA STABILITY & CLARITY**
   - Are the camera feeds clear and stable (not jittering)?
   - Can you see the football field, players, and ball clearly?
   - Is rendering quality good (no significant artifacts)?
   - Score: 0-10

5. **COLLISION AVOIDANCE**
   - Do the 3 drones appear to maintain safe distances from each other?
   - Are there any visible collisions or unsafe proximity?
   - Score: 0-10

6. **FIELD BOUNDARIES**
   - Are the drones staying within reasonable field boundaries?
   - Do they appear to be flying too far away or out of bounds?
   - Score: 0-10

7. **READINESS FOR GEMINI SYNTHESIS**
   - Are the feeds stable enough for a generative AI to synthesize novel viewpoints from?
   - Do you see consistent temporal coherence across frames?
   - Would you feed these to a model to generate novel camera paths?
   - Score: 0-10

PROVIDE:
- Individual scores for each criterion (0-10)
- Overall assessment (0-10)
- Specific observations about the primary tracking drone behavior
- Any issues or improvements needed
- Confidence level in the assessment (0-10)
- Recommendation: Is this ready for Gemini view synthesis?`;

    try {
        console.log('🤖 Sending frames to Gemini 2.0 for analysis...\n');
        const response = await model.generateContent([
            ...imageParts,
            {
                text: analysisPrompt
            }
        ]);

        const analysis = response.response.text();

        console.log('=' .repeat(80));
        console.log('GEMINI 2.0 ANALYSIS - PRIMARY TRACKING DRONE SYSTEM');
        console.log('=' .repeat(80));
        console.log(analysis);
        console.log('=' .repeat(80));

        // Save analysis report
        const reportPath = '/tmp/primary-tracking-analysis.txt';
        fs.writeFileSync(reportPath, `
GEMINI 2.0 ANALYSIS - PRIMARY TRACKING DRONE SYSTEM
Generated: ${new Date().toISOString()}
Frames Analyzed: ${frameFiles.length}

${analysis}

---
System Configuration:
- Primary Tracking Drones: [0, 1, 2]
- Primary Drone Height Range: 5-10m
- Other Drones Height Range: 5-20m
- Formation Center: Ball + Players Centroid
- Command Center Layout: 3 Horizontal Feeds
`);

        console.log(`\n📄 Full analysis saved to: ${reportPath}`);
        console.log('\n✅ Analysis complete!');

    } catch (error) {
        console.error('❌ Gemini API Error:', error.message);
        process.exit(1);
    }
}

analyzePrimaryTrackingFrames().catch(console.error);
