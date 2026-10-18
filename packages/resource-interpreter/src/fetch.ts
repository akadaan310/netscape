/** Node-only HTTPS reader. Kept separate from the browser-safe interpreter. */
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {request as httpsRequest} from 'node:https';

export const ALLOWED_HOSTS=Object.freeze(['www.nasa.gov','nasa.gov','science.nasa.gov','github.com']);
const MAX_BYTES=1_048_576, MAX_REDIRECTS=4;
export type Address={address:string;family:4|6};
export type PublicResponse={status:number;headers:Record<string,string|undefined>;body:AsyncIterable<Uint8Array>;cancel?:()=>void};
/** Transport injection exists for deterministic hostile DNS/server tests. The application uses fetchPublic only. */
export type FetchDependencies={resolve:(hostname:string)=>Promise<Address[]>;request:(url:URL,address:Address,signal:AbortSignal)=>Promise<PublicResponse>};

export function validatePublicURL(input:string):URL{
 if(typeof input!=='string'||input.length>4096||/[\s\\\x00-\x1f\x7f]/.test(input))throw new Error('Invalid public URL');
 let url:URL;try{url=new URL(input);}catch{throw new Error('Invalid public URL');}
 if(url.protocol!=='https:')throw new Error('Public resources require HTTPS');
 // Inspect raw authority as URL normalization removes explicit :443, encoded hostnames and userinfo evidence.
 const authority=input.match(/^https:\/\/([^/?#]+)/i)?.[1];
 if(!authority||!ALLOWED_HOSTS.includes(authority.toLowerCase())||!ALLOWED_HOSTS.includes(url.hostname)||url.username||url.password||url.port)throw new Error('Public resource hostname must match the exact HTTPS allowlist, without credentials or ports');
 url.hash='';return url;
}

/** Conservative public-address policy: special-purpose IPv4 and non-global IPv6 are denied. */
export function isPublicAddress(address:string):boolean{
 const family=isIP(address);
 if(family===4){
  const parts=address.split('.').map(Number);const value=parts.reduce((v,n)=>(v*256+n)>>>0,0);
  const denied:[number,number][]=[
   [0x00000000,8],[0x0a000000,8],[0x64400000,10],[0x7f000000,8],[0xa9fe0000,16],[0xac100000,12],
   [0xc0000000,24],[0xc0000200,24],[0xc0586300,24],[0xc0a80000,16],[0xc6120000,15],[0xc6336400,24],[0xcb007100,24],[0xe0000000,4],[0xf0000000,4]
  ];
  return !denied.some(([prefix,bits])=>(value>>>(32-bits))===(prefix>>>(32-bits)));
 }
 if(family!==6||address.includes('%')||address.includes('.'))return false;
 // isIP has checked syntax. Expand compression to compare the global-unicast prefix.
 const lower=address.toLowerCase();const sides=lower.split('::');
 const left=sides[0]?sides[0].split(':'):[],right=sides.length>1&&sides[1]?sides[1].split(':'):[];
 const groups=sides.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left;
 if(groups.length!==8)return false;
 const first=parseInt(groups[0],16),second=parseInt(groups[1],16);
 if((first&0xe000)!==0x2000)return false; // Includes mapped, local, multicast and NAT64 denial.
 if(first===0x2002)return false; // 6to4 can encode private IPv4 destinations.
 if(first===0x2001&&(second<0x200||second===0xdb8))return false; // IETF protocol assignments / documentation.
 if(first===0x3fff&&(second&0xf000)===0)return false; // IPv6 documentation range.
 return true;
}

const defaults:FetchDependencies={
 resolve:async hostname=>(await lookup(hostname,{all:true,verbatim:true})).map(a=>({address:a.address,family:a.family as 4|6})),
 request:(url,address,signal)=>new Promise((resolve,reject)=>{
  const request=httpsRequest(url,{
   method:'GET',signal,agent:false,
   headers:{accept:'text/html, application/xhtml+xml;q=0.9','accept-encoding':'identity','user-agent':'NetscapeInfinite/0.1 (read-only public-resource interpreter)'},
   // TLS SNI/certificate verification still use the allowlisted URL hostname.
   lookup:((_hostname:unknown,options:unknown,callback:any)=>{
    if(typeof options==='object'&&options!==null&&'all' in options&&(options as {all?:boolean}).all)callback(null,[address]);
    else callback(null,address.address,address.family);
   }) as any
  },response=>{
   const headers:Record<string,string|undefined>={};for(const [key,value]of Object.entries(response.headers))headers[key]=Array.isArray(value)?value.join(', '):value;
   resolve({status:response.statusCode??0,headers,body:response,cancel:()=>response.destroy()});
  });
  request.once('error',reject);request.end();
 })
};

/** Each request has one deadline across DNS, redirects and reading; every DNS answer must be public. */
export function createPublicFetcher(dependencies:FetchDependencies=defaults,limits:{timeoutMs?:number;maxBytes?:number}={}){
 const timeoutMs=limits.timeoutMs??8000,maxBytes=Math.min(limits.maxBytes??MAX_BYTES,MAX_BYTES);
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>30_000||!Number.isSafeInteger(maxBytes)||maxBytes<=0)throw new Error('Invalid public fetch limits');
 return async(input:string):Promise<{html:string;url:string}>=>{
  let url=validatePublicURL(input);const controller=new AbortController();let current:PublicResponse|undefined;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>{controller.abort();current?.cancel?.();reject(new Error('Public resource fetch timeout'));},timeoutMs);});
  const work=async()=>{
   for(let hop=0;hop<=MAX_REDIRECTS;hop++){
    const answers=await dependencies.resolve(url.hostname);
    if(controller.signal.aborted)throw new Error('Public resource fetch timeout');
    if(!answers.length||answers.length>64||answers.some(a=>!isPublicAddress(a.address)||isIP(a.address)!==a.family))throw new Error('DNS must resolve exclusively to public IP addresses');
    current=await dependencies.request(url,answers[0],controller.signal);
    if(controller.signal.aborted){current.cancel?.();throw new Error('Public resource fetch timeout');}
    if([301,302,303,307,308].includes(current.status)){
     current.cancel?.();const location=current.headers.location;
     if(!location||hop===MAX_REDIRECTS)throw new Error('Public resource redirect limit or missing location');
     // Absolute redirect text must be validated before URL normalization can hide encoded authority or ports.
     if(/^[a-z][a-z\d+.-]*:/i.test(location))url=validatePublicURL(location);
     else if(location.startsWith('//'))url=validatePublicURL(`https:${location}`);
     else {if(/[\s\\\x00-\x1f\x7f]/.test(location))throw new Error('Invalid redirect URL');url=validatePublicURL(new URL(location,url).href);}
     continue;
    }
    if(current.status<200||current.status>=300)throw new Error(`Public resource HTTP status ${current.status}`);
    const mime=(current.headers['content-type']??'').split(';')[0].trim().toLowerCase();
    if(!['text/html','application/xhtml+xml'].includes(mime))throw new Error('Unsupported public resource MIME type; HTML required');
    if(current.headers['content-encoding']&&current.headers['content-encoding'].toLowerCase()!=='identity')throw new Error('Unsupported content encoding; identity required');
    const length=current.headers['content-length'];
    if(length&&(!/^\d+$/.test(length)||Number(length)>maxBytes))throw new Error('Public resource body exceeds size limit');
    const chunks:Uint8Array[]=[];let total=0;
    for await(const chunk of current.body){
     if(controller.signal.aborted)throw new Error('Public resource fetch timeout');
     total+=chunk.byteLength;if(total>maxBytes)throw new Error('Public resource body exceeds size limit');chunks.push(chunk);
    }
    const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return {html:new TextDecoder('utf-8').decode(bytes),url:url.href};
   }
   throw new Error('Public resource redirect limit');
  };
  try{return await Promise.race([work(),timeout]);}finally{if(timer)clearTimeout(timer);controller.abort();current?.cancel?.();}
 };
}
export const fetchPublic=createPublicFetcher();
