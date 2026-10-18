import assert from 'node:assert/strict';
import {interpretHTML} from '../../packages/resource-interpreter/src/index.ts';
import {generateSurface,validateGraph,hash} from '../../packages/core/src/index.ts';
import {createManifest,replayManifest,validateWorkspace} from '../../packages/conformance/src/index.ts';
import {PERFORMERS as P,compose,runPipeline,definePerformer} from '../../packages/performers/src/index.ts';
const display:any={width:768,height:1024,dpr:1,input:['keyboard'],reducedMotion:true,colorScheme:'light'};
const base=()=>interpretHTML('<title>Source</title><p>Passage</p><a href="https://example.org/a">Read</a>','https://example.org/',{kind:'fixture',fetchedAt:'2026-10-18'}).graph;
const graph=base(),surface=generateSurface(graph,{seed:1,family:'folded',display}),manifest=createManifest(graph,surface,display);
assert.equal(manifest.version,2);assert.deepEqual(replayManifest(JSON.parse(JSON.stringify(manifest))),surface);
for(const [name,change] of Object.entries({url:(m:any)=>{m.graph.nodes.find((n:any)=>n.kind==='Link').url='https://evil.example/phishing'},tick:(m:any)=>{m.tick=-1},regions:(m:any)=>{m.expectedRegions=[]},interactions:(m:any)=>{m.interactions=[]},provenance:(m:any)=>{m.provenance.notice='changed'},invariants:(m:any)=>{m.hardInvariants=[]},color:(m:any)=>{m.chromaticField={text:'invalid'}}})){
 const corrupt=structuredClone(manifest);change(corrupt);assert.throws(()=>replayManifest(corrupt));console.log(name,'rejected');
 if(['regions','interactions','provenance','invariants'].includes(name)){const {integrityHash,...body}=corrupt;corrupt.integrityHash=hash(body);assert.throws(()=>replayManifest(corrupt));console.log(name,'rejected with updated digest')}
}
for(const kind of ['Resource','Section','Group','Form']){const g=base();const n:any=kind==='Resource'?g.nodes[0]:{id:kind,kind,label:kind};n.action='save-artifact';n.supported=true;if(kind!=='Resource')g.nodes.push(n);assert.ok(validateGraph(g).length);console.log(kind,'rejected')}
for(const action of ['navigate','open-external']){const g=base();g.nodes.push({id:'missing',kind:'Action',label:'Open',action:action as any});assert.ok(validateGraph(g).length);console.log(action,'missing URL rejected')}
graph.nodes[0].label='Caller mutation';surface.regions[0].x=999;assert.doesNotThrow(()=>replayManifest(manifest));console.log('manifest snapshots detached');
for(const bad of [null,false,0,''])assert.equal(validateWorkspace({version:1,seed:1,family:'folded',resource:'nasa',graph:bad,artifacts:[]}),false);
for(const name of ['constructor','toString','__proto__']){let ran=false;const extension=definePerformer({...P.normalizeText,id:'review-'+name,requires:[name],execute:(s,c)=>{ran=true;assert.equal(Object.getPrototypeOf(c.capabilities),null);assert.equal(Object.hasOwn(c.capabilities,name),true);return s}});await assert.rejects(runPipeline(compose(extension),'hello'));await assert.rejects(runPipeline(compose(extension),'hello',{capabilities:Object.create({[name]:()=>{}})}));assert.equal(ran,false);await runPipeline(compose(extension),'hello',{capabilities:{[name]:()=>{}}});assert.equal(ran,true);console.log(name,'own capability only')}
for(const seed of [-1,4294967296]){const g=base();const s=generateSurface(g,{seed,family:'folded',display});try{createManifest(g,s,display);console.log('seed',seed,'manifest accepted')}catch(e){console.log('seed',seed,'surface valid but manifest rejected',String(e))}}
console.log('focused re-review assertions passed');
