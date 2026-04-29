import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const APP_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

export async function gotoApp(page, { fresh = true } = {}) {
  await page.goto(APP_URL);
  if (fresh) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  }
  await page.waitForSelector('.workspace');
  // Default-State wird debounced (250ms) gesichert — auf Persistenz warten,
  // sonst schlagen Tests in der Wettlauf-Phase fehl.
  await page.waitForFunction(
    () => localStorage.getItem('abschiedszeitung:v1') !== null,
    { timeout: 2000 }
  );
}

export async function getState(page) {
  return await page.evaluate(() => {
    const raw = localStorage.getItem('abschiedszeitung:v1');
    return raw ? JSON.parse(raw) : null;
  });
}

export async function setState(page, state) {
  await page.evaluate((s) => {
    localStorage.setItem('abschiedszeitung:v1', JSON.stringify(s));
  }, state);
  await page.reload();
  await page.waitForSelector('.workspace');
}

/** A 1×1 transparent PNG as base64 — for upload tests without real files. */
export const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export async function uploadFileTo(page, photoSelector, base64 = TINY_PNG_BASE64, name = 'test.png', mime = 'image/png') {
  const buffer = Buffer.from(base64, 'base64');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator(photoSelector).click();
  const chooser = await fileChooserPromise;
  await chooser.setFiles({ name, mimeType: mime, buffer });
  // wait until image rendered
  await page.locator(`${photoSelector}.has-image img`).waitFor({ timeout: 5000 });
}

export async function consoleErrors(page) {
  const errors = [];
  const ignore = [
    'ERR_CERT', 'ERR_INTERNET', 'ERR_NAME', 'ERR_NETWORK', 'fonts.googleapis', 'fonts.gstatic'
  ];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (ignore.some(p => t.includes(p))) return;
    errors.push(t);
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}
