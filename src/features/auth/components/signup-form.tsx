'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { minimumPasswordLength } from '@/platform/auth-policy';
import { createClient } from '@/platform/supabase/client';
import { Button } from '@/platform/ui/button';
import { FieldGroup } from '@/platform/ui/field';
import { authErrorMessage } from '../auth-errors';
import { CaptchaField } from '../captcha/captcha-field';
import { useAuthForm } from '../use-auth-form';
import { FormField } from './form-field';
import { ErrorMessage, Notice } from './form-message';

export interface SignupAuth {
  signUp: (input: { email: string, password: string, options: { captchaToken: string | undefined, emailRedirectTo: string } }) => Promise<{ data: { session: object | null }, error: { code?: string } | null }>
}

export function SignupForm({ auth }: { auth?: SignupAuth }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const form = useAuthForm(async ({ field, captchaToken }) => {
    const client = auth ?? createClient().auth;
    const emailRedirectTo = `${window.location.origin}/auth/confirm?next=/account`;
    const { data, error } = await client.signUp({ email: field('email'), password: field('password'), options: { captchaToken, emailRedirectTo } });
    if (error) { return authErrorMessage(error); }
    if (!data.session) {
      setSent(true);
      return undefined;
    }
    router.replace('/account');
    router.refresh();
    return undefined;
  });

  // The same answer for a new and for an existing address, so nobody can probe who has an account.
  if (sent) { return <Notice>Check your email and open the link in this browser to finish creating your account.</Notice>; }

  return (
    <form onSubmit={event => void form.onSubmit(event)}>
      <FieldGroup>
        <FormField label="Email" name="email" type="email" autoComplete="email" />
        <FormField label="Password" name="password" type="password" autoComplete="new-password" minLength={minimumPasswordLength} />
        <CaptchaField captcha={form.captcha} />
        <ErrorMessage>{form.error}</ErrorMessage>
        <Button type="submit" disabled={form.pending}>Create account</Button>
      </FieldGroup>
    </form>
  );
}
