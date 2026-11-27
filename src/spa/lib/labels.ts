import type { ChallengeStatus, Difficulty } from '../data/types'

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' }

export const STATUS_LABEL: Record<ChallengeStatus, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}
