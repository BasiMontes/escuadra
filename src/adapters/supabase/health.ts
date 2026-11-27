import type { SupabaseEnv } from '@/platform/env';

// The Auth service is probed because it needs no table of your own. It does not prove the database answers.
export async function supabaseAnswers({ env, fetchImpl, timeoutMs }: { env: SupabaseEnv, fetchImpl: typeof fetch, timeoutMs: number }): Promise<boolean> {
  try {
    const response = await fetchImpl(new URL('/auth/v1/health', env.url), {
      headers: { apikey: env.publishableKey },
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
    return response.ok;
  }
  catch {
    return false;
  }
}
