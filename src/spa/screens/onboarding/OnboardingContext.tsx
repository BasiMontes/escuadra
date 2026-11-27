import { useState, type ReactNode } from 'react'
import { Outlet } from '../../router'
import { OnboardingCtx, type OnboardingDraft } from './onboardingState'

/** Guarda las elecciones del onboarding mientras se recorren sus pantallas. */
export function OnboardingProvider({ children }: { children?: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>({ competitions: [], difficulty: 'medio', hintsPerDay: 2 })
  return (
    <OnboardingCtx.Provider value={{ draft, update: (p) => setDraft((d) => ({ ...d, ...p })) }}>
      {children ?? <Outlet />}
    </OnboardingCtx.Provider>
  )
}
