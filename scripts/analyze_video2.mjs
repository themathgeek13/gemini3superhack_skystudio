import * as fs from 'fs';

const API_KEY = 'AIzaSyA6ku2x9helAoJyRJvXkIBvDhHjiaFGLC0';

async function analyzeVideoWithGemini() {
  const videoPath = '/tmp/SkyStudio_Demo.mp4';

  if (!fs.existsSync(videoPath)) {
    console.error('Error: Video not found');
    process.exit(1);
  }

  console.log('📹 Analyzing SkyStudio Demo with Gemini\n');
  console.log('Reading video file...');

  const videoData = fs.readFileSync(videoPath);
  const base64Video = videoData.toString('base64');

  const prompt = `You are analyzing a demo video for "SkyStudio" - a hackathon project for AI-powered volumetric sports capture using autonomous drones.

PROJECT OVERVIEW:
- 12 coordinated autonomous drones capture multi-perspective footage of live sports
- AI synthesizes novel camera paths through frozen moments using NeRF reconstruction
- Enables directors to create synthetic camera shots from any angle - impossible with traditional broadcast cameras
- Demo shows the technical system, coordination, and interactive reconstruction capability

EVALUATE THIS DEMO VIDEO FOR HACKATHON JUDGES (VCs, tech leaders):

1. **Concept & Innovation**: How clear is the core innovation? Do you understand the value proposition?
2. **Feature Demonstration**: Which features are shown? Are the key features (drone coordination, multi-view sync, AI reconstruction) demonstrated effectively?
3. **Technical Impression**: Does the volumetric capture and interactive 3D view come across as technically impressive?
4. **UI/UX Quality**: How professional and polished is the interface?
5. **Pacing & Engagement**: Would this keep judges' attention? Is it compelling?
6. **Completeness**: What's missing for a strong hackathon submission?
7. **Overall Score**: Rate 1-10 how impressive this is for a hackathon demo.
8. **Specific Feedback**: What stands out? What could be improved?`;

  try {
    console.log('Sending to Gemini 2.0 Flash...\n');

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
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
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('API Error:', text);
      process.exit(1);
    }

    const result = await response.json();
    const analysis = result.candidates[0].content.parts[0].text;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🤖 GEMINI 2.0 ANALYSIS - SkyStudio Demo');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(analysis);
    console.log('\n═══════════════════════════════════════════════════════════\n');

    fs.writeFileSync('/tmp/gemini_analysis.txt', analysis);
    console.log('✅ Full analysis saved to /tmp/gemini_analysis.txt');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

analyzeVideoWithGemini();
