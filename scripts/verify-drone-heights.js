import { chromium } from 'playwright';

async function verifyDroneHeights() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    console.log('📐 Verifying Drone Height Distribution\n');

    // Load page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Deploy drones
    console.log('Deploying drones...');
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });
    await page.waitForTimeout(3000);

    // Check heights periodically
    console.log('\nDrone Heights Over Time:');
    console.log('Time (s) | Height Range | Avg Height | Spread');
    console.log('-'.repeat(50));

    for (let t = 0; t <= 15; t += 3) {
        const heights = await page.evaluate(() => {
            const drones = window.app.droneFleet.getActiveDrones();
            const h = drones.map(d => d.getPosition().y);
            const min = Math.min(...h);
            const max = Math.max(...h);
            const avg = h.reduce((a, b) => a + b) / h.length;
            return { min, max, avg, heights: h };
        });

        const spread = (heights.max - heights.min).toFixed(1);
        const avgHeight = heights.avg.toFixed(1);
        const minH = heights.min.toFixed(1);
        const maxH = heights.max.toFixed(1);

        console.log(`${t.toString().padEnd(7)} | ${minH}m - ${maxH}m | ${avgHeight}m | ${spread}m`);

        if (t < 15) {
            await page.waitForTimeout(3000);
        }
    }

    // Final verification
    console.log('\n' + '='.repeat(50));
    const finalHeights = await page.evaluate(() => {
        const drones = window.app.droneFleet.getActiveDrones();
        const heights = drones.map((d, i) => ({
            id: i,
            height: parseFloat(d.getPosition().y.toFixed(1))
        }));
        const h = heights.map(x => x.height);
        return {
            details: heights,
            min: Math.min(...h),
            max: Math.max(...h),
            spread: Math.max(...h) - Math.min(...h),
            avg: h.reduce((a, b) => a + b) / h.length
        };
    });

    console.log('FINAL DRONE HEIGHTS:');
    finalHeights.details.forEach(d => {
        console.log(`  Drone ${d.id.toString().padStart(2)}: ${d.height.toFixed(1)}m`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY:');
    console.log(`Minimum height: ${finalHeights.min.toFixed(1)}m`);
    console.log(`Maximum height: ${finalHeights.max.toFixed(1)}m`);
    console.log(`Height spread: ${finalHeights.spread.toFixed(1)}m`);
    console.log(`Average height: ${finalHeights.avg.toFixed(1)}m`);

    if (finalHeights.spread > 10) {
        console.log('\n✅ EXCELLENT: Drones are well-distributed across different heights!');
    } else if (finalHeights.spread > 5) {
        console.log('\n✅ GOOD: Drones have good height variation');
    } else {
        console.log('\n⚠️  WARNING: Drones are still too close in height');
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/drone-height-distribution.png' });
    console.log('\n📸 Screenshot: /tmp/drone-height-distribution.png');

    await browser.close();
}

verifyDroneHeights().catch(console.error);
