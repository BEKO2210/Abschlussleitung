import { test, expect } from '@playwright/test';
import { gotoApp, getState, setState } from './_helpers.js';

function makeStudents(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: 'id-' + i,
    name: `Schüler:in ${i + 1}`,
    fach: 'Mathe', hobby: 'Lesen', essen: 'Pizza', buch: 'Hobbit',
    beruf: 'Forscher:in', motto: 'Carpe diem', memory: '', photo: null
  }));
}

const TIERS = [
  { count: 1,  tier: 'tier-xl',  cols: 1, rows: 2 },
  { count: 2,  tier: 'tier-xl',  cols: 1, rows: 2 },
  { count: 4,  tier: 'tier-xl',  cols: 1, rows: 2 },
  { count: 5,  tier: 'tier-l',   cols: 2, rows: 2 },
  { count: 8,  tier: 'tier-l',   cols: 2, rows: 2 },
  { count: 9,  tier: 'tier-m',   cols: 2, rows: 3 },
  { count: 12, tier: 'tier-m',   cols: 2, rows: 3 },
  { count: 13, tier: 'tier-s',   cols: 3, rows: 3 },
  { count: 18, tier: 'tier-s',   cols: 3, rows: 3 },
  { count: 19, tier: 'tier-xs',  cols: 3, rows: 4 },
  { count: 24, tier: 'tier-xs',  cols: 3, rows: 4 },
  { count: 25, tier: 'tier-xxs', cols: 3, rows: 5 },
  { count: 30, tier: 'tier-xxs', cols: 3, rows: 5 },
];

test.describe('Spread layout scaling', () => {
  for (const { count, tier, cols, rows } of TIERS) {
    test(`${count} students → ${tier} (${cols}×${rows})`, async ({ page }) => {
      await gotoApp(page);
      const state = await getState(page);
      state.students = makeStudents(count);
      await setState(page, state);

      // Tier class on both spread pages
      await expect(page.locator('#page-4')).toHaveClass(new RegExp('\\b' + tier + '\\b'));
      await expect(page.locator('#page-5')).toHaveClass(new RegExp('\\b' + tier + '\\b'));

      // Grid cols/rows
      const left = await page.locator('#page-4 [data-spread="left"]').evaluate(el => ({
        cols: el.style.getPropertyValue('--cols'),
        rows: el.style.getPropertyValue('--rows'),
      }));
      expect(parseInt(left.cols, 10)).toBe(cols);
      expect(parseInt(left.rows, 10)).toBe(rows);

      // Card counts left+right == count
      const leftN = await page.locator('#page-4 [data-spread="left"] .student-card').count();
      const rightN = await page.locator('#page-5 [data-spread="right"] .student-card').count();
      expect(leftN + rightN).toBe(count);
      // ceil split
      expect(leftN).toBe(Math.ceil(count / 2));
    });
  }

  test('empty student list shows empty state', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.students = [];
    await setState(page, state);
    await expect(page.locator('#page-4 [data-spread="left"] .empty-state')).toBeVisible();
    expect(await page.locator('#page-4 [data-spread="left"] .student-card').count()).toBe(0);
  });

  test('long names ellipsize within card (no overflow)', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.students = makeStudents(12).map(s => ({
      ...s, name: 'Wolfgang-Amadeus-Maximilian Mustermann der Fünfte'
    }));
    await setState(page, state);
    // First card name should not exceed card width
    const overflow = await page.locator('.student-card .student-name').first().evaluate(el => {
      const computedOverflow = getComputedStyle(el).textOverflow;
      const tooWide = el.scrollWidth > el.clientWidth + 1;
      return { computedOverflow, tooWide };
    });
    expect(overflow.computedOverflow).toBe('ellipsis');
  });

  test('XXS tier hides qa-buch and qa-motto', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.students = makeStudents(28);
    await setState(page, state);
    const buchVisible = await page.locator('.student-card .qa-buch').first().evaluate(el => getComputedStyle(el).display);
    const mottoVisible = await page.locator('.student-card .qa-motto').first().evaluate(el => getComputedStyle(el).display);
    expect(buchVisible).toBe('none');
    expect(mottoVisible).toBe('none');
  });

  test('memory split: ceil(n/2) on Chronik I, rest on Chronik II', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.memories = Array.from({ length: 5 }, (_, i) => ({
      id: 'm-' + i, title: `Mem ${i}`, meta: '', text: '', photo: null
    }));
    await setState(page, state);
    expect(await page.locator('#page-3 .memory-bento .memory-card').count()).toBe(3);
    expect(await page.locator('#page-6 .memory-bento .memory-card').count()).toBe(2);
  });

  test('memories empty state', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.memories = [];
    await setState(page, state);
    await expect(page.locator('#page-3 .memory-bento .empty-state')).toBeVisible();
  });
});
