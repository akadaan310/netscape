/** Established OKLCH / linear sRGB transforms. All public functions are pure. */
export type RGB = { r: number; g: number; b: number };
export type OKLCH = { l: number; c: number; h: number };
export type Palette = { background: string; surface: string; text: string; muted: string; accent: string; accentText: string; border: string };
export type FieldInput = { seed: number; x: number; y: number; tick: number; state: number; intent: string; mode: 'dark' | 'light' };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
function valid(color: OKLCH): void {
  if (!color || ![color.l, color.c, color.h].every(Number.isFinite) || color.l < 0 || color.l > 1 || color.c < 0 || color.c > 4) throw new RangeError('OKLCH requires finite l in [0,1], c in [0,4], and hue');
}
function encode(c: number): number { return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; }
/** May return out-of-gamut channels; use gamutMap for display-safe RGB. */
export function oklchToRgb(color: OKLCH): RGB {
  valid(color);
  const h = ((color.h % 360) * Math.PI) / 180;
  const a = color.c * Math.cos(h), b = color.c * Math.sin(h);
  const l = (color.l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (color.l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (color.l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return { r: encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), g: encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), b: encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) };
}
const inGamut = (rgb: RGB) => Object.values(rgb).every(v => v >= -1e-7 && v <= 1 + 1e-7);
/** Fixed 28-iteration chroma bisection preserves lightness and hue (c error < 1.5e-8). */
export function gamutMap(color: OKLCH): RGB {
  valid(color);
  let rgb = oklchToRgb(color);
  if (!inGamut(rgb)) {
    let low = 0, high = color.c;
    for (let i = 0; i < 28; i++) {
      const c = (low + high) / 2;
      const candidate = oklchToRgb({ ...color, c });
      if (inGamut(candidate)) low = c; else high = c;
    }
    rgb = oklchToRgb({ ...color, c: low });
  }
  return { r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b) };
}
export function toHex(rgb: RGB): string {
  if (!rgb || ![rgb.r, rgb.g, rgb.b].every(Number.isFinite)) throw new RangeError('RGB channels must be finite');
  return '#' + [rgb.r, rgb.g, rgb.b].map(v => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('');
}
function luminance(hex: string): number {
  if (typeof hex !== 'string' || !/^#[a-f\d]{6}$/i.test(hex)) throw new TypeError('Expected a six-digit sRGB hex color');
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function hashText(text: string): number {
  let result = 2166136261;
  for (let i = 0; i < text.length; i++) result = Math.imul(result ^ text.charCodeAt(i), 16777619);
  return result >>> 0;
}
function color(l: number, c: number, h: number): string { return toHex(gamutMap({ l, c, h })); }
/** Foreground correction is checked after 8-bit quantization against every relevant role. */
function accessible(l: number, c: number, h: number, backgrounds: string[], ratio: number, dark: boolean): string {
  for (let i = 0; i <= 100; i++) {
    const hex = color(l + ((dark ? 1 : 0) - l) * i / 100, c * (1 - i / 100), h);
    if (backgrounds.every(bg => contrast(hex, bg) >= ratio)) return hex;
  }
  throw new Error('Infeasible role contrast');
}
/** Slow periodic evolution, not frame-level flashing; caller supplies logical graph coordinates. */
export function field(input: FieldInput): Palette {
  if (!input || ![input.seed, input.x, input.y, input.tick, input.state].every(Number.isFinite) || !Number.isSafeInteger(input.seed) || !Number.isSafeInteger(input.tick) || input.tick < 0 || input.state < 0 || input.state > 1 || typeof input.intent !== 'string' || !['dark', 'light'].includes(input.mode)) throw new RangeError('Invalid deterministic color field input');
  const dark = input.mode === 'dark';
  const intentHue = hashText(input.intent) % 360;
  const phase = (input.seed % 997) * 0.013 + Math.sin(input.x * 0.17 + input.y * 0.11) * 0.3 + Math.sin((input.tick % 1_000_000) / 360) * 0.12;
  const h = (intentHue + phase * 40 + input.state * 65) % 360;
  const background = color(dark ? 0.16 : 0.985, 0.012, h);
  const surface = color(dark ? 0.21 : 0.95, 0.017, h);
  const backgrounds = [background, surface];
  const text = accessible(dark ? 0.95 : 0.2, 0.012, h, backgrounds, 4.5, dark);
  const muted = accessible(dark ? 0.72 : 0.43, 0.025, h, backgrounds, 4.5, dark);
  const accent = accessible(dark ? 0.79 : 0.43, 0.16 + input.state * 0.04, h, backgrounds, 4.5, dark);
  const accentText = contrast('#000000', accent) >= contrast('#ffffff', accent) ? '#000000' : '#ffffff';
  const border = accessible(dark ? 0.57 : 0.56, 0.04, h, backgrounds, 3, dark);
  return { background, surface, text, muted, accent, accentText, border };
}
