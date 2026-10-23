const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const dir = '/home/z/my-project/download/slides';
  const out = '/home/z/my-project/download/check';
  const slides = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  for (const s of slides) {
    const file = path.join(dir, `slide_${s}.html`);
    await page.goto('file://' + file, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(out, `deck_${s}.png`) });
    console.log('shot', s);
  }
  await browser.close();
})();
