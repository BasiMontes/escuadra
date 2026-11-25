import { createContext, useContext } from 'react'
import type { Difficulty } from '../../data/types'

export type OnboardingDraft = {
  competitions: string[]
  difficulty: Difficulty
  hintsPerDay: 1 | 2 | 3
}

export const OnboardingCtx = createContext<{ draft: OnboardingDraft; update: (p: Partial<OnboardingDraft>) => void } | null>(null)

export function useOnboarding() {
  const ctx = useContext(OnboardingCtx)
  if (!ctx) throw new Error('useOnboarding debe usarse dentro de <OnboardingProvider>')
  return ctx
}
