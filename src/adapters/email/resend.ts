import type { Email } from './email';
import type { EmailEnv } from '@/platform/env.server';
import { Resend } from 'resend';

export async function sendWithResend({ env, email }: { env: Extract<EmailEnv, { provider: 'resend' }>, email: Email }) {
  // Without a verified domain, Resend only delivers to the account owner's own address.
  const { error } = await new Resend(env.apiKey).emails.send({ from: env.from, ...email });
  if (error) { throw new Error(`Resend rejected the email: ${error.message}`); }
}
