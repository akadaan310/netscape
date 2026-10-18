import { canonical, createRandom, hash } from './deterministic.ts';
import { grammarTree, validateGraph } from './graph.ts';
import { FAMILIES, GRAMMAR_VERSION, type Display, type Family, type Region, type SemanticGraph, type SemanticNode, type Surface, type SurfaceNode } from './types.ts';
const GAP=18;
const PAD=24;
/** Conservative 16px text / 26px leading estimate, including long unbroken words
 * and explicit line breaks. Renderers should keep normal text <=16px and use
 * overflow-wrap:anywhere; labels have a separate 20px/28px allowance. */
export function estimateHeight(node:SemanticNode,width:number):number{
  const available=Math.max(1,width-48);
  const lines=(text:string,charWidth:number)=>text.split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil(Array.from(line).length*charWidth/available)),0);
  const resource=node.kind==='Resource';
  const footer=node.action?52:node.supported===false||node.kind==='Form'?56:resource?40:node.kind==='Evidence'?36:0;
  return Math.max(120,48+34+lines(node.label,resource?18:11)*(resource?40:28)+(node.text?18+lines(node.text,9.3)*26:0)+footer);
}
function validDisplay(d:Display):boolean{
  return !!d&&Number.isFinite(d.width)&&d.width>=160&&d.width<=8192&&Number.isFinite(d.height)&&d.height>=160&&d.height<=8192&&Number.isFinite(d.dpr)&&d.dpr>0&&d.dpr<=8&&Array.isArray(d.input)&&d.input.every(i=>['keyboard','pointer','touch'].includes(i))&&typeof d.reducedMotion==='boolean'&&['dark','light'].includes(d.colorScheme);
}
/** Deterministic typed grammar + six discrete layout solvers. All packing work is
 * bounded by the validated 1000-node graph; no clock, DOM, or global RNG. */
