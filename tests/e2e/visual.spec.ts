import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import { auditActions, inspectPage, ready } from './audit';
import { buildVisualSummary } from './report';

const families = ['observatory', 'orbital', 'elastic', 'folded', 'workbench', 'chromatic'];
const viewports = [
  { width: 320, height: 568 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 900, height: 390 },
  { width: 1440, height: 900 }, { width: 1920, height: 1080 },
];
const records: any[] = [];
const fixturePath = path.resolve('fixtures/nasa.html');
const reportPath = path.resolve('artifacts/reports/visual-summary.json');

async function fontAssets() {
  const source = await readFile('apps/web/public/fonts/SHA256SUMS', 'utf8');
  const assets = await Promise.all(source.trim().split(/\r?\n/).map(async line => {
    const [expected, file] = line.trim().split(/\s+/);
    const actual = createHash('sha256').update(await readFile(file)).digest('hex');
    return { path: file, sha256: actual, expectedSHA256: expected, matches: actual === expected };
  }));
  return { assets, sha256: Object.fromEntries(assets.map(asset => [asset.path, asset.sha256])), pinFile: 'apps/web/public/fonts/SHA256SUMS', pinFileSHA256: createHash('sha256').update(source).digest('hex') };
}

test.afterAll(async () => {
  // Failed Playwright tests restart the worker; recover this run's persisted cases.
  const runRoot = path.resolve('artifacts/browser', process.env.VISUAL_RUN_ID!);
  for (const file of await readdir(runRoot, { recursive: true }).catch(() => [] as string[])) {
    if (!file.endsWith('/manifest.json')) continue;
    const record = JSON.parse(await readFile(path.join(runRoot, file), 'utf8'));
    if (!records.some(r => r.id === record.id)) records.push(record);
  }
  await mkdir(path.dirname(reportPath), { recursive: true });
  const summary = JSON.stringify(buildVisualSummary(records, process.env.VISUAL_RUN_ID!), null, 2);
  await writeFile(reportPath, summary);
  await writeFile(path.resolve(`artifacts/reports/visual-summary-${process.env.VISUAL_RUN_ID}.json`), summary);
});

