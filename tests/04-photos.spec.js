import { test, expect } from '@playwright/test';
import { gotoApp, getState, setState, TINY_PNG_BASE64 } from './_helpers.js';

async function uploadHero(page) {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('#page-1 .photo[data-photo="hero"]').click();
  const chooser = await fileChooserPromise;
  await chooser.setFiles({
    name: 'hero.png',
    mimeType: 'image/png',
    buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
  });
  await page.locator('#page-1 .photo[data-photo="hero"].has-image img').waitFor({ timeout: 5000 });
}

test.describe('Photo workflow', () => {
  test('upload hero photo via click → state holds dataURL', async ({ page }) => {
    await gotoApp(page);
    await uploadHero(page);
    await page.waitForTimeout(400);
    const state = await getState(page);
    expect(state.photos.hero).toMatch(/^data:image\/jpeg;base64,/);
  });

  test('remove hero photo restores placeholder', async ({ page }) => {
    await gotoApp(page);
    await uploadHero(page);
    await page.waitForTimeout(400);

    const photo = page.locator('#page-1 .photo[data-photo="hero"]');
    await photo.hover();
    await photo.locator('.photo-remove').click();
    await page.waitForTimeout(300);

    const state = await getState(page);
    expect(state.photos.hero).toBeNull();
    await expect(photo).not.toHaveClass(/has-image/);
  });

  test('non-image upload shows toast', async ({ page }) => {
    await gotoApp(page);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#page-1 .photo[data-photo="hero"]').click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles({
      name: 'evil.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });
    await expect(page.locator('#toast')).toBeVisible();
    const state = await getState(page);
    expect(state.photos.hero).toBeNull();
  });

  test('pan-button saves photoOffset', async ({ page }) => {
    await gotoApp(page);
    await uploadHero(page);
    await page.waitForTimeout(400);

    const panBtn = page.locator('#page-1 .photo[data-photo="hero"] .photo-pan');
    const photo = page.locator('#page-1 .photo[data-photo="hero"]');
    const box = await photo.boundingBox();

    // Drag inside the photo
    await panBtn.hover();
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const state = await getState(page);
    expect(state.photoOffsets).toBeTruthy();
    expect(state.photoOffsets.hero).toBeDefined();
    expect(typeof state.photoOffsets.hero.x).toBe('number');
    expect(typeof state.photoOffsets.hero.y).toBe('number');
  });

  test('uploading new photo clears existing offset', async ({ page }) => {
    await gotoApp(page);
    await uploadHero(page);
    await page.waitForTimeout(400);
    // Set an offset manually
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('abschiedszeitung:v1'));
      raw.photoOffsets = { hero: { x: 10, y: 80 } };
      localStorage.setItem('abschiedszeitung:v1', JSON.stringify(raw));
    });
    await page.reload();
    await page.waitForSelector('.workspace');
    await page.waitForTimeout(200);

    // Upload a different image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#page-1 .photo[data-photo="hero"]').click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles({
      name: 'new.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
    });
    await page.waitForTimeout(500);

    const state = await getState(page);
    expect(state.photoOffsets.hero).toBeUndefined();
  });

  test('remove student also removes their photoOffset', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.students = [{
      id: 's-1', name: 'A', fach: '', hobby: '', essen: '', buch: '',
      beruf: '', motto: '', memory: '', photo: 'data:image/png;base64,' + TINY_PNG_BASE64
    }];
    state.photoOffsets = { 'student:s-1': { x: 30, y: 70 } };
    await setState(page, state);

    page.once('dialog', d => d.accept());
    await page.locator('#page-4 .student-card').first().hover();
    await page.locator('#page-4 .student-card .remove-item').first().click();
    await page.waitForTimeout(300);

    const after = await getState(page);
    expect(after.students.length).toBe(0);
    expect(after.photoOffsets['student:s-1']).toBeUndefined();
  });

  test('photo offset is reflected in img.style.objectPosition', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.photos.hero = 'data:image/png;base64,' + TINY_PNG_BASE64;
    state.photoOffsets = { hero: { x: 25, y: 75 } };
    await setState(page, state);

    const objPos = await page.locator('#page-1 .photo[data-photo="hero"] img').evaluate(img => img.style.objectPosition);
    expect(objPos).toBe('25% 75%');
  });

  // Regression: ehemals saßen card-remove (×) und photo-remove (×) auf
  // memory-cards pixelgenau aufeinander, weil das Foto die volle
  // Kartenbreite füllt und beide Buttons top:4/right:4 hatten. Klick auf
  // ✕ war ambig — die Karte verschwand statt nur das Foto.
  test('memory-card: card-remove and photo-remove do not overlap', async ({ page }) => {
    await gotoApp(page);
    const state = await getState(page);
    state.memories = [{
      id: 'mem-overlap', title: 'Test', meta: 'Ort · Jahr', text: 'Text',
      photo: 'data:image/png;base64,' + TINY_PNG_BASE64
    }];
    await setState(page, state);

    const card = page.locator('#page-3 .memory-card').first();
    await card.hover();

    const rects = await card.evaluate(el => {
      const cardRm  = el.querySelector(':scope > .remove-item').getBoundingClientRect();
      const photoRm = el.querySelector('.photo-remove').getBoundingClientRect();
      const overlapsHoriz = cardRm.left < photoRm.right && cardRm.right > photoRm.left;
      const overlapsVert  = cardRm.top  < photoRm.bottom && cardRm.bottom > photoRm.top;
      return { overlap: overlapsHoriz && overlapsVert, cardRm, photoRm };
    });
    expect(rects.overlap, JSON.stringify(rects, null, 2)).toBe(false);
  });
});
