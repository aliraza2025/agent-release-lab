# Parakh

**AI evaluation and release gates · Raza Labs by Ali Raza**

![Concept artwork for Parakh](public/project-cover.webp)

An agent trace evaluation workbench that makes a release decision inspectable. Compare the same scenario suite across a baseline and a candidate, inspect exact failures, and export the decision with its policy.

**[Open the working demo](https://aliraza2025.github.io/agent-release-lab/)** · [Product case study](CASE_STUDY.md) · [Portfolio copy](PORTFOLIO.md)

Status: independent prototype, v0.1.0. Built by Ali Raza with AI-assisted implementation.

## What works

- Adjustable per-case cost and latency budgets and a minimum passing-case threshold.
- Ordered, one-use approval checks for recorded write actions.
- Citation existence and exact source-text matching.
- Case-level regression detection across matching case IDs.
- Failure inspection, filters, JSON imports, and portable decision exports.
- A command-line evaluation entry point with exit codes for CI integration.

## Try the workflow

Open the demo and select **Regressions**. Inspect `case-5`: the candidate records an email write without a preceding approval. The candidate passes 6 of 8 synthetic cases versus 5 of 8 for the baseline, but the release is held because critical checks and previously passing cases failed. These are fixture outcomes, not model benchmark results.

To use your own runs, download the sample schema from the app, replace the synthetic cases, and import the file. Both runs must contain the same case IDs. Metric values must be finite and nonnegative.

```bash
node evaluate.mjs baseline.json candidate.json > decision.json
```

Exit code `0` means all configured gates pass; `2` means hold; `1` means invalid input. `npm run evaluate` uses the synthetic example and intentionally exits `2`. A passing report still needs a human release decision.

## Development

Requires Node.js 22 or newer. No API keys or paid services are needed for the browser demo. Development integrations have their own listed dependencies.

```bash
npm test
npm run build
npm start
```

`public/` is the source for the browser application. `docs/` is its generated GitHub Pages version; run `npm run build` after changing the browser source. The tests use Node's built-in runner. HTTP integration tests open temporary loopback ports. CI runs the tests and verifies that the generated demo is current.

## Ownership and scope

An original independent prototype built for Ali Raza's portfolio with AI-assisted implementation. Product framing, source, sample fixtures, and interface are included in this repository. No source code, branding, assets, or employment claims were copied from Adnan Khan's projects. The repository is not affiliated with those projects or the reference libraries below.

This is a working prototype, not a customer deployment. No user interviews, revenue, adoption, business savings, or production reliability are claimed. Example records are synthetic. See [CASE_STUDY.md](CASE_STUDY.md) for the product reasoning and [PORTFOLIO.md](PORTFOLIO.md) for accurate portfolio copy.

License: [MIT](LICENSE). Model weights used with an optional local model have their own licenses.

## Limits

This is a deterministic log reviewer. It does not run agents, verify the authenticity of imported logs, enforce runtime permissions, prove that an answer is true, or measure semantic task success. An exact quote can still be used to support an incorrect interpretation. Approval order is checked as recorded; timestamps or signed events are not independently verified. Teams must define case quality, criticality, and appropriate budgets. A tiny synthetic suite is not evidence of production safety.

## References considered

- [Adnan Khan: agent systems](https://adnankhan.ai/work/agent-systems) and [Centurian](https://adnankhan.ai/work/centurian): references for communicating agent responsibility and inspection. No implementation copied.
- [Promptfoo](https://github.com/promptfoo/promptfoo), MIT: a full evaluation toolkit reviewed as a foundation; this focused prototype implements its own small trace schema and rules without importing Promptfoo.
- [LangGraph](https://github.com/langchain-ai/langgraph), MIT: a possible future source of agent traces; no LangGraph integration is currently claimed.

## Local AI integration update

An inspectable release-gate workbench with regression checks and Promptfoo integration, including a recorded evaluation of a locally adapted intake classifier.

Verified: Promptfoo trace and local-model evaluations.

Trace checks do not prove factual correctness or authenticate logs. The local model test uses a small synthetic held-out set; it does not establish customer performance.

Run `npm ci`, then `npm run eval:promptfoo` for the deterministic trace integration. To reproduce actual classifier evaluation, clone and train `intake-model-lab`, set `INTAKE_MODEL_REPO` to that checkout and `PYTHON_BIN` to its environment, then run `npm run eval:local-model`. Reports in `examples/` retain both evaluations. Their synthetic test pass rates are not agent production success rates.

## Visual identity

Original AI-generated concept artwork for the Raza Labs collection, matched to Ali Raza’s midnight-purple and pink portfolio studio. The cover is illustrative artwork; the interactive demo shows the actual prototype. Generation prompt: [ARTWORK.md](ARTWORK.md).

## Local Opik metrics

The separate Opik panel runs actual Equals and IsJson metrics using opik 2.2.142. Install requirements-opik.txt in an isolated Python environment, then launch npm start with RAZA_PYTHON set to that environment’s Python executable. No model judge or API key is used; Opik analytics and tracing are disabled.

The public demo offers a recorded fixture run. Its positive and negative controls include correct JSON, a wrong intent, malformed JSON and a spacing-only difference. Exact string equality and JSON validity are different from semantic correctness or factual support. See examples/opik-report.json. No Opik backend dashboard was deployed.
