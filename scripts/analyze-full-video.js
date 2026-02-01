import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function analyzeFullVideo() {
    console.log('🎬 Analyzing full video with Gemini...\n');

    // Get latest video file
    const videoPath = execSync('ls -t demo-videos/*.webm | head -1').toString().trim();
    console.log(`Video: ${videoPath}\n`);

    // Read video as base64
    const videoData = readFileSync(videoPath);
    const base64Video = videoData.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `Analyze this 60-second drone volumetric capture demo video for a Super Bowl broadcast system.

The demo should show:
1. **Drones**: 12 autonomous white drones with green LED rings tracking football players
2. **Players**: 22 players (blue offense, red defense) running plays
3. **Views**: Free Camera, Broadcast, Drone POV, Point Cloud
4. **UI**: Control panel on right with view buttons, stats on top-left

Please analyze the ENTIRE video and report on:

### Temporal Analysis (what happens when)
- What happens at 0-12s (should be: Broadcast view showing traditional angle)
- What happens at 12-25s (should be: Free camera with drone deployment)
- What happens at 25-42s (should be: Drone POV showing field from drone's perspective)
- What happens at 42-52s (should be: Coverage heatmap visualization)
- What happens at 52-60s (should be: Multiple drone POVs)

### Drone Behavior
- Are the drones visible as 3D models or just dots/trails?
- Do the drones stay near the players or fly away?
- How many drones are actually visible?
- Do the drones track the ball and players?
- What's the furthest distance drones travel from field center?

### Camera Views
- Does the view actually change when buttons are pressed?
- Does "Broadcast" view work? (should be sideline angle)
- Does "Drone POV" view work? (should see field from drone camera)
- If Drone POV is broken, what does it show instead?

### Performance Issues
- What's the FPS range throughout the video?
- When does performance drop the most?
- Are there frame freezes or stuttering?

### Visual Glitches
- Any rendering failures (black screens, blue voids, missing objects)?
- Does the heatmap render correctly or glitch?
- Do objects disappear at any point?

### Coverage Metric
- Does the "Coverage" stat ever go above 0.0%?
- If not, can you hypothesize why based on what you see?

### Overall Assessment
- On a scale of 1-10, how professional does this look?
- What are the top 3 most critical issues?
- Does this look like it could be demoed at a hackathon?

Be very detailed and specific with timestamps.`;

    const videoPart = {
        inlineData: {
            data: base64Video,
            mimeType: 'video/webm'
        }
    };

    console.log('Sending video to Gemini for analysis...\n');
    const result = await model.generateContent([prompt, videoPart]);
    const analysis = result.response.text();

    console.log('═══════════════════════════════════════════════');
    console.log('🤖 GEMINI FULL VIDEO ANALYSIS\n');
    console.log(analysis);
    console.log('\n═══════════════════════════════════════════════\n');

    // Save analysis
    writeFileSync('full-video-analysis.txt', analysis);
    console.log('✅ Full analysis saved to: full-video-analysis.txt\n');

    return analysis;
}

analyzeFullVideo().catch(console.error);
