# Technical Blueprint
Monorepo: apps/web (Next.js TS), packages/core (graph, grammar, typed IR), packages/chromatics, packages/dynamics, packages/performers, packages/resource-interpreter, packages/render-react, packages/conformance, fixtures, experiments, artifacts, scripts. Adjust names only with documented reason.

Flow: URL -> safe fetch/fixture -> semantic graph -> intent candidates + evidence -> typed IR -> seeded grammar -> constrained layout -> chromatic field -> physics snapshot -> React rendering -> typed contextual action -> saved artifact -> deterministic replay.

Use React as one adapter, not foundational math. Future adapters for React Native/DOM/Canvas are contracts, not required working implementations. Use canonical JSON hashes, schema versions, deterministic PRNG. Persist local workspace via IndexedDB/localStorage with migration/versioning; no secrets. Optional server persistence only if configured. PURL/ACSP/SEURL/SubstrateIO/CGT/GiN are optional research adapters, not old Golden Surface dependency.

A Vercel web app cannot render every arbitrary website in an iframe, bypass CSP, or access signed-in third-party AI sessions. Prefer interpreted public-resource view plus external-open fallback. Never imply browser-equivalent navigation fidelity.
