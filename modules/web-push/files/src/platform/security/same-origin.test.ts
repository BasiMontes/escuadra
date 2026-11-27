import { describe, expect, test } from 'bun:test';
import { ownOrigin } from './same-origin';

function from(origin?: string) {
  const headers: Record<string, string> = { host: 'app.test' };
  if (origin) { headers.origin = origin; }
  return new Request('https://app.test/api', { method: 'POST', headers });
}

describe('ownOrigin', () => {
  test('returns the origin of a request made by this app', () => {
    expect(ownOrigin(from('https://app.test'))).toBe('https://app.test');
  });

  test.each([undefined, 'null', 'junk', 'https://evil.test', 'https://app.test.evil.test', 'https://app.test:8443'])('refuses %p', (origin) => {
    expect(ownOrigin(from(origin))).toBeNull();
  });
});
