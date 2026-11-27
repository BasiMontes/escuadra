'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/platform/ui/alert';
import { Button } from '@/platform/ui/button';

const messages = new Map([
  [401, 'Sign in again to continue.'],
  [409, 'You already have a subscription.'],
  [503, 'Payments are not available yet.'],
]);
const generic = 'Something went wrong. Try again in a few seconds.';

interface BillingActionsProps {
  canSubscribe: boolean
  canManage: boolean
  send?: (url: string) => Promise<Response>
  go?: (url: string) => void
}

const post = async (url: string) => fetch(url, { method: 'POST' });
const leave = (url: string) => window.location.assign(url);

export function BillingActions({ canSubscribe, canManage, send = post, go = leave }: BillingActionsProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function open(url: string) {
    setPending(true);
    setError(undefined);
    try {
      const response = await send(url);
      if (response.ok) {
        go((await response.json() as { url: string }).url);
        return;
      }
      setError(messages.get(response.status) ?? generic);
    }
    catch {
      setError(generic);
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-2">
      {error
        ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )
        : null}
      {canSubscribe ? <Button type="button" disabled={pending} onClick={() => void open('/api/stripe/checkout')}>Subscribe</Button> : null}
      {canManage ? <Button type="button" variant="outline" disabled={pending} onClick={() => void open('/api/stripe/portal')}>Manage subscription</Button> : null}
    </div>
  );
}
