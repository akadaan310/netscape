import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePublicURL,isPublicAddress,createPublicFetcher,type FetchDependencies} from '../packages/resource-interpreter/src/fetch.ts';

const publicDNS=async()=>[{address:'8.8.8.8',family:4 as const}];
function deps(overrides:Partial<FetchDependencies>={}):FetchDependencies {
 return {resolve:publicDNS,request:async()=>({status:200,headers:{'content-type':'text/html; charset=utf-8'},body:(async function*(){yield Buffer.from('<h1>public</h1>')})()}),...overrides};
}
test('exact HTTPS allowlist rejects credentials, ports, IPs, aliases and parser tricks',()=>{
 for(const input of ['http://www.nasa.gov/','https://localhost/','https://127.0.0.1/','https://[::1]/','https://www.nasa.gov.evil.test/','https://evil.test@www.nasa.gov/','https://www.nasa.gov:443/','https://www.nasa.gov:444/','https://www.nasa.gov./','https://www.nasa.gov\\@evil.test/',' https://www.nasa.gov/','https://%77ww.nasa.gov/','https://www.nasa.gov/\n']) assert.throws(()=>validatePublicURL(input),input);
 assert.equal(validatePublicURL('https://www.nasa.gov/space?q=1').hostname,'www.nasa.gov');
 assert.equal(validatePublicURL('https://github.com/openai').hostname,'github.com');
});
test('public IP validation rejects private, metadata, reserved and mapped IPv6 space',()=>{
 for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','0.0.0.0','192.0.2.1','198.18.1.1','224.0.0.1','240.0.0.1','::1','::','fe80::1','fc00::1','ff00::1','::ffff:127.0.0.1','::ffff:8.8.8.8','2001:db8::1','2002:7f00:1::','invalid']) assert.equal(isPublicAddress(ip),false,ip);
 for(const ip of ['8.8.8.8','1.1.1.1','2606:4700:4700::1111','2001:4860:4860::8888']) assert.equal(isPublicAddress(ip),true,ip);
});
test('DNS private answers are rejected before transport, including mixed public/private answers',async()=>{
 for(const address of ['127.0.0.1','169.254.169.254','::ffff:127.0.0.1','fe80::1']) {
 let calls=0;
 const fetcher=createPublicFetcher(deps({resolve:async()=>[{address:'8.8.8.8',family:4},{address,family:address.includes(':')?6:4}],request:async()=>{calls++;throw new Error('must not run')}}));
 await assert.rejects(()=>fetcher('https://www.nasa.gov/'),/DNS|public/i);
 assert.equal(calls,0);
 }
});
test('validated DNS address is pinned, redirects are validated, and no cookies are forwarded',async()=>{
 const visited:string[]=[];
 const fetcher=createPublicFetcher(deps({request:async(url,address,signal)=>{
 assert.equal(address.address,'8.8.8.8');assert.equal(signal.aborted,false);visited.push(url.href);
 if(visited.length===1)return {status:302,headers:{location:'https://github.com/openai'},body:(async function*(){})()};
 return {status:200,headers:{'content-type':'text/html','set-cookie':'secret'},body:(async function*(){yield Buffer.from('safe')})()};
 }}));
 assert.deepEqual(await fetcher('https://www.nasa.gov/'),{html:'safe',url:'https://github.com/openai'});
 assert.equal(visited.length,2);
 const unsafe=createPublicFetcher(deps({request:async()=>({status:302,headers:{location:'http://169.254.169.254/latest'},body:(async function*(){})()})}));
 await assert.rejects(()=>unsafe('https://www.nasa.gov/'),/HTTPS|allowlist/i);
});
test('HTML-only fetch rejects compression, huge bodies, non-success and redirect loops',async()=>{
 for(const headers of [{'content-type':'application/json'},{'content-type':'text/html','content-encoding':'gzip'},{'content-type':'text/html','content-length':'9000000'}]) {
 await assert.rejects(()=>createPublicFetcher(deps({request:async()=>({status:200,headers,body:(async function*(){yield Buffer.from('bad')})()})}))('https://www.nasa.gov/'),/MIME|encoding|large|limit/i);
 }
 await assert.rejects(()=>createPublicFetcher(deps({request:async()=>({status:200,headers:{'content-type':'text/html'},body:(async function*(){yield Buffer.alloc(1_048_577)})()})}))('https://www.nasa.gov/'),/large|limit/i);
 await assert.rejects(()=>createPublicFetcher(deps({request:async()=>({status:404,headers:{'content-type':'text/html'},body:(async function*(){})()})}))('https://www.nasa.gov/'),/status|404/i);
 await assert.rejects(()=>createPublicFetcher(deps({request:async()=>({status:302,headers:{location:'/'},body:(async function*(){})()})}))('https://www.nasa.gov/'),/redirect/i);
});
test('timeouts bound DNS and response work',async()=>{
 await assert.rejects(()=>createPublicFetcher(deps({resolve:()=>new Promise(()=>{})}),{timeoutMs:20})('https://www.nasa.gov/'),/time/i);
 await assert.rejects(()=>createPublicFetcher(deps({request:async()=>({status:200,headers:{'content-type':'text/html'},body:(async function*(){await new Promise(()=>{});yield Buffer.from('never')})()})}),{timeoutMs:20})('https://www.nasa.gov/'),/time/i);
});

test('public fetch rejects URLs beyond the semantic graph URL bound',()=>{
 assert.throws(()=>validatePublicURL('https://www.nasa.gov/'+'é'.repeat(400)),/URL|limit/i);
 assert.throws(()=>validatePublicURL('https://www.nasa.gov/'+'a'.repeat(2050)),/URL|limit/i);
});
