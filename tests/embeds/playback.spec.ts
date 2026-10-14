import { test, expect, tools, openPackage, seek, state, command, offscreen } from './package-fixture';

for (const id of tools) test(`${id}: package-element modes, host clock and browser policy transitions`, async ({ page, packages }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const still = id === 'truchet-tiles';
  await openPackage(page, packages.origins[0], id, { playback: 'loop' });
  const initial = await seek(page, 0.2);
  const later = await seek(page, 0.37);
  expect(await seek(page, 0.37)).toEqual(later);
  if (still) { expect(later.svg).toBe(initial.svg); expect(later.durationSeconds).toBe(0); }
  else { expect(later.svg).not.toBe(initial.svg); expect(later.durationSeconds).toBeGreaterThan(0); }
  await command(page, 'restart');
  expect((await state(page)).timeSeconds).toBe(0);
  await command(page, 'play');
  if (!still) {
    await expect.poll(async () => (await state(page)).timeSeconds).toBeGreaterThan(0.1);
    await expect.poll(async () => (await state(page)).svg !== initial.svg, { message: 'Live playback must change the actual engine SVG' }).toBe(true);
  }
  await command(page, 'pause');
  const paused = await state(page);
  await page.waitForTimeout(120); expect(await state(page)).toEqual(paused);
  if (!still) {
    // A loop continues through the engine's cycle boundary instead of clamping.
    await seek(page, later.durationSeconds + 0.2); await command(page, 'play');
    await expect.poll(async () => (await state(page)).timeSeconds).toBeGreaterThan(later.durationSeconds + 0.3);
  }
  await offscreen(page, true);
  const hidden = await state(page);
  await page.waitForTimeout(120); expect(await state(page)).toEqual(hidden);
  await offscreen(page, false);
  if (!still) await expect.poll(async () => (await state(page)).timeSeconds).toBeGreaterThan(hidden.timeSeconds);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await state(page)).durationSeconds).toBe(0);
  const reduced = await state(page);
  expect(reduced.timeSeconds).toBe(0);
  await page.waitForTimeout(120); expect(await state(page)).toEqual(reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  if (!still) await expect.poll(async () => (await state(page)).durationSeconds).toBeGreaterThan(0);

  await openPackage(page, packages.origins[1], id, { playback: 'once' });
  await command(page, 'pause');
  const duration = (await state(page)).durationSeconds;
  await seek(page, Math.max(0, duration - 0.08)); await command(page, 'play');
  await expect.poll(async () => (await state(page)).timeSeconds).toBe(duration);
  const ended = await state(page);
  await command(page, 'play'); await page.waitForTimeout(120); expect(await state(page)).toEqual(ended);
  await command(page, 'pause'); await command(page, 'restart');
  expect((await state(page)).timeSeconds).toBe(0);

  await openPackage(page, packages.origins[1], id, { playback: 'in-view' });
  await command(page, 'pause');
  const inViewDuration = (await state(page)).durationSeconds;
  await seek(page, inViewDuration); await command(page, 'play');
  await offscreen(page, true); await offscreen(page, false);
  if (!still) {
    await expect.poll(async () => (await state(page)).timeSeconds).toBeGreaterThan(0);
    expect((await state(page)).timeSeconds).toBeLessThan(inViewDuration);
  } else expect((await state(page)).durationSeconds).toBe(0);

  await openPackage(page, packages.origins[0], id, { playback: 'static' });
  const staticFrame = await state(page);
  expect(staticFrame.durationSeconds).toBe(0);
  expect(staticFrame.svg).toBe(reduced.svg);
  await seek(page, 100); await command(page, 'play'); await command(page, 'restart');
  await page.waitForTimeout(100); expect(await state(page)).toEqual(staticFrame);

  // Author-supplied policy overrides are read on connection. Both browser
  // preferences and real offscreen transitions must leave these instances playing.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPackage(page, packages.origins[1], id, { playback: 'loop', 'reduced-motion': 'ignore', 'pause-offscreen': 'false' });
  await offscreen(page, true);
  const override = await state(page);
  if (still) { expect(override.durationSeconds).toBe(0); await page.waitForTimeout(120); expect(await state(page)).toEqual(override); }
  else {
    expect(override.durationSeconds).toBeGreaterThan(0);
    await expect.poll(async () => (await state(page)).timeSeconds).toBeGreaterThan(override.timeSeconds + 0.1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const changed = await state(page);
    await expect.poll(async () => (await state(page)).timeSeconds).toBeGreaterThan(changed.timeSeconds + 0.1);
  }
  expect(errors).toEqual([]);
});

test('Maze package in-view restarts on re-entry, but explicit pause survives visibility and media transitions', async ({ page, packages }) => {
  await openPackage(page, packages.origins[0], 'arrow-maze', { playback: 'in-view' });
  await command(page, 'pause');
  const duration = (await state(page)).durationSeconds;
  await seek(page, duration); await command(page, 'play');
  expect((await state(page)).timeSeconds).toBe(duration);
  await offscreen(page, true); await offscreen(page, false);
  await expect.poll(async () => (await state(page)).timeSeconds).toBeGreaterThan(0);
  expect((await state(page)).timeSeconds).toBeLessThan(duration);
  await command(page, 'pause');
  await offscreen(page, true); await offscreen(page, false);
  expect((await state(page)).timeSeconds).toBe(0); // in-view re-entry restarts, not play()
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await state(page)).durationSeconds).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(async () => (await state(page)).durationSeconds).toBe(duration);
  const paused = await state(page);
  await page.waitForTimeout(120); expect(await state(page)).toEqual(paused);
});
