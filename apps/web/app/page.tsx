import {FAMILIES,type Family} from '@netscape/core';
import {interpretHTML} from '@netscape/resource-interpreter';
import {FIXTURES,type FixtureName} from '../lib/fixtures';
import Studio from './Studio';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const fixture=(typeof params.fixture==='string'&&Object.hasOwn(FIXTURES,params.fixture)?params.fixture:'nasa') as FixtureName;
 const source=FIXTURES[fixture];
 const initial=interpretHTML(source.html,source.url,{kind:'fixture',fetchedAt:'2026-10-18T00:00:00.000Z'});
 const seed=Number(params.seed??7),tick=Number(params.tick??0);
 const family=(typeof params.family==='string'&&FAMILIES.includes(params.family as Family)?params.family:'observatory') as Family;
 return <Studio initialGraph={initial.graph} initialIntents={initial.intents} initialFixture={fixture} initialSeed={Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff?seed:7} initialFamily={family} initialTick={Number.isInteger(tick)&&tick>=0&&tick<=10000?tick:0} explicitQuery={Object.keys(params).length>0} testMode={params.test==='1'}/>;
}
