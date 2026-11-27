#!/usr/bin/env bun
/**
 * Proves each optional module works on top of the base: `bun run modules:verify [name ...] [--keep]`.
 * For every module, and once more with all of them together, it copies the repository to a temporary folder, adds
 * them there and runs every gate: repository checks, unit tests, database tests, build and browser tests. Your working
 * copy is not touched, but the LOCAL database is reset, so it needs the stack running and loses its local data.
 */

import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { availableModules } from './module-add.ts';

const root = process.cwd();

function run(command: string[], cwd: string, env: Record<string, string | undefined> = process.env): boolean {
  console.log(`\n> ${command.join(' ')}`);
  return Bun.spawnSync(command, { cwd, env, stdio: ['inherit', 'inherit', 'inherit'] }).exitCode === 0;
}

function copyRepository(): string {
  const target = mkdtempSync(join(tmpdir(), 'module-verify-'));
  const listed = Bun.spawnSync(['git', 'ls-files', '-co', '--exclude-standard', '-z'], { cwd: root, stdout: 'pipe' });
  for (const path of listed.stdout.toString().split('\0').filter(Boolean)) {
    mkdirSync(dirname(join(target, path)), { recursive: true });
    cpSync(join(root, path), join(target, path), { verbatimSymlinks: true });
  }
  return target;
}

function verify(names: string[], folder: string): boolean {
  // The checks expect a repository, and the module must not inherit the hooks of the real one.
  const steps = [
    ['git', 'init', '-q'],
    ['bun', 'install', '--frozen-lockfile'],
    ['supabase', 'db', 'reset'],
    ...names.map(name => ['bun', 'run', 'module:add', name]),
    ['bun', 'run', 'agents:compat'],
    ['git', 'add', '-A'],
    ['bun', 'run', 'repo:check'],
    ['bun', 'run', 'test'],
    ['bun', 'run', 'test:db'],
    ['bun', 'run', 'build'],
    ['bun', 'run', 'test:e2e'],
  ];
  return steps.every(step => run(step, folder, { ...process.env, CI: '1' }));
}

function main(args: string[]): number {
  const keep = args.includes('--keep');
  const named = args.filter(arg => !arg.startsWith('--'));
  const modules = named.length > 0 ? named : availableModules(root);
  if (Bun.spawnSync(['supabase', 'status'], { stdout: 'ignore', stderr: 'ignore' }).exitCode !== 0) {
    console.error('The local Supabase stack is not running: bun run db:start');
    return 1;
  }
  const rounds = modules.length > 1 ? [...modules.map(name => [name]), modules] : [modules];
  const failed = rounds.filter((names) => {
    console.log(`\n=== ${names.join(' + ')}`);
    const folder = copyRepository();
    const passed = verify(names, folder);
    if (passed && !keep) { rmSync(folder, { recursive: true, force: true }); }
    else { console.log(`Copy kept at ${folder}`); }
    return !passed;
  }).map(names => names.join(' + '));
  // The reset leaves the database as the base defines it.
  run(['supabase', 'db', 'reset'], root);
  console.log(failed.length === 0 ? `\nModules verified: ${modules.join(', ')}` : `\nFailed: ${failed.join(', ')}`);
  return failed.length === 0 ? 0 : 1;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
