import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.GOOGLE_API_KEY;

async function analyzeVideoWithGemini() {
  const videoPath = '/tmp/SkyStudio_Demo.mp4';
  const veoPath = '/Users/rohanrao/Downloads/veo_superbowl.mp4';

  // Check if files exist
  if (!fs.existsSync(videoPath)) {
    console.error('Error: SkyStudio demo video not found at', videoPath);
    process.exit(1);
  }

  if (!fs.existsSync(veoPath)) {
    console.warn('Warning: veo_superbowl.mp4 not found at', veoPath);
  }

  console.log('📹 Analyzing SkyStudio Demo Video with Gemini 2.0\n');
  console.log('Reading video file...');

  // Read the video file and convert to base64
  const videoData = fs.readFileSync(videoPath);
  const base64Video = videoData.toString('base64');

  const prompt = `You are analyzing a demo video for a hackathon project called "SkyStudio" - an AI-powered volumetric sports capture system.

PROJECT CONTEXT:
SkyStudio demonstrates how 12 autonomous drones can coordinate in real-time to capture multi-perspective footage of live sports (specifically American football at Super Bowl LX 2026). The system then uses AI to synthesize novel camera paths and views from the frozen moment using neural radiance fields (NeRF) and generative video models.

KEY INNOVATION: Instead of being limited to fixed broadcast cameras, directors can create synthetic cameras that fly through the action from any angle - shots that would be physically impossible.

WHAT THE VIDEO SHOWS:
- Traditional broadcast camera view (the problem)
- Free camera overview of the full field
- Autonomous drone deployment and formation
- Single drone POV
- Multi-drone command center (4 synchronized camera feeds in 2x2 grid)
- Interactive AI View with frozen volumetric moment - demonstrating:
  * Auto-orbit cinematic camera
  * Manual control with arrow keys to move through 3D space
  * Zoom controls
  * Different control modes

ANALYSIS REQUESTED:
Please evaluate this demo video for a hackathon submission focusing on:

1. **Concept Clarity**: Does the video clearly communicate the innovation? Does it explain the problem and solution?
2. **Demo Effectiveness**: Are all major features demonstrated? Is the multi-perspective capture system clear?
3. **Technical Impression**: Does the volumetric reconstruction and AI View concept come across as impressive and technically sound?
4. **Presentation Quality**: Is the UI clean and professional? Do all controls work smoothly?
5. **Pacing & Flow**: Is the demo engaging and well-paced? Would judges be impressed?
6. **Hackathon Readiness**: Is this ready for submission? What's missing?

Be constructive but honest. This is for a competitive hackathon judged by VCs and tech leaders.`;

  try {
    console.log('Sending to Gemini for analysis...\n');

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: 'video/mp4',
                  data: base64Video
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API Error:', error);
      process.exit(1);
    }

    const result = await response.json();
    const analysis = result.candidates[0].content.parts[0].text;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🤖 GEMINI VIDEO ANALYSIS - SkyStudio Demo');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(analysis);
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Save analysis to file
    fs.writeFileSync('/tmp/gemini_analysis.txt', analysis);
    console.log('✅ Analysis saved to /tmp/gemini_analysis.txt');

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    process.exit(1);
  }
}

analyzeVideoWithGemini();
