import type { SignupAuth } from './signup-form';
import { fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { renderWithRouter } from '../../../../test/render-with-router';
import { SignupForm } from './signup-form';

function submit(auth: SignupAuth) {
  const view = renderWithRouter(<SignupForm auth={auth} />);
  fireEvent.change(view.getByLabelText('Email'), { target: { value: 'ana@example.test' } });
  fireEvent.change(view.getByLabelText('Password'), { target: { value: 'correct horse' } });
  fireEvent.click(view.getByRole('button', { name: 'Create account' }));
  return view;
}

describe('SignupForm', () => {
  test('asks to check the email and points the link back to this app', async () => {
    const redirects: string[] = [];
    const view = submit({ signUp: async (input) => {
      redirects.push(input.options.emailRedirectTo);
      return { data: { session: null }, error: null };
    } });

    expect(await view.findByRole('status')).toHaveTextContent('Check your email');
    expect(redirects).toEqual([`${window.location.origin}/auth/confirm?next=/account`]);
  });

  test('goes straight in when the project does not ask to confirm emails', async () => {
    const view = submit({ signUp: async () => ({ data: { session: {} }, error: null }) });

    await waitFor(() => expect(view.visited).toEqual(['/account']));
  });

  test('explains a rejected password', async () => {
    const view = submit({ signUp: async () => ({ data: { session: null }, error: { code: 'weak_password' } }) });

    expect(await view.findByRole('alert')).toHaveTextContent('stronger password');
  });
});
