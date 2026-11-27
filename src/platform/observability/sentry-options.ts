import { scrubSecrets } from './scrub-secrets';

export function sentryOptions(dsn: string) {
  return {
    dsn,
    // Next inlines this one at build time, so the browser and the server report the same release.
    release: process.env.NEXT_PUBLIC_RELEASE || undefined,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    // Low on purpose, to stay inside a free plan.
    tracesSampleRate: 0.1,
    // Errors need none of this, and every item here can carry personal data.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
      genAI: { inputs: false, outputs: false },
    },
    beforeSend: <Event>(event: Event): Event => scrubSecrets(event),
    beforeSendSpan: <Span>(span: Span): Span => scrubSecrets(span),
  };
}
