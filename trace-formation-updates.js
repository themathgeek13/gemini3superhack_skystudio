import { chromium } from 'playwright';

async function traceFormationUpdates() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    console.log('📊 Tracing Formation Updates Over Time\n');

    // Load page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Deploy drones
    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });
    await page.waitForTimeout(1000);

    // Check formation goals every 1 second for 5 seconds
    console.log('Time | Drone 0 Target | Drone 6 Target | Drone 11 Target');
    console.log('-'.repeat(60));

    for (let t = 0; t < 6; t++) {
        const formationData = await page.evaluate(() => {
            const goals = window.app.droneFleet.currentFormationGoals;
            if (!goals || goals.length === 0) {
                return null;
            }
            return {
                drone0Target: goals[0].y.toFixed(1),
                drone6Target: goals[6].y.toFixed(1),
                drone11Target: goals[11].y.toFixed(1),
                drone0Actual: window.app.droneFleet.getDrones()[0].getPosition().y.toFixed(1),
                drone6Actual: window.app.droneFleet.getDrones()[6].getPosition().y.toFixed(1),
                drone11Actual: window.app.droneFleet.getDrones()[11].getPosition().y.toFixed(1)
            };
        });

        if (formationData) {
            console.log(`${t}s  | ${formationData.drone0Target}m/${formationData.drone0Actual}m | ${formationData.drone6Target}m/${formationData.drone6Actual}m | ${formationData.drone11Target}m/${formationData.drone11Actual}m`);
        } else {
            console.log(`${t}s  | No formation data`);
        }

        if (t < 5) {
            await page.waitForTimeout(1000);
        }
    }

    console.log('\nFormat: Target/Actual heights');
    console.log('\nDone!');

    await browser.close();
}

traceFormationUpdates().catch(console.error);
