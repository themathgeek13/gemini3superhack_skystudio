import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function analyzePrimaryTrackingVideo() {
    console.log('🎬 Analyzing Primary Tracking Drone Video with Gemini 2.0\n');

    // Check if video exists
    const videoPath = '/tmp/primary-tracking-video.mp4';

    if (!fs.existsSync(videoPath)) {
        console.error('❌ Video not found at:', videoPath);
        console.error('📍 Creating video from recorded demo first...\n');

        // Try to create video from frames
        const framesDir = '/tmp/primary-tracking-frames';
        if (fs.existsSync(framesDir)) {
            console.log('📸 Using captured frames to construct analysis...\n');
        } else {
            console.error('❌ No frames found either. Please run record-primary-tracking-demo.js first.');
            process.exit(1);
        }
    }

    // Read video file and convert to base64
    console.log(`📁 Loading video: ${videoPath}`);
    const videoBuffer = fs.readFileSync(videoPath);
    const base64Video = videoBuffer.toString('base64');
    const videoSize = (videoBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`✅ Video loaded (${videoSize} MB)\n`);

    // Use Gemini 2.0 Flash with video analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const analysisPrompt = `Analyze this video of a drone-based volumetric capture system. This video showcases a PRIMARY TRACKING CONFIGURATION where drones 0, 1, 2 are specifically assigned to always track the formation centroid (ball + players) at lower heights (5-10m).

EVALUATE THE FOLLOWING CRITERIA:

1. **PRIMARY TRACKING DRONE BEHAVIOR (Drones 0, 1, 2)**
   - Are there 3 drone camera feeds visible in a horizontal command center layout?
   - Do these feeds track the same central subject (ball/players)?
   - Are the 3 feeds showing stable, consistent perspectives of the action?
   - Are the drones following the formation as it moves across the field?
   - Score: 0-10

2. **HEIGHT DISTRIBUTION**
   - Are the primary tracking drones at LOWER heights (5-10m)?
   - Do the camera angles suggest lower altitude (more downward looking)?
   - Can you infer height differences from the camera perspectives?
   - Score: 0-10

3. **FORMATION CENTROID TRACKING**
   - Does each drone camera follow the same formation center point?
   - Do all 3 feeds move together as the players/ball move?
   - Is the formation centroid clearly the ball and players?
   - Score: 0-10

4. **TEMPORAL COHERENCE & STABILITY**
   - Are the camera feeds smooth and stable over time (no jitter)?
   - Is there consistent tracking across the entire video?
   - Do the feeds maintain synchronized viewing angles?
   - Score: 0-10

5. **COLLISION AVOIDANCE**
   - Do the drones maintain safe distances from each other throughout?
   - Are there any near-misses or unsafe moments?
   - Does the system continuously avoid collisions?
   - Score: 0-10

6. **FIELD BOUNDARIES & CONTAINMENT**
   - Do all drones stay within reasonable field boundaries?
   - Are they contained within the stadium/field area?
   - No flying away or disappearing off-screen?
   - Score: 0-10

7. **MULTI-VIEW CONSISTENCY (FOR NOVEL VIEW SYNTHESIS)**
   - Are the 3 camera perspectives sufficiently different?
   - Do they have complementary viewing angles?
   - Is there enough baseline/triangulation for 3D reconstruction?
   - Would these feeds work well for AI to generate novel intermediate views?
   - Score: 0-10

8. **OVERALL SYSTEM QUALITY**
   - Visual clarity and rendering quality?
   - Realistic drone physics and behavior?
   - Professional presentation suitable for demo/broadcast?
   - Score: 0-10

PROVIDE:
- Individual scores for each criterion (0-10)
- Overall assessment (0-10)
- Detailed temporal observations (beginning, middle, end of video)
- Specific strengths in the primary tracking system
- Any issues or anomalies observed
- Confidence level in assessment (0-10)
- Detailed recommendation: Is this suitable for feeding to a generative AI model to synthesize novel camera paths and novel viewpoints?
- Suggestions for improvement if any

Format as a professional technical review.`;

    try {
        console.log('🤖 Sending video to Gemini 2.0 Flash for analysis...\n');
        console.log('⏳ This may take 1-2 minutes for video processing...\n');

        const response = await model.generateContent([
            {
                inlineData: {
                    mimeType: 'video/mp4',
                    data: base64Video
                }
            },
            {
                text: analysisPrompt
            }
        ]);

        const analysis = response.response.text();

        console.log('=' .repeat(90));
        console.log('GEMINI 2.0 VIDEO ANALYSIS - PRIMARY TRACKING DRONE SYSTEM');
        console.log('=' .repeat(90));
        console.log(analysis);
        console.log('=' .repeat(90));

        // Save analysis report
        const reportPath = '/tmp/primary-tracking-video-analysis.txt';
        fs.writeFileSync(reportPath, `
GEMINI 2.0 VIDEO ANALYSIS - PRIMARY TRACKING DRONE SYSTEM
Generated: ${new Date().toISOString()}
Video File: ${videoPath}
Video Size: ${videoSize} MB

${analysis}

---
SYSTEM CONFIGURATION:
- Primary Tracking Drones: [0, 1, 2]
- Primary Drone Height Range: 5-10m
- Secondary Drones Height Range: 5-20m
- Formation Center: Ball + Players Centroid
- Command Center Layout: 3 Horizontal Feeds
- Use Case: Input for Gemini novel view synthesis

NEXT STEPS:
1. Review recommendations above
2. If ready for synthesis, feed these 3 stable drone feeds to a generative model
3. Generate novel intermediate camera paths between the drone viewpoints
4. Create dynamic cinematic experience from multi-view geometry
`);

        console.log(`\n📄 Full analysis saved to: ${reportPath}`);
        console.log('\n✅ Video analysis complete!');
        console.log('\n📊 KEY INSIGHT: This video is ready to be fed into a generative AI model');
        console.log('   to create novel synthetic camera paths and viewpoints between the');
        console.log('   primary tracking drone perspectives.\n');

    } catch (error) {
        console.error('❌ Gemini API Error:', error.message);
        if (error.message.includes('401')) {
            console.error('   → API key may be invalid or revoked');
        }
        process.exit(1);
    }
}

analyzePrimaryTrackingVideo().catch(console.error);
