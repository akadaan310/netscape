import { canonical, hash, validateGraph as coreValidateGraph } from '@netscape/core';
import type { SemanticGraph, Intent } from '@netscape/core';

export const VERSION = '1.0.0';
export const CONSTITUTION_VERSION = '1.0.0';
export type Effect = 'pure' | 'local-state' | 'external-read' | 'external-mutation';
export interface Schema<T> { readonly id: string; readonly description: string; validate(value: unknown): value is T }
export interface Condition<T> { readonly description: string; check(value: T): boolean }
export interface RuntimeContext { readonly capabilities: Readonly<Record<string, (input: unknown) => unknown | Promise<unknown>>> }
export interface Performer<I, O> {
 readonly id: string; readonly version: string; readonly description: string;
 readonly input: Schema<I>; readonly output: Schema<O>;
 readonly preconditions: readonly Condition<I>[]; readonly postconditions: readonly Condition<O>[];
 readonly effects: readonly Effect[]; readonly requires: readonly string[]; readonly provides: readonly string[];
 readonly failureModes: readonly string[]; readonly determinism: 'deterministic' | 'capability-dependent';
 readonly provenance: { readonly source: string; readonly implementation: string };
 readonly constitutionClauses: readonly string[];
 execute(input: I, context: RuntimeContext): O | Promise<O>;
}
// Runtime composition checks schema IDs. Generic input/output types remain available on every operation.
export type AnyPerformer = Performer<any, any>;
export type InputOf<P> = P extends Performer<infer I, any> ? I : never;
export type OutputOf<P> = P extends Performer<any, infer O> ? O : never;
export interface Pipeline<I = unknown, O = unknown> { readonly version: string; readonly steps: readonly AnyPerformer[]; readonly input: Schema<I>; readonly output: Schema<O> }
export interface RunOptions { readonly authority?: readonly Effect[]; readonly capabilities?: RuntimeContext['capabilities'] }
export interface TraceStep {
 readonly performer: string; readonly version: string; readonly inputSchema: string; readonly outputSchema: string;
 readonly effects: readonly Effect[]; readonly requires: readonly string[]; readonly status: 'executed';
 readonly inputCanonical: string; readonly outputCanonical: string; readonly inputHash: string; readonly outputHash: string;
}
export interface PipelineTrace { readonly version: string; readonly pack: string; readonly steps: readonly TraceStep[] }
export class PipelineExecutionError extends Error {
 constructor(message:string, readonly trace:PipelineTrace, readonly failure:{performer:string;phase:'input'|'precondition'|'execution'|'output'|'postcondition'|'snapshot';invoked:boolean}, options?:ErrorOptions){super(message,options);this.name='PipelineExecutionError';}
}
export interface Artifact { version: string; id: string; title: string; passage: string; sourceUrl: string; semanticId: string; evidence: string[]; notice: string; status: 'local-artifact' }
export interface Selection { graphId: string; semanticId: string; title: string; text: string; sourceUrl: string; evidence: string[]; notice: string }
export interface PassageContext extends Selection { status: 'selected-source-context' }
export interface GraphSummary { graphId: string; title: string; nodeCount: number; edgeCount: number; kinds: Record<string, number>; provenance: SemanticGraph['provenance'] }
export interface Passage { id: string; label: string; text: string }
export interface Link { id: string; label: string; url: string }
export interface ResourceDocument { url: string; html: string; notice: string }
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every(v => typeof v === 'string');
const text = (x: unknown): x is string => typeof x === 'string' && x.length <= 2_000_000;
const fields = (x: unknown, names: readonly string[]) => record(x) && names.every(k => typeof x[k] === 'string');
const schema = <T>(name: string, description: string, validate: (x: unknown) => boolean): Schema<T> => Object.freeze({id:`nmop/${name}@1`,description,validate: validate as (x: unknown) => x is T});
function safeURL(value: string): string {
 const url = new URL(value);
 const host = url.hostname.toLowerCase().replace(/\.$/,'');
 if (!['https:','http:'].includes(url.protocol) || url.username || url.password || !host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || !host.includes('.') || host.includes(':') || /^[\d.]+$/.test(host)) throw new Error('URL must be a credential-free public http(s) hostname');
 return url.href;
}
const url = (x: unknown) => {try{return typeof x==='string' && safeURL(x)===x;}catch{return false;}};
function graphShape(x: unknown): x is SemanticGraph {
 if (!record(x) || !fields(x,['version','id','title','sourceUrl']) || !Array.isArray(x.nodes) || !Array.isArray(x.edges) || !record(x.provenance)) return false;
 if (!fields(x.provenance,['kind','fetchedAt','contentHash','notice']) || !['fixture','public'].includes(String(x.provenance.kind))) return false;
 if (!x.nodes.every(n => record(n) && fields(n,['id','kind','label']) && ['Resource','Section','Text','Link','Form','Action','Artifact','Participant','Evidence','Group'].includes(String(n.kind)) && (n.text===undefined || text(n.text)) && (n.url===undefined || typeof n.url==='string') && (n.evidence===undefined || strings(n.evidence)) && (n.supported===undefined || typeof n.supported==='boolean') && (n.meta===undefined || (record(n.meta) && Object.values(n.meta).every(v=>typeof v==='string'))) && (n.action===undefined || ['open-external','select-passage','attach-companion','save-artifact','navigate'].includes(String(n.action))))) return false;
 if (!x.edges.every(e=>record(e) && fields(e,['from','to','kind']) && ['contains','references','navigates','derives','observes','acts_on'].includes(String(e.kind)))) return false;
 return coreValidateGraph(x as unknown as SemanticGraph).length === 0;
}
const selected = (x: unknown) => fields(x,['graphId','semanticId','title','text','sourceUrl','notice']) && record(x) && strings(x.evidence);
const artifactShape = (x: unknown) => fields(x,['version','id','title','passage','sourceUrl','semanticId','notice']) && record(x) && x.version==='1' && x.status==='local-artifact' && strings(x.evidence) && url(x.sourceUrl);
export const SCHEMAS = Object.freeze({
 text:schema<string>('text','Bounded plain text',text), url:schema<string>('safe-url','Normalized public-looking http(s) URL; not a DNS/SSRF authorization',url),
 graph:schema<SemanticGraph>('semantic-graph','Core semantic graph with complete shape and identity validation',graphShape),
 summary:schema<GraphSummary>('graph-summary','Counts and source provenance',x=>fields(x,['graphId','title']) && record(x) && Number.isInteger(x.nodeCount) && Number(x.nodeCount)>=0 && Number.isInteger(x.edgeCount) && Number(x.edgeCount)>=0 && record(x.kinds) && Object.values(x.kinds).every(v=>Number.isInteger(v)&&Number(v)>=0) && record(x.provenance) && fields(x.provenance,['kind','fetchedAt','contentHash','notice'])),
 passages:schema<Passage[]>('passages','Extracted identified text passages',x=>Array.isArray(x)&&x.every(p=>fields(p,['id','label','text']))),
 links:schema<Link[]>('links','Safe identified link targets',x=>Array.isArray(x)&&x.every(p=>fields(p,['id','label','url'])&&record(p)&&url(p.url))),
 intents:schema<Intent[]>('intent-candidates','Inferred candidates with supporting semantic node IDs',x=>Array.isArray(x)&&x.every(i=>record(i)&&['research','commerce','repository','general'].includes(String(i.kind))&&typeof i.confidence==='number'&&i.confidence>=0&&i.confidence<=1&&strings(i.evidence)&&i.status==='inferred')),
 selectionRequest:schema<{graph:SemanticGraph;nodeId:string}>('selection-request','Semantic graph and selected passage ID',x=>record(x)&&graphShape(x.graph)&&typeof x.nodeId==='string'),
 selection:schema<Selection>('selection','Selected passage and source identity',selected),
 context:schema<PassageContext>('passage-context','Explicitly selected source context',x=>selected(x)&&record(x)&&x.status==='selected-source-context'),
 artifact:schema<Artifact>('artifact','Versioned local cited artifact',artifactShape),
 externalTarget:schema<{url:string;target:'_blank';rel:'noopener noreferrer'}>('external-target','Safe external navigation attributes',x=>record(x)&&url(x.url)&&x.target==='_blank'&&x.rel==='noopener noreferrer'),
 document:schema<ResourceDocument>('resource-document','Transport-supplied HTML and visible provenance; never executed',x=>fields(x,['url','html','notice'])&&record(x)&&url(x.url)&&text(x.html)&&String(x.notice).trim().length>0),
 stats:schema<{characters:number;words:number;lines:number}>('text-stats','Plain-text counts',x=>record(x)&&['characters','words','lines'].every(k=>Number.isInteger(x[k])&&Number(x[k])>=0))
});

