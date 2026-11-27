import { describe, expect, test } from 'bun:test';
import { getEmailEnv } from './env.server';

describe('getEmailEnv', () => {
  test('is off when no provider is configured', () => {
    expect(getEmailEnv({})).toBeUndefined();
  });

  test('uses Resend with a sender address', () => {
    expect(getEmailEnv({ RESEND_API_KEY: 're_key', EMAIL_FROM: 'App <hi@app.test>' }))
      .toEqual({ provider: 'resend', apiKey: 're_key', from: 'App <hi@app.test>' });
  });

  test('prefers Gmail, which is only configured on purpose, and sends as that account', () => {
    expect(getEmailEnv({ RESEND_API_KEY: 're_key', GMAIL_SMTP_USER: 'me@gmail.test', GMAIL_SMTP_APP_PASSWORD: 'app' }))
      .toEqual({ provider: 'gmail', user: 'me@gmail.test', password: 'app', from: 'me@gmail.test' });
  });

  test('names the missing variable of a half-configured provider', () => {
    expect(() => getEmailEnv({ RESEND_API_KEY: 're_key' })).toThrow('EMAIL_FROM');
    expect(() => getEmailEnv({ GMAIL_SMTP_APP_PASSWORD: 'app' })).toThrow('GMAIL_SMTP_USER');
  });
});
