# Vercel workspace build fix

The deployment at `2962a90` failed because the selected web workspace ran a fixture-sync prebuild using `tsx`, while that tool was declared only in the repository root's development dependencies. A clean `npm ci --workspace=@netscape/web` reproduced the same exit127 / `tsx: not found` failure before Next.js ran.

The web workspace now declares its own `tsx`, TypeScript and Node/React declarations. No package versions changed. `apps/web/vercel.json` sets the install to `npm ci --include=dev --workspace=@netscape/web` and the build to `npm run build`, both from `apps/web`. Next.js compiles the SDK source through the existing `transpilePackages`; prebuilt SDK output and root-only development tools are unnecessary for the app build.

Verification used the same clean source export with only the four packaging/documentation changes copied in. With `NODE_ENV=production`, the install succeeded, all declared build tools resolved, and the root-only `tsup` tool remained absent. The workspace production build completed with Next.js15.5.28. Its production server returned200 for the page and all three fixture APIs, each with nonempty semantic graphs/intents and the correct source SHA-256. The72 Node tests and both TypeScript projects passed. Independent read-only review found no defects in the fix.

Evidence:

- [Original clean reproduction](vercel-workspace-before.txt)
- [Clean install and passing production build](vercel-workspace-after.txt)
- [Production HTTP checks](vercel-production-smoke.json)
- [Production server output](vercel-production-server.txt)
- [72-test output](vercel-fix-tests.txt)
- [TypeScript output](vercel-fix-typecheck.txt)
- [Follow-up source/evidence hashes](vercel-build-fix.json)

The earlier acceptance report and its source inventory describe their recorded checkpoints. This follow-up covers the deployment packaging correction. The existing48-browser-test and36-case visual results were not rerun for this packaging change; application and SDK runtime source are unchanged.

The actual Vercel platform build must run after this commit is pushed. This local verification does not claim a successful Vercel deployment. Keep Root Directory `apps/web` and inclusion of files outside the root enabled; the checked-in Vercel config provides the commands. See [DEPLOYMENT.md](../../DEPLOYMENT.md).
