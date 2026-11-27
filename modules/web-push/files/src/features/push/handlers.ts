import type { Notification } from './notify';
import type { PushContext } from './requests';
import { getSignedInUser } from '@features/auth';
import { createPushStore } from '@/adapters/push/subscriptions';
import { getPushSender } from '@/adapters/push/web-push';
import { notifyUser } from './notify';
import { subscribeResponse, testResponse, unsubscribeResponse } from './requests';

async function currentContext(): Promise<PushContext> {
  return { user: await getSignedInUser(), store: createPushStore, sender: getPushSender() };
}

export async function handleSubscribe(request: Request) {
  return subscribeResponse({ request, context: await currentContext() });
}

export async function handleUnsubscribe(request: Request) {
  return unsubscribeResponse({ request, context: await currentContext() });
}

export async function handleTestNotification(request: Request) {
  return testResponse({ request, context: await currentContext() });
}

// What the notifications screen needs. No public key means push is not configured, and the store is not touched.
export async function readPushSetup(userId: string) {
  if (!getPushSender() || !process.env.SUPABASE_SECRET_KEY) { return { publicKey: undefined, knownEndpoints: [] }; }
  const devices = await createPushStore().byUser(userId);
  return { publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, knownEndpoints: devices.map(device => device.endpoint) };
}

// It does not check who is asking: call it only once the server has decided this user should be told.
/** @public */
export async function notify({ userId, notification }: { userId: string, notification: Notification }) {
  const sender = getPushSender();
  if (!sender) { throw new Error('Web Push is not configured: set the VAPID variables'); }
  return notifyUser({ userId, notification, store: createPushStore(), sender });
}
