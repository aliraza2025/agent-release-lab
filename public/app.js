import { compareRuns, sampleRuns } from './core.js';
import { el, download, showError } from './shared.js';
let runs = sampleRuns();
let report;
let selected = 'case-5';
let policy = { maxLatencyMs: 5000, maxCostUsd: 0.03, minPassRate: 0.8 };
const $ = id => document.getElementById(id);
const money = value => `$${value.toFixed(3)}`;
function render() {
  report = compareRuns(runs.baseline, runs.candidate, policy);
  const candidate = report.candidate;
  $('summary').replaceChildren(el('div', { className: 'metrics' },
    ...[['Passing cases', `${Math.round(candidate.passRate * 100)}%`, `${candidate.cases.filter(item => item.pass).length} / ${candidate.cases.length} candidate cases`],
      ['Critical failures', String(candidate.criticalFailures), 'Approval and citation checks'],
      ['P95 latency', `${(candidate.p95LatencyMs / 1000).toFixed(1)}s`, 'Nearest-rank percentile'],
      ['Recorded cost', money(candidate.totalCostUsd), 'Sum of imported case costs']].map(([label, value, note]) => el('div', { className: 'metric' }, el('span', {}, label), el('strong', {}, value), el('small', {}, note)))),
    el('div', { className: `decision ${report.decision}` }, el('div', {}, el('div', { className: 'eyebrow' }, 'CANDIDATE RELEASE DECISION'), el('h2', {}, report.decision === 'hold' ? 'Hold this release.' : 'Ready for review.'), el('p', {}, report.reasons.join(' ') || 'All configured gates pass. A human still owns the release decision.')), el('div', { className: 'comparison' }, `Baseline ${Math.round(report.baseline.passRate * 100)}% → Candidate ${Math.round(candidate.passRate * 100)}%`, el('small', {}, `${report.regressions.length} regressions across matching case IDs`))));
  renderCases();
  $('error').hidden = true;
}
function renderCases() {
  const visible = report.candidate.cases.filter(item => $('filter').value === 'all' || ($('filter').value === 'failed' ? !item.pass : report.regressions.includes(item.id)));
  if (!visible.some(item => item.id === selected)) selected = visible[0]?.id;
  $('cases').replaceChildren(...visible.map(item => el('button', { className: `case ${item.id === selected ? 'selected' : ''}`, 'aria-pressed': String(item.id === selected), onclick: () => { selected = item.id; renderCases(); } }, el('span', { className: 'case-id' }, item.id), el('strong', {}, item.task), el('span', { className: item.pass ? 'good' : 'bad' }, item.pass ? 'PASS' : 'REVIEW'))));
  const item = visible.find(row => row.id === selected);
  if (!item) { $('detail').replaceChildren(el('p', {}, 'No cases match this filter.')); return; }
  $('detail').replaceChildren(el('div', { className: 'eyebrow' }, `${item.id} / CANDIDATE TRACE`), el('h3', {}, item.task),
    el('div', { className: 'checks' }, ...item.checks.map(check => el('div', { className: 'check' }, el('span', { className: check.pass ? 'good' : 'bad' }, check.pass ? 'PASS' : 'FAIL'), el('span', {}, check.label), check.critical ? el('small', {}, 'critical') : null))),
    el('h4', {}, 'Recorded actions'), ...item.events.map((event, i) => el('div', { className: 'event' }, el('span', { className: 'mono muted' }, String(i + 1).padStart(2, '0')), el('div', {}, el('strong', {}, event.type === 'tool' ? event.name : `Approval: ${event.decision}`), el('small', {}, `${event.actionId}${event.risk ? ` · ${event.risk}` : ''}`)))),
    el('h4', {}, 'Answer & source citations'), el('p', {}, item.answer || 'No answer recorded.'), ...item.citations.map(citation => el('blockquote', {}, citation.quote, el('small', {}, citation.sourceId))), el('details', {}, el('summary', {}, 'Inspect raw case JSON'), el('pre', {}, JSON.stringify(item, null, 2))));
}
$('policy').addEventListener('submit', event => { event.preventDefault(); try { policy = { maxLatencyMs: Number($('latency').value), maxCostUsd: Number($('cost').value), minPassRate: Number($('pass-rate').value) / 100 }; render(); } catch (error) { showError(error); } });
$('filter').addEventListener('change', renderCases);
$('reset').addEventListener('click', () => { runs = sampleRuns(); render(); });
$('export').addEventListener('click', () => download('release-decision.json', JSON.stringify(report, null, 2), 'application/json'));
$('samples').addEventListener('click', () => download('sample-runs.json', JSON.stringify(sampleRuns(), null, 2), 'application/json'));
$('import').addEventListener('change', async event => { try { const file = event.target.files[0]; if (!file) return; if (file.size > 2_000_000) throw new Error('Choose a file smaller than 2 MB.'); const next = JSON.parse(await file.text()); compareRuns(next.baseline, next.candidate, policy); runs = next; render(); } catch (error) { showError(error); } finally { event.target.value = ''; } });
render();
