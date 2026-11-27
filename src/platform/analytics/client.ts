import type { AnalyticsEnv } from '../env';
import { getAnalyticsEnv } from '../env';
import { scrubSecrets } from '../observability/scrub-secrets';

export interface BrowserAnalytics {
  init: (key: string, options: object) => void
  opt_in_capturing: () => void
  opt_out_capturing: () => void
  capture: (name: string, properties?: Record<string, unknown>) => void
}

function forgetVisitor(key: string) {
  const storageKey = `ph_${key}_posthog`;
  localStorage.removeItem(storageKey);
  document.cookie = `${storageKey}=; path=/; max-age=0; samesite=lax`;
}

export function createClientAnalytics({ load, env }: { load: () => Promise<BrowserAnalytics>, env: AnalyticsEnv | undefined }) {
  let initialized: Promise<BrowserAnalytics> | undefined;
  let capturing = false;

  async function initialize({ key, host }: AnalyticsEnv) {
    return load().then((sdk) => {
      sdk.init(key, {
        // Through this app (`src/proxy.ts`), so blockers that filter PostHog's domain do not drop events.
        api_host: '/ingest',
        ui_host: host.replace('.i.posthog.com', '.posthog.com'),
        capture_pageview: 'history_change',
        // Off by default: both record what is on screen. Turn them on only after reviewing what your pages show.
        autocapture: false,
        disable_session_recording: true,
        disable_surveys: true,
        before_send: <Event>(event: Event): Event => scrubSecrets(event),
      });
      return sdk;
    }).catch((error: unknown) => {
      initialized = undefined;
      throw error;
    });
  }

  return {
    async start(): Promise<void> {
      if (!env) { return; }
      capturing = true;
      if (initialized) {
        (await initialized).opt_in_capturing();
        return;
      }
      initialized = initialize(env);
      await initialized;
    },
    async stop(): Promise<void> {
      if (!env) { return; }
      capturing = false;
      // Opt out first: the other way round the SDK writes its storage back.
      (await initialized)?.opt_out_capturing();
      forgetVisitor(env.key);
    },
    async capture(name: string, properties?: Record<string, unknown>): Promise<void> {
      if (!capturing) { return; }
      (await initialized)?.capture(name, properties);
    },
  };
}

export const clientAnalytics = createClientAnalytics({
  load: async () => (await import('posthog-js')).default,
  env: getAnalyticsEnv(),
});
