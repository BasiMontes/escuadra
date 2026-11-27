import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase. Solo se crea si están definidas las variables
 * NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.example).
 * Mientras no existan, la app usa los datos de ejemplo.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
