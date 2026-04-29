import { test, expect } from '@playwright/test';
import { gotoApp, getState, consoleErrors } from './_helpers.js';

test.describe('Smoke', () => {
  test('loads, no console errors, default state seeded', async ({ page }) => {
    const errors = await consoleErrors(page);
    await gotoApp(page);

    // App chrome present
    await expect(page.locator('.toolbar .brand')).toHaveText('Abschiedszeitung');
    await expect(page.locator('.sidebar h2')).toBeVisible();

    // State persisted
    const state = await getState(page);
    expect(state).not.toBeNull();
    expect(state.theme).toBe('default');
    expect(Array.isArray(state.students)).toBe(true);
    expect(state.students.length).toBeGreaterThan(0);
    expect(Array.isArray(state.memories)).toBe(true);
    expect(Array.isArray(state.showers)).toBe(true);

    // All 8 pages rendered
    for (let i = 1; i <= 8; i++) {
      await expect(page.locator(`#page-${i}`)).toBeVisible();
    }

    // Sidebar counters
    await expect(page.locator('#count-students')).toHaveText(String(state.students.length));
    await expect(page.locator('#count-memories')).toHaveText(String(state.memories.length));
    await expect(page.locator('#count-showers')).toHaveText(String(state.showers.length));

    expect(errors).toEqual([]);
  });

  test('switches between edit, preview, print-layout views', async ({ page }) => {
    await gotoApp(page);
    const ws = page.locator('#workspace');

    await expect(ws).toHaveAttribute('data-view', 'edit');

    await page.locator('.view-toggle[data-view="preview"]').click();
    await expect(ws).toHaveAttribute('data-view', 'preview');

    await page.locator('.view-toggle[data-view="print-layout"]').click();
    await expect(ws).toHaveAttribute('data-view', 'print-layout');
    // Sheets present
    await expect(page.locator('.sheet')).toHaveCount(4);

    await page.locator('.view-toggle[data-view="edit"]').click();
    await expect(ws).toHaveAttribute('data-view', 'edit');
  });

  test('sidebar collapse toggles workspace', async ({ page }) => {
    await gotoApp(page);
    const body = page.locator('body');
    await expect(body).not.toHaveClass(/sidebar-collapsed/);
    await page.locator('#btn-sidebar').click();
    await expect(body).toHaveClass(/sidebar-collapsed/);
    await page.locator('#btn-sidebar').click();
    await expect(body).not.toHaveClass(/sidebar-collapsed/);
  });
});
