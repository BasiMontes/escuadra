import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'bun:test';
import { detectExistingApp } from '../cli/lib/bootstrap-guard.ts';

const created: string[] = [];

afterEach(() => {
  created.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true }));
});

function repo(pkg: object, { adopted = false } = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'guard-'));
  created.push(dir);
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
  if (adopted) {
    mkdirSync(join(dir, '.template'));
    writeFileSync(join(dir, '.template/installer.lock.json'), JSON.stringify({ adopted: true }));
  }
  return dir;
}

const app = { dependencies: { next: '16.0.0' } };

describe('detectExistingApp', () => {
  test('recognizes the app base that ships with this template', () => {
    expect(detectExistingApp(repo({ ...app, agenticAppBase: true })).verdict).toBe('template-base');
  });

  test('treats any other application as one to adopt', () => {
    expect(detectExistingApp(repo(app)).verdict).toBe('existing-app');
  });

  test('keeps an adopted app as adopted, whatever its package says', () => {
    expect(detectExistingApp(repo({ ...app, agenticAppBase: true }, { adopted: true })).verdict).toBe('existing-app');
  });

  test('answers greenfield without an application', () => {
    expect(detectExistingApp(repo({ name: 'tooling-only' })).verdict).toBe('greenfield');
  });

  test('does not trust a marker that is not exactly true', () => {
    expect(detectExistingApp(repo({ ...app, agenticAppBase: 'yes' })).verdict).toBe('existing-app');
  });
});
