import { describe, expect, test } from 'bun:test';
import { WebPushError } from 'web-push';
import { getPushSender } from './web-push';

const env = { NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'private', VAPID_SUBJECT: 'mailto:team@example.test' };
const target = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: 'key', auth: 'secret' };

function failingWith(status: number) {
  return async () => {
    throw new WebPushError('refused', status, {}, '', target.endpoint);
  };
}

describe('getPushSender', () => {
  test.each(Object.keys(env))('is off without %s', (name) => {
    expect(getPushSender({ env: { ...env, [name]: '' } })).toBeUndefined();
  });

  test('signs the message with the configured keys and gives up after a while', async () => {
    const calls: unknown[][] = [];
    const send = getPushSender({ env, deliver: async (...args) => {
      calls.push(args);
      return { statusCode: 201, body: '', headers: {} };
    } })!;

    expect(await send({ target, payload: '{}' })).toBe('sent');
    expect(calls[0]).toEqual([
      { endpoint: target.endpoint, keys: { p256dh: 'key', auth: 'secret' } },
      '{}',
      { vapidDetails: { subject: 'mailto:team@example.test', publicKey: 'public', privateKey: 'private' }, TTL: 86_400, timeout: 10_000 },
    ]);
  });

  test.each([404, 410])('reports a subscription the service says is gone (%p)', async (status) => {
    expect(await getPushSender({ env, deliver: failingWith(status) })!({ target, payload: '{}' })).toBe('gone');
  });

  test('passes on any other failure', async () => {
    const failure = await getPushSender({ env, deliver: failingWith(500) })!({ target, payload: '{}' }).catch((reason: unknown) => reason);

    expect(failure).toBeInstanceOf(WebPushError);
  });
});
