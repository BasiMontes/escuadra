export interface ContentSecurityPolicyInput {
  nonce: string
  isDev: boolean
  isHttps?: boolean
  supabaseUrl?: string
  turnstile?: boolean
  sentryDsn?: string
}

const turnstileOrigin = 'https://challenges.cloudflare.com';

function originOf(url: string | undefined): string[] {
  return url && URL.canParse(url) ? [new URL(url).origin] : [];
}

function supabaseSources(supabaseUrl: string | undefined): string[] {
  return originOf(supabaseUrl).flatMap(origin => [origin, origin.replace(/^http/, 'ws')]);
}

export function buildContentSecurityPolicy({ nonce, isDev, isHttps = true, supabaseUrl, turnstile, sentryDsn }: ContentSecurityPolicyInput): string {
  const captchaSources = turnstile ? [turnstileOrigin] : [];
  const scriptSources = ['\'self\'', `'nonce-${nonce}'`, '\'strict-dynamic\'', ...(isDev ? ['\'unsafe-eval\''] : [])];

  return [
    'default-src \'self\'',
    'base-uri \'self\'',
    'object-src \'none\'',
    'frame-ancestors \'none\'',
    'form-action \'self\'',
    'font-src \'self\'',
    // Without it a service worker falls back to `script-src`, where `strict-dynamic` ignores `self`.
    'worker-src \'self\'',
    'img-src \'self\' data: blob:',
    // A nonce cannot cover inline style attributes, and style injection is a far weaker vector than script injection.
    'style-src \'self\' \'unsafe-inline\'',
    `script-src ${scriptSources.join(' ')}`,
    `connect-src ${['\'self\'', ...supabaseSources(supabaseUrl), ...captchaSources, ...originOf(sentryDsn)].join(' ')}`,
    `frame-src ${['\'self\'', ...captchaSources].join(' ')}`,
    ...(isHttps && !isDev ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}
