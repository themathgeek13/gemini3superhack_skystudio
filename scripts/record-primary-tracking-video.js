import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function recordPrimaryTrackingVideo() {
    console.log('🎬 Recording Primary Tracking Drone Video\n');
    console.log('System Configuration:');
    console.log('  • Drones 0, 1, 2: Primary tracking drones at lower heights (5-10m)');
    console.log('  • Drones 3-11: Secondary drones at varied heights (5-20m)');
    console.log('  • View Mode: Multi-Drone Command Center (3 horizontal feeds)');
    console.log('  • Record Duration: ~60 seconds');
    console.log('  • Output: /tmp/primary-tracking-video.mp4\n');

    const outputPath = '/tmp/primary-tracking-video.mp4';
    const tempFramesDir = '/tmp/primary-video-frames';

    // Create temp directory for frames
    if (!fs.existsSync(tempFramesDir)) {
        fs.mkdirSync(tempFramesDir, { recursive: true });
    }

    const browser = await chromium.launch({
        headless: false,
        args: ['--start-fullscreen']
    });

    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    try {
        // Load page
        console.log('🌐 Loading application...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Zoom out
        await page.evaluate(() => {
            document.body.style.zoom = '0.87';
        });
        await page.waitForTimeout(1000);

        // Deploy drones
        console.log('🚁 Deploying drones...');
        await page.evaluate(() => {
            const deployBtn = document.getElementById('deploy-drones');
            if (deployBtn) deployBtn.click();
        });
        await page.waitForTimeout(2000);

        // Activate multi-drone view
        console.log('🎥 Activating Multi-Drone Command Center...');
        await page.evaluate(() => {
            const multiBtn = document.getElementById('multi-view-toggle');
            if (multiBtn) multiBtn.click();
        });
        await page.waitForTimeout(2000);

        // Capture frames during gameplay
        console.log('📸 Recording frames...');
        const frameCount = 60; // 60 frames at ~1fps = 60 seconds of content
        const frameInterval = 1000; // 1 second between frames

        for (let i = 0; i < frameCount; i++) {
            const frameName = `frame-${String(i).padStart(6, '0')}.png`;
            const framePath = path.join(tempFramesDir, frameName);
            await page.screenshot({ path: framePath });

            const progress = Math.round((i / frameCount) * 100);
            process.stdout.write(`\r  Recording... ${progress}% (Frame ${i + 1}/${frameCount})`);

            await page.waitForTimeout(frameInterval);
        }
        console.log('\n');

        // Verify frames
        const frames = fs.readdirSync(tempFramesDir).filter(f => f.endsWith('.png')).sort();
        console.log(`✅ Captured ${frames.length} frames\n`);

        // Convert frames to video using ffmpeg if available
        console.log('🎞️ Converting frames to video with ffmpeg...');
        const ffmpegPath = '/opt/homebrew/bin/ffmpeg';

        return new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, [
                '-y',
                '-framerate', '1',  // 1 frame per second
                '-i', path.join(tempFramesDir, 'frame-%06d.png'),
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-crf', '23',
                outputPath
            ]);

            let ffmpegOutput = '';
            ffmpeg.stderr.on('data', (data) => {
                ffmpegOutput += data.toString();
            });

            ffmpeg.on('close', async (code) => {
                await browser.close();

                if (code === 0) {
                    // Verify output
                    if (fs.existsSync(outputPath)) {
                        const stats = fs.statSync(outputPath);
                        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                        console.log(`✅ Video created successfully: ${outputPath}`);
                        console.log(`   Size: ${sizeMB} MB`);
                        console.log(`   Duration: ~60 seconds @ 1fps\n`);

                        // Cleanup temp frames
                        fs.rmSync(tempFramesDir, { recursive: true });
                        console.log('🗑️  Cleaned up temporary frames\n');

                        console.log('✅ Recording complete! Ready for Gemini analysis.\n');
                        console.log('📋 Next step: Run analyze-primary-tracking-video-gemini.js');
                        resolve();
                    } else {
                        reject(new Error('Video file was not created'));
                    }
                } else {
                    reject(new Error(`ffmpeg failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });

    } catch (error) {
        await browser.close();
        throw error;
    }
}

recordPrimaryTrackingVideo().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
