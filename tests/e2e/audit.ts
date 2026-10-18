import type { Page } from '@playwright/test';

export type Graph = { nodes: { id: string; action?: string; supported?: boolean }[] };
export type ActionEntry = { id: string; action: string; tag: string; width: number; height: number };

/** Independent semantic oracle: compare actual DOM action bindings to the input graph. */
export function auditActions(graph: Graph, actions: ActionEntry[]): string[] {
  const expected = graph.nodes.filter(n => n.action && n.supported !== false);
  const errors: string[] = [];
  for (const node of expected) {
    const actual = actions.filter(a => a.id === node.id);
    if (actual.length !== 1) errors.push(`${node.id}: expected exactly one action, found ${actual.length}`);
    for (const action of actual) {
      if (action.action !== node.action) errors.push(`${node.id}: wrong action ${action.action}, expected ${node.action}`);
      if (!['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(action.tag)) errors.push(`${node.id}: action lacks native interactive semantics`);
      if (action.width < 44 || action.height < 44) errors.push(`${node.id}: target below 44 CSS pixels (${action.width}×${action.height})`);
    }
  }
  for (const actual of actions) {
    if (!expected.some(n => n.id === actual.id)) errors.push(`${actual.id}: action absent from supported graph`);
  }
  return errors;
}

export async function inspectPage(page: Page) {
  return page.evaluate(() => {
    const rgba = (value: string): number[] => {
      const m = value.match(/[\d.]+/g)?.map(Number) || [];
      return [m[0] || 0, m[1] || 0, m[2] || 0, m[3] ?? 1];
    };
    const blend = (fg: number[], bg: number[]): number[] => [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
    const lum = (color: number[]): number => color.slice(0, 3).map(v => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
    const bgFor = (element: Element): number[] => {
      const lineage: Element[] = [];
      for (let e: Element | null = element; e; e = e.parentElement) lineage.unshift(e);
      return lineage.reduce((bg, e) => blend(rgba(getComputedStyle(e).backgroundColor), bg), [255, 255, 255, 1]);
    };
    const box = (e: Element) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y + scrollY, width: b.width, height: b.height }; };
    const visible = (e: Element) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const regions = [...document.querySelectorAll('[data-testid="generated-surface"] [data-testid="region"]')].filter(visible).map(e => ({ id: e.getAttribute('data-semantic-id'), ...box(e), scrollWidth: e.scrollWidth, clientWidth: e.clientWidth, scrollHeight: e.scrollHeight, clientHeight: e.clientHeight }));
    const actions = [...document.querySelectorAll('[data-testid="generated-surface"] [data-action][data-semantic-id]')].filter(visible).map(e => ({ id: e.getAttribute('data-semantic-id')!, action: e.getAttribute('data-action')!, tag: e.tagName, ...box(e) }));
    const clipping: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) clipping.push(`document overflow: ${document.documentElement.scrollWidth} > ${innerWidth}`);
    for (const e of document.querySelectorAll('[data-testid="region"], [data-action], [data-harness-clip]')) {
      if (!visible(e)) continue;
      const b = e.getBoundingClientRect();
      if (b.x < -1 || b.right > innerWidth + 1) clipping.push(`${e.getAttribute('data-semantic-id') || e.tagName}: outside horizontal viewport`);
      if (e.scrollWidth > e.clientWidth + 2 && ['hidden', 'clip'].includes(getComputedStyle(e).overflowX)) clipping.push(`${e.getAttribute('data-semantic-id') || e.tagName}: clipped horizontal content`);
      if (e.scrollHeight > e.clientHeight + 2 && ['hidden', 'clip'].includes(getComputedStyle(e).overflowY)) clipping.push(`${e.getAttribute('data-semantic-id') || e.tagName}: clipped vertical content`);
      if (e.getAttribute('data-testid') === 'region' && e.scrollHeight > e.clientHeight + 2) clipping.push(`${e.getAttribute('data-semantic-id')}: content exceeds allocated region height (${e.scrollHeight}>${e.clientHeight})`);
    }
    const contrast = [...document.querySelectorAll('body *')].filter(e => e instanceof HTMLElement && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(e.tagName)).filter(visible).filter(e => [...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim())).map(e => {
      const s = getComputedStyle(e); const bg = bgFor(e); const fg = blend(rgba(s.color), bg); const l = [lum(fg), lum(bg)].sort((a, b) => a - b);
      const fontSize = parseFloat(s.fontSize); const min = fontSize >= 24 || (fontSize >= 18.66 && parseInt(s.fontWeight) >= 700) ? 3 : 4.5;
      return { tag: e.tagName, text: e.textContent!.trim().slice(0, 100), foreground: s.color, background: bg.slice(0, 3), ratio: (l[1] + .05) / (l[0] + .05), min };
    });
    return { viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, regions, actions, clipping, contrast, contrastFailures: contrast.filter(c => c.ratio + 1e-6 < c.min) };
  });
}

export async function ready(page: Page) {
  await page.waitForFunction(() => Boolean((window as any).__NETSCAPE__?.graph?.nodes?.length && (window as any).__NETSCAPE__?.surface?.hash));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  let last = '';
  for (let attempt = 0; attempt < 20; attempt++) {
    const next = await page.evaluate(() => JSON.stringify((window as any).__NETSCAPE__));
    if (last && next === last) return JSON.parse(next);
    last = next;
    await page.waitForTimeout(100);
  }
  throw new Error('window.__NETSCAPE__ did not stabilize at the requested deterministic tick');
}
