'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/platform/supabase/client';
import { Button } from '@/platform/ui/button';
import { authErrorMessage } from '../auth-errors';
import { ErrorMessage } from './form-message';

export interface SignOutAuth {
  signOut: () => Promise<{ error: { code?: string } | null }>
}

export function SignOutButton({ auth }: { auth?: SignOutAuth }) {
  const router = useRouter();
  const [error, setError] = useState<string>();

  async function signOut() {
    const { error: failure } = await (auth ?? createClient().auth).signOut();
    if (failure) {
      setError(authErrorMessage(failure));
      return;
    }
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <ErrorMessage>{error}</ErrorMessage>
      <Button type="button" variant="outline" onClick={() => void signOut()}>Sign out</Button>
    </div>
  );
}
