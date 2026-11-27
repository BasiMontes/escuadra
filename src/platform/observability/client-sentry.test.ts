import type { BrowserSentry } from './client-sentry';
import { describe, expect, test } from 'bun:test';
import { createClientSentry } from './client-sentry';

function fakeSdk() {
  const calls: string[] = [];
  let loads = 0;
  const sdk: BrowserSentry = {
    init: options => void calls.push(`init ${(options as { dsn: string }).dsn}`),
    close: async () => {
      calls.push('close');
      return true;
    },
    captureRouterTransitionStart: () => {},
  };
  const load = async () => {
    loads += 1;
    return sdk;
  };
  return { load, calls, loads: () => loads };
}

describe('createClientSentry', () => {
  test('loads nothing until it is started', () => {
    const sdk = fakeSdk();
    const sentry = createClientSentry({ load: sdk.load, dsn: 'dsn' });

    expect(sentry.current).toBeUndefined();
    expect(sdk.loads()).toBe(0);
  });

  test('does nothing without a DSN', async () => {
    const sdk = fakeSdk();

    await createClientSentry({ load: sdk.load, dsn: undefined }).start();

    expect(sdk.loads()).toBe(0);
  });

  test('starts once, closes on stop and can start again', async () => {
    const sdk = fakeSdk();
    const sentry = createClientSentry({ load: sdk.load, dsn: 'dsn' });

    await Promise.all([sentry.start(), sentry.start()]);
    await sentry.stop();
    await sentry.stop();
    await sentry.start();

    expect(sdk.calls).toEqual(['init dsn', 'close', 'init dsn']);
  });

  test('tries to load again after a failed load', async () => {
    const sdk = fakeSdk();
    let failures = 1;
    const sentry = createClientSentry({ dsn: 'dsn', load: async () => {
      if (failures-- > 0) { throw new Error('offline'); }
      return sdk.load();
    } });

    expect(await sentry.start().catch((error: Error) => error.message)).toBe('offline');
    await sentry.start();

    expect(sdk.calls).toEqual(['init dsn']);
  });
});
