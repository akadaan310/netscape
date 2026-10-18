import {test,expect} from '@playwright/test';
import {ready} from './audit';

const storageKey='netscape-infinite.workspace.v1';
const stored=(page:import('@playwright/test').Page)=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'null'),storageKey);

test('an oversized source draft cannot erase a cited artifact on reload',async({page},testInfo)=>{
  await page.goto('/?test=1');await ready(page);
  await page.getByTestId('come-here').click();
  await page.getByTestId('save-artifact').click();
  await expect(page.getByTestId('artifact-card')).toHaveCount(1);
  const committed=(await ready(page)).graph.sourceUrl;
  await page.getByTestId('resource-url').fill('https://www.nasa.gov/?q='+'a'.repeat(2048));
  const before=await stored(page);
  await testInfo.attach('before-reload',{body:JSON.stringify(before,null,2),contentType:'application/json'});
  await page.goto('/');await ready(page);
  await expect(page.getByTestId('artifact-card')).toHaveCount(1);
  expect((await stored(page)).resource).toBe(committed);
});

test('46 eventful saves preserve the exact accepted shelf across cold reload',async({page},testInfo)=>{
  await page.goto('/?fixture=nasa&family=observatory&seed=7&tick=10000&test=1');await ready(page);
  for(let i=0;i<20;i++)await page.getByTestId('playful-event').click();
  expect((await ready(page)).dynamics.tick).toBe(14800);
  await page.getByTestId('come-here').click();
  for(let i=0;i<46;i++)await page.getByTestId('save-artifact').click();
  const count=await page.getByTestId('artifact-card').count();
  expect(count).toBeGreaterThan(0);
  if(count<46)await expect(page.getByRole('status')).toContainText(/limit|budget/i);
  await testInfo.attach('before-reload',{body:JSON.stringify({count,stored:await stored(page)},null,2),contentType:'application/json'});
  await page.goto('/');await ready(page);
  await expect(page.getByTestId('artifact-card')).toHaveCount(count);
  expect((await stored(page)).artifacts).toHaveLength(count);
});

test('replaying NASA after Restaurant restores the fixture selection',async({page})=>{
  await page.goto('/?test=1');await ready(page);
  await page.getByTestId('come-here').click();await page.getByTestId('save-artifact').click();
  await expect(page.getByTestId('artifact-card')).toHaveCount(1);
  await page.getByTestId('fixture-restaurant').click();
  await expect(page.getByTestId('fixture-restaurant')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Replay source'}).click();
  expect((await ready(page)).graph.title).toMatch(/Worlds beyond our Sun/);
  await expect(page.getByTestId('fixture-restaurant')).toHaveAttribute('aria-pressed','false');
  await expect(page.getByTestId('fixture-nasa')).toHaveAttribute('aria-pressed','true');
});
