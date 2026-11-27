import Stripe from 'stripe';

export interface RemoteSubscription {
  id: string
  status: string
  priceId: string | null
  currentPeriodEnd: string | null
  created: number
}

export interface StripeGateway {
  createCustomer: (input: { userId: string, email: string | undefined }) => Promise<string>
  customerUserId: (customerId: string) => Promise<string | undefined>
  listSubscriptions: (customerId: string) => Promise<RemoteSubscription[]>
  checkoutUrl: (input: { customerId: string, priceId: string, origin: string }) => Promise<string>
  portalUrl: (input: { customerId: string, origin: string }) => Promise<string>
}

function toSubscription(subscription: Stripe.Subscription): RemoteSubscription {
  const item = subscription.items.data[0];
  return {
    id: subscription.id,
    status: subscription.status,
    priceId: item?.price.id ?? null,
    currentPeriodEnd: item ? new Date(item.current_period_end * 1000).toISOString() : null,
    created: subscription.created,
  };
}

export function createStripeGateway(stripe: Stripe): StripeGateway {
  return {
    async createCustomer({ userId, email }) {
      // The key makes a double click, or a retry, return the same customer instead of a second one.
      const customer = await stripe.customers.create({ email, metadata: { user_id: userId } }, { idempotencyKey: `customer-for-${userId}` });
      return customer.id;
    },
    async customerUserId(customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      return customer.deleted ? undefined : customer.metadata.user_id;
    },
    async listSubscriptions(customerId) {
      const list = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
      return list.data.map(toSubscription);
    },
    async checkoutUrl({ customerId, priceId, origin }) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/billing?checkout=success`,
        cancel_url: `${origin}/billing`,
      });
      if (!session.url) { throw new Error('Stripe returned a checkout session without a URL'); }
      return session.url;
    },
    async portalUrl({ customerId, origin }) {
      return (await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/billing` })).url;
    },
  };
}

export function getStripeGateway(secretKey: string | undefined = process.env.STRIPE_SECRET_KEY): StripeGateway | undefined {
  return secretKey ? createStripeGateway(new Stripe(secretKey)) : undefined;
}

// Throws unless `payload` carries a recent signature made with `secret`. It must be the raw body, byte for byte.
export async function readWebhook({ payload, signature, secret }: { payload: string, signature: string, secret: string }) {
  return Stripe.webhooks.constructEventAsync(payload, signature, secret);
}
