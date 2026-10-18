import {createHash} from 'node:crypto';
import type {Display, SemanticGraph, Surface, SurfaceNode} from '../packages/core/src/index.ts';
export const sha256=(value:unknown):string=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
export function luminance(hex:string):number {
 if(!/^#[\da-f]{6}$/i.test(hex)) throw new Error(`Invalid sRGB hex: ${hex}`);
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
 return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2];
}
export function wcagContrast(a:string,b:string):number {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
export function independentSignature(surface:Surface):string {
 const tree=(n:SurfaceNode):unknown=>[n.role,n.children.map(tree)];
 const regions=[...surface.regions].sort((a,b)=>a.order-b.order);
 // Pairwise ordinal spatial relationships suppress subpixel coordinate noise.
 const relations=regions.map(a=>regions.map(b=>[Math.sign(Math.round((a.x-b.x)*10)),Math.sign(Math.round((a.y-b.y)*10))]));
 return sha256({tree:tree(surface.tree),relations});
}
export function auditSurface(graph:SemanticGraph,surface:Surface,display:Display):string[] {
 const errors:string[]=[];if(!Number.isFinite(surface.width)||!Number.isFinite(surface.height)||surface.width!==display.width||surface.height<display.height)errors.push('canvas-bounds');if(!Object.values(surface.metrics).every(Number.isFinite))errors.push('nonfinite-metrics'); const ids=graph.nodes.map(n=>n.id); const treeIds:string[]=[];
 function walk(n:SurfaceNode){treeIds.push(n.semanticId);for(const c of n.children)walk(c);} walk(surface.tree);
 if(treeIds.length!==ids.length||new Set(treeIds).size!==ids.length||ids.some(id=>!treeIds.includes(id)))errors.push('semantic-tree-coverage');
 const expectedActions=graph.nodes.filter(n=>n.action&&n.supported!==false).map(n=>n.id);
 if(JSON.stringify(expectedActions)!==JSON.stringify(surface.requiredActions))errors.push('required-actions-mismatch');
 if(surface.regions.length!==ids.length||new Set(surface.regions.map(r=>r.semanticId)).size!==ids.length)errors.push('region-coverage');
 for(let i=0;i<surface.regions.length;i++){
  const r=surface.regions[i];if(r.semanticId!==ids[i]||r.order!==i)errors.push(`semantic-order:${r.semanticId}`);
  if(![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.width<=0||r.height<=0)errors.push(`nonfinite-or-empty:${r.semanticId}`);
  if(r.x<0||r.y<0||r.x+r.width>display.width+0.01||r.y+r.height>surface.height+0.01)errors.push(`clip:${r.semanticId}`);
  if(expectedActions.includes(r.semanticId)&&(r.width<24||r.height<24))errors.push(`action-target:${r.semanticId}`);
  for(const b of surface.regions.slice(i+1))if(Math.min(r.x+r.width,b.x+b.width)-Math.max(r.x,b.x)>0.01&&Math.min(r.y+r.height,b.y+b.height)-Math.max(r.y,b.y)>0.01)errors.push(`overlap:${r.semanticId}:${b.semanticId}`);
 }
 for(const id of expectedActions)if(surface.regions.filter(r=>r.semanticId===id).length!==1)errors.push(`unreachable:${id}`);
 return errors;
}
export function dominates(a:readonly number[],b:readonly number[]):boolean {return a.length===b.length&&a.every((n,i)=>n>=b[i])&&a.some((n,i)=>n>b[i]);}
export function paretoRanks(vectors:readonly (readonly number[])[]):number[]{
 const ranks=Array(vectors.length).fill(-1);let rank=0;
 while(ranks.includes(-1)){const candidates=ranks.map((r,i)=>r<0?i:-1).filter(i=>i>=0);const front=candidates.filter(i=>!candidates.some(j=>j!==i&&dominates(vectors[j],vectors[i])));if(!front.length)throw new Error('Non-finite or cyclic metric vector');for(const i of front)ranks[i]=rank;rank++;}return ranks;
}
