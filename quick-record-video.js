import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function quickRecordVideo() {
    console.log('🎬 Quick Primary Tracking Video Recording (30 seconds)\n');

    const outputPath = '/tmp/primary-tracking-video.mp4';
    const tempFramesDir = '/tmp/quick-video-frames';

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
        console.log('Loading application...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Zoom
        await page.evaluate(() => {
            document.body.style.zoom = '0.87';
        });
        await page.waitForTimeout(1000);

        // Deploy
        console.log('Deploying drones...');
        await page.evaluate(() => {
            const btn = document.getElementById('deploy-drones');
            if (btn) btn.click();
        });
        await page.waitForTimeout(2000);

        // Activate multi-view
        console.log('Activating multi-view command center...');
        await page.evaluate(() => {
            const btn = document.getElementById('multi-view-toggle');
            if (btn) btn.click();
        });
        await page.waitForTimeout(1000);

        // Record 30 frames (30 seconds at 1fps)
        console.log('Recording 30 frames...\n');
        const frameCount = 30;

        for (let i = 0; i < frameCount; i++) {
            const frameName = `frame-${String(i).padStart(6, '0')}.png`;
            const framePath = path.join(tempFramesDir, frameName);
            await page.screenshot({ path: framePath });

            const progress = Math.round(((i + 1) / frameCount) * 100);
            console.log(`  [${progress}%] Frame ${i + 1}/${frameCount}`);

            if (i < frameCount - 1) {
                await page.waitForTimeout(1000);
            }
        }

        console.log('\n✅ All frames captured\n');
        await browser.close();

        // Convert to video with ffmpeg
        console.log('🎞️ Encoding video with ffmpeg...');
        const framesPattern = path.join(tempFramesDir, 'frame-%06d.png');

        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', [
                '-y',
                '-framerate', '1',
                '-i', framesPattern,
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-crf', '23',
                outputPath
            ]);

            let output = '';
            ffmpeg.stderr.on('data', (data) => {
                output += data.toString();
                process.stdout.write('.');
            });

            ffmpeg.on('close', (code) => {
                if (code === 0 && fs.existsSync(outputPath)) {
                    const stats = fs.statSync(outputPath);
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                    console.log(`\n\n✅ Video created: ${outputPath}`);
                    console.log(`   Size: ${sizeMB} MB`);
                    console.log(`   Duration: ~30 seconds @ 1fps\n`);

                    // Cleanup
                    fs.rmSync(tempFramesDir, { recursive: true });
                    console.log('🗑️  Cleaned up temporary files\n');
                    console.log('📋 Next: Run analyze-primary-tracking-video-gemini.js\n');
                    resolve();
                } else {
                    reject(new Error(`ffmpeg failed with code ${code}`));
                }
            });

            ffmpeg.on('error', reject);
        });

    } catch (error) {
        await browser.close();
        throw error;
    }
}

quickRecordVideo().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
