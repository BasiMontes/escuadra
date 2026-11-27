import { fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { renderWithRouter } from '../../../../test/render-with-router';
import { LoginForm } from './login-form';

function fill(view: ReturnType<typeof renderWithRouter>) {
  fireEvent.change(view.getByLabelText('Email'), { target: { value: 'ana@example.test' } });
  fireEvent.change(view.getByLabelText('Password'), { target: { value: 'correct horse' } });
}

describe('LoginForm', () => {
  test('signs in with what was typed and goes to the requested page', async () => {
    const sent: unknown[] = [];
    const view = renderWithRouter(
      <LoginForm
        next="/account?tab=security"
        auth={{ signInWithPassword: async (input) => {
          sent.push(input);
          return { error: null };
        } }}
      />,
    );

    fill(view);
    fireEvent.click(view.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(view.visited).toEqual(['/account?tab=security']));
    expect(sent).toEqual([{ email: 'ana@example.test', password: 'correct horse', options: { captchaToken: undefined } }]);
  });

  test('never leaves the app after signing in', async () => {
    const view = renderWithRouter(<LoginForm next="https://evil.test" auth={{ signInWithPassword: async () => ({ error: null }) }} />);

    fill(view);
    fireEvent.click(view.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(view.visited).toEqual(['/account']));
  });

  test('explains a wrong password and stays on the page', async () => {
    const view = renderWithRouter(<LoginForm auth={{ signInWithPassword: async () => ({ error: { code: 'invalid_credentials' } }) }} />);

    fill(view);
    fireEvent.click(view.getByRole('button', { name: 'Sign in' }));

    expect(await view.findByRole('alert')).toHaveTextContent('Wrong email or password.');
    expect(view.visited).toEqual([]);
  });

  test('asks to complete the captcha instead of sending the request without it', async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key';
    window.turnstile = { render: () => 'widget', remove: () => {} };
    let requests = 0;
    const view = renderWithRouter(
      <LoginForm auth={{ signInWithPassword: async () => {
        requests += 1;
        return { error: null };
      } }}
      />,
    );

    fill(view);
    fireEvent.click(view.getByRole('button', { name: 'Sign in' }));

    expect(await view.findByRole('alert')).toHaveTextContent('Complete the verification');
    expect(requests).toBe(0);
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete window.turnstile;
  });

  test('sends one request on a double click', async () => {
    let requests = 0;
    const view = renderWithRouter(
      <LoginForm auth={{ signInWithPassword: async () => {
        requests += 1;
        return { error: null };
      } }}
      />,
    );

    fill(view);
    const button = view.getByRole('button', { name: 'Sign in' });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(view.visited).toHaveLength(1));
    expect(requests).toBe(1);
  });
});
