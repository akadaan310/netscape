# Netscape Infinite — actual delivery and acceptance

The independent SDK and functioning Next.js application are implemented and production-built. **72/72 Node tests, 48/48 Playwright tests, both TypeScript projects, compiled ESM smoke, and clean-source reconstruction pass.** No public deployment has been performed.

The user subsequently authorized creating a GitHub repository and committing/pushing to **main**. The local branch is main. Both GitHub repository-creation APIs rejected the connected credential with **HTTP403 / Resource not accessible by integration**. No remote repository was created and no push occurred. An empty repository accessible to the connected integration is needed; see [publish.json](publish.json). User authorization is present; credential capability is the blocker.

## Reproducible checkpoint

- Product source: `7248a7daf455709286b772d8b4933042519aaa08`. Node v24.19.0, npm11.9.0, Linux x64; browser version is in browser-runtime.json.
- Clean export: `artifacts/reports/reconstruction-7248a7daf455709286b772d8b4933042519aaa08.txt` records fresh npm ci, all72 tests, both typechecks, full SDK+Next build and compiled SDK smoke.
- Source/fixture/font SHA-256: [source-hashes.json](source-hashes.json), [font pins](../../apps/web/public/fonts/SHA256SUMS), [evidence inventory](evidence-index.json).
- Research result SHA-256: `4b2f40b88d401672ab347100559c7a0144c90697c9da9e973745d50b49b1d070`. Two consecutive CLI outputs were byte-identical.
- Visual summary SHA-256: `e6970fce218248ce871789182814a49e6af4dd6116faf51b0633adeabba0514e`.

Actual source commits:

```text
10031d8 docs: preserve mission and define SDK contracts and execution plan
b884acc feat(sdk): implement deterministic morphogenesis, chromatics, dynamics and typed capabilities
9923330 feat(web): ship interpretation studio with cited artifacts and verified event replay
7248a7d fix(persistence): preserve saved work across draft and replay-budget limits
c5ee495 docs(evidence): record verified delivery, failure history and main publishing status
```

## Product delivered

Seven reusable SDK packages provide typed graph/grammar/IR/layout, OKLCH chromatics, fixed-step dynamics,20 real typed performers, inert resource interpretation plus Node-only safe fetch, conformance/replay, and a React adapter. The mathematics is independent of Next.js. Built ESM executes with TypeScript stripping disabled. Source-first exports serve bundlers; dist files and declarations are emitted by build:sdk.

The app has a URL box; three explicitly authored offline fixtures; six actual composition algorithms; seed/family controls; display facts; source/intent evidence; selectable passages; a visibly local simulated extractive companion; cited saved artifacts; close/reopen/reload; real event-history replay; light/dark reading canvases; controlled dynamics/color; gesture-enabled optional WebAudio; honest fallback and downloadable integrity-bound manifests. It has no paid provider, login, fake checkout, iframe or retired Golden Surface dependency.

See [SDK.md](../../SDK.md), [DEPLOYMENT.md](../../DEPLOYMENT.md), [gallery](gallery.html), [desktop](../screenshots/studio-final-desktop.png), [companion](../screenshots/local-companion.png), [artifact](../screenshots/cited-artifact.png).

## Measured results

| Check | Actual result | Evidence |
|---|---|---|
| Node behavioral/security tests |72passed,0failed|final-tests.txt|
| TypeScript |SDK/tests and application pass|final-typecheck.txt|
| Production build |Next15.5.28 succeeds; root first-load JS126kB|build-final-after-review.txt|
| Compiled SDK |ESM + declarations; Node execution without TS stripping passes|sdk-build-final.txt; sdk-smoke-final.txt; clean reconstruction|
| Browser |48passed,0skipped,0flaky,0unexpected in172.6s|visual-playwright-2026-10-18T11-36-08-439Z.json|
| Six families × six exact displays |36/36 feasible;0clipping,0action/contrast/axe failures|visual-summary.json|
| Pixel reproduction |0 differing pixels across162,113,532 pixels;36surface/physics replay matches|36 baseline/replay/diff sets and manifests|
| Normal actual CSS contrast |minimum5.3077:1 across captured normal text|actual computed styles + independent audit; axe separately|
| Pinned fonts |all6 exact font hashes verified; local loaded faces recorded|fontAssetSHA256 per case; bundled OFL/DejaVu licenses|
| Live motion |240fixed ticks in1064ms;0recorded semantic dispatches;0page errors|browser-runtime.json, concurrent test/build load|
| Retention boundary |45accepted from46eventful save attempts; all45 survive cold reload|persistence browser attachment; budget notice|

