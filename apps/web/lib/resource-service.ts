import {interpretHTML} from '@netscape/resource-interpreter';
import {fetchPublic,validatePublicURL} from '@netscape/resource-interpreter/fetch';
import type {SemanticGraph,Intent} from '@netscape/core';
import {safeExternalURL} from '@netscape/conformance';
import {FIXTURES,type FixtureName} from './fixtures';
export type InterpretationResult={status:number;body:{graph:SemanticGraph;intents:Intent[];fixtureSha256?:string}|{error:string;externalUrl?:string}};
export async function interpretRequest(params:URLSearchParams,reader:typeof fetchPublic=fetchPublic):Promise<InterpretationResult>{
 const fixture=params.get('fixture'),input=params.get('url');
 if(params.getAll('fixture').length>1||params.getAll('url').length>1||(!fixture&&!input)||(fixture&&input))return {status:400,body:{error:'Choose one demo fixture or one public URL.'}};
 if(fixture){
  if(!Object.hasOwn(FIXTURES,fixture))return {status:400,body:{error:'Unknown authored fixture.'}};
  const source=FIXTURES[fixture as FixtureName];
  return {status:200,body:{...interpretHTML(source.html,source.url,{kind:'fixture',fetchedAt:'2026-10-18T00:00:00.000Z'}),fixtureSha256:source.sha256}};
 }
 const externalUrl=safeExternalURL(input!);
 try{
  validatePublicURL(input!); // Validate here as well as inside the transport, including injected transports.
  const resource=await reader(input!);
  return {status:200,body:interpretHTML(resource.html,resource.url,{kind:'public'})};
 }catch(error){
  const message=error instanceof Error?error.message:'Public resource is unavailable.';
  return {status:400,body:{error:`This resource could not be interpreted. ${message}`,externalUrl}};
 }
}
/** Best-effort per-process limit. Production distributed limits belong at the hosting edge. */
export function createRateLimiter(limit=30,windowMs=60_000){
 let start=-1,count=0;
 return (now:number)=>{if(start<0||now-start>=windowMs||now<start){start=now;count=0;}return ++count<=limit;};
}
