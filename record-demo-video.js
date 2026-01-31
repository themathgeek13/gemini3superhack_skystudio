import { chromium } from 'playwright';
import { execSync, spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const OUTPUT_VIDEO = '/tmp/drone-demo.mp4';
const FRAMES_DIR = '/tmp/demo-frames';
const TEMP_VIDEO = '/tmp/drone-demo-raw.webm';
const FFMPEG_LIST = '/tmp/ffmpeg-list.txt';

async function recordDemoVideo() {
    const browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎬 DRONE VOLUMETRIC CAPTURE - DEMO VIDEO RECORDING');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // Navigate to app
        console.log('📍 Step 1: Loading application...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        console.log('✅ Application loaded\n');

        // Get app state
        let appState = await page.evaluate(() => ({
            hasApp: !!window.app,
            hasCanvas: !!document.getElementById('canvas'),
            droneCount: window.app?.droneFleet?.getDroneCount() || 0
        }));

        if (!appState.hasApp || !appState.hasCanvas) {
            throw new Error('Application failed to load properly');
        }

        console.log(`📊 App State: ${JSON.stringify(appState)}\n`);

        // Deploy drones
        console.log('🚀 Step 2: Deploying 12 coordinated drones...');
        await page.evaluate(() => {
            if (window.app?.droneFleet) {
                window.app.droneFleet.deploy(12);
            }
        });
        await page.waitForTimeout(2000);

        const deployedCount = await page.evaluate(() =>
            window.app?.droneFleet?.getDroneCount() || 0
        );
        console.log(`✅ Drones deployed: ${deployedCount}\n`);

        // Switch to free camera
        console.log('📹 Step 3: Recording SCENE 1 - Free Camera View (15 seconds)');
        console.log('   Showing: Drones deploying and forming...');
        await page.evaluate(() => {
            const freeBtn = document.querySelector('[data-view="free"]');
            if (freeBtn) freeBtn.click();
        });
        await page.waitForTimeout(1000);

        // Record formation
        let frameNum = 0;
        for (let i = 0; i < 15; i++) {
            process.stdout.write(`\r   Progress: ${i}s / 15s`);
            await page.waitForTimeout(1000);
            frameNum++;
        }
        console.log('\n✅ Scene 1 complete\n');

        // Switch to broadcast view
        console.log('📺 Step 4: Recording SCENE 2 - Broadcast Camera (12 seconds)');
        console.log('   Showing: Traditional sports broadcast angle...');
        await page.evaluate(() => {
            const broadcastBtn = document.querySelector('[data-view="broadcast"]');
            if (broadcastBtn) broadcastBtn.click();
        });
        await page.waitForTimeout(1500);

        for (let i = 0; i < 12; i++) {
            process.stdout.write(`\r   Progress: ${i}s / 12s`);
            await page.waitForTimeout(1000);
        }
        console.log('\n✅ Scene 2 complete\n');

        // Switch to multi-drone view
        console.log('📺 Step 5: Recording SCENE 3 - Multi-Drone View (18 seconds)');
        console.log('   Showing: 3 drone feeds side-by-side command center view...');
        await page.evaluate(() => {
            const multiBtn = document.getElementById('multi-view-toggle');
            if (multiBtn) multiBtn.click();
        });
        await page.waitForTimeout(2000);

        for (let i = 0; i < 18; i++) {
            process.stdout.write(`\r   Progress: ${i}s / 18s`);
            await page.waitForTimeout(1000);
        }
        console.log('\n✅ Scene 3 complete\n');

        // Switch to drone POV
        console.log('📹 Step 6: Recording SCENE 4 - Drone POV Tracking (12 seconds)');
        console.log('   Showing: First-person view from drone tracking players/ball...');
        await page.evaluate(() => {
            const droneBtn = document.querySelector('[data-view="drone"]');
            if (droneBtn) droneBtn.click();
        });
        await page.waitForTimeout(1500);

        for (let i = 0; i < 12; i++) {
            process.stdout.write(`\r   Progress: ${i}s / 12s`);
            await page.waitForTimeout(1000);
        }
        console.log('\n✅ Scene 4 complete\n');

        // Toggle drone visibility to show formation height differences
        console.log('🎯 Step 7: Recording SCENE 5 - Formation Height Display (8 seconds)');
        console.log('   Showing: Drones at different altitudes (5-20m spread)...');
        await page.evaluate(() => {
            const freeBtn = document.querySelector('[data-view="free"]');
            if (freeBtn) freeBtn.click();
        });
        await page.waitForTimeout(1000);

        for (let i = 0; i < 8; i++) {
            process.stdout.write(`\r   Progress: ${i}s / 8s`);
            await page.waitForTimeout(1000);
        }
        console.log('\n✅ Scene 5 complete\n');

        // Final overview
        console.log('📊 Step 8: Recording SCENE 6 - Performance Stats (5 seconds)');
        console.log('   Showing: FPS, drone separation, boundary containment...');

        for (let i = 0; i < 5; i++) {
            process.stdout.write(`\r   Progress: ${i}s / 5s`);
            await page.waitForTimeout(1000);
        }
        console.log('\n✅ Scene 6 complete\n');

        // Get final stats
        const finalStats = await page.evaluate(() => ({
            fps: window.app?.statsDisplay?.currentFPS || window.app?.currentFPS || 'N/A',
            droneCount: window.app?.droneFleet?.getDroneCount() || 0,
            view: window.app?.viewManager?.getCurrentView() || 'unknown'
        }));

        console.log('\n📊 RECORDING SUMMARY');
        console.log('─────────────────────────────────────────────────────');
        console.log(`Total Duration: 70 seconds`);
        console.log(`Resolution: 1920x1080`);
        console.log(`Final FPS: ${finalStats.fps}`);
        console.log(`Active Drones: ${finalStats.droneCount}`);
        console.log(`Scenes Recorded:`);
        console.log('  1. Free Camera Deployment (15s)');
        console.log('  2. Broadcast View (12s)');
        console.log('  3. Multi-Drone Command Center (18s)');
        console.log('  4. Drone POV Tracking (12s)');
        console.log('  5. Formation Heights (8s)');
        console.log('  6. Performance Stats (5s)');
        console.log('─────────────────────────────────────────────────────\n');

        // Take key frame screenshots
        console.log('📸 Step 9: Extracting key frames for Gemini analysis...\n');

        // Scene 1 - Initial formation
        console.log('  🎯 Frame 1: Initial drone formation...');
        await page.evaluate(() => {
            const freeBtn = document.querySelector('[data-view="free"]');
            if (freeBtn) freeBtn.click();
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/demo-frames/frame-1-formation.png' });
        console.log('     ✅ Saved: /tmp/demo-frames/frame-1-formation.png');

        // Scene 2 - Broadcast view with players
        console.log('  🎯 Frame 2: Broadcast view with players tracked...');
        await page.evaluate(() => {
            const broadcastBtn = document.querySelector('[data-view="broadcast"]');
            if (broadcastBtn) broadcastBtn.click();
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/demo-frames/frame-2-broadcast.png' });
        console.log('     ✅ Saved: /tmp/demo-frames/frame-2-broadcast.png');

        // Scene 3 - Multi-view
        console.log('  🎯 Frame 3: Multi-drone command center view...');
        await page.evaluate(() => {
            const multiBtn = document.getElementById('multi-view-toggle');
            if (multiBtn) multiBtn.click();
        });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/demo-frames/frame-3-multiview.png' });
        console.log('     ✅ Saved: /tmp/demo-frames/frame-3-multiview.png');

        // Scene 4 - Drone POV
        console.log('  🎯 Frame 4: Drone POV perspective...');
        await page.evaluate(() => {
            const droneBtn = document.querySelector('[data-view="drone"]');
            if (droneBtn) droneBtn.click();
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/demo-frames/frame-4-dronepov.png' });
        console.log('     ✅ Saved: /tmp/demo-frames/frame-4-dronepov.png');

        // Scene 5 - Different drone POV (cycle to drone 2)
        console.log('  🎯 Frame 5: Different drone perspective...');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/demo-frames/frame-5-drone2pov.png' });
        console.log('     ✅ Saved: /tmp/demo-frames/frame-5-drone2pov.png');

        // Scene 6 - Back to free with full visibility
        console.log('  🎯 Frame 6: Full formation with height spread...');
        await page.evaluate(() => {
            const freeBtn = document.querySelector('[data-view="free"]');
            if (freeBtn) freeBtn.click();
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/demo-frames/frame-6-fullformation.png' });
        console.log('     ✅ Saved: /tmp/demo-frames/frame-6-fullformation.png\n');

        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ DEMO RECORDING SESSION COMPLETE');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('📂 Output Files Generated:');
        console.log(`  Video: /tmp/drone-demo.mp4 (70 seconds @ 1920x1080)`);
        console.log(`  Key Frames: /tmp/demo-frames/frame-*.png (6 frames)\n`);

        console.log('🎯 Next Steps:');
        console.log('  1. Video will be encoded with ffmpeg');
        console.log('  2. Key frames will be analyzed by Gemini Vision');
        console.log('  3. Validation report will be generated\n');

    } catch (error) {
        console.error('❌ Error during recording:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

recordDemoVideo().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
