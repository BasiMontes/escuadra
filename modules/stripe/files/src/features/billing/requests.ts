import type { StripeGateway } from '@/adapters/billing/stripe';
import type { SubscriptionStore } from '@/adapters/billing/subscriptions';
import { ownOrigin } from '@/platform/security/same-origin';
import { isEntitled } from './entitlement';

export interface BillingContext {
  user: { id: string, email: string | undefined } | null
  stripe: StripeGateway | undefined
  // A function: the store needs the secret key, which a project without payments does not have.
  store: () => SubscriptionStore
  priceId: string | undefined
}

function refuse(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function checkoutResponse({ request, context }: { request: Request, context: BillingContext }): Promise<Response> {
  const origin = ownOrigin(request);
  const { user, stripe, priceId } = context;
  if (!origin) { return refuse(403, 'forbidden'); }
  if (!user) { return refuse(401, 'signed_out'); }
  if (!stripe || !priceId) { return refuse(503, 'not_configured'); }

  const store = context.store();
  let customerId = (await store.byUser(user.id))?.customerId;
  if (customerId) {
    const live = (await stripe.listSubscriptions(customerId)).some(subscription => isEntitled(subscription.status));
    if (live) { return refuse(409, 'already_subscribed'); }
  }
  else {
    customerId = await stripe.createCustomer({ userId: user.id, email: user.email });
    await store.save({ userId: user.id, customerId, subscriptionId: null, status: 'none', priceId: null, currentPeriodEnd: null });
  }

  return Response.json({ url: await stripe.checkoutUrl({ customerId, priceId, origin }) });
}

export async function portalResponse({ request, context }: { request: Request, context: BillingContext }): Promise<Response> {
  const origin = ownOrigin(request);
  const { user, stripe } = context;
  if (!origin) { return refuse(403, 'forbidden'); }
  if (!user) { return refuse(401, 'signed_out'); }
  if (!stripe) { return refuse(503, 'not_configured'); }

  const customerId = (await context.store().byUser(user.id))?.customerId;
  if (!customerId) { return refuse(404, 'no_customer'); }

  return Response.json({ url: await stripe.portalUrl({ customerId, origin }) });
}
