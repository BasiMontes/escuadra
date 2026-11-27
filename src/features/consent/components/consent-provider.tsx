'use client';

import type { ReactNode } from 'react';
import type { Consent } from './consent-context';
import type { ConsentDecision } from '@/platform/consent/cookie';
import { useMemo, useState } from 'react';
import { writeConsent } from '@/platform/consent/cookie';
import { ConsentContext } from './consent-context';

interface ConsentProviderProps {
  // Read from the cookie on the server, so the banner does not flash on a return visit.
  initialDecision: ConsentDecision | null
  // False when no service that needs consent is configured.
  required: boolean
  children: ReactNode
}

export function ConsentProvider({ initialDecision, required, children }: ConsentProviderProps) {
  const [decision, setDecision] = useState(initialDecision);
  const [reopened, setReopened] = useState(false);

  const consent = useMemo<Consent>(() => ({
    decision,
    required,
    asking: required && (decision === null || reopened),
    decide: (next) => {
      writeConsent(next);
      setDecision(next);
      setReopened(false);
    },
    ask: () => setReopened(true),
  }), [decision, required, reopened]);

  return <ConsentContext value={consent}>{children}</ConsentContext>;
}
