# Resource interpretation and public fetch · observed implementation

Implemented `@netscape/resource-interpreter` as a source-first ESM TypeScript package. `.` imports only parse5 and browser-safe core; `./fetch` contains Node DNS/HTTPS imports. No third-party HTML, scripts, forms, or button handlers are executed or returned for HTML injection.

## Interpretation

The inert parse5 tree is bounded to 1,048,576 input characters, 20,000 visited nodes, 180 semantic nodes, and 1,800 characters per extracted passage. Source title, headings, paragraphs/list entries, safe HTTP(S) links, forms/buttons, selected metadata, and a small JSON-LD subset are interpreted. Hidden attributes, templates, script/style contents and embedded execution surfaces are excluded from visible passage extraction. Supported JSON-LD values are copied as strings, never evaluated.

Each semantic node has source evidence. Resource identity derives from source URL and the core's deterministic, explicitly noncryptographic content hash; extraction order is deterministic. Exact fetched time can be supplied for replay. Research/commerce/repository hypotheses retain the semantic IDs that caused the inference and explicitly use `status: inferred`.

Source forms and buttons remain detected, unsupported affordances. Each actual text passage supports local typed selection. The three separate interpreter-owned capabilities are passage selection, attachment of a **local simulated** companion, and creation of a cited local artifact. Safe source links support explicit navigation. There is no checkout, form submission, external AI connection, code execution, or implicit remote mutation.

All three fixtures contain 15 semantic nodes and pass core `validateGraph` without errors:

| Fixture | Primary inferred intent | Core content hash |
| --- | --- | --- |
| NASA exoplanets / Webb research notebook | research | b5053b7ecfcd269a |
| Fictional Juniper Table seasonal menu | commerce | e2bce6a6c878808a |
| Fictional GitHub field-notebook file listing | repository | 4354abb8b1a0d604 |

Each fixture prominently identifies itself as local authored teaching material. NASA prose claims no new finding, counts or dates. Restaurant prices and repository files are explicitly fictional; repository navigation may point to unavailable fictional resources. Live links are only outbound reading paths, not evidence of a fetched snapshot.

## Fetch security boundary

Only exact `www.nasa.gov`, `nasa.gov`, `science.nasa.gov`, and `github.com` HTTPS authorities are accepted. Userinfo, explicit ports including 443, IP literals, encoded hostname aliases, trailing-dot aliases, whitespace, control characters and backslashes are rejected before normalization can obscure them. URL length is bounded and fragments are removed.

All DNS answers must be public; mixed public/private answer sets fail before transport. IPv4 private, loopback, link-local/metadata, shared-address, documentation, benchmark, multicast and reserved space is denied. IPv6 is restricted conservatively to global unicast with special protocol/documentation/6to4 ranges denied. IPv4-mapped IPv6 is denied, including its hexadecimal form. The validated first address is pinned in Node HTTPS's lookup callback. TLS hostname and certificate checking use the allowlisted hostname. No caller-controlled request headers, credentials or cookies enter the transport.

Every redirect authority and every new DNS answer set is revalidated. At most four redirects, one eight-second total deadline, one MiB of body bytes, successful HTTP status, HTML/XHTML MIME and identity content encoding are required. Both declared and streamed body sizes are bounded. Rejecting compressed bodies supplies a decompression limit of zero compressed inputs. Streams are destroyed on redirects, rejection, completion or timeout. The application endpoint must provide its own rate limiting; the fetch helper itself is deliberately transport-only.

## Actual verification and limitations

- `resource-red.txt` preserves nine initial failing tests against explicit missing-feature stubs.
- `resource-selection-red.txt` preserves a later failing assertion showing actual passages lacked typed selection; implementation then added the action.
- `resource-green.txt`: **10/10** resource and security tests passed.
- Final captured `resource-suite-check.txt`: **51/51** repository unit tests passed at that checkpoint. Earlier intermediate performer failures were reported to the parent and resolved by the owning worker.
- A prior root typecheck passed. The latest captured `resource-typecheck.txt` reports concurrent work outside this module: `experiments/run.ts:77` missing `SemanticNode.label` and invalid `PassageContext`, plus an unused `@ts-expect-error` in `tests/performers.test.ts:54`. These were reported to their owners; resource interpreter and security files have no reported type errors.
- Hostile DNS, redirect, size/MIME/encoding and deadline tests use injected deterministic resolvers/transports. These test the production policy and prove a validated address is passed to transport; they are not live DNS-rebinding or external penetration tests.
- A real `fetchPublic('https://science.nasa.gov/exoplanets/')` attempt resolved the public address `192.0.66.161`, then failed with `connect ECONNREFUSED 192.0.66.161:443` after approximately 5.1 seconds. No live NASA HTML was acquired, and no live-network success is claimed. The direct HTTPS implementation fails safely under this environment's connection policy; fixtures remain fully usable.
- UTF-8 decoding and static source interpretation do not reproduce dynamic JavaScript pages, login states, rendered CSS visibility, or external service functionality. Unsupported resources must use the application's visible fallback and explicit external-open action.

## Review follow-up: unreachable capabilities and URL bounds

Independent review found that empty/title-only/link-only/form-only sources could advertise passage-context actions without a real passage. `resource-empty-red.txt` records the failing regression assertion. The interpreter now adds the local selection, simulated-companion, and save-artifact Action nodes only when it extracted at least one nonempty Text passage. Detected source forms/buttons remain unsupported, and valid source links remain navigable. All three authored fixtures are unchanged. The application owner was notified to disable or omit global passage controls when no passage exists.

The same review identified a mismatch with the hardened core URL length contract. `resource-url-limit-red.txt` records the regression failures. The interpreter now rejects source URLs above 2048 characters after URL encoding and omits oversized link destinations. The public fetch validator rejects oversized raw inputs and normalized/encoded URLs. Short Unicode inputs that expand beyond the limit are covered; destinations are never truncated. The long-link regression also verifies the resulting graph passes `validateGraph`.

These follow-up results supersede the earlier checkpoint counts/typecheck limitations above: **13/13 resource/security tests passed; 69/69 repository unit tests passed; root SDK and application typechecks passed**. Fresh output is stored in `resource-green.txt`, `resource-suite-check.txt`, and `resource-typecheck.txt`. No live fetch success is added by these local tests.
