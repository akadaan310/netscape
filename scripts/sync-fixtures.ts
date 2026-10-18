import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const urls={nasa:'https://science.nasa.gov/exoplanets/',restaurant:'https://example.com/seasonal-menu',github:'https://github.com/example/morphogenesis-notebook'};
const fixtures:Record<string,{html:string;url:string;sha256:string}>={};
for(const [name,url] of Object.entries(urls)){
 const html=await readFile(path.join(root,'fixtures',`${name}.html`),'utf8');
 fixtures[name]={html,url,sha256:createHash('sha256').update(html).digest('hex')};
}
await mkdir(path.join(root,'apps/web/lib'),{recursive:true});
await writeFile(path.join(root,'apps/web/lib/fixtures.ts'),'// Generated from checked-in authored fixtures by scripts/sync-fixtures.ts.\nexport const FIXTURES = '+JSON.stringify(fixtures,null,2)+' as const;\nexport type FixtureName=keyof typeof FIXTURES;\n');
console.log('Synchronized three authored fixtures with independent SHA-256 identities');
