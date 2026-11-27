import type { BrowserAnalytics } from './client';
import { describe, expect, test } from 'bun:test';
import { createClientAnalytics } from './client';

const env = { key: 'phc_test', host: 'https://eu.i.posthog.com' };

function fakeSdk() {
  const calls: string[] = [];
  let options: Record<string, unknown> = {};
  let loads = 0;
  const sdk: BrowserAnalytics = {
    init: (key, given) => {
      options = given as Record<string, unknown>;
      calls.push(`init ${key}`);
    },
    opt_in_capturing: () => void calls.push('opt in'),
    opt_out_capturing: () => void calls.push('opt out'),
    capture: name => void calls.push(`capture ${name}`),
  };
  const load = async () => {
    loads += 1;
    return sdk;
  };
  return { load, calls, loads: () => loads, options: () => options };
}

describe('createClientAnalytics', () => {
  test('loads and captures nothing until it is started', async () => {
    const sdk = fakeSdk();
    const analytics = createClientAnalytics({ load: sdk.load, env });

    await analytics.capture('clicked');

    expect(sdk.loads()).toBe(0);
  });

  test('does nothing without a key', async () => {
    const sdk = fakeSdk();

    await createClientAnalytics({ load: sdk.load, env: undefined }).start();

    expect(sdk.loads()).toBe(0);
  });

  test('sends through the app itself, without recording clicks or the screen', async () => {
    const sdk = fakeSdk();

    await createClientAnalytics({ load: sdk.load, env }).start();

    expect(sdk.options()).toMatchObject({ api_host: '/ingest', ui_host: 'https://eu.posthog.com', autocapture: false, disable_session_recording: true });
  });

  test('stops capturing and forgets the visitor on withdrawal, then resumes on a new yes', async () => {
    const sdk = fakeSdk();
    const analytics = createClientAnalytics({ load: sdk.load, env });
    await analytics.start();
    localStorage.setItem('ph_phc_test_posthog', '{"distinct_id":"x"}');

    await analytics.stop();
    await analytics.capture('ignored');
    await analytics.start();
    await analytics.capture('clicked');

    expect(localStorage.getItem('ph_phc_test_posthog')).toBeNull();
    expect(sdk.calls).toEqual(['init phc_test', 'opt out', 'opt in', 'capture clicked']);
  });

  test('removes what an earlier visit left, without loading the SDK', async () => {
    const sdk = fakeSdk();
    localStorage.setItem('ph_phc_test_posthog', '{}');

    await createClientAnalytics({ load: sdk.load, env }).stop();

    expect(localStorage.getItem('ph_phc_test_posthog')).toBeNull();
    expect(sdk.loads()).toBe(0);
  });
});
