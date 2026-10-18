# Browser harness evidence

Final production browser run: **48 passed, zero failed**, in 172.6 seconds (2.9 minutes), using `npx playwright test`. No tests were skipped or flaky. Preceding smoke runs passed all nine original functional/gate tests and all four persistence-regression/gate tests. The final server was held on one immutable production build throughout the run (source checkpoint `7248a7d`). No deployment or external mutation occurred.

| Final evidence | Value |
| --- | --- |
| Run ID | `2026-10-18T11-36-08-439Z` |
| Negative-control prerequisite | 1 passed |
| Functional journeys | 11 passed |
| Family/viewport cases | 36 passed / 36 expected |
| Axe scans | 36 light matrix cases + one representative dark canvas |
| Graph-to-DOM action bindings checked | 360 |
| Clipping / wrong action / contrast / axe failure cases | 0 / 0 / 0 / 0 |
| Surface / physics replay mismatches | 0 / 0 |
| Different pixels / compared pixels | 0 / 162,113,532 |
| Matrix minimum computed normal-text contrast | 5.3077:1 (gate 4.5:1) |
| Matrix minimum generated semantic target | 170px width; 99px height (gates 44px) |
| Files in final run | 36 per-case manifests; 110 PNGs |

The six families are observatory, orbital, elastic, folded, workbench and chromatic. Every family was checked at 320×568, 390×844, 768×1024, 900×390, 1440×900 and 1920×1080. Portrait contexts enable touch. Vertical scrolling is allowed; horizontal document overflow, out-of-viewport semantic regions, hidden-content clipping, and content extending beyond allocated region height are hard failures.

The negative-control gate was implemented and passed before evaluating the application. Its deliberately defective DOM contains horizontal overflow, unreadable text and an action binding contradicting its semantic graph. All three independent audits detect the corresponding errors. Its screenshot and audit attachment are retained in each run.

Functional acceptance covers authored NASA/menu/repository APIs and fixture switching; unsafe URL rejection and visible fallback; passage selection, explicitly local/simulated companion, cited artifact close/reopen/cold reload; seed/family changes; playful events without semantic action count increments; opt-in sound with AudioContext/tone user-gesture instrumentation; actual mobile passage and companion taps; sequential keyboard activation with every computed text font doubled to 200%; exact eventful artifact physics reconstruction after cold reload; malformed and obsolete workspace recovery; actual downloaded manifest validation/reconstruction through the SDK; and unchanged source capabilities plus contrast/axe checks after switching to a dark canvas. Three additional regressions prove that an oversized URL draft cannot erase a cited artifact, 46 eventful save attempts accept exactly 45 artifacts and preserve all 45 across cold reload, and replaying NASA after Restaurant restores the correct active fixture badge.

The browser was `/usr/bin/chromium`, Chromium 154.0.8037.57 on Debian GNU/Linux 13. Inputs pin fixture NASA, seed 7, simulation tick 0, fixed browser date `2026-10-18T00:00:00Z`, UTC, en-US, DPR 1 and reduced motion. Visual captures clear localStorage before each navigation so baseline and replay have identical browser-state inputs; functional persistence tests retain real storage. Six checked-in, unmodified Liberation/DejaVu TTF assets pin typography and symbol fallback. Each case independently verifies every font file against `apps/web/public/fonts/SHA256SUMS`, records `fontAssetSHA256`, and confirms loaded font faces. Capture waits for `document.fonts.ready` and stable exported state.

Each visual case saves baseline/replay screenshots, a PNG difference image, semantic fixture SHA-256, grammar/version and source manifest, actual DOM boxes/action bindings, accessibility YAML, computed CSS text contrast, complete axe output, chromatic roles, descriptive SDK metrics and physics snapshot. Hard gates independently compare DOM action types and IDs with the semantic input graph, require native controls and 44px generated action targets, preserve declared semantic reading order, and verify finite bounded physics. The aggregate computes Pareto fronts only among feasible cases within the same viewport; these SDK metrics are descriptive proxies.

Final artifacts:

- `artifacts/reports/visual-summary.json` and `visual-summary-2026-10-18T11-36-08-439Z.json`: complete machine-readable matrix evidence.
- Summary SHA-256: `e6970fce218248ce871789182814a49e6af4dd6116faf51b0633adeabba0514e`.
- NASA fixture SHA-256: `8af440b4a4c9cd64109f1a2cb0627add0a890ad2696caeb4b1307d17b3314470`.
- `artifacts/reports/visual-playwright-2026-10-18T11-36-08-439Z.json`: full 48-test result.
- `artifacts/browser/2026-10-18T11-36-08-439Z/`: screenshots, difference images, per-case manifests and accessibility snapshots.
- `artifacts/browser-report/2026-10-18T11-36-08-439Z/index.html`: browsable report.

Earlier failing runs remain intact. The first production diagnostic exposed redundant width expansion under inverse CSS zoom, three visible-label/accessible-name mismatches, and Resource text exceeding its allocated 320px-region height. The app worker fixed these and the final run independently passed their gates. The initial matrix retained 34 completed cases, each with zero pixel differences, but failed accessibility and six clipping gates; its final two cases timed out during an overlapping rebuild that changed assets under the old process. Its diagnostic aggregate is `artifacts/reports/visual-summary-2026-10-18T11-15-30-229Z.json`. It is not used as final acceptance evidence.

H6 compares the initial capture with an identical-input reload within the same immutable run. The result establishes self-reproduction fidelity; there is no independent external design reference, aesthetic-quality claim or measured visual improvement claim. Computed CSS contrast auditing assumes solid ancestor backgrounds; axe separately scans supported backgrounds. Automated accessibility checks do not replace human accessibility review.

Reproduction: build with `npm run build`, then run `npm run test:e2e`. The configuration starts `npm start` when no localhost server exists and reuses an existing server; keep that build unchanged during capture. Runs use separate timestamped artifact/report directories to preserve failures. To reconstruct an aggregate from retained per-case records, run `npx tsx scripts/visual-summary.ts <run-id>`; it writes a timestamped summary without replacing the latest summary.

The preceding complete 45-test green checkpoint remains preserved under run `2026-10-18T11-25-44-576Z`. Independent review then found three persistence-boundary regressions. All three were demonstrated failing before their fixes; the latest failure evidence remains in `artifacts/reports/persistence-limits-red.log` and `artifacts/browser/persistence-limits-red-20261018/` (three failure screenshots, accessibility/error contexts and traces). After fixes, the targeted four-test run and the final full 48-test run passed. The earlier 45-test summary retains SHA-256 `00a88eef69a491339b7f7e516c9fb4dfa25dc6d1945a9f0956ae7a4a8ed79294`.
