import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('JS_ERROR:', err));
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:5174', { timeout: 10000 });
    console.log('✓ Page loaded');
    
    // Wait a bit for rendering
    await page.waitForTimeout(3000);
    
    // Check for canvas
    const canvas = await page.$('canvas#canvas');
    console.log('✓ Canvas:', canvas ? 'FOUND' : 'MISSING');
    
    // Check for control panel
    const panel = await page.$('#control-panel');
    console.log('✓ Control panel:', panel ? 'FOUND' : 'MISSING');
    
    // Get page title
    const title = await page.title();
    console.log('✓ Page title:', title);
    
    // Check DOM content
    const bodyContent = await page.textContent('body');
    console.log('✓ Body has content:', bodyContent.length > 100 ? 'YES' : 'NO');
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/app_screenshot.png' });
    console.log('✓ Screenshot saved');
    
  } catch (e) {
    console.log('✗ ERROR:', e.message);
  }
  
  await browser.close();
})();
