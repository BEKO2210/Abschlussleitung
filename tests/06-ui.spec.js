import { test, expect } from '@playwright/test';
import { gotoApp, getState } from './_helpers.js';

test.describe('UI Chrome', () => {
  test('overflow menu opens, closes on click outside, closes on Escape', async ({ page }) => {
    await gotoApp(page);
    const menu = page.locator('#more-menu');
    const btn = page.locator('#btn-more');

    await expect(menu).toBeHidden();
    await btn.click();
    await expect(menu).toBeVisible();

    // click on brand (outside menu) closes menu
    await page.locator('.brand').click();
    await expect(menu).toBeHidden();

    await btn.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  test('theme modal: live preview, cancel reverts', async ({ page }) => {
    await gotoApp(page);
    const initial = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(initial).toBe('default');

    await page.locator('#btn-theme').click();
    await expect(page.locator('#theme-modal')).toBeVisible();

    // Click rose card
    await page.locator('.theme-card[data-theme="rose"]').click();
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('rose');

    // Cancel via X button (form submits with value=cancel)
    await page.locator('#theme-modal button[value="cancel"]').first().click();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('default');

    // State unchanged
    const state = await getState(page);
    expect(state.theme).toBe('default');
  });

  test('theme modal: apply persists', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#btn-theme').click();
    await page.locator('.theme-card[data-theme="forest"]').click();
    await page.locator('#theme-apply').click();
    await page.waitForTimeout(400);

    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('forest');
    const state = await getState(page);
    expect(state.theme).toBe('forest');
  });

  test('help modal opens and closes', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#btn-more').click();
    await page.locator('#btn-help').click();
    await expect(page.locator('#help-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(page.locator('#help-modal')).toBeHidden();
  });

  test('Ctrl+S triggers export', async ({ page }) => {
    await gotoApp(page);
    const downloadPromise = page.waitForEvent('download');
    await page.keyboard.press('Control+s');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^abschiedszeitung-\d{4}-\d{2}-\d{2}\.json$/);
  });

  test('sidebar nav links jump to anchors', async ({ page }) => {
    await gotoApp(page);
    await page.locator('.sidebar nav a[href="#page-5"]').click();
    await page.waitForTimeout(300);
    // page-5 should be near top of viewport
    const inView = await page.locator('#page-5').evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    expect(inView).toBe(true);
  });

  test('preview view hides editing chrome', async ({ page }) => {
    await gotoApp(page);
    await page.locator('[data-view="preview"]').click();

    const removeBtnVisible = await page.locator('#page-4 .remove-item').first().evaluate(el => getComputedStyle(el).display);
    expect(removeBtnVisible).toBe('none');

    const photoPanVisible = await page.locator('#page-1 .photo-pan').first().evaluate(el => getComputedStyle(el).display);
    expect(photoPanVisible).toBe('none');
  });

  test('mobile viewport: sidebar hides off-canvas', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await gotoApp(page);
    // Sidebar should be off-screen by default
    const transform = await page.locator('#sidebar').evaluate(el => getComputedStyle(el).transform);
    // translateX(-100%) should produce a negative tx
    expect(transform).not.toBe('none');

    // Toggle opens
    await page.locator('#btn-sidebar').click();
    await expect(page.locator('#sidebar')).toHaveClass(/open/);
    await expect(page.locator('#sidebar-backdrop')).toBeVisible();

    // Backdrop click closes
    await page.locator('#sidebar-backdrop').click();
    await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  });
});
