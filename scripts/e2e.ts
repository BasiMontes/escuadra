#!/usr/bin/env bun
/**
 * Runs the Playwright suite against the local Supabase stack, and nothing else: `bun run test:e2e [playwright args]`.
 * Variables inherited from the shell or from `.env` can point at a hosted project, so the ones that reach an
 * outside service are replaced here.
 */

import { createECDH } from 'node:crypto';
import process from 'node:process';

const localHosts = new Set(['127.0.0.1', 'localhost']);

// Set to empty rather than removed: an empty value also wins over the one in `.env`.
const switchedOff = [
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_POSTHOG_HOST',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'RESEND_API_KEY',
  'GMAIL_SMTP_APP_PASSWORD',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
] as const;

// A new pair on every run, so push screens can be tested with no real key.
function throwawayPushKeys() {
  const pair = createECDH('prime256v1');
  const publicKey = pair.generateKeys('base64url');
  const privateKey = Buffer.from(pair.getPrivateKey('hex').padStart(64, '0'), 'hex').toString('base64url');
  return { NEXT_PUBLIC_VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey, VAPID_SUBJECT: 'mailto:e2e@example.test' };
}

function readStatus(status: string): Map<string, string> {
  return new Map([...status.matchAll(/^([A-Z_]+)="?([^"\n]*)"?$/gm)].map(match => [match[1], match[2]]));
}

export function e2eEnvironment({ status, inherited }: { status: string, inherited: Record<string, string | undefined> }) {
  const stack = readStatus(status);
  const url = stack.get('API_URL');
  const key = stack.get('PUBLISHABLE_KEY');
  const mailbox = stack.get('MAILPIT_URL') ?? stack.get('INBUCKET_URL');
  if (!url || !key || !mailbox) { throw new Error('The local Supabase stack is not running: bun run db:start'); }
  if (!localHosts.has(new URL(url).hostname)) { throw new Error(`Refusing to test against ${url}: it is not on this machine`); }

  return {
    ...inherited,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    SUPABASE_SECRET_KEY: stack.get('SECRET_KEY') ?? '',
    E2E_MAILBOX_URL: mailbox,
    ...Object.fromEntries(switchedOff.map(name => [name, ''])),
    ...throwawayPushKeys(),
  };
}

function main(args: string[]): number {
  const status = Bun.spawnSync(['supabase', 'status', '-o', 'env'], { stdout: 'pipe', stderr: 'ignore' });
  let env;
  try {
    env = e2eEnvironment({ status: status.stdout.toString(), inherited: process.env });
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  return Bun.spawnSync(['bunx', 'playwright', 'test', ...args], { env, stdio: ['inherit', 'inherit', 'inherit'] }).exitCode;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
