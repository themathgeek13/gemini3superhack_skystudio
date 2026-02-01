import { chromium } from 'playwright';

async function checkDronePositions() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('🔍 Checking drone positions...\n');

    // Capture console logs
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Drone') || text.includes('drone') || text.includes('🚁') || text.includes('✅')) {
            console.log('  Console:', text);
        }
    });

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000);

    console.log('\n📊 Checking scene state after 5 seconds...\n');

    // Check drone positions
    const droneInfo = await page.evaluate(() => {
        if (!window.app || !window.app.droneFleet) {
            return { error: 'App or droneFleet not found' };
        }

        const drones = window.app.droneFleet.getActiveDrones();
        return {
            count: drones.length,
            positions: drones.map(d => {
                const pos = d.getPosition();
                const distance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
                return {
                    id: d.id,
                    x: pos.x.toFixed(1),
                    y: pos.y.toFixed(1),
                    z: pos.z.toFixed(1),
                    distanceFromCenter: distance.toFixed(1)
                };
            })
        };
    });

    console.log('Drone Info:', JSON.stringify(droneInfo, null, 2));

    console.log('\n⏳ Waiting 10 more seconds to see if they fly away...\n');
    await page.waitForTimeout(10000);

    const droneInfoAfter = await page.evaluate(() => {
        const drones = window.app.droneFleet.getActiveDrones();
        return {
            count: drones.length,
            positions: drones.map(d => {
                const pos = d.getPosition();
                const distance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
                return {
                    id: d.id,
                    x: pos.x.toFixed(1),
                    y: pos.y.toFixed(1),
                    z: pos.z.toFixed(1),
                    distanceFromCenter: distance.toFixed(1)
                };
            })
        };
    });

    console.log('Drone Info After 10s:', JSON.stringify(droneInfoAfter, null, 2));

    await browser.close();
}

checkDronePositions().catch(console.error);
