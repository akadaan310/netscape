import {FAMILIES,GRAMMAR_VERSION,generateSurface,hash,canonical,validateGraph,type ActionType,type Display,type Family,type SemanticGraph,type Surface,type Intent} from '@netscape/core';
import {replayWorld,type WorldManifest} from '@netscape/dynamics';

export const CONSTITUTION = {
  version:'1.0.0', enforcementRevision:'2026-10-18.1',
  clauses:['C-001','C-002','C-003','C-004','C-005','C-006','C-007','C-008','C-009','C-010','C-011','C-012']
} as const;
type Box={id:string;x:number;y:number;width:number;height:number};
export function auditRegions(regions:Box[],width:number):string[]{
  const errors:string[]=[];
  for(const r of regions){
    if(![r.x,r.y,r.width,r.height].every(Number.isFinite)) errors.push(`non-finite:${r.id}`);
    if(r.x<-.5||r.x+r.width>width+.5||r.y<-.5) errors.push(`clip:${r.id}`);
    if(r.width<44||r.height<44) errors.push(`target:${r.id}`);
  }
  for(let i=0;i<regions.length;i++)for(let j=i+1;j<regions.length;j++){
    const a=regions[i],b=regions[j];
    if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>.5 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>.5)
      errors.push(`overlap:${a.id}:${b.id}`);
  }
  return errors;
}
export function auditActionMap(expected:{id:string;action?:string;supported?:boolean}[],observed:{id:string;action:string}[]):string[]{
  const errors:string[]=[];
  for(const a of expected.filter(x=>x.action&&x.supported!==false)){
    const actual=observed.filter(x=>x.id===a.id);
    if(actual.length!==1)errors.push(`action-count:${a.id}:${actual.length}`);
    else if(actual[0].action!==a.action)errors.push(`wrong-action:${a.id}`);
  }
  for(const a of observed)if(!expected.some(x=>x.id===a.id&&x.action===a.action&&x.supported!==false))errors.push(`unsupported:${a.id}`);
  return errors;
}
/** v2 binds semantic source and all replay metadata. Digests detect corruption;
 * they are not authentication, signatures, or proof of trusted provenance. */
