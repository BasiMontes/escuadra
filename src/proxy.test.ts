import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { config, proxy } from './proxy';

const variables = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] as const;
const inherited = variables.map(name => process.env[name]);

beforeEach(() => {
  variables.forEach(name => delete process.env[name]);
});

afterEach(() => {
  variables.forEach((name, index) => {
    const value = inherited[index];
    if (value !== undefined) { process.env[name] = value; }
  });
});

function nonceOf(policy: string | null): string | undefined {
  return policy?.match(/'nonce-([^']+)'/)?.[1];
}

describe('proxy', () => {
  test('sends the same policy to the browser and to the renderer', async () => {
    const response = await proxy(new NextRequest('https://app.test/'));
    const policy = response.headers.get('Content-Security-Policy');

    expect(nonceOf(policy)).toBeDefined();
    expect(response.headers.get('x-middleware-request-content-security-policy')).toBe(policy);
    expect(response.headers.get('x-middleware-request-x-nonce')).toBe(nonceOf(policy) ?? 'missing');
  });

  test('uses a new nonce on every request', async () => {
    const first = await proxy(new NextRequest('https://app.test/'));
    const second = await proxy(new NextRequest('https://app.test/'));

    expect(nonceOf(first.headers.get('Content-Security-Policy')))
      .not
      .toBe(nonceOf(second.headers.get('Content-Security-Policy')));
  });

  test('asks for the HTTPS upgrade only on requests that arrived over HTTPS', async () => {
    const overHttps = await proxy(new NextRequest('https://app.test/'));
    const overHttp = await proxy(new NextRequest('http://localhost:4173/'));

    expect(overHttps.headers.get('Content-Security-Policy')).toContain('upgrade-insecure-requests');
    expect(overHttp.headers.get('Content-Security-Policy')).not.toContain('upgrade-insecure-requests');
  });

  test('skips static assets', () => {
    expect(config.matcher[0]).toContain('_next/static');
  });
});
