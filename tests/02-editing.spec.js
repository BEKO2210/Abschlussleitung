import { test, expect } from '@playwright/test';
import { gotoApp, getState, setState } from './_helpers.js';

test.describe('Editing & Persistence', () => {
  test('cover title field persists to state', async ({ page }) => {
    await gotoApp(page);
    const el = page.locator('[data-field="titleLine1"]').first();
    await el.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Hello World');
    // Debounce 250ms
    await page.waitForTimeout(400);
    const state = await getState(page);
    expect(state.fields.titleLine1).toBe('Hello World');
  });

  test('multi-line text in introText (Enter key) preserves newlines', async ({ page }) => {
    await gotoApp(page);
    const el = page.locator('[data-field="introText"]').first();
    await el.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Line 1');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Line 2');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Line 3');
    await page.waitForTimeout(400);

    const state = await getState(page);
    // Bug check: contenteditable inserts <div>/<br>; textContent should map to newlines.
    expect(state.fields.introText).toContain('Line 1');
    expect(state.fields.introText).toContain('Line 2');
    expect(state.fields.introText).toContain('Line 3');
    // Expect at least one newline between paragraphs
    expect(/\n/.test(state.fields.introText)).toBe(true);
  });

  test('reload preserves edits', async ({ page }) => {
    await gotoApp(page);
    const el = page.locator('[data-field="schoolName"]').first();
    await el.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Albert-Einstein-Schule');
    await page.waitForTimeout(400);

    await page.reload();
    await page.waitForSelector('.workspace');
    await expect(page.locator('[data-field="schoolName"]').first()).toHaveText('Albert-Einstein-Schule');
  });

  test('add student focuses new card and persists', async ({ page }) => {
    await gotoApp(page);
    const before = await getState(page);
    await page.locator('#add-student').click();
    await page.waitForTimeout(500);
    const after = await getState(page);
    expect(after.students.length).toBe(before.students.length + 1);
    // Last new student should be focused
    const focused = await page.evaluate(() => document.activeElement?.dataset?.field);
    expect(focused).toBe('name');
  });

  test('remove student via × button deletes from state', async ({ page }) => {
    await gotoApp(page);
    const before = await getState(page);
    page.once('dialog', d => d.accept()); // confirm
    await page.locator('.student-card').first().hover();
    await page.locator('.student-card .remove-item').first().click();
    await page.waitForTimeout(300);
    const after = await getState(page);
    expect(after.students.length).toBe(before.students.length - 1);
  });

  test('add memory: button 1 inserts into Chronik I (left page)', async ({ page }) => {
    await gotoApp(page);
    const before = await getState(page);
    const beforeHalf = Math.ceil(before.memories.length / 2);
    await page.locator('#add-memory-1').click();
    await page.waitForTimeout(500);
    const after = await getState(page);
    expect(after.memories.length).toBe(before.memories.length + 1);
    // The new item must end up in the FIRST page after split
    const newId = after.memories.find(m => !before.memories.some(b => b.id === m.id)).id;
    const idx = after.memories.findIndex(m => m.id === newId);
    const half = Math.ceil(after.memories.length / 2);
    expect(idx).toBeLessThan(half);
  });

  test('add memory: button 2 inserts at end (Chronik II)', async ({ page }) => {
    await gotoApp(page);
    const before = await getState(page);
    await page.locator('#add-memory-2').click();
    await page.waitForTimeout(500);
    const after = await getState(page);
    const newId = after.memories.find(m => !before.memories.some(b => b.id === m.id)).id;
    expect(after.memories[after.memories.length - 1].id).toBe(newId);
  });

  test('add shower persists', async ({ page }) => {
    await gotoApp(page);
    const before = await getState(page);
    await page.locator('#add-shower').click();
    await page.waitForTimeout(400);
    const after = await getState(page);
    expect(after.showers.length).toBe(before.showers.length + 1);
  });

  test('30-student limit shows toast and does not add', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.students = Array.from({ length: 30 }, (_, i) => ({
      id: 'id-' + i, name: 'S' + i, fach: '', hobby: '', essen: '', buch: '',
      beruf: '', motto: '', memory: '', photo: null
    }));
    await setState(page, state);
    await page.locator('#add-student').click();
    await page.waitForTimeout(300);
    const after = await getState(page);
    expect(after.students.length).toBe(30);
    await expect(page.locator('#toast')).toBeVisible();
  });

  test('reset clears state and reseeds defaults', async ({ page }) => {
    await gotoApp(page);
    // Edit something
    const el = page.locator('[data-field="titleLine1"]').first();
    await el.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('XYZ');
    await page.waitForTimeout(400);

    page.once('dialog', d => d.accept());
    // Open menu
    await page.locator('#btn-more').click();
    await page.locator('#btn-reset').click();
    await page.waitForTimeout(400);
    const after = await getState(page);
    expect(after.fields.titleLine1).not.toBe('XYZ');
  });

  test('migration: legacy state with page2Title is migrated to spreadTitle', async ({ page }) => {
    await gotoApp(page);
    // Inject legacy
    await page.evaluate(() => {
      const legacy = {
        theme: 'rose',
        fields: { page2Title: 'Old', page2Kicker: 'OldKick', page2Footer: 'OldFoot' },
        photos: { hero: null },
        students: [{ id: 'a1', name: 'X' }]
      };
      localStorage.setItem('abschiedszeitung:v1', JSON.stringify(legacy));
    });
    await page.reload();
    await page.waitForSelector('.workspace');
    await page.waitForTimeout(400);

    // Migration runs in memory; localStorage is not re-saved until user edits.
    // Verify migrated values via DOM render instead.
    expect(await page.locator('[data-field="spreadTitle"]').first().textContent()).toBe('Old');
    expect(await page.locator('[data-field="spreadKicker"]').first().textContent()).toBe('OldKick');
    expect(await page.locator('[data-field="spreadFooterLeft"]').first().textContent()).toBe('OldFoot');
    // Theme applied
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('rose');
    // Trigger a save by editing — verify normalized state is then persisted
    const el = page.locator('[data-field="schoolName"]').first();
    await el.click();
    await page.keyboard.type(' ');
    await page.waitForTimeout(400);
    const state = await getState(page);
    expect(state.fields.spreadTitle).toBe('Old');
    expect(state.photos.intro).toBeNull();
    expect(state.photoOffsets).toEqual({});
  });

  test('export downloads JSON; import restores state', async ({ page }) => {
    await gotoApp(page);
    // Modify
    const el = page.locator('[data-field="schoolName"]').first();
    await el.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('Marker-School');
    await page.waitForTimeout(400);

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-more').click();
    await page.locator('#btn-export').click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();

    // Reset
    page.once('dialog', d => d.accept());
    await page.locator('#btn-more').click();
    await page.locator('#btn-reset').click();
    await page.waitForTimeout(400);

    const afterReset = await getState(page);
    expect(afterReset.fields.schoolName).not.toBe('Marker-School');

    // Re-import
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#btn-more').click();
    await page.locator('#btn-import').click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles(path);
    await page.waitForTimeout(500);

    const restored = await getState(page);
    expect(restored.fields.schoolName).toBe('Marker-School');
  });
});
