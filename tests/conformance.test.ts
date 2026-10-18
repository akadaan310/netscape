import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditRegions,auditActionMap,createManifest,replayManifest,CONSTITUTION,validateWorkspace,artifactDigest} from '../packages/conformance/src/index';
import {generateSurface,hash} from '@netscape/core';
import {createWorld,enqueueEvent,stepWorld,worldManifest} from '@netscape/dynamics';
import {interpretHTML} from '@netscape/resource-interpreter';
import {readFileSync} from 'node:fs';

test('independent geometric oracle catches clipping, overlap and narrow targets',()=>{
  assert.deepEqual(auditRegions([{id:'a',x:0,y:0,width:100,height:44}],320),[]);
  assert.ok(auditRegions([{id:'a',x:300,y:0,width:100,height:44}],320).some(x=>x.includes('clip')));
  assert.ok(auditRegions([{id:'a',x:0,y:0,width:20,height:20}],320).some(x=>x.includes('target')));
  assert.ok(auditRegions([{id:'a',x:0,y:0,width:100,height:44},{id:'b',x:0,y:20,width:100,height:44}],320).some(x=>x.includes('overlap')));
});
test('semantic oracle catches wrong action and missing capabilities',()=>{
  const expected=[{id:'save',action:'save-artifact',supported:true}];
  assert.deepEqual(auditActionMap(expected,[{id:'save',action:'save-artifact'}]),[]);
  assert.ok(auditActionMap(expected,[{id:'save',action:'checkout'}]).length>0);
  assert.ok(auditActionMap(expected,[]).length>0);
});
test('all constitutional clauses have separate enforcement revision',()=>{
  assert.equal(CONSTITUTION.clauses.length,12);
  assert.notEqual(CONSTITUTION.version,CONSTITUTION.enforcementRevision);
});
test('corrupt persisted workspace is rejected with no unsafe values',()=>{
  assert.equal(validateWorkspace(null),false);
  assert.equal(validateWorkspace({version:999}),false);
  assert.equal(validateWorkspace({version:1,seed:NaN,family:'orbital',resource:'nasa',artifacts:[]}),false);
});
test('manifest reconstructs actual generated geometry and rejects tampering',()=>{
  const {graph}=interpretHTML(readFileSync('fixtures/nasa.html','utf8'),'https://www.nasa.gov/demo',{kind:'fixture',fetchedAt:'2026-10-18T00:00:00.000Z'});
  const display:any={width:390,height:844,dpr:1,input:['keyboard','touch'],reducedMotion:true,colorScheme:'light'};
  const surface=generateSurface(graph,{seed:7,family:'orbital',display});
  const manifest=createManifest(graph,surface,display);
  assert.deepEqual(replayManifest(JSON.parse(JSON.stringify(manifest))),surface);
  assert.throws(()=>replayManifest({...manifest,seed:8}),/digest/);
  assert.throws(()=>replayManifest({...manifest,grammarVersion:'unknown'}),/version/);
});

test('replay binds complete graph and every manifest field and detaches mutable source values',()=>{
  const {graph}=interpretHTML('<title>Source</title><p>Original passage</p><a href="https://example.org/a">Read</a>','https://example.org/',{kind:'fixture',fetchedAt:'2026-10-18'});
  const display:any={width:768,height:1024,dpr:1,input:['keyboard'],reducedMotion:true,colorScheme:'light'};
  const surface=generateSurface(graph,{seed:1,family:'folded',display});const m=createManifest(graph,surface,display);
  for(const change of [
    (x:any)=>{x.graph.nodes.find((n:any)=>n.kind==='Link').url='https://evil.example/phishing';},
    (x:any)=>{x.tick=-1;},(x:any)=>{x.tick=1;},(x:any)=>{x.expectedRegions=[];},
    (x:any)=>{x.interactions=[{id:'x',action:'navigate'}];},(x:any)=>{x.hardInvariants=[];},
    (x:any)=>{x.provenance.notice='Changed';},(x:any)=>{x.chromaticField={text:'invalid'};},
  ]){const corrupt=structuredClone(m);change(corrupt);assert.throws(()=>replayManifest(corrupt));}
  graph.nodes[0].label='Mutated caller';surface.regions[0].x=999;display.width=900;
  assert.notEqual(m.graph.nodes[0].label,'Mutated caller');assert.notEqual(m.expectedRegions[0].x,999);assert.equal(m.display.width,768);assert.doesNotThrow(()=>replayManifest(m));
});

