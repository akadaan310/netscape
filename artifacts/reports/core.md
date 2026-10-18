# Core SDK implementation evidence

Implemented `@netscape/core` as framework-independent browser-safe ESM TypeScript with exact shared contracts. No Next, React, DOM, network or clock dependency. Package exports source; root build owns bundles/declarations.

Determinism: canonical sorted-key JSON rejects cycles, nonfinite values, unsupported objects and depth over 100; 64-bit-shaped two-lane FNV content hash is explicitly noncryptographic; seeded Mulberry32 uses fixed-width integer operations. Source semantic IDs survive all rewrites and never depend on pixels.

Validation bounds graph size to 1,000 nodes, 10,000 edges and 1,000,000 text characters, validates kinds/actions/provenance and HTTP(S) node URLs, rejects duplicates, missing endpoints and containment cycles. Typed tree keeps each node once, uses first containment parent, and flattens nesting beyond depth 48. It preserves disconnected nodes under the resource.

Six wide algorithms are actual different packing rules: orthogonal column grid, elliptical angular anchors plus collision projection, degree-weighted golden-ratio masonry, alternating accordion insets, semantic containment swimlanes, and alternating binary area bands. Seed selects discrete grammar choices. Below 600 CSS pixels every family rewrites to vertical flow; equivalence therefore intentionally collapses. All regions follow graph source order for focus and preserve every supported action ID.

Regions reserve conservative reading room using Unicode character counts, explicit newline handling, 16px body / 26px leading, 20px label / 28px leading, 36px resource label / 40px leading, 24px padding, eyebrow and action/provenance footers. Desktop cards have at least 220px width. Extremely small supported viewport is 160px wide; smaller displays are explicitly rejected. Renderer should use `overflow-wrap:anywhere` and the stated typography bounds. Layouts scroll vertically and are not height-clipped to the viewport.

Structural signature excludes identity, graph ID, family label, seed, hashes and exact coordinates. It compares typed tree shape, coarse width classes and pairwise rectangle order with a 2px tolerance. It measures structural equivalence rather than novelty or aesthetic quality. Metrics are a bounded descriptive vector, not a scalar claim of beauty or a solved global optimum. Motion energy is zero for static initial layouts.

## Verification

- Test-first missing module failure preserved in `core-red.txt`.
- A subsequent real assertion failure for inadequate reading hierarchy/footer room preserved in `core-reading-red.txt`, followed by estimator correction.
- `node --import tsx --test tests/core.test.ts`: **8 passed / 0 failed**; output preserved in `core-green.txt`.
- Checks include replay equality, canonical hash/key order, seeded PRNG, malformed graph rejection, all identities/actions/focus order, six distinct actual wide geometries, honest narrow structural collapse, seed structure variation, semantic-edge perturbation, 36 family/display nonoverlap/bounds/target checks, long passage growth, malformed display and reading hierarchy.
- `npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --allowImportingTsExtensions packages/core/src/index.ts tests/core.test.ts`: passed.
- Whole workspace suite during parallel implementation: **32 passed / 6 failed**. All six failures were known unfinished resource-interpreter fetch stubs: exact HTTPS allowlist; public IP validation; private DNS rejection; address pinning/redirect/cookie protection; MIME/body/redirect-loop limits; timeout bounds. These files are owned by another agent; failures were reported to coordinator. This observation is not a final workspace status.

Limitations: text heights are conservative estimates, not browser measurements. Final browser harness must verify actual fonts and CSS. Structural equivalence is intentionally coarse and can merge visibly different compositions; many seeds reuse finite grammar choices. No claim that 1,000 seeds means 1,000 novel usable interfaces. No global Pareto optimizer or perceptual/aesthetic judgment is claimed. Geometry constraints and action preservation are tested independently of renderer behavior; browser action reachability remains integration evidence.

Additional independent synthetic stress run: 1 Resource + 25 long Text nodes, 1,000 seeds per family at 1440x900, pairwise rectangle overlap oracle: all **6,000 surfaces had no overlaps**. Observed structural equivalence counts: observatory 4; orbital 2; elastic 2; folded 1; workbench 3; chromatic 2. Folded's inset variants merge under coarse equivalence, as intended for honest conservative measurement. Observation retained in `core-stress.txt`; final fixture-based experiment is owned by the integration harness.
