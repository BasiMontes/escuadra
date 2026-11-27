import type { Captcha } from './use-captcha';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'bun:test';
import { CaptchaField } from './captcha-field';

function captcha(overrides: Partial<Captcha> = {}): Captcha {
  return { siteKey: 'site-key', token: undefined, ready: false, attempt: 0, setToken: () => {}, reset: () => {}, ...overrides };
}

afterEach(() => {
  delete window.turnstile;
});

describe('CaptchaField', () => {
  test('renders nothing without a site key', () => {
    const view = render(<CaptchaField captcha={captcha({ siteKey: undefined })} />);

    expect(view.container).toBeEmptyDOMElement();
  });

  test('hands the token to the form and drops it when it expires', async () => {
    const tokens: (string | undefined)[] = [];
    const removed: string[] = [];
    let options: Record<string, unknown> = {};
    window.turnstile = {
      render: (_container, given) => {
        options = given as unknown as Record<string, unknown>;
        return 'widget-1';
      },
      remove: id => void removed.push(id),
    };

    const view = render(<CaptchaField captcha={captcha({ setToken: token => void tokens.push(token) })} />);
    await waitFor(() => expect(options.sitekey).toBe('site-key'));
    act(() => (options.callback as (token: string) => void)('token-1'));
    act(() => (options['expired-callback'] as () => void)());
    view.unmount();

    expect(tokens).toEqual(['token-1', undefined]);
    expect(removed).toEqual(['widget-1']);
  });
});
