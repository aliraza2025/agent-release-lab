import { readFile } from 'node:fs/promises';
import { compareRuns, sampleRuns } from './public/core.js';
try {
  const args = process.argv.slice(2);
  if (args.length && args.length !== 2) throw new Error('Usage: node evaluate.mjs [baseline.json candidate.json]');
  const runs = args.length ? { baseline: JSON.parse(await readFile(args[0], 'utf8')), candidate: JSON.parse(await readFile(args[1], 'utf8')) } : sampleRuns();
  const report = compareRuns(runs.baseline, runs.candidate);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.decision === 'release' ? 0 : 2;
} catch (error) { console.error(error.message); process.exitCode = 1; }
