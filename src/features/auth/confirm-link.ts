import type { EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/platform/supabase/server';
import { safeNextPath } from './safe-next-path';

export interface LinkAuth {
  exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>
  verifyOtp: (input: { token_hash: string, type: EmailOtpType }) => Promise<{ error: Error | null }>
}

const emailOtpTypes: readonly string[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'] satisfies EmailOtpType[];

async function openSession({ auth, params }: { auth: LinkAuth, params: URLSearchParams }): Promise<boolean> {
  const code = params.get('code');
  if (code) { return !(await auth.exchangeCodeForSession(code)).error; }

  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  if (!tokenHash || !type || !emailOtpTypes.includes(type)) { return false; }

  return !(await auth.verifyOtp({ token_hash: tokenHash, type })).error;
}

// Default Supabase emails come back with `code`, which only works in the browser that asked for the email.
// Custom templates (they need your own SMTP) can send `token_hash` instead, which works in any browser.
export async function confirmLinkDestination({ auth, params }: { auth: LinkAuth, params: URLSearchParams }): Promise<string> {
  const requested = safeNextPath(params.get('next'));
  const isRecovery = params.get('type') === 'recovery' || requested === '/update-password';

  if (await openSession({ auth, params })) {
    return isRecovery && requested === '/' ? '/update-password' : requested;
  }

  return isRecovery ? '/forgot-password?error=invalid-link' : '/login?error=invalid-link';
}

export async function handleEmailLink(request: NextRequest) {
  const supabase = await createClient();
  const path = await confirmLinkDestination({ auth: supabase.auth, params: request.nextUrl.searchParams });

  return NextResponse.redirect(new URL(path, request.url));
}
