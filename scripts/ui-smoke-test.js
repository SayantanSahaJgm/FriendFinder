const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Page loaded — waiting for client scripts to run (8s)');
    await page.waitForTimeout(8000);

    // Optionally take a small screenshot to ensure page rendered
    await page.screenshot({ path: 'ui-smoke.png', fullPage: false });
    console.log('Screenshot saved to ui-smoke.png');
  } catch (err) {
    console.error('UI smoke test failed:', err && err.message);
    process.exit(2);
  } finally {
    await browser.close();
  }

  console.log('UI smoke test completed');
  process.exit(0);
})();
