# Agent Release Lab — product case study

Stage: independent working prototype. No customer deployment or business impact is claimed.

## Problem

AI product teams can improve average performance while introducing a failure in a previously reliable scenario. A release review needs to preserve the individual evidence and the policy that produced its decision.

## Contribution

Product framing, scope definition, workflow design, original implementation with AI assistance, deterministic validation, testing, documentation, and a public demo.

## Decisions and tradeoffs

1. Compare matching case IDs instead of mixing different suites. This makes regressions visible.
2. Keep gates in deterministic code, including the order of approval and action events. A second language model is not used as a hidden judge.
3. Include a deliberately held candidate so the demonstration exposes a meaningful failure.
4. Export the policy together with the evaluated cases so a reviewer can reconstruct the decision.

## Verification

7 automated tests cover regression gates, approval chronology and reuse, forged citations, invalid inputs, inclusive budgets, and HTTP behavior. The browser filter and JSON export were checked. Narrow-layout inspection was performed; no formal accessibility audit or production load test was conducted.

## What would validate the product next

Connect an actual agent workflow, collect representative held-out traces, add signed event provenance, and compare decisions with independent human reviews. Publish measured false-pass and false-hold rates before making deployment claims.
