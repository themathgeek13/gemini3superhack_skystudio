import { chromium } from 'playwright';

async function testApp() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        consoleMessages.push({ type, text });
        console.log(`[Browser ${type}]`, text);
    });

    // Collect errors
    const errors = [];
    page.on('pageerror', error => {
        errors.push(error.message);
        console.error('[Browser Error]', error.message);
    });

    try {
        console.log('Navigating to http://localhost:5173...');
        await page.goto('http://localhost:5173', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        console.log('\n=== Waiting for page to load ===');
        await page.waitForTimeout(5000);

        // Check if canvas exists
        const canvasExists = await page.evaluate(() => {
            const canvas = document.getElementById('canvas');
            return {
                exists: !!canvas,
                width: canvas?.width || 0,
                height: canvas?.height || 0,
                hasWebGL: !!canvas?.getContext('webgl2')
            };
        });
        console.log('\nCanvas status:', canvasExists);

        // Check scene contents
        const sceneInfo = await page.evaluate(() => {
            try {
                if (window.app && window.app.sceneManager && window.app.sceneManager.scene) {
                    const scene = window.app.sceneManager.scene;
                    return {
                        childrenCount: scene.children.length,
                        children: scene.children.map(c => c.type + ':' + (c.name || 'unnamed')),
                        cameraPos: window.app.sceneManager.camera.position
                    };
                }
                return { error: 'Scene not accessible' };
            } catch(e) {
                return { error: e.message };
            }
        });
        console.log('\nScene info:', JSON.stringify(sceneInfo, null, 2));

        // Check for stats display
        const statsExists = await page.evaluate(() => {
            const stats = document.getElementById('stats-display');
            return {
                exists: !!stats,
                content: stats?.textContent || ''
            };
        });
        console.log('\nStats display:', statsExists);

        // Take screenshot
        console.log('\nTaking screenshot...');
        await page.screenshot({
            path: 'browser-screenshot.png',
            fullPage: true
        });
        console.log('Screenshot saved to browser-screenshot.png');

        // Summary
        console.log('\n=== Summary ===');
        console.log('Console messages:', consoleMessages.length);
        console.log('Errors:', errors.length);

        if (errors.length > 0) {
            console.log('\n=== ERRORS FOUND ===');
            errors.forEach((err, i) => {
                console.log(`\nError ${i + 1}:`);
                console.log(err);
            });
        }

        console.log('\n=== Console Log ===');
        consoleMessages.forEach(msg => {
            console.log(`[${msg.type}]`, msg.text);
        });

        // Keep browser open briefly for inspection
        console.log('\nKeeping browser open for 10 seconds...');
        await page.waitForTimeout(10000); // Keep open for 10 seconds

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

testApp().catch(console.error);
