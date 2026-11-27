export type ConsentDecision = 'accepted' | 'rejected';

export const consentCookieName = 'consent';

// Raise it whenever the privacy or cookie texts change: every earlier choice stops counting and is asked again.
const consentVersion = '1';

const oneYear = 60 * 60 * 24 * 365;

export function serializeConsent(decision: ConsentDecision, now: number = Date.now()): string {
  return [decision, consentVersion, Math.floor(now / 1000)].join('~');
}

export function parseConsent(value: string | undefined): ConsentDecision | null {
  const [decision, version, decidedAt, ...rest] = (value ?? '').split('~');
  const isDecision = decision === 'accepted' || decision === 'rejected';
  if (!isDecision || version !== consentVersion || !(Number(decidedAt) > 0) || rest.length > 0) { return null; }

  return decision;
}

// Storing the choice itself needs no consent: remembering it is strictly necessary.
export function writeConsent(decision: ConsentDecision): void {
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${consentCookieName}=${serializeConsent(decision)}; path=/; max-age=${oneYear}; samesite=lax${secure}`;
}