export type SurfaceManifest={
  version:2;grammarVersion:string;fixtureHash:string;graphHash:string;integrityHash:string;graph:SemanticGraph;seed:number;family:Family;display:Display;
  tick:number;chromaticField:Record<string,string>;expectedRegions:Surface['regions'];
  interactions:{id:string;action:ActionType}[];hardInvariants:readonly string[];provenance:SemanticGraph['provenance'];surfaceHash:string;
  dynamics?:WorldManifest;intents?:Intent[];
};
const plain=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const keys=(v:unknown,allowed:readonly string[])=>plain(v)&&Object.keys(v).every(k=>allowed.includes(k));
const bounded=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max;
const uint=(v:unknown,max=0xffffffff)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=max;
const iso=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(v)&&Number.isFinite(Date.parse(v));
const clone=<T>(v:T):T=>JSON.parse(canonical(v));
const equal=(a:unknown,b:unknown)=>canonical(a)===canonical(b);
const interactions=(graph:SemanticGraph)=>graph.nodes.filter(n=>n.action&&n.supported!==false).map(n=>({id:n.id,action:n.action!}));
function graphShape(g:unknown):g is SemanticGraph{
  if(!keys(g,['version','id','title','sourceUrl','nodes','edges','provenance']))return false;
  const graph=g as SemanticGraph;
  return !validateGraph(graph).length&&keys(graph.provenance,['kind','fetchedAt','contentHash','notice'])&&
    graph.nodes.every(n=>keys(n,['id','kind','label','text','url','action','supported','evidence','meta']))&&
    graph.edges.every(e=>keys(e,['from','to','kind']));
}
function intentsShape(value:unknown,graph?:SemanticGraph):value is Intent[]{
  return Array.isArray(value)&&value.length<=32&&value.every(i=>keys(i,['kind','confidence','evidence','status'])&&
    ['research','commerce','repository','general'].includes(i.kind)&&Number.isFinite(i.confidence)&&i.confidence>=0&&i.confidence<=1&&i.status==='inferred'&&
    Array.isArray(i.evidence)&&i.evidence.length<=1000&&i.evidence.every((e:unknown)=>bounded(e,256)&&graph?.nodes.some(n=>n.id===e)));
}
function dynamicsWork(d:WorldManifest):number{
  if(!keys(d,['version','options','events','tick','traceHash'])||d.version!==1||!bounded(d.traceHash,8)||!/^[0-9a-f]{8}$/.test(d.traceHash)||!uint(d.tick,100000)||
    !keys(d.options,['seed','nodes','edges','reducedMotion'])||!Number.isSafeInteger(d.options.seed)||(d.options.reducedMotion!==undefined&&typeof d.options.reducedMotion!=='boolean')||
    !Array.isArray(d.options.nodes)||d.options.nodes.length>4096||!d.options.nodes.every(n=>keys(n,['id','x','y','mass'])&&bounded(n.id,256)&&Number.isFinite(n.x)&&Number.isFinite(n.y)&&(n.mass===undefined||Number.isFinite(n.mass)))||
    !Array.isArray(d.options.edges)||d.options.edges.length>16384||!d.options.edges.every(e=>keys(e,['from','to','rest','stiffness'])&&bounded(e.from,256)&&bounded(e.to,256)&&(e.rest===undefined||Number.isFinite(e.rest))&&(e.stiffness===undefined||Number.isFinite(e.stiffness)))||
    !Array.isArray(d.events)||d.events.length>1000||!d.events.every(e=>keys(e,['id','tick','nodeId','kind','strength'])&&bounded(e.id,256)&&bounded(e.nodeId,256)&&uint(e.tick,100000)&&['playful','focus','select'].includes(e.kind)&&Number.isFinite(e.strength)&&e.strength>=0&&e.strength<=1))throw new Error('Invalid dynamics manifest');
  return d.tick*(d.options.nodes.length+d.options.edges.length);
}
export function createManifest(graph:SemanticGraph,surface:Surface,display:Display,tick=0,chromaticField:Record<string,string>={},dynamics?:WorldManifest,intents?:Intent[]):SurfaceManifest{
  const body=clone({version:2 as const,grammarVersion:GRAMMAR_VERSION,fixtureHash:graph.provenance.contentHash,graphHash:hash(graph),graph,
    seed:surface.seed,family:surface.family,display,tick,chromaticField,expectedRegions:surface.regions,
    interactions:interactions(graph),hardInvariants:CONSTITUTION.clauses,provenance:graph.provenance,surfaceHash:surface.hash,
    ...(dynamics===undefined?{}:{dynamics}),...(intents===undefined?{}:{intents})});
  const manifest={...body,integrityHash:hash(body)};verifyManifest(manifest,false);return manifest;
}
export function replayManifest(manifest:SurfaceManifest):Surface{return verifyManifest(manifest,true);}
function manifestBounds(manifest:SurfaceManifest):void{
  if(!plain(manifest)||manifest.version!==2||manifest.grammarVersion!==GRAMMAR_VERSION)throw new Error('Unsupported replay version');
  if(!keys(manifest,['version','grammarVersion','fixtureHash','graphHash','integrityHash','graph','seed','family','display','tick','chromaticField','expectedRegions','interactions','hardInvariants','provenance','surfaceHash','dynamics','intents'])||
    !graphShape(manifest.graph)||!Number.isSafeInteger(manifest.seed)||!uint(manifest.tick,1000000)||!FAMILIES.includes(manifest.family)||
    !keys(manifest.display,['width','height','dpr','input','reducedMotion','colorScheme'])||!['width','height','dpr'].every(k=>Number.isFinite((manifest.display as any)[k]))||typeof manifest.display.reducedMotion!=='boolean'||!['light','dark'].includes(manifest.display.colorScheme)||!Array.isArray(manifest.display.input)||manifest.display.input.length>3||!manifest.display.input.every(i=>['keyboard','pointer','touch'].includes(i))||
    !plain(manifest.chromaticField)||Object.keys(manifest.chromaticField).length>32||Object.entries(manifest.chromaticField).some(([k,v])=>k.length>64||typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))||
    !Array.isArray(manifest.expectedRegions)||manifest.expectedRegions.length>1000||!manifest.expectedRegions.every(r=>keys(r,['id','semanticId','x','y','width','height','order'])&&bounded(r.id,512)&&bounded(r.semanticId,256)&&['x','y','width','height','order'].every(k=>Number.isFinite((r as any)[k])))||!Array.isArray(manifest.interactions)||manifest.interactions.length>1000||!manifest.interactions.every(i=>keys(i,['id','action'])&&bounded(i.id,256)&&bounded(i.action,64))||
    !Array.isArray(manifest.hardInvariants)||manifest.hardInvariants.length>32||!manifest.hardInvariants.every(v=>bounded(v,64))||!keys(manifest.provenance,['kind','fetchedAt','contentHash','notice'])||!['kind','fetchedAt','contentHash','notice'].every(k=>bounded((manifest.provenance as any)[k],50000))||
    !['fixtureHash','graphHash','integrityHash','surfaceHash'].every(k=>bounded((manifest as any)[k],256))||
    (manifest.intents!==undefined&&!intentsShape(manifest.intents,manifest.graph)))throw new Error('Invalid replay schema');
  if(manifest.dynamics!==undefined&&(dynamicsWork(manifest.dynamics)>20000000||manifest.tick!==manifest.dynamics.tick))throw new Error('Replay dynamics work or tick mismatch');
}
function verifyManifest(manifest:SurfaceManifest,restoreDynamics:boolean):Surface{
  manifestBounds(manifest);
  const {integrityHash,...body}=manifest;
  if(hash(body)!==integrityHash||hash(manifest.graph)!==manifest.graphHash)throw new Error('Replay integrity digest mismatch');
  if(manifest.graph.provenance.contentHash!==manifest.fixtureHash)throw new Error('Fixture identity mismatch');
  if(!equal(manifest.provenance,manifest.graph.provenance)||!equal(manifest.hardInvariants,CONSTITUTION.clauses)||!equal(manifest.interactions,interactions(manifest.graph)))throw new Error('Replay metadata mismatch');
  const surface=generateSurface(manifest.graph,{seed:manifest.seed,family:manifest.family,display:manifest.display});
  if(surface.hash!==manifest.surfaceHash||!equal(surface.regions,manifest.expectedRegions))throw new Error('Replay digest or geometry mismatch');
  if(manifest.dynamics!==undefined){
    if(restoreDynamics)replayWorld(manifest.dynamics);
  }
  return surface;
}
export type SavedArtifact={id:string;title:string;passage:string;sourceUrl:string;sourceTitle:string;evidence:string[];createdAt:string;manifest:SurfaceManifest;digest:string};
export type Workspace={version:1;seed:number;family:Family;resource:string;graph?:SemanticGraph;artifacts:SavedArtifact[];selectedId?:string;attached?:boolean;tick?:number;theme?:'light'|'dark';dynamics?:WorldManifest;intents?:Intent[]};
export function artifactDigest(artifact:Omit<SavedArtifact,'digest'>):string{return hash(artifact);}
/** Total for corrupted JSON and bounded in-memory records. Unknown schema fields
 * are rejected before hashing; all digest/replay exceptions become false. */
