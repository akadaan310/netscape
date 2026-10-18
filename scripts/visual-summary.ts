import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildVisualSummary } from '../tests/e2e/report.ts';

const runs = (await readdir('artifacts/browser')).filter(name => /^\d{4}-/.test(name)).sort();
const runId = process.argv[2] || runs.at(-1);
if (!runId || path.basename(runId) !== runId) throw new Error('Pass the browser run directory name');
const root = path.resolve('artifacts/browser', runId);
const records: any[] = [];
for (const file of await readdir(root, { recursive: true })) {
  if (file.endsWith('/manifest.json')) records.push(JSON.parse(await readFile(path.join(root, file), 'utf8')));
}
const report = buildVisualSummary(records, runId);
const file = `artifacts/reports/visual-summary-${runId}.json`;
await writeFile(file, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ file, observedCases: report.observedCases, passedCases: report.passedCases, totals: report.totals }, null, 2));
