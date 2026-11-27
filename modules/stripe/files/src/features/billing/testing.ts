import type { RemoteSubscription, StripeGateway } from '@/adapters/billing/stripe';
import type { SubscriptionRecord, SubscriptionStore } from '@/adapters/billing/subscriptions';

export function fakeStore(initial: SubscriptionRecord[] = []) {
  const rows = new Map(initial.map(row => [row.userId, row]));
  const store: SubscriptionStore = {
    byUser: async userId => rows.get(userId) ?? null,
    userIdByCustomer: async customerId => [...rows.values()].find(row => row.customerId === customerId)?.userId ?? null,
    save: async record => void rows.set(record.userId, record),
  };
  return { rows, store };
}

export function fakeStripe({ subscriptions = [], metadataUserId }: { subscriptions?: RemoteSubscription[], metadataUserId?: string } = {}) {
  const calls: string[] = [];
  const stripe: StripeGateway = {
    createCustomer: async ({ userId }) => {
      calls.push(`customer ${userId}`);
      return 'cus_new';
    },
    customerUserId: async () => metadataUserId,
    listSubscriptions: async () => subscriptions,
    checkoutUrl: async ({ customerId, priceId, origin }) => {
      calls.push(`checkout ${customerId} ${priceId} ${origin}`);
      return 'https://checkout.stripe.test/session';
    },
    portalUrl: async ({ customerId }) => `https://portal.stripe.test/${customerId}`,
  };
  return { calls, stripe };
}

export function remoteSubscription(overrides: Partial<RemoteSubscription> = {}): RemoteSubscription {
  return { id: 'sub_1', status: 'active', priceId: 'price_1', currentPeriodEnd: '2030-01-01T00:00:00.000Z', created: 1, ...overrides };
}

export function record(overrides: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
  return { userId: 'user-1', customerId: 'cus_1', subscriptionId: null, status: 'none', priceId: null, currentPeriodEnd: null, ...overrides };
}
