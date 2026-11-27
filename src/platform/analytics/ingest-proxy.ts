import type { NextRequest } from 'next/server';
import type { AnalyticsEnv } from '../env';
import { NextResponse } from 'next/server';

const prefix = '/ingest/';

export function ingestRewrite({ request, env }: { request: NextRequest, env: AnalyticsEnv | undefined }): NextResponse | undefined {
  const { pathname, search } = request.nextUrl;
  if (!env || !pathname.startsWith(prefix)) { return undefined; }

  const path = pathname.slice(prefix.length - 1).replace(/^\/+/, '/');
  const isAsset = path.startsWith('/static/') || path.startsWith('/array/');
  const host = isAsset ? env.host.replace('.i.posthog.com', '-assets.i.posthog.com') : env.host;
  const target = new URL(host);
  target.pathname = path;
  target.search = search;

  // A rewrite forwards every request header to the other server, the session cookie included.
  const headers = new Headers(request.headers);
  headers.delete('cookie');
  headers.delete('authorization');
  headers.set('host', target.host);

  return NextResponse.rewrite(target, { request: { headers } });
}