for (const viewport of viewports) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, hasTouch: viewport.width <= 768 });
    for (const family of families) {
      test(`${family} retains semantics, accessibility and exact replay`, async ({ page }, testInfo) => {
        const id = `${family}-${viewport.width}x${viewport.height}`;
        const pinnedFonts = await fontAssets();
        await page.clock.setFixedTime(new Date('2026-10-18T00:00:00Z'));
        await page.addInitScript(() => localStorage.clear());
        await page.goto(`/?fixture=nasa&family=${family}&seed=7&tick=0&test=1`);
        const state = await ready(page);
        const audit = await inspectPage(page);
        const actionErrors = auditActions(state.graph, audit.actions);
        const regionErrors = audit.regions.filter(r => ![r.x, r.y, r.width, r.height].every(Number.isFinite) || r.width <= 0 || r.height <= 0).map(r => `${r.id}: invalid actual DOM box`);
        if (JSON.stringify(audit.regions.map(r => r.id)) !== JSON.stringify(state.surface.regions.map((r: any) => r.semanticId))) regionErrors.push('Actual DOM region identity/order differs from declared surface');
        const physicsErrors: string[] = [];
        if (state.dynamics?.nodes?.length !== state.graph.nodes.length || !Number.isInteger(state.dynamics?.tick) || !state.dynamics?.traceHash) physicsErrors.push('Physics snapshot missing graph nodes, integer tick or trace hash');
        for (const node of state.dynamics?.nodes || []) for (const key of ['x', 'y', 'vx', 'vy', 'field']) if (!Number.isFinite(node[key]) || Math.abs(node[key]) > ({ x: 1e6, y: 1e6, vx: 1e5, vy: 1e5, field: 1e3 } as Record<string, number>)[key]) physicsErrors.push(`${node.id}: invalid/boundedness failure in ${key}`);
        const accessibility = await page.getByTestId('studio').ariaSnapshot();
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const baselinePath = testInfo.outputPath(`${id}-baseline.png`);
        const replayPath = testInfo.outputPath(`${id}-replay.png`);
        const diffPath = testInfo.outputPath(`${id}-diff.png`);
        await page.screenshot({ path: baselinePath, fullPage: true, animations: 'disabled' });
        await page.reload();
        const replayState = await ready(page);
        await page.screenshot({ path: replayPath, fullPage: true, animations: 'disabled' });
        const baseline = PNG.sync.read(await readFile(baselinePath));
        const replay = PNG.sync.read(await readFile(replayPath));
        const dimensionsEqual = baseline.width === replay.width && baseline.height === replay.height;
        let differentPixels = 0;
        const diff = new PNG({ width: baseline.width, height: baseline.height });
        for (let y = 0; y < baseline.height; y++) for (let x = 0; x < baseline.width; x++) {
          const i = (y * baseline.width + x) * 4;
          const j = (y * replay.width + x) * 4;
          const same = x < replay.width && y < replay.height && [0, 1, 2, 3].every(c => baseline.data[i + c] === replay.data[j + c]);
          if (!same) differentPixels++;
          diff.data[i] = same ? 240 : 235;
          diff.data[i + 1] = same ? 240 : 30;
          diff.data[i + 2] = same ? 240 : 70;
          diff.data[i + 3] = 255;
        }
        await writeFile(diffPath, PNG.sync.write(diff));
        const manifest = {
          id, fixture: { path: 'fixtures/nasa.html', sha256: createHash('sha256').update(await readFile(fixturePath)).digest('hex') },
          seed: 7, family, viewport, display: state.display, fontAssetSHA256: pinnedFonts.sha256, pinnedFontAssets: pinnedFonts,
          grammarVersion: state.manifest?.grammarVersion ?? state.manifest?.grammar ?? state.surface.version,
          simulationTick: state.dynamics?.tick, fieldRoles: state.palette ?? state.manifest?.chromaticField,
          fonts: await page.evaluate(() => ({ body: getComputedStyle(document.body).fontFamily, loadedFaces: [...document.fonts].map(f => ({ family: f.family, status: f.status })) })),
          provenance: state.graph.provenance, expectedRegions: state.surface.regions,
          sourceManifest: state.manifest, physicsTrace: state.dynamics,
          metrics: state.surface.metrics, accessibility, audit, actionErrors, regionErrors, physicsErrors,
          axeViolations: axe.violations,
          hardInvariants: { pinnedFontAssets: pinnedFonts.assets.length === 6 && pinnedFonts.assets.every(asset => asset.matches), validRegions: regionErrors.length === 0, boundedPhysics: physicsErrors.length === 0, noClipping: audit.clipping.length === 0, correctActions: actionErrors.length === 0, actualCSSContrast: audit.contrastFailures.length === 0, axeClean: axe.violations.length === 0 },
          reproduction: { dimensionsEqual, differentPixels, totalPixels: baseline.width * baseline.height, ratio: differentPixels / (baseline.width * baseline.height), surfaceEqual: JSON.stringify(state.surface) === JSON.stringify(replayState.surface), physicsEqual: JSON.stringify(state.dynamics) === JSON.stringify(replayState.dynamics) },
          artifacts: { baselinePath, replayPath, diffPath },
          limitations: ['Self-baseline only establishes same-input reproduction fidelity.', 'DOM contrast audit uses solid computed ancestor backgrounds; axe separately audits supported CSS backgrounds.', 'No aesthetic quality assertion.'],
        };
        records.push(manifest);
        await writeFile(testInfo.outputPath('manifest.json'), JSON.stringify(manifest, null, 2));
        await writeFile(testInfo.outputPath('accessibility.yml'), accessibility);
        await testInfo.attach('manifest', { body: JSON.stringify(manifest, null, 2), contentType: 'application/json' });
        expect.soft(pinnedFonts.assets.length, 'six checked-in local font assets').toBe(6);
        expect.soft(pinnedFonts.assets.every(asset => asset.matches), 'local font asset SHA-256 pins').toBe(true);
        expect.soft(audit.regions.length).toBe(state.surface.regions.length);
        expect.soft(regionErrors, 'DOM region identity, reading order and finite geometry').toEqual([]);
        expect.soft(physicsErrors, 'bounded finite physics trace').toEqual([]);
        expect.soft(audit.clipping, 'horizontal viewport and clipped-content audit').toEqual([]);
        expect.soft(actionErrors, 'graph-to-DOM action bindings').toEqual([]);
        expect.soft(audit.contrastFailures, 'actual computed CSS contrast').toEqual([]);
        expect.soft(axe.violations, 'WCAG A/AA axe scan').toEqual([]);
        expect.soft(manifest.reproduction.surfaceEqual, 'same-input surface replay').toBe(true);
        expect.soft(manifest.reproduction.physicsEqual, 'same-input physics trace replay').toBe(true);
        expect.soft(dimensionsEqual, 'same-input screenshot dimensions').toBe(true);
        expect(differentPixels, 'H6 exact pixel self-reproduction').toBe(0);
      });
    }
  });
}