export function preflightWorkspace(value:unknown):value is Workspace{
  try{
    if(!keys(value,['version','seed','family','resource','graph','artifacts','selectedId','attached','tick','theme','dynamics','intents']))return false;
    const w=value as Workspace;
    if(w.version!==1||!uint(w.seed)||!FAMILIES.includes(w.family)||!bounded(w.resource,2048)||!Array.isArray(w.artifacts)||w.artifacts.length>50)return false;
    if(w.graph!==undefined&&!graphShape(w.graph))return false;
    if(w.selectedId!==undefined&&(!bounded(w.selectedId,256)||!w.graph?.nodes.some(n=>n.id===w.selectedId&&n.kind==='Text')))return false;
    if(w.attached!==undefined&&typeof w.attached!=='boolean')return false;
    if(w.tick!==undefined&&!uint(w.tick,1000000))return false;
    if(w.theme!==undefined&&!['light','dark'].includes(w.theme))return false;
    if(w.intents!==undefined&&!intentsShape(w.intents,w.graph))return false;
    let replayWork=0;
    if(w.dynamics!==undefined){replayWork+=dynamicsWork(w.dynamics);if(w.tick!==w.dynamics.tick||replayWork>20000000)return false;}
    const ids=new Set<string>();
    for(const a of w.artifacts){
      if(!keys(a,['id','title','passage','sourceUrl','sourceTitle','createdAt','evidence','manifest','digest'])||!bounded(a.id,256)||!a.id||ids.has(a.id)||!bounded(a.title,4096)||!bounded(a.passage,50000)||!bounded(a.sourceUrl,2048)||!safeExternalURL(a.sourceUrl)||!bounded(a.sourceTitle,4096)||!iso(a.createdAt)||!Array.isArray(a.evidence)||a.evidence.length>1000||!a.evidence.every(e=>bounded(e,2048))||!bounded(a.digest,256)||!a.manifest)return false;
      ids.add(a.id);
      if(a.manifest.dynamics){replayWork+=dynamicsWork(a.manifest.dynamics);if(replayWork>20000000)return false;}
      manifestBounds(a.manifest);
    }
    return true;
  }catch{return false;}
}
/** Bounds-only preflight is for locally constructed records. Cold/untrusted JSON
 * additionally requires digest, geometry, and integrated dynamics validation. */
export function validateWorkspace(value:unknown):value is Workspace{
  if(!preflightWorkspace(value))return false;
  try{
    if(value.dynamics)replayWorld(value.dynamics);
    for(const artifact of value.artifacts){
      replayManifest(artifact.manifest);
      const {digest,...body}=artifact;if(artifactDigest(body)!==digest)return false;
    }
    return true;
  }catch{return false;}
}
export function safeExternalURL(value:string):string|undefined{
  try {const u=new URL(value);return (u.protocol==='https:'||u.protocol==='http:')&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}
}
