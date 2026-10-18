import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { replayManifest } from '@netscape/conformance';
import { auditActions, inspectPage, ready } from './audit';

test.use({ hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-18T00:00:00Z'));
  await page.addInitScript(() => {
    const audit = { contexts: [] as { gesture: boolean }[], tones: [] as { gesture: boolean }[] };
    (window as any).__AUDIO_AUDIT__ = audit;
    const NativeAudioContext = window.AudioContext;
    if (NativeAudioContext) window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) { super(options); audit.contexts.push({ gesture: navigator.userActivation.isActive }); }
    };
    if (window.OscillatorNode) {
      const start = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (when?: number) { audit.tones.push({ gesture: navigator.userActivation.isActive }); return start.call(this, when); };
    }
  });
  await page.goto('/?fixture=nasa&family=observatory&seed=7&tick=0&test=1');
  await ready(page);
});

test('local fixtures and protected interpreter API report evidence and reject unsafe URLs', async ({ page, request }) => {
  for (const fixture of ['nasa', 'restaurant', 'github']) {
    const response = await request.get(`/api/interpret?fixture=${fixture}`);
    expect(response.ok(), `${fixture} fixture API status`).toBe(true);
    const parsed = await response.json();
    expect(parsed.graph?.nodes?.length).toBeGreaterThan(3);
    expect(parsed.graph.provenance.kind).toBe('fixture');
    await page.getByTestId(`fixture-${fixture}`).click();
    await expect.poll(async () => (await ready(page)).graph.title).toMatch(fixture === 'nasa' ? /Worlds beyond our Sun/i : fixture === 'restaurant' ? /Juniper Table/i : /field-notebook/i);
  }
  for (const url of ['http://127.0.0.1:3000/private', 'https://169.254.169.254/latest/meta-data', 'javascript:alert(1)', 'https://nasa.gov.evil.example/']) {
    const response = await request.get('/api/interpret', { params: { url } });
    expect(response.status(), url).toBeGreaterThanOrEqual(400);
  }
  await page.getByTestId('resource-url').fill('http://127.0.0.1:3000/private');
  await page.getByTestId('interpret').click();
  await expect(page.getByTestId('source-fallback')).toBeVisible();
});

test('selection, local companion and cited artifact survive close, reopen and cold reload', async ({ page }) => {
  const passage = page.getByTestId('passage').first();
  const passageId = await passage.getAttribute('data-semantic-id');
  const state = await ready(page);
  const node = state.graph.nodes.find((entry: { id: string }) => entry.id === passageId);
  const passageText = (node.text || node.label).trim();
  expect(passageText.length).toBeGreaterThan(0);
  await passage.click();
  await page.getByTestId('come-here').click();
  await expect(page.getByTestId('companion')).toBeVisible();
  await expect(page.getByTestId('companion')).toContainText(/simulated|local/i);
  await page.getByTestId('save-artifact').first().click();
  await expect(page.getByTestId('artifact-card').first()).toBeVisible();
  const artifactText = (await page.getByTestId('artifact-card').first().innerText()).trim();
  expect(artifactText).toContain(passageText);
  expect(artifactText).toMatch(/nasa|fixture|source|citation/i);
  await page.getByTestId('close-artifact').first().click();
  await expect(page.getByTestId('artifact-card')).toHaveCount(0);
  await page.getByTestId('reopen-artifact').first().click();
  await expect(page.getByTestId('artifact-card').first()).toContainText(passageText);
  await page.reload();
  await ready(page);
  await expect(page.getByTestId('artifact-card').first()).toContainText(passageText);
  await expect(page.getByTestId('artifact-card').first()).toContainText(/nasa|fixture|source|citation/i);
});

test('seed and family controls replay; playful event never invokes semantic actions; sound requires gesture', async ({ page }) => {
  const initial = await ready(page);
  expect(await page.evaluate(() => (window as any).__AUDIO_AUDIT__.tones.length), 'no audio tone before gesture').toBe(0);
  const sound = page.getByTestId('sound-toggle');
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('playful-event').click();
  const event = await ready(page);
  expect(event.semanticActionCount).toBe(initial.semanticActionCount);
  expect(event.dynamics).not.toEqual(initial.dynamics);
  expect(await page.evaluate(() => (window as any).__AUDIO_AUDIT__.tones.length), 'playful event remains silent before explicit opt-in').toBe(0);
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('playful-event').click();
  const audioAudit = await page.evaluate(() => (window as any).__AUDIO_AUDIT__);
  expect(audioAudit.contexts.every((c: { gesture: boolean }) => c.gesture), 'AudioContext creation requires active user gesture').toBe(true);
  expect(audioAudit.tones.every((c: { gesture: boolean }) => c.gesture), 'tones require active user gesture').toBe(true);
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('seed-input').fill('23');
  await page.getByTestId('family-select').selectOption('orbital');
  await page.getByTestId('regenerate').click();
  await expect.poll(async () => (await ready(page)).surface.seed).toBe(23);
  const generated = await ready(page);
  expect(generated.surface.family).toBe('orbital');
  expect(generated.surface.hash).not.toBe(initial.surface.hash);
  expect(auditActions(generated.graph, (await inspectPage(page)).actions)).toEqual([]);
});

