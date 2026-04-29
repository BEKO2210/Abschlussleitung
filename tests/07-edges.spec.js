import { test, expect } from '@playwright/test';
import { gotoApp, getState, setState } from './_helpers.js';

test.describe('Edge cases', () => {
  test('drop file on body (outside photo) does not navigate', async ({ page }) => {
    await gotoApp(page);
    const before = page.url();
    // Synthesize a drop event with a file outside any .photo
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['x'], 'a.png', { type: 'image/png' }));
      const ev = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
      document.body.dispatchEvent(ev);
    });
    await page.waitForTimeout(300);
    expect(page.url()).toBe(before);
  });

  test('importing invalid JSON shows alert', async ({ page }) => {
    await gotoApp(page);
    let alertShown = false;
    page.on('dialog', d => { alertShown = true; d.accept(); });
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#btn-more').click();
    await page.locator('#btn-import').click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('not json') });
    await page.waitForTimeout(300);
    expect(alertShown).toBe(true);
  });

  test('importing JSON without students array fails gracefully', async ({ page }) => {
    await gotoApp(page);
    let alertText = null;
    page.on('dialog', d => { alertText = d.message(); d.accept(); });
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#btn-more').click();
    await page.locator('#btn-import').click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles({
      name: 'partial.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ theme: 'rose' }))
    });
    await page.waitForTimeout(300);
    expect(alertText).toMatch(/Mitschüler/);
  });

  test('very long single answer truncates with ellipsis', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.students = [{
      id: 's-1', name: 'Anna',
      fach: 'A'.repeat(120), hobby: 'B'.repeat(120),
      essen: '', buch: '', beruf: '', motto: '',
      memory: '', photo: null
    }];
    await setState(page, state);
    // In preview mode the cards use ellipsis (edit-mode overrides to clip
    // so the user sees they ran out of room).
    await page.locator('[data-view="preview"]').click();
    const overflow = await page.locator('#page-4 .qa-fach .qa-a').first().evaluate(el => ({
      whiteSpace: getComputedStyle(el).whiteSpace,
      ellipsis: getComputedStyle(el).textOverflow,
    }));
    expect(overflow.whiteSpace).toBe('nowrap');
    expect(overflow.ellipsis).toBe('ellipsis');
  });

  test('emptying a contenteditable resets innerHTML to empty', async ({ page }) => {
    await gotoApp(page);
    const el = page.locator('#page-1 [data-field="kicker"]');
    await el.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);
    const html = await el.evaluate(e => e.innerHTML);
    expect(html).toBe('');
  });

  test('add student then immediately reload — no lost data', async ({ page }) => {
    await gotoApp(page);
    const before = await getState(page);
    await page.locator('#add-student').click();
    // Wait for save to debounce
    await page.waitForTimeout(400);
    await page.reload();
    await page.waitForSelector('.workspace');
    const after = await getState(page);
    expect(after.students.length).toBe(before.students.length + 1);
  });

  test('no console errors during heavy interaction', async ({ page }) => {
    const errors = [];
    const ignore = ['ERR_CERT', 'ERR_INTERNET', 'ERR_NAME', 'ERR_NETWORK', 'fonts.googleapis', 'fonts.gstatic'];
    page.on('console', m => {
      if (m.type() !== 'error') return;
      const t = m.text();
      if (ignore.some(p => t.includes(p))) return;
      errors.push(t);
    });
    page.on('pageerror', e => errors.push(String(e)));

    await gotoApp(page);
    // add 5 students
    for (let i = 0; i < 5; i++) {
      await page.locator('#add-student').click();
      await page.waitForTimeout(150);
    }
    // add 3 memories
    for (let i = 0; i < 3; i++) {
      await page.locator('#add-memory-1').click();
      await page.waitForTimeout(150);
    }
    // add 2 showers
    await page.locator('#add-shower').click();
    await page.waitForTimeout(150);
    await page.locator('#add-shower').click();
    await page.waitForTimeout(150);

    // toggle theme
    await page.locator('#btn-theme').click();
    await page.locator('.theme-card[data-theme="ocean"]').click();
    await page.locator('#theme-apply').click();
    await page.waitForTimeout(300);

    // switch views
    await page.locator('[data-view="preview"]').click();
    await page.waitForTimeout(150);
    await page.locator('[data-view="print-layout"]').click();
    await page.waitForTimeout(200);
    await page.locator('[data-view="edit"]').click();

    expect(errors).toEqual([]);
  });

  test('print layout view shows print-info hint', async ({ page }) => {
    await gotoApp(page);
    await page.locator('[data-view="print-layout"]').click();
    const info = page.locator('.print-info');
    await expect(info).toBeVisible();
    await expect(info).toContainText('A3 Querformat');
  });

  test('reset preserves nothing in localStorage immediately, then re-seeds', async ({ page }) => {
    await gotoApp(page);
    page.once('dialog', d => d.accept());
    await page.locator('#btn-more').click();
    await page.locator('#btn-reset').click();
    await page.waitForTimeout(400);
    const state = await getState(page);
    expect(state).not.toBeNull();
    expect(state.students.length).toBeGreaterThan(0);
  });
});
