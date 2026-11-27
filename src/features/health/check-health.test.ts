import { describe, expect, test } from 'bun:test';
import { healthResponse } from './check-health';

const env = { url: 'https://ref.supabase.co', publishableKey: 'sb_publishable_test' };

function answering(status: number) {
  const asked: string[] = [];
  const fetchImpl = (async (input: URL) => {
    asked.push(input.href);
    return new Response('internal detail', { status });
  }) as unknown as typeof fetch;
  return { asked, fetchImpl };
}

describe('healthResponse', () => {
  test('answers 200 when Supabase answers', async () => {
    const supabase = answering(200);

    const response = await healthResponse({ env, fetchImpl: supabase.fetchImpl });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok', checks: { supabase: 'ok' } });
    expect(supabase.asked).toEqual(['https://ref.supabase.co/auth/v1/health']);
  });

  test.each([401, 500, 503])('answers 503 without any detail when Supabase answers %p', async (status) => {
    const response = await healthResponse({ env, fetchImpl: answering(status).fetchImpl });

    expect(response.status).toBe(503);
    expect(await response.text()).toBe('{"status":"down","checks":{"supabase":"down"}}');
  });

  test('answers 503 when the request fails or Supabase is not configured', async () => {
    const failing = (async () => {
      throw new Error('network down at 10.0.0.1');
    }) as unknown as typeof fetch;

    expect((await healthResponse({ env, fetchImpl: failing })).status).toBe(503);
    expect((await healthResponse({ env: undefined, fetchImpl: answering(200).fetchImpl })).status).toBe(503);
  });

  test('gives up on a Supabase that never answers', async () => {
    const hanging = (async (_input: URL, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    })) as unknown as typeof fetch;

    expect((await healthResponse({ env, fetchImpl: hanging, timeoutMs: 10 })).status).toBe(503);
  });
});
