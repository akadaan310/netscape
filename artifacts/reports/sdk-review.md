# Independent SDK and server review

Reviewed 2026-10-18 against `docs/CONTRACTS.md`, numbered SDK mission files, `09_CONSTITUTION.md`, `artifacts/reports/sdk-review.diff`, and actual package/server sources. Product files were not changed. Existing captured green suites were read; the whole suite was not rerun. Focused, executable review probes are retained in `sdk-review-probes.ts` with observed output in `sdk-review-probes.txt` (`npx tsx artifacts/reports/sdk-review-probes.ts`).

## Findings requiring changes

### 1. P2 — Replay accepts changed semantic content and corrupted manifest fields

Locations: `packages/conformance/src/index.ts:43`–49; `packages/core/src/layout.ts:103`–104.

Create a graph from `<title>One title</title><p>Original text</p><a href="https://example.org/a">Read</a>`, generate a folded surface at seed 1 and width 768, and create a manifest. Change only the Link node's URL to `https://evil.example/phishing`. `replayManifest(manifest)` succeeds and retains the original surface digest. The digest covers surface identities, roles, required-action IDs and geometry, but not actual link targets, action types, source content or provenance. Changing a same-sized passage/label similarly need not change geometry. Comparing `graph.provenance.contentHash` with another copied value from the same graph does not detect a changed graph.

Separately, replace `tick` with `-Infinity` (or a negative JSON number), `expectedRegions` with `"corrupt"`, `interactions` with `[{id:"x",action:"checkout"}]`, `hardInvariants` with `[]`, and manifest `provenance` with `{kind:"made-up"}`. Replay still succeeds. These fields are neither validated nor verified against regenerated state.

Impact: a replay can present altered actions/content with an unchanged claimed identity, and malformed saved replay metadata is accepted. This violates corruption-detection and deterministic-replay expectations, not cryptographic authenticity: hashes are explicitly noncryptographic and cannot establish trusted provenance against an attacker able to recompute them.

Smallest coherent fix: version the manifest format; store a canonical semantic-graph digest and a digest over all replay-relevant manifest fields; detach stored snapshots from mutable inputs. Validate runtime field shapes and limits before use. Verify regenerated regions/action maps and declared provenance/invariants, and reject unsupported/bad tick/color-state fields. Keep integrity claims limited to corruption detection. A surface geometry digest alone should not be described as semantic/resource integrity.

### 2. P2 — Graph validation permits required actions which the renderer cannot expose

Locations: `packages/core/src/graph.ts:25`–29; `packages/render-react/src/index.tsx:15`–20; `packages/core/src/layout.ts:103`.

Append `{id:"missingURL",kind:"Action",label:"Open",action:"navigate",supported:true}` to any valid graph. `validateGraph` returns `[]`; `generateSurface(...).requiredActions` contains `missingURL`; the renderer emits an inert `div` because no safe URL is present. The same mismatch occurs for either external-open action with a missing target.

For each of Resource, Section, Group and Form, set `action:"save-artifact",supported:true`. Each graph validates and lists the node as a required action, but renderer branches for these roles bypass button/link creation. The probe checks all four roles and finds no rendered `data-action`.

Impact: a successfully validated/generated graph violates required-action reachability and C-002. Current interpreter fixtures do not create these shapes, but public SDK graphs and restored untrusted graphs can.

Smallest fix: define one shared role/action compatibility rule, require a safe HTTP(S) string URL for active navigation/external-open actions, and use that rule in graph validation and rendering. Explicitly reject executable actions on roles rendered as containers/detected forms, or intentionally render them as actual controls. Add boundary cases to the action-map test.

### 3. P2 — Workspace validation is not a strict, total runtime type guard

Locations: `packages/conformance/src/index.ts:54`–65.

`validateWorkspace({version:1,seed:1,family:"orbital",resource:"nasa",graph:null,selectedId:{bad:true},attached:"yes",artifacts:[]})` returns true. Falsy non-graphs bypass `if(w.graph)`, and selectedId/attached are unchecked. This narrows values to types the runtime data does not satisfy.

A second JSON-only reproduction uses an otherwise shape-valid artifact (`manifest:{version:1}`, `digest:"bad"`) and an extra property holding 120 nested arrays. Validation throws `Error: Canonical value exceeds depth 100` at line 63 instead of returning false; the hashing call sits outside the try/catch. Cyclic/nonfinite in-memory values similarly throw. The manifest replay catch does not cover the digest computation.

Impact: malformed saved state can be accepted or escape the validation API as an exception, preventing reliable recovery and exposing downstream consumers to incompatible values.

