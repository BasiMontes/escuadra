import { z } from 'zod';

// Zod otherwise probes `new Function` to speed up parsing, which the Content-Security-Policy blocks and reports.
z.config({ jitless: true });

export interface SupabaseEnv {
  url: string
  publishableKey: string
}

type SupabaseSource = Partial<Record<keyof SupabaseEnv, string>>;

const supabaseSchema = z.object({
  url: z.url('must be a URL such as https://<project-ref>.supabase.co'),
  publishableKey: z.string('is required').trim().min(1, 'is required'),
});

const variableNames: Record<keyof SupabaseEnv, string> = {
  url: 'NEXT_PUBLIC_SUPABASE_URL',
  publishableKey: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
};

// Next.js inlines NEXT_PUBLIC_* into the browser bundle only when each one is read literally.
function supabaseSource(): SupabaseSource {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function requireSupabaseEnv(source: SupabaseSource = supabaseSource()): SupabaseEnv {
  const result = supabaseSchema.safeParse(source);
  if (result.success) { return result.data; }
  const problems = result.error.issues
    .map(issue => `  - ${variableNames[issue.path[0] as keyof SupabaseEnv]} ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment (copy .env.example to .env and fill it in):\n${problems}`);
}

export function getSupabaseEnv(source: SupabaseSource = supabaseSource()): SupabaseEnv | undefined {
  if (!source.url?.trim() && !source.publishableKey?.trim()) { return undefined; }
  return requireSupabaseEnv(source);
}

export function getTurnstileSiteKey(value: string | undefined = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY): string | undefined {
  return value?.trim() || undefined;
}

export function getSentryDsn(value: string | undefined = process.env.NEXT_PUBLIC_SENTRY_DSN): string | undefined {
  return value?.trim() || undefined;
}

export interface AnalyticsEnv {
  key: string
  host: string
}

export function getAnalyticsEnv({ key, host }: Partial<AnalyticsEnv> = {
  key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
}): AnalyticsEnv | undefined {
  if (!key?.trim()) { return undefined; }
  return { key: key.trim(), host: host?.trim() || 'https://eu.i.posthog.com' };
}
