import test from 'node:test';
import assert from 'node:assert/strict';
import { oklchToRgb, gamutMap, toHex, contrast, field } from '../packages/chromatics/src/index.ts';

test('OKLCH reference colors and chroma-bisection gamut mapping', () => {
  assert.equal(toHex(oklchToRgb({ l: 1, c: 0, h: 0 })), '#ffffff');
  assert.equal(toHex(oklchToRgb({ l: 0, c: 0, h: 0 })), '#000000');
  for (let h = -360; h <= 720; h += 13) {
    const rgb = gamutMap({ l: 0.7, c: 0.6, h });
    for (const value of Object.values(rgb)) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
  }
  assert.throws(() => gamutMap({ l: NaN, c: 1, h: 0 }));
  assert.throws(() => gamutMap({ l: 0.5, c: -1, h: 0 }));
});

test('contrast oracle detects deliberately inaccessible controls', () => {
  assert.ok(Math.abs(contrast('#000000', '#ffffff') - 21) < 1e-10);
  assert.ok(contrast('#777777', '#888888') < 4.5, 'negative control must fail AA');
  assert.equal(contrast('#abcdef', '#abcdef'), 1);
  assert.throws(() => contrast('red', '#ffffff'));
});

test('field is pure, responds to semantic inputs and guarantees AA in both modes', () => {
  const base = { seed: 19, x: 2, y: 3, tick: 48, state: 0.4, intent: 'research', mode: 'dark' as const };
  assert.deepEqual(field(base), field(base));
  for (const change of [{ seed: 20 }, { x: 20 }, { y: 20 }, { tick: 180 }, { state: 1 }, { intent: 'commerce' }]) {
    assert.notDeepEqual(field(base), field({ ...base, ...change }));
  }
  for (const mode of ['dark', 'light'] as const) for (let i = 0; i < 150; i++) {
    const colors = field({ seed: i, x: i / 7, y: -i, tick: i * 61, state: i / 150, intent: String(i % 5), mode });
    for (const bg of [colors.background, colors.surface]) {
      assert.ok(contrast(colors.text, bg) >= 4.5);
      assert.ok(contrast(colors.muted, bg) >= 4.5);
      assert.ok(contrast(colors.accent, bg) >= 4.5);
      assert.ok(contrast(colors.border, bg) >= 3);
    }
    assert.ok(contrast(colors.accentText, colors.accent) >= 4.5);
  }
  assert.throws(() => field({ ...base, state: Infinity }));
  assert.throws(() => field({ ...base, state: 1.1 }));
});

test('gamut mapping preserves OKLab lightness rather than clipping saturated channels', () => {
  const rgb = gamutMap({ l: 0.7, c: 0.6, h: 125 });
  const linear = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  assert.ok(Math.abs(lightness - 0.7) < 1e-6);
  const red = oklchToRgb({ l: 0.62795536, c: 0.25768331, h: 29.233885 });
  assert.ok(Math.abs(red.r - 1) < 1e-6 && Math.abs(red.g) < 1e-6 && Math.abs(red.b) < 1e-6);
});
