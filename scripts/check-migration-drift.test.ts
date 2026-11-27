import { describe, expect, test } from 'bun:test';
import { analyseLedger, parseLedger } from './check-migration-drift.ts';

const output = [
  'Connecting to remote database...',
  JSON.stringify({ migrations: [{ local: '1', remote: '1' }, { local: '2', remote: '' }, { local: '', remote: '3' }] }),
].join('\n');

describe('parseLedger', () => {
  test('reads the JSON line among the CLI messages', () => {
    expect(parseLedger(output)).toHaveLength(3);
  });

  test('reads a project with no migrations', () => {
    expect(parseLedger('{"migrations":[]}')).toEqual([]);
  });

  test('refuses output it cannot read instead of calling it clean', () => {
    expect(() => parseLedger('Connecting...')).toThrow('no migration list');
    expect(() => parseLedger('{"migrations":null}')).toThrow('no migration list');
  });
});

describe('analyseLedger', () => {
  test('reports files never applied and changes applied out of the repo', () => {
    expect(analyseLedger(parseLedger(output))).toEqual({ localOnly: ['2'], remoteOnly: ['3'], synced: 1, clean: false });
  });

  test('is clean when both sides match', () => {
    expect(analyseLedger([{ local: '1', remote: '1' }]).clean).toBe(true);
  });
});
