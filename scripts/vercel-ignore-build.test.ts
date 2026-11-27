import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

// Runs the real shell script on a throwaway repository: the path rules are the delicate part. Exit 0 skips a build.
const script = resolve(import.meta.dir, 'vercel-ignore-build.sh');

let repo: string;

// Git hooks export these, and they would point the commands below at the real repository.
const repositoryOverrides = new Set(['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE']);
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => !repositoryOverrides.has(name)));

function git(...args: string[]): string {
  return Bun.spawnSync(['git', ...args], { cwd: repo, env: cleanEnv }).stdout.toString().trim();
}

function commit(files: Record<string, string>): string {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), content);
  }
  git('add', '-A');
  git('commit', '-q', '-m', 'c');
  return git('rev-parse', 'HEAD');
}

function run(previous?: string): number {
  const env: Record<string, string> = { PATH: process.env.PATH ?? '' };
  if (previous) { env.VERCEL_GIT_PREVIOUS_SHA = previous; }
  return Bun.spawnSync(['sh', script], { cwd: repo, env }).exitCode;
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'ignore-build-'));
  git('init', '-q');
  git('config', 'user.email', 'test@example.test');
  git('config', 'user.name', 'test');
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('vercel-ignore-build.sh', () => {
  test('skips when only docs, tests, CI and agent files changed', () => {
    const base = commit({ 'src/app/page.tsx': 'a' });
    commit({ '.context/log.md': 'x', 'docs/guide.md': 'x', 'e2e/a.spec.ts': 'x', 'test/setup.ts': 'x', '.github/workflows/ci.yml': 'x', 'src/lib/thing.test.ts': 'x', '.agents/skill.md': 'x', 'README.md': 'x' });

    expect(run(base)).toBe(0);
  });

  test('builds when app code changed', () => {
    const base = commit({ 'src/app/page.tsx': 'a' });
    commit({ 'src/app/page.tsx': 'b' });

    expect(run(base)).toBe(1);
  });

  test('compares with the last deployment, not with the previous commit', () => {
    const base = commit({ 'src/app/page.tsx': 'a' });
    commit({ 'src/lib/price.ts': 'code' });
    commit({ 'docs/guide.md': 'docs' });

    expect(run(base)).toBe(1);
  });

  test('builds for a new top-level folder: it lists what to ignore, not what to build', () => {
    const base = commit({ 'src/app/page.tsx': 'a' });
    commit({ 'newfolder/thing.ts': 'x' });

    expect(run(base)).toBe(1);
  });

  test('builds for markdown inside the app, which the bundle could import', () => {
    const base = commit({ 'src/app/page.tsx': 'a' });
    commit({ 'src/app/notes.md': 'x' });

    expect(run(base)).toBe(1);
  });

  test('builds when there is no previous deployment, or it is not in the clone', () => {
    commit({ 'src/app/page.tsx': 'a' });

    expect(run()).toBe(1);
    expect(run('deadbeefdeadbeefdeadbeefdeadbeefdeadbeef')).toBe(1);
  });
});
