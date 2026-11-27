import type { BillingContext } from './requests';
import { describe, expect, test } from 'bun:test';
import { checkoutResponse, portalResponse } from './requests';
import { fakeStore, fakeStripe, record, remoteSubscription } from './testing';

function post(origin: string | null = 'https://app.test') {
  const headers: Record<string, string> = { host: 'app.test' };
  if (origin) { headers.origin = origin; }
  return new Request('https://app.test/api/stripe/checkout', { method: 'POST', headers });
}

function context(overrides: Partial<BillingContext> = {}) {
  const stripe = fakeStripe();
  const store = fakeStore();
  const value: BillingContext = { user: { id: 'user-1', email: 'a@example.test' }, stripe: stripe.stripe, store: () => store.store, priceId: 'price_1', ...overrides };
  return { value, calls: stripe.calls, rows: store.rows };
}

describe('checkoutResponse', () => {
  test('creates the customer, remembers it and returns the checkout address', async () => {
    const { value, calls, rows } = context();

    const response = await checkoutResponse({ request: post(), context: value });

    expect(await response.json()).toEqual({ url: 'https://checkout.stripe.test/session' });
    expect(calls).toEqual(['customer user-1', 'checkout cus_new price_1 https://app.test']);
    expect(rows.get('user-1')?.customerId).toBe('cus_new');
  });

  test('reuses the customer of a returning user', async () => {
    const store = fakeStore([record()]);
    const { value, calls } = context({ store: () => store.store });

    await checkoutResponse({ request: post(), context: value });

    expect(calls).toEqual(['checkout cus_1 price_1 https://app.test']);
  });

  test('refuses a second subscription, asking Stripe even when the webhook has not arrived', async () => {
    const store = fakeStore([record()]);
    const { value } = context({ store: () => store.store, stripe: fakeStripe({ subscriptions: [remoteSubscription()] }).stripe });

    expect((await checkoutResponse({ request: post(), context: value })).status).toBe(409);
  });

  test.each([null, 'https://evil.test', 'junk'])('refuses a request from origin %p', async (origin) => {
    const { value, calls } = context();

    expect((await checkoutResponse({ request: post(origin), context: value })).status).toBe(403);
    expect(calls).toEqual([]);
  });

  test('asks to sign in', async () => {
    expect((await checkoutResponse({ request: post(), context: context({ user: null }).value })).status).toBe(401);
  });

  test.each([{ stripe: undefined }, { priceId: undefined }])('says it is unavailable when %p', async (missing) => {
    expect((await checkoutResponse({ request: post(), context: context(missing).value })).status).toBe(503);
  });
});

describe('portalResponse', () => {
  test('opens the portal of the signed-in user, never one named in the request', async () => {
    const store = fakeStore([record(), record({ userId: 'user-2', customerId: 'cus_2' })]);
    const { value } = context({ store: () => store.store });

    const response = await portalResponse({ request: post(), context: value });

    expect(await response.json()).toEqual({ url: 'https://portal.stripe.test/cus_1' });
  });

  test('has nothing to open for a user who never reached the checkout', async () => {
    expect((await portalResponse({ request: post(), context: context().value })).status).toBe(404);
  });

  test('refuses another origin', async () => {
    expect((await portalResponse({ request: post('https://evil.test'), context: context().value })).status).toBe(403);
  });
});
