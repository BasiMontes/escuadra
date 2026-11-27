import type { SubscriptionRecord } from './subscriptions';
import { createClient } from '@/platform/supabase/server';
import { check, toRecord } from './subscriptions';

// Reads with the visitor's own session, so Row Level Security decides what comes back.
export async function readOwnSubscription(): Promise<SubscriptionRecord | null> {
  const supabase = await createClient();
  const { data } = check(await supabase.from('subscriptions').select('*').maybeSingle());
  return data ? toRecord(data) : null;
}
