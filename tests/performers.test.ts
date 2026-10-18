import test from 'node:test';
import assert from 'node:assert/strict';
import { PERFORMERS as P, CAPABILITY_PACK, compose, runPipeline, reconstructTrace, definePerformer, SCHEMAS } from '../packages/performers/src/index.ts';
import type { SemanticGraph } from '../packages/core/src/index.ts';

const graph: SemanticGraph = {version:'1',id:'g1',title:'Space research',sourceUrl:'https://www.nasa.gov/science/',nodes:[{id:'r',kind:'Resource',label:'Space research'},{id:'p',kind:'Text',label:'Mission',text:'A mission studies the atmosphere.',evidence:['fixture:nasa']},{id:'l',kind:'Link',label:'Read mission',url:'https://www.nasa.gov/mission/'}],edges:[{from:'r',to:'p',kind:'contains'},{from:'r',to:'l',kind:'contains'}],provenance:{kind:'fixture',fetchedAt:'2026-10-18T00:00:00Z',contentHash:'fixture1',notice:'Authored fixture'}};
const selection = {graph,nodeId:'p'};

test('capability pack exposes twenty real metadata-rich operations', () => {
 assert.equal(Object.keys(P).length,20);
 assert.equal(CAPABILITY_PACK.performers.length,20);
 for(const op of Object.values(P)) {
  assert.ok(op.input.id && op.output.id && op.preconditions.length && op.postconditions.length);
  assert.ok(op.failureModes.length && op.provenance.source && op.constitutionClauses.length && op.provides.length);
 }
});

test('selection becomes a cited local artifact with reconstructable canonical trace', async () => {
 const pipeline = compose(P.selectPassage,P.selectionContext,P.contextArtifact,P.validateArtifact,P.artifactMarkdown);
 const a = await runPipeline(pipeline,selection);
 const b = await runPipeline(pipeline,selection);
 assert.match(a.output,/A mission studies the atmosphere/);
 assert.match(a.output,/https:\/\/www.nasa.gov\/science/);
 assert.match(a.output,/Authored fixture/);
 assert.deepEqual(a.trace,b.trace);
 assert.equal(reconstructTrace(a.trace).valid,true);
 assert.equal(a.trace.steps.length,5);
 const corrupt = JSON.parse(JSON.stringify(a.trace)); corrupt.steps[0].outputCanonical='{}';
 assert.equal(reconstructTrace(corrupt).valid,false);
});

test('graph projections, evidence-based intents and link pipeline compute useful outputs', async () => {
 assert.equal((await runPipeline(compose(P.validateGraph,P.graphSummary),graph)).output.nodeCount,3);
 assert.equal((await runPipeline(compose(P.graphPassages),graph)).output[0].id,'p');
 const intents = (await runPipeline(compose(P.graphIntentCandidates),graph)).output;
 assert.equal(intents[0].kind,'research'); assert.equal(intents[0].status,'inferred'); assert.ok(intents[0].evidence.length);
 const links = await runPipeline(compose(P.graphLinks,P.uniqueLinks,P.linksMarkdown),graph);
 assert.match(links.output,/Read mission/);
 assert.equal((await runPipeline(compose(P.normalizeText,P.textStats),' a   b\n c ')).output.words,3);
});

test('URL operations reject executable schemes, credentials, local hosts and malformed shapes', async () => {
 for(const url of ['javascript:alert(1)','http://localhost/a','https://127.0.0.1/','https://user:pass@example.com','file:///etc/passwd']) {
  await assert.rejects(runPipeline(compose(P.validateURL),url));
 }
 const result=await runPipeline(compose(P.validateURL,P.externalTarget),'https://www.nasa.gov/a');
 assert.equal(result.output.rel,'noopener noreferrer');
 await assert.rejects(runPipeline(compose(P.graphSummary),{...graph,nodes:[{id:'p',kind:'Text'}]} as unknown as SemanticGraph),/input|schema/i);
 await assert.rejects(runPipeline(compose(P.selectPassage),{graph,nodeId:'missing'}),/passage/i);
});

