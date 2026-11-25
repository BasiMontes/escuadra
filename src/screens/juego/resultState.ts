import type { AttemptResult } from '../../data/types'

/** Datos que la pantalla de juego pasa a la de resultado a través del historial. */
export type ResultState = { result: AttemptResult; hints: string[] }
