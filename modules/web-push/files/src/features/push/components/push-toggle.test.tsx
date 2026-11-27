import type { BrowserPush } from './browser-push';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { PushToggle } from './push-toggle';

const endpoint = 'https://fcm.googleapis.com/fcm/send/abc';

function fakeBrowser(overrides: Partial<BrowserPush> = {}) {
  const calls: string[] = [];
  const browser: BrowserPush = {
    supported: () => true,
    blocked: () => false,
    currentEndpoint: async () => null,
    subscribe: async () => ({ endpoint }),
    unsubscribe: async () => {
      calls.push('unsubscribe');
      return endpoint;
    },
    ...overrides,
  };
  return { browser, calls };
}

function fakeServer(response = () => new Response(null, { status: 204 })) {
  const asked: string[] = [];
  const send = async (path: string, init: RequestInit) => {
    asked.push(`${init.method} ${path}`);
    return response();
  };
  return { asked, send };
}

function show({ browser = fakeBrowser().browser, send = fakeServer().send, publicKey = 'key', knownEndpoints = [] as string[] } = {}) {
  return render(<PushToggle publicKey={publicKey} knownEndpoints={knownEndpoints} browser={browser} send={send} />);
}

describe('PushToggle', () => {
  test('says it is unavailable without a key', () => {
    expect(show({ publicKey: '' }).getByText('Notifications are not available yet.')).toBeVisible();
  });

  test.each([
    [{ supported: () => false }, 'This browser cannot receive notifications.'],
    [{ blocked: () => true }, 'Notifications are blocked. Allow them for this site in the browser settings.'],
  ])('explains why it cannot be turned on', async (state, message) => {
    const view = show({ browser: fakeBrowser(state).browser });

    expect(await view.findByText(message)).toBeVisible();
  });

  test('turns the device on and tells the server', async () => {
    const server = fakeServer();
    const view = show({ send: server.send });

    fireEvent.click(await view.findByRole('button', { name: 'Turn on notifications' }));

    expect(await view.findByText('Notifications are on for this device.')).toBeVisible();
    expect(server.asked).toEqual(['POST /api/push/subscription']);
  });

  test('is on only when the server knows this browser', async () => {
    const browser = fakeBrowser({ currentEndpoint: async () => endpoint }).browser;
    expect(await show({ browser, knownEndpoints: [endpoint] }).findByRole('button', { name: 'Turn off notifications' })).toBeVisible();
    document.body.innerHTML = '';

    expect(await show({ browser }).findByRole('button', { name: 'Turn on notifications' })).toBeVisible();
  });

  test('stays off when the server refuses, without leaving the browser subscribed', async () => {
    const browser = fakeBrowser();
    const view = show({ browser: browser.browser, send: fakeServer(() => new Response(null, { status: 500 })).send });

    fireEvent.click(await view.findByRole('button', { name: 'Turn on notifications' }));

    expect(await view.findByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(browser.calls).toEqual(['unsubscribe']);
    expect(view.getByRole('button', { name: 'Turn on notifications' })).toBeEnabled();
  });

  test('turns the device off and tells the server', async () => {
    const server = fakeServer();
    const view = show({ send: server.send, browser: fakeBrowser({ currentEndpoint: async () => endpoint }).browser, knownEndpoints: [endpoint] });

    fireEvent.click(await view.findByRole('button', { name: 'Turn off notifications' }));

    expect(await view.findByRole('button', { name: 'Turn on notifications' })).toBeVisible();
    expect(server.asked).toEqual(['DELETE /api/push/subscription']);
  });

  test.each([
    [1, 'Sent. It should arrive in a few seconds.'],
    [0, 'No notification could be sent. Turn notifications off and on again.'],
  ])('reports a test notification (%p sent)', async (sent, message) => {
    const view = show({ send: fakeServer(() => Response.json({ sent })).send, browser: fakeBrowser({ currentEndpoint: async () => endpoint }).browser, knownEndpoints: [endpoint] });

    fireEvent.click(await view.findByRole('button', { name: 'Send a test notification' }));

    expect(await view.findByRole('status')).toHaveTextContent(message);
  });
});
