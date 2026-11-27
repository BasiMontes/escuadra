#!/usr/bin/env bun
/**
 * Counts the end-to-end scenarios that failed and then passed on a retry, from the Playwright JSON report.
 * 0 says nothing, 1 or 2 warn, 3 fail the job: a retry must not hide a degrading suite. Each warning is a defect
 * to ticket (`docs/workflows/e2e-flaky-triage.md`).
 *
 *   bun scripts/e2e-flaky-budget.ts [report.json] [--require-report]
 *
 * With `--require-report` a missing report fails, so a green run cannot skip the budget.
 */

import { appendFile } from 'node:fs/promises';

export const WARN_AT = 1;
export const FAIL_AT = 3;
export const DEFAULT_REPORT = 'test-results/e2e-results.json';

interface JsonTest { status?: string, projectName?: string, results?: { retry?: number }[] }
interface JsonSpec { title: string, file?: string, tests?: JsonTest[] }
interface JsonSuite { title?: string, file?: string, specs?: JsonSpec[], suites?: JsonSuite[] }
export interface PlaywrightJsonReport { suites?: JsonSuite[] }

export interface FlakyTest { title: string, file: string, project: string, retries: number }

function walk(suite: JsonSuite, found: FlakyTest[]): void {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      if (test.status === 'flaky') {
        found.push({
          title: spec.title,
          file: spec.file ?? suite.file ?? '',
          project: test.projectName ?? '',
          retries: Math.max(0, ...(test.results ?? []).map(r => r.retry ?? 0)),
        });
      }
    }
  }
  for (const child of suite.suites ?? []) {
    walk(child, found);
  }
}

export function findFlaky(report: PlaywrightJsonReport): FlakyTest[] {
  const found: FlakyTest[] = [];
  for (const suite of report.suites ?? []) {
    walk(suite, found);
  }
  return found;
}

export type BudgetVerdict = 'ok' | 'warn' | 'fail';

export function verdictFor(flaky: number): BudgetVerdict {
  if (flaky >= FAIL_AT) { return 'fail'; }
  if (flaky >= WARN_AT) { return 'warn'; }
  return 'ok';
}

export function renderSummary(flaky: FlakyTest[]): string {
  const verdict = verdictFor(flaky.length);
  const head = `### e2e flakiness budget\n\nFlaky scenarios (failed, then passed on retry): **${flaky.length}** (warn from ${WARN_AT}, fail from ${FAIL_AT}).`;
  if (flaky.length === 0) {
    return `${head}\n`;
  }
  const rows = flaky.map(f => `| ${f.title.replace(/\|/g, '\\|')} | \`${f.file}\` | ${f.project} |`).join('\n');
  const next = verdict === 'fail'
    ? 'Over the budget: the job fails. Fix or quarantine the scenarios below before merging.'
    : 'Open a ticket per scenario below. A flake is a defect, not noise.';
  return `${head}\n\n${next}\n\n| Scenario | File | Project |\n|---|---|---|\n${rows}\n`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const requireReport = args.includes('--require-report');
  const path = args.find(a => !a.startsWith('--')) ?? DEFAULT_REPORT;

  const file = Bun.file(path);
  if (!(await file.exists())) {
    const message = `e2e flakiness budget: no report at ${path}`;
    if (requireReport) {
      console.error(`::error::${message} (e2e passed, so the budget cannot be skipped)`);
      process.exit(1);
    }
    console.log(`::notice::${message}`);
    return;
  }

  const flaky = findFlaky(await file.json() as PlaywrightJsonReport);
  const summary = renderSummary(flaky);
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }

  const verdict = verdictFor(flaky.length);
  for (const f of flaky) {
    console.log(`::warning file=${f.file}::flaky e2e scenario (passed on retry): ${f.title}`);
  }
  if (verdict === 'fail') {
    console.error(`::error::e2e flakiness budget exceeded: ${flaky.length} flaky scenarios (limit ${FAIL_AT - 1})`);
    process.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
