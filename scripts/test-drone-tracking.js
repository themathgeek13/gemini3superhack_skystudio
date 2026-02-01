import { chromium } from 'playwright';

async function testDroneTracking() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    console.log('🚁 Testing Drone Tracking & Multi-Drone Views\n');

    // Load page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Deploy drones
    console.log('Deploying drones...');
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });
    await page.waitForTimeout(2000);

    console.log('✅ Drones deployed\n');

    // Test 1: Check drone positions over time
    console.log('Test 1: Drone Tracking (30 seconds)');
    const positions = [];

    for (let t = 0; t < 30; t += 5) {
        const droneData = await page.evaluate(() => {
            if (!window.app?.droneFleet) return { error: 'No fleet' };

            const drones = window.app.droneFleet.getActiveDrones();
            const ballPos = window.app.gameController.getBallPosition();
            const players = window.app.gameController.getPlayers();

            let avgX = 0, avgY = 0, avgZ = 0;
            drones.forEach(d => {
                const pos = d.getPosition();
                avgX += pos.x;
                avgY += pos.y;
                avgZ += pos.z;
            });
            avgX /= drones.length;
            avgY /= drones.length;
            avgZ /= drones.length;

            return {
                time: t,
                droneCount: drones.length,
                averageDronePos: {
                    x: avgX.toFixed(1),
                    y: avgY.toFixed(1),
                    z: avgZ.toFixed(1)
                },
                ballPos: {
                    x: ballPos.x.toFixed(1),
                    y: ballPos.y.toFixed(1),
                    z: ballPos.z.toFixed(1)
                },
                playerCount: players.length
            };
        });

        positions.push(droneData);
        console.log(`  t=${t}s: Drones avg=(${droneData.averageDronePos.x}, ${droneData.averageDronePos.z}) Ball=(${droneData.ballPos.x}, ${droneData.ballPos.z})`);

        await page.waitForTimeout(5000);
    }

    // Analyze drone movement
    console.log('\n📊 Drone Movement Analysis:');
    const avgMovement = Math.abs(parseFloat(positions[0].averageDronePos.x) - parseFloat(positions[positions.length-1].averageDronePos.x)) +
                        Math.abs(parseFloat(positions[0].averageDronePos.z) - parseFloat(positions[positions.length-1].averageDronePos.z));
    console.log(`  Total movement: ${avgMovement.toFixed(1)} meters`);

    if (avgMovement > 5) {
        console.log('  ✅ Drones are MOVING and TRACKING (good!)');
    } else {
        console.log('  ⚠️  Drones are mostly STATIC (not tracking)');
    }

    // Test 2: Multi-drone view
    console.log('\nTest 2: Multi-Drone Grid View');
    await page.evaluate(() => {
        const multiBtn = document.getElementById('multi-view-toggle');
        if (multiBtn) multiBtn.click();
    });
    await page.waitForTimeout(2000);

    const multiDroneActive = await page.evaluate(() => {
        return window.app?.viewManager?.multiDroneView?.isActive() || false;
    });

    if (multiDroneActive) {
        console.log('  ✅ Multi-drone view is ACTIVE');
    } else {
        console.log('  ❌ Multi-drone view is NOT active');
    }

    const screenshot1 = await page.screenshot({ path: '/tmp/test-multi-drone.png' });
    console.log('  📸 Screenshot: /tmp/test-multi-drone.png');

    // Test 3: Single drone POV
    console.log('\nTest 3: Single Drone POV');
    await page.evaluate(() => {
        const droneViewBtn = document.querySelector('[data-view="drone"]');
        if (droneViewBtn) droneViewBtn.click();
    });
    await page.waitForTimeout(2000);

    const droneViewActive = await page.evaluate(() => {
        return window.app?.viewManager?.currentView === 'drone';
    });

    if (droneViewActive) {
        console.log('  ✅ Drone POV view is ACTIVE');
    } else {
        console.log('  ❌ Drone POV view is NOT active');
    }

    const screenshot2 = await page.screenshot({ path: '/tmp/test-drone-pov.png' });
    console.log('  📸 Screenshot: /tmp/test-drone-pov.png');

    // Test 4: Check formation quality
    console.log('\nTest 4: Formation Quality');
    const formationData = await page.evaluate(() => {
        const drones = window.app.droneFleet.getActiveDrones();
        const positions = drones.map(d => d.getPosition());

        // Calculate formation radius and spread
        const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        const centerZ = positions.reduce((sum, p) => sum + p.z, 0) / positions.length;
        const avgHeight = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

        const distances = positions.map(p => {
            const dx = p.x - centerX;
            const dz = p.z - centerZ;
            return Math.sqrt(dx*dx + dz*dz);
        });

        const avgDist = distances.reduce((a, b) => a + b) / distances.length;
        const minDist = Math.min(...distances);
        const maxDist = Math.max(...distances);

        return {
            centerX: centerX.toFixed(1),
            centerZ: centerZ.toFixed(1),
            avgHeight: avgHeight.toFixed(1),
            avgRadius: avgDist.toFixed(1),
            minRadius: minDist.toFixed(1),
            maxRadius: maxDist.toFixed(1),
            spread: (maxDist - minDist).toFixed(1)
        };
    });

    console.log(`  Formation center: (${formationData.centerX}, ${formationData.centerZ})`);
    console.log(`  Average height: ${formationData.avgHeight}m`);
    console.log(`  Average radius: ${formationData.avgRadius}m`);
    console.log(`  Radius spread: ${formationData.minRadius}m - ${formationData.maxRadius}m (${formationData.spread}m)`);

    if (formationData.spread < 10) {
        console.log('  ✅ Formation is TIGHT and COORDINATED');
    } else {
        console.log('  ⚠️  Formation is LOOSE or SCATTERED');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Drones tracking: ${avgMovement > 5 ? '✅' : '❌'}`);
    console.log(`Multi-drone view: ${multiDroneActive ? '✅' : '❌'}`);
    console.log(`Drone POV: ${droneViewActive ? '✅' : '❌'}`);
    console.log(`Formation quality: ${formationData.spread < 10 ? '✅' : '⚠️'}`);

    await browser.close();
}

testDroneTracking().catch(console.error);
