import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'bun:test';
import { applyModule, planModule, runSteps } from './module-add.ts';

const created: string[] = [];

afterEach(() => {
  created.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true }));
});

function write(root: string, path: string, content: string) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function repo(files: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'module-'));
  created.push(root);
  write(root, 'package.json', JSON.stringify({ name: 'app', dependencies: { next: '1.0.0' }, devDependencies: {} }));
  write(root, 'modules/demo/module.json', JSON.stringify({ summary: 'Demo', dependencies: { zeta: '^1.0.0', alpha: '^2.0.0' }, devDependencies: { '@types/zeta': '^1.0.0' }, nextSteps: ['Set DEMO_KEY'] }));
  write(root, 'modules/demo/files/src/features/demo/index.ts', 'export const demo = 1;\n');
  write(root, 'modules/demo/files/src/platform/shared.ts', 'export const shared = 1;\n');
  write(root, 'modules/demo/files/supabase/migrations/NOW_demo.sql', 'select 1;\n');
  Object.entries(files).forEach(([path, content]) => write(root, path, content));
  return root;
}

const now = new Date('2026-01-02T03:04:05Z');
const pkg = (root: string) => JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

describe('adding a module', () => {
  test('copies its files, dates its migration and declares its dependencies', () => {
    const root = repo();

    const plan = planModule({ root, name: 'demo', now });
    applyModule({ root, plan });

    expect(readFileSync(join(root, 'src/features/demo/index.ts'), 'utf8')).toBe('export const demo = 1;\n');
    expect(readdirSync(join(root, 'supabase/migrations'))).toEqual(['20260102030405_demo.sql']);
    expect(Object.keys(pkg(root).dependencies)).toEqual(['alpha', 'next', 'zeta']);
    expect(pkg(root).devDependencies).toEqual({ '@types/zeta': '^1.0.0' });
    expect(pkg(root).agenticModules).toEqual(['demo']);
    expect(plan.nextSteps).toEqual(['Set DEMO_KEY']);
  });

  test('never reuses the timestamp of an existing migration', () => {
    const root = repo({ 'supabase/migrations/20260102030405_other.sql': 'select 2;\n' });

    applyModule({ root, plan: planModule({ root, name: 'demo', now }) });

    expect(readdirSync(join(root, 'supabase/migrations')).sort()).toEqual(['20260102030405_other.sql', '20260102030406_demo.sql']);
  });

  test('keeps a file another module already brought, when it is identical', () => {
    const root = repo({ 'src/platform/shared.ts': 'export const shared = 1;\n' });

    const plan = planModule({ root, name: 'demo', now });

    expect(plan.copies.map(copy => copy.to)).not.toContain('src/platform/shared.ts');
  });

  test('refuses to overwrite a different file, and writes nothing', () => {
    const root = repo({ 'src/platform/shared.ts': 'export const shared = 2;\n' });

    expect(() => planModule({ root, name: 'demo', now })).toThrow('src/platform/shared.ts');
    expect(existsSync(join(root, 'src/features'))).toBe(false);
  });

  test('refuses a module that is already installed', () => {
    const root = repo();
    applyModule({ root, plan: planModule({ root, name: 'demo', now }) });

    expect(() => planModule({ root, name: 'demo', now })).toThrow('already installed');
  });

  test('names the modules that exist when asked for one that does not', () => {
    expect(() => planModule({ root: repo(), name: 'nope', now })).toThrow('Available: demo');
    expect(() => planModule({ root: repo(), name: '../demo', now })).toThrow('Available: demo');
  });
});

describe('the steps after copying', () => {
  test('stop at the first failure and list what is left to run', () => {
    const ran: string[] = [];
    const run = (command: string[]) => {
      ran.push(command.join(' '));
      return command[0] !== 'second';
    };

    expect(() => runSteps({ steps: [['first'], ['second', 'step'], ['third']], run })).toThrow('then run:\n  second step\n  third');
    expect(ran).toEqual(['first', 'second step']);
  });
});
