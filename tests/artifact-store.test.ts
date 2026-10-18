import {test} from 'node:test';
import assert from 'node:assert/strict';
import {interpretHTML} from '@netscape/resource-interpreter';
import {generateSurface,type Display} from '@netscape/core';
import {createManifest,validateWorkspace,type SavedArtifact} from '@netscape/conformance';
import {appendArtifact} from '../apps/web/lib/artifacts';
import * as artifactStore from '../apps/web/lib/artifacts';
import {createWorld,enqueueEvent,stepWorld,worldManifest} from '@netscape/dynamics';
import {readFileSync} from 'node:fs';

test('bounded artifact shelf keeps unique IDs and valid cold replay after52 saves of the same passage',()=>{
  const {graph,intents}=interpretHTML('<title>Research source</title><p>Keep this source passage with its citation.</p>','https://example.org/source',{kind:'fixture',fetchedAt:'2026-10-18T00:00:00.000Z'});
  const display:Display={width:390,height:844,dpr:1,input:['keyboard'],reducedMotion:true,colorScheme:'light'};
  const manifest=createManifest(graph,generateSurface(graph,{seed:7,family:'folded',display}),display,0,{},undefined,intents);
  const body={title:'Selected passage',passage:'Keep this source passage with its citation.',sourceUrl:graph.sourceUrl,sourceTitle:graph.title,evidence:[],createdAt:'2026-10-18T00:00:00.000Z',manifest};
  let artifacts:SavedArtifact[]=[];
  const context={version:1 as const,graph,intents,seed:7,family:'folded' as const,resource:graph.sourceUrl};
  for(let i=0;i<52;i++)artifacts=appendArtifact(artifacts,'artifact-same-source',body,context);
  assert.equal(artifacts.length,50);
  assert.equal(new Set(artifacts.map(a=>a.id)).size,50);
  assert.equal(artifacts[0].id,'artifact-same-source-52');
  const workspace={version:1,graph,intents,seed:7,family:'folded',resource:graph.sourceUrl,artifacts};
  assert.equal(validateWorkspace(JSON.parse(JSON.stringify(workspace))),true);
});

function eventfulShelf(){
  const {graph,intents}=interpretHTML(readFileSync('fixtures/nasa.html','utf8'),'https://science.nasa.gov/exoplanets/',{kind:'fixture',fetchedAt:'2026-10-18T00:00:00.000Z'});
  const display:Display={width:390,height:844,dpr:1,input:['keyboard'],reducedMotion:true,colorScheme:'light'};
  const world=createWorld({seed:7,nodes:graph.nodes.map((n,i)=>({id:n.id,x:i*10,y:0})),edges:graph.edges.map(e=>({from:e.from,to:e.to})),reducedMotion:true});
  stepWorld(world,10000);
  for(let i=0;i<20;i++){enqueueEvent(world,{id:`play-${i}`,tick:world.tick,nodeId:graph.nodes[0].id,kind:'playful',strength:1});stepWorld(world,240);}
  const dynamics=worldManifest(world);
  const manifest=createManifest(graph,generateSurface(graph,{seed:7,family:'folded',display}),display,dynamics.tick,{},dynamics,intents);
  const workspace={version:1 as const,graph,intents,seed:7,family:'folded' as const,resource:graph.sourceUrl,dynamics,tick:dynamics.tick};
  const body={title:'Selected passage',passage:'Keep the NASA citation.',sourceUrl:graph.sourceUrl,sourceTitle:graph.title,evidence:[],createdAt:'2026-10-18T00:00:00.000Z',manifest};
  return {workspace,body};
}

test('append rejects the first artifact over the combined replay budget without evicting saved work',()=>{
  const {workspace,body}=eventfulShelf();let artifacts:SavedArtifact[]=[];
  for(let i=0;i<45;i++)artifacts=appendArtifact(artifacts,'eventful',body,workspace);
  const retained=JSON.stringify(artifacts);
  assert.throws(()=>appendArtifact(artifacts,'eventful',body,workspace),/limit|budget/i);
  assert.equal(JSON.stringify(artifacts),retained);
  assert.equal(artifacts.length,45);
  assert.equal(validateWorkspace({...workspace,artifacts}),true);
});

test('persistence preflight never replaces a recoverable record with an over-budget world or invalid schema',()=>{
  const {workspace,body}=eventfulShelf();const artifacts=[appendArtifact([],'eventful',body,workspace)[0]];
  let saved='previous recoverable record',writes=0;
  const write=(json:string)=>{saved=json;writes++;};
  artifactStore.persistWorkspace({...workspace,artifacts},write);
  const accepted=saved;assert.equal(writes,1);assert.equal(validateWorkspace(JSON.parse(saved)),true);
  const excessive={...workspace,dynamics:{...workspace.dynamics,tick:100001},tick:100001,artifacts};
  assert.throws(()=>artifactStore.persistWorkspace(excessive,write),/limit|budget/i);
  assert.throws(()=>artifactStore.persistWorkspace({...workspace,resource:'x'.repeat(2072),artifacts},write),/limit|budget/i);
  assert.equal(saved,accepted);assert.equal(writes,1);
  assert.throws(()=>appendArtifact(artifacts,'invalid-source',{...body,sourceUrl:'x'.repeat(2072)},workspace),/limit|budget/i);
  assert.equal(artifacts.length,1);
  let shelf:SavedArtifact[]=[];
  for(let i=0;i<45;i++)shelf=appendArtifact(shelf,'eventful',body,workspace);
  const workOverflow={...workspace,dynamics:{...workspace.dynamics,tick:30000},tick:30000,artifacts:shelf};
  assert.throws(()=>artifactStore.persistWorkspace(workOverflow,write),/limit|budget/i);
  assert.equal(saved,accepted);assert.equal(writes,1);
});
