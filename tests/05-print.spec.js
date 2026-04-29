import { test, expect } from '@playwright/test';
import { gotoApp, getState, setState, TINY_PNG_BASE64 } from './_helpers.js';

test.describe('Print layout & imposition', () => {
  test('4 sheets in correct saddle-stitched order', async ({ page }) => {
    await gotoApp(page);
    const mappings = await page.locator('.sheet-slot').evaluateAll(slots =>
      slots.map(s => s.dataset.mirrors)
    );
    expect(mappings).toEqual([
      'page-8', 'page-1', // Bogen 1 Vorderseite
      'page-2', 'page-7', // Bogen 1 Rückseite
      'page-6', 'page-3', // Bogen 2 Vorderseite
      'page-4', 'page-5', // Bogen 2 Rückseite (Heftmitte)
    ]);
  });

  test('mirror updates after edits', async ({ page }) => {
    await gotoApp(page);
    const el = page.locator('#page-1 [data-field="titleLine1"]');
    await el.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Mirror-Test');
    await page.waitForTimeout(400);

    // Switch to print-layout view
    await page.locator('[data-view="print-layout"]').click();
    await page.waitForTimeout(200);

    const mirrored = await page.locator('.sheet-slot[data-mirrors="page-1"] [data-field="titleLine1"]').textContent();
    expect(mirrored).toBe('Mirror-Test');
  });

  test('mirror clone strips contenteditable, file inputs, and buttons', async ({ page }) => {
    await gotoApp(page);
    await page.locator('[data-view="print-layout"]').click();
    await page.waitForTimeout(200);

    const counts = await page.evaluate(() => {
      const root = document.querySelector('.print-layout');
      return {
        editable: root.querySelectorAll('[contenteditable="true"]').length,
        fileInputs: root.querySelectorAll('input[type="file"]').length,
        buttons: root.querySelectorAll('button').length,
      };
    });
    expect(counts.editable).toBe(0);
    expect(counts.fileInputs).toBe(0);
    expect(counts.buttons).toBe(0);
  });

  test('mirror preserves objectPosition for photos', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.photos.hero = 'data:image/png;base64,' + TINY_PNG_BASE64;
    state.photoOffsets = { hero: { x: 30, y: 70 } };
    await setState(page, state);

    // Trigger mirror
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));

    const objPos = await page.locator('.sheet-slot[data-mirrors="page-1"] .photo[data-photo="hero"] img').evaluate(img => img.style.objectPosition);
    expect(objPos).toBe('30% 70%');
  });

  test('A3 sheet dimensions in print-layout', async ({ page }) => {
    await gotoApp(page);
    await page.locator('[data-view="print-layout"]').click();
    await page.waitForTimeout(200);

    const dims = await page.locator('.sheet').first().evaluate(el => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    // 420mm × 297mm at 96dpi: 420mm ≈ 1587px, 297mm ≈ 1123px
    expect(dims.w).toBeGreaterThanOrEqual(1580);
    expect(dims.w).toBeLessThanOrEqual(1600);
    expect(dims.h).toBeGreaterThanOrEqual(1115);
    expect(dims.h).toBeLessThanOrEqual(1130);
  });

  test('beforeprint event refreshes mirror', async ({ page }) => {
    await gotoApp(page);
    // Edit, then dispatch beforeprint without switching view
    const el = page.locator('#page-2 [data-field="introTitle"]');
    await el.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Hallo Print');
    await page.waitForTimeout(400);

    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));

    const mirrored = await page.locator('.sheet-slot[data-mirrors="page-2"] [data-field="introTitle"]').textContent();
    expect(mirrored).toBe('Hallo Print');
  });

  test('mirror does NOT contain duplicate IDs (BUG check)', async ({ page }) => {
    await gotoApp(page);
    const dupIds = await page.evaluate(() => {
      const seen = new Map();
      const dups = [];
      document.querySelectorAll('[id]').forEach(el => {
        const id = el.id;
        if (seen.has(id)) dups.push(id);
        else seen.set(id, true);
      });
      return dups;
    });
    expect(dupIds).toEqual([]); // Will currently FAIL — known bug
  });
});
