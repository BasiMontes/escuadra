#!/usr/bin/env bun
/**
 * Compares `supabase/migrations/` with the migration ledger of the linked hosted project.
 *   local only   a file never applied: someone forgot `supabase db push`
 *   remote only  a change with no file: it reached the database outside the repository
 * Exit 0 = in step, 1 = drift, 2 = it could not tell. Needs a linked project (`supabase link`).
 */

import process from 'node:process';

export interface LedgerRow {
  local: string
  remote: string
}

export function parseLedger(output: string): LedgerRow[] {
  const line = output.split('\n').map(entry => entry.trim()).find(entry => entry.startsWith('{') && entry.includes('"migrations"'));
  const rows = line ? (JSON.parse(line) as { migrations?: unknown }).migrations : undefined;
  if (!Array.isArray(rows)) { throw new TypeError(`The Supabase CLI returned no migration list:\n${output}`); }
  return rows as LedgerRow[];
}

export function analyseLedger(rows: LedgerRow[]) {
  const localOnly = rows.filter(row => row.local && !row.remote).map(row => row.local);
  const remoteOnly = rows.filter(row => row.remote && !row.local).map(row => row.remote);
  const synced = rows.filter(row => row.local && row.remote).length;
  return { localOnly, remoteOnly, synced, clean: localOnly.length === 0 && remoteOnly.length === 0 };
}

function main(): number {
  const listed = Bun.spawnSync(['supabase', 'migration', 'list', '--linked', '--output-format', 'json'], { stdout: 'pipe', stderr: 'inherit' });
  let report;
  try {
    if (listed.exitCode !== 0) { throw new Error(`supabase migration list exited with ${listed.exitCode}`); }
    report = analyseLedger(parseLedger(listed.stdout.toString()));
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
  if (report.clean) {
    console.log(`Migrations in step: ${report.synced} applied, no drift.`);
    return 0;
  }
  console.log('Drift between supabase/migrations/ and the hosted project:');
  report.localOnly.forEach(version => console.log(`  - ${version}: in the repository, not applied (supabase db push)`));
  report.remoteOnly.forEach(version => console.log(`  - ${version}: applied, with no file in the repository (supabase db pull, or supabase migration repair)`));
  return 1;
}

if (import.meta.main) {
  process.exit(main());
}
