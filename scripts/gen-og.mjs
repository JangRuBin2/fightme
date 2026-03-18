import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'og-image.html');
const outputPath = path.join(__dirname, '..', 'public', 'og-share.png');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 600 });
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

// Canvas에서 직접 PNG 추출
const base64 = await page.evaluate(() => {
  const canvas = document.getElementById('c');
  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(base64, 'base64'));
console.log(`OG image saved: ${outputPath}`);

await browser.close();
