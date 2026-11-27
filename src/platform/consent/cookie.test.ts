import { afterEach, describe, expect, test } from 'bun:test';
import { consentCookieName, parseConsent, serializeConsent, writeConsent } from './cookie';

afterEach(() => {
  document.cookie = `${consentCookieName}=; path=/; max-age=0`;
});

describe('parseConsent', () => {
  test('reads a choice made under the current texts', () => {
    expect(parseConsent(serializeConsent('accepted'))).toBe('accepted');
    expect(parseConsent(serializeConsent('rejected'))).toBe('rejected');
  });

  test('treats a choice made under older texts as no choice', () => {
    expect(parseConsent('accepted~0~1700000000')).toBeNull();
  });

  test.each([undefined, '', 'accepted', 'maybe~1~1700000000', 'accepted~1~soon', 'accepted~1~1~extra'])('ignores %p', (value) => {
    expect(parseConsent(value)).toBeNull();
  });

  test('records the version and the moment of the choice', () => {
    expect(serializeConsent('accepted', 1_700_000_000_500)).toBe('accepted~1~1700000000');
  });
});

describe('writeConsent', () => {
  test('stores the choice in a cookie the server can read', () => {
    writeConsent('rejected');

    const stored = document.cookie.split('; ').find(entry => entry.startsWith(`${consentCookieName}=`));
    expect(parseConsent(stored?.split('=')[1])).toBe('rejected');
  });
});
