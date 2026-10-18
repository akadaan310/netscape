import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SurfaceRenderer} from '../packages/render-react/src/index';
const graph:any={nodes:[{id:'unsafe',kind:'Link',label:'Unsafe',url:'javascript:alert(1)',action:'open-external',supported:true},{id:'text',kind:'Text',label:'Passage',text:'<script>alert(1)</script>',action:'select-passage',supported:true}]};
const surface:any={width:320,height:300,regions:[{id:'unsafe',semanticId:'unsafe',x:0,y:0,width:300,height:64,order:0},{id:'text',semanticId:'text',x:0,y:80,width:300,height:120,order:1}]};
const palette={background:'#fff',surface:'#fff',text:'#111',muted:'#555',accent:'#113344',accentText:'#fff',border:'#ddd'};
test('adapter renders untrusted content as text and never activates unsafe URL',()=>{
  const html=renderToStaticMarkup(createElement(SurfaceRenderer,{graph,surface,palette,onAction:()=>{}}));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('<script>'));
});
test('adapter exposes typed passage action and stable semantic identity',()=>{
  const html=renderToStaticMarkup(createElement(SurfaceRenderer,{graph,surface,palette,onAction:()=>{}}));
  assert.ok(html.includes('data-action="select-passage"'));
  assert.ok(html.includes('data-semantic-id="text"'));
  assert.ok(html.includes('data-testid="passage"'));
});
