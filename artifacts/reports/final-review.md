# Independent final product review

Reviewed source checkpoint `992333068e2f5145ab1d26485409826a1d3b59a7`, the all-source diff since `10031d8`, the normative master/acceptance/constitution documents, and `docs/CONTRACTS.md`. Inspected application, API/transport, renderer, core/layout, dynamics, chromatics, performers, conformance, harness and deployment configuration. Product source was left unchanged. Focused probes used fresh, isolated Chromium contexts against the immutable production server at port 3000; no public website requests or external mutations were made.

## Critical

None found.

## Important

### I-1 — Editing a long URL silently makes all saved artifacts unrecoverable

**Locations:** `apps/web/app/Studio.tsx:43` (unbounded draft persisted as workspace resource), `apps/web/app/Studio.tsx:42` (invalid workspace removed), `packages/conformance/src/index.ts:108` (2048-character resource bound).

**Reproduction:** Open `/?test=1`; click Come here and Save cited artifact. Fill the source box with `'https://www.nasa.gov/?q=' + 'a'.repeat(2048)`; do not even submit. Navigate to `/` or reload. The persistence effect has written a 2072-character `resource`; validation rejects the entire record and deletes the saved artifact.

**Observed:** Before reload: `{artifactCount:1,resourceLength:2072}`. After reload: `{artifactCount:0,notice:'Saved workspace was damaged or incompatible. Recovered with a clean workspace; the invalid record was removed.'}`.

**Smallest fix:** Persist the committed `graph.sourceUrl` independently of the editable URL draft, or strictly bound that draft before it enters Workspace. An input limit can improve usability but should not be the only persistence invariant. Preserve valid artifacts if a transient draft field is invalid. Add a focused save/edit-long-input/reload regression.

**Impact:** An ordinary paste loses unrelated saved work, violating artifact persistence/reconstruction acceptance. Server URL validation does not prevent this because autosave occurs before submission.

### I-2 — Legitimate repeated saves exceed the aggregate replay budget and delete the entire shelf on reload

**Locations:** `apps/web/lib/artifacts.ts:7` (only count bounds the shelf), `apps/web/app/Studio.tsx:43` and `:47` (unconditionally persist/announce saved artifacts), `packages/conformance/src/index.ts:116` and `:121` (aggregate replay-work rejection), `apps/web/app/Studio.tsx:42` (whole-record deletion).

**Reproduction:** Open `/?test=1&tick=10000` with reduced motion; send 20 ripples; click Come here; save the same passage 46 times; navigate to `/`. All inputs and saved manifests are application-generated. The query's tick is an officially supported initial state; the equivalent state can be reached through additional ripples from zero.

**Observed:** Before reload: `{artifacts:46,tick:14800,replayWork:20172400,notice:'Cited artifact saved in this browser. Its source, digest, and reconstruction manifest are included.'}`. After reload: `{artifacts:0,notice:'Saved workspace was damaged or incompatible. Recovered with a clean workspace; the invalid record was removed.'}`. NASA has 15 nodes/14 edges, so the current world plus 46 artifact histories cost `47 * 14800 * 29 = 20,172,400`, above the validator's 20m cap. This is below the 50-artifact shelf and each individual world budget.

**Smallest fix:** Apply the same aggregate budget when constructing/persisting the shelf, with an explicit user notice and preservation of previously saved data. Alternatively, safely deduplicate identical dynamics replay work at validation; merely raising the cap postpones the mismatch. Do not run all cold replays on every animation frame. Add a regression with nonzero eventful manifests; the existing 52-save test uses a cheap state and misses this boundary.

**Impact:** The product reports successful saves that it later treats as corruption. This is a second independent data-loss trigger under the same acceptance requirement.

## Minor

### M-1 — Artifact replay leaves the previous source selection/provenance state active

**Location:** `apps/web/app/Studio.tsx:51`.

**Reproduction:** Save a NASA artifact, load Restaurant, click Replay source on the NASA artifact.

**Observed:** The restored graph title is `Worlds beyond our Sun · research notebook`, while the selected demo button remains `Restaurant / Menu` (`aria-pressed=true`). The replay callback updates graph/resource/seed/family but never `fixture`. The same code makes the workspace-level public-versus-fixture label stale when replay crosses those provenance kinds; the separate graph provenance banner remains correct.

**Smallest fix:** Update source-mode/demo identity from the replayed graph, deriving the public/fixture label directly from graph provenance. Resolve a known fixture identity where available; otherwise use the existing saved-fixture state. Add the cross-fixture replay assertion.

## Spec and quality verdict

**Request changes for the two reproducible persistence data-loss defects.** The main architecture is substantive and coherent: SDK modules are independent of Next.js; the app consumes typed graphs and operations; unsupported forms remain inert; source text is rendered through React rather than injected HTML; explicit external links have safe protocols and opener isolation; physics exposes no semantic callbacks; local companion status is clear. Six distinct wide-layout algorithms exist, with narrow flow rewrites and honest structural-equivalence reporting.