export function definePerformer<I,O>(operation: Performer<I,O>): Performer<I,O> {
 if (!operation.id || !operation.version || !operation.input.id || !operation.output.id || !operation.effects.length || operation.effects.some(e=>!['pure','local-state','external-read','external-mutation'].includes(e))) throw new Error('Invalid performer metadata');
 return Object.freeze({...operation,effects:Object.freeze([...operation.effects]),requires:Object.freeze([...operation.requires]),provides:Object.freeze([...operation.provides]),preconditions:Object.freeze([...operation.preconditions]),postconditions:Object.freeze([...operation.postconditions])});
}
function operation<I,O>(id:string,input:Schema<I>,output:Schema<O>,description:string,execute:Performer<I,O>['execute'],options:Partial<Pick<Performer<I,O>,'effects'|'requires'|'determinism'|'constitutionClauses'>>={}):Performer<I,O> {
 return definePerformer({id,version:VERSION,description,input,output,execute,
 preconditions:[{description:input.description,check:v=>input.validate(v)}],postconditions:[{description:output.description,check:v=>output.validate(v)}],
 effects:['pure'],requires:[],provides:[output.id],failureModes:['input-schema','precondition','missing-authority','missing-capability','output-schema','postcondition','execution-failure','non-json-trace'],determinism:'deterministic',
 provenance:{source:'06_NMOP.md;09_CONSTITUTION.md',implementation:'@netscape/performers/src/index.ts'},constitutionClauses:['C-001','C-004','C-007','C-009','C-010'],...options});
}
const escapeMarkdown = (s:string) => s.replace(/[\\`*{}\[\]()#+!_<>]/g,'\\$&').replace(/\r?\n/g,' ');
const markdownURL = (s:string) => s.replace(/[()<>\s]/g,c=>encodeURIComponent(c));
export const PERFORMERS = Object.freeze({
 validateURL:operation('validate-url',SCHEMAS.text,SCHEMAS.url,'Normalize a credential-free public-looking URL; transport must still enforce DNS/allowlist',safeURL,{constitutionClauses:['C-008','C-011']}),
 externalTarget:operation('external-target',SCHEMAS.url,SCHEMAS.externalTarget,'Create safe external navigation attributes',url=>({url,target:'_blank',rel:'noopener noreferrer'}),{constitutionClauses:['C-002','C-008']}),
 fetchResource:operation('fetch-resource',SCHEMAS.url,SCHEMAS.document,'Read only through a caller-supplied allowlisted transport',async(value,ctx)=>await ctx.capabilities['resource.read'](value) as ResourceDocument,{effects:['external-read'],requires:['resource.read'],determinism:'capability-dependent',constitutionClauses:['C-003','C-007','C-008']}),
 validateGraph:operation('validate-graph',SCHEMAS.graph,SCHEMAS.graph,'Validate semantic graph identities and shape',g=>g),
 graphSummary:operation('graph-summary',SCHEMAS.graph,SCHEMAS.summary,'Count semantic node kinds while preserving source provenance',g=>({graphId:g.id,title:g.title,nodeCount:g.nodes.length,edgeCount:g.edges.length,kinds:g.nodes.reduce<Record<string,number>>((a,n)=>(a[n.kind]=(a[n.kind]??0)+1,a),{}),provenance:g.provenance})),
 graphPassages:operation('graph-passages',SCHEMAS.graph,SCHEMAS.passages,'Extract text passages without reparsing HTML',g=>g.nodes.filter(n=>n.kind==='Text'&&!!n.text?.trim()).map(n=>({id:n.id,label:n.label,text:n.text!}))),
 graphLinks:operation('graph-links',SCHEMAS.graph,SCHEMAS.links,'Project only valid public-looking link targets',g=>g.nodes.filter(n=>n.kind==='Link'&&n.url).flatMap(n=>{try{return [{id:n.id,label:n.label,url:safeURL(n.url!)}];}catch{return [];}})),
 graphIntentCandidates:operation('graph-intent-candidates',SCHEMAS.graph,SCHEMAS.intents,'Infer bounded evidence-bearing intent candidates from existing semantic text',g=>{
 const rules = [['research',/\b(research|science|mission|atmosphere|nasa|study)\b/i],['commerce',/\b(menu|price|reservation|restaurant|cart|purchase|checkout)\b/i],['repository',/\b(repository|readme|commit|pull request|github|issue)\b/i]] as const;
 const results:Intent[]=rules.flatMap(([kind,re])=>{const evidence=g.nodes.filter(n=>re.test(`${n.label} ${n.text??''} ${n.url??''}`)).map(n=>n.id);return evidence.length?[{kind,confidence:Math.min(.9,.45+evidence.length*.1),evidence,status:'inferred' as const}]:[];});
 return results.length?results.sort((a,b)=>b.confidence-a.confidence||a.kind.localeCompare(b.kind)):[{kind:'general',confidence:.3,evidence:g.nodes.slice(0,1).map(n=>n.id),status:'inferred'}];
 }),
 selectPassage:operation('select-passage',SCHEMAS.selectionRequest,SCHEMAS.selection,'Resolve selected text by stable semantic identity',({graph,nodeId})=>{const n=graph.nodes.find(n=>n.id===nodeId&&n.kind==='Text'&&n.text?.trim());if(!n)throw new Error('Selected passage is absent or not textual');return {graphId:graph.id,semanticId:n.id,title:graph.title,text:n.text!,sourceUrl:safeURL(graph.sourceUrl),evidence:[...new Set([n.id,...n.evidence??[]])],notice:graph.provenance.notice};}),
 selectionContext:operation('selection-context',SCHEMAS.selection,SCHEMAS.context,'Build an explicit source context for a local companion',s=>({...s,status:'selected-source-context'}),{constitutionClauses:['C-001','C-007','C-012']}),
 contextArtifact:operation('context-artifact',SCHEMAS.context,SCHEMAS.artifact,'Create a deterministic cited local artifact without claiming generated reasoning',s=>({version:'1',id:`artifact-${hash(s)}`,title:s.title,passage:s.text,sourceUrl:s.sourceUrl,semanticId:s.semanticId,evidence:s.evidence,notice:s.notice,status:'local-artifact'})),
 validateArtifact:operation('validate-artifact',SCHEMAS.artifact,SCHEMAS.artifact,'Validate versioned artifact for storage or restoration',a=>a),
 artifactMarkdown:operation('artifact-markdown',SCHEMAS.artifact,SCHEMAS.text,'Render an escaped citation and selected passage as portable Markdown',a=>`# ${escapeMarkdown(a.title)}\n\n> ${a.passage.split(/\r?\n/).map(escapeMarkdown).join('\n> ')}\n\nSource: [${escapeMarkdown(a.sourceUrl)}](${markdownURL(a.sourceUrl)})\n\nEvidence: ${a.evidence.map(escapeMarkdown).join(', ')}\n\nProvenance: ${escapeMarkdown(a.notice)}\n\nStatus: local artifact`),
 artifactJSON:operation('artifact-json',SCHEMAS.artifact,SCHEMAS.text,'Export a canonical versioned artifact',a=>canonical(a)),
 saveArtifact:operation('save-artifact',SCHEMAS.artifact,SCHEMAS.artifact,'Persist through an explicit caller-supplied local storage capability',async(a,c)=>await c.capabilities['artifact.write'](a) as Artifact,{effects:['local-state'],requires:['artifact.write'],determinism:'capability-dependent'}),
 loadArtifact:operation('load-artifact',SCHEMAS.text,SCHEMAS.artifact,'Restore and validate through explicit local artifact storage',async(id,c)=>{const result=await c.capabilities['artifact.read'](id) as Artifact;if(record(result)&&typeof result.id==='string'&&result.id!==id)throw new Error('Stored artifact identity differs from requested identity');return result;},{effects:['local-state'],requires:['artifact.read'],determinism:'capability-dependent'}),
 normalizeText:operation('normalize-text',SCHEMAS.text,SCHEMAS.text,'Normalize whitespace in bounded plain text',s=>s.replace(/\s+/g,' ').trim()),
 textStats:operation('text-stats',SCHEMAS.text,SCHEMAS.stats,'Count Unicode code points, whitespace-delimited words and lines',s=>({characters:[...s].length,words:s.trim()?s.trim().split(/\s+/).length:0,lines:s?s.split(/\r?\n/).length:0})),
 uniqueLinks:operation('unique-links',SCHEMAS.links,SCHEMAS.links,'Deduplicate normalized target URLs while retaining first semantic identity',links=>{const seen=new Set<string>();return links.filter(l=>seen.has(l.url)?false:(seen.add(l.url),true));}),
 linksMarkdown:operation('links-markdown',SCHEMAS.links,SCHEMAS.text,'Render safely escaped portable source links',links=>links.map(l=>`- [${escapeMarkdown(l.label)}](${markdownURL(l.url)})`).join('\n'))
});

