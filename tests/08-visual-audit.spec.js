import { test, expect } from '@playwright/test';
import { gotoApp, getState, setState, TINY_PNG_BASE64 } from './_helpers.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.resolve(__dirname, '..', 'test-results', 'visual-audit');

const VIEWPORTS = {
  mobile: [
    { name: '360x800', width: 360, height: 800 },
    { name: '390x844', width: 390, height: 844 },
    { name: '430x932', width: 430, height: 932 },
  ],
  tablet: [
    { name: '768x1024', width: 768, height: 1024 },
    { name: '1024x768', width: 1024, height: 768 },
  ],
  desktop: [
    { name: '1280x720',  width: 1280, height: 720 },
    { name: '1440x900',  width: 1440, height: 900 },
    { name: '1920x1080', width: 1920, height: 1080 },
  ],
};

function shotPath(category, file) {
  return path.join(SHOT_DIR, category, file);
}

/** Detects horizontal overflow on the document at the current viewport. */
async function getHorizontalOverflow(page) {
  return await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      docScrollWidth: doc.scrollWidth,
      docClientWidth: doc.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizScroll: doc.scrollWidth > doc.clientWidth + 1,
      // Print-Layout ist absichtlich 420mm breit; im Edit/Preview-Modus
      // liegt der Workspace innerhalb der Viewport-Breite, im print-layout
      // darf horizontaler Overflow auftreten — wird separat geprüft.
    };
  });
}

/** Returns a summary of duplicate element IDs in the live DOM. */
async function getDuplicateIds(page) {
  return await page.evaluate(() => {
    const seen = new Map();
    const dups = new Set();
    document.querySelectorAll('[id]').forEach(el => {
      if (seen.has(el.id)) dups.add(el.id);
      else seen.set(el.id, true);
    });
    return Array.from(dups);
  });
}

/** Returns elements that overflow their parent on the X axis (clipped content). */
async function findClippedText(page, selector) {
  return await page.evaluate((sel) => {
    const out = [];
    document.querySelectorAll(sel).forEach(el => {
      if (el.scrollWidth > el.clientWidth + 1) {
        out.push({
          tag: el.tagName,
          cls: el.className,
          text: (el.textContent || '').slice(0, 60),
          scrollW: el.scrollWidth,
          clientW: el.clientWidth,
        });
      }
    });
    return out;
  }, selector);
}

test.describe('Visual audit — viewports', () => {
  for (const [category, viewports] of Object.entries(VIEWPORTS)) {
    for (const vp of viewports) {
      test(`${category} ${vp.name} — editor view`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await gotoApp(page);

        await page.screenshot({ path: shotPath(category, `${vp.name}-editor.png`), fullPage: true });

        // Toolbar primary actions visible
        await expect(page.locator('#btn-print')).toBeVisible();
        await expect(page.locator('.brand')).toBeVisible();

        // Sidebar (260px) + Page (210mm ≈ 794px) + Padding (~80px) = ~1134px.
        // Erst ab >1140px Viewport passt das Editor-Layout vollständig in
        // die Breite. Bei kleineren Viewports (Tablet & Mobile) ist
        // horizontales Scrollen bewusst zugelassen, aber die erste Seite
        // muss am linken Rand verankert sein, damit Headlines nicht
        // abgeschnitten werden.
        if (vp.width >= 1280) {
          const overflow = await getHorizontalOverflow(page);
          expect(overflow.hasHorizScroll, `Horizontal overflow on ${vp.name}: ${JSON.stringify(overflow)}`).toBe(false);
        } else {
          // Page-1 muss sichtbar links beginnen (kein negatives left)
          const pageLeft = await page.locator('#page-1').evaluate(el => el.getBoundingClientRect().left);
          expect(pageLeft, `Page-1 left offset on ${vp.name}`).toBeGreaterThanOrEqual(0);
        }

        // No duplicate IDs in live DOM (regression guard for the bugfix)
        expect(await getDuplicateIds(page)).toEqual([]);
      });

      test(`${category} ${vp.name} — view switching reachable`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await gotoApp(page);

        // Auf jedem Viewport müssen Vorschau und Druck-Bogen erreichbar sein
        // — entweder über die Toolbar-Mitte (Desktop) oder über das Kebab-
        // Menü (Mobile/Tablet).
        if (vp.width > 1100) {
          await expect(page.locator('.toolbar-center [data-view="preview"]')).toBeVisible();
          await expect(page.locator('.toolbar-center [data-view="print-layout"]')).toBeVisible();
        } else {
          await page.locator('#btn-more').click();
          await expect(page.locator('#more-menu .menu-view-item[data-view="preview"]')).toBeVisible();
          await expect(page.locator('#more-menu .menu-view-item[data-view="print-layout"]')).toBeVisible();
          // Klick auf "Vorschau" wechselt View
          await page.locator('#more-menu .menu-view-item[data-view="preview"]').click();
          await expect(page.locator('#workspace')).toHaveAttribute('data-view', 'preview');
        }
      });

      test(`${category} ${vp.name} — sidebar / mobile drawer`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await gotoApp(page);
        // On desktop: sidebar already open. On mobile: open via toggle.
        if (vp.width <= 900) {
          await page.locator('#btn-sidebar').click();
          await expect(page.locator('#sidebar')).toHaveClass(/open/);
        }
        await page.screenshot({ path: shotPath(category, `${vp.name}-sidebar.png`), fullPage: false });
      });

      test(`${category} ${vp.name} — theme modal`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await gotoApp(page);
        await page.locator('#btn-theme').click();
        await expect(page.locator('#theme-modal')).toBeVisible();
        // Modal must fit within viewport
        const r = await page.locator('#theme-modal').boundingBox();
        expect(r.width).toBeLessThanOrEqual(vp.width);
        // Allow 4px slack at the top for browser chrome
        expect(r.height).toBeLessThanOrEqual(vp.height);
        await page.screenshot({ path: shotPath(category, `${vp.name}-theme-modal.png`) });
      });

      test(`${category} ${vp.name} — preview view`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await gotoApp(page);
        // Toolbar-Mitte ist <1100px versteckt; in dem Fall über das Menü
        if (vp.width > 1100) {
          await page.locator('.view-toggle[data-view="preview"]').click();
        } else {
          await page.locator('#btn-more').click();
          await page.locator('#more-menu .menu-view-item[data-view="preview"]').click();
        }
        await page.waitForTimeout(200);
        await page.screenshot({ path: shotPath(category, `${vp.name}-preview.png`), fullPage: true });
      });
    }
  }
});

