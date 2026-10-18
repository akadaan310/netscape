# Chromatics and dynamics runtime evidence

Observed 2026-10-18, Node v24.19.0. Implemented contracts in `packages/chromatics/src/index.ts` and `packages/dynamics/src/index.ts`; both packages are independent ESM TypeScript with no runtime imports, Node dependencies, React, DOM, clocks, unseeded randomness, or semantic action callbacks.

## Verification

- `npx tsx --test tests/chromatics.test.ts tests/dynamics.test.ts`: 10 tests pass (4 color, 6 dynamics); final output `math-green.txt`.
- Before implementation the first eight tests failed because both SDK source modules were missing. Exact missing-feature run preserved in `math-red.txt`.
- Targeted strict TypeScript command passed: `npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --allowImportingTsExtensions packages/chromatics/src/index.ts packages/dynamics/src/index.ts tests/chromatics.test.ts tests/dynamics.test.ts`.
- Initial concurrent-workspace `npm test` observed 8 passing and 14 failing tests, preserved verbatim in `math-workspace-tests.txt`. Failing modules were conformance/core/performers (missing module/exports), renderer adapter safety/action tests, all three resource parsing tests, and all six public-fetch security tests. Those workers were implementing their modules concurrently; this is not a complete green integration claim.

Color tests cover black/white and red reference conversions, 84 saturated/out-of-gamut hues, finite gamut channels, inverse-transform lightness preservation to 1e-6, deterministic fields, independent seed/coordinate/tick/state/intent responses, 300 light/dark role palettes, malformed inputs, and a deliberate low-contrast negative control. Dynamics tests cover canonical node/edge order, same-tick event ID order, batched/single-step equivalence, seeded directions, detached snapshots, duplicate/stale/invalid events, invalid masses/coordinates/edge references/workloads, empty graphs, damping, diffusion, reduced motion, and a stiff/high-degree stress graph.

## Numerical choices and measured limits

Fixed timestep is 1/120 seconds. Position integration is semi-implicit Euler, with damping integrated as `v_next=(v+dt*f/m)/(1+6*dt)` followed by `x_next=x+dt*v_next`. Anchors add a quadratic 0.3*m restoring spring to each initial position. Effective edge stiffness is the minimum of requested/default stiffness, `36*m_a/degree(a)`, and `36*m_b/degree(b)`. The degree count includes parallel edges. This caps each linearized stiffness row sum divided by mass at 36; the mass-weighted graph Laplacian eigenvalue is at most 72 by its row-sum/Gershgorin bound. Anchoring raises the linear bound to 72.3. The dimensionless `dt²*72.3=0.0050208333` is far inside the semi-implicit undamped oscillator stability limit of 4 (implicit damping enlarges the scalar bound to 4+2*6*dt=4.1). This is a linear small-displacement rationale, not a proof of globally exact nonlinear integration.

Additional hard guards bound speed at 120 logical units/s and displacement from each initial position at 64 logical units. Boundary projection zeros velocity, preventing stored outward velocity from repeatedly hitting the boundary. Zero-distance edges choose a reproducible seeded direction instead of dividing by zero. Input coordinates, masses, rest lengths, stiffness, world sizes, event counts and tick work are bounded before integration. Public worlds expose only their tick; private state cannot be corrupted through snapshots. Maximum call is 10,000 ticks and 20 million node-plus-edge updates; oversized work throws rather than silently discarding elapsed time. All state arithmetic remains finite for accepted ranges and post-integration finite guards fail visibly if that invariant is broken.

Graph diffusion uses the degree-normalized neighbor mean: `phi_next = 0.842*phi + 0.15*neighborMean` (isolated node mean equals its own value). Coefficients are nonnegative and sum to 0.992, so phi in [0,1] remains in [0,1] at any graph degree and decays absent input. Normalized Laplacian eigenvalues in [0,2] give update eigenvalues in [0.692,0.992]. This averaging need not conserve an unweighted sum on irregular graphs; decay and bounded event injection are deliberate. Inputs saturate each node field at 1. Reduced motion retains this nonspatial field and tick/trace updates while freezing positions and suppressing impulses.

Measured results are retained with full final snapshots in `math-measurements.json`:

| Measurement | Observation |
| --- | --- |
| Two-node rest-length mismatch energy at tick 0 / tick 1000 | 1200 / 7.453416 |
| Final/initial energy ratio | 0.00621118 |
| Stress graph | 120 nodes, 119 star edges, requested stiffness 1e8, center mass 1e-6, 200 seeded events, 2000 ticks |
| Maximum observed stress energy | 0.3445 |
| Maximum observed displacement / speed | 64.0000005003 / 120.0000005061 after snapshot quantization |
| Observed field range during stress | 0.000001 to 0.984405 |
| Stress final trace hash | 24a45d14 |
| Stress measurement runtime, including per-tick snapshots and statistics | approximately 326 ms on this execution machine |