The HTTPS reader enforces exact hosts, raw authority restrictions, public-address validation across all DNS answers, pinned transport resolution, redirect revalidation, bounded bytes/time/MIME/encoding and no forwarded credentials. Per-process concurrency/rate limits and their distributed-hosting limitation are accurately documented. No actionable SSRF, secret exposure, automatic external mutation or fake live-model integration was found in the inspected paths.

Manifests bind graph/regions/actions/provenance and integrate event histories during actual replay. Noncryptographic digests and retained rather than recomputed palette roles are documented honestly. Source restoration and artifact construction need their persistence bounds reconciled, as above. Current minified one-line application/effect and stylesheet sections make maintenance harder, but formatting alone is not a blocking finding.

## Acceptance limits and evidence boundaries

- Parent-reported 69 Node tests, both TypeScript checks, SDK ESM/declaration build and compiled smoke, and Next production build were not redundantly rerun. The final 45-test browser suite and clean reconstruction were in progress at assignment; this review does not claim their final results.
- The two focused Chromium probes above provide new failure evidence beyond the existing suite. The three findings apply to the frozen reviewed checkpoint; any controlled fix wave needs targeted validation and an updated final checkpoint/evidence mapping.
- Checked-in local fonts, font hashes, text-scale probe, semantic DOM hooks, actual-CSS/axe audits, keyboard flow, negative controls and six-family/six-viewport browser harness are present. Final accessibility/visual claims depend on the completed run. Browser coverage is Chromium, not universal compatibility; visual self-baselines demonstrate reproduction, not independent aesthetic quality or H6 improvement.
- Research evidence explicitly reports limited structural diversity (14 SDK / 16 independent structural signatures across 1000 seeds) and does not claim 1000 unique layouts, scientific novelty, or broad usability.
- No live public ingestion was exercised by this reviewer. Authored fixtures and deterministic injected-transport tests establish local behavior; actual public-site availability is separately contingent on network and website behavior.
- Vercel instructions, no-secret environment example, monorepo tracing and production configuration exist. A successful Next production build establishes local deployable output, not a completed Vercel deployment. No live URL is established by this review.
- Manifest export is present; interactive import of an exported JSON manifest is not exposed. SDK/CLI replay and stored-artifact replay are the implemented reconstruction routes.

## Scoped fix-wave re-review — 2026-10-18

This section supersedes the change-request verdict for I-1, I-2 and M-1 above; their original reproduction evidence is retained. Reviewed the current working-tree diff from `9923330` for Studio, artifact storage, conformance, and their new unit/browser regressions. No product changes or full-suite reruns were made by this reviewer.

| Finding | Scoped status | Verification of implementation |
|---|---|---|
| I-1 | Addressed | Workspace construction persists `graph.sourceUrl`, independently of the editable draft. Restoration uses the committed graph URL. Input length/paste feedback and submission checks supplement the persistence invariant. A long draft can no longer make the stored `resource` invalid. |
| I-2 | Addressed | Append and write paths share the same bounds/aggregate-work preflight as cold restoration. The conservative 20m aggregate cap remains. Failed append/write preserves the previous shelf and storage; accepted UI artifact state and success messaging occur after successful persistence. Over-budget current-world autosave preserves the prior record and reports the limit. Cold/untrusted validation still checks digests, regenerated geometry and integrated dynamics. |
| M-1 | Addressed | Replay and restoration derive fixture identity from graph provenance and the three checked-in source URLs. The workspace public/fixture badge now reads graph provenance directly. All three mapped URLs match the fixture source file. |

No direct regression was found in this scoped code review. The bounds-only helper is appropriately limited to locally constructed records; it does not replace full untrusted restoration validation or replay. The added unit tests cover rejection before write, preserving the prior record, rejecting the 46th eventful artifact while retaining 45, and full restoration rejecting a corrupted trace that bounds-only preflight deliberately accepts.

Inspected `persistence-unit-green.log`: **72 tests passed, zero failed**. Inspected `persistence-typecheck-green.log`: root and app TypeScript commands completed without diagnostics. The three new browser regression cases are present; `persistence-limits-red.log` records their expected failures against the old production build. The new production build, targeted green browser rerun and full 48-case suite were still pending at this re-review, so this section establishes code-level resolution rather than claiming those later results. `persistence-fix.md` was not yet present when checked.

Reviewed source SHA-256:

- Studio: `48bd4aaf8839122721b41770d39971dbab943d89fb0f4db89bd94b1608b484b8`
- Artifact store: `3e1b37a1c1e365775e5e136c3b8e0cc095d666026ba801b46c3f350030184b4b`
- Conformance: `3cd969e456c9b65429e9cfd689f582ebc1aa6f23c595835864991fe86b9dec7d`
- Browser regressions: `9a8c28c83841a3a5acde4eff4ad7656f4fffb127ee04e422d795e8e52ddfe9ab`

Scoped verdict: **all three findings addressed; no remaining blocker from this review, subject to the pending production/browser verification.** Earlier acceptance boundaries about public ingestion, Chromium coverage, aesthetics, and undeployed Vercel output still apply.