test('workspace type guard rejects corrupt optional and nested JSON shapes without throwing',()=>{
  const base:any={version:1,seed:1,family:'orbital',resource:'nasa',artifacts:[]};
  assert.equal(validateWorkspace(base),true);
  for(const partial of [{graph:null},{graph:false},{selectedId:{}},{selectedId:'missing'},{attached:'yes'},{tick:-1},{resource:'x'.repeat(2049)},{unexpected:JSON.parse('['.repeat(120)+'0'+']'.repeat(120))}])assert.equal(validateWorkspace({...base,...partial}),false);
  const bad={id:'a',title:'A',passage:'x',sourceUrl:'https://example.org/',sourceTitle:'E',createdAt:'now',evidence:[],digest:'bad',manifest:{version:1},extra:JSON.parse('['.repeat(120)+'0'+']'.repeat(120))};
  assert.doesNotThrow(()=>validateWorkspace({...base,artifacts:[bad]}));assert.equal(validateWorkspace({...base,artifacts:[bad]}),false);
});

test('metadata must equal regeneration even after ordinary integrity digest is recomputed',()=>{
  const {graph}=interpretHTML('<title>Source</title><p>Source passage</p>','https://example.org/',{kind:'fixture',fetchedAt:'2026-10-18'});
  const display:any={width:768,height:1024,dpr:1,input:['keyboard'],reducedMotion:true,colorScheme:'light'};
  const m=createManifest(graph,generateSurface(graph,{seed:1,family:'folded',display}),display);
  for(const change of [(x:any)=>{x.expectedRegions[0].x++;},(x:any)=>{x.interactions=[];},(x:any)=>{x.provenance.notice='changed';},(x:any)=>{x.hardInvariants=[];}]){
    const corrupt=structuredClone(m);change(corrupt);const {integrityHash,...body}=corrupt;corrupt.integrityHash=hash(body);assert.throws(()=>replayManifest(corrupt));
  }
});

test('real dynamics replay and inferred source evidence survive serialization and reject corruption',()=>{
  const {graph}=interpretHTML('<title>Source</title><p>Source passage</p>','https://example.org/',{kind:'fixture',fetchedAt:'2026-10-18'});
  const display:any={width:768,height:1024,dpr:1,input:['keyboard'],reducedMotion:true,colorScheme:'light'};
  const world=createWorld({seed:1,nodes:graph.nodes.map((n,i)=>({id:n.id,x:i*30,y:0})),edges:[]});
  enqueueEvent(world,{id:'select-1',tick:1,nodeId:graph.nodes[1].id,kind:'select',strength:1});stepWorld(world,10);
  const dynamics=worldManifest(world);const intents:any=[{kind:'general',confidence:.5,evidence:[graph.nodes[1].id],status:'inferred'}];
  const m=createManifest(graph,generateSurface(graph,{seed:1,family:'folded',display}),display,10,{text:'#123456'},dynamics,intents);
  const workspace:any={version:1,seed:1,family:'folded',resource:'nasa',graph,tick:10,dynamics,intents,artifacts:[],selectedId:graph.nodes.find(n=>n.kind==='Text')!.id,attached:false};
  assert.deepEqual(replayManifest(JSON.parse(JSON.stringify(m))).regions,m.expectedRegions);assert.equal(validateWorkspace(JSON.parse(JSON.stringify(workspace))),true);
  const artifact:any={id:'a',title:'Source',passage:'Source passage',sourceUrl:graph.sourceUrl,sourceTitle:'Source',createdAt:'2026-10-18T00:00:00Z',evidence:[],manifest:m};artifact.digest=artifactDigest(artifact);workspace.artifacts=[artifact];assert.equal(validateWorkspace(workspace),true);
  for(const change of [(x:any)=>{x.tick++;},(x:any)=>{x.dynamics.traceHash='changed';},(x:any)=>{x.dynamics.events[0].strength=.2;},(x:any)=>{x.intents[0].evidence=['missing'];}]){
    const corrupt=structuredClone(m);change(corrupt);const {integrityHash,...body}=corrupt;corrupt.integrityHash=hash(body);assert.throws(()=>replayManifest(corrupt));
  }
  assert.equal(validateWorkspace({...workspace,intents:[{...intents[0],confidence:NaN}]}),false);
  assert.equal(validateWorkspace({...workspace,dynamics:{...dynamics,traceHash:'bad'}}),false);
});

test('manifest replay preserves every safe integer seed accepted by core',()=>{
  const {graph}=interpretHTML('<title>Source</title><p>Passage</p>','https://example.org/',{kind:'fixture',fetchedAt:'2026-10-18'});
  const display:any={width:768,height:1024,dpr:1,input:['keyboard'],reducedMotion:true,colorScheme:'light'};
  for(const seed of [-1,4294967296]){
    const surface=generateSurface(graph,{seed,family:'folded',display});
    const manifest=createManifest(graph,surface,display);
    assert.deepEqual(replayManifest(JSON.parse(JSON.stringify(manifest))),surface);
  }
});
