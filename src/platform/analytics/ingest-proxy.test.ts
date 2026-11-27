import { describe, expect, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { ingestRewrite } from './ingest-proxy';

const env = { key: 'phc_test', host: 'https://eu.i.posthog.com' };

function rewrite(path: string) {
  const request = new NextRequest(`https://app.test${path}`, {
    headers: { 'cookie': 'sb-ref-auth-token=secret', 'authorization': 'Bearer secret', 'content-type': 'text/plain' },
  });
  return ingestRewrite({ request, env });
}

describe('ingestRewrite', () => {
  test('forwards events to PostHog without the session', () => {
    const response = rewrite('/ingest/e/?compression=gzip-js');
    const forwarded = response?.headers.get('x-middleware-override-headers') ?? '';

    expect(response?.headers.get('x-middleware-rewrite')).toBe('https://eu.i.posthog.com/e/?compression=gzip-js');
    expect(forwarded.split(',')).toContain('content-type');
    expect(forwarded).not.toContain('cookie');
    expect(forwarded).not.toContain('authorization');
    expect(response?.headers.get('x-middleware-request-host')).toBe('eu.i.posthog.com');
  });

  test.each(['/ingest/static/recorder.js', '/ingest/array/phc_test/config.js'])('serves %s from the assets host', (path) => {
    expect(rewrite(path)?.headers.get('x-middleware-rewrite')).toBe(`https://eu-assets.i.posthog.com${path.replace('/ingest', '')}`);
  });

  test('cannot be pointed at another host through the path', () => {
    expect(rewrite('/ingest//evil.test/e')?.headers.get('x-middleware-rewrite')).toStartWith('https://eu.i.posthog.com/');
  });

  test('ignores other paths, and everything when analytics is off', () => {
    expect(rewrite('/ingestion')).toBeUndefined();
    expect(rewrite('/account')).toBeUndefined();
    expect(ingestRewrite({ request: new NextRequest('https://app.test/ingest/e'), env: undefined })).toBeUndefined();
  });
});
