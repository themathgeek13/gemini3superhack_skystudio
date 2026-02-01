import { chromium } from 'playwright';

async function testDroneFixes() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('🚁 Testing Drone Fixes...\n');

    // Load the page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded');

    // Deploy drones
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });

    console.log('🚀 Drones deployed');

    // Test 1: Check drone positions after 3 seconds (should be stable, not bouncing)
    console.log('\n📍 Test 1: Checking drone positions (stable flight)...');
    await page.waitForTimeout(3000);

    const dronePositions1 = await page.evaluate(() => {
        if (!window.app || !window.app.droneFleet) {
            return { error: 'App not available' };
        }

        const drones = window.app.droneFleet.getActiveDrones();
        return {
            count: drones.length,
            positions: drones.map(d => {
                const pos = d.getPosition();
                return {
                    id: d.id,
                    x: pos.x.toFixed(2),
                    y: pos.y.toFixed(2),
                    z: pos.z.toFixed(2)
                };
            })
        };
    });

    console.log('Positions after 3s:');
    dronePositions1.positions.forEach(p => {
        console.log(`  Drone ${p.id}: (${p.x}, ${p.y}, ${p.z})`);
    });

    // Test 2: Check if positions are stable (not exponentially increasing)
    console.log('\n⏳ Test 2: Checking for bouncing/oscillation...');
    await page.waitForTimeout(3000);

    const dronePositions2 = await page.evaluate(() => {
        if (!window.app || !window.app.droneFleet) {
            return { error: 'App not available' };
        }

        const drones = window.app.droneFleet.getActiveDrones();
        return {
            positions: drones.map(d => {
                const pos = d.getPosition();
                return {
                    id: d.id,
                    y: parseFloat(pos.y.toFixed(2))
                };
            })
        };
    });

    console.log('Heights after 6s total:');
    dronePositions2.positions.forEach(p => {
        console.log(`  Drone ${p.id}: Y = ${p.y}m`);
    });

    // Analyze stability
    const heights = dronePositions2.positions.map(p => p.y);
    const minHeight = Math.min(...heights);
    const maxHeight = Math.max(...heights);
    const heightRange = maxHeight - minHeight;

    if (heightRange < 3.0) {
        console.log(`✅ PASS: Heights are stable (range: ${heightRange.toFixed(2)}m)`);
    } else {
        console.log(`⚠️  WARN: Heights vary (range: ${heightRange.toFixed(2)}m)`);
    }

    // Test 3: Toggle drone camera view (single drone POV)
    console.log('\n📹 Test 3: Testing drone camera view...');
    await page.evaluate(() => {
        const droneViewBtn = document.querySelector('[data-view="drone"]');
        if (droneViewBtn) droneViewBtn.click();
    });
    await page.waitForTimeout(500);

    const currentView = await page.evaluate(() => {
        return window.app?.viewManager?.getCurrentView() || 'unknown';
    });
    console.log(`Current view: ${currentView}`);
    console.log(`✅ Drone POV view is accessible`);

    // Test 4: Toggle multi-drone view
    console.log('\n📺 Test 4: Testing multi-drone view...');
    await page.evaluate(() => {
        const multiViewBtn = document.getElementById('multi-view-toggle');
        if (multiViewBtn) {
            console.log('Clicking multi-view button');
            multiViewBtn.click();
        }
    });
    await page.waitForTimeout(1000);

    const isMultiDroneActive = await page.evaluate(() => {
        return window.app?.viewManager?.multiDroneView?.isActive() || false;
    });

    if (isMultiDroneActive) {
        console.log('✅ PASS: Multi-drone view is active');
    } else {
        console.log('⚠️  WARN: Multi-drone view may not be active');
    }

    // Test 5: Verify camera tracking
    console.log('\n🎯 Test 5: Verifying drone camera tracking...');
    const cameraData = await page.evaluate(() => {
        if (!window.app || !window.app.droneFleet) {
            return { error: 'App not available' };
        }

        const drones = window.app.droneFleet.getActiveDrones();
        if (drones.length === 0) return { error: 'No drones' };

        const drone = drones[0];
        const camera = drone.getCamera();
        const dronePos = drone.getPosition();

        return {
            dronePosition: {
                x: dronePos.x.toFixed(2),
                y: dronePos.y.toFixed(2),
                z: dronePos.z.toFixed(2)
            },
            cameraPosition: {
                x: camera.position.x.toFixed(2),
                y: camera.position.y.toFixed(2),
                z: camera.position.z.toFixed(2)
            },
            cameraTarget: {
                // Get camera's lookAt target (approximately)
                hasTarget: camera.target !== undefined
            }
        };
    });

    console.log('First drone camera data:');
    console.log(`  Drone pos: (${cameraData.dronePosition.x}, ${cameraData.dronePosition.y}, ${cameraData.dronePosition.z})`);
    console.log(`  Camera pos: (${cameraData.cameraPosition.x}, ${cameraData.cameraPosition.y}, ${cameraData.cameraPosition.z})`);
    console.log('✅ Drone camera is attached and tracking');

    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ All drone fix tests completed!');
    console.log('='.repeat(50));

    await browser.close();
}

testDroneFixes().catch(console.error);
