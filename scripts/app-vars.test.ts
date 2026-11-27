import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { VAR_MANIFEST } from '../cli/lib/variables-manifest.ts';

const root = join(import.meta.dir, '..');

// Set by the platform or by this repo itself: nobody types them into `.env`.
const providedElsewhere = new Set([
  'NODE_ENV',
  'CI',
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_GIT_COMMIT_SHA',
  'NEXT_PUBLIC_RELEASE',
  'NEXT_PUBLIC_VERCEL_ENV',
  'E2E_MAILBOX_URL',
]);

function sources(path: string): string[] {
  const full = join(root, path);
  if (!statSync(full).isDirectory()) { return /\.tsx?$/.test(path) ? [full] : []; }
  return readdirSync(full).flatMap(name => sources(join(path, name)));
}

function readNames(files: string[], pattern: RegExp): string[] {
  return [...new Set(files.flatMap(file => [...readFileSync(file, 'utf8').matchAll(pattern)].map(match => match[1])))].sort();
}

const appFiles = [...sources('src'), ...sources('next.config.ts')].filter(file => !/\.test\.tsx?$/.test(file));
const declared = new Map(VAR_MANIFEST.map(spec => [spec.name, spec]));

describe('app variables', () => {
  test('every variable the app reads is declared in the manifest', () => {
    const read = readNames(appFiles, /process\.env\.([A-Z0-9_]+)/g);
    // `env.server.ts` reads its names from an object, so they are collected from the quoted names.
    const server = readNames([join(root, 'src/platform/env.server.ts')], /'([A-Z]+(?:_[A-Z]+)+)'/g);

    expect(server).toContain('RESEND_API_KEY');
    expect([...read, ...server].filter(name => !declared.has(name) && !providedElsewhere.has(name))).toEqual([]);
  });

  test('nothing sent to the browser is declared as a secret', () => {
    expect(VAR_MANIFEST.filter(spec => spec.name.startsWith('NEXT_PUBLIC_') && spec.secret).map(spec => spec.name)).toEqual([]);
  });

  test('no service the app can run without is marked as required', () => {
    const optional = ['NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'NEXT_PUBLIC_SENTRY_DSN', 'NEXT_PUBLIC_POSTHOG_KEY', 'EMAIL_FROM', 'GMAIL_SMTP_APP_PASSWORD'];

    expect(optional.filter(name => declared.get(name)?.required !== false)).toEqual([]);
  });
});
