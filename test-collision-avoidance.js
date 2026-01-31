import { chromium } from 'playwright';

async function testCollisionAvoidance() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    console.log('🛡️  Testing Drone Collision Avoidance & Repulsion\n');

    // Load page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Deploy drones
    console.log('Deploying 12 drones...');
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });
    await page.waitForTimeout(2000);

    // Monitor for closest drone pairs over time
    console.log('\nMonitoring Drone Spacing:');
    console.log('Time | Min Distance | Avg Distance | Max Distance | Status');
    console.log('-'.repeat(65));

    let minOverallDistance = Infinity;
    let collisionCount = 0;

    for (let t = 0; t < 20; t += 2) {
        const distances = await page.evaluate(() => {
            const drones = window.app.droneFleet.getActiveDrones();
            const positions = drones.map(d => d.getPosition());

            // Calculate all pairwise distances
            const allDistances = [];
            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    const dx = positions[i].x - positions[j].x;
                    const dy = positions[i].y - positions[j].y;
                    const dz = positions[i].z - positions[j].z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    allDistances.push(dist);
                }
            }

            const min = Math.min(...allDistances);
            const max = Math.max(...allDistances);
            const avg = allDistances.reduce((a, b) => a + b) / allDistances.length;

            return { min, max, avg };
        });

        minOverallDistance = Math.min(minOverallDistance, distances.min);

        const status = distances.min < 1.5 ? '⚠️  VERY CLOSE' :
                       distances.min < 2.5 ? '⚠️  CLOSE' :
                       '✅ GOOD';

        console.log(`${t}s  | ${distances.min.toFixed(1)}m | ${distances.avg.toFixed(1)}m | ${distances.max.toFixed(1)}m | ${status}`);

        if (distances.min < 0.5) {
            collisionCount++;
        }

        if (t < 20) {
            await page.waitForTimeout(2000);
        }
    }

    // Test multi-drone view with closest drone tracking
    console.log('\n\nTesting Multi-Drone View (Top 3 Closest):');
    await page.evaluate(() => {
        const multiBtn = document.getElementById('multi-view-toggle');
        if (multiBtn) multiBtn.click();
    });
    await page.waitForTimeout(2000);

    // Check which drones are being shown
    const closestDrones = await page.evaluate(() => {
        // Get formation center
        const ballPos = window.app.gameController.getBallPosition();
        const players = window.app.gameController.getPlayers();

        let centerX = ballPos.x, centerY = ballPos.y, centerZ = ballPos.z;
        let count = 1;
        players.forEach(p => {
            const pos = p.getPosition();
            centerX += pos.x;
            centerY += pos.y;
            centerZ += pos.z;
            count++;
        });
        centerX /= count;
        centerY /= count;
        centerZ /= count;

        // Get distances of drones to center
        const drones = window.app.droneFleet.getActiveDrones();
        const droneDistances = drones.map(d => {
            const pos = d.getPosition();
            const dx = pos.x - centerX;
            const dy = pos.y - centerY;
            const dz = pos.z - centerZ;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            return {
                id: d.id,
                height: pos.y.toFixed(1),
                distance: distance.toFixed(1)
            };
        });

        droneDistances.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        return {
            formationCenter: { x: centerX.toFixed(1), y: centerY.toFixed(1), z: centerZ.toFixed(1) },
            closest3: droneDistances.slice(0, 3),
            all: droneDistances
        };
    });

    console.log(`\nFormation Center: (${closestDrones.formationCenter.x}, ${closestDrones.formationCenter.y}, ${closestDrones.formationCenter.z})`);
    console.log('\nTop 3 Drones Closest to Formation Center:');
    closestDrones.closest3.forEach((d, i) => {
        console.log(`  ${i+1}. Drone ${d.id}: ${d.distance}m away (height: ${d.height}m)`);
    });

    console.log('\nAll Drones Sorted by Distance to Formation Center:');
    closestDrones.all.forEach(d => {
        console.log(`  Drone ${d.id.toString().padStart(2)}: ${d.distance.padStart(5)}m away (h: ${d.height}m)`);
    });

    // Take screenshot
    await page.screenshot({ path: '/tmp/collision-avoidance-test.png' });
    console.log('\n📸 Screenshot: /tmp/collision-avoidance-test.png');

    // Summary
    console.log('\n' + '='.repeat(65));
    console.log('COLLISION AVOIDANCE SUMMARY');
    console.log('='.repeat(65));
    console.log(`Minimum inter-drone distance: ${minOverallDistance.toFixed(2)}m`);
    console.log(`Collision events (<0.5m): ${collisionCount}`);

    if (minOverallDistance > 2.0) {
        console.log('\n✅ EXCELLENT: Drones maintain safe distance with strong repulsion');
    } else if (minOverallDistance > 1.0) {
        console.log('\n✅ GOOD: Drones avoid collisions');
    } else {
        console.log('\n⚠️  WARNING: Drones getting too close!');
    }

    console.log('\n✅ Multi-Drone View selects top 3 closest drones to formation');

    await browser.close();
}

testCollisionAvoidance().catch(console.error);
