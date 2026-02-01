const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err));
  
  try {
    await page.goto('http://localhost:5174', { timeout: 10000 });
    console.log('Page loaded successfully');
    
    // Wait a bit for content to render
    await page.waitForTimeout(2000);
    
    // Check for canvas
    const canvas = await page.$('canvas#canvas');
    console.log('Canvas found:', canvas ? 'YES' : 'NO');
    
    // Check for control panel
    const panel = await page.$('#control-panel');
    console.log('Control panel found:', panel ? 'YES' : 'NO');
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for errors in console
    const errors = await page.evaluate(() => {
      return window.__errors || 'none';
    });
    console.log('JS errors:', errors);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/screenshot.png' });
    console.log('Screenshot saved to /tmp/screenshot.png');
    
  } catch (e) {
    console.log('ERROR:', e.message);
  }
  
  await browser.close();
})();
