import type { UpdatePasswordAuth } from './update-password-form';
import { fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { renderWithRouter } from '../../../../test/render-with-router';
import { UpdatePasswordForm } from './update-password-form';

function fakeAuth(failure: { code: string } | null = null) {
  const calls: unknown[] = [];
  const auth: UpdatePasswordAuth = {
    updateUser: async (input) => {
      calls.push(input);
      return { error: failure };
    },
    signOut: async () => {
      calls.push('signOut');
      return { error: null };
    },
  };
  return { auth, calls };
}

function submit({ auth, repeated = 'a new password' }: { auth: UpdatePasswordAuth, repeated?: string }) {
  const view = renderWithRouter(<UpdatePasswordForm auth={auth} />);
  fireEvent.change(view.getByLabelText('New password'), { target: { value: 'a new password' } });
  fireEvent.change(view.getByLabelText('Repeat the new password'), { target: { value: repeated } });
  fireEvent.click(view.getByRole('button', { name: 'Save password' }));
  return view;
}

describe('UpdatePasswordForm', () => {
  test('saves the password, closes the session and asks to sign in with it', async () => {
    const { auth, calls } = fakeAuth();
    const view = submit({ auth });

    await waitFor(() => expect(view.visited).toEqual(['/login?notice=password-updated']));
    expect(calls).toEqual([{ password: 'a new password' }, 'signOut']);
  });

  test('sends nothing when the two passwords differ', async () => {
    const { auth, calls } = fakeAuth();
    const view = submit({ auth, repeated: 'another password' });

    expect(await view.findByRole('alert')).toHaveTextContent('do not match');
    expect(calls).toEqual([]);
  });

  test('does not wait for a captcha when one is configured', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key';
    const view = submit({ auth: fakeAuth().auth });

    await waitFor(() => expect(view.visited).toHaveLength(1));
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  });

  test('keeps the session when the password is rejected', async () => {
    const { auth, calls } = fakeAuth({ code: 'same_password' });
    const view = submit({ auth });

    expect(await view.findByRole('alert')).toHaveTextContent('differ from the current one');
    expect(calls).toEqual([{ password: 'a new password' }]);
  });
});