test.describe('Visual audit — content stress', () => {
  test('long names + long answers do not overflow cards', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoApp(page);
    const state = await getState(page);
    state.students = Array.from({ length: 12 }, (_, i) => ({
      id: 's-' + i,
      name: 'Maximilian-Wolfgang Mustermann-Testfeldweg ' + i,
      fach: 'Mathematik & Naturwissenschaften',
      hobby: 'Fußball, Klavier, Lesen, Schach, Schwimmen, Lego',
      essen: 'Spaghetti Bolognese mit extra Käse und Salat',
      buch: 'Der Herr der Ringe — die komplette Trilogie',
      beruf: 'Astronaut, Tierarzt oder Forscher in der Antarktis',
      motto: 'Niemals aufgeben — auch wenn der Tag schwer war.',
      memory: '', photo: null
    }));
    await setState(page, state);

    await page.screenshot({ path: shotPath('issues', 'long-content-edit.png'), fullPage: true });
    await page.locator('.view-toggle[data-view="preview"]').click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shotPath('issues', 'long-content-preview.png'), fullPage: true });

    // No card content overflows its parent
    const overflowing = await findClippedText(page, '#page-4 .student-card *, #page-5 .student-card *');
    // Ellipsis is OK — that's intentional clipping. We just want no element WIDER than its parent.
    // We allow .qa-a (where ellipsis applies) but check .student-card itself.
    const cardOverflow = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('#page-4 .student-card, #page-5 .student-card').forEach(el => {
        if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
          out.push({ scrollW: el.scrollWidth, clientW: el.clientWidth, scrollH: el.scrollHeight, clientH: el.clientHeight });
        }
      });
      return out;
    });
    expect(cardOverflow).toEqual([]);
  });

  test('30 students XXS tier — no broken layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoApp(page);
    const state = await getState(page);
    state.students = Array.from({ length: 30 }, (_, i) => ({
      id: 's-' + i, name: 'Kind ' + (i + 1),
      fach: 'Mathe', hobby: 'Sport', essen: 'Pizza', buch: 'Buch',
      beruf: 'Pilot', motto: 'Cool', memory: '', photo: null
    }));
    await setState(page, state);
    await page.screenshot({ path: shotPath('issues', 'thirty-students.png'), fullPage: true });

    // Both pages must contain 15 cards each
    expect(await page.locator('#page-4 .student-card').count()).toBe(15);
    expect(await page.locator('#page-5 .student-card').count()).toBe(15);
  });

  test('empty everything still renders gracefully', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoApp(page);
    const state = await getState(page);
    state.students = [];
    state.memories = [];
    state.showers = [];
    await setState(page, state);
    await page.screenshot({ path: shotPath('issues', 'empty-all.png'), fullPage: true });

    // Empty states present
    await expect(page.locator('#page-4 .empty-state')).toBeVisible();
    await expect(page.locator('#page-3 .empty-state')).toBeVisible();
    await expect(page.locator('#page-7 .empty-state')).toBeVisible();
  });
});

