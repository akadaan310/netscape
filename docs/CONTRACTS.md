# SDK contracts · v1

The numbered mission files are normative. Local implementation and commits are authorized. The user subsequently explicitly authorized creating a GitHub repository and pushing delivery to main. Public deployment is not requested; unrelated third-party mutations remain outside scope. All packages are ESM TypeScript, independent of Next.js; only render-react depends on React. Source-first workspace exports; `build:sdk` also emits bundled ESM and declarations to each package's dist directory. Tests use Node's test runner through tsx. Never edit another worker's module.

## Core (`@netscape/core`)

Export `SCHEMA_VERSION`, `GRAMMAR_VERSION`, `FAMILIES` (six string literals `observatory`, `orbital`, `elastic`, `folded`, `workbench`, `chromatic`), `Family` type, `canonical(value):string`, `hash(value):string` (browser-safe deterministic content hash, explicitly not cryptographic), `createRandom(seed:number):()=>number`.

`NodeKind = 'Resource'|'Section'|'Text'|'Link'|'Form'|'Action'|'Artifact'|'Participant'|'Evidence'|'Group'`.
`SemanticNode = {id:string;kind:NodeKind;label:string;text?:string;url?:string;action?:ActionType; supported?:boolean; evidence?:string[];meta?:Record<string,string>}`.
`ActionType = 'open-external'|'select-passage'|'attach-companion'|'save-artifact'|'navigate'`.
`SemanticEdge = {from:string;to:string;kind:'contains'|'references'|'navigates'|'derives'|'observes'|'acts_on'}`.
`SemanticGraph = {version:string;id:string;title:string;sourceUrl:string;nodes:SemanticNode[];edges:SemanticEdge[];provenance:{kind:'fixture'|'public';fetchedAt:string;contentHash:string; notice:string}}`.
`Intent = {kind:'research'|'commerce'|'repository'|'general';confidence:number;evidence:string[];status:'inferred'}`.
`Display = {width:number;height:number;dpr:number;input:('keyboard'|'pointer'|'touch')[];reducedMotion:boolean; colorScheme:'dark'|'light'}`.
`SurfaceNode = {id:string;semanticId:string;role:'resource'|'section'|'text'|'link'|'form'|'action'|'artifact'|'participant'|'evidence'|'group';children:SurfaceNode[]}`.
`Region = {id:string;semanticId:string;x:number;y:number;width:number;height:number;order:number}`.
`Surface = {version:string;graphId:string;seed:number;family:Family;tree:SurfaceNode;regions:Region[];width:number;height:number;topology:string;requiredActions:string[];metrics:{compactness:number;legibility:number;whitespace:number;grouping:number;motionEnergy:number};hash:string}`.
Export `validateGraph(graph):string[]`, `generateSurface(graph, {seed:number;family:Family;display:Display}):Surface`, `structuralSignature(surface):string` (must exclude seed, hashes and coordinate noise; measures equivalence honestly).

## Resource interpreter (`@netscape/resource-interpreter`)

Depends on core. Browser-safe `interpretHTML(html:string,url:string,options?:{kind?:'fixture'|'public';fetchedAt?:string}):{graph:SemanticGraph;intents:Intent[]}`. Never execute HTML or return markup for raw injection. Parse bounded, meaningful title/headings/passages/links/forms/buttons/metadata/JSON-LD. URLs sanitized to http(s). Supported actions only local selection, companion, artifact, safe external-open/navigation.

Node-only `src/fetch.ts` exports `validatePublicURL(input:string):URL`, `fetchPublic(input:string):Promise<{html:string;url:string}>`, `ALLOWED_HOSTS`. Strict HTTPS exact hostname allowlist (NASA, GitHub), DNS public IP validation, resolution pinning, redirect revalidation, no credentials/cookies, bounded bytes/time/MIME. All unsupported cases return clear errors to app; no arbitrary URL proxy. Tests cover adversarial inputs with injected resolver/transport where necessary. Fixtures `fixtures/nasa.html`, `restaurant.html`, `github.html` (local authored demo, prominently labeled).

## Chromatics (`@netscape/chromatics`)

Independent. Export `RGB = {r:number;g:number;b:number}` (0..1), `OKLCH={l:number;c:number;h:number}`, `oklchToRgb`, `gamutMap`, `toHex`, `contrast(a:string,b:string):number`, `field({seed,x,y,tick,state,intent,mode}):{background:string;surface:string;text:string;muted:string;accent:string;accentText:string;border:string}`; mode dark/light, intent string, state number 0..1. Role colors AA. Deterministic field encodes intent, graph distance coordinates, event state and tick. Export any helpers for conformance.

## Dynamics (`@netscape/dynamics`)

Independent. Exports `createWorld({seed:number;nodes:{id:string;x:number;y:number;mass?:number}[];edges:{from:string;to:string;rest?:number;stiffness?:number}[];reducedMotion?:boolean}):World`, `enqueueEvent(world,{id:string;tick:number;nodeId:string;kind:'playful'|'focus'|'select';strength:number}):void`, `stepWorld(world,ticks?:number):World`, `snapshot(world):{tick:number;nodes:{id:string;x:number;y:number;vx:number;vy:number;field:number}[];energy:number;traceHash:string}`, `noteForEvent(kind):number`. Mutable world acceptable; events ordered tick/id, duplicate IDs rejected, fixed timestep 1/120, bounded dt work, stable degree-aware graph diffusion. No callback mechanism for semantic actions; no DOM, clock, or randomness outside seeded initialization. Reject invalid input, quantized traces with declared tolerance.

## Performers (`@netscape/performers`)

Depends on core (may consume other SDK). ~20 real operations and rich metadata: schemas, pre/postconditions, requires/provides, effects, determinism, failure modes, provenance, constitution clauses. Export `PERFORMERS`, `compose`, `runPipeline`, and capability pack/version. Runtime shape validation as well as static schema-ID matching; explicit authority for effects; reconstructable traces. No invented remote services.

## Conformance and renderer

Root integrates once SDK contracts have tests. Conformance exports validation and manifest/replay helpers. React adapter consumes graph/surface/field and semantic action callback; sanitizes URLs again and renders text as text. Layout regions are vertically scrollable, semantic identity stable, focus follows semantic order. Six wide-display composition algorithms must produce distinct geometry/topology; narrow layouts may rewrite to flow.

## Application

Next.js App Router, local fixture routes plus protected server URL route. Studio visual direction: deep navy instrumentation shell, cream reading canvas, emerald signal, meaningful typographic hierarchy, real generated SVG graph with six layout families. URL controls, fixtures, seed and family, display/environment facts, selected passage, simulated/local companion, cited saved artifact, versioned localStorage restoration and deterministic replay. No login, no paid provider, no iframe, no fake checkout. Plain visible unsupported-resource fallback and safe external link.

## Harness

1000-seed grammar experiment; structural equivalence independent of hash; six families × six viewports. Physics traces and stability; contrast incl negative controls; schema/effect rejection; NASA/menu intent evidence. Playwright freezes motion at named tick through query params and DOM test hooks, records manifest, boxes, action map, axe scan, screenshots, diffs and keyboard flow. Negative controls explicitly induce clipping/contrast/wrong-action errors before design evaluation. Preserve failing runs. H6 reference comparison only measures subsequent reproduction fidelity; aesthetic judgment remains human.
