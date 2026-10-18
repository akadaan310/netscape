# @netscape/performers

Browser-safe, framework-independent TypeScript operations. This package implements 20 actual operations, grouped into a versioned capability pack; it does not provide network or persistence infrastructure.

```ts
import { PERFORMERS as P, PIPELINES, compose, runPipeline, reconstructTrace } from '@netscape/performers';

const { output: artifact, trace } = await runPipeline(
  PIPELINES.selectionArtifact,
  { graph, nodeId: selectedSemanticId },
);
const { output: markdown } = await runPipeline(compose(P.artifactMarkdown), artifact);
const inspection = reconstructTrace(trace); // verifies snapshots, metadata, and chain; no side effects
```

`compose(...steps)` validates adjacent versioned schema identities. Literal schema IDs also reject incompatible built-in chains in TypeScript, including operations whose underlying values are both strings. `runPipeline` validates runtime shapes, preconditions, output shapes, and postconditions. It preflights **every** declared effect and required capability before invoking the first step. Pure authority is implicit; each other effect must be granted explicitly, and granting one effect never grants another.

Local storage is an injected capability with explicit authority:

```ts
const capabilities = {
  'artifact.write': (value: unknown) => {
    const artifact = value as Artifact;
    localStorage.setItem(artifact.id, JSON.stringify(artifact));
    return artifact;
  },
  'artifact.read': (id: unknown) => JSON.parse(localStorage.getItem(String(id)) ?? 'null'),
};
const saved = await runPipeline(compose(P.saveArtifact), artifact, {
  authority: ['local-state'], capabilities,
});
```

Import the exported `Artifact` type for this example. Restoration validates artifact shape and requested identity. Storage errors propagate as `PipelineExecutionError`. No storage is touched unless the caller provides a capability.

`fetchResource` similarly requires `authority: ['external-read']` and a `resource.read` function returning `{url, html, notice}`. The caller must use a DNS-validated, redirect-validated, bounded allowlisted transport such as the resource-interpreter's server transport. `validateURL` only validates normalized credential-free public-looking HTTP(S) syntax; it is **not** DNS validation or permission to fetch. HTML returned by the capability is data and is never executed or rendered here. No built-in performer performs external mutation.

Available operations:

| Input | Operations |
| --- | --- |
| Text / URL | validateURL, externalTarget, fetchResource, normalizeText, textStats |
| Semantic graph | validateGraph, graphSummary, graphPassages, graphLinks, graphIntentCandidates |
| Selection | selectPassage, selectionContext, contextArtifact |
| Artifact | validateArtifact, artifactMarkdown, artifactJSON, saveArtifact, loadArtifact |
| Links | uniqueLinks, linksMarkdown |

`PIPELINES` includes selection-to-artifact, selection-to-Markdown, validated graph summary, and unique source-link Markdown. Intent candidates are modest rule-based inferences over existing semantic text, with evidence IDs, confidence, and `status: 'inferred'`; they are not language-model output. Context extraction and cited artifacts quote the selected passage and retain its provenance.

Every performer exposes schemas with validators, pre/postconditions, effects, requires/provides, determinism, failure modes, provenance, and constitution clauses. `definePerformer` supports extending the trusted registry with the same contract. It is not a JavaScript sandbox: custom implementations and injected capabilities must truthfully describe and enforce their effects. Required capabilities must be explicitly supplied own function properties. Each step receives only its declared capability names in a frozen dictionary with no prototype.

Successful traces contain canonical input/output snapshots, content hashes, schema IDs, operation versions, declared effects/capabilities, and an executed status. The runner clones JSON values between steps. `reconstructTrace` validates known operation metadata, shapes, hashes, and chain continuity without repeating storage or network effects; custom operations can supply a registry as its second argument. Reconstruction checks the recorded chain only: it does not rerun even pure operations, independently establish that outputs were computed by their declared operations, authenticate provenance, or prove execution. A writer who changes snapshots and recomputes ordinary hashes can produce another valid record. Hashes are deterministic noncryptographic content identifiers, not signatures or proof that an external service was contacted. Traces contain actual input/output content and should be stored with the same care as source data.

When execution fails, `PipelineExecutionError.trace` preserves preceding successful steps, while `failure` identifies the performer, failure phase, and whether its implementation was invoked. A side effect cannot be rolled back automatically after execution or output validation failure. Preflight errors invoke no steps. Time, randomness, network, and local storage are absent from pure operations.
