/* Generates assets/eltern-einwilligung.pdf from the HTML template.
 * Run via: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/build-consent-pdf.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'assets', 'eltern-einwilligung.html');
const pdfPath  = path.join(root, 'assets', 'eltern-einwilligung.pdf');

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto('file://' + htmlPath);
await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();
console.log('Wrote', pdfPath);
