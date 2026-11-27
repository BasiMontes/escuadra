# Payments with Stripe

Subscriptions through Stripe Checkout, the customer portal to manage them and a webhook that keeps `public.subscriptions` in step. Pages: `/billing`.

## Set up

1. In Stripe, create a product with a recurring price. Work in test mode until the whole flow has been tried.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` and `SUPABASE_SECRET_KEY`.
3. Add a webhook endpoint at `<app address>/api/stripe/webhook` with the events listed in `src/features/billing/webhook.ts`, and set `STRIPE_WEBHOOK_SECRET`. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. Turn on the customer portal, and "limit customers to one subscription" in the Checkout settings: it covers two checkouts left open at once.
5. Apply the migration to the hosted project: `supabase db push --linked` (dry run first).
6. Add to the privacy policy that Stripe processes payments.

Without the keys the pages work and the buttons say payments are unavailable.

## Checking access

```ts
const subscription = await readOwnSubscription();
if (!isEntitled(subscription?.status)) { /* offer the subscription */ }
```

Check it on the server. A screen that hides a button is not access control: anything paid also needs the rule in the database or in the action that serves it.

## How it stays correct

- The webhook applies nothing from the event itself. It asks Stripe for the customer's subscriptions again, so repeated and out-of-order events end in the same state.
- Users can read their own row and write nothing.
- Checkout refuses a second subscription even when the first webhook has not arrived.

## Not included

Free trials, refunds, disputes, a scheduled reconciliation, and cancelling the subscription when an account is deleted. Add the last one before letting people delete their account.
