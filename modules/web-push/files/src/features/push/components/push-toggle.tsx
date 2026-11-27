'use client';

import type { BrowserPush } from './browser-push';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/platform/ui/alert';
import { Button } from '@/platform/ui/button';
import { browserPush } from './browser-push';

type State = 'checking' | 'unsupported' | 'blocked' | 'off' | 'on';

const explanations = {
  checking: 'Checking this device.',
  unsupported: 'This browser cannot receive notifications.',
  blocked: 'Notifications are blocked. Allow them for this site in the browser settings.',
  off: 'Notifications are off for this device.',
  on: 'Notifications are on for this device.',
};
const generic = 'Something went wrong. Try again in a few seconds.';

interface PushToggleProps {
  publicKey: string | undefined
  knownEndpoints: string[]
  browser?: BrowserPush
  send?: (path: string, init: RequestInit) => Promise<Response>
}

const request = async (path: string, init: RequestInit) => fetch(path, init);

function usePushDevice({ publicKey, knownEndpoints, browser = browserPush, send = request }: PushToggleProps) {
  const [state, setState] = useState<State>('checking');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [report, setReport] = useState<string>();

  useEffect(() => {
    async function read(): Promise<State> {
      if (!browser.supported()) { return 'unsupported'; }
      if (browser.blocked()) { return 'blocked'; }
      const endpoint = await browser.currentEndpoint();
      return endpoint && knownEndpoints.includes(endpoint) ? 'on' : 'off';
    }
    void read().then(setState, () => setState('off'));
  }, [browser, knownEndpoints]);

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(undefined);
    setReport(undefined);
    try { await action(); }
    catch { setError(generic); }
    setPending(false);
  }

  const turnOn = async () => run(async () => {
    const subscription = await browser.subscribe(publicKey ?? '');
    if (!subscription) {
      setState(browser.blocked() ? 'blocked' : 'off');
      return;
    }
    const response = await send('/api/push/subscription', { method: 'POST', body: JSON.stringify(subscription) });
    if (!response.ok) {
      await browser.unsubscribe();
      throw new Error('The subscription was not stored');
    }
    setState('on');
  });

  const turnOff = async () => run(async () => {
    const endpoint = await browser.unsubscribe();
    if (endpoint) { await send('/api/push/subscription', { method: 'DELETE', body: JSON.stringify({ endpoint }) }); }
    setState('off');
  });

  const sendTest = async () => run(async () => {
    const response = await send('/api/push/test', { method: 'POST' });
    if (!response.ok) { throw new Error('The test was not sent'); }
    const { sent } = await response.json() as { sent: number };
    setReport(sent > 0 ? 'Sent. It should arrive in a few seconds.' : 'No notification could be sent. Turn notifications off and on again.');
  });

  return { state, pending, error, report, turnOn, turnOff, sendTest };
}

export function PushToggle(props: PushToggleProps) {
  const { state, pending, error, report, turnOn, turnOff, sendTest } = usePushDevice(props);
  if (!props.publicKey) { return <p>Notifications are not available yet.</p>; }

  return (
    <div className="flex flex-col gap-2">
      <p>{explanations[state]}</p>
      {error
        ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )
        : null}
      {report ? <p role="status">{report}</p> : null}
      {state === 'off' ? <Button type="button" disabled={pending} onClick={() => void turnOn()}>Turn on notifications</Button> : null}
      {state === 'on'
        ? (
            <>
              <Button type="button" disabled={pending} onClick={() => void sendTest()}>Send a test notification</Button>
              <Button type="button" variant="outline" disabled={pending} onClick={() => void turnOff()}>Turn off notifications</Button>
            </>
          )
        : null}
    </div>
  );
}
