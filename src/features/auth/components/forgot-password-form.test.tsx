import type { ForgotPasswordAuth } from './forgot-password-form';
import { fireEvent } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { renderWithRouter } from '../../../../test/render-with-router';
import { ForgotPasswordForm } from './forgot-password-form';

function submit(auth: ForgotPasswordAuth) {
  const view = renderWithRouter(<ForgotPasswordForm auth={auth} />);
  fireEvent.change(view.getByLabelText('Email'), { target: { value: 'ana@example.test' } });
  fireEvent.click(view.getByRole('button', { name: 'Send link' }));
  return view;
}

describe('ForgotPasswordForm', () => {
  test('confirms without saying whether the account exists, with the link back to this app', async () => {
    const redirects: string[] = [];
    const view = submit({ resetPasswordForEmail: async (_email, options) => {
      redirects.push(options.redirectTo);
      return { error: null };
    } });

    expect(await view.findByRole('status')).toHaveTextContent('If an account exists');
    expect(redirects).toEqual([`${window.location.origin}/auth/confirm?next=/update-password`]);
  });

  test('hides the per-account email limit, which only an existing account can hit', async () => {
    const view = submit({ resetPasswordForEmail: async () => ({ error: { code: 'over_email_send_rate_limit' } }) });

    expect(await view.findByRole('status')).toHaveTextContent('If an account exists');
  });

  test('reports a failed request instead of claiming the email left', async () => {
    const view = submit({ resetPasswordForEmail: async () => ({ error: { code: 'captcha_failed' } }) });

    expect(await view.findByRole('alert')).toHaveTextContent('could not verify');
  });
});
