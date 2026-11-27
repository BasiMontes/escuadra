import type { PushStore } from '@/adapters/push/subscriptions';
import type { PushSender } from '@/adapters/push/web-push';

export interface Notification {
  title: string
  body: string
  // A path in this app, opened when the notification is tapped.
  url?: string
}

interface NotifyInput {
  userId: string
  notification: Notification
  store: PushStore
  sender: PushSender
}

export async function notifyUser({ userId, notification, store, sender }: NotifyInput) {
  const payload = JSON.stringify(notification);
  const outcomes = await Promise.all((await store.byUser(userId)).map(async (target) => {
    try {
      const outcome = await sender({ target, payload });
      if (outcome === 'gone') { await store.remove(target.endpoint); }
      return outcome;
    }
    catch (error) {
      // The message only: the error also carries the address, which lets anyone holding it reach the device.
      console.error(`Push notification not sent: ${error instanceof Error ? error.message : String(error)}`);
      return 'failed';
    }
  }));

  return {
    sent: outcomes.filter(outcome => outcome === 'sent').length,
    removed: outcomes.filter(outcome => outcome === 'gone').length,
    failed: outcomes.filter(outcome => outcome === 'failed').length,
  };
}
