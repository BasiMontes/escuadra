import { describe, expect, test } from 'bun:test';
import Stripe from 'stripe';
import { fakeStore, fakeStripe, record, remoteSubscription } from './testing';
import { webhookResponse } from './webhook';

const secret = 'whsec_test_only';

async function signed({ type, object, signedWith = secret, timestamp }: { type: string, object: object, signedWith?: string, timestamp?: number }) {
  const payload = JSON.stringify({ id: 'evt_1', object: 'event', type, data: { object } });
  const signature = await Stripe.webhooks.generateTestHeaderStringAsync({ payload, secret: signedWith, timestamp });
  return new Request('https://app.test/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body: payload });
}

function setup() {
  const store = fakeStore([record()]);
  const stripe = fakeStripe({ subscriptions: [remoteSubscription()] });
  return { rows: store.rows, deps: { secret, stripe: stripe.stripe, store: () => store.store } };
}

const updated = { type: 'customer.subscription.updated', object: { object: 'subscription', customer: 'cus_1' } };

describe('webhookResponse', () => {
  test('syncs the customer of a signed subscription event', async () => {
    const { rows, deps } = setup();

    const response = await webhookResponse({ request: await signed(updated), ...deps });

    expect(response.status).toBe(200);
    expect(rows.get('user-1')?.status).toBe('active');
  });

  test.each([
    ['a signature made with another secret', { signedWith: 'whsec_forged' }],
    ['a signature that is too old', { timestamp: 1_000_000 }],
  ])('rejects %s and changes nothing', async (_label, change) => {
    const { rows, deps } = setup();

    const response = await webhookResponse({ request: await signed({ ...updated, ...change }), ...deps });

    expect(response.status).toBe(400);
    expect(rows.get('user-1')?.status).toBe('none');
  });

  test('rejects an unsigned request', async () => {
    const request = new Request('https://app.test/api/stripe/webhook', { method: 'POST', body: '{}' });

    expect((await webhookResponse({ request, ...setup().deps })).status).toBe(400);
  });

  test('acknowledges an event it does not use', async () => {
    const { rows, deps } = setup();

    const response = await webhookResponse({ request: await signed({ type: 'product.created', object: { object: 'product' } }), ...deps });

    expect(response.status).toBe(200);
    expect(rows.get('user-1')?.status).toBe('none');
  });

  test('answers an error when the copy fails, so Stripe sends the event again', async () => {
    const { deps } = setup();
    const original = console.error;
    console.error = () => {};

    const response = await webhookResponse({ request: await signed(updated), ...deps, store: () => {
      throw new Error('database down');
    } });
    console.error = original;

    expect(response.status).toBe(500);
  });

  test('says it is unavailable without its secret', async () => {
    expect((await webhookResponse({ request: await signed(updated), ...setup().deps, secret: undefined })).status).toBe(503);
  });
});
