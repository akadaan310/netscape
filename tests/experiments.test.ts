import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {interpretHTML} from '../packages/resource-interpreter/src/index.ts';
import {generateSurface,type Display} from '../packages/core/src/index.ts';
import {wcagContrast,auditSurface,sha256,independentSignature,paretoRanks} from '../experiments/oracles.ts';
import {createReplayManifest,replay} from '../experiments/replay.ts';
const display:Display={width:1440,height:900,dpr:1,input:['keyboard','pointer'],reducedMotion:false,colorScheme:'dark'};
async function fixture(){const html=await readFile(new URL('../fixtures/nasa.html',import.meta.url),'utf8');return {html,graph:interpretHTML(html,'https://www.nasa.gov/science/',{kind:'fixture',fetchedAt:'2026-10-18T00:00:00.000Z'}).graph};}

test('independent contrast oracle matches published boundary examples and rejects invalid colors',()=>{
 assert.equal(wcagContrast('#000000','#ffffff'),21);
 assert.equal(wcagContrast('#ffffff','#ffffff'),1);
 assert.ok(wcagContrast('#767676','#ffffff')>=4.5);
 assert.ok(wcagContrast('#777777','#ffffff')<4.5);
 assert.throws(()=>wcagContrast('white','#ffffff'));
});

test('independent surface audit catches isolated clipping, overlap, missing actions and order corruptions',async()=>{
 const {graph}=await fixture();const base=generateSurface(graph,{seed:9,family:'observatory',display});assert.deepEqual(auditSurface(graph,base,display),[]);
 const mutations:[string,(s:typeof base)=>void][]=[
  ['canvas-bounds',s=>{s.height=NaN;}],
  ['nonfinite-metrics',s=>{s.metrics.legibility=NaN;}],
  ['clip:',s=>{s.regions[0].x=1440;}],
  ['overlap:',s=>{s.regions[1].x=s.regions[0].x;s.regions[1].y=s.regions[0].y;}],
  ['required-actions-mismatch',s=>{s.requiredActions=[];}],
  ['semantic-order:',s=>{s.regions[0].order=999;}],
  ['semantic-tree-coverage',s=>{s.tree.children=[];}],
 ];
 for(const [code,mutate] of mutations){const s=structuredClone(base);mutate(s);assert.ok(auditSurface(graph,s,display).some(e=>e.startsWith(code)),code);}
});

test('cold manifest replay uses independent cryptographic fixture, graph and output identities',async()=>{
 const {graph,html}=await fixture();const manifest=createReplayManifest(graph,html,73,'elastic',display);const cold=JSON.parse(JSON.stringify(manifest));assert.equal(sha256(replay(cold)),manifest.expectedSurfaceSHA256);
 for(const field of ['fixtureHTML','graph','expectedSurfaceSHA256'] as const){const corrupt=structuredClone(manifest);if(field==='graph')corrupt.graph.title='tampered';else corrupt[field]+='tampered';assert.throws(()=>replay(corrupt),/SHA-256/);}
 const seed=structuredClone(manifest);seed.seed++;assert.throws(()=>replay(seed),/Surface SHA-256/);
});

test('structural equivalence ignores seed/hash/subpixel noise yet detects a changed composition',async()=>{
 const {graph}=await fixture();const base=generateSurface(graph,{seed:11,family:'workbench',display});const noise=structuredClone(base);noise.seed=999;noise.hash='arbitrary';for(const r of noise.regions){r.x+=0.00001;r.y+=0.00001;}assert.equal(independentSignature(base),independentSignature(noise));
 const flow=generateSurface(graph,{seed:11,family:'workbench',display:{...display,width:320}});assert.notEqual(independentSignature(base),independentSignature(flow));
});

test('Pareto ranking preserves incomparable and duplicate metric vectors without a beauty scalar',()=>{
 assert.deepEqual(paretoRanks([[1,0],[0,1],[0,0],[1,0],[-1,-1]]),[0,0,1,0,2]);
});


test('registered amendment retains original SHA identity and exact mission viewport coverage',async()=>{
 const original=await readFile(new URL('../experiments/preregister.json',import.meta.url),'utf8');const amendment=JSON.parse(await readFile(new URL('../experiments/preregister-amendment-1.json',import.meta.url),'utf8'));assert.equal(amendment.originalRegistrationSHA256,sha256(original));assert.deepEqual(amendment.displays.map((d:{width:number;height:number})=>`${d.width}x${d.height}`).sort(),['320x568','390x844','768x1024','900x390','1440x900','1920x1080'].sort());assert.ok(Date.parse(amendment.registeredAt)>Date.parse(JSON.parse(original).registeredAt));
});
