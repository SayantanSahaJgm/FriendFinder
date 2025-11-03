const fs = require('fs');
const { chromium } = require('@playwright/test');
const axeCore = require('axe-core');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const pages = [
    'http://localhost:3000/',
    'http://localhost:3000/login',
    'http://localhost:3000/dashboard',
    'http://localhost:3000/dashboard/random-chat'
  ];

  const report = {};

  for (const url of pages) {
    try {
      console.log('Checking', url);
      await page.goto(url, { waitUntil: 'networkidle' });
      // Inject axe source
      await page.addScriptTag({ content: axeCore.source });
      // Run axe
      const results = await page.evaluate(async () => {
        return await window.axe.run(document, {
          runOnly: {
            type: 'rule',
            values: ['color-contrast']
          }
        });
      });

      const violations = results.violations || [];
      report[url] = violations.map(v => ({
        id: v.id,
        description: v.description,
        impact: v.impact,
        nodes: v.nodes.map(n => ({
          html: n.html,
          target: n.target,
          failureSummary: n.failureSummary
        }))
      }));

      console.log(`Found ${report[url].length} color-contrast violations on ${url}`);
    } catch (err) {
      console.error('Error checking', url, err.message);
      report[url] = { error: err.message };
    }
  }

  await browser.close();
  const outPath = 'contrast-audit-report.json';
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log('Report saved to', outPath);
})();
