import type { SessionClientFactory } from './proxy';
import { describe, expect, test } from 'bun:test';
import { NextRequest, NextResponse } from 'next/server';
import { refreshSession } from './proxy';

const env = { url: 'https://ref.supabase.co', publishableKey: 'sb_publishable_test' };

const rotatingClient: SessionClientFactory = (_url, _key, { cookies }) => ({
  auth: {
    getClaims: async () => {
      await cookies.setAll?.([{ name: 'sb-token', value: 'new', options: { path: '/' } }], { 'Cache-Control': 'private, no-store' });
    },
  },
});

function requestWithOldToken() {
  return new NextRequest('https://app.test/', { headers: { cookie: 'sb-token=old' } });
}

function forwardFrom(request: NextRequest) {
  return () => NextResponse.next({ request: { headers: new Headers(request.headers) } });
}

describe('refreshSession', () => {
  test('hands the rotated cookie to the renderer and to the browser', async () => {
    const request = requestWithOldToken();

    const response = await refreshSession({ request, forward: forwardFrom(request), env, createClient: rotatingClient });

    expect(response.headers.get('x-middleware-request-cookie')).toBe('sb-token=new');
    expect(response.cookies.get('sb-token')?.value).toBe('new');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  test('passes the request through untouched when Supabase is off', async () => {
    const request = requestWithOldToken();

    const response = await refreshSession({ request, forward: forwardFrom(request), env: undefined, createClient: rotatingClient });

    expect(response.headers.get('x-middleware-request-cookie')).toBe('sb-token=old');
    expect(response.cookies.getAll()).toEqual([]);
  });
});
