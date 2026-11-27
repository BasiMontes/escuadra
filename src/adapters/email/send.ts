import type { Email } from './email';
import type { EmailEnv } from '@/platform/env.server';
import { getEmailEnv } from '@/platform/env.server';
import { sendWithGmail } from './gmail';
import { sendWithResend } from './resend';

export interface Transports {
  resend: (input: { env: Extract<EmailEnv, { provider: 'resend' }>, email: Email }) => Promise<unknown>
  gmail: (input: { env: Extract<EmailEnv, { provider: 'gmail' }>, email: Email }) => Promise<unknown>
}

export function createEmailSender({ env, transports }: { env: () => EmailEnv | undefined, transports: Transports }) {
  return async (email: Email): Promise<'sent' | 'skipped'> => {
    const configured = env();
    if (!configured) {
      console.warn(`Email not sent, no provider configured. Subject: ${email.subject}`);
      return 'skipped';
    }
    if (configured.provider === 'resend') { await transports.resend({ env: configured, email }); }
    else { await transports.gmail({ env: configured, email }); }
    return 'sent';
  };
}

/** @public */
export const sendEmail = createEmailSender({ env: getEmailEnv, transports: { resend: sendWithResend, gmail: sendWithGmail } });
