/** Inert, bounded HTML interpretation. This entry point has no Node imports. */
import {parse, type DefaultTreeAdapterTypes} from 'parse5';
import {hash, SCHEMA_VERSION, type SemanticNode, type SemanticEdge, type SemanticGraph, type Intent} from '@netscape/core';

type HTMLNode = DefaultTreeAdapterTypes.Node;
const MAX_HTML=1_048_576, MAX_NODES=180, MAX_TEXT=1800;
const ignored=new Set(['script','style','template','noscript','iframe','object','svg','canvas']);
const clean=(text:string,max=MAX_TEXT)=>text.replace(/\s+/g,' ').trim().slice(0,max);
const tag=(node:HTMLNode)=>'tagName' in node?node.tagName:'';
function attr(node:HTMLNode,name:string):string|undefined {return 'attrs' in node?node.attrs.find(a=>a.name===name)?.value:undefined;}
function hidden(node:HTMLNode):boolean {return attr(node,'hidden')!==undefined||attr(node,'aria-hidden')==='true';}
function textOf(node:HTMLNode,includeScript=false):string {
 const stack=[node],parts:string[]=[];let size=0,visited=0;
 while(stack.length&&size<MAX_TEXT*2&&visited++<3000){
  const current=stack.pop()!;
  if(hidden(current)||(!includeScript&&ignored.has(tag(current))))continue;
  if('value' in current&&current.nodeName==='#text'){parts.push(current.value);size+=current.value.length;}
  if('childNodes' in current)for(let i=current.childNodes.length-1;i>=0;i--)stack.push(current.childNodes[i]);
 }
 return clean(parts.join(' '));
}
function safeURL(value:string,base:string):string|undefined {
 try{const url=new URL(value,base);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.href.length>2048)return;return url.href;}catch{return;}
}