test('keyboard-only passage and context flow, mobile touch, and 200 percent text stay reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.getByTestId('passage').first().tap();
  await expect(page.getByTestId('passage').first()).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('come-here').tap();
  await expect(page.getByTestId('companion')).toBeVisible();
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll('body, body *')].map(element => ({ element, size: parseFloat(getComputedStyle(element).fontSize) }));
    for (const { element, size } of sizes) if (element instanceof HTMLElement && Number.isFinite(size)) element.style.setProperty('font-size', `${size * 2}px`, 'important');
  });
  await ready(page);
  await expect(page.getByTestId('studio')).toBeVisible();
  const audit = await inspectPage(page);
  expect(audit.clipping).toEqual([]);
  await page.keyboard.press('Control+Home');
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  let reachedPassage = false;
  for (let step = 0; step < 100; step++) {
    await page.keyboard.press('Tab');
    reachedPassage = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'passage');
    if (reachedPassage) break;
  }
  expect(reachedPassage, 'passage reachable by sequential Tab navigation').toBe(true);
  await page.keyboard.press('Enter');
  let reachedCompanion = false;
  for (let step = 0; step < 100; step++) {
    await page.keyboard.press('Tab');
    reachedCompanion = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'come-here');
    if (reachedCompanion) break;
  }
  expect(reachedCompanion).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('companion')).toBeVisible();
});

test('manifest export is an actual downloadable reconstruction record', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-manifest').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const manifest = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(JSON.stringify(manifest)).toContain('observatory');
  expect(manifest.seed).toBe(7);
  const reconstructed = replayManifest(manifest);
  const live = await ready(page);
  expect(reconstructed.hash).toBe(live.surface.hash);
  expect(reconstructed.regions).toEqual(live.surface.regions);
});


test('eventful artifact reconstruction restores the exact physics trace after cold reload', async ({ page }, testInfo) => {
  await page.getByTestId('passage').first().click();
  await page.getByTestId('come-here').click();
  const before = await ready(page);
  await page.getByTestId('playful-event').click();
  const eventful = await ready(page);
  expect(eventful.dynamics.tick).toBeGreaterThan(before.dynamics.tick);
  expect(eventful.semanticActionCount).toBe(before.semanticActionCount);
  await page.getByTestId('save-artifact').first().click();
  await expect(page.getByTestId('artifact-card').first()).toBeVisible();
  await page.reload();
  await ready(page);
  await page.getByRole('button', { name: 'Replay source', exact: true }).first().click();
  const replay = await ready(page);
  await testInfo.attach('eventful-physics-reconstruction', { body: JSON.stringify({ original: eventful.dynamics, replay: replay.dynamics, manifest: replay.manifest }, null, 2), contentType: 'application/json' });
  expect(replay.dynamics.traceHash).toBe(eventful.dynamics.traceHash);
  expect(replay.dynamics).toEqual(eventful.dynamics);
});

test('corrupted and obsolete local workspaces recover visibly without restoring unsafe state', async ({ page }) => {
  for (const corrupt of ['{ this is not valid JSON', JSON.stringify({ version: 0, seed: 7, family: 'observatory', artifacts: [{ title: 'UNTRUSTED OLD ARTIFACT' }] })]) {
    await page.evaluate(value => localStorage.setItem('netscape-infinite.workspace.v1', value), corrupt);
    await page.reload();
    const state = await ready(page);
    await expect(page.getByRole('status')).toContainText(/damaged|incompatible|invalid|clean workspace/i);
    await expect(page.getByTestId('artifact-card')).toHaveCount(0);
    expect(state.graph.provenance.kind).toBe('fixture');
    expect(state.surface.seed).toBe(7);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('netscape-infinite.workspace.v1')!));
    expect(stored.version).toBe(1);
    expect(stored.artifacts).toEqual([]);
  }
});


test('dark reading canvas preserves source capabilities and passes actual contrast and accessibility', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const original = await ready(page);
  await page.getByRole('button', { name: /dark.*canvas/i }).click();
  const dark = await ready(page);
  const audit = await inspectPage(page);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  await page.screenshot({ path: testInfo.outputPath('dark-canvas.png'), fullPage: true, animations: 'disabled' });
  await testInfo.attach('dark-canvas-evidence', { body: JSON.stringify({ palette: dark.palette, display: dark.display, audit, axeViolations: axe.violations }, null, 2), contentType: 'application/json' });
  expect(dark.display.colorScheme).toBe('dark');
  expect(dark.palette).not.toEqual(original.palette);
  expect(dark.graph).toEqual(original.graph);
  expect(auditActions(dark.graph, audit.actions)).toEqual([]);
  expect(audit.clipping).toEqual([]);
  expect(audit.contrastFailures).toEqual([]);
  expect(axe.violations).toEqual([]);
});
