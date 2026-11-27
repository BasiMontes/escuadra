import type { ConsentDecision } from '@/platform/consent/cookie';
import type { AnalyticsEnv } from '@/platform/env';
import { PostHog } from 'posthog-node';
import { getAnalyticsEnv } from '@/platform/env';

interface ServerEvent {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
}

export interface ServerAnalyticsClient {
  captureImmediate: (event: ServerEvent) => Promise<void>
}

function connectPostHog({ key, host }: AnalyticsEnv): ServerAnalyticsClient {
  // Sent one by one: a serverless function can stop before a batch is flushed.
  return new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
}

export function createServerCapture({ env, connect = connectPostHog }: { env: AnalyticsEnv | undefined, connect?: (env: AnalyticsEnv) => ServerAnalyticsClient }) {
  let client: ServerAnalyticsClient | undefined;

  // `consent` is required, so no caller can forget it. Read it with `parseConsent` from the request's cookie.
  return async ({ consent, ...event }: ServerEvent & { consent: ConsentDecision | null }): Promise<void> => {
    if (!env || consent !== 'accepted') { return; }
    try {
      client ??= connect(env);
      await client.captureImmediate(event);
    }
    catch (error) {
      console.error('Analytics event not sent', error);
    }
  };
}

/** @public */
export const captureServerEvent = createServerCapture({ env: getAnalyticsEnv() });
