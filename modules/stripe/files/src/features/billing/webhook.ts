import type { StripeGateway } from '@/adapters/billing/stripe';
import type { SubscriptionStore } from '@/adapters/billing/subscriptions';
import { readWebhook } from '@/adapters/billing/stripe';
import { syncCustomer } from './sync';

// Register the same list on the endpoint in the Stripe dashboard.
const handled = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.paid',
  'invoice.payment_failed',
]);

interface WebhookInput {
  request: Request
  secret: string | undefined
  stripe: StripeGateway | undefined
  store: () => SubscriptionStore
}

export async function webhookResponse({ request, secret, stripe, store }: WebhookInput): Promise<Response> {
  if (!secret || !stripe) { return new Response('Payments are not configured', { status: 503 }); }

  let event;
  try {
    event = await readWebhook({ payload: await request.text(), signature: request.headers.get('stripe-signature') ?? '', secret });
  }
  catch {
    return new Response('Invalid signature', { status: 400 });
  }
  if (!handled.has(event.type)) { return new Response('Ignored'); }

  const { customer } = event.data.object as { customer?: unknown };
  if (typeof customer !== 'string') { return new Response('Ignored'); }
  try {
    await syncCustomer({ customerId: customer, stripe, store: store() });
  }
  catch (error) {
    console.error(`Stripe event ${event.id} was not applied`, error);
    return new Response('Not applied', { status: 500 });
  }
  return new Response('Applied');
}
