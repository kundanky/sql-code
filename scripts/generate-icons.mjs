import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function generate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const iconSvgPath = path.resolve('public/icon.svg');
  const maskableSvgPath = path.resolve('public/icon-maskable.svg');

  const icons = [
    { file: 'public/pwa-192x192.png', width: 192, height: 192, svg: iconSvgPath },
    { file: 'public/pwa-512x512.png', width: 512, height: 512, svg: iconSvgPath },
    { file: 'public/apple-touch-icon.png', width: 180, height: 180, svg: iconSvgPath },
    { file: 'public/pwa-maskable-512x512.png', width: 512, height: 512, svg: maskableSvgPath },
  ];

  for (const item of icons) {
    await page.setViewportSize({ width: item.width, height: item.height });
    const content = fs.readFileSync(item.svg, 'utf-8');
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${content}</body></html>`);
    const svgEl = await page.$('svg');
    if (svgEl) {
      await svgEl.screenshot({ path: item.file, omitBackground: false });
      console.log(`Generated ${item.file} (${item.width}x${item.height})`);
    }
  }

  await browser.close();
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