The anchored spring equilibrium has residual potential energy; damping does not imply zero total energy. Effective stiffness clipping intentionally changes extreme requested physical parameters. Speed/displacement bounds further prioritize usable interface motion over physical fidelity. No universal energy-conservation or unbounded-stiffness accuracy claim is made.

Events are sorted by logical tick then code-unit ID; IDs must be globally unique within a world and events cannot target an already processed tick. Node IDs and edges are sorted canonically. Every initial/stepped state is quantized to 1e-6 logical units before FNV-1a accumulation into the trace hash. Snapshots also use nearest-1e-6 rounding; vector magnitudes can consequently exceed a scalar guard by under 1e-6. Hashes are noncryptographic and collision-prone; compare snapshots/traces for stronger evidence. Replays are exact in the tested Node engine; no claim of cross-engine transcendental-function bit identity is made. `noteForEvent` only returns MIDI numbers (playful 72, focus 60, select 67); the host owns user-gesture and mute enforcement.

## Color model and accessibility

Conversion uses the published OKLab matrices, polar OKLCH coordinates, the standard sRGB transfer function and WCAG relative luminance weights. `oklchToRgb` returns raw channels so out-of-gamut inputs are observable. `gamutMap` holds lightness/hue constant and bisects chroma for 28 iterations, then removes at most a 1e-7 gamut tolerance at channel boundaries. For accepted maximum chroma 4, bisection uncertainty is below 1.5e-8. This is a simple chroma-reduction mapping, not the full CSS perceptual local-MINDE mapping and not a new color space.

The field combines an intent hash, seed phase, logical graph coordinates, event field state, and slow tick evolution into an OKLCH hue. Both mode palettes evaluate AA after sRGB byte rounding. Text/muted/accent are checked at >=4.5:1 against background and surface; border is >=3:1; accentText is the more contrasting of black and white. Hosts must supply noncolor labels/focus/state cues. This package supplies color roles, not an accessibility guarantee for arbitrary opacity overlays, typography, blend modes, or neighboring surfaces.

An additional 2000-palette sweep measured minimum text 15.2519, muted 6.9379, accent 6.6409, border 3.8758, accentText 7.6266. The deliberate `#777777`/`#888888` negative control measures 1.2633:1 and is correctly rejected by the AA threshold. Normal sRGB is the only supported output; HDR/wide gamut are intentionally absent.

## Established references and access status

These are established methods, not claims of novel mathematics:

- Björn Ottosson, *A perceptual color space for image processing*: https://bottosson.github.io/posts/oklab/
- W3C, *CSS Color Module Level 4*, OKLab/OKLCH and gamut mapping: https://www.w3.org/TR/css-color-4/
- W3C, *Understanding SC 1.4.3 Contrast (Minimum)*: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Ernst Hairer, Christian Lubich, Gerhard Wanner, *Geometric Numerical Integration*, Springer (2006), symplectic/semi-implicit Euler and oscillator stability. The scalar stability bounds and graph row-sum bounds above are explicit derivations for this implementation.

Direct Node fetches of all three web references were attempted in this environment and failed with `TypeError: fetch failed`; no live source retrieval or external numerical oracle is claimed. Reference formulas were implemented and verified against the stated color vectors, inverse transform and measured runtime properties.

## Persistence and cold replay extension

Added `WorldManifest={version:1;options:WorldOptions;events:DynamicsEvent[];tick:number;traceHash:string}`, `worldManifest(world)` and `replayWorld(manifest)`. Each world privately retains a deep-frozen clone of its original accepted options plus detached records of every accepted event, including already processed and still queued events. Export returns fresh copies. Replay validates the JSON object schema, exact version, options/events/counts, positive masses and bounded numeric values through the regular constructor/event API. It creates the initial world, queues events in canonical order, advances actual fixed simulation ticks in bounded chunks, and rejects any expected trace mismatch. It does not load positions, velocities, or event fields from snapshots.

Persistence budgets are 100000 ticks, 1000 accepted events, event timestamps at most 100000, and total `tick*(nodeCount+edgeCount)` at most 20 million updates. Both export and replay reject states exceeding these budgets; a host must visibly reset or start a new world if it wants to continue storing a longer session. Ordinary simulation retains its earlier per-call bounds and may run beyond persistence limits.

The two new tests first failed on missing replay exports (`math-replay-red.txt`), then passed (`math-replay-green.txt`). They demonstrate exact JSON-serialized replay at tick 60 after events at separated ticks 3 and 35, retain and subsequently execute an event queued at tick 80, preserve all fields/positions/energy/trace, resist mutation of original options and returned manifests, reject changed event strength/trace/version/NaN/Infinity/unknown fields/duplicate events/oversized counts/ticks, and reproduce a 20000-tick world through multiple bounded chunks. The trace is a noncryptographic reproduction check: it is not an authenticity signature, and pending events that have not yet affected state are not authenticated by it.

Final verification for this extension: all 12 math tests pass; targeted strict TypeScript passes. A fresh full `npm test` now passes 58/58 tests with zero failures, preserved in `math-replay-workspace.txt`. This supersedes the earlier concurrent incomplete-workspace failure as the latest observed integration test result.
