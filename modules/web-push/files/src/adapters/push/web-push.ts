import { sendNotification, WebPushError } from 'web-push';

export interface PushTarget {
  endpoint: string
  p256dh: string
  auth: string
}

export type PushSender = (input: { target: PushTarget, payload: string }) => Promise<'sent' | 'gone'>;

interface SenderOptions {
  env?: Record<string, string | undefined>
  deliver?: typeof sendNotification
}

const oneDayInSeconds = 24 * 60 * 60;

export function getPushSender({ env = process.env, deliver = sendNotification }: SenderOptions = {}): PushSender | undefined {
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) { return undefined; }

  return async ({ target, payload }) => {
    try {
      await deliver(
        { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
        payload,
        { vapidDetails: { subject, publicKey, privateKey }, TTL: oneDayInSeconds, timeout: 10_000 },
      );
      return 'sent';
    }
    catch (error) {
      if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) { return 'gone'; }
      throw error;
    }
  };
}
