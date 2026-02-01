import { chromium } from 'playwright';

async function quickMultiViewTest() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    console.log('🎬 Quick Multi-View Stability Test (10 seconds)\n');

    // Load page
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
    console.log('Activating multi-view...');
    await page.evaluate(() => {
        const btn = document.getElementById('multi-view-toggle');
        if (btn) btn.click();
    });
    await page.waitForTimeout(1000);

    // Monitor for resize events
    console.log('Monitoring for resize events...\n');
    let resizeCount = 0;
    await page.evaluate(() => {
        window.resizeCount = 0;
        window.originalAddEventListener = window.addEventListener;
        const originalResize = window.onresize;

        window.addEventListener('resize', () => {
            window.resizeCount++;
            console.log(`[RESIZE EVENT #${window.resizeCount}] at ${new Date().toLocaleTimeString()}`);
        });
    });

    // Watch for 10 seconds
    for (let i = 0; i < 10; i++) {
        const count = await page.evaluate(() => window.resizeCount || 0);
        console.log(`[${i}s] Resize events so far: ${count}`);
        await page.waitForTimeout(1000);
    }

    const finalCount = await page.evaluate(() => window.resizeCount || 0);
    console.log(`\n⚠️ Total resize events in 10 seconds: ${finalCount}`);
    console.log(`Average: ${(finalCount / 10).toFixed(1)} events/second`);

    // Take final screenshot
    await page.screenshot({ path: '/tmp/multiview-test.png' });
    console.log('Screenshot: /tmp/multiview-test.png');

    await browser.close();
}

quickMultiViewTest().catch(console.error);
