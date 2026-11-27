import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';

const root = join(import.meta.dir, '..');
const folder = join(root, '.github/workflows');
const workflows = readdirSync(folder).map(name => ({ name, text: readFileSync(join(folder, name), 'utf8') }));
// Workflows that touch a deployed project: each one stays off until its repository variable turns it on.
const operations = ['db-backup.yml', 'db-restore-drill.yml', 'hosted-auth-settings.yml', 'login-widget-check.yml', 'migration-drift.yml', 'uptime-monitor.yml'];

describe('workflows', () => {
  test('pin every third-party action to a commit', () => {
    const loose = workflows.flatMap(({ name, text }) => [...text.matchAll(/uses:\s*([^\s#]+)/g)]
      .map(match => match[1])
      .filter(action => !action.startsWith('./') && !/@[0-9a-f]{40}$/.test(action))
      .map(action => `${name}: ${action}`));

    expect(loose).toEqual([]);
  });

  test('give the pull request check no secret', () => {
    expect(workflows.find(workflow => workflow.name === 'pr-check.yml')?.text).not.toContain('secrets.');
  });

  test.each(operations)('keep %s off until its repository variable is set', (name) => {
    const text = workflows.find(workflow => workflow.name === name)?.text ?? '';
    const jobs = text.slice(text.indexOf('\njobs:'));

    expect(jobs).toMatch(/\n {4}if: vars\.[A-Z_]+ == 'true' \|\| github\.event_name == 'workflow_dispatch'\n/);
  });

  test('document every secret and repository variable an operation reads', () => {
    const guide = readFileSync(join(root, 'docs/workflows/operations.md'), 'utf8');
    const names = new Set(workflows.filter(workflow => operations.includes(workflow.name))
      .flatMap(({ text }) => [...text.matchAll(/(?:secrets|vars)\.([A-Z0-9_]+)/g)].map(match => match[1])));

    expect([...names].filter(name => !guide.includes(`\`${name}\``))).toEqual([]);
  });
});
