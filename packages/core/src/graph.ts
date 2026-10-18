import type { SemanticGraph, SurfaceNode } from './types.ts';
const kinds=new Set(['Resource','Section','Text','Link','Form','Action','Artifact','Participant','Evidence','Group']);
const actions=new Set(['open-external','select-passage','attach-companion','save-artifact','navigate']);
const edges=new Set(['contains','references','navigates','derives','observes','acts_on']);
export const MAX_NODES=1000;
const plain=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const safeURL=(v:unknown)=>{try{if(typeof v!=='string'||v.length>2048)return false;const u=new URL(v);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
/** The renderer exposes these role/action pairs; unsupported affordances are inert. */
export function compatibleAction(kind:string,action:string):boolean{
  return actions.has(action)&&(kind==='Action'||(kind==='Text'&&action==='select-passage')||(kind==='Link'&&['navigate','open-external'].includes(action))||(kind==='Participant'&&action==='attach-companion')||(kind==='Artifact'&&action==='save-artifact'));
}
/** Validates untrusted runtime data without recursively walking a hostile graph. */
export function validateGraph(graph:SemanticGraph):string[]{
  const errors:string[]=[];
  if(!plain(graph))return ['Graph must be an object'];
  for(const key of ['version','id','title','sourceUrl'] as const)if(typeof graph[key]!=='string'||!graph[key].trim())errors.push(`Graph ${key} must be a nonempty string`);
  // Version '1' is the supported legacy spelling of schema 1.0.0.
  if(!['1','1.0.0'].includes(graph.version))errors.push('Unsupported graph version');
  if(!safeURL(graph.sourceUrl))errors.push('Graph sourceUrl must be safe HTTP(S)');
  if(['id','title'].some(k=>typeof (graph as any)[k]==='string'&&(graph as any)[k].length>4096))errors.push('Graph identity exceeds size limit');
  const p=graph.provenance;
  if(!plain(p)||!['fixture','public'].includes(p.kind)||['fetchedAt','contentHash','notice'].some(k=>typeof (p as any)[k]!=='string'||!(p as any)[k].trim()||(p as any)[k].length>50000))errors.push('Graph provenance is required');
  else if(!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(p.fetchedAt)||!Number.isFinite(Date.parse(p.fetchedAt)))errors.push('Graph fetchedAt must be a valid ISO timestamp');
  if(!Array.isArray(graph.nodes)||graph.nodes.length<1||graph.nodes.length>MAX_NODES)return [...errors,`Graph must have 1..${MAX_NODES} nodes`];
  if(!Array.isArray(graph.edges)||graph.edges.length>10000)return [...errors,'Graph must have at most 10000 edges'];
  const ids=new Set<string>();let resources=0,totalText=0;
  for(const n of graph.nodes){
    if(!plain(n)){errors.push('Node must be an object');continue;}
    if(typeof n.id!=='string'||!n.id.trim()||n.id.length>256||ids.has(n.id))errors.push('Node identity is missing, too long, or duplicated');
    ids.add(n.id);
    if(!kinds.has(n.kind))errors.push(`Unknown node kind: ${n.kind}`);
    if(n.kind==='Resource')resources++;
    if(typeof n.label!=='string'||!n.label.trim())errors.push(`Node ${n.id} requires a label`);
    if(n.text!==undefined&&typeof n.text!=='string')errors.push(`Node ${n.id} text must be a string`);
    totalText+=(typeof n.text==='string'?n.text.length:0)+(typeof n.label==='string'?n.label.length:0);
    if(n.action!==undefined&&!actions.has(n.action))errors.push(`Unsupported action: ${n.action}`);
    if(n.supported!==undefined&&typeof n.supported!=='boolean')errors.push(`Node ${n.id} supported must be boolean`);
    if(n.url!==undefined&&!safeURL(n.url))errors.push(`Node ${n.id} URL must be safe HTTP(S)`);
    if(n.action!==undefined&&n.supported!==false){
      if(!compatibleAction(n.kind,n.action))errors.push(`Node ${n.id} action is incompatible with kind`);
      if(['navigate','open-external'].includes(n.action)&&!safeURL(n.url))errors.push(`Node ${n.id} external action requires a safe URL`);
    }
    if(n.evidence!==undefined&&(!Array.isArray(n.evidence)||n.evidence.length>1000||n.evidence.some(e=>typeof e!=='string'||e.length>2048)))errors.push(`Node ${n.id} evidence must be strings`);
    if(Array.isArray(n.evidence))totalText+=n.evidence.reduce((sum,e)=>sum+(typeof e==='string'?e.length:0),0);
    if(plain(n.meta))totalText+=Object.entries(n.meta).reduce((sum,[k,v])=>sum+k.length+(typeof v==='string'?v.length:0),0);
    if(n.meta!==undefined&&(!plain(n.meta)||Object.keys(n.meta).length>100||Object.entries(n.meta).some(([k,v])=>k.length>256||typeof v!=='string'||v.length>4096)))errors.push(`Node ${n.id} metadata must be string values`);
  }
  if(resources!==1)errors.push('Graph requires exactly one Resource node');
  if(totalText>1000000)errors.push('Graph text exceeds 1000000 characters');
  const adjacency=new Map<string,string[]>();const indegree=new Map<string,number>();
  for(const id of ids){adjacency.set(id,[]);indegree.set(id,0);}
  const root=graph.nodes.find(n=>n?.kind==='Resource')?.id;
  for(const e of graph.edges){
    if(!plain(e)||!ids.has(e.from)||!ids.has(e.to)||!edges.has(e.kind)){errors.push('Edge has unknown endpoint or kind');continue;}
    if(e.kind==='contains'){
      if(e.to===root)errors.push('Resource cannot have a containment parent');
      adjacency.get(e.from)!.push(e.to);indegree.set(e.to,indegree.get(e.to)!+1);
    }
  }
  const queue=[...ids].filter(id=>indegree.get(id)===0);let visited=0;
  for(let i=0;i<queue.length;i++){visited++;for(const child of adjacency.get(queue[i])!){const d=indegree.get(child)!-1;indegree.set(child,d);if(d===0)queue.push(child);}}
  if(visited!==ids.size)errors.push('Containment edges must be acyclic');
  return errors;
}
/** First containment parent wins; all nodes still appear once. Deep source trees
 * rewrite at depth 48 rather than risking unbounded renderer recursion. */
export function grammarTree(graph:SemanticGraph):SurfaceNode{
  const nodes=new Map(graph.nodes.map(n=>[n.id,{id:`surface-${n.id}`,semanticId:n.id,role:n.kind.toLowerCase() as SurfaceNode['role'],children:[]} as SurfaceNode]));
  const root=nodes.get(graph.nodes.find(n=>n.kind==='Resource')!.id)!;
  const parents=new Map<string,string>();
  for(const edge of graph.edges)if(edge.kind==='contains'&&!parents.has(edge.to))parents.set(edge.to,edge.from);
  for(const node of graph.nodes){
    if(node.id===root.semanticId)continue;
    let parent=parents.get(node.id),cursor=parent,depth=0;
    while(cursor&&depth<=48){depth++;cursor=parents.get(cursor);}
    if(depth>48)parent=undefined;
    (nodes.get(parent??'')??root).children.push(nodes.get(node.id)!);
  }
  return root;
}
