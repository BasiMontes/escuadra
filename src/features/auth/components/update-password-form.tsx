'use client';

import { useRouter } from 'next/navigation';
import { minimumPasswordLength } from '@/platform/auth-policy';
import { createClient } from '@/platform/supabase/client';
import { Button } from '@/platform/ui/button';
import { FieldGroup } from '@/platform/ui/field';
import { authErrorMessage } from '../auth-errors';
import { useAuthForm } from '../use-auth-form';
import { FormField } from './form-field';
import { ErrorMessage } from './form-message';

export interface UpdatePasswordAuth {
  updateUser: (input: { password: string }) => Promise<{ error: { code?: string } | null }>
  signOut: () => Promise<{ error: { code?: string } | null }>
}

export function UpdatePasswordForm({ auth }: { auth?: UpdatePasswordAuth }) {
  const router = useRouter();
  const form = useAuthForm(async ({ field }) => {
    const password = field('password');
    if (password !== field('repeated')) { return 'The two passwords do not match.'; }
    const client = auth ?? createClient().auth;
    const { error } = await client.updateUser({ password });
    if (error) { return authErrorMessage(error); }
    await client.signOut();
    router.replace('/login?notice=password-updated');
    router.refresh();
    return undefined;
  }, { withCaptcha: false });

  return (
    <form onSubmit={event => void form.onSubmit(event)}>
      <FieldGroup>
        <FormField label="New password" name="password" type="password" autoComplete="new-password" minLength={minimumPasswordLength} />
        <FormField label="Repeat the new password" name="repeated" type="password" autoComplete="new-password" minLength={minimumPasswordLength} />
        <ErrorMessage>{form.error}</ErrorMessage>
        <Button type="submit" disabled={form.pending}>Save password</Button>
      </FieldGroup>
    </form>
  );
}