export function interpretHTML(html:string,url:string,options:{kind?:'fixture'|'public';fetchedAt?:string}={}):{graph:SemanticGraph;intents:Intent[]}{
 if(typeof html!=='string'||html.length>MAX_HTML)throw new Error('HTML exceeds interpretation size limit (1 MiB characters)');
 const sourceUrl=safeURL(url,url);if(!sourceUrl)throw new Error('Source must be a safe HTTP(S) URL without credentials, at most 2048 characters after URL encoding');
 const fetchedAt=options.fetchedAt??new Date().toISOString();
 if(!Number.isFinite(Date.parse(fetchedAt)))throw new Error('Invalid resource fetch timestamp');
 const document=parse(html);const elements:HTMLNode[]=[];const stack:HTMLNode[]=[document];let visited=0;
 while(stack.length&&visited++<20_000){
  const node=stack.pop()!;if(hidden(node))continue;
  if('tagName' in node)elements.push(node);
  if(ignored.has(tag(node)))continue;
  if('childNodes' in node)for(let i=node.childNodes.length-1;i>=0;i--)stack.push(node.childNodes[i]);
 }
 const title=clean(textOf(elements.find(n=>tag(n)==='title')??document),180)||new URL(sourceUrl).hostname;
 const contentHash=hash(html),id=`resource-${hash({sourceUrl,contentHash})}`,evidenceId=`${id}-source`;
 const kind=options.kind??'public';
 const notice=kind==='fixture'?'Local authored demonstration. This is not a live source snapshot.':'Public HTML fetched read-only. Intent is inferred; source affordances do not grant executable capability.';
 const metadata:Record<string,string>={};
 for(const node of elements){
  if(tag(node)==='meta'){
   const name=attr(node,'name')??attr(node,'property');const content=attr(node,'content');
   if(name&&content&&['description','og:description','og:title','author'].includes(name))metadata[name]=clean(content);
  }
  if(tag(node)==='script'&&attr(node,'type')?.toLowerCase()==='application/ld+json'){
   try{
    const raw=textOf(node,true);if(raw.length>1600)continue;
    const data:unknown=JSON.parse(raw);const items=Array.isArray(data)?data:[data];
    for(const item of items.slice(0,8))if(item&&typeof item==='object'){
     const record=item as Record<string,unknown>;
     if(typeof record['@type']==='string')metadata.jsonLdType=clean(record['@type'],120);
     if(typeof record.name==='string')metadata.jsonLdName=clean(record.name,180);
    }
   }catch{/* Invalid or unsupported JSON-LD is not an executable instruction. */}
  }
 }
 const nodes:SemanticNode[]=[{id,kind:'Resource',label:title,url:sourceUrl,evidence:[evidenceId],meta:metadata},{id:evidenceId,kind:'Evidence',label:kind==='fixture'?'Local authored source':'Public source evidence',text:notice,url:sourceUrl,meta:{contentHash,fetchedAt,kind}}];
 const edges:SemanticEdge[]=[{from:id,to:evidenceId,kind:'contains'}];let parent=id;
 function add(node:Omit<SemanticNode,'id'|'evidence'>,container=parent):SemanticNode|undefined {
  if(nodes.length>=MAX_NODES-3)return;
  const full:SemanticNode={...node,id:`${id}-n${nodes.length}`,evidence:[evidenceId]};nodes.push(full);edges.push({from:container,to:full.id,kind:'contains'});return full;
 }
 for(let index=0;index<elements.length&&nodes.length<MAX_NODES-3;index++){
  const element=elements[index],name=tag(element),text=textOf(element);
  const meta={sourceTag:name,sourceOrder:String(index)};
  if(/^h[1-6]$/.test(name)&&text){const section=add({kind:'Section',label:clean(text,180),text,meta:{...meta,level:name[1]}},id);if(section)parent=section.id;}
  else if(['p','li','blockquote','pre','figcaption'].includes(name)&&text)add({kind:'Text',label:clean(text,90),text,action:'select-passage',supported:true,meta:{...meta,origin:'local'}});
  else if(name==='a'&&text){const href=attr(element,'href'),safe=href&&safeURL(href,sourceUrl);if(safe)add({kind:'Link',label:clean(text,180),url:safe,action:'navigate',supported:true,meta});}
  else if(name==='form')add({kind:'Form',label:clean(attr(element,'aria-label')??'Detected source form',180),text:clean(text,400),supported:false,meta:{...meta,reason:'Detected affordance only. Submission is unsupported; no personal information is collected.'}});
  else if(name==='button')add({kind:'Action',label:clean(text||attr(element,'aria-label')||'Source button',180),supported:false,meta:{...meta,reason:'Detected source button. Third-party execution is unsupported.'}});
 }
 // These are interpreter-owned local capabilities; source forms never grant them.
 for(const [action,label] of (nodes.some(node=>node.kind==='Text'&&Boolean(node.text?.trim()))?[['select-passage','Select a passage'],['attach-companion','Come here · local simulated companion'],['save-artifact','Save cited artifact']] as const:[])){
  const actionId=`${id}-${action}`;nodes.push({id:actionId,kind:'Action',label,action,supported:true,evidence:[evidenceId],meta:{origin:'local',targetId:id}});edges.push({from:id,to:actionId,kind:'contains'});
 }
 const signals=nodes.filter(n=>n.kind!=='Action'&&n.kind!=='Evidence');
 const definitions:[Intent['kind'],RegExp][]=[['repository',/github\.com|repository|README|SoftwareSourceCode|\bsrc\//i],['commerce',/Restaurant|reservation|\bmenu\b|\bdishes\b|checkout|\$\d/i],['research',/\bresearch\b|exoplanet|\bWebb\b|ScholarlyArticle|\bNASA\b|scientist/i]];
 const candidates=definitions.map(([intent,pattern])=>({kind:intent,evidence:signals.filter(n=>pattern.test([n.label,n.text,n.url,JSON.stringify(n.meta)].join(' '))).map(n=>n.id)})).filter(item=>item.evidence.length>0).sort((a,b)=>b.evidence.length-a.evidence.length);
 const winner=candidates[0];const intents:Intent[]=[winner?{kind:winner.kind,status:'inferred',confidence:Math.min(.95,.55+winner.evidence.length*.06),evidence:winner.evidence.slice(0,8)}:{kind:'general',status:'inferred',confidence:.35,evidence:[evidenceId]}];
 return {graph:{version:SCHEMA_VERSION,id,title,sourceUrl,nodes,edges,provenance:{kind,fetchedAt,contentHash,notice}},intents};
}
