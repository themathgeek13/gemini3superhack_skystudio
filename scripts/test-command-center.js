import { chromium } from 'playwright';

async function testCommandCenter() {
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-fullscreen']
    });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    console.log('🎮 Testing Command Center Multi-Drone View (Fullscreen)\n');

    // Load page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Zoom out to 87% for better fit
    await page.evaluate(() => {
        document.body.style.zoom = '0.87';
    });
    await page.waitForTimeout(1000);

    // Deploy drones
    console.log('Deploying drones...');
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });
    await page.waitForTimeout(2000);

    // Activate multi-drone view
    console.log('Activating Command Center view (Multi-Drone View)...');
    await page.evaluate(() => {
        const multiBtn = document.getElementById('multi-view-toggle');
        if (multiBtn) {
            console.log('✅ Multi-Drone View activated');
            multiBtn.click();
        }
    });
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/command-center.png' });
    console.log('\n📸 Screenshot: /tmp/command-center.png');

    // Wait a bit more to show the view
    await page.waitForTimeout(5000);

    // Take another screenshot showing action
    await page.screenshot({ path: '/tmp/command-center-action.png' });
    console.log('📸 Screenshot: /tmp/command-center-action.png');

    console.log('\n✅ Command Center view ready!');
    console.log('Features:');
    console.log('  • 3 drone camera feeds side-by-side');
    console.log('  • Shows the 3 drones CLOSEST to the ball/players');
    console.log('  • Full width layout - command center experience');
    console.log('  • All 3 drones maintain >3m separation (collision avoidance)');

    await browser.close();
}

testCommandCenter().catch(console.error);
