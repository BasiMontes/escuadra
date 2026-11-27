import { describe, expect, test } from 'bun:test';
import { scrubSecrets } from './scrub-secrets';

describe('scrubSecrets', () => {
  test('blanks the one-time values of an email link wherever they appear', () => {
    const event = {
      request: { url: 'https://app.test/auth/confirm?code=abc&next=/account', query_string: 'token_hash=h1&type=recovery' },
      breadcrumbs: [{ data: { to: '/update-password#access_token=t1&refresh_token=t2' } }],
    };

    expect(scrubSecrets(event)).toEqual({
      request: { url: 'https://app.test/auth/confirm?code=redacted&next=/account', query_string: 'token_hash=redacted&type=recovery' },
      breadcrumbs: [{ data: { to: '/update-password#access_token=redacted&refresh_token=redacted' } }],
    });
  });

  test('leaves other values alone, the original object included', () => {
    const event = { count: 3, ok: true, none: null, url: '/search?postcode=28001&code=x' };

    expect(scrubSecrets(event)).toEqual({ count: 3, ok: true, none: null, url: '/search?postcode=28001&code=redacted' });
    expect(event.url).toContain('code=x');
  });

  test('copes with an object that refers to itself', () => {
    const event: Record<string, unknown> = { url: '?token=x' };
    event.self = event;

    expect(scrubSecrets(event).url).toBe('?token=redacted');
  });
});