export function compose<const T extends readonly [AnyPerformer,...AnyPerformer[]]>(...steps:T):Pipeline<InputOf<T[0]>,OutputOf<T extends readonly [...any[],infer L]?L:never>> {
 if (!steps.length) throw new Error('Pipeline requires at least one performer');
 for(let i=1;i<steps.length;i++) if(steps[i-1].output.id!==steps[i].input.id) throw new Error(`Pipeline schema mismatch: ${steps[i-1].output.id} -> ${steps[i].input.id}`);
 return Object.freeze({version:VERSION,steps:Object.freeze([...steps]),input:steps[0].input,output:steps.at(-1)!.output});
}
function snapshot(value:unknown):string {
 const seen=new Set<object>();
 const visit=(v:unknown):void=>{
  if(v===null||typeof v==='string'||typeof v==='boolean'||(typeof v==='number'&&Number.isFinite(v)))return;
  if(typeof v!=='object'||!v||seen.has(v))throw new Error('Trace values must be finite acyclic JSON');
  if(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw new Error('Trace values must be plain JSON objects');
  seen.add(v);for(const entry of Object.values(v))visit(entry);seen.delete(v);
 };visit(value);return canonical(value);
}
export async function runPipeline<I,O>(pipeline:Pipeline<I,O>,input:I,options:RunOptions={}):Promise<{output:O;trace:PipelineTrace}> {
 const authority=new Set<Effect>(['pure',...options.authority??[]]);
 const capabilities={...options.capabilities};
 // Complete authority/capability/schema alignment preflight before invoking even a pure first step.
 for(let i=0;i<pipeline.steps.length;i++){
  const step=pipeline.steps[i];
  if(i&&pipeline.steps[i-1].output.id!==step.input.id)throw new Error('Pipeline schema mismatch');
  for(const effect of step.effects)if(!authority.has(effect))throw new Error(`Missing explicit authority: ${effect} (${step.id})`);
  for(const required of step.requires)if(typeof capabilities[required]!=='function')throw new Error(`Missing injected capability: ${required}`);
 }
 const trace:TraceStep[]=[];
 let value:unknown=input;
 for(const step of pipeline.steps){
  let phase:PipelineExecutionError['failure']['phase']='input';let invoked=false;
  try {
   if(!step.input.validate(value))throw new Error(`Input schema rejected ${step.id}: ${step.input.id}`);
   phase='precondition';
   for(const c of step.preconditions)if(!c.check(value))throw new Error(`Precondition rejected ${step.id}: ${c.description}`);
   phase='snapshot';const inputCanonical=snapshot(value);
   phase='execution';invoked=true;
   const output=await step.execute(JSON.parse(inputCanonical),Object.freeze({capabilities:Object.freeze({...Object.fromEntries(step.requires.map(k=>[k,capabilities[k]]))})}));
   phase='output';
   if(!step.output.validate(output))throw new Error(`Output schema rejected ${step.id}: ${step.output.id}`);
   phase='postcondition';
   for(const c of step.postconditions)if(!c.check(output))throw new Error(`Postcondition rejected ${step.id}: ${c.description}`);
   phase='snapshot';const outputCanonical=snapshot(output);
   trace.push({performer:step.id,version:step.version,inputSchema:step.input.id,outputSchema:step.output.id,effects:[...step.effects],requires:[...step.requires],status:'executed',inputCanonical,outputCanonical,inputHash:hash(JSON.parse(inputCanonical)),outputHash:hash(JSON.parse(outputCanonical))});
   value=JSON.parse(outputCanonical);
  } catch(error) {
   throw new PipelineExecutionError(error instanceof Error?error.message:String(error),{version:VERSION,pack:`netscape-capabilities@${VERSION}`,steps:[...trace]},{performer:step.id,phase,invoked},{cause:error});
  }
 }
 return {output:value as O,trace:{version:VERSION,pack:`netscape-capabilities@${VERSION}`,steps:trace}};
}
export function reconstructTrace(trace:PipelineTrace,registry:readonly AnyPerformer[]=Object.values(PERFORMERS)):{valid:boolean;errors:string[];output?:unknown} {
 const errors:string[]=[];let output:unknown;
 if(trace.version!==VERSION||trace.pack!==`netscape-capabilities@${VERSION}`||!Array.isArray(trace.steps)||!trace.steps.length)return {valid:false,errors:['Unsupported or empty trace']};
 for(let i=0;i<trace.steps.length;i++){
  const step=trace.steps[i];
  try{
   const input=JSON.parse(step.inputCanonical);output=JSON.parse(step.outputCanonical);
   if(snapshot(input)!==step.inputCanonical||snapshot(output)!==step.outputCanonical||hash(input)!==step.inputHash||hash(output)!==step.outputHash)errors.push(`Step ${i}: canonical hash mismatch`);
   if(step.status!=='executed')errors.push(`Step ${i}: missing execution status`);
   if(i&&(trace.steps[i-1].outputCanonical!==step.inputCanonical||trace.steps[i-1].outputSchema!==step.inputSchema))errors.push(`Step ${i}: broken chain`);
   const known=registry.find(p=>p.id===step.performer);
   if(!known)errors.push(`Step ${i}: unknown performer`);
   if(known&&(known.version!==step.version||known.input.id!==step.inputSchema||known.output.id!==step.outputSchema||!known.input.validate(input)||!known.output.validate(output)||canonical(known.effects)!==canonical(step.effects)||canonical(known.requires)!==canonical(step.requires)))errors.push(`Step ${i}: performer contract mismatch`);
  }catch{errors.push(`Step ${i}: invalid JSON snapshot`);}
 }
 return {valid:errors.length===0,errors,output};
}
export const CAPABILITY_PACK = Object.freeze({id:'netscape-capabilities',version:VERSION,constitutionVersion:CONSTITUTION_VERSION,enforcementRevision:'1',performers:Object.freeze(Object.values(PERFORMERS).map(p=>({id:p.id,version:p.version,input:p.input.id,output:p.output.id,effects:p.effects,requires:p.requires}))),provenance:'Local, authored SDK implementations; external transports and storage are injected, never fabricated.'});
export const PIPELINES = Object.freeze({selectionArtifact:compose(PERFORMERS.selectPassage,PERFORMERS.selectionContext,PERFORMERS.contextArtifact),selectionMarkdown:compose(PERFORMERS.selectPassage,PERFORMERS.selectionContext,PERFORMERS.contextArtifact,PERFORMERS.artifactMarkdown),graphSummary:compose(PERFORMERS.validateGraph,PERFORMERS.graphSummary),graphLinks:compose(PERFORMERS.graphLinks,PERFORMERS.uniqueLinks,PERFORMERS.linksMarkdown)});
