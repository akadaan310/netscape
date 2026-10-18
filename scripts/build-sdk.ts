import { build } from 'tsup';
import { existsSync } from 'node:fs';
const packages = ['core','chromatics','dynamics','resource-interpreter','performers','conformance','render-react'];
for (const name of packages) {
  const entry = `packages/${name}/src/index.${name==='render-react'?'tsx':'ts'}`;
  if (!existsSync(entry)) throw new Error(`SDK module missing: ${name}`);
  const entries = name==='resource-interpreter' ? [entry, `packages/${name}/src/fetch.ts`] : [entry];
  await build({entry:entries,format:['esm'],dts:true,clean:true,outDir:`packages/${name}/dist`,
    target:'es2022',sourcemap:true,external:['react','react/jsx-runtime','react-dom'],
    tsconfig:'tsconfig.json',silent:true});
  process.stdout.write(`Built @netscape/${name} (ESM + declarations)\n`);
}
