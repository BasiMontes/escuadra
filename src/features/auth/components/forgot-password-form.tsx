'use client';

import { useState } from 'react';
import { createClient } from '@/platform/supabase/client';
import { Button } from '@/platform/ui/button';
import { FieldGroup } from '@/platform/ui/field';
import { authErrorMessage } from '../auth-errors';
import { CaptchaField } from '../captcha/captcha-field';
import { useAuthForm } from '../use-auth-form';
import { FormField } from './form-field';
import { ErrorMessage, Notice } from './form-message';

export interface ForgotPasswordAuth {
  resetPasswordForEmail: (email: string, options: { captchaToken: string | undefined, redirectTo: string }) => Promise<{ error: { code?: string } | null }>
}

export function ForgotPasswordForm({ auth }: { auth?: ForgotPasswordAuth }) {
  const [sent, setSent] = useState(false);
  const form = useAuthForm(async ({ field, captchaToken }) => {
    const client = auth ?? createClient().auth;
    const redirectTo = `${window.location.origin}/auth/confirm?next=/update-password`;
    const { error } = await client.resetPasswordForEmail(field('email'), { captchaToken, redirectTo });
    // Only an existing account can hit the email limit, so showing it would reveal the account.
    if (error && error.code !== 'over_email_send_rate_limit') { return authErrorMessage(error); }
    setSent(true);
    return undefined;
  });

  if (sent) { return <Notice>If an account exists for that email, a link is on its way. Open it in this browser.</Notice>; }

  return (
    <form onSubmit={event => void form.onSubmit(event)}>
      <FieldGroup>
        <FormField label="Email" name="email" type="email" autoComplete="email" />
        <CaptchaField captcha={form.captcha} />
        <ErrorMessage>{form.error}</ErrorMessage>
        <Button type="submit" disabled={form.pending}>Send link</Button>
      </FieldGroup>
    </form>
  );
}
