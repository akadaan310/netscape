# Run and deploy

Node 22 or newer and npm are required. No environment variables or private services are needed. From this monorepo's root:

```sh
npm ci
npm test
npm run typecheck
npm run build
npm start
```

Open http://localhost:3000. For development use `npm run dev`. It starts with an authored NASA-topic fixture; NASA, restaurant and repository demos work without network access. Public ingestion allows only exact HTTPS hosts `www.nasa.gov`, `nasa.gov`, `science.nasa.gov`, `github.com`. No sign-in or external service mutation is implemented. Other resources provide a clear external-open fallback.

## Vercel

Import the repository as a Next.js project, select Node 22.x or 24.x, and set **Root Directory** to `apps/web`. Enable **Include source files outside of the Root Directory in the Build Step**. The root workspace lockfile and packages must be included. Use install command `cd ../.. && npm ci` and build command `cd ../.. && npm run build`. Leave the output directory at the Next.js default `.next` relative to `apps/web`. The build script emits the independent SDK first and synchronizes the checked-in fixtures before `next build`. No secrets are required. `.env.example` documents optional local test settings only.

The Node server function uses a maximum 8-second deadline and a 1 MiB response cap with four redirects. It resolves and validates every hostname answer, pins one public address for each TLS request, and retains TLS hostname verification. Credential forwarding, cookies, compressed bodies, arbitrary ports and unsupported MIME types are rejected. Do not replace this with an unconstrained fetch proxy. The in-memory 30-read/minute and four-concurrent-read caps apply **per process**, not globally across a serverless deployment. Configure a hosting-edge distributed rate limit for public traffic before broad launch.

CSP disables frames, objects and cross-origin client connections. Next.js currently uses inline bootstrap scripts and inline region styles, so script/style CSP includes `unsafe-inline`; a nonce-based script policy is a future hardening task. Parsed source HTML is never injected into the document. No code attempts to bypass website framing or content policies.

## Reproduce evidence

```sh
npm run experiments
npm run test:e2e
bash scripts/reconstruct.sh
```

Playwright needs Chromium. This environment uses `/usr/bin/chromium`; on a fresh machine run `npx playwright install chromium` and set `CHROMIUM_PATH` to its executable, or adjust the configuration to use Playwright's managed browser. Harness output records Chromium's version and pins locale, timezone, device scale, simulation tick and font rendering. It preserves timestamped failing runs and traces.

The reconstruction script exports the exact Git checkpoint into a new temporary directory, performs `npm ci`, tests, typecheck and the full SDK/Next production build, and stores actual output under `artifacts/reports`. It requires registry access, but no paid or private service.

No public deployment has been performed. A live URL must only be reported after a successful authorized deployment.
