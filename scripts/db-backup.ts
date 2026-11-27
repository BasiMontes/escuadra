#!/usr/bin/env bun
/**
 * A logical backup of the hosted database that proves it restores, because a dump nobody restored is a hope.
 *   run     dump -> encrypt -> restore into a throwaway Postgres -> compare row counts
 *   verify  the same restore and comparison for an existing encrypted dump
 * The source database is only read. Needs Docker: `pg_dump`, `psql` and the scratch server come from one image.
 *
 *   SUPABASE_DB_URL      postgres:// URL of the database to back up
 *   BACKUP_PASSPHRASE    encrypts the dump (AES-256-CBC, PBKDF2)
 *
 *   bun scripts/db-backup.ts run --out backup.dump.enc
 *   bun scripts/db-backup.ts verify --in backup.dump.enc --counts counts.json
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const PG_IMAGE = 'postgres:17-alpine';
export const DUMPED_SCHEMAS = ['public', 'auth', 'storage', 'supabase_migrations'];

// Roles the restored policies name; a plain Postgres does not have them.
const SUPABASE_ROLES = ['anon', 'authenticated', 'service_role', 'supabase_auth_admin', 'supabase_storage_admin'];

export type RowCounts = Record<string, number>;

export interface CountMismatch {
  table: string
  restored: number | null
  min: number
  max: number
}

export function parseCounts(output: string): RowCounts {
  const counts: RowCounts = {};
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) { continue; }
    const comma = trimmed.lastIndexOf(',');
    const table = trimmed.slice(0, comma);
    const count = Number(trimmed.slice(comma + 1));
    if (!table || !Number.isInteger(count)) { throw new Error(`Unparseable count line: ${trimmed}`); }
    counts[table] = count;
  }
  return counts;
}

// The source keeps changing during the dump, so a table is right between the counts taken before and after it.
export function compareCounts({ before, after, restored }: {
  before: RowCounts
  after: RowCounts
  restored: RowCounts
}): CountMismatch[] {
  const mismatches: CountMismatch[] = [];
  for (const table of Object.keys(before)) {
    const min = Math.min(before[table], after[table] ?? before[table]);
    const max = Math.max(before[table], after[table] ?? before[table]);
    const value = restored[table];
    if (value === undefined) {
      mismatches.push({ table, restored: null, min, max });
    }
    else if (value < min || value > max) {
      mismatches.push({ table, restored: value, min, max });
    }
  }
  return mismatches;
}

const COUNT_SQL = `
select table_schema || '.' || table_name || ',' ||
  (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
from information_schema.tables
where table_type = 'BASE TABLE'
  and table_schema in (${DUMPED_SCHEMAS.map(s => `'${s}'`).join(', ')})
order by 1;`;

async function run(cmd: string[], opts: { stdin?: string, allowFail?: boolean } = {}): Promise<{ code: number, out: string, err: string }> {
  const proc = Bun.spawn(cmd, {
    stdin: opts.stdin === undefined ? 'ignore' : new Blob([opts.stdin]),
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0 && !opts.allowFail) {
    // Never echo the command: it can carry the database URL.
    throw new Error(`${cmd[0]} ${cmd[1] ?? ''} failed (exit ${code}): ${err.trim().split('\n').slice(-3).join(' | ')}`);
  }
  return { code, out, err };
}

const HOST_ARGS = ['--add-host=host.docker.internal:host-gateway'];

async function countRowsAt(url: string): Promise<RowCounts> {
  const { out } = await run(['docker', 'run', '--rm', ...HOST_ARGS, PG_IMAGE, 'psql', url, '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-c', COUNT_SQL]);
  return parseCounts(out);
}

function opensslArgs({ mode, input, output }: { mode: 'enc' | 'dec', input: string, output: string }): string[] {
  const flag = mode === 'enc' ? '-e' : '-d';
  return ['openssl', 'enc', flag, '-aes-256-cbc', '-pbkdf2', '-iter', '600000', '-salt', '-pass', 'env:BACKUP_PASSPHRASE', '-in', input, '-out', output];
}

async function dumpToFile({ url, file }: { url: string, file: string }): Promise<void> {
  const dir = join(file, '..');
  const name = file.slice(dir.length + 1);
  const schemaArgs = DUMPED_SCHEMAS.flatMap(s => ['--schema', s]);
  await run(['docker', 'run', '--rm', ...HOST_ARGS, '-v', `${dir}:/out`, PG_IMAGE, 'pg_dump', url, '--format=custom', '--no-owner', '--no-privileges', ...schemaArgs, '--file', `/out/${name}`]);
}

// The image first starts a temporary server on the unix socket only: probing over TCP waits for the real one.
export function readinessProbeArgs(container: string): string[] {
  return ['docker', 'exec', container, 'psql', '-h', '127.0.0.1', '-U', 'postgres', '-tAc', 'select 1'];
}

async function restoreAndCount(dumpFile: string): Promise<{ counts: RowCounts, restoreErrors: number }> {
  const container = `db-backup-verify-${process.pid}`;
  try {
    await run(['docker', 'run', '-d', '--rm', '--name', container, '-e', 'POSTGRES_PASSWORD=verify', PG_IMAGE]);
    for (let i = 0; ; i++) {
      const ready = await run(readinessProbeArgs(container), { allowFail: true });
      if (ready.out.trim() === '1') { break; }
      if (i > 60) { throw new Error('Scratch Postgres did not become ready in 60s'); }
      await Bun.sleep(1000);
    }
    const roles = SUPABASE_ROLES.map(r => `create role ${r} nologin;`).join(' ');
    await run(['docker', 'exec', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', `${roles} create schema if not exists extensions; create extension if not exists pgcrypto with schema extensions; create extension if not exists "uuid-ossp" with schema extensions; create extension if not exists pg_trgm with schema extensions;`]);
    await run(['docker', 'cp', dumpFile, `${container}:/tmp/restore.dump`]);
    // pg_restore also fails on harmless things (objects owned by extensions): the row counts are the verdict.
    const restore = await run(['docker', 'exec', container, 'pg_restore', '-U', 'postgres', '-d', 'postgres', '--no-owner', '--no-privileges', '/tmp/restore.dump'], { allowFail: true });
    const errorLines = restore.err.split('\n').filter(line => line.startsWith('pg_restore: error:'));
    const restoreErrors = errorLines.length;
    for (const line of errorLines.slice(0, 5)) { console.log(line.slice(0, 200)); }
    const { out } = await run(['docker', 'exec', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-c', COUNT_SQL]);
    return { counts: parseCounts(out), restoreErrors };
  }
  finally {
    await run(['docker', 'rm', '-f', container], { allowFail: true });
  }
}

function formatReport({ mismatches, tables, restoreErrors }: { mismatches: CountMismatch[], tables: number, restoreErrors: number }): string {
  const lines = [`Restored ${tables} tables, ${restoreErrors} pg_restore error(s) tolerated.`];
  if (mismatches.length === 0) {
    lines.push('Row counts match for every table.');
  }
  else {
    lines.push(`${mismatches.length} table(s) do NOT match:`);
    for (const m of mismatches) { lines.push(`  ${m.table}: restored ${m.restored ?? 'MISSING'}, source ${m.min}..${m.max}`); }
  }
  return lines.join('\n');
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function need(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set (see .env.example / repository secrets).`);
    process.exit(1);
  }
  return value;
}

async function verifyDump({ encrypted, before, after }: { encrypted: string, before: RowCounts, after: RowCounts }): Promise<boolean> {
  const scratch = mkdtempSync(join(tmpdir(), 'db-backup-'));
  try {
    const plain = join(scratch, 'restore.dump');
    await run(opensslArgs({ mode: 'dec', input: encrypted, output: plain }));
    const { counts, restoreErrors } = await restoreAndCount(plain);
    const mismatches = compareCounts({ before, after, restored: counts });
    console.log(formatReport({ mismatches, tables: Object.keys(counts).length, restoreErrors }));
    return mismatches.length === 0;
  }
  finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const command = process.argv[2];
  need('BACKUP_PASSPHRASE');

  if (command === 'run') {
    const url = need('SUPABASE_DB_URL');
    const out = arg('out');
    if (!out) { throw new Error('--out <file> is required'); }
    const scratch = mkdtempSync(join(tmpdir(), 'db-backup-'));
    try {
      const before = await countRowsAt(url);
      const plain = join(scratch, 'backup.dump');
      await dumpToFile({ url, file: plain });
      const after = await countRowsAt(url);
      await run(opensslArgs({ mode: 'enc', input: plain, output: out }));
      writeFileSync(`${out}.counts.json`, JSON.stringify({ before, after }, null, 2));
    }
    finally {
      rmSync(scratch, { recursive: true, force: true });
    }
    const counts = JSON.parse(readFileSync(`${out}.counts.json`, 'utf8')) as { before: RowCounts, after: RowCounts };
    const ok = await verifyDump({ encrypted: out, ...counts });
    if (!ok) { process.exit(1); }
    return;
  }

  if (command === 'verify') {
    const input = arg('in');
    const countsFile = arg('counts');
    if (!input || !countsFile || !existsSync(input) || !existsSync(countsFile)) { throw new Error('--in <file> and --counts <file> are required and must exist'); }
    const counts = JSON.parse(readFileSync(countsFile, 'utf8')) as { before: RowCounts, after: RowCounts };
    const ok = await verifyDump({ encrypted: input, ...counts });
    if (!ok) { process.exit(1); }
    return;
  }

  console.error('Usage: bun scripts/db-backup.ts run --out <file> | verify --in <file> --counts <file>');
  process.exit(1);
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
