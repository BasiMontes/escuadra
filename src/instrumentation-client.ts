import { clientSentry } from '@/platform/observability/client-sentry';

// The SDK is not started here: it starts only after the visitor accepts (`features/consent`).
export function onRouterTransitionStart(url: string, navigationType: string) {
  void clientSentry.current?.then(sentry => sentry.captureRouterTransitionStart(url, navigationType));
}
