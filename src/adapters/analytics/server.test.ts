import type { ServerAnalyticsClient } from './server';
import { describe, expect, test } from 'bun:test';
import { createServerCapture } from './server';

const env = { key: 'phc_test', host: 'https://eu.i.posthog.com' };

function fakeClient(failure?: Error) {
  const sent: unknown[] = [];
  const client: ServerAnalyticsClient = {
    captureImmediate: async (event) => {
      if (failure) { throw failure; }
      sent.push(event);
    },
  };
  return { sent, connect: () => client };
}

const event = { distinctId: 'user-1', event: 'subscribed', properties: { plan: 'pro' } };

describe('createServerCapture', () => {
  test('sends the event when the visitor accepted', async () => {
    const fake = fakeClient();

    await createServerCapture({ env, connect: fake.connect })({ ...event, consent: 'accepted' });

    expect(fake.sent).toEqual([event]);
  });

  test.each(['rejected', null] as const)('sends nothing when the choice is %p', async (consent) => {
    const fake = fakeClient();

    await createServerCapture({ env, connect: fake.connect })({ ...event, consent });

    expect(fake.sent).toEqual([]);
  });

  test('sends nothing without a key', async () => {
    const fake = fakeClient();

    await createServerCapture({ env: undefined, connect: fake.connect })({ ...event, consent: 'accepted' });

    expect(fake.sent).toEqual([]);
  });

  test('never breaks the caller when PostHog fails', async () => {
    const capture = createServerCapture({ env, connect: fakeClient(new Error('down')).connect });
    const original = console.error;
    console.error = () => {};

    expect(await capture({ ...event, consent: 'accepted' })).toBeUndefined();
    console.error = original;
  });
});
