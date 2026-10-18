import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {interpretHTML} from '../packages/resource-interpreter/src/index.ts';
import {validateGraph} from '@netscape/core';

const fixture = (name:string) => readFileSync(new URL(`../fixtures/${name}.html`,import.meta.url),'utf8');
const fixed = {kind:'fixture' as const,fetchedAt:'2026-10-18T00:00:00.000Z'};

test('local authored NASA, menu and repository sources retain distinct evidence-backed hypotheses',()=>{
  for (const [name,url,intent] of [['nasa','https://science.nasa.gov/exoplanets/','research'],['restaurant','https://restaurant.example/menu','commerce'],['github','https://github.com/netscape-infinite/demo','repository']]) {
    const {graph,intents}=interpretHTML(fixture(name),url,fixed);
    assert.equal(intents[0].kind,intent);
    assert.equal(intents[0].status,'inferred');
    assert.ok(intents[0].evidence.every(id=>graph.nodes.some(n=>n.id===id)));
    assert.equal(graph.provenance.kind,'fixture');
    assert.match(graph.provenance.notice,/local|authored/i);
    assert.ok(graph.nodes.length>=12 && graph.nodes.length<=25,`${name}: ${graph.nodes.length}`);
    assert.ok(graph.nodes.some(n=>n.kind==='Text' && (n.text?.length??0)>70));
    assert.ok(graph.nodes.filter(n=>n.supported).some(n=>n.action==='attach-companion'));
    assert.ok(graph.nodes.filter(n=>n.supported).some(n=>n.action==='save-artifact'));
    assert.ok(graph.nodes.filter(n=>n.kind!=='Evidence').every(n=>n.evidence?.length));
  }
});

test('inert parsing decodes text and never preserves markup, unsafe URLs or executable forms',()=>{
  const html='<title>Fish &amp; Stars</title><h1>Menu</h1><p>A <strong>real</strong> passage &amp; citation.</p><script>globalThis.pwned=true</script><style>SECRET_CSS</style><template>SECRET_TEMPLATE</template><div hidden>SECRET_HIDDEN</div><a href="javascript:alert(1)">bad</a><a href="/safe">Safe</a><form action="https://example.com/checkout"><label>Book dinner</label><button>Pay now</button></form><meta name="description" content="Dinner menu"><script type="application/ld+json">{"@type":"Restaurant","name":"Dinner"}</script>';
  const {graph,intents}=interpretHTML(html,'https://example.com/menu',fixed);
  assert.equal(graph.title,'Fish & Stars');
  assert.ok(graph.nodes.some(n=>n.text==='A real passage & citation.'));
  const serialized=JSON.stringify(graph);
  for(const secret of ['globalThis.pwned','SECRET_CSS','SECRET_TEMPLATE','SECRET_HIDDEN','javascript:','<strong>']) assert.ok(!serialized.includes(secret),secret);
  assert.ok(graph.nodes.some(n=>n.url==='https://example.com/safe'));
  assert.ok(graph.nodes.some(n=>n.kind==='Form' && n.supported===false));
  assert.ok(graph.nodes.some(n=>n.kind==='Action' && n.label==='Pay now' && n.supported===false && !n.action));
  assert.ok(graph.nodes.some(n=>n.meta?.jsonLdType==='Restaurant'));
  assert.equal(intents[0].kind,'commerce');
});

test('interpretation is deterministic, bounded and rejects invalid source schemes',()=>{
  const html='<h1>Research</h1>'+('<p>A meaningful research passage with evidence and public observations.</p>'.repeat(8000));
  const a=interpretHTML(html,'https://www.nasa.gov/',fixed);
  assert.deepEqual(a,interpretHTML(html,'https://www.nasa.gov/',fixed));
  assert.ok(a.graph.nodes.length<=180);
  assert.ok(a.graph.nodes.every(n=>(n.text?.length??0)<=1800));
  assert.throws(()=>interpretHTML('<p>Hi</p>','javascript:alert(1)'),/http/i);
  assert.equal(interpretHTML('<html></html>','https://example.com',fixed).intents[0].kind,'general');
});

test('each extracted passage exposes a local typed selection action',()=>{
 const {graph}=interpretHTML('<h1>Research</h1><p>A selected passage keeps the source citation attached.</p>','https://www.nasa.gov/',fixed);
 const passage=graph.nodes.find(n=>n.kind==='Text');
 assert.ok(passage);
 assert.equal(passage.action,'select-passage');
 assert.equal(passage.supported,true);
 assert.equal(passage.meta?.origin,'local');
});

test('sources without passages do not advertise unreachable passage-based capabilities',()=>{
 for(const html of ['','<title>Title only</title>','<title>Links only</title><a href="/about">About</a>','<title>Form only</title><form aria-label="Search"><input name="q"><button>Search</button></form>']){
  const {graph}=interpretHTML(html,'https://www.nasa.gov/',fixed);
  assert.ok(!graph.nodes.some(n=>n.kind==='Text'));
  assert.ok(!graph.nodes.some(n=>n.supported&&['select-passage','attach-companion','save-artifact'].includes(n.action??'')));
  if(html.includes('<form'))assert.ok(graph.nodes.some(n=>n.kind==='Form'&&n.supported===false));
  if(html.includes('<a'))assert.ok(graph.nodes.some(n=>n.kind==='Link'&&n.supported===true&&n.action==='navigate'));
 }
});

test('overlong source URLs reject clearly and overlong links never enter the graph',()=>{
 const longURL='https://www.nasa.gov/'+ 'a'.repeat(2050);
 assert.throws(()=>interpretHTML('<p>Readable source</p>','https://www.nasa.gov/'+'é'.repeat(400),fixed),/URL|2048|limit/i);
 assert.throws(()=>interpretHTML('<p>Readable source</p>',longURL,fixed),/URL|2048|limit/i);
 const html=`<h1>Research</h1><p>A readable passage should survive a hostile oversized citation target.</p><a href="${longURL}">Oversized citation</a><a href="/safe">Valid citation</a>`;
 const {graph}=interpretHTML(html,'https://www.nasa.gov/',fixed);
 assert.ok(!graph.nodes.some(n=>n.url&&n.url.length>2048));
 assert.ok(!graph.nodes.some(n=>n.kind==='Link'&&n.label==='Oversized citation'));
 assert.ok(graph.nodes.some(n=>n.url==='https://www.nasa.gov/safe'));
 assert.deepEqual(validateGraph(graph),[]);
});