Smallest fix: check optional-property presence using `!== undefined`, validate boolean/string optional fields and selection identity, and reject non-object/non-plain workspace/graph shapes. Catch all canonicalization/digest/replay errors inside this validator and return false. Bound accepted strings, metadata/evidence and nested unknown properties, or project only the known versioned schema before hashing/using data. Add malformed JSON-shaped restoration cases, not only null/version/NaN tests.

### 4. P3 — Missing capabilities can resolve through Object.prototype

Locations: `packages/performers/src/index.ts:270`, 279–280, 299.

Define a trusted extension from normalizeText with `requires:["constructor"]` and an executor which inspects `context.capabilities.constructor`. Run it with no supplied capabilities. Preflight succeeds, the executor sees a function, and the trace claims the capability was required and supplied. `constructor`, `toString` and similar names are inherited from the ordinary object used for capability lookup. Existing built-in capability names do not collide, so this is an extension API correctness issue; it does not create a sandbox or remote-effect bypass by itself.

Smallest fix: construct null-prototype capability maps and require `Object.hasOwn(capabilities,required)` as well as a callable value. Use the same own-property semantics when passing each step its declared subset.

## Additional limits and incomplete specification coverage

- `validateGraph` does not validate graph sourceUrl safety, the supported schema version, or a parseable provenance timestamp. The probe sets version `999`, sourceUrl `javascript:alert(1)`, and fetchedAt `never` and receives no errors. Node URLs and renderer links are sanitized separately, so no executable-link injection was found from this case. Tighten these fields as part of restoring untrusted graphs and future schema migration; tests currently intentionally use graph version `1`, so compatibility policy needs an explicit decision rather than an accidental exact-version change.
- Evidence arrays are checked as strings but not checked for valid semantic targets. Metadata, evidence and extra object fields lack a graph-wide byte/depth budget. Node/edge counts and passage text are bounded; claims of completely bounded untrusted object validation should acknowledge these remaining fields.
- `reconstructTrace` verifies known operation metadata, shape, canonical snapshots, hashes and chain continuity. It does not establish that the declared pure computation produced its output: replacing normalizeText's output with `"invented"` and recomputing its ordinary content hash passes reconstruction. README correctly disclaims execution/authenticity proof. Do not label reconstruction as independently verified execution; optional deterministic pure-step replay could provide stronger semantic checking without redoing effects.
- The 20 built-in performers perform real transformations or invoke explicit caller-supplied storage/read capabilities; no fabricated remote services were found. The mission's longer URL→fetch→parse→semantics→intent→surface→save example is not implemented as one performer pipeline: parse/layout are separate SDK APIs. This is a composition coverage limitation, not a claim that those functions are absent.
- Core exposes a vector of layout metrics and six real layout algorithms. It does not search/optimize a Pareto frontier itself; any Pareto analysis is in the experiment harness. Legibility/grouping are proxies, not validated readability/aesthetic scores.
- Constitution exports clause IDs and revision, but that alone is not the requested artifact→enforcement→test→evidence→status mapping. Root acceptance evidence needs to provide that mapping and retain incomplete statuses.
- UTF-8 static HTML parsing, a small JSON-LD subset, unsupported dynamic/login resources, no HDR/WASM, and no cross-engine bit-identical transcendental math are documented limits, not silently implemented features.

## Module compliance and quality verdict