export function generateSurface(graph:SemanticGraph,options:{seed:number;family:Family;display:Display}):Surface{
  const errors=validateGraph(graph);if(errors.length)throw new Error(`Invalid semantic graph: ${errors.join('; ')}`);
  if(!options||!FAMILIES.includes(options.family)||!validDisplay(options.display))throw new Error('Invalid family or display (CSS dimensions must be 160..8192)');
  const random=createRandom(options.seed),d=options.display;
  const tree=grammarTree(graph),width=d.width,inner=width-PAD*2;
  const regions:Region[]=[];
  const add=(i:number,x:number,y:number,w:number)=>{const node=graph.nodes[i];const r={id:`region-${node.id}`,semanticId:node.id,x:Math.round(x*100)/100,y:Math.round(y*100)/100,width:Math.round(w*100)/100,height:estimateHeight(node,w),order:i};regions.push(r);return r;};
  const header=add(0,PAD,PAD,inner); // source order always defines keyboard order
  const start=header.y+header.height+GAP;
  let topology:string;
  if(width<600){
    topology='flow';let y=start;
    for(let i=1;i<graph.nodes.length;i++){const r=add(i,PAD,y,inner);y+=r.height+GAP;}
  }else if(options.family==='observatory'){
    // Orthogonal observation grid: seed chooses column count and a mirrored rail.
    const maxCols=Math.max(2,Math.min(3,Math.floor((inner+GAP)/(220+GAP))));
    const columns=2+Math.floor(random()*(maxCols-1));
    const mirrored=random()<0.5;const cell=(inner-GAP*(columns-1))/columns;
    topology=`orthogonal-${columns}-${mirrored?'west':'east'}`;
    let y=start;
    for(let i=1;i<graph.nodes.length;){let rowHeight=0;for(let col=0;col<columns&&i<graph.nodes.length;col++,i++){const x=PAD+(mirrored?columns-col-1:col)*(cell+GAP);rowHeight=Math.max(rowHeight,add(i,x,y,cell).height);}y+=rowHeight+GAP;}
  }else if(options.family==='orbital'){
    // Elliptic angular anchors, followed by exact rectangle collision projection.
    // Long text changes ring separation instead of colliding with the next ring.
    topology='elliptic-rings';const card=Math.max(220,Math.min(340,inner*0.37));
    const rx=(inner-card)/2;const phase=random()<0.5?0:Math.PI/3;let base=start;
    for(let first=1;first<graph.nodes.length;first+=6){
      const count=Math.min(6,graph.nodes.length-first);
      const maxH=Math.max(...graph.nodes.slice(first,first+count).map(n=>estimateHeight(n,card)));
      const ry=Math.max(140,maxH*0.65);let end=base;
      for(let k=0;k<count;k++){
        const angle=-Math.PI/2+phase+k*Math.PI/3;
        const x=PAD+rx+Math.cos(angle)*rx;let y=base+ry+Math.sin(angle)*ry;
        const height=estimateHeight(graph.nodes[first+k],card);
        // Each projection moves past at least one prior rectangle; n iterations suffice.
        for(const other of [...regions].sort((a,b)=>a.y-b.y))if(x<other.x+other.width+GAP&&x+card+GAP>other.x&&y<other.y+other.height+GAP&&y+height+GAP>other.y)y=other.y+other.height+GAP;
        const r=add(first+k,x,y,card);end=Math.max(end,r.y+r.height+GAP);
      }
      base=end+GAP;
    }
  }else if(options.family==='elastic'){
    // Degree-weighted masonry: golden-ratio columns and shortest-column packing.
    topology='weighted-masonry';const ratio=random()<0.5?0.382:0.618;
    const left=Math.max(220,Math.min(inner-220-GAP,(inner-GAP)*ratio));
    const widths=[left,inner-GAP-left],ys=[start,start];
    const degree=new Map(graph.nodes.map(n=>[n.id,graph.edges.filter(e=>e.from===n.id||e.to===n.id).length]));
    for(let i=1;i<graph.nodes.length;i++){
      const importance=degree.get(graph.nodes[i].id)!;
      const col=importance>3?(widths[0]>=widths[1]?0:1):(ys[0]<=ys[1]?0:1);
      const r=add(i,PAD+(col===1?widths[0]+GAP:0),ys[col],widths[col]);ys[col]+=r.height+GAP;
    }
  }else if(options.family==='folded'){
    // Accordion folds: full-width vertical reading with alternating inset depths.
    const folds=2+Math.floor(random()*3);topology=`accordion-${folds}`;let y=start;
    const inset=Math.min(54,(inner-220)/(folds+1));
    for(let i=1;i<graph.nodes.length;i++){
      const depth=1+(i-1)%folds,w=inner-inset*depth;
      const x=PAD+(Math.floor((i-1)/folds)%2===0?inset*depth:0);
      const r=add(i,x,y,w);y+=r.height+GAP;
    }
  }else if(options.family==='workbench'){
    // Semantic swimlanes: containment owner controls lane, lanes pack independently.
    const columns=inner>=1000?3:2;topology=`semantic-lanes-${columns}`;
    const w=(inner-GAP*(columns-1))/columns,ys=Array(columns).fill(start) as number[];
    const owner=new Map<string,string>();for(const edge of graph.edges)if(edge.kind==='contains'&&!owner.has(edge.to))owner.set(edge.to,edge.from);
    const assignments=new Map<string,number>();let next=Math.floor(random()*columns);
    for(let i=1;i<graph.nodes.length;i++){
      const key=owner.get(graph.nodes[i].id)??graph.nodes[i].id;
      if(!assignments.has(key)){assignments.set(key,next%columns);next++;}
      const col=assignments.get(key)!;const r=add(i,PAD+col*(w+GAP),ys[col],w);ys[col]+=r.height+GAP;
    }
  }else{
    // Binary area bands: alternating 1/3 and 2/3 splits, unlike equal grid or
    // independently packed lanes. A complete row advances by its larger child.
    topology='binary-area-bands';let y=start;const flip=random()<0.5;
    for(let i=1;i<graph.nodes.length;){
      if(i===graph.nodes.length-1){const r=add(i++,PAD,y,inner);y+=r.height+GAP;continue;}
      const reverse=(Math.floor(i/2)%2===0)!==flip;
      const small=Math.max(220,(inner-GAP)/3),large=inner-GAP-small;
      const w1=reverse?large:small,w2=reverse?small:large;
      const a=add(i++,PAD,y,w1),b=add(i++,PAD+w1+GAP,y,w2);y+=Math.max(a.height,b.height)+GAP;
    }
  }
  const height=Math.max(d.height,...regions.map(r=>r.y+r.height+PAD));
  const area=regions.reduce((sum,r)=>sum+r.width*r.height,0),canvas=width*height;
  const groups=graph.edges.filter(e=>e.kind==='contains').length;
  const result:Surface={version:GRAMMAR_VERSION,graphId:graph.id,seed:options.seed,family:options.family,tree,regions,width,height,topology,requiredActions:graph.nodes.filter(n=>n.action&&n.supported!==false).map(n=>n.id),metrics:{compactness:area/canvas,legibility:Math.min(1,Math.min(...regions.map(r=>r.width))/320),whitespace:1-area/canvas,grouping:Math.min(1,groups/Math.max(1,graph.nodes.length-1)),motionEnergy:0},hash:''};
  result.hash=hash({...result,hash:undefined});return result;
}
/** Structural equivalence ignores identity, seed, family labels, hashes, exact
 * coordinates and tiny noise. It records typed containment, coarse width classes,
 * and pairwise horizontal/vertical ordering. It does NOT claim perceptual novelty.
 * Distinct seeds may intentionally share the same signature. */
export function structuralSignature(surface:Surface):string{
  const tree=(n:SurfaceNode):unknown=>({role:n.role,children:n.children.map(tree)});
  const regions=[...surface.regions].sort((a,b)=>a.order-b.order);
  const relations:string[]=[];const tolerance=2;
  for(let i=0;i<regions.length;i++)for(let j=i+1;j<regions.length;j++){
    const a=regions[i],b=regions[j];
    const horizontal=a.x+a.width<=b.x+tolerance?'L':b.x+b.width<=a.x+tolerance?'R':'X';
    const vertical=a.y+a.height<=b.y+tolerance?'A':b.y+b.height<=a.y+tolerance?'B':'Y';
    relations.push(horizontal+vertical);
  }
  return canonical({tree:tree(surface.tree),widths:regions.map(r=>Math.round(r.width/surface.width*8)),relations});
}
