import { describe, expect, test } from 'bun:test';
import { postLoginPath, safeNextPath } from './safe-next-path';

describe('safeNextPath', () => {
  test('keeps a path of this app, query included', () => {
    expect(safeNextPath('/account?tab=security')).toBe('/account?tab=security');
    expect(safeNextPath('/')).toBe('/');
  });

  test.each([
    ['nothing', undefined],
    ['an empty value', ''],
    ['an external URL', 'https://evil.test'],
    ['a protocol-relative URL', '//evil.test'],
    ['a backslash', '/\\evil.test'],
    ['a script URL', 'javascript:alert(1)'],
    ['a tab before the second slash', '/\t/evil.test'],
    ['an encoded double slash', '%2F%2Fevil.test'],
  ])('falls back to / for %s', (_label, raw) => {
    expect(safeNextPath(raw)).toBe('/');
  });

  test('never returns a protocol-relative path after resolving dot segments', () => {
    expect(safeNextPath('/..//evil.test')).toBe('/');
  });
});

describe('postLoginPath', () => {
  test('goes back to the page that asked for the sign-in', () => {
    expect(postLoginPath('/account?tab=security')).toBe('/account?tab=security');
  });

  test('goes to the account page when there is nowhere better', () => {
    expect(postLoginPath(undefined)).toBe('/account');
    expect(postLoginPath('/login?next=/x')).toBe('/account');
    expect(postLoginPath('//evil.test')).toBe('/account');
  });
});
