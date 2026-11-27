# Triage of a flaky end-to-end scenario

A scenario is flaky when it failed at the first attempt and passed on the retry. The retry keeps the run green; the budget step (`scripts/e2e-flaky-budget.ts`) keeps it visible and fails the job when there are too many.

## What a run keeps

The `e2e` job of the PR check uploads these artifacts:

| Artifact | What is inside |
| --- | --- |
| `playwright-report` | The report and the traces. The error context of each failure shows the screen at that moment |
| `supabase-logs` | One log per container of the local stack |

The `e2e flakiness budget` step names every flaky scenario in the job summary.

## How to follow it

1. Find the scenario and the time of its first attempt in the log of the `e2e` job.
2. Download `playwright-report` and read the error and the trace of that attempt.
3. If the error is a 5xx, download `supabase-logs` and look at the same minute in the gateway, REST and auth logs.
4. Decide with the cause in hand: fix the app, or fix the test. Open a ticket either way. Raising a timeout or adding a retry without a cause is not a fix.

Do not paste raw logs into tickets or pull requests without reading them first.

## Reproducing

`bun run test:e2e --repeat-each=20 --grep "<scenario title>"` against the local stack.
