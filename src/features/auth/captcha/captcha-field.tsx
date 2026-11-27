'use client';

import type { Captcha } from './use-captcha';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/platform/ui/button';

interface TurnstileOptions {
  'sitekey': string
  'size': 'flexible'
  'theme': 'auto'
  'callback': (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

interface Turnstile {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const scriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loading: Promise<Turnstile> | undefined;

// Injected by the app's own bundle, which the CSP trusts through `strict-dynamic`.
async function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) { return window.turnstile; }
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not start'));
    script.onerror = () => reject(new Error('Turnstile did not load'));
    document.head.append(script);
  }).catch((error: unknown) => {
    // Not cached: the next attempt has to be able to try again.
    loading = undefined;
    throw error;
  });
  return loading;
}

export function CaptchaField({ captcha }: { captcha: Captcha }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failedAttempt, setFailedAttempt] = useState<number>();
  const { siteKey, attempt, setToken, reset } = captcha;

  useEffect(() => {
    const element = containerRef.current;
    if (!siteKey || !element) { return; }
    let cancelled = false;
    let widgetId: string | undefined;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) { return; }
        widgetId = turnstile.render(element, {
          'sitekey': siteKey,
          'size': 'flexible',
          'theme': 'auto',
          'callback': token => setToken(token),
          'expired-callback': () => setToken(undefined),
          'error-callback': () => setToken(undefined),
        });
      })
      .catch(() => {
        if (!cancelled) { setFailedAttempt(attempt); }
      });

    return () => {
      cancelled = true;
      if (widgetId !== undefined) { window.turnstile?.remove(widgetId); }
    };
  }, [siteKey, attempt, setToken]);

  if (!siteKey) { return null; }

  return (
    <div className="flex min-h-16 flex-col justify-center gap-2">
      <div ref={containerRef} data-testid="captcha_widget" />
      {failedAttempt === attempt && (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm text-destructive">
          <p>The verification did not load.</p>
          <Button type="button" variant="outline" onClick={reset}>Try again</Button>
        </div>
      )}
    </div>
  );
}
