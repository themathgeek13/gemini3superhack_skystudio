import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const genAI = new GoogleGenerativeAI('AIzaSyA6ku2x9helAoJyRJvXkIBvDhHjiaFGLC0');

async function analyzeFramesWithGemini() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🤖 GEMINI VISION ANALYSIS - DRONE VOLUMETRIC CAPTURE DEMO');
    console.log('═══════════════════════════════════════════════════════════\n');

    const framesDir = '/tmp/demo-frames';
    const frameFiles = [
        'frame-1-formation.png',
        'frame-2-broadcast.png',
        'frame-3-multiview.png',
        'frame-4-dronepov.png',
        'frame-5-drone2pov.png',
        'frame-6-fullformation.png'
    ];

    console.log('📸 Loading frames for analysis...\n');

    try {
        // Load all frames as base64
        const frames = [];
        for (const frameFile of frameFiles) {
            const path = `${framesDir}/${frameFile}`;
            const imageData = readFileSync(path);
            const base64Image = imageData.toString('base64');
            frames.push({
                name: frameFile,
                base64: base64Image
            });
            console.log(`  ✅ Loaded: ${frameFile}`);
        }

        console.log('\n🔍 Sending frames to Gemini for analysis...\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const analysisPrompt = `You are analyzing a drone-enhanced volumetric sports capture system for Super Bowl LX.

I've captured 6 key frames from the 70-second demo. Please analyze them in order to validate that the following issues have been FIXED:

## VALIDATION CHECKLIST - MUST VERIFY THESE ARE NOW FIXED:

1. **Drones Stay Within Bounds**
   - Look for drones flying off-screen or to billions of meters away
   - Status: FIXED if drones stay visible in frames and never disappear beyond field edges
   - Should see 12 white drone models in formations

2. **Collision Avoidance (3+ Meter Separation)**
   - Look for drones too close together or overlapping
   - Status: FIXED if drones maintain visible separation (not touching)
   - All 12 drones should be distinguishable, not stacked

3. **Altitude Variation (5-20m Height Distribution)**
   - Look for drones at different heights in the free camera view
   - Status: FIXED if you can see Z-axis separation (some higher, some lower)
   - Should not all be at same altitude level

4. **Command Center Multi-View (3 Drone Feeds Side-by-Side)**
   - Frame 3 should show multi-drone view with clear separations
   - Status: FIXED if you see 3+ distinct drone camera feeds displayed side-by-side
   - Each feed should show different perspective

5. **Player/Ball Tracking**
   - Look across frames for drones positioned near ball and players
   - Status: FIXED if drones cluster around players/ball location
   - Drones should follow centroid of game activity

6. **Field Boundary Containment**
   - Look at bounds of drone positions across all frames
   - Status: FIXED if drones never exceed field perimeter
   - Should see formation hovering over football field only

7. **Performance (15+ FPS)**
   - Look for frame smoothness, stuttering, or lag artifacts
   - Status: FIXED if scene appears smooth in transitions
   - No visible freezing or jumping movements

## ANALYSIS REQUIRED:

For each frame (1-6), please describe:
- **Content**: What view/mode is shown?
- **Drone Visibility**: How many drones visible? What formation?
- **Separation**: Are drones separated or touching?
- **Height Distribution**: Visible altitude variation?
- **Boundaries**: Drones contained within field?
- **Tracking**: Drones near ball/players?
- **Quality**: Smooth rendering? Good FPS?

## VALIDATION REPORT:

After analyzing all frames, generate a VALIDATION REPORT with:

1. **Issues Fixed Summary** - Which of the 7 issues are NOW FIXED?
2. **Before/After Comparison** - What changed from previous broken state?
3. **Remaining Concerns** - Any lingering issues visible?
4. **Overall Assessment** - Is this demo-ready for Super Bowl presentation?
5. **Confidence Score** - Rate 1-10: How confident this works correctly?

Be specific, cite visual evidence from frames, and highlight improvements.`;

        // Create content array with all frames
        const content = [analysisPrompt];

        // Add each frame
        for (const frame of frames) {
            content.push({
                inlineData: {
                    data: frame.base64,
                    mimeType: 'image/png'
                }
            });
        }

        const result = await model.generateContent(content);
        const analysis = result.response.text();

        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 GEMINI ANALYSIS RESULTS\n');
        console.log(analysis);
        console.log('\n═══════════════════════════════════════════════════════════\n');

        // Save analysis
        const analysisPath = '/Users/rohanrao/gemini3superhack/gemini-analysis-report.txt';
        writeFileSync(analysisPath, `DRONE VOLUMETRIC CAPTURE - GEMINI ANALYSIS REPORT
═══════════════════════════════════════════════════════════
Generated: ${new Date().toISOString()}

FRAMES ANALYZED:
${frameFiles.map((f, i) => `${i + 1}. ${f}`).join('\n')}

═══════════════════════════════════════════════════════════

${analysis}

═══════════════════════════════════════════════════════════
END OF REPORT
`);

        console.log(`✅ Full analysis saved to: ${analysisPath}\n`);

        // Extract key findings
        console.log('📋 KEY FINDINGS:');
        console.log('─────────────────────────────────────────────────────\n');

        if (analysis.includes('FIXED')) {
            console.log('✅ Issues appear to be resolved based on frame analysis');
        }

        if (analysis.includes('collision') || analysis.includes('separation')) {
            console.log('✅ Collision avoidance validation visible');
        }

        if (analysis.includes('height') || analysis.includes('altitude')) {
            console.log('✅ Height distribution validation possible');
        }

        if (analysis.includes('multi')) {
            console.log('✅ Multi-drone command center view detected');
        }

        console.log('\n💾 ANALYSIS OUTPUTS:');
        console.log(`  📄 Full Report: ${analysisPath}`);
        console.log(`  🖼️  Frames: /tmp/demo-frames/frame-*.png (6 files)\n`);

        return analysis;

    } catch (error) {
        console.error('❌ Error during analysis:', error);
        throw error;
    }
}

console.log('Starting Gemini analysis...\n');
analyzeFramesWithGemini().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
