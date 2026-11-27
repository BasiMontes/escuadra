import { redirect } from 'next/navigation';
import { createClient } from '@/platform/supabase/server';

export interface SignedInUser {
  id: string
  email: string | undefined
}

export async function getSignedInUser(): Promise<SignedInUser | null> {
  const supabase = await createClient();
  // The claims come from a verified token; the user object stored in the cookie is not trustworthy.
  const { data } = await supabase.auth.getClaims();

  return data ? { id: data.claims.sub, email: data.claims.email } : null;
}

export async function requireUser(path: string): Promise<SignedInUser> {
  const user = await getSignedInUser();
  if (!user) { redirect(`/login?next=${encodeURIComponent(path)}`); }

  return user;
}
