import type { Transports } from './send';
import { describe, expect, test } from 'bun:test';
import { createEmailSender } from './send';

const email = { to: 'ana@example.test', subject: 'Welcome', text: 'Hello' };

function fakeTransports() {
  const sent: unknown[] = [];
  const transports: Transports = {
    resend: async input => void sent.push(['resend', input.env.from, input.email]),
    gmail: async input => void sent.push(['gmail', input.env.from, input.email]),
  };
  return { sent, transports };
}

describe('createEmailSender', () => {
  test.each([
    { provider: 'resend', apiKey: 'k', from: 'hi@app.test' } as const,
    { provider: 'gmail', user: 'u', password: 'p', from: 'me@gmail.test' } as const,
  ])('sends through $provider', async (env) => {
    const fake = fakeTransports();

    expect(await createEmailSender({ env: () => env, transports: fake.transports })(email)).toBe('sent');
    expect(fake.sent).toEqual([[env.provider, env.from, email]]);
  });

  test('logs instead of sending when no provider is configured, without the recipient', async () => {
    const logged: string[] = [];
    const original = console.warn;
    console.warn = (message: string) => void logged.push(message);

    expect(await createEmailSender({ env: () => undefined, transports: fakeTransports().transports })(email)).toBe('skipped');
    console.warn = original;
    expect(logged).toEqual(['Email not sent, no provider configured. Subject: Welcome']);
  });

  test('lets the caller see a rejected send', async () => {
    const send = createEmailSender({
      env: () => ({ provider: 'resend', apiKey: 'k', from: 'f' }),
      transports: { ...fakeTransports().transports, resend: async () => {
        throw new Error('rejected');
      } },
    });

    expect(await send(email).catch((error: Error) => error.message)).toBe('rejected');
  });
});
