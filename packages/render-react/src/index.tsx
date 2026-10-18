'use client';
import React from 'react';
import type {ActionType,SemanticGraph,SemanticNode,Surface} from '@netscape/core';
export type Palette={background:string;surface:string;text:string;muted:string;accent:string;accentText:string;border:string};
export type SurfaceRendererProps={graph:SemanticGraph;surface:Surface;palette:Palette;selectedId?:string;onAction:(action:ActionType,id:string)=>void;motion?:Record<string,{x:number;y:number}>};
function safeURL(value?:string){try{const u=new URL(value||'');return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}}
const symbols:Record<string,string>={Resource:'◈',Section:'§',Text:'↳',Link:'↗',Form:'⊘',Action:'→',Evidence:'◎',Artifact:'◇',Participant:'✳',Group:'⊞'};
export function SurfaceRenderer({graph,surface,palette,selectedId,onAction,motion={}}:SurfaceRendererProps){
  const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  function content(n:SemanticNode,index:number){
    const action=n.supported!==false?n.action:undefined;
    const attrs={'data-semantic-id':n.id,'data-action':action};
    const title=<><span className="node-eyebrow"><span aria-hidden="true">{symbols[n.kind]}</span> {n.kind==='Text'?'SOURCE PASSAGE':n.kind.toUpperCase()} <span className="node-number">{String(index+1).padStart(2,'0')}</span></span><span className="node-title">{n.label}</span></>;
    const text=n.text&&n.text!==n.label?<span className="node-body">{n.text}</span>:null;
    if(n.kind==='Resource')return <div className="resource-node">{title}{text}<span className="resource-node-foot">PUBLIC KNOWLEDGE <span aria-hidden="true">/</span> INTERPRETED LOCALLY</span></div>;
    if(n.kind==='Section'||n.kind==='Group')return <div className="section-node">{title}{text}</div>;
    if(n.kind==='Form'||n.supported===false)return <div className="unsupported-node">{title}{text}<span className="node-support">Detected affordance · external action unavailable</span></div>;
    if((action==='open-external'||action==='navigate')&&safeURL(n.url))return <a {...attrs} className="node-action link-node" href={safeURL(n.url)} target="_blank" rel="noopener noreferrer">{title}{text}<span className="node-support">Open original <span aria-hidden="true">↗</span></span></a>;
    if(action&&action!=='open-external'&&action!=='navigate')return <button {...attrs} data-testid={action==='select-passage'?'passage':undefined} className="node-action" type="button" aria-pressed={action==='select-passage'?selectedId===n.id:undefined} onClick={()=>onAction(action,n.id)}>{title}{text}<span className="node-support">{action==='select-passage'?(selectedId===n.id?'✓ Context selected':'Select as context ↗'):action==='attach-companion'?'Local simulated companion ↗':'Create a cited local artifact ↗'}</span></button>;
    return <div>{title}{text}{n.kind==='Evidence'?<span className="node-support">Source evidence · no live verification</span>:null}</div>;
  }
  return <div data-testid="generated-surface" className={`generated-surface family-${surface.family}`} data-surface-hash={surface.hash} style={{position:'relative',width:'100%',height:surface.height,background:palette.background,color:palette.text}}>
    {surface.regions.map((r,index)=>{const n=nodes.get(r.semanticId);if(!n)return null;const m=motion[n.id];return <article key={r.id} data-testid="region" data-semantic-id={n.id} data-kind={n.kind} className={`surface-region kind-${n.kind.toLowerCase()} ${selectedId===n.id?'is-selected':''}`} style={{position:'absolute',left:r.x,top:r.y,width:r.width,height:r.height,background:n.kind==='Resource'?palette.accent:palette.surface,color:n.kind==='Resource'?palette.accentText:palette.text,borderColor:selectedId===n.id?palette.accent:palette.border,transform:m?`translate(${m.x}px,${m.y}px)`:undefined,'--node-muted':n.kind==='Resource'?palette.accentText:palette.muted,'--node-accent':palette.accent} as React.CSSProperties}>{content(n,index)}</article>;})}
  </div>;
}
export {safeURL as sanitizeLink};
