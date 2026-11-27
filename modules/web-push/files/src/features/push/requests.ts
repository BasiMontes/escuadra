import type { PushStore } from '@/adapters/push/subscriptions';
import type { PushSender } from '@/adapters/push/web-push';
import { z } from 'zod';
import { ownOrigin } from '@/platform/security/same-origin';
import { isPushServiceEndpoint } from './endpoint';
import { notifyUser } from './notify';

export interface PushContext {
  user: { id: string } | null
  // A function: the store needs the secret key, which a project without push does not have.
  store: () => PushStore
  sender: PushSender | undefined
}

export const maximumDevices = 10;

const key = z.string().min(1).max(200).regex(/^[\w-]+={0,2}$/);
const subscriptionBody = z.object({
  endpoint: z.string().refine(isPushServiceEndpoint),
  keys: z.object({ p256dh: key, auth: key }),
});
const removalBody = z.object({ endpoint: z.string().min(1).max(2048) });

function refuse(status: number, error: string) {
  return Response.json({ error }, { status });
}

const done = () => new Response(null, { status: 204 });

function admit({ request, context }: { request: Request, context: PushContext }) {
  if (!ownOrigin(request)) { return { refusal: refuse(403, 'forbidden') }; }
  if (!context.user) { return { refusal: refuse(401, 'signed_out') }; }
  return { userId: context.user.id };
}

const readJson = async (request: Request): Promise<unknown> => request.json().catch(() => null);

export async function subscribeResponse({ request, context }: { request: Request, context: PushContext }): Promise<Response> {
  const { refusal, userId } = admit({ request, context });
  if (refusal) { return refusal; }
  if (!context.sender) { return refuse(503, 'not_configured'); }
  const body = subscriptionBody.safeParse(await readJson(request));
  if (!body.success) { return refuse(400, 'invalid_subscription'); }

  const { endpoint, keys } = body.data;
  const store = context.store();
  const existing = await store.byEndpoint(endpoint);
  // Only the browser that created a subscription knows its keys.
  if (existing && existing.userId !== userId && (existing.p256dh !== keys.p256dh || existing.auth !== keys.auth)) {
    return refuse(409, 'already_registered');
  }
  const others = (await store.byUser(userId)).filter(device => device.endpoint !== endpoint);
  const excess = others.slice(0, Math.max(0, others.length - maximumDevices + 1));
  await Promise.all(excess.map(async device => store.remove(device.endpoint)));
  await store.save({ userId, endpoint, ...keys });
  return done();
}

export async function unsubscribeResponse({ request, context }: { request: Request, context: PushContext }): Promise<Response> {
  const { refusal, userId } = admit({ request, context });
  if (refusal) { return refusal; }
  const body = removalBody.safeParse(await readJson(request));
  if (!body.success) { return refuse(400, 'invalid_subscription'); }

  const store = context.store();
  if ((await store.byEndpoint(body.data.endpoint))?.userId === userId) { await store.remove(body.data.endpoint); }
  return done();
}

export async function testResponse({ request, context }: { request: Request, context: PushContext }): Promise<Response> {
  const { refusal, userId } = admit({ request, context });
  if (refusal) { return refusal; }
  if (!context.sender) { return refuse(503, 'not_configured'); }

  const notification = { title: 'Test notification', body: 'Notifications work on this device.', url: '/notifications' };
  return Response.json(await notifyUser({ userId, notification, store: context.store(), sender: context.sender }));
}
