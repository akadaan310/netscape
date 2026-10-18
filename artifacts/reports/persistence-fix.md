# Controlled persistence fix wave

Scope: `apps/web/app/Studio.tsx`, `apps/web/lib/artifacts.ts`, `packages/conformance/src/index.ts`, `tests/artifact-store.test.ts`, `tests/conformance.test.ts`, and new `tests/e2e/persistence-limits.spec.ts`. No CSS, fonts, root configuration, existing browser tests, commits, builds, or server changes were made by this worker.

Read `artifacts/reports/final-review.md` first, then `docs/CONTRACTS.md` and the affected sources. The failures share a persistence boundary mismatch: the UI wrote locally generated state that the cold restore validator rejected. The replay selection issue was independent stale fixture state.

## Changes

- I-1: Workspace `resource` is always the committed `graph.sourceUrl`; editing the source draft no longer triggers persistence. The input has `maxLength=2048`, an associated visible validation message, and rejection of oversized clipboard pastes. Interpretation also checks the bound. Cold restore uses the graph's committed URL.
- I-2: `preflightWorkspace` checks workspace/artifact/manifest schema bounds and the same aggregate 20,000,000 replay-work budget without integrating physics, regenerating surfaces, or checking digests. `validateWorkspace` preflights the complete untrusted record before full dynamics replay and manifest/digest validation. It remains the only cold restore path.
- Both `appendArtifact` and `persistWorkspace` enforce preflight. Appending includes the current world in the work budget; an over-budget candidate throws without modifying the old shelf. Autosave does not replace the existing localStorage record when the current world cannot fit. The existing 50-item count policy remains; records are never evicted to make the replay budget fit. No replay deduplication or budget increase was introduced.
- Artifact save writes valid JSON to localStorage before updating the UI shelf or announcing success. The latest workspace reference keeps sequential async saves from overwriting each other. A dedicated persistence notice takes precedence over routine interaction notices and directs the user to Export manifest when limits prevent persistence.
- M-1: Cold restore and artifact replay derive fixture identity from the restored graph's provenance plus known fixture URL. A public NASA source remains public even when its URL matches an authored fixture. The workspace provenance label reads graph provenance directly.

## Red evidence

The existing immutable production server on port 3000 was used only for browser reproduction. All three new browser regressions failed for the reviewed defects:

```sh
VISUAL_RUN_ID=persistence-limits-red-20261018 npx playwright test tests/e2e/persistence-limits.spec.ts --project=chromium > artifacts/reports/persistence-limits-red.log 2>&1
```

Result: 3 failed, 1 negative control passed (57.5 seconds). Long draft reload: expected 1 artifact, received 0. Eventful repeated saves: expected 46 retained artifacts, received 0 after reload. NASA replay after Restaurant: Restaurant `aria-pressed` remained `true`. Failure screenshots, traces, input-record attachments and JSON report are preserved in `artifacts/browser/persistence-limits-red-20261018/`, `artifacts/browser-report/persistence-limits-red-20261018/`, and `artifacts/reports/visual-playwright-persistence-limits-red-20261018.json`.

```sh
npx tsx --test tests/artifact-store.test.ts > artifacts/reports/persistence-unit-red.log 2>&1
```

Result: original cheap 52-save case passed; new combined-work append test failed with `Missing expected exception` on the 46th save. The persistence writer test also reported its then-missing helper. This establishes the previously absent enforcement before implementation.

## Green verification before rebuild

```sh
npx tsx --test tests/artifact-store.test.ts tests/conformance.test.ts
npm run typecheck
npm test > artifacts/reports/persistence-unit-green.log 2>&1
npm run typecheck > artifacts/reports/persistence-typecheck-green.log 2>&1
```

Result: initial scoped 13 tests passed; after the additional cold-restore-versus-preflight regression, the full suite passed 72/72. Both root and web TypeScript checks passed. Node coverage includes actual 14,800-tick eventful manifests, 45 accepted artifacts with full cold replay, refusal of artifact 46 without shelf mutation, rejected aggregate autosave growth preserving the prior JSON, oversized input/schema rejection, event-count bounds, and evidence that preflight does not replace integrated validation of untrusted trace hashes.

The three new browser regressions are ready for the parent-controlled rebuilt production server. Expected fixed eventful-save behavior is 45 accepted records, a visible refusal notice on save 46, and exact retention of 45 records after cold reload. Browser green results must come from that rebuilt server; this report does not claim them yet. Parent and browser-harness worker were notified that product source is frozen and ready to rebuild/review.
