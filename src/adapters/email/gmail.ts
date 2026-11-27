import type { Email } from './email';
import type { EmailEnv } from '@/platform/env.server';
import nodemailer from 'nodemailer';

// The free way to reach real inboxes while there is no domain: a Gmail account with an app password.
export async function sendWithGmail({ env, email }: { env: Extract<EmailEnv, { provider: 'gmail' }>, email: Email }) {
  const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: env.user, pass: env.password } });
  await transport.sendMail({ from: env.from, ...email });
}
