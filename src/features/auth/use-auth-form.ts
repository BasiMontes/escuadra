'use client';

import { useRef, useState } from 'react';
import { genericAuthError } from './auth-errors';
import { useCaptcha } from './captcha/use-captcha';

export interface AuthRequest {
  field: (name: string) => string
  captchaToken: string | undefined
}

export interface AuthSubmitEvent {
  preventDefault: () => void
  currentTarget: HTMLFormElement
}

// `withCaptcha: false` is for requests made with a session, which Supabase never challenges.
export function useAuthForm(send: (request: AuthRequest) => Promise<string | undefined>, { withCaptcha = true } = {}) {
  const captcha = useCaptcha(withCaptcha ? undefined : '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  // State updates too late to stop a double click; the ref does not.
  const busyRef = useRef(false);

  async function onSubmit(event: AuthSubmitEvent) {
    event.preventDefault();
    if (busyRef.current) { return; }
    if (!captcha.ready) {
      setError('Complete the verification above, then try again.');
      return;
    }
    busyRef.current = true;
    setPending(true);
    setError(undefined);
    const data = new FormData(event.currentTarget);
    try {
      setError(await send({ field: name => String(data.get(name) ?? ''), captchaToken: captcha.token }));
    }
    catch (failure) {
      // The person gets a plain message. The console keeps the cause, such as a missing environment variable.
      console.error(failure);
      setError(genericAuthError);
    }
    finally {
      captcha.reset();
      busyRef.current = false;
      setPending(false);
    }
  }

  return { captcha, pending, error, onSubmit };
}
