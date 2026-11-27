'use client';

import type { ReactNode } from 'react';
import { OnboardingProvider } from '@/spa/screens/onboarding/OnboardingContext';

export default function Layout({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
