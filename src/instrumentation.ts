import * as Sentry from '@sentry/nextjs';
import { getSentryDsn } from '@/platform/env';
import { sentryOptions } from '@/platform/observability/sentry-options';

export function register() {
  const dsn = getSentryDsn();
  // Server errors are reported without a cookie choice: nothing comes from the visitor's device.
  if (dsn) { Sentry.init(sentryOptions(dsn)); }
}

export const onRequestError = Sentry.captureRequestError;
