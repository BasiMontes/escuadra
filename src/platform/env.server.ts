// Server-only values. Never import this from a client component.
export type EmailEnv
  = | { provider: 'resend', apiKey: string, from: string }
    | { provider: 'gmail', user: string, password: string, from: string };

type Source = Partial<Record<'RESEND_API_KEY' | 'EMAIL_FROM' | 'GMAIL_SMTP_USER' | 'GMAIL_SMTP_APP_PASSWORD', string>>;

export function getEmailEnv(source: Source = process.env as Source): EmailEnv | undefined {
  const { RESEND_API_KEY: apiKey, EMAIL_FROM: from, GMAIL_SMTP_USER: user, GMAIL_SMTP_APP_PASSWORD: password } = source;
  if (password) {
    if (!user) { throw new Error('GMAIL_SMTP_USER is required when GMAIL_SMTP_APP_PASSWORD is set'); }
    return { provider: 'gmail', user, password, from: from || user };
  }
  if (!apiKey) { return undefined; }
  if (!from) { throw new Error('EMAIL_FROM is required to send with Resend'); }
  return { provider: 'resend', apiKey, from };
}
