import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { availableModules } from './module-add.ts';

const root = join(import.meta.dir, '..');
const modules = availableModules(root);

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe('the modules shipped with the template', () => {
  test.each(modules)('%s explains itself', (name) => {
    const manifest = JSON.parse(readFileSync(join(root, 'modules', name, 'module.json'), 'utf8'));

    expect(manifest.summary).toBeTruthy();
    expect(manifest.nextSteps).toContain(`Read docs/modules/${name}.md`);
    // Once installed the page is in `docs/`; until then it travels with the module.
    expect([join(root, 'modules', name, 'files'), root].some(base => existsSync(join(base, 'docs/modules', `${name}.md`)))).toBe(true);
  });

  // Installing two modules fails if they bring different content for one path.
  test('agree on every file they share', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const name of modules) {
      const folder = join(root, 'modules', name, 'files');
      for (const file of filesUnder(folder)) {
        const path = relative(folder, file);
        const content = readFileSync(file, 'utf8');
        if (seen.has(path) && seen.get(path) !== content) { clashes.push(path); }
        seen.set(path, content);
      }
    }

    expect(clashes).toEqual([]);
  });
});
