import { test, expect } from '@playwright/test';
import { auditActions, inspectPage } from './audit';

test('negative controls independently detect clipping, contrast and wrong actions', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.setContent(`<html lang="en"><head><title>Harness negative controls</title></head><body style="margin:0;background:white;color:black"><main><div data-harness-clip style="width:400px;overflow:hidden">Intentionally overflows narrow viewport</div><p data-harness-contrast style="color:#eee;background:#fff">Intentionally unreadable text</p><div data-testid="generated-surface"><button data-semantic-id="save" data-action="open-external" style="width:100px;height:44px">Wrong action</button></div></main></body></html>`);
  const audit = await inspectPage(page);
  const errors = auditActions({ nodes: [{ id: 'save', action: 'save-artifact', supported: true }] }, audit.actions);
  await testInfo.attach('negative-control-evidence', { body: JSON.stringify({ audit, errors }, null, 2), contentType: 'application/json' });
  await page.screenshot({ path: testInfo.outputPath('negative-controls.png'), fullPage: true });
  expect(audit.clipping.length).toBeGreaterThan(0);
  expect(audit.contrastFailures.some(c => c.text.includes('Intentionally unreadable'))).toBe(true);
  expect(errors.some(e => e.includes('wrong action'))).toBe(true);
});
