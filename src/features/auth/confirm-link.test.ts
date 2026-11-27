import type { LinkAuth } from './confirm-link';
import { describe, expect, test } from 'bun:test';
import { confirmLinkDestination } from './confirm-link';

function fakeAuth(failure: Error | null = null) {
  const calls: unknown[] = [];
  const auth: LinkAuth = {
    exchangeCodeForSession: async (code) => {
      calls.push({ code });
      return { error: failure };
    },
    verifyOtp: async (input) => {
      calls.push(input);
      return { error: failure };
    },
  };
  return { auth, calls };
}

async function destination(query: string, auth: LinkAuth) {
  return confirmLinkDestination({ auth, params: new URLSearchParams(query) });
}

describe('confirmLinkDestination', () => {
  test('exchanges the code of a default email link and continues to `next`', async () => {
    const { auth, calls } = fakeAuth();

    expect(await destination('code=abc&next=/account', auth)).toBe('/account');
    expect(calls).toEqual([{ code: 'abc' }]);
  });

  test('verifies the token hash of a custom email template', async () => {
    const { auth, calls } = fakeAuth();

    expect(await destination('token_hash=h&type=recovery', auth)).toBe('/update-password');
    expect(calls).toEqual([{ token_hash: 'h', type: 'recovery' }]);
  });

  test('does not follow `next` out of the app', async () => {
    expect(await destination('code=abc&next=//evil.test', fakeAuth().auth)).toBe('/');
  });

  test('sends a dead recovery link to ask for a new one', async () => {
    const { auth } = fakeAuth(new Error('expired'));

    expect(await destination('code=abc&next=/update-password', auth)).toBe('/forgot-password?error=invalid-link');
    expect(await destination('token_hash=h&type=recovery', auth)).toBe('/forgot-password?error=invalid-link');
    expect(await destination('error=access_denied&next=/update-password', auth)).toBe('/forgot-password?error=invalid-link');
  });

  test('sends any other dead link to the sign-in page', async () => {
    const { auth, calls } = fakeAuth(new Error('expired'));

    expect(await destination('code=abc&next=/account', auth)).toBe('/login?error=invalid-link');
    expect(await destination('token_hash=h&type=bogus', auth)).toBe('/login?error=invalid-link');
    expect(calls).toHaveLength(1);
  });
});
