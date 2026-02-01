import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

async function testDroneViews() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    console.log('🎥 Testing Drone Camera Views...\n');

    // Load the page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Deploy drones
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });
    await page.waitForTimeout(1000);

    // Test 1: Single Drone POV
    console.log('Test 1: Single Drone POV (Press 3)');
    await page.evaluate(() => {
        const droneViewBtn = document.querySelector('[data-view="drone"]');
        if (droneViewBtn) droneViewBtn.click();
    });
    await page.waitForTimeout(1000);

    const droneView1 = await page.screenshot({ path: '/tmp/drone-view-1.png' });
    console.log('  📸 Captured drone POV view');

    // Cycle to next drone
    console.log('Test 2: Cycling to next drone (Right arrow)');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);

    const droneView2 = await page.screenshot({ path: '/tmp/drone-view-2.png' });
    console.log('  📸 Captured next drone POV');

    // Test 3: Multi-Drone View (4x3 grid)
    console.log('\nTest 3: Multi-Drone View (Press M)');
    await page.evaluate(() => {
        const multiViewBtn = document.getElementById('multi-view-toggle');
        if (multiViewBtn) multiViewBtn.click();
    });
    await page.waitForTimeout(1000);

    const multiView = await page.screenshot({ path: '/tmp/multi-drone-view.png' });
    console.log('  📸 Captured multi-drone view (12 drones in grid)');

    // Test 4: Free Camera
    console.log('\nTest 4: Back to Free Camera (Press 1)');
    await page.evaluate(() => {
        const freeViewBtn = document.querySelector('[data-view="free"]');
        if (freeViewBtn) freeViewBtn.click();
    });
    await page.waitForTimeout(500);

    const freeView = await page.screenshot({ path: '/tmp/free-view.png' });
    console.log('  📸 Captured free camera view');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ All drone view tests completed!');
    console.log('Screenshots saved:');
    console.log('  - /tmp/drone-view-1.png (single drone POV)');
    console.log('  - /tmp/drone-view-2.png (next drone POV)');
    console.log('  - /tmp/multi-drone-view.png (12 drones grid)');
    console.log('  - /tmp/free-view.png (free camera)');
    console.log('='.repeat(50));

    await browser.close();
}

testDroneViews().catch(console.error);
