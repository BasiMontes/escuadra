'use client';

import type { ConsentDecision } from '@/platform/consent/cookie';
import { createContext, use } from 'react';

export interface Consent {
  decision: ConsentDecision | null
  required: boolean
  asking: boolean
  decide: (decision: ConsentDecision) => void
  ask: () => void
}

export const ConsentContext = createContext<Consent | null>(null);

export function useConsent(): Consent {
  const consent = use(ConsentContext);
  if (!consent) { throw new Error('useConsent needs a ConsentProvider above it'); }
  return consent;
}
