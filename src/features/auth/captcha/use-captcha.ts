'use client';

import { useCallback, useState } from 'react';
import { getTurnstileSiteKey } from '@/platform/env';

export interface Captcha {
  siteKey: string | undefined
  token: string | undefined
  ready: boolean
  attempt: number
  setToken: (token: string | undefined) => void
  reset: () => void
}

export function useCaptcha(siteKey: string | undefined = getTurnstileSiteKey()): Captcha {
  const [token, setToken] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  // A Turnstile token is single-use, so every auth request ends with a reset.
  const reset = useCallback(() => {
    setToken(undefined);
    setAttempt(previous => previous + 1);
  }, []);

  return { siteKey, token, ready: !siteKey || token !== undefined, attempt, setToken, reset };
}
