// A browser always sends `Origin` on a POST: one that does not match the host comes from another site.
export function ownOrigin(request: Request): string | null {
  const origin = request.headers.get('origin');
  if (!origin || !URL.canParse(origin)) { return null; }
  return new URL(origin).host === request.headers.get('host') ? new URL(origin).origin : null;
}
