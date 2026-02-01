import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, readdirSync, writeFileSync } from 'fs';

const genAI = new GoogleGenerativeAI('AIzaSyA6ku2x9helAoJyRJvXkIBvDhHjiaFGLC0');

async function analyzeVideoFrames() {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    // Get all frame images
    const frames = readdirSync('video-frames')
        .filter(f => f.endsWith('.png'))
        .sort()
        .slice(0, 8); // Analyze first 8 frames

    console.log(`🔍 Analyzing ${frames.length} video frames with Gemini...\n`);

    // Convert images to base64
    const imageParts = frames.map(filename => {
        const imageData = readFileSync(`video-frames/${filename}`);
        return {
            inlineData: {
                data: imageData.toString('base64'),
                mimeType: 'image/png'
            }
        };
    });

    const prompt = `Analyze these frames from a Super Bowl drone volumetric capture demo video.

The demo shows:
- A 120-yard American football field with 22 players
- 12 autonomous drones that coordinate to track players
- Different camera views: broadcast, free camera, drone POV, point cloud
- Bullet-time effects with frozen action

Please analyze and identify:
1. **Visual Quality Issues**: Are the drones visible? Do they look good? Any rendering problems?
2. **Drone Positioning**: Do the 12 drones appear to be coordinating and tracking players properly?
3. **Camera Views**: Which view mode is shown in each frame? Does it look professional?
4. **Point Cloud**: If point cloud view is shown, does it look realistic or sparse?
5. **Overall Polish**: Does this look like a professional hackathon demo or are there glaring issues?
6. **Specific Problems**: List any technical issues you notice (black screens, missing objects, poor lighting, etc.)

Be specific about what frames show what issues. Frame numbering: ${frames.map((f, i) => `Frame ${i + 1}: ${f}`).join(', ')}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const analysis = result.response.text();

    console.log('═══════════════════════════════════════════════');
    console.log('🤖 GEMINI VIDEO ANALYSIS\n');
    console.log(analysis);
    console.log('\n═══════════════════════════════════════════════\n');

    // Save analysis
    writeFileSync('video-analysis.txt', analysis);
    console.log('✅ Analysis saved to: video-analysis.txt\n');

    return analysis;
}

analyzeVideoFrames().catch(console.error);
