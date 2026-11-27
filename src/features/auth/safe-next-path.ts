const base = 'http://app.invalid';

export function safeNextPath(raw: string | null | undefined): string {
  // Browsers read `\` as `/`, so `/\host` leaves the app.
  if (!raw || !raw.startsWith('/') || raw.includes('\\') || !URL.canParse(raw, base)) { return '/'; }

  const { origin, pathname, search, hash } = new URL(raw, base);
  // Resolving can still produce `//host`, for example from `/..//host`.
  if (origin !== base || pathname.startsWith('//')) { return '/'; }

  return `${pathname}${search}${hash}`;
}

export function postLoginPath(next: string | null | undefined): string {
  const target = safeNextPath(next);
  return target === '/' || target.startsWith('/login') ? '/account' : target;
}
