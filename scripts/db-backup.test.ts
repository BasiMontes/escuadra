import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { compareCounts, parseCounts, PG_IMAGE, readinessProbeArgs } from './db-backup.ts';

describe('parseCounts', () => {
  test('reads one table per line', () => {
    expect(parseCounts('public.items,3\nauth.users,2\n\n')).toEqual({ 'public.items': 3, 'auth.users': 2 });
  });

  test('refuses a line it cannot read', () => {
    expect(() => parseCounts('public.items,many')).toThrow('Unparseable');
  });
});

describe('compareCounts', () => {
  const before = { 'public.items': 3 };
  const after = { 'public.items': 5 };

  test('accepts a count between the one before and the one after the dump', () => {
    expect(compareCounts({ before, after, restored: { 'public.items': 4 } })).toEqual([]);
  });

  test('reports a missing table and a count outside the range', () => {
    expect(compareCounts({ before, after, restored: {} })).toEqual([{ table: 'public.items', restored: null, min: 3, max: 5 }]);
    expect(compareCounts({ before, after, restored: { 'public.items': 2 } })).toHaveLength(1);
  });
});

describe('the scratch database', () => {
  test('runs the Postgres major version of the project', () => {
    const config = readFileSync(join(import.meta.dir, '../supabase/config.toml'), 'utf8');
    const major = config.match(/^major_version = (\d+)/m)?.[1];

    expect(major).toBeDefined();
    expect(PG_IMAGE).toStartWith(`postgres:${major}`);
  });

  test('is probed over TCP, which only the final server listens on', () => {
    expect(readinessProbeArgs('x')).toContain('127.0.0.1');
  });
});
