import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditRegions,auditActionMap,createManifest,replayManifest,CONSTITUTION,validateWorkspace} from '../packages/conformance/src/index';
import {generateSurface} from '@netscape/core';
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
