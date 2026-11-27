import type { PushRecord, PushStore } from '@/adapters/push/subscriptions';

export function fakeStore(initial: PushRecord[] = []) {
  const rows = new Map(initial.map(row => [row.endpoint, row]));
  const store: PushStore = {
    byEndpoint: async endpoint => rows.get(endpoint) ?? null,
    byUser: async userId => [...rows.values()].filter(row => row.userId === userId),
    save: async record => void rows.set(record.endpoint, record),
    remove: async endpoint => void rows.delete(endpoint),
  };
  return { rows, store };
}

export function record(overrides: Partial<PushRecord> = {}): PushRecord {
  return { userId: 'user-1', endpoint: 'https://fcm.googleapis.com/fcm/send/one', p256dh: 'p'.repeat(87), auth: 'a'.repeat(22), ...overrides };
}
