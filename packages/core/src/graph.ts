import type { SemanticGraph, SurfaceNode } from './types.ts';
const kinds=new Set(['Resource','Section','Text','Link','Form','Action','Artifact','Participant','Evidence','Group']);
const actions=new Set(['open-external','select-passage','attach-companion','save-artifact','navigate']);
const edges=new Set(['contains','references','navigates','derives','observes','acts_on']);
export const MAX_NODES=1000;
/** Validates untrusted runtime data without recursively walking a hostile graph. */
export function validateGraph(graph:SemanticGraph):string[]{
  const errors:string[]=[];
  if(!graph||typeof graph!=='object')return ['Graph must be an object'];
  for(const key of ['version','id','title','sourceUrl'] as const)if(typeof graph[key]!=='string'||!graph[key].trim())errors.push(`Graph ${key} must be a nonempty string`);
  const p=graph.provenance;
  if(!p||!['fixture','public'].includes(p.kind)||['fetchedAt','contentHash','notice'].some(k=>typeof (p as any)[k]!=='string'||!(p as any)[k].trim()))errors.push('Graph provenance is required');
  if(!Array.isArray(graph.nodes)||graph.nodes.length<1||graph.nodes.length>MAX_NODES)return [...errors,`Graph must have 1..${MAX_NODES} nodes`];
  if(!Array.isArray(graph.edges)||graph.edges.length>10000)return [...errors,'Graph must have at most 10000 edges'];
  const ids=new Set<string>();let resources=0,totalText=0;
  for(const n of graph.nodes){
    if(!n||typeof n!=='object'){errors.push('Node must be an object');continue;}
    if(typeof n.id!=='string'||!n.id.trim()||n.id.length>256||ids.has(n.id))errors.push('Node identity is missing, too long, or duplicated');
    ids.add(n.id);
    if(!kinds.has(n.kind))errors.push(`Unknown node kind: ${n.kind}`);
    if(n.kind==='Resource')resources++;
    if(typeof n.label!=='string'||!n.label.trim())errors.push(`Node ${n.id} requires a label`);
    if(n.text!==undefined&&typeof n.text!=='string')errors.push(`Node ${n.id} text must be a string`);
    totalText+=(typeof n.text==='string'?n.text.length:0)+(typeof n.label==='string'?n.label.length:0);
    if(n.action!==undefined&&!actions.has(n.action))errors.push(`Unsupported action: ${n.action}`);
    if(n.supported!==undefined&&typeof n.supported!=='boolean')errors.push(`Node ${n.id} supported must be boolean`);
    if(n.url!==undefined){try{const u=new URL(n.url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error();}catch{errors.push(`Node ${n.id} URL must be safe HTTP(S)`);}}
    if(n.evidence!==undefined&&(!Array.isArray(n.evidence)||n.evidence.some(e=>typeof e!=='string')))errors.push(`Node ${n.id} evidence must be strings`);
    if(n.meta!==undefined&&(!n.meta||typeof n.meta!=='object'||Array.isArray(n.meta)||Object.values(n.meta).some(v=>typeof v!=='string')))errors.push(`Node ${n.id} metadata must be string values`);
  }
  if(resources!==1)errors.push('Graph requires exactly one Resource node');
  if(totalText>1000000)errors.push('Graph text exceeds 1000000 characters');
  const adjacency=new Map<string,string[]>();const indegree=new Map<string,number>();
  for(const id of ids){adjacency.set(id,[]);indegree.set(id,0);}
  const root=graph.nodes.find(n=>n?.kind==='Resource')?.id;
  for(const e of graph.edges){
    if(!e||typeof e!=='object'||!ids.has(e.from)||!ids.has(e.to)||!edges.has(e.kind)){errors.push('Edge has unknown endpoint or kind');continue;}
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
