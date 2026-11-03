# Agent Release Lab

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

Requires Node.js 22 or newer. No npm packages, API keys, or paid services are needed for the browser demo.

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