The first-load JS figure excludes font transfers: bundled unmodified TTF assets total about2.6MiB. Static build sizes and experiment timings are metadata in artifacts/experiments/latest.json; they are observations on this environment, not universal performance guarantees.

All six dimensions were tested:320×568,390×844,768×1024,900×390,1440×900,1920×1080. Touch, sequential Tab/Enter,200% text, reduced motion and a normal-motion probe were exercised. The36-case reference matrix pins seed7, logical tick0, locale en-US, UTC, DPR1, font files and Chromium. Generated semantic action targets meet44CSS px. Optional sound code and gesture/mute controls are tested; physical audible output was not measured.

## Research and mathematical interpretation

- H1:1,000seed assignments across six families reproduce exactly. There are1000 distinct content SHA values, **14 SDK structural equivalence classes and16 independent classes**. Distinct hashes include seed metadata and do not prove1,000 visually novel or usable interfaces.
- H2:36/36 required display/family constructions preserve capabilities and geometric constraints. Metrics remain a vector with descriptive Pareto ranks, not a single beauty score. The solver is a bounded heuristic; no global optimality is claimed.
- H3:1200 field cases and185 gamut cases pass. Minimum generated role contrast6.9379:1. Chroma bisection preserves OKLCH lightness/hue before sRGB quantization and role correction.
- H4:100 seeded worlds×1200 ticks, plus64-node/2400-tick stress, pass replay/finite/bounded/convergence gates. Fixed dt1/120; quantized tolerance1e-6; positive masses; degree/mass stiffness caps; bounded speed/displacement. Degree-normalized diffusion uses positive weights totaling0.992, preventing degree-dependent extrema growth. These are constrained numerical models, not a physical-fidelity or scientific-novelty claim.
- H5:20metadata-rich real operations reject schema mismatch, missing effect authority, capability inheritance and invalid outputs; traces reconstruct record consistency. Trusted custom JavaScript is not sandboxed. Trace/hash consistency is not cryptographic authentication or independent proof of execution.
- H6:all36frozen self-recaptures have exact pixel fidelity and pass hard gates. **The comparative aesthetic/reference-improvement study is NOT IMPLEMENTED**; H6 remains pending in the preregistered research output.
- H7:authored research, commerce and repository sources produce distinct inferred, evidence-grounded intents. No live content or executable checkout is inferred from these fixtures.

A reference edge perturbation had no layout response and is retained as such. A separately preregistered containment-endpoint amendment changed typed structure in all six families and geometry in Workbench while preserving actions. The original experiment used three stress dimensions in place of required dimensions; its preregistration/results remain intact and an explicit amendment preceded the corrected exact36-case run. See [research report](research.md), [methods](../../docs/RESEARCH.md), experiments/preregister*.json and retrieved-source hashes.

## Failures, corrections and review

Red logs and raw failed screenshots/traces are retained. Negative controls first proved detection of clipping, low contrast and wrong-action semantics. Actual failures then drove mobile hierarchy sizing,200% text reflow and accessible-name corrections. The initial diagnostic matrix included two asset-mismatch timeouts after an overlapping rebuild; final suites used immutable production assets.

Independent SDK review found incomplete semantic replay integrity, unreachable declared actions, permissive/throwing storage validation and inherited capability lookup. These were fixed and re-reviewed. Final product review reproduced two legitimate data-loss paths (oversized draft, aggregate replay budget) plus a stale fixture badge. All three were fixed, re-reviewed, and verified by three formerly failing browser regressions. Saves and autosave preflight constraints before overwriting; a refused save is visible and retains existing work. No remaining Critical or Important review finding is open. See sdk-review.md, sdk-hardening.md, final-review.md and persistence-fix.md.

Raw browser runs remain under artifacts/browser, including early failures, the45-test checkpoint, final48-test run and persistence red regression traces. They are preserved in the separate evidence archive rather than bloating source Git history. Every retained file is indexed by SHA-256.

## Acceptance assessment

