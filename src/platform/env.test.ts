import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { getAnalyticsEnv, getSupabaseEnv, getTurnstileSiteKey, requireSupabaseEnv } from './env';

const url = 'https://ref.supabase.co';
const publishableKey = 'sb_publishable_test';

describe('getSupabaseEnv', () => {
  test('is off when neither variable is set, blank values included', () => {
    expect(getSupabaseEnv({ url: undefined, publishableKey: undefined })).toBeUndefined();
    expect(getSupabaseEnv({ url: '', publishableKey: '  ' })).toBeUndefined();
  });

  test('returns both values when both are set', () => {
    expect(getSupabaseEnv({ url, publishableKey })).toEqual({ url, publishableKey });
  });

  test('names the missing variable when only one is set', () => {
    expect(() => getSupabaseEnv({ url, publishableKey: undefined })).toThrow('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  });

  test('names the variable that is not a URL', () => {
    expect(() => getSupabaseEnv({ url: 'ref', publishableKey })).toThrow('NEXT_PUBLIC_SUPABASE_URL');
  });
});

describe('requireSupabaseEnv', () => {
  test('names both variables when Supabase is not configured', () => {
    expect(() => requireSupabaseEnv({ url: undefined, publishableKey: undefined }))
      .toThrow(/NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });
});

describe('getTurnstileSiteKey', () => {
  test('is off when the key is missing or blank', () => {
    expect(getTurnstileSiteKey('')).toBeUndefined();
    expect(getTurnstileSiteKey('  ')).toBeUndefined();
    expect(getTurnstileSiteKey(' site-key ')).toBe('site-key');
  });
});

describe('zod', () => {
  test('is configured to run without eval, which the browser policy forbids', () => {
    expect(z.config().jitless).toBe(true);
  });
});

describe('getAnalyticsEnv', () => {
  test('is off without a key and defaults to the European host', () => {
    expect(getAnalyticsEnv({ key: ' ', host: 'https://us.i.posthog.com' })).toBeUndefined();
    expect(getAnalyticsEnv({ key: 'phc_test' })).toEqual({ key: 'phc_test', host: 'https://eu.i.posthog.com' });
  });
});
