import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/tmp/demo_recording';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function recordDemo() {
  console.log('🎬 Starting SkyStudio Demo Recording...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  try {
    // Load app
    console.log('[00:00] Loading app...');
    await page.goto('http://localhost:5174', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // SCENE 1: Show problem - Broadcast view (0-10 sec)
    console.log('[00:00-00:10] Scene 1: Traditional broadcast view (problem)');
    await page.press('body', '2'); // Broadcast camera
    await page.waitForTimeout(3000);

    // Rotate view with mouse
    await page.mouse.move(500, 400);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(700, 300);
    await page.mouse.up({ button: 'middle' });
    await page.waitForTimeout(2000);

    // SCENE 2: Free camera view showing full field (10-20 sec)
    console.log('[00:10-00:20] Scene 2: Free camera - see the scale');
    await page.press('body', '1'); // Free camera
    await page.waitForTimeout(1000);

    // Zoom out
    for (let i = 0; i < 3; i++) {
      await page.mouse.move(960, 540);
      await page.mouse.wheel(0, 50);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1500);

    // SCENE 3: Deploy drones (20-35 sec)
    console.log('[00:20-00:35] Scene 3: Deploy drones');
    await page.click('#deploy-drones');
    await page.waitForTimeout(3000);

    // Rotate to see drone formation
    await page.mouse.move(500, 400);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(800, 250);
    await page.mouse.up({ button: 'middle' });
    await page.waitForTimeout(2000);

    // Rotate more
    await page.mouse.move(500, 400);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(400, 300);
    await page.mouse.up({ button: 'middle' });
    await page.waitForTimeout(2000);

    // SCENE 4: Drone POV (35-45 sec)
    console.log('[00:35-00:45] Scene 4: Drone POV');
    await page.press('body', '3'); // Drone POV
    await page.waitForTimeout(2000);

    // Use arrow keys to navigate drone view
    await page.press('body', 'ArrowRight');
    await page.waitForTimeout(300);
    await page.press('body', 'ArrowUp');
    await page.waitForTimeout(300);
    await page.press('body', 'ArrowLeft');
    await page.waitForTimeout(1500);

    // SCENE 5: Multi-Drone View (45-60 sec)
    console.log('[00:45-01:00] Scene 5: Multi-Drone Command Center');
    await page.press('body', '1'); // Back to free camera first
    await page.waitForTimeout(500);
    await page.press('body', 'm'); // Multi-view
    await page.waitForTimeout(2000);

    // Let multi-view play and show coordination
    await page.waitForTimeout(3000);

    // SCENE 6: AI View - Interactive Demo (60-85 sec)
    console.log('[01:00-01:25] Scene 6: AI View - Interactive reconstruction');
    await page.click('[id="ai-view-button"]');
    await page.waitForTimeout(2000);

    // Let auto-orbit for 2 seconds
    await page.waitForTimeout(2000);

    // Switch to movement mode with R
    await page.press('body', 'r');
    await page.waitForTimeout(500);

    // Use arrow keys to move through the frozen moment
    // Move forward
    for (let i = 0; i < 8; i++) {
      await page.press('body', 'ArrowUp');
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(500);

    // Move left
    for (let i = 0; i < 5; i++) {
      await page.press('body', 'ArrowLeft');
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(500);

    // Move right
    for (let i = 0; i < 10; i++) {
      await page.press('body', 'ArrowRight');
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(500);

    // Move up with +
    for (let i = 0; i < 5; i++) {
      await page.press('body', '+');
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(500);

    // Zoom with scroll wheel
    await page.mouse.move(960, 540);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -30);
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(1000);

    // Switch back to rotation mode
    await page.press('body', 'r');
    await page.waitForTimeout(2000);

    // SCENE 7: Close AI View and show final view (85-90 sec)
    console.log('[01:25-01:30] Scene 7: Final view');
    await page.press('body', 'Escape');
    await page.waitForTimeout(2000);

    console.log('\n✅ Recording complete!');
    console.log(`📁 Output location: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error during recording:', error);
  } finally {
    // Close with delay to ensure video is written
    await page.waitForTimeout(1000);
    await context.close();
    await browser.close();

    // Find the video file
    const files = fs.readdirSync(OUTPUT_DIR);
    const videoFile = files.find(f => f.endsWith('.webm'));

    if (videoFile) {
      const videoPath = path.join(OUTPUT_DIR, videoFile);
      const outputPath = '/tmp/SkyStudio_Demo.webm';

      // Copy to standard location
      fs.copyFileSync(videoPath, outputPath);

      console.log('\n🎥 Video saved:');
      console.log(`   ${outputPath}`);
      console.log(`   Size: ${Math.round(fs.statSync(outputPath).size / (1024*1024))} MB`);

      // Convert to MP4 if ffmpeg available
      try {
        console.log('\n⏳ Converting to MP4...');
        execSync(`ffmpeg -i ${outputPath} -c:v libx264 -preset medium -c:a aac /tmp/SkyStudio_Demo.mp4 2>/dev/null`, {
          stdio: 'inherit'
        });
        console.log('✅ MP4 version created: /tmp/SkyStudio_Demo.mp4');
      } catch (e) {
        console.log('⚠️  ffmpeg not available for MP4 conversion');
      }
    }
  }
}

recordDemo().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
