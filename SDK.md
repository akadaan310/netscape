# Computational morphogenesis SDK

The SDK is independent of Next.js. React is a single renderer adapter, not a dependency of graph generation, dynamics, chromatics, interpretation, performers or conformance. Workspace packages export TypeScript source for bundlers; `npm run build:sdk` additionally emits ESM, source maps and TypeScript declarations in each `packages/*/dist` directory.

```ts
import {generateSurface} from '@netscape/core';
import {interpretHTML} from '@netscape/resource-interpreter';
import {field} from '@netscape/chromatics';

const {graph,intents}=interpretHTML(html, 'https://www.nasa.gov/', {
  kind:'fixture', fetchedAt:'2026-10-18T00:00:00.000Z'
});
const display={width:390,height:844,dpr:1,
  input:['keyboard','touch'] as ('keyboard'|'touch')[],
  reducedMotion:true,colorScheme:'light' as const};
const surface=generateSurface(graph,{seed:7,family:'orbital',display});
const palette=field({seed:7,x:0,y:0,tick:0,state:0,
  intent:intents[0].kind,mode:'light'});
```

`core` provides typed graph validation, a bounded rewrite tree, six composition algorithms, display constraints and canonical content identities. Its 64-bit two-lane hash detects ordinary content changes and supports reproducibility; it is **not cryptographic authentication**. Experiment fixture/result digests use independent Node SHA-256.

`chromatics` uses OKLCH, fixed-iteration chroma bisection into sRGB, quantized role-contrast correction and semantic/event color projection. `dynamics` uses 1/120-second semi-implicit spring/damper integration, positive-mass validation, degree-aware bounded diffusion, sorted typed events and quantized traces at 1e-6. Dynamics has no facility for dispatching semantic actions. Its `worldManifest` / `replayWorld` round-trip initial options and accepted event history, then reproduce and verify the actual trace within declared work limits.

`resource-interpreter` parses untrusted HTML inertly and retains text, metadata, evidence, detected affordances and inferred intents. Its browser-safe entry point never imports Node networking. `@netscape/resource-interpreter/fetch` is a separate Node-only exact-allowlist reader; see [DEPLOYMENT.md](DEPLOYMENT.md) for transport limits.

`performers` contains twenty real operations, schema-aligned composition, explicit effect authority and injected storage/network capabilities. See [packages/performers/README.md](packages/performers/README.md) for examples. Trace reconstruction checks record consistency; a record is not independent proof that a remote service ran or that arbitrary injected JavaScript is pure. Custom JavaScript performers are trusted code, not a sandbox.

`conformance` audits geometry and action maps, validates versioned workspace/reconstruction records, and binds replay to recorded source and display. `render-react` renders escaped source text and native typed controls; it revalidates outbound URL protocols and never injects fetched HTML. Future native/canvas adapters are contracts only and are not implemented.

Reproducibility is defined for the same input, grammar/schema versions, seed, display, event sequence and quantized numerical trace. Browser pixels use bundled, licensed fonts with file SHA-256 checks and are tested in the recorded Chromium environment; no universal browser or cross-platform bitwise floating-point claim is made. Structural uniqueness, visual fidelity, usability and aesthetic judgment are reported separately. `npm run smoke:sdk` executes compiled ESM with Node's TypeScript stripping disabled.
