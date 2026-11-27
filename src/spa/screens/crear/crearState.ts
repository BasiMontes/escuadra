import { createContext, useContext } from 'react'
import type { Difficulty, NewChallengeDraft } from '../../data/types'
import { validateBasePoints, validateChallengeQuestion, validateChallengeTitle } from '../../lib/validation'

export type HintDraft = { key: number; text: string }

/** Lo que se va rellenando en los pasos de Crear reto */
export type CrearDraft = {
  title: string
  question: string
  competitionId: string
  difficulty: Difficulty
  /** Texto del campo: puede estar vacío mientras se escribe */
  basePoints: string
  hints: HintDraft[]
  answer: string
}

export const EMPTY_DRAFT: CrearDraft = {
  title: '',
  question: '',
  competitionId: 'uefa',
  difficulty: 'medio',
  basePoints: '100',
  hints: [{ key: 1, text: '' }],
  answer: '',
}

export type PublishedChallenge = { id: string; challenge: NewChallengeDraft }

export const isStep1Done = (d: CrearDraft) => !validateChallengeTitle(d.title) && !validateChallengeQuestion(d.question)
export const isStep2Done = (d: CrearDraft) => isStep1Done(d) && !validateBasePoints(d.basePoints)

export const CrearCtx = createContext<{
  draft: CrearDraft
  update: (patch: Partial<CrearDraft>) => void
  /** Último reto publicado, para la pantalla de resumen */
  published: PublishedChallenge | null
  /** Guarda el reto publicado y vacía el borrador */
  publish: (published: PublishedChallenge) => void
} | null>(null)

export function useCrear() {
  const ctx = useContext(CrearCtx)
  if (!ctx) throw new Error('useCrear debe usarse dentro de <CrearProvider>')
  return ctx
}
