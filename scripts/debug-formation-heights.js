import { chromium } from 'playwright';

async function debugFormationHeights() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    console.log('🔍 Debugging Formation Heights\n');

    // Load page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Deploy drones with extra logging
    console.log('Deploying drones...');
    await page.evaluate(() => {
        // Capture formation goals after first planning
        window.captureFormationGoals = function() {
            const goals = window.app.droneFleet.currentFormationGoals;
            if (!goals || goals.length === 0) {
                return { error: 'No formation goals set' };
            }
            return goals.map((g, i) => ({
                id: i,
                targetHeight: g.y.toFixed(1),
                targetX: g.x.toFixed(1),
                targetZ: g.z.toFixed(1)
            }));
        };
    });

    await page.evaluate(() => {
        const deployBtn = document.getElementById('deploy-drones');
        if (deployBtn) deployBtn.click();
    });

    // Wait for first formation planning
    await page.waitForTimeout(3000);

    // Capture formation goals
    const formationGoals = await page.evaluate(() => {
        return window.captureFormationGoals?.() || { error: 'Function not available' };
    });

    console.log('\nFORMATION GOALS (Target Positions):');
    if (formationGoals.error) {
        console.log(`  ${formationGoals.error}`);
    } else {
        formationGoals.forEach(g => {
            console.log(`  Drone ${g.id}: Target height = ${g.targetHeight}m, Pos = (${g.targetX}, ${g.targetZ})`);
        });

        const heights = formationGoals.map(g => parseFloat(g.targetHeight));
        const minH = Math.min(...heights);
        const maxH = Math.max(...heights);
        console.log(`\n  Min target height: ${minH.toFixed(1)}m`);
        console.log(`  Max target height: ${maxH.toFixed(1)}m`);
        console.log(`  Target spread: ${(maxH - minH).toFixed(1)}m`);
    }

    // Now check actual drone heights
    console.log('\n\nACTUAL DRONE HEIGHTS:');
    const droneHeights = await page.evaluate(() => {
        const drones = window.app.droneFleet.getActiveDrones();
        return drones.map((d, i) => ({
            id: i,
            actualHeight: d.getPosition().y.toFixed(1)
        }));
    });

    droneHeights.forEach(d => {
        console.log(`  Drone ${d.id}: Actual height = ${d.actualHeight}m`);
    });

    const heights = droneHeights.map(d => parseFloat(d.actualHeight));
    const minH = Math.min(...heights);
    const maxH = Math.max(...heights);
    console.log(`\n  Min actual height: ${minH.toFixed(1)}m`);
    console.log(`  Max actual height: ${maxH.toFixed(1)}m`);
    console.log(`  Actual spread: ${(maxH - minH).toFixed(1)}m`);

    await browser.close();
}

debugFormationHeights().catch(console.error);
