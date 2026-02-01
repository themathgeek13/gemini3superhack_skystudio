import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

async function recordAndAnalyzeOptimizedDemo() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    console.log('🎬 Recording Demo for Gemini Analysis...\n');

    // Navigate to app
    console.log('Loading application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Deploy drones
    console.log('Deploying drones...');
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });
    await page.waitForTimeout(1000);

    // Capture sequences
    const screenshots = [];

    // Scene 1: Drones deployed in formation
    console.log('📸 Capturing drone deployment...');
    for (let i = 0; i < 5; i++) {
        const filename = `/tmp/frame-deployment-${i}.png`;
        await page.screenshot({ path: filename });
        screenshots.push(filename);
        await page.waitForTimeout(1000);
    }

    // Scene 2: Single drone POV
    console.log('📹 Capturing drone POV...');
    await page.evaluate(() => {
        const droneViewBtn = document.querySelector('[data-view="drone"]');
        if (droneViewBtn) droneViewBtn.click();
    });
    await page.waitForTimeout(1000);

    for (let i = 0; i < 5; i++) {
        const filename = `/tmp/frame-drone-pov-${i}.png`;
        await page.screenshot({ path: filename });
        screenshots.push(filename);
        await page.waitForTimeout(1000);
    }

    // Scene 3: Multi-drone grid
    console.log('📺 Capturing multi-drone view...');
    await page.evaluate(() => {
        const multiBtn = document.getElementById('multi-view-toggle');
        if (multiBtn) multiBtn.click();
    });
    await page.waitForTimeout(1000);

    for (let i = 0; i < 5; i++) {
        const filename = `/tmp/frame-multi-drone-${i}.png`;
        await page.screenshot({ path: filename });
        screenshots.push(filename);
        await page.waitForTimeout(1000);
    }

    // Scene 4: Broadcast view
    console.log('📺 Capturing broadcast view...');
    await page.evaluate(() => {
        const broadcastBtn = document.querySelector('[data-view="broadcast"]');
        if (broadcastBtn) broadcastBtn.click();
    });
    await page.waitForTimeout(1000);

    for (let i = 0; i < 5; i++) {
        const filename = `/tmp/frame-broadcast-${i}.png`;
        await page.screenshot({ path: filename });
        screenshots.push(filename);
        await page.waitForTimeout(1000);
    }

    console.log(`\n✅ Captured ${screenshots.length} frames`);

    // Now analyze with Gemini
    console.log('\n📤 Sending to Gemini for analysis...');
    await analyzeWithGemini(screenshots);

    await browser.close();
}

async function analyzeWithGemini(screenshotPaths) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error('❌ GOOGLE_API_KEY environment variable not set. Please set it before running.');
        return;
    }

    try {
        // Read key frames for analysis
        const samplesToAnalyze = [0, 4, 9, 14, 19];  // Key frames from each scene
        const imageParts = [];

        for (const idx of samplesToAnalyze) {
            if (idx < screenshotPaths.length) {
                const imageBuffer = fs.readFileSync(screenshotPaths[idx]);
                imageParts.push({
                    inlineData: {
                        data: imageBuffer.toString('base64'),
                        mimeType: 'image/png'
                    }
                });
            }
        }

        const analysisPrompt = `You are analyzing a drone volumetric sports capture system demo for Super Bowl LX 2026 at Levi's Stadium.

Previous analysis (BEFORE optimizations) found these issues:
1. Drones were invisible or flying away to billions of meters
2. FPS was 8-13 (very low)
3. Drone camera views were broken/not visible
4. Coverage was always 0%
5. System looked like an early prototype

Analyze these 5 frames from the OPTIMIZED demo and evaluate:
1. Drone Visibility: Are drones visible and stable now?
2. FPS Performance: Is it smoother than before?
3. Formation Quality: Do the 12 drones form a coordinated formation?
4. Camera Views: Are drone POV and multi-drone grid views working?
5. Overall Progress: What major improvements compared to before?

Frame sequence:
- Frames 0-4: Free camera with 12 drones
- Frames 5-9: Single drone POV
- Frames 10-14: Multi-drone grid (3-6 feeds)
- Frames 15-19: Broadcast view`;

        const contentParts = [{ text: analysisPrompt }, ...imageParts];

        const requestBody = {
            contents: [{
                parts: contentParts
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1500
            }
        };

        console.log('Sending to Gemini 2.0 Flash API...');
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            const error = await response.text();
            console.error('Response:', error);
            return;
        }

        const result = await response.json();
        const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis returned';

        console.log('\n' + '='.repeat(70));
        console.log('🤖 GEMINI ANALYSIS - OPTIMIZED DEMO');
        console.log('='.repeat(70) + '\n');
        console.log(analysisText);
        console.log('\n' + '='.repeat(70));

        // Save analysis to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const analysisFile = `/tmp/gemini-analysis-optimized-${timestamp}.txt`;
        fs.writeFileSync(analysisFile, analysisText);
        console.log(`\n📄 Analysis saved to: ${analysisFile}`);

    } catch (error) {
        console.error('Error analyzing with Gemini:', error.message);
        console.error(error);
    }
}

recordAndAnalyzeOptimizedDemo().catch(console.error);
