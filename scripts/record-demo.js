import { chromium } from 'playwright';

async function recordDemo() {
    console.log('🎬 Starting Super Bowl LX Demo Recording (60 seconds)...\n');

    const browser = await chromium.launch({
        headless: false,
        args: [
            '--start-maximized',
            '--start-fullscreen',
            '--kiosk'
        ]
    });

    const context = await browser.newContext({
        viewport: null,  // Use full screen
        recordVideo: {
            dir: './demo-videos/',
            size: { width: 1920, height: 1080 }
        }
    });

    const page = await context.newPage();

    // Enter fullscreen mode
    await page.evaluate(() => {
        document.documentElement.requestFullscreen?.();
    });

    console.log('📡 Loading application...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(6000); // Wait longer for scene to fully load

    // Disable broken features for better performance
    await page.evaluate(() => {
        // Disable point cloud
        const pcCheckbox = document.getElementById('show-pointcloud');
        if (pcCheckbox && pcCheckbox.checked) {
            pcCheckbox.click();
        }

        // Disable FOV frustums
        const fovCheckbox = document.getElementById('show-fov');
        if (fovCheckbox && fovCheckbox.checked) {
            fovCheckbox.click();
        }
    });

    console.log('\n🎬 [0-12s] Scene 1: The Blind Spot');
    console.log('   Showing traditional broadcast view limitations');
    await page.evaluate(() => {
        const broadcastBtn = document.querySelector('[data-view="broadcast"]');
        if (broadcastBtn) broadcastBtn.click();
    });
    await page.waitForTimeout(8000);

    console.log('\n🎬 [12-25s] Scene 2: The Swarm');
    console.log('   Deploying 12 autonomous drones');
    await page.evaluate(() => {
        const freeBtn = document.querySelector('[data-view="free"]');
        if (freeBtn) freeBtn.click();
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });
    await page.waitForTimeout(10000); // Watch drones deploy and spread out

    console.log('\n🎬 [25-42s] Scene 3: The Drones at Work');
    console.log('   Showing free camera following drone swarm');

    // Stay in free camera but zoom in on drones
    await page.evaluate(() => {
        const freeBtn = document.querySelector('[data-view="free"]');
        if (freeBtn) freeBtn.click();
    });
    await page.waitForTimeout(12000); // Watch drones track players

    console.log('\n🎬 [42-52s] Scene 4: Different Angles');
    console.log('   Showing broadcast view');
    await page.evaluate(() => {
        const broadcastBtn = document.querySelector('[data-view="broadcast"]');
        if (broadcastBtn) broadcastBtn.click();
    });
    await page.waitForTimeout(8000);

    console.log('\n🎬 [52-60s] Scene 5: The System at Work');
    console.log('   Showing free camera with full system');
    await page.evaluate(() => {
        const freeBtn = document.querySelector('[data-view="free"]');
        if (freeBtn) freeBtn.click();
    });
    await page.waitForTimeout(7000);

    console.log('\n✅ Recording complete! Saving video...');
    await page.waitForTimeout(2000);

    await context.close();
    const videoPath = await browser.close();

    console.log('\n════════════════════════════════════════');
    console.log('✅ Demo video recorded successfully!');
    console.log('📹 Location: ./demo-videos/');
    console.log('🎙️ Narration script: demo-narration.txt');
    console.log('\n💡 Next: Use Pipecat Daily to generate audio from narration');
    console.log('════════════════════════════════════════\n');
}

recordDemo().catch(console.error);
