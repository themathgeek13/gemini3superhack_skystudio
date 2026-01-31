import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function recordPrimaryTrackingDemo() {
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-fullscreen']
    });

    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    console.log('🎬 Recording Primary Tracking Drones Demo\n');
    console.log('This demo will show:');
    console.log('  • Drones 0, 1, 2 always tracking formation centroid');
    console.log('  • These drones positioned at LOWER heights (5-10m)');
    console.log('  • 3 drone feeds in horizontal command center layout');
    console.log('  • Stable feeds suitable for Gemini analysis\n');

    // Load page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Zoom out to 87% for better fit
    await page.evaluate(() => {
        document.body.style.zoom = '0.87';
    });
    await page.waitForTimeout(1000);

    // Deploy drones
    console.log('📍 Deploying primary tracking drones...');
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });
    await page.waitForTimeout(2000);

    // Activate multi-drone view
    console.log('🎥 Activating Multi-Drone Command Center view...');
    await page.evaluate(() => {
        const multiBtn = document.getElementById('multi-view-toggle');
        if (multiBtn) multiBtn.click();
    });
    await page.waitForTimeout(2000);

    // Collect screenshots during gameplay (every 3 seconds)
    const framesDir = '/tmp/primary-tracking-frames';
    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
    }

    console.log('\n📸 Capturing keyframes during gameplay...');
    const frameInterval = 3000;  // Capture every 3 seconds
    const recordDuration = 60000; // 60 second recording
    const frameCount = Math.floor(recordDuration / frameInterval);

    for (let i = 0; i < frameCount; i++) {
        const timestamp = i * frameInterval;
        console.log(`  Frame ${i + 1}/${frameCount} (${timestamp / 1000}s)...`);

        const framePath = path.join(framesDir, `frame-${String(i + 1).padStart(2, '0')}.png`);
        await page.screenshot({ path: framePath });

        await page.waitForTimeout(frameInterval);
    }

    console.log(`\n✅ Captured ${frameCount} keyframes`);
    console.log(`📁 Frames saved to: ${framesDir}\n`);

    // Get final metrics
    const metrics = await page.evaluate(() => {
        const stats = document.querySelector('#stats');
        return {
            fps: stats ? stats.textContent : 'unknown',
            title: document.title
        };
    });

    console.log('📊 Final Metrics:');
    console.log(`  FPS: ${metrics.fps}`);
    console.log('\n🎯 Demo complete! Ready for Gemini analysis\n');

    await browser.close();
}

recordPrimaryTrackingDemo().catch(console.error);
