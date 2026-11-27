import type { PushContext } from './requests';
import { describe, expect, test } from 'bun:test';
import { maximumDevices, subscribeResponse, testResponse, unsubscribeResponse } from './requests';
import { fakeStore, record } from './testing';

function post({ body, origin = 'https://app.test' }: { body?: unknown, origin?: string } = {}) {
  return new Request('https://app.test/api/push/subscription', { method: 'POST', headers: { host: 'app.test', origin }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}

function context(initial = [record()], overrides: Partial<PushContext> = {}) {
  const { rows, store } = fakeStore(initial);
  const value: PushContext = { user: { id: 'user-1' }, store: () => store, sender: async () => 'sent', ...overrides };
  return { rows, value };
}

function subscription(from = record()) {
  return { endpoint: from.endpoint, expirationTime: null, keys: { p256dh: from.p256dh, auth: from.auth } };
}

describe('subscribeResponse', () => {
  test('stores the device for the signed-in user', async () => {
    const { rows, value } = context([]);

    const response = await subscribeResponse({ request: post({ body: subscription() }), context: value });

    expect(response.status).toBe(204);
    expect(rows.get(record().endpoint)).toEqual(record());
  });

  test('keeps only the newest devices', async () => {
    const full = Array.from({ length: maximumDevices }, (_, index) => record({ endpoint: `https://fcm.googleapis.com/old-${index}` }));
    const { rows, value } = context(full);

    await subscribeResponse({ request: post({ body: subscription() }), context: value });

    expect(rows.size).toBe(maximumDevices);
    expect(rows.has('https://fcm.googleapis.com/old-0')).toBe(false);
    expect(rows.has(record().endpoint)).toBe(true);
  });

  test('moves a shared browser to the user who is signed in now', async () => {
    const { rows, value } = context([record({ userId: 'user-2' })]);

    await subscribeResponse({ request: post({ body: subscription() }), context: value });

    expect(rows.get(record().endpoint)?.userId).toBe('user-1');
  });

  test('does not hand a device to someone who only knows its address', async () => {
    const { rows, value } = context([record({ userId: 'user-2' })]);

    const response = await subscribeResponse({ request: post({ body: subscription(record({ auth: 'z'.repeat(22) })) }), context: value });

    expect(response.status).toBe(409);
    expect(rows.get(record().endpoint)?.userId).toBe('user-2');
  });

  test.each([
    ['an address outside the push services', subscription(record({ endpoint: 'https://attacker.test/x' }))],
    ['missing keys', { endpoint: record().endpoint }],
    ['oversized keys', subscription(record({ p256dh: 'p'.repeat(500) }))],
    ['text that is not JSON', 'junk'],
  ])('refuses %s', async (_label, body) => {
    const { rows, value } = context([]);

    expect((await subscribeResponse({ request: post({ body }), context: value })).status).toBe(400);
    expect(rows.size).toBe(0);
  });

  test('refuses another site, a visitor, and an app with no keys', async () => {
    const body = subscription();

    expect((await subscribeResponse({ request: post({ body, origin: 'https://evil.test' }), context: context().value })).status).toBe(403);
    expect((await subscribeResponse({ request: post({ body }), context: context([], { user: null }).value })).status).toBe(401);
    expect((await subscribeResponse({ request: post({ body }), context: context([], { sender: undefined }).value })).status).toBe(503);
  });
});

describe('unsubscribeResponse', () => {
  test('removes the device of the signed-in user', async () => {
    const { rows, value } = context();

    const response = await unsubscribeResponse({ request: post({ body: { endpoint: record().endpoint } }), context: value });

    expect(response.status).toBe(204);
    expect(rows.size).toBe(0);
  });

  test('leaves the device of someone else, and answers the same', async () => {
    const { rows, value } = context([record({ userId: 'user-2' })]);

    const response = await unsubscribeResponse({ request: post({ body: { endpoint: record().endpoint } }), context: value });

    expect(response.status).toBe(204);
    expect(rows.size).toBe(1);
  });

  test('refuses another site, a visitor and a body with no address', async () => {
    expect((await unsubscribeResponse({ request: post({ body: {}, origin: 'https://evil.test' }), context: context().value })).status).toBe(403);
    expect((await unsubscribeResponse({ request: post({ body: {} }), context: context([], { user: null }).value })).status).toBe(401);
    expect((await unsubscribeResponse({ request: post({ body: {} }), context: context().value })).status).toBe(400);
  });
});

describe('testResponse', () => {
  test('sends a notification to the signed-in user only', async () => {
    const { value } = context([record(), record({ userId: 'user-2', endpoint: 'other' })]);

    const response = await testResponse({ request: post(), context: value });

    expect(await response.json()).toEqual({ sent: 1, removed: 0, failed: 0 });
  });

  test('refuses another site, a visitor, and an app with no keys', async () => {
    expect((await testResponse({ request: post({ origin: 'https://evil.test' }), context: context().value })).status).toBe(403);
    expect((await testResponse({ request: post(), context: context([], { user: null }).value })).status).toBe(401);
    expect((await testResponse({ request: post(), context: context([], { sender: undefined }).value })).status).toBe(503);
  });
});
