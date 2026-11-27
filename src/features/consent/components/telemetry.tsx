'use client';

import { useEffect } from 'react';
import { clientAnalytics } from '@/platform/analytics/client';
import { clientSentry } from '@/platform/observability/client-sentry';
import { useConsent } from './consent-context';

export interface ConsentedService {
  start: () => Promise<void>
  stop: () => Promise<void>
}

// Add here anything else that may only run after a yes.
const defaultServices: ConsentedService[] = [clientSentry, clientAnalytics];

export function Telemetry({ services = defaultServices }: { services?: ConsentedService[] }) {
  const { decision } = useConsent();

  useEffect(() => {
    services.forEach((service) => {
      const change = decision === 'accepted' ? service.start() : service.stop();
      change.catch((error: unknown) => console.error('A consented service could not change state', error));
    });
  }, [decision, services]);

  return null;
}
