import {test} from 'node:test';
import assert from 'node:assert/strict';
import {interpretHTML} from '@netscape/resource-interpreter';
import {generateSurface,type Display} from '@netscape/core';
import {createManifest,validateWorkspace,type SavedArtifact} from '@netscape/conformance';
import {appendArtifact} from '../apps/web/lib/artifacts';

test('bounded artifact shelf keeps unique IDs and valid cold replay after52 saves of the same passage',()=>{
  const {graph,intents}=interpretHTML('<title>Research source</title><p>Keep this source passage with its citation.</p>','https://example.org/source',{kind:'fixture',fetchedAt:'2026-10-18T00:00:00.000Z'});
  const display:Display={width:390,height:844,dpr:1,input:['keyboard'],reducedMotion:true,colorScheme:'light'};
  const manifest=createManifest(graph,generateSurface(graph,{seed:7,family:'folded',display}),display,0,{},undefined,intents);
  const body={title:'Selected passage',passage:'Keep this source passage with its citation.',sourceUrl:graph.sourceUrl,sourceTitle:graph.title,evidence:[],createdAt:'2026-10-18T00:00:00.000Z',manifest};
  let artifacts:SavedArtifact[]=[];
  for(let i=0;i<52;i++)artifacts=appendArtifact(artifacts,'artifact-same-source',body);
  assert.equal(artifacts.length,50);
  assert.equal(new Set(artifacts.map(a=>a.id)).size,50);
  assert.equal(artifacts[0].id,'artifact-same-source-52');
  const workspace={version:1,graph,intents,seed:7,family:'folded',resource:graph.sourceUrl,artifacts};
  assert.equal(validateWorkspace(JSON.parse(JSON.stringify(workspace))),true);
});
