import { getSentryDsn } from '../env';
import { sentryOptions } from './sentry-options';

export interface BrowserSentry {
  init: (options: ReturnType<typeof sentryOptions>) => unknown
  close: () => PromiseLike<boolean>
  captureRouterTransitionStart: (url: string, navigationType: string) => void
}

export function createClientSentry({ load, dsn }: { load: () => Promise<BrowserSentry>, dsn: string | undefined }) {
  let started: Promise<BrowserSentry> | undefined;

  return {
    async start(): Promise<void> {
      if (!dsn) { return; }
      started ??= load().then((sdk) => {
        sdk.init(sentryOptions(dsn));
        return sdk;
      }).catch((error: unknown) => {
        started = undefined;
        throw error;
      });
      await started;
    },
    async stop(): Promise<void> {
      const running = started;
      started = undefined;
      await (await running)?.close();
    },
    // A getter, so it stays synchronous: `undefined` means the SDK was never started.
    get current() {
      return started;
    },
  };
}

// A dynamic import: a visitor who never accepts never downloads the SDK.
export const clientSentry = createClientSentry({
  load: async () => import('@sentry/nextjs'),
  dsn: getSentryDsn(),
});
