import { describe, expect, test } from 'bun:test';
import { e2eEnvironment } from './e2e.ts';

const status = [
  'API_URL="http://127.0.0.1:54321"',
  'PUBLISHABLE_KEY="sb_publishable_local"',
  'SECRET_KEY="sb_secret_local"',
  'MAILPIT_URL="http://127.0.0.1:54324"',
].join('\n');

const inherited = {
  PATH: '/bin',
  NEXT_PUBLIC_SUPABASE_URL: 'https://hosted.supabase.co',
  NEXT_PUBLIC_SENTRY_DSN: 'https://key@sentry.test/1',
  NEXT_PUBLIC_POSTHOG_KEY: 'phc_real',
};

describe('e2eEnvironment', () => {
  test('replaces whatever is inherited with the local stack', () => {
    expect(e2eEnvironment({ status, inherited })).toMatchObject({
      PATH: '/bin',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local',
      E2E_MAILBOX_URL: 'http://127.0.0.1:54324',
    });
  });

  test('switches off every service that would reach the internet', () => {
    expect(e2eEnvironment({ status, inherited })).toMatchObject({
      NEXT_PUBLIC_SENTRY_DSN: '',
      NEXT_PUBLIC_POSTHOG_KEY: '',
      NEXT_PUBLIC_POSTHOG_HOST: '',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
    });
  });

  test('uses the local secret key, and never one for email, payments or push', () => {
    const real = { ...inherited, SUPABASE_SECRET_KEY: 'real', RESEND_API_KEY: 'real', GMAIL_SMTP_APP_PASSWORD: 'real', STRIPE_SECRET_KEY: 'real', STRIPE_WEBHOOK_SECRET: 'real', VAPID_PRIVATE_KEY: 'real', NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'real' };

    const env = e2eEnvironment({ status, inherited: real });

    expect(env.SUPABASE_SECRET_KEY).toBe('sb_secret_local');
    expect(Object.values(env)).not.toContain('real');
  });

  test('makes a push key pair of the right shape for each run', () => {
    const first = e2eEnvironment({ status, inherited });

    expect(Buffer.from(first.NEXT_PUBLIC_VAPID_PUBLIC_KEY, 'base64url')).toHaveLength(65);
    expect(Buffer.from(first.VAPID_PRIVATE_KEY, 'base64url')).toHaveLength(32);
    expect(e2eEnvironment({ status, inherited }).VAPID_PRIVATE_KEY).not.toBe(first.VAPID_PRIVATE_KEY);
  });

  test('accepts the older name of the mailbox', () => {
    const older = status.replace('MAILPIT_URL', 'INBUCKET_URL');

    expect(e2eEnvironment({ status: older, inherited }).E2E_MAILBOX_URL).toBe('http://127.0.0.1:54324');
  });

  test('refuses a stack that is not on this machine', () => {
    const hosted = status.replace('http://127.0.0.1:54321', 'https://ref.supabase.co');

    expect(() => e2eEnvironment({ status: hosted, inherited })).toThrow('not on this machine');
  });

  test('refuses a host that only looks local', () => {
    const trick = status.replace('http://127.0.0.1:54321', 'http://127.0.0.1.evil.test');

    expect(() => e2eEnvironment({ status: trick, inherited })).toThrow('not on this machine');
  });

  test('says how to start the stack when it is down', () => {
    expect(() => e2eEnvironment({ status: '', inherited })).toThrow('bun run db:start');
  });
});
