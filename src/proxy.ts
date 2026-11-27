import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ingestRewrite } from '@/platform/analytics/ingest-proxy';
import { getAnalyticsEnv, getSentryDsn, getSupabaseEnv, getTurnstileSiteKey } from '@/platform/env';
import { buildContentSecurityPolicy } from '@/platform/security/csp';
import { refreshSession } from '@/platform/supabase/proxy';

export async function proxy(request: NextRequest) {
  const analytics = ingestRewrite({ request, env: getAnalyticsEnv() });
  if (analytics) { return analytics; }

  const env = getSupabaseEnv();
  const nonce = btoa(crypto.randomUUID());
  const policy = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    isHttps: request.nextUrl.protocol === 'https:',
    supabaseUrl: env?.url,
    turnstile: Boolean(getTurnstileSiteKey()),
    sentryDsn: getSentryDsn(),
  });

  const forward = () => {
    const headers = new Headers(request.headers);
    headers.set('x-nonce', nonce);
    headers.set('Content-Security-Policy', policy);
    return NextResponse.next({ request: { headers } });
  };

  const response = await refreshSession({ request, forward, env });
  response.headers.set('Content-Security-Policy', policy);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