| Criterion | Status | Evidence / scope |
|---|---|---|
|Fresh checkout installs/builds|PASS|artifacts/reports/reconstruction-7248a7daf455709286b772d8b4933042519aaa08.txt|
|Useful app, URL box, fixtures and typed surfaces|PASS|apps/web/app/Studio.tsx; production browser API/fixture tests|
|Safe public URL interpretation and fallback|IMPLEMENTED; LIVE SUCCESS UNVERIFIED|Exact HTTPS allowlist, pinned public DNS, redirects/limits tests; actual NASA TLS refused here; fallback browser-tested|
|Six generative families, seed replay, six displays|PASS|36/36 production captures; 1000-seed experiment|
|Standalone SDK libraries and tests|PASS|Seven packages, ESM/declarations, compiled SDK smoke with TypeScript stripping disabled|
|Fixed-step event, color/motion/optional sound, no semantic auto-actions|PASS IN TESTED SCOPE|Deterministic dynamics, gesture/mute controls, eventful artifact replay, normal-motion runtime probe; acoustic output not measured|
|NASA and restaurant evidence-grounded distinct intents|PASS|Also repository fixture; all local authored demonstrations, never live snapshots|
|Come here local simulated companion and shared context|PASS|Explicit extractive simulation; no remote model service|
|Artifact save/close/reopen/reload/reconstruction|PASS|Includes52-save ID regression, oversized-draft preservation, budget refusal with45 accepted of46 retained|
|Screenshots/diffs, keyboard/a11y/interactions/negative controls|PASS|48/48 Playwright;36 manifests;0 different pixels; touch/200% text/dark controls; all three deliberate failures detected|
|Cold reconstruction from source/fixtures/seeds/manifests|PASS|artifacts/reports/reconstruction-7248a7daf455709286b772d8b4933042519aaa08.txt; independent SHA-256 manifest replay|
|Vercel production build/env/deploy documentation|PASS FOR READINESS; NOT DEPLOYED|Next15.5.28 production build; DEPLOYMENT.md; .env.example; no live URL|
|SSRF/credentials/CSP/external mutation boundaries|PASS IN IMPLEMENTED SCOPE|No SSRF bypass found in reviews; frames/objects disallowed; no external mutation providers; per-process rate limits only|
|Research H6 comparative visual-improvement experiment|NOT IMPLEMENTED|36 exact self-recaptures prove reproducibility; no prospective before/after aesthetic or reference-similarity improvement study|

## Real, simulated and unresolved

**Implemented and observed:** local/full-stack fixture ingestion, typed interpretation, six layouts, deterministic math, local persistence and actual replay, safe-failure UI, production build, tests/captures and clean reconstruction. **Simulated:** the companion is deterministic extractive local context, not live7u/ChatGPT or another provider. **Inferred:** intent labels, with explicit source-node evidence.

**Unverified here:** successful live public URL ingestion. A real NASA read resolved a public address, then this environment refused direct TLS; injected adversarial transport tests exercise the real fetch logic and the fallback was browser-tested. Only exact HTTPS NASA/GitHub hosts are allowed. No arbitrary proxy or browser-equivalent navigation is claimed.

**Not deployed:** Vercel readiness is a successful Next production build plus documented monorepo settings. No live URL, public deployment or Vercel platform execution is claimed. Public broad launch should configure a distributed edge rate limit: current30read/minute/four-concurrent limits are per process. Script CSP currently allows Next inline bootstrap; nonce-based script CSP is a follow-up. Frames and objects remain prohibited, source HTML is never injected, and no external mutation provider is implemented.

**Not implemented:** H6comparative improvement study; general URL proxy; live AI providers; native/canvas adapters; optional GPU/WASM/HDR paths. Only recorded Chromium/Linux is browser-verified. Old incompatible workspace schemas recover visibly to a clean state; there is no migration of arbitrary historical schemas.

Run from the source root:

```sh
npm ci
npm run dev
# Production:
npm run build
npm start
# Reproduce:
npm test
npm run typecheck
npm run experiments
npm run test:e2e
bash scripts/reconstruct.sh
```

Reference screenshot: `artifacts/browser/2026-10-18T11-36-08-439Z/visual-1440x900-observator-def81-essibility-and-exact-replay-chromium/observatory-1440x900-baseline.png`, SHA-256 `bae96de1e11917fe91a2510d8d70a3b2d7554ee5dd02a07ae7ef6dfdee31a1af`. Full per-file inventory is evidence-index.json.
