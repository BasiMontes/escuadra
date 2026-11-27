import { describe, expect, test } from 'bun:test';
import { buildContentSecurityPolicy } from './csp';

function directive(policy: string, name: string): string {
  return policy.split('; ').find(entry => entry === name || entry.startsWith(`${name} `)) ?? '';
}

describe('buildContentSecurityPolicy', () => {
  const production = buildContentSecurityPolicy({ nonce: 'abc123', isDev: false, supabaseUrl: 'https://ref.supabase.co/rest/v1' });

  test('only runs scripts that carry the nonce, without unsafe-inline or unsafe-eval', () => {
    expect(directive(production, 'script-src')).toBe('script-src \'self\' \'nonce-abc123\' \'strict-dynamic\'');
  });

  test('adds unsafe-eval and drops the HTTPS upgrade in development', () => {
    const development = buildContentSecurityPolicy({ nonce: 'n', isDev: true });

    expect(directive(development, 'script-src')).toContain('\'unsafe-eval\'');
    expect(development).not.toContain('upgrade-insecure-requests');
    expect(production).toContain('upgrade-insecure-requests');
  });

  // WebKit upgrades `http://localhost` too, which leaves a locally served build without its scripts.
  test('drops the HTTPS upgrade when the page is served over plain HTTP', () => {
    const plain = buildContentSecurityPolicy({ nonce: 'n', isDev: false, isHttps: false });

    expect(plain).not.toContain('upgrade-insecure-requests');
  });

  test('lets the browser reach the configured Supabase project over HTTPS and WebSocket', () => {
    expect(directive(production, 'connect-src')).toBe('connect-src \'self\' https://ref.supabase.co wss://ref.supabase.co');
  });

  test('maps a local HTTP project to a plain WebSocket', () => {
    const local = buildContentSecurityPolicy({ nonce: 'n', isDev: true, supabaseUrl: 'http://127.0.0.1:54321' });

    expect(directive(local, 'connect-src')).toBe('connect-src \'self\' http://127.0.0.1:54321 ws://127.0.0.1:54321');
  });

  test('keeps connect-src to the app when Supabase is off or its URL is junk', () => {
    for (const supabaseUrl of [undefined, 'junk']) {
      expect(directive(buildContentSecurityPolicy({ nonce: 'n', isDev: false, supabaseUrl }), 'connect-src')).toBe('connect-src \'self\'');
    }
  });

  test('lets Turnstile frame and call back only when it is configured, never as a script host', () => {
    const withCaptcha = buildContentSecurityPolicy({ nonce: 'n', isDev: false, turnstile: true });

    expect(directive(withCaptcha, 'frame-src')).toBe('frame-src \'self\' https://challenges.cloudflare.com');
    expect(directive(withCaptcha, 'connect-src')).toContain('https://challenges.cloudflare.com');
    expect(directive(withCaptcha, 'script-src')).not.toContain('cloudflare');
    expect(production).not.toContain('cloudflare');
  });

  test('lets errors reach the Sentry project, without its key in the policy', () => {
    const policy = buildContentSecurityPolicy({ nonce: 'n', isDev: false, sentryDsn: 'https://publickey@o1.ingest.de.sentry.io/2' });

    expect(directive(policy, 'connect-src')).toBe('connect-src \'self\' https://o1.ingest.de.sentry.io');
    expect(policy).not.toContain('publickey');
    expect(policy).not.toContain('report-uri');
  });

  test('lets the app register its own service worker, and no other', () => {
    expect(directive(production, 'worker-src')).toBe('worker-src \'self\'');
  });

  test('locks down framing, plugins and the base URL', () => {
    expect(production).toContain('frame-ancestors \'none\'');
    expect(production).toContain('object-src \'none\'');
    expect(production).toContain('base-uri \'self\'');
  });
});
