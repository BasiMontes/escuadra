import type { CookieMethodsServer } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import type { SupabaseEnv } from '../env';
import { createServerClient } from '@supabase/ssr';

export type SessionClientFactory = (
  url: string,
  publishableKey: string,
  options: { cookies: CookieMethodsServer },
) => { auth: { getClaims: () => Promise<unknown> } };

export interface RefreshSessionInput {
  request: NextRequest
  forward: () => NextResponse
  env: SupabaseEnv | undefined
  createClient?: SessionClientFactory
}

export async function refreshSession({ request, forward, env, createClient = createServerClient }: RefreshSessionInput): Promise<NextResponse> {
  let response = forward();
  if (!env) { return response; }

  const supabase = createClient(env.url, env.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Forwarded again after the line above, so the renderer reads the rotated token and not the spent one.
        response = forward();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // Reading the claims is what refreshes an expiring session. Access control belongs to the protected pages.
  await supabase.auth.getClaims();

  return response;
}
