/**
 * @fileoverview A fresh worktree must pass the pre-push `vars:env:check`.
 *
 * Project-owned (the synced `cli/lib/env-schema.test.ts` is ignored by bunfig.toml and
 * overwritten by the updater). A fresh worktree has no schema until `bun run vars:schema`
 * generates `.env.core.schema` and seeds `.env.schema` from the template; rule 4b of
 * `vars:env:check` then fails every `.env.example` key that pair does not declare. Fixture
 * names and fake values only: no real env file is read and no value is ever printed.
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, test } from 'bun:test';

import {
  checkSchemaSensitivity,
  generateCoreSchema,
  schemaClassification,
  seedProjectSchema,
  writeCoreSchema,
} from '../cli/lib/env-schema.ts';
import { DEPRECATED_VARS, parseDotEnvExampleKeys, VAR_MANIFEST } from '../cli/lib/variables-manifest.ts';

const REPO_ROOT = path.resolve(import.meta.dir, '..');

function withScratch<T>(fn: (dir: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'worktree-env-schema-'));
  try {
    return fn(dir);
  }
  finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// These tests build the pair exactly the way a fresh worktree does.
describe('a schema pair generated from the template (fresh worktree)', () => {
  const USERS = ['QA_E2E_USER_EMAIL', 'QA_E2E_USER_PASSWORD'];

  test('declares every .env.example key, so vars:env:check rule 4b cannot fail on it', () => {
    withScratch((dir) => {
      writeCoreSchema(dir);
      seedProjectSchema(dir);
      const declared = schemaClassification(dir)?.declared ?? new Set<string>();
      const deprecated = new Set(DEPRECATED_VARS.map(d => d.name));
      const undeclared = parseDotEnvExampleKeys(path.join(REPO_ROOT, '.env.example')).filter(k => !declared.has(k) && !deprecated.has(k));
      expect(undeclared).toEqual([]);
    });
  });

  test('declares the automation identity as optional, with the password (and only it) @sensitive', () => {
    const text = generateCoreSchema();
    for (const name of USERS) {
      expect(text).toContain(`\n${name}=`);
      expect(VAR_MANIFEST.find(s => s.name === name)?.secret).toBe(name.endsWith('_PASSWORD'));
    }
    withScratch((dir) => {
      writeCoreSchema(dir);
      const sensitive = schemaClassification(dir)?.sensitive ?? new Set<string>();
      for (const name of USERS) { expect(sensitive.has(name)).toBe(name.endsWith('_PASSWORD')); }
      expect(checkSchemaSensitivity(dir).ok).toBe(true);
    });
  });

  // The child gets ONLY PATH, HOME and NODE_ENV (the type requires it): nothing a developer exported (or CI injects) can
  // override the fixture `.env` it is meant to read. `--path <dir>` makes varlock read
  // `<dir>/.env` and the schema pair beside it, whatever the cwd.
  function loadFixture(fixture: string): { status: number | null, output: string } {
    return withScratch((dir) => {
      writeCoreSchema(dir);
      seedProjectSchema(dir);
      fs.writeFileSync(path.join(dir, '.env'), `${fixture}\n`);
      const run = spawnSync('bunx', ['varlock', 'load', '--agent', '--path', `${dir}${path.sep}`], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'test' },
      });
      return { status: run.status, output: `${run.stdout}${run.stderr}` };
    });
  }

  const FAKE = 'fixture-fake-value';
  const definesAll = USERS.map(n => `${n}=${n.endsWith('_EMAIL') ? 'fixture@example.test' : FAKE}`).join('\n');

  test('loads through varlock with a fixture .env that omits them and with one that defines them', () => {
    expect(loadFixture('').status).toBe(0);
    expect(loadFixture(definesAll).status).toBe(0);
  });

  test('the fixture .env is really read and the keys are really declared: a malformed email fails the load, and a fake password is never echoed', () => {
    // email-typed in the schema: only a DECLARED key can fail on a malformed value, so this
    // fails (the load stops failing) if the keys leave the manifest.
    const bad = loadFixture('QA_E2E_USER_EMAIL=not-an-email');
    expect(bad.status).not.toBe(0);
    for (const fixture of [definesAll, `QA_E2E_USER_PASSWORD=${FAKE}`]) {
      const leaked = loadFixture(fixture).output.includes(FAKE);
      expect(leaked).toBe(false);
    }
  });
});
