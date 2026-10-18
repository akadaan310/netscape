"""Capture public methodological sources through inherited proxy and verified TLS."""
import datetime, hashlib, json, pathlib, subprocess
sources = [
 ('wcag-contrast','https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html','WCAG 2.2 Understanding SC 1.4.3: normal text 4.5:1; large text 3:1.'),
 ('wcag-luminance','https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html#dfn-relative-luminance','WCAG sRGB relative luminance and contrast ratio; independent implementation in experiments/oracles.ts.'),
 ('css-color-4','https://www.w3.org/TR/css-color-4/','CSS Color 4 specifies OKLab/OKLCH and sRGB conversion/gamut considerations; does not validate this implementation.'),
 ('numerical-integration','https://gafferongames.com/post/integration_basics/','Established semi-implicit Euler and damping/spring numerical integration; stable timestep remains parameter-dependent.'),
 ('diffusion-stability','https://hplgit.github.io/fdm-book/doc/pub/book/sphinx/._book011.html','Finite-difference diffusion: explicit stepping requires stability bounds; graph implementation additionally needs degree-aware bounds.'),
 ('typescript-compatibility','https://www.typescriptlang.org/docs/handbook/type-compatibility.html','Established structural type compatibility constrains producer/consumer composition; runtime validation remains required for dynamic input.'),
 ('json-schema','https://json-schema.org/understanding-json-schema/reference/type','Runtime JSON type checking is independent of static TypeScript types; typed pipeline composition also needs effect authority.')
]
out=pathlib.Path('artifacts/experiments/sources'); out.mkdir(parents=True,exist_ok=True)
records=[]
for key,url,basis in sources:
 path=out/(key+'.html')
 p=subprocess.run(['curl','--fail','--location','--silent','--show-error','--max-time','45','--max-filesize','2000000',url,'--output',str(path)],capture_output=True,text=True)
 raw=path.read_bytes() if p.returncode==0 else b''
 records.append(dict(id=key,url=url,basis=basis,retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),status='retrieved' if p.returncode==0 else 'failed',sha256=hashlib.sha256(raw).hexdigest() if raw else None,bytes=len(raw),error=p.stderr[:400] if p.returncode else None))
 print(key,records[-1]['status'],len(raw))
(out/'bibliography.json').write_text(json.dumps(records,indent=2)+'\n')
