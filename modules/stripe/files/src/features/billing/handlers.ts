import type { BillingContext } from './requests';
import { getSignedInUser } from '@features/auth';
import { getStripeGateway } from '@/adapters/billing/stripe';
import { createSubscriptionStore } from '@/adapters/billing/subscriptions';
import { checkoutResponse, portalResponse } from './requests';
import { webhookResponse } from './webhook';

async function currentContext(): Promise<BillingContext> {
  return {
    user: await getSignedInUser(),
    stripe: getStripeGateway(),
    store: createSubscriptionStore,
    priceId: process.env.STRIPE_PRICE_ID,
  };
}

export async function handleCheckout(request: Request) {
  return checkoutResponse({ request, context: await currentContext() });
}

export async function handlePortal(request: Request) {
  return portalResponse({ request, context: await currentContext() });
}

export async function handleStripeWebhook(request: Request) {
  return webhookResponse({ request, secret: process.env.STRIPE_WEBHOOK_SECRET, stripe: getStripeGateway(), store: createSubscriptionStore });
}
