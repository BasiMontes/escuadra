'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/platform/supabase/client';
import { Button } from '@/platform/ui/button';
import { FieldGroup } from '@/platform/ui/field';
import { authErrorMessage } from '../auth-errors';
import { CaptchaField } from '../captcha/captcha-field';
import { postLoginPath } from '../safe-next-path';
import { useAuthForm } from '../use-auth-form';
import { FormField } from './form-field';
import { ErrorMessage } from './form-message';

export interface LoginAuth {
  signInWithPassword: (input: { email: string, password: string, options: { captchaToken: string | undefined } }) => Promise<{ error: { code?: string } | null }>
}

export function LoginForm({ next, auth }: { next?: string, auth?: LoginAuth }) {
  const router = useRouter();
  const form = useAuthForm(async ({ field, captchaToken }) => {
    const client = auth ?? createClient().auth;
    const { error } = await client.signInWithPassword({ email: field('email'), password: field('password'), options: { captchaToken } });
    if (error) { return authErrorMessage(error); }
    router.replace(postLoginPath(next));
    router.refresh();
    return undefined;
  });

  return (
    <form onSubmit={event => void form.onSubmit(event)}>
      <FieldGroup>
        <FormField label="Email" name="email" type="email" autoComplete="email" />
        <FormField label="Password" name="password" type="password" autoComplete="current-password" />
        <CaptchaField captcha={form.captcha} />
        <ErrorMessage>{form.error}</ErrorMessage>
        <Button type="submit" disabled={form.pending}>Sign in</Button>
      </FieldGroup>
    </form>
  );
}
