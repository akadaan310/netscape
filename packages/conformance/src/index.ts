import {FAMILIES,GRAMMAR_VERSION,generateSurface,hash,validateGraph,type ActionType,type Display,type Family,type SemanticGraph,type Surface} from '@netscape/core';

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
export type SurfaceManifest={
  version:1;grammarVersion:string;fixtureHash:string;graph:SemanticGraph;seed:number;family:Family;display:Display;
  tick:number;chromaticField:Record<string,string>;expectedRegions:Surface['regions'];
  interactions:{id:string;action:ActionType}[];hardInvariants:readonly string[];provenance:SemanticGraph['provenance'];surfaceHash:string;
};
export function createManifest(graph:SemanticGraph,surface:Surface,display:Display,tick=0,chromaticField:Record<string,string>={}):SurfaceManifest{
  return {version:1,grammarVersion:GRAMMAR_VERSION,fixtureHash:graph.provenance.contentHash,graph,
    seed:surface.seed,family:surface.family,display,tick,chromaticField,expectedRegions:surface.regions,
    interactions:graph.nodes.filter(n=>n.action&&n.supported!==false).map(n=>({id:n.id,action:n.action!})),
    hardInvariants:CONSTITUTION.clauses,provenance:graph.provenance,surfaceHash:surface.hash};
}
export function replayManifest(manifest:SurfaceManifest):Surface{
  if(manifest.version!==1||manifest.grammarVersion!==GRAMMAR_VERSION)throw new Error('Unsupported replay version');
  if(manifest.graph.provenance.contentHash!==manifest.fixtureHash)throw new Error('Fixture identity mismatch');
  const errors=validateGraph(manifest.graph);if(errors.length)throw new Error(errors.join('; '));
  const surface=generateSurface(manifest.graph,{seed:manifest.seed,family:manifest.family,display:manifest.display});
  if(surface.hash!==manifest.surfaceHash)throw new Error('Replay digest mismatch');
  return surface;
}
export type SavedArtifact={id:string;title:string;passage:string;sourceUrl:string;sourceTitle:string;evidence:string[];createdAt:string;manifest:SurfaceManifest;digest:string};
export type Workspace={version:1;seed:number;family:Family;resource:string;graph?:SemanticGraph;artifacts:SavedArtifact[];selectedId?:string;attached?:boolean;tick?:number;theme?:'light'|'dark'};
export function artifactDigest(artifact:Omit<SavedArtifact,'digest'>):string{return hash(artifact);}
export function validateWorkspace(value:unknown):value is Workspace{
  if(!value||typeof value!=='object')return false;
  const w=value as Workspace;
  if(w.version!==1||!Number.isInteger(w.seed)||w.seed<0||w.seed>0xffffffff||!FAMILIES.includes(w.family)||typeof w.resource!=='string'||w.resource.length>2048||!Array.isArray(w.artifacts)||w.artifacts.length>50)return false;
  if(w.graph && (!Array.isArray(w.graph.nodes)||validateGraph(w.graph).length))return false;
  if(w.tick!==undefined&&(!Number.isInteger(w.tick)||w.tick<0||w.tick>1000000))return false;
  if(w.theme!==undefined&&!['light','dark'].includes(w.theme))return false;
  for(const a of w.artifacts){
    if(!a||typeof a!=='object'||typeof a.id!=='string'||typeof a.title!=='string'||typeof a.passage!=='string'||a.passage.length>50000||typeof a.sourceUrl!=='string'||typeof a.sourceTitle!=='string'||typeof a.createdAt!=='string'||!Array.isArray(a.evidence)||!a.evidence.every(e=>typeof e==='string')||typeof a.digest!=='string'||!a.manifest||a.manifest.version!==1)return false;
    const {digest,...body}=a;if(artifactDigest(body)!==digest)return false;
    try{replayManifest(a.manifest);}catch{return false;}
  }
  return true;
}
export function safeExternalURL(value:string):string|undefined{
  try {const u=new URL(value);return (u.protocol==='https:'||u.protocol==='http:')&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}
}