test.describe('Visual audit — print layout', () => {
  test('print-layout view at 1920×1080 — 4 sheets visible', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await gotoApp(page);
    await page.locator('.view-toggle[data-view="print-layout"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: shotPath('print', '1920-print-layout.png'), fullPage: true });

    expect(await page.locator('.sheet').count()).toBe(4);

    // No duplicate IDs even in print-layout view
    expect(await getDuplicateIds(page)).toEqual([]);

    // Each sheet has two slots
    for (let i = 0; i < 4; i++) {
      const slots = await page.locator('.sheet').nth(i).locator('.sheet-slot').count();
      expect(slots).toBe(2);
    }
  });

  test('print emulation media — fully styled', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await gotoApp(page);

    // Inject some realistic content (photos, students with photos) for the
    // print snapshot — represents what a customer might actually print.
    const state = await getState(page);
    state.photos.hero = 'data:image/png;base64,' + TINY_PNG_BASE64;
    state.photos.intro = 'data:image/png;base64,' + TINY_PNG_BASE64;
    state.photoOffsets = { hero: { x: 50, y: 30 }, intro: { x: 50, y: 50 } };
    state.students = Array.from({ length: 12 }, (_, i) => ({
      id: 's-' + i, name: 'Mitschüler:in ' + (i + 1),
      fach: 'Mathe', hobby: 'Lesen', essen: 'Pizza',
      buch: 'Hobbit', beruf: 'Forscher:in', motto: 'Carpe diem',
      memory: '', photo: 'data:image/png;base64,' + TINY_PNG_BASE64
    }));
    await setState(page, state);

    // Switch to print-layout view first, then emulate print media
    await page.locator('.view-toggle[data-view="print-layout"]').click();
    await page.waitForTimeout(200);
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(200);
    await page.screenshot({ path: shotPath('print', 'print-media-realistic.png'), fullPage: true });

    // After @media print: the print-info hint should be hidden
    const infoDisplay = await page.locator('.print-info').evaluate(el => getComputedStyle(el).display);
    expect(infoDisplay).toBe('none');

    // Toolbar/sidebar must be display:none under @media print
    expect(await page.locator('.toolbar').evaluate(el => getComputedStyle(el).display)).toBe('none');
    expect(await page.locator('.sidebar').evaluate(el => getComputedStyle(el).display)).toBe('none');

    await page.emulateMedia({ media: null });
  });

  test('PDF generation: A3 landscape, 4 pages', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'PDF only in Chromium');

    await page.setViewportSize({ width: 1920, height: 1080 });
    await gotoApp(page);
    const pdfPath = shotPath('print', 'export.pdf');
    // Print-layout view to ensure mirror is fresh
    await page.locator('.view-toggle[data-view="print-layout"]').click();
    await page.waitForTimeout(300);

    await page.pdf({
      path: pdfPath,
      format: 'A3',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    // PDF exists and is non-empty
    const fs = await import('node:fs');
    const stat = fs.statSync(pdfPath);
    expect(stat.size).toBeGreaterThan(10_000);
  });
});

test.describe('Visual audit — touch / accessibility basics', () => {
  test('touch target sizes ≥ 36×36 for primary controls (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page);

    const targets = [
      '#btn-sidebar',
      '#btn-theme',
      '#btn-more',
      '#btn-print',
    ];
    for (const sel of targets) {
      const box = await page.locator(sel).boundingBox();
      expect(box, `bounding box for ${sel}`).not.toBeNull();
      expect(box.width, `width ${sel}`).toBeGreaterThanOrEqual(36);
      expect(box.height, `height ${sel}`).toBeGreaterThanOrEqual(36);
    }
  });

  test('all icon-only buttons have aria-label or title', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoApp(page);
    const offenders = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('button').forEach(btn => {
        const visible = btn.offsetParent !== null;
        if (!visible) return;
        const txt = (btn.textContent || '').trim();
        const hasLabel = btn.getAttribute('aria-label') || btn.getAttribute('title');
        // Buttons with non-trivial visible text are fine
        if (txt.length >= 2) return;
        if (!hasLabel) {
          out.push({ id: btn.id, cls: btn.className, html: btn.outerHTML.slice(0, 100) });
        }
      });
      return out;
    });
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });

  test('focus ring is visible on Tab', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoApp(page);
    // Tab through and check that focused element has a visible outline or
    // box-shadow. We sample 10 tabs.
    let hadFocus = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const ok = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return false;
        const cs = getComputedStyle(el);
        const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
        const hasShadow = cs.boxShadow && cs.boxShadow !== 'none';
        return hasOutline || hasShadow;
      });
      if (ok) { hadFocus = true; break; }
    }
    expect(hadFocus).toBe(true);
  });
});
