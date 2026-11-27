import type { PushTarget } from './web-push';
import { createAdminClient } from '@/platform/supabase/admin';

export interface PushRecord extends PushTarget {
  userId: string
}

export interface PushStore {
  byEndpoint: (endpoint: string) => Promise<PushRecord | null>
  // Oldest first.
  byUser: (userId: string) => Promise<PushRecord[]>
  save: (record: PushRecord) => Promise<void>
  remove: (endpoint: string) => Promise<void>
}

interface Row {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

function toRecord(row: Row): PushRecord {
  return { userId: row.user_id, endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth };
}

function check<Result extends { error: { message: string } | null }>(result: Result): Result {
  if (result.error) { throw new Error(`push_subscriptions: ${result.error.message}`); }
  return result;
}

export function createPushStore(): PushStore {
  const table = () => createAdminClient().from('push_subscriptions');

  return {
    async byEndpoint(endpoint) {
      const { data } = check(await table().select('*').eq('endpoint', endpoint).maybeSingle());
      return data ? toRecord(data) : null;
    },
    async byUser(userId) {
      const { data } = check(await table().select('*').eq('user_id', userId).order('created_at'));
      return (data ?? []).map(toRecord);
    },
    async save(record) {
      check(await table().upsert({ user_id: record.userId, endpoint: record.endpoint, p256dh: record.p256dh, auth: record.auth }, { onConflict: 'endpoint' }));
    },
    async remove(endpoint) {
      check(await table().delete().eq('endpoint', endpoint));
    },
  };
}