| Module | Verdict | Evidence / practical limit |
| --- | --- | --- |
| core | Substantial contract coverage; changes required at untrusted action boundary | Pure seeded generation, 1000-node/10000-edge validation, bounded depth rewrite, six distinct actual solvers, stable identities and structural metric. Deep containment probes 47–60 levels succeeded without recursion/hash failure. Finding 2 and incomplete graph field validation remain. |
| chromatics | Satisfactory for defined role palette | Pure established OKLCH/sRGB math, fixed bisection, byte-quantized contrast correction, role checks in light/dark. Existing captured tests/evidence cover negative controls and 2000-palette sweep; arbitrary CSS combinations remain host responsibility. |
| dynamics | Satisfactory within declared numerical/work bounds | Private WeakMap state, fixed dt, canonical event/node ordering, positive mass, degree-capped stiffness, displacement/speed clamps, stable normalized diffusion, bounded ticks/events and no semantic callbacks/DOM/clocks. Captured stress/trace evidence is substantive and limitations are explicit. |
| resource interpreter | Satisfactory for bounded static extraction | parse5 inert tree, no returned injectable markup, ignored active content, text-only metadata/JSON-LD, safe outbound URLs, typed local actions and inferred intent evidence. Raw parser allocation is bounded by input size; traversal budgets apply after parsing. |
| public fetch + server service/route | Satisfactory security design for the specified allowlist; no material bypass found | Raw exact HTTPS authority check; all DNS answers public; address/family pinning with TLS hostname verification; every redirect/DNS revalidated; no user headers/cookies; byte/MIME/encoding/redirect caps and whole-fetch deadline. Route adds per-process rate and concurrent-read limits; distributed rate limiting is explicitly a hosting responsibility. No live network success or penetration-test result is claimed. |
| performers | Good built-in runtime/type/effect coverage; minor extension boundary correction | 20 useful operations, literal schema IDs, runtime shapes, effect/capability preflight, detached JSON step values, output/postcondition checks and failure traces. Finding 4 remains; custom performers/capabilities are trusted implementations rather than sandboxed code. Trace reconstruction limits above apply. |
| conformance/persistence | Changes required | Geometry and action negative controls are useful; replay/persistence boundary does not yet validate what its types and integrity labels imply. Findings 1 and 3 are the acceptance blockers. |
| render-react | Safe text/URL handling for valid interpreter output; action-boundary correction required | No raw HTML injection; URLs revalidated and outbound links use noopener/noreferrer; semantic order comes from regions. Finding 2 prevents a general required-action guarantee. |

Overall: substantial functional SDK implementation, with credible deterministic dynamics/color/fetch defenses and no invented live capabilities. Request changes for replay integrity, action compatibility, and strict corrupted-workspace handling before general untrusted restore/replay acceptance. Findings are based on executable probes, not a replacement for the root's final integrated verification.

## Scoped re-review after hardening

Re-reviewed the four original findings against current core, conformance and performer fixes on 2026-10-18. This section supersedes the original request-changes status for those findings. Product files were not edited and no full suite was rerun. Re-executed original probes (`sdk-re-review-probes.txt`) and additional focused assertions (`sdk-re-review.ts`, output `sdk-re-review.txt`). Existing test changes were read. The hardening narrative was not yet available at the start of this re-review.

| Original finding | Verdict | Independently checked result |
| --- | --- | --- |
| 1. Semantic/metadata replay integrity | Addressed | Manifest v2 binds a detached graph snapshot using graphHash and all manifest fields using integrityHash. A changed link destination rejects. Invalid tick, geometry, interactions, provenance, invariants and color fields reject. Geometry/interactions/provenance/invariants still reject when the ordinary manifest digest is recomputed because regeneration/equality checks independently enforce those relationships. JSON round-trip replay of valid manifests succeeds. Caller mutations to graph/surface/display do not alter saved snapshots. |
| 2. Required actions unreachable | Addressed | Resource, Section, Group and Form with active save-artifact reject during graph validation. Both navigate and open-external without safe URLs reject. The new role/action compatibility policy is narrower than renderer capability but consistently prevents the reported inert required controls. Unsupported detected affordances remain inert and excluded from requiredActions. |
| 3. Workspace permissiveness/exception escape | Addressed | graph:null/false/0/empty string, object selectedId, string attached and malformed nested artifact data now return false. Presence checks use !==undefined, optional fields are typed, unknown schema fields reject before hashing and exceptions are contained. Existing workspace uint seed policy remains explicit. |
| 4. Inherited capability lookup | Addressed | Missing or inherited constructor/toString/__proto__ functions reject before invocation. Explicit own functions with those names work. Per-step capabilities have a null prototype and include declared own functions. |

The graph validator also now rejects unsupported version 999, javascript sourceUrl and malformed fetchedAt, while deliberately preserving legacy schema spelling `1`. Added evidence/metadata size limits and strict persisted-graph schema keys improve the previously noted boundedness gap.

One small direct regression was found in the fix: `packages/conformance/src/index.ts:80` uses `uint(manifest.seed)` in v2 replay validation, while core generation deliberately accepts any safe integer seed. Seeds `-1` and `4294967296` both produce valid surfaces but `createManifest` now throws `Invalid replay schema`; these worked in the original manifest implementation. Recommendation: use `Number.isSafeInteger(manifest.seed)` for surface manifests to match core. This is P3 SDK interoperability, with no security effect; the application's pre-existing uint workspace policy can remain distinct. Reproduction is retained at the end of `sdk-re-review.txt`.

The ordinary trace reconstruction/authenticity limitation remains accurately documented and is not reopened as a security finding. Dynamics WorldManifest support was inspected only at the conformance import/schema/integrity boundary; broader dynamics API and app integration are outside this scoped re-review. No further regression in the four reported boundaries was found.
