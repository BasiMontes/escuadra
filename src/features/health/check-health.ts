import type { SupabaseEnv } from '@/platform/env';
import { supabaseAnswers } from '@/adapters/supabase/health';
import { getSupabaseEnv } from '@/platform/env';

// Public on purpose, for an uptime monitor: it says ok or down, never why.
export async function healthResponse({ env, fetchImpl = fetch, timeoutMs = 3000 }: { env: SupabaseEnv | undefined, fetchImpl?: typeof fetch, timeoutMs?: number }): Promise<Response> {
  const isUp = env !== undefined && await supabaseAnswers({ env, fetchImpl, timeoutMs });
  const status = isUp ? 'ok' : 'down';
  if (!isUp) { console.error('Health check: Supabase did not answer'); }

  return Response.json({ status, checks: { supabase: status } }, { status: isUp ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}

export async function handleHealthCheck() {
  return healthResponse({ env: getSupabaseEnv() });
}
