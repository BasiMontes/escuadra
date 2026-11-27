import { describe, expect, test } from 'bun:test';
import { syncCustomer } from './sync';
import { fakeStore, fakeStripe, record, remoteSubscription } from './testing';

describe('syncCustomer', () => {
  test('copies what Stripe says now, so a repeated or late event changes nothing', async () => {
    const { rows, store } = fakeStore([record()]);
    const { stripe } = fakeStripe({ subscriptions: [remoteSubscription()] });

    await syncCustomer({ customerId: 'cus_1', stripe, store });
    const first = rows.get('user-1');
    await syncCustomer({ customerId: 'cus_1', stripe, store });

    expect(rows.get('user-1')).toEqual(first);
    expect(first).toMatchObject({ status: 'active', subscriptionId: 'sub_1', priceId: 'price_1' });
  });

  test('keeps the live subscription over a newer cancelled one', async () => {
    const { rows, store } = fakeStore([record()]);
    const { stripe } = fakeStripe({ subscriptions: [remoteSubscription({ id: 'sub_old', status: 'canceled', created: 9 }), remoteSubscription({ id: 'sub_live', created: 1 })] });

    await syncCustomer({ customerId: 'cus_1', stripe, store });

    expect(rows.get('user-1')?.subscriptionId).toBe('sub_live');
  });

  test('shows the newest one when none is live, and none when Stripe has none', async () => {
    const { rows, store } = fakeStore([record()]);
    await syncCustomer({ customerId: 'cus_1', store, stripe: fakeStripe({ subscriptions: [remoteSubscription({ id: 'a', status: 'canceled', created: 1 }), remoteSubscription({ id: 'b', status: 'past_due', created: 2 })] }).stripe });
    expect(rows.get('user-1')?.status).toBe('past_due');

    await syncCustomer({ customerId: 'cus_1', store, stripe: fakeStripe().stripe });

    expect(rows.get('user-1')).toMatchObject({ status: 'none', subscriptionId: null });
  });

  test('finds the user of a customer it has no row for through Stripe', async () => {
    const { rows, store } = fakeStore();

    await syncCustomer({ customerId: 'cus_9', store, stripe: fakeStripe({ metadataUserId: 'user-9', subscriptions: [remoteSubscription()] }).stripe });

    expect(rows.get('user-9')?.customerId).toBe('cus_9');
  });

  test('ignores a customer that belongs to nobody here', async () => {
    const { rows, store } = fakeStore();
    const original = console.warn;
    console.warn = () => {};

    await syncCustomer({ customerId: 'cus_other', store, stripe: fakeStripe().stripe });
    console.warn = original;

    expect(rows.size).toBe(0);
  });
});
