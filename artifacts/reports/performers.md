# Performers SDK evidence

Implemented `@netscape/performers` version 1.0.0, source-first ESM, depending only on core. The capability pack contains 20 implementations, not placeholder provider facades. See `packages/performers/README.md` for usage, all operations, and authority boundaries.

Selection → source context → deterministic cited local artifact → Markdown/JSON is executable. Graph projections provide counts, passages, safe links, and evidence-bearing inferred intent candidates. Link normalization/deduplication/reporting and text normalization/counting compose independently. Injected local storage and external resource reads have no default side effects. All operations have versioned runtime schemas, pre/postconditions, effects, capability requirements and products, determinism classification, declared failure modes, implementation provenance, and constitution clauses.

Composition rejects incompatible literal schema IDs at TypeScript compile time and at runtime. Pipeline preflight rejects authority escalation or missing capabilities before invoking any step. Runtime checks reject malformed inputs, dishonest output shapes, and failing postconditions. Only declared capabilities are provided to each operation. Trace reconstruction checks actual canonical snapshots, hashes, metadata, shapes, and chain continuity; failed executions retain preceding traces and explicit invocation status. Local artifact restoration rejects a different requested identity.

Evidence preserved:

- `performers-red.txt`: initial missing SDK module failure before implementation.
- `performers-hardening-red.txt`: three observed failures for partial failure trace preservation, unknown-performer reconstruction, and storage identity validation.
- `performers-static-red.txt`: observed unused expected-error diagnostic before static schema compatibility was implemented (also records concurrent experiments typing issues).
- `performers-green.txt`: 11 Node/tsx tests passing after implementation and source formatting.
- `performers-suite.txt`: latest complete repository npm test output: 52/55 passed. Three concurrently added resource-service tests failed: `fixture API returns evidence and explicit authored source notice offline` (400 versus 200), `public read succeeds through real interpreter and refused resource offers safe fallback` (400 versus 200), and `rate limiter bounds a process budget and resets at window boundary` (true versus false). These are outside performers ownership and were reported to integration. An earlier complete-suite checkpoint passed all 46 then-present tests.

Final `npx tsc --noEmit --pretty false` passed after schema-ID static guards were added.

No external service or network was contacted by performer tests. The external-read test uses an explicit injected deterministic transport function and checks result validation; this establishes capability gating, not live NASA availability. Storage tests use injected in-memory storage, checking real persisted values and restoration rather than pretending to persist through a server.

Limits: URL validation does not resolve DNS or replace the dedicated allowlisted fetch module. Intent candidates are transparent text rules, not AI responses. Trace hashes are noncryptographic and traces contain source data; reconstruction establishes internal consistency, not authenticity or independent proof of external action. Injected capabilities and custom performer code are trusted JavaScript, not sandboxed. Failed effects cannot be automatically undone. The SDK intentionally implements no login, checkout, live participant, remote AI, or default external mutation.

Constitution mapping: C-001 stable selection/evidence IDs; C-002 safe typed external target; C-003 explicit preflight authority; C-004 deterministic artifacts/canonical traces; C-007 source notices and inferred status; C-008 URL syntax checks plus delegated strict transport boundary; C-009 framework-independent browser-safe package; C-010 preserved failing runs and partial runtime traces; C-011 rejected unsupported schemes; C-012 local context makes no live-provider claim. Rendering contrast, physics, and full application fallback remain outside this package's enforcement scope.
