import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';
import { securityHeaders } from './src/platform/security/headers';

const nextConfig: NextConfig = {
  // `next dev` would otherwise write its own block into the root AGENTS.md.
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  // PostHog posts to paths ending in a slash, and a redirect would lose those events.
  skipTrailingSlashRedirect: true,
  // Ties every Sentry error to the commit that produced it.
  env: { NEXT_PUBLIC_RELEASE: process.env.VERCEL_GIT_COMMIT_SHA ?? '', NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? '' },
  headers: async () => [{ source: '/(.*)', headers: securityHeaders }],
};

// Build-time only (source map upload). Applied on Vercel, where the upload credentials live.
export default process.env.VERCEL
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
    })
  : nextConfig;
