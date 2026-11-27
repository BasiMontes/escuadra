import type { RemoteSubscription, StripeGateway } from '@/adapters/billing/stripe';
import type { SubscriptionStore } from '@/adapters/billing/subscriptions';
import { isEntitled } from './entitlement';

function currentOf(subscriptions: RemoteSubscription[]): RemoteSubscription | undefined {
  const newestFirst = [...subscriptions].sort((a, b) => b.created - a.created);
  return newestFirst.find(subscription => isEntitled(subscription.status)) ?? newestFirst[0];
}

// Events arrive repeated and out of order, so their contents are not applied: the state is asked to Stripe again.
export async function syncCustomer({ customerId, stripe, store }: { customerId: string, stripe: StripeGateway, store: SubscriptionStore }) {
  const userId = await store.userIdByCustomer(customerId) ?? await stripe.customerUserId(customerId);
  if (!userId) {
    console.warn(`Stripe customer ${customerId} belongs to no user of this app`);
    return;
  }
  const current = currentOf(await stripe.listSubscriptions(customerId));
  await store.save({
    userId,
    customerId,
    subscriptionId: current?.id ?? null,
    status: current?.status ?? 'none',
    priceId: current?.priceId ?? null,
    currentPeriodEnd: current?.currentPeriodEnd ?? null,
  });
}
