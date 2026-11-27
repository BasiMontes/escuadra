import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'bun:test';
import { nameProject } from './project-name.ts';

const created: string[] = [];

afterEach(() => {
  created.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true }));
});

const real = (file: string) => readFileSync(join(import.meta.dir, '..', file), 'utf8');

// Copies of the real files, so a change in their shape fails here.
function repo(overrides: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'project-name-'));
  created.push(root);
  for (const file of ['package.json', '.agents/project.yaml', 'supabase/config.toml']) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), overrides[file] ?? real(file));
  }
  return root;
}

const read = (root: string, file: string) => readFileSync(join(root, file), 'utf8');

describe('nameProject', () => {
  test('names the package, the project and the local database', () => {
    const root = repo();

    nameProject({ root, name: 'my-app' });

    expect(JSON.parse(read(root, 'package.json')).name).toBe('my-app');
    expect(read(root, '.agents/project.yaml')).toContain('\n  project_name: my-app');
    expect(read(root, 'supabase/config.toml')).toContain('project_id = "my-app"');
  });

  test('changes those three lines only', () => {
    const root = repo();

    nameProject({ root, name: 'my-app' });

    for (const file of ['package.json', '.agents/project.yaml', 'supabase/config.toml']) {
      const before = real(file).split('\n');
      expect(read(root, file).split('\n').filter((line, index) => line !== before[index])).toHaveLength(1);
    }
  });

  test.each(['', 'ab', 'My-App', 'app_1', '1app', 'app-', 'a b', 'x'.repeat(41)])('refuses %p', (name) => {
    expect(() => nameProject({ root: repo(), name })).toThrow('not a valid name');
  });

  test('writes nothing when one file is not as expected', () => {
    const root = repo({ 'supabase/config.toml': '# empty\n' });

    expect(() => nameProject({ root, name: 'my-app' })).toThrow('supabase/config.toml');
    expect(read(root, 'package.json')).toBe(real('package.json'));
  });
});