test('composition rejects schema mismatch and authority escalation before executing any step', async () => {
 assert.throws(()=>compose(P.graphSummary,P.artifactMarkdown),/schema/i);
 let calls=0;
 const first=definePerformer({ ...P.normalizeText,id:'test.first',execute:(text:string)=>{calls++;return text;} });
 const mutate=definePerformer({...P.normalizeText,id:'test.mutation',effects:['external-mutation'],requires:['remote.write'],execute:(text:string)=>text});
 await assert.rejects(runPipeline(compose(first,mutate),'hello',{authority:['pure'],capabilities:{'remote.write':()=>{}}}),/authority/i);
 assert.equal(calls,0);
});

test('postconditions and output schemas reject dishonest performers', async () => {
 const bad=definePerformer({...P.normalizeText,id:'test.bad',execute:()=>42 as unknown as string});
 await assert.rejects(runPipeline(compose(bad),'hello'),/output|schema/i);
 const post=definePerformer({...P.normalizeText,id:'test.post',postconditions:[{description:'must be empty',check:(value:string)=>value===''}]});
 await assert.rejects(runPipeline(compose(post),'hello'),/postcondition/i);
});

test('local save uses an explicitly injected capability and replay records actual output', async () => {
 const artifact=(await runPipeline(compose(P.selectPassage,P.selectionContext,P.contextArtifact),selection)).output;
 let saved: unknown;
 await assert.rejects(runPipeline(compose(P.saveArtifact),artifact),/authority/i);
 await assert.rejects(runPipeline(compose(P.saveArtifact),artifact,{authority:['local-state']}),/capability/i);
 const options={authority:['local-state'] as const,capabilities:{'artifact.write':(value:unknown)=>{saved=structuredClone(value);return value;},'artifact.read':()=>saved}};
 const write=await runPipeline(compose(P.saveArtifact),artifact,options);
 assert.deepEqual(saved,artifact); assert.equal(write.trace.steps[0].status,'executed');
 const read=await runPipeline(compose(P.loadArtifact),artifact.id,options);
 assert.deepEqual(read.output,artifact);
 assert.match((await runPipeline(compose(P.artifactJSON),artifact)).output,/sourceUrl/);
});

test('external reading has no default network implementation and validates injected result', async () => {
 const pipeline=compose(P.validateURL,P.fetchResource);
 await assert.rejects(runPipeline(pipeline,'https://www.nasa.gov/'),/authority/i);
 const cap={'resource.read':async(url:unknown)=>({url,html:'<h1>Mission</h1>',notice:'Injected allowlisted transport'})};
 const result=await runPipeline(pipeline,'https://www.nasa.gov/',{authority:['external-read'],capabilities:cap});
 assert.match(result.output.html,/Mission/);
 await assert.rejects(runPipeline(pipeline,'https://www.nasa.gov/',{authority:['external-read'],capabilities:{'resource.read':()=>({html:3})}}),/output|schema/i);
 assert.equal(SCHEMAS.text.validate(42),false);
});

test('failed capability output retains prior executed steps and records that capability was invoked', async () => {
 const pipeline=compose(P.validateURL,P.fetchResource);
 let failure: unknown;
 try {await runPipeline(pipeline,'https://www.nasa.gov/',{authority:['external-read'],capabilities:{'resource.read':()=>({html:42})}});} catch(error) {failure=error;}
 assert.ok(failure instanceof Error);
 const detail=failure as Error & {trace:{steps:unknown[]};failure:{performer:string;phase:string;invoked:boolean}};
 assert.equal(detail.trace.steps.length,1);
 assert.equal(detail.failure.performer,'fetch-resource');
 assert.equal(detail.failure.phase,'output');
 assert.equal(detail.failure.invoked,true);
});

test('reconstruction rejects unknown performers and altered metadata', async () => {
 const result=await runPipeline(compose(P.normalizeText),' a  b ');
 const unknown=JSON.parse(JSON.stringify(result.trace)); unknown.steps[0].performer='invented';
 assert.equal(reconstructTrace(unknown).valid,false);
 const effect=JSON.parse(JSON.stringify(result.trace)); effect.steps[0].effects=['external-mutation'];
 assert.equal(reconstructTrace(effect).valid,false);
});

test('artifact storage cannot return a different artifact identity', async () => {
 const artifact=(await runPipeline(compose(P.selectPassage,P.selectionContext,P.contextArtifact),selection)).output;
 await assert.rejects(runPipeline(compose(P.loadArtifact),'other-id',{authority:['local-state'],capabilities:{'artifact.read':()=>artifact}}),/identity/i);
});
