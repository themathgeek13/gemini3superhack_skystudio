import { chromium } from 'playwright';

async function detailedMultiViewTest() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    console.log('🔍 Detailed Multi-View Analysis (15 seconds)\n');

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

    // Monitor canvas and viewport changes
    console.log('Monitoring canvas/viewport...\n');

    for (let i = 0; i < 15; i++) {
        const metrics = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            const rect = canvas.getBoundingClientRect();
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

            return {
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                displayWidth: canvas.style.width,
                displayHeight: canvas.style.height,
                boundingLeft: rect.left,
                boundingTop: rect.top,
                boundingWidth: rect.width,
                boundingHeight: rect.height,
                windowInnerWidth: window.innerWidth,
                windowInnerHeight: window.innerHeight,
                zoom: document.body.style.zoom
            };
        });

        console.log(`[${i}s]:`);
        console.log(`  Canvas: ${metrics.canvasWidth}x${metrics.canvasHeight}`);
        console.log(`  Display: ${metrics.displayWidth || 'auto'} x ${metrics.displayHeight || 'auto'}`);
        console.log(`  Bounding: ${metrics.boundingWidth.toFixed(0)}x${metrics.boundingHeight.toFixed(0)} @ (${metrics.boundingLeft.toFixed(0)}, ${metrics.boundingTop.toFixed(0)})`);
        console.log(`  Window: ${metrics.windowInnerWidth}x${metrics.windowInnerHeight}, Zoom: ${metrics.zoom}`);
        console.log();

        await page.waitForTimeout(1000);
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/detailed-test.png' });
    console.log('Screenshot: /tmp/detailed-test.png');

    await browser.close();
}

detailedMultiViewTest().catch(console.error);
