import {test} from 'node:test';
import assert from 'node:assert/strict';
import {interpretRequest,createRateLimiter} from '../apps/web/lib/resource-service';
test('fixture API returns evidence and explicit authored source notice offline',async()=>{
 const result=await interpretRequest(new URLSearchParams({fixture:'nasa'}));
 assert.equal(result.status,200);assert.ok('graph' in result.body);
 if('graph' in result.body){assert.equal(result.body.graph.provenance.kind,'fixture');assert.match(result.body.graph.provenance.notice,/authored/);}
});
test('request service rejects ambiguity and unsafe URL before invoking transport',async()=>{
 let calls=0;const transport=async()=>{calls++;return {html:'<title>x</title>',url:'https://www.nasa.gov/'};};
 for(const query of [{url:'http://127.0.0.1'},{url:'https://www.nasa.gov@evil.com'},{fixture:'missing'},{fixture:'nasa',url:'https://www.nasa.gov/'}]){
  const result=await interpretRequest(new URLSearchParams(query as Record<string,string>),transport);assert.equal(result.status,400);
 }
 assert.equal(calls,0);
});
test('public read succeeds through real interpreter and refused resource offers safe fallback',async()=>{
 const ok=await interpretRequest(new URLSearchParams({url:'https://www.nasa.gov/'}),async()=>({html:'<title>NASA research</title><p>Public research.</p>',url:'https://www.nasa.gov/'}));
 assert.equal(ok.status,200);
 if('graph' in ok.body)assert.equal(ok.body.graph.provenance.kind,'public');
 const no=await interpretRequest(new URLSearchParams({url:'https://unsupported.example/path'}));
 assert.equal(no.status,400);if('error' in no.body)assert.equal(no.body.externalUrl,'https://unsupported.example/path');
});
test('rate limiter bounds a process budget and resets at window boundary',()=>{
 const allow=createRateLimiter(2,1000);assert.equal(allow(10),true);assert.equal(allow(11),true);assert.equal(allow(12),false);assert.equal(allow(1010),true);
});
