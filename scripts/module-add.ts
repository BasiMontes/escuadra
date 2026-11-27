#!/usr/bin/env bun
/**
 * Adds an optional module from `modules/` to the app: `bun run module:add <name>`.
 * It copies the module's files, dates its migration, declares its dependencies, applies the migration to the local
 * database and regenerates the types. It never overwrites a file, and it does not remove modules.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import process from 'node:process';

interface ModuleManifest {
  summary: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  nextSteps: string[]
}

export interface ModulePlan {
  name: string
  copies: { from: string, to: string }[]
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  nextSteps: string[]
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  agenticModules?: string[]
}

const migrationPrefix = 'supabase/migrations/NOW_';

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

export function availableModules(root: string): string[] {
  const folder = join(root, 'modules');
  if (!existsSync(folder)) { return []; }
  return readdirSync(folder).filter(name => existsSync(join(folder, name, 'module.json'))).sort();
}

function readPackage(root: string): PackageJson {
  return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as PackageJson;
}

// Supabase orders migrations by their timestamp, so two must never share one.
function freeStamp({ root, now }: { root: string, now: Date }): string {
  const folder = join(root, 'supabase/migrations');
  const taken = new Set(existsSync(folder) ? readdirSync(folder).map(name => name.split('_')[0]) : []);
  for (let time = now.getTime(); ; time += 1000) {
    const stamp = new Date(time).toISOString().replace(/\D/g, '').slice(0, 14);
    if (!taken.has(stamp)) { return stamp; }
  }
}

export function planModule({ root, name, now = new Date() }: { root: string, name: string, now?: Date }): ModulePlan {
  const available = availableModules(root);
  if (!available.includes(name)) { throw new Error(`Unknown module "${name}". Available: ${available.join(', ') || 'none'}`); }
  if (readPackage(root).agenticModules?.includes(name)) { throw new Error(`The module "${name}" is already installed`); }

  const manifest = JSON.parse(readFileSync(join(root, 'modules', name, 'module.json'), 'utf8')) as ModuleManifest;
  const source = join(root, 'modules', name, 'files');
  const stamp = freeStamp({ root, now });
  const conflicts: string[] = [];
  const copies = filesUnder(source).flatMap((from) => {
    const path = relative(source, from).replaceAll('\\', '/');
    const to = path.startsWith(migrationPrefix) ? path.replace('/NOW_', `/${stamp}_`) : path;
    if (!existsSync(join(root, to))) { return [{ from, to }]; }
    if (readFileSync(join(root, to), 'utf8') !== readFileSync(from, 'utf8')) { conflicts.push(to); }
    return [];
  });
  if (conflicts.length > 0) {
    throw new Error(`These files exist with other content, nothing was written:\n${conflicts.map(path => `  - ${path}`).join('\n')}`);
  }

  return { name, copies, dependencies: manifest.dependencies ?? {}, devDependencies: manifest.devDependencies ?? {}, nextSteps: manifest.nextSteps };
}

function sorted(entries: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
}

export function applyModule({ root, plan }: { root: string, plan: ModulePlan }) {
  for (const { from, to } of plan.copies) {
    mkdirSync(dirname(join(root, to)), { recursive: true });
    writeFileSync(join(root, to), readFileSync(from));
  }
  const pkg = readPackage(root);
  pkg.dependencies = sorted({ ...pkg.dependencies, ...plan.dependencies });
  pkg.devDependencies = sorted({ ...pkg.devDependencies, ...plan.devDependencies });
  pkg.agenticModules = [...pkg.agenticModules ?? [], plan.name].sort();
  writeFileSync(join(root, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
}

const afterCopying = [
  ['bun', 'install'],
  ['supabase', 'migration', 'up', '--local'],
  ['bun', 'run', 'db:types'],
  ['bun', 'run', 'guard:manifest'],
];

function spawn(command: string[]): boolean {
  console.log(`> ${command.join(' ')}`);
  return Bun.spawnSync(command, { stdio: ['inherit', 'inherit', 'inherit'] }).exitCode === 0;
}

// The files are already written when these run, so a failure has to say what is left to do.
export function runSteps({ steps, run }: { steps: string[][], run: (command: string[]) => boolean }) {
  steps.forEach((command, index) => {
    if (run(command)) { return; }
    const left = steps.slice(index).map(step => `  ${step.join(' ')}`).join('\n');
    throw new Error(`"${command.join(' ')}" failed. The module files are in place. Fix the cause, then run:\n${left}`);
  });
}

function main(name: string | undefined): number {
  const root = process.cwd();
  try {
    const plan = planModule({ root, name: name ?? '' });
    // Checked before writing: without the database the types cannot follow the new migration.
    if (Bun.spawnSync(['supabase', 'status'], { stdout: 'ignore', stderr: 'ignore' }).exitCode !== 0) {
      throw new Error('The local Supabase stack is not running: bun run db:start');
    }
    applyModule({ root, plan });
    runSteps({ steps: afterCopying, run: spawn });
    console.log(`\nModule "${plan.name}" added. Next:\n${plan.nextSteps.map(step => `  - ${step}`).join('\n')}`);
    return 0;
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (import.meta.main) {
  process.exit(main(process.argv[2]));
}
