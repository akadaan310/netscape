import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical, hash, createRandom, validateGraph, generateSurface, structuralSignature, FAMILIES, type SemanticGraph, type Display, type SurfaceNode } from '../packages/core/src/index.ts';

const display: Display = {width:1440,height:900,dpr:1,input:['keyboard','pointer'],reducedMotion:false,colorScheme:'dark'};
function graph(): SemanticGraph {
  return { version:'1', id:'fixture', title:'Research notebook', sourceUrl:'https://example.org', provenance:{kind:'fixture',fetchedAt:'2026-10-18',contentHash:'authored',notice:'Local authored demo'}, nodes:[
    {id:'root',kind:'Resource',label:'Research notebook'},
    {id:'section',kind:'Section',label:'Evidence'},
    ...Array.from({length:10},(_,i)=>({id:`p${i}`,kind:'Text' as const,label:`Observation ${i}`,text:'Measured evidence with accessible text. '.repeat(i+1)})),
    {id:'select',kind:'Action',label:'Select a passage',action:'select-passage',supported:true},
    {id:'save',kind:'Action',label:'Save artifact',action:'save-artifact',supported:true},
    {id:'disabled',kind:'Form',label:'Checkout unavailable',supported:false},
  ],edges:[{from:'root',to:'section',kind:'contains'},...Array.from({length:10},(_,i)=>({from:'section',to:`p${i}`,kind:'contains' as const}))]};
}
function flatten(node:SurfaceNode):string[] {return [node.semanticId,...node.children.flatMap(flatten)];}

test('canonical hashing and PRNG are reproducible without depending on object key order',()=>{
  assert.equal(canonical({b:2,a:[1,'x']}),'{"a":[1,"x"],"b":2}');
  assert.equal(hash({b:2,a:1}),hash({a:1,b:2}));
  assert.notEqual(hash({a:1}),hash({a:2}));
  const a=createRandom(42),b=createRandom(42),c=createRandom(43);
  const values=Array.from({length:100},()=>a());
  assert.deepEqual(values,Array.from({length:100},()=>b()));
  assert.notDeepEqual(values,Array.from({length:100},()=>c()));
  assert.ok(values.every(v=>v>=0&&v<1));
  assert.throws(()=>canonical({value:NaN}));
  const circular:any={};circular.self=circular;assert.throws(()=>canonical(circular));
});

test('graph validation rejects duplicate identity, missing edges, cycles and unsupported executable actions',()=>{
  assert.deepEqual(validateGraph(graph()),[]);
  for (const mutate of [
    (g:SemanticGraph)=>g.nodes.push({...g.nodes[0]}),
    (g:SemanticGraph)=>g.edges.push({from:'missing',to:'root',kind:'contains'}),
    (g:SemanticGraph)=>g.edges.push({from:'section',to:'root',kind:'contains'}),
    (g:SemanticGraph)=>g.nodes.push({id:'bad',kind:'Action',label:'Bad',action:'purchase' as any}),
  ]) {const g=graph();mutate(g);assert.ok(validateGraph(g).length);assert.throws(()=>generateSurface(g,{seed:1,family:'elastic',display}));}
  assert.ok(validateGraph(null as any).length);
});

test('surface replay preserves every semantic identity and required action in source focus order',()=>{
  const g=graph();const options={seed:17,family:'observatory' as const,display};
  const result=generateSurface(g,options);
  assert.deepEqual(result,generateSurface(g,options));
  assert.deepEqual(new Set(flatten(result.tree)),new Set(g.nodes.map(n=>n.id)));
  assert.equal(flatten(result.tree).length,g.nodes.length);
  assert.deepEqual(result.requiredActions,['select','save']);
  assert.deepEqual(result.regions.map(r=>r.semanticId),g.nodes.map(n=>n.id));
  assert.deepEqual(result.regions.map(r=>r.order),g.nodes.map((_,i)=>i));
  assert.equal(result.hash,hash({...result,hash:undefined}));
});

