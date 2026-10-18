/** Descriptive SDK metrics are never used as a substitute for the hard gates. */
export function buildVisualSummary(records: any[], runId: string) {
  records.sort((a, b) => a.viewport.width - b.viewport.width || a.family.localeCompare(b.family));
  const feasible = records.filter(r => Object.values(r.hardInvariants).every(Boolean));
  const vector = (r: any) => [r.metrics.compactness, r.metrics.legibility, r.metrics.grouping, -Math.abs(r.metrics.whitespace - .3), -r.metrics.motionEnergy];
  const dominates = (a: any, b: any) => { const av = vector(a), bv = vector(b); return av.every((v, i) => v >= bv[i]) && av.some((v, i) => v > bv[i]); };
  for (const record of records) record.pareto = { feasible: feasible.includes(record), rankWithinViewport: null as number | null, dominationCountWithinViewport: feasible.filter(other => other.viewport.width === record.viewport.width && other.viewport.height === record.viewport.height && dominates(other, record)).length, note: 'Descriptive SDK metric vectors; no claim of perceptual quality.' };
  for (const width of new Set(feasible.map(r => r.viewport.width))) {
    let remaining = feasible.filter(r => r.viewport.width === width);
    let rank = 1;
    while (remaining.length) {
      const front = remaining.filter(r => !remaining.some(other => dominates(other, r)));
      for (const record of front) record.pareto.rankWithinViewport = rank;
      remaining = remaining.filter(r => !front.includes(r));
      rank++;
    }
  }
  const failures = records.filter(r => !Object.values(r.hardInvariants).every(Boolean) || !r.reproduction.dimensionsEqual || r.reproduction.differentPixels > 0 || !r.reproduction.surfaceEqual || !r.reproduction.physicsEqual);
  return {
    generatedAt: new Date().toISOString(), runId,
    scope: 'H6 deterministic recapture fidelity; screenshots are self-baselines, not external design references. No aesthetic quality inference.',
    pinned: { fixture: 'nasa', seed: 7, tick: 0, fixedBrowserDate: '2026-10-18T00:00:00Z', locale: 'en-US', timezone: 'UTC', dpr: 1, reducedMotion: true, storage: 'cleared before each visual navigation', fonts: 'six checked-in unmodified TTFs (Liberation sans/serif/mono and DejaVu symbol fallback); SHA256SUMS independently verified; document.fonts.ready awaited', browser: '/usr/bin/chromium' },
    expectedCases: 36, observedCases: records.length, passedCases: records.length - failures.length, failedCaseIds: failures.map(r => r.id),
    totals: { feasibleCases: feasible.length, clippingCases: records.filter(r => !r.hardInvariants.noClipping).length, wrongActionCases: records.filter(r => !r.hardInvariants.correctActions).length, contrastFailureCases: records.filter(r => !r.hardInvariants.actualCSSContrast).length, axeFailureCases: records.filter(r => !r.hardInvariants.axeClean).length, differentPixels: records.reduce((n, r) => n + r.reproduction.differentPixels, 0), surfaceReplayFailures: records.filter(r => !r.reproduction.surfaceEqual).length, physicsReplayFailures: records.filter(r => !r.reproduction.physicsEqual).length },
    records,
  };
}
