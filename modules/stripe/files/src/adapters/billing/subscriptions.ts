import { createAdminClient } from '@/platform/supabase/admin';

export interface SubscriptionRecord {
  userId: string
  customerId: string
  subscriptionId: string | null
  status: string
  priceId: string | null
  currentPeriodEnd: string | null
}

export interface SubscriptionStore {
  byUser: (userId: string) => Promise<SubscriptionRecord | null>
  userIdByCustomer: (customerId: string) => Promise<string | null>
  save: (record: SubscriptionRecord) => Promise<void>
}

interface Row {
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  status: string
  price_id: string | null
  current_period_end: string | null
}

export function toRecord(row: Row): SubscriptionRecord {
  return {
    userId: row.user_id,
    customerId: row.stripe_customer_id,
    subscriptionId: row.stripe_subscription_id,
    status: row.status,
    priceId: row.price_id,
    currentPeriodEnd: row.current_period_end,
  };
}

export function check<Result extends { error: { message: string } | null }>(result: Result): Result {
  if (result.error) { throw new Error(`subscriptions: ${result.error.message}`); }
  return result;
}

export function createSubscriptionStore(): SubscriptionStore {
  const table = () => createAdminClient().from('subscriptions');

  return {
    async byUser(userId) {
      const { data } = check(await table().select('*').eq('user_id', userId).maybeSingle());
      return data ? toRecord(data) : null;
    },
    async userIdByCustomer(customerId) {
      const { data } = check(await table().select('user_id').eq('stripe_customer_id', customerId).maybeSingle());
      return data?.user_id ?? null;
    },
    async save(record) {
      check(await table().upsert({
        user_id: record.userId,
        stripe_customer_id: record.customerId,
        stripe_subscription_id: record.subscriptionId,
        status: record.status,
        price_id: record.priceId,
        current_period_end: record.currentPeriodEnd,
        updated_at: new Date().toISOString(),
      }));
    },
  };
}
