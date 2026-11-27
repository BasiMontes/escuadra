import type { Database } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseEnv } from '../env';

// Server only. This client skips Row Level Security: every query it runs must say whose rows it touches.
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) { throw new Error('SUPABASE_SECRET_KEY is required: copy .env.example to .env and fill it in'); }

  return createClient<Database>(requireSupabaseEnv().url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
