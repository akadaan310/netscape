/** Canonical JSON. Undefined object members are omitted, as in JSON.stringify.
 * Nonfinite numbers, cycles, non-plain objects and excessive depth are rejected. */
export function canonical(value:unknown):string {
  const active = new Set<object>();
  function encode(v:unknown,depth:number):string {
    if(depth>100) throw new Error('Canonical value exceeds depth 100');
    if(v===null||v===undefined)return 'null';
    if(typeof v==='string'||typeof v==='boolean')return JSON.stringify(v);
    if(typeof v==='number'){if(!Number.isFinite(v))throw new Error('Nonfinite canonical number');return JSON.stringify(v);}
    if(typeof v!=='object')throw new Error('Unsupported canonical value');
    if(active.has(v))throw new Error('Cyclic canonical value');
    if(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw new Error('Canonical values must be plain JSON');
    active.add(v);
    const result=Array.isArray(v)?`[${Array.from(v,item=>encode(item,depth+1)).join(',')}]`:`{${Object.keys(v).sort().filter(k=>(v as Record<string,unknown>)[k]!==undefined).map(k=>`${JSON.stringify(k)}:${encode((v as Record<string,unknown>)[k],depth+1)}`).join(',')}}`;
    active.delete(v);return result;
  }
  return encode(value,0);
}
/** Two FNV-style 32-bit lanes. Deterministic content identity, NOT cryptography. */
export function hash(value:unknown):string {
  const input=canonical(value);let a=0x811c9dc5,b=0x9e3779b9;
  for(let i=0;i<input.length;i++){const c=input.charCodeAt(i);a=Math.imul(a^c,0x01000193);b=Math.imul(b^c,0x85ebca6b);}
  return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
/** Mulberry32: fixed-width integer state, browser and Node identical. */
export function createRandom(seed:number):()=>number {
  if(!Number.isSafeInteger(seed))throw new Error('Seed must be a safe integer');
  let state=seed>>>0;
  return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
