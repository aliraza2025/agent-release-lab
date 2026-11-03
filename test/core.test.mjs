import test from 'node:test';
import assert from 'node:assert/strict';
import { compareRuns, evaluateRun, sampleRuns, DEFAULT_POLICY } from '../public/core.js';
test('a higher aggregate score does not bypass critical gates or regressions', () => {
  const { baseline, candidate } = sampleRuns();
  const report = compareRuns(baseline, candidate);
  assert.ok(report.candidate.passRate > report.baseline.passRate);
  assert.equal(report.decision, 'hold');
  assert.equal(report.candidate.criticalFailures, 1);
  assert.deepEqual(report.regressions, ['case-5', 'case-7']);
});
test('approval after a write does not authorize the earlier action', () => {
  const { candidate } = sampleRuns();
  candidate.cases[4].events.push({ type: 'approval', actionId: 'send-email', decision: 'approved' });
  assert.ok(!evaluateRun(candidate).cases[4].checks.find(check => check.key === 'approval').pass);
});
test('approval is consumed and cannot be replayed for a second write', () => {
  const { candidate } = sampleRuns();
  candidate.cases[4].events = [{ type: 'approval', actionId: 'send-email', decision: 'approved' }, { type: 'tool', actionId: 'send-email', name: 'send_email', risk: 'write' }];
  assert.ok(evaluateRun(candidate).cases[4].checks.find(check => check.key === 'approval').pass);
  candidate.cases[4].events.push({ type: 'tool', actionId: 'send-email', name: 'send_email', risk: 'write' });
  assert.ok(!evaluateRun(candidate).cases[4].checks.find(check => check.key === 'approval').pass);
});
test('invented source IDs and altered quotes fail citation verification', () => {
  const { candidate } = sampleRuns();
  candidate.cases[0].citations[0].sourceId = 'invented';
  candidate.cases[1].citations[0].quote = 'Altered quote';
  assert.equal(evaluateRun(candidate).criticalFailures, 3);
});
test('rejects empty runs, negative metrics, duplicate IDs, and incomparable suites', () => {
  const { baseline, candidate } = sampleRuns();
  assert.throws(() => evaluateRun({ label: 'empty', cases: [] }));
  candidate.cases[0].costUsd = -1;
  assert.throws(() => evaluateRun(candidate));
  candidate.cases[0].costUsd = 0;
  candidate.cases[0].id = candidate.cases[1].id;
  assert.throws(() => evaluateRun(candidate));
  candidate.cases[0].id = 'different-suite';
  assert.throws(() => compareRuns(baseline, candidate));
});
test('identical passing suites can be released and policy limits are inclusive', () => {
  const { baseline } = sampleRuns();
  baseline.cases = [baseline.cases[0]];
  baseline.cases[0].latencyMs = DEFAULT_POLICY.maxLatencyMs;
  baseline.cases[0].costUsd = DEFAULT_POLICY.maxCostUsd;
  assert.equal(compareRuns(baseline, structuredClone(baseline)).decision, 'release');
  assert.throws(() => compareRuns(baseline, baseline, { ...DEFAULT_POLICY, minPassRate: NaN }));
});
