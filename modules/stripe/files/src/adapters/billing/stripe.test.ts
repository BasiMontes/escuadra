import type Stripe from 'stripe';
import { describe, expect, test } from 'bun:test';
import { createStripeGateway, getStripeGateway } from './stripe';

describe('getStripeGateway', () => {
  test('is off without a secret key', () => {
    expect(getStripeGateway('')).toBeUndefined();
  });
});

describe('createStripeGateway', () => {
  test('creates one customer per user, however many times it is asked', async () => {
    const calls: unknown[][] = [];
    const stripe = { customers: { create: async (...args: unknown[]) => {
      calls.push(args);
      return { id: 'cus_1' };
    } } } as unknown as Stripe;

    expect(await createStripeGateway(stripe).createCustomer({ userId: 'user-1', email: 'a@example.test' })).toBe('cus_1');
    expect(calls[0]).toEqual([{ email: 'a@example.test', metadata: { user_id: 'user-1' } }, { idempotencyKey: 'customer-for-user-1' }]);
  });

  test('reads the period end and price from the subscription item', async () => {
    const stripe = { subscriptions: { list: async () => ({ data: [{ id: 'sub_1', status: 'active', created: 10, items: { data: [{ current_period_end: 1_800_000_000, price: { id: 'price_1' } }] } }] }) } } as unknown as Stripe;

    expect(await createStripeGateway(stripe).listSubscriptions('cus_1'))
      .toEqual([{ id: 'sub_1', status: 'active', priceId: 'price_1', currentPeriodEnd: '2027-01-15T08:00:00.000Z', created: 10 }]);
  });
});
