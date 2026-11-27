import type { Database } from '@/types/supabase';
import { createBrowserClient } from '@supabase/ssr';
import { requireSupabaseEnv } from '../env';

export function createClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
