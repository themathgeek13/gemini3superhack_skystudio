import { chromium } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync } from 'fs';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function generateNarration() {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `Create an exciting 60-second narration script for a demo video showcasing:

    A revolutionary drone-based volumetric capture system for Super Bowl LX 2026 at Levi's Stadium.

    Key points to cover (keep it punchy, ~150 words total):
    1. The problem: Traditional broadcast cameras miss 60-65% of the action with static angles
    2. Our solution: 12 autonomous AI-coordinated drones provide 60-80% field coverage
    3. The technology: Real-time volumetric capture, collision-free flight, Gemini-enhanced bullet-time replays
    4. The proof: Coverage heatmap shows 2x better coverage at 1/3 the cost
    5. The future: VR broadcasts, AI highlight reels, any-angle replays on demand

    Style: Energetic sports broadcaster tone, but tech-forward. Think "innovation meets game day."
    Format: Number each scene (1-5) with timing in seconds like "[0-15s]"`;

    const result = await model.generateContent(prompt);
    const narration = result.response.text();

    console.log('\n🎙️ Generated Narration:\n');
    console.log(narration);

    writeFileSync('demo-narration.txt', narration);
    return narration;
}

async function recordDemo() {
    console.log('🎬 Starting demo video recording...\n');

    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: {
            dir: './demo-videos/',
            size: { width: 1920, height: 1080 }
        }
    });

    const page = await context.newPage();

    console.log('📡 Loading application...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000); // Wait for scene to load

    console.log('\n🎬 Scene 1: The Problem (0-15s)');
    console.log('   Action: Show broadcast view with limited coverage');
    await page.keyboard.press('2'); // Broadcast view
    await page.waitForTimeout(5000);

    console.log('\n🎬 Scene 2: The Solution (15-30s)');
    console.log('   Action: Deploy drones, show free camera with all 12 drones');
    await page.keyboard.press('1'); // Free camera
    await page.waitForTimeout(2000);
    await page.keyboard.press('d'); // Deploy drones
    await page.waitForTimeout(8000); // Watch drones deploy and coordinate

    console.log('\n🎬 Scene 3: The Magic (30-45s)');
    console.log('   Action: Wait for exciting play, trigger bullet-time');
    await page.waitForTimeout(5000); // Wait for a play to develop
    await page.keyboard.press('b'); // Bullet-time
    await page.waitForTimeout(5000); // Show bullet-time orbit
    await page.keyboard.press('4'); // Point cloud view
    await page.waitForTimeout(3000);

    console.log('\n🎬 Scene 4: The Proof (45-55s)');
    console.log('   Action: Show coverage heatmap');
    await page.keyboard.press('1'); // Back to free camera
    await page.waitForTimeout(1000);
    await page.keyboard.press('h'); // Toggle heatmap
    await page.waitForTimeout(5000);

    console.log('\n🎬 Scene 5: The Future (55-60s)');
    console.log('   Action: Showcase different views');
    await page.keyboard.press('3'); // Drone POV
    await page.waitForTimeout(3000);
    await page.keyboard.press('1'); // Back to free camera for finale
    await page.waitForTimeout(2000);

    console.log('\n✅ Recording complete! Closing browser...');
    await page.waitForTimeout(2000);

    await context.close();
    await browser.close();

    console.log('\n📹 Video saved to: ./demo-videos/');
    console.log('🎙️ Narration script saved to: demo-narration.txt');
}

async function generateVideoPrompts() {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `Generate 5 concise text overlays for a 60-second demo video of drone-based sports broadcasting tech.

    Each overlay should be:
    - 5-8 words maximum
    - Bold, punchy statement
    - Highlight key metric or benefit

    Scenes:
    1. Traditional broadcast camera limitations
    2. 12 autonomous drones deploying
    3. Bullet-time replay from all angles
    4. Coverage heatmap comparison
    5. Future of sports broadcasting

    Format as JSON array of objects with "scene", "time", "text" keys.`;

    const result = await model.generateContent(prompt);
    const overlays = result.response.text();

    writeFileSync('video-overlays.json', overlays);
    console.log('\n📝 Video overlays saved to: video-overlays.json');
}

async function main() {
    try {
        console.log('🏈 Super Bowl LX Demo Video Creator\n');
        console.log('════════════════════════════════════════\n');

        // Generate narration using Gemini
        await generateNarration();

        // Generate video overlays
        await generateVideoPrompts();

        console.log('\n════════════════════════════════════════\n');
        console.log('⏱️  Starting 60-second recording in 5 seconds...');
        console.log('   Make sure the dev server is running!\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Record the demo
        await recordDemo();

        console.log('\n════════════════════════════════════════');
        console.log('✅ Demo video creation complete!');
        console.log('\nNext steps:');
        console.log('1. Find the video in ./demo-videos/');
        console.log('2. Add narration from demo-narration.txt');
        console.log('3. Add text overlays from video-overlays.json');
        console.log('4. Export final MP4 for hackathon submission');
        console.log('════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error creating demo video:', error);
        process.exit(1);
    }
}

main();