test('six wide compositions have distinct actual geometry and structural topology',()=>{
  const surfaces=FAMILIES.map(family=>generateSurface(graph(),{seed:93,family,display}));
  assert.equal(new Set(surfaces.map(s=>canonical(s.regions.map(({x,y,width,height})=>({x,y,width,height}))))).size,6);
  assert.equal(new Set(surfaces.map(structuralSignature)).size,6);
  const moved=structuredClone(surfaces[0]);moved.seed=1234;moved.hash='different';
  moved.regions.forEach(r=>{r.id=`new-${r.id}`;r.semanticId=`new-${r.semanticId}`;r.x+=0.001;r.y+=0.001;});
  function rename(n:SurfaceNode){n.id=`new-${n.id}`;n.semanticId=`new-${n.semanticId}`;n.children.forEach(rename);}rename(moved.tree);
  assert.equal(structuralSignature(moved),structuralSignature(surfaces[0]));
  const flow=FAMILIES.map(family=>generateSurface(graph(),{seed:1,family,display:{...display,width:320}}));
  assert.equal(new Set(flow.map(structuralSignature)).size,1,'family labels alone are not evidence of novelty');
});

test('six families across six displays have readable, nonoverlapping scrollable regions',()=>{
  const dimensions=[[320,568],[390,844],[768,1024],[900,390],[1440,900],[1920,1080]];
  for(const family of FAMILIES) for(const [width,height] of dimensions){
    const s=generateSurface(graph(),{seed:12,family,display:{...display,width,height}});
    for(const a of s.regions){
      assert.ok(a.width>=44&&a.height>=44,`${family}: target size`);
      assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=width+0.01&&a.y+a.height<=s.height+0.01,`${family}: scroll bounds`);
      for(const b of s.regions) if(a.order<b.order) assert.ok(a.x+a.width<=b.x+0.01||b.x+b.width<=a.x+0.01||a.y+a.height<=b.y+0.01||b.y+b.height<=a.y+0.01,`${family}: overlap ${a.semanticId}/${b.semanticId}`);
    }
    if(width<600) assert.equal(new Set(s.regions.map(r=>r.x)).size,1);
  }
});

test('long text expands region height and malformed display/seed are rejected',()=>{
  const short=graph(),long=graph();long.nodes[2].text='Long source evidence '.repeat(3000);
  for(const family of FAMILIES){
    const a=generateSurface(short,{seed:1,family,display:{...display,width:320}});
    const b=generateSurface(long,{seed:1,family,display:{...display,width:320}});
    assert.ok(b.regions[2].height>a.regions[2].height+10000);
    assert.ok(b.height>a.height);
  }
  assert.throws(()=>generateSurface(graph(),{seed:NaN,family:'elastic',display}));
  assert.throws(()=>generateSurface(graph(),{seed:1,family:'elastic',display:{...display,width:0}}));
});

test('seeded grammar varies structure and semantic edge perturbations can change grouping',()=>{
  const signatures=new Set(Array.from({length:64},(_,seed)=>structuralSignature(generateSurface(graph(),{seed,family:'observatory',display}))));
  assert.ok(signatures.size>1);
  const g=graph(),before=generateSurface(g,{seed:1,family:'workbench',display});
  g.edges.push({from:'section',to:'save',kind:'contains'});
  assert.notEqual(structuralSignature(before),structuralSignature(generateSurface(g,{seed:1,family:'workbench',display})));
});

test('reading regions reserve hierarchy, eyebrow, footer and multiline label space',()=>{
  const s=generateSurface(graph(),{seed:1,family:'observatory',display});
  assert.ok(s.regions[0].height>=160,'resource hierarchy and provenance footer need room');
  assert.ok(s.regions.find(r=>r.semanticId==='save')!.height>=160,'action label and action instruction need room');
});

test('runtime graph boundary requires safe identity and executable role/action compatibility',()=>{
  for(const change of [
    (g:SemanticGraph)=>{g.version='999';},
    (g:SemanticGraph)=>{g.sourceUrl='javascript:alert(1)';},
    (g:SemanticGraph)=>{g.provenance.fetchedAt='never';},
    (g:SemanticGraph)=>{g.nodes.push({id:'missing-url',kind:'Action',label:'Open',action:'navigate'});},
    ...(['Resource','Section','Group','Form','Evidence','Link','Text','Participant','Artifact'] as const).map(kind=>(g:SemanticGraph)=>{g.nodes.push({id:'blocked',kind,label:'Bad required control',action:kind==='Artifact'?'select-passage':'save-artifact'});}),
  ]){const g=graph();change(g);assert.ok(validateGraph(g).length);}
  const g=graph();g.version='1.0.0';g.nodes.push({id:'detected',kind:'Form',label:'Unavailable',supported:false,action:'save-artifact'});assert.deepEqual(validateGraph(g),[]);
  g.nodes.push({id:'link',kind:'Link',label:'Open',action:'navigate',url:'https://example.org/'});assert.deepEqual(validateGraph(g),[]);
});
