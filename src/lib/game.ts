/**
 * Reglas de juego de Escuadra (ver el documento de análisis, sección "Reglas de juego").
 * La versión de servidor (función `submit_attempt` en Supabase) debe dar los mismos resultados.
 */
import type { Challenge, Difficulty } from '../data/types'

export const CHALLENGE_SECONDS = 20
export const HINT_PENALTY = 30
export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = { facil: 1, medio: 1.5, dificil: 2 }

/** Solo los retos oficiales cuentan para el ranking y la racha; los de la comunidad son entretenimiento. */
export function countsForRanking(kind: Challenge['kind']): boolean {
  return kind === 'oficial'
}

/**
 * Puntos de un intento.
 * puntos = max(0, round(base × m × (20 − t) / 20) − 30 × pistas); fallo o tiempo agotado = 0.
 * Ejemplo del diseño: base 80, fácil, 5 s, 1 pista → 80 × 1 × 15/20 − 30 = 30.
 */
export function scoreAttempt(opts: {
  basePoints: number
  difficulty: Difficulty
  timeSeconds: number
  hintsUsed: number
  isCorrect: boolean
}): number {
  const { basePoints, difficulty, timeSeconds, hintsUsed, isCorrect } = opts
  if (!isCorrect) return 0
  const t = Math.min(Math.max(timeSeconds, 0), CHALLENGE_SECONDS)
  if (t >= CHALLENGE_SECONDS) return 0
  const raw = Math.round((basePoints * DIFFICULTY_MULTIPLIER[difficulty] * (CHALLENGE_SECONDS - t)) / CHALLENGE_SECONDS)
  return Math.max(0, raw - HINT_PENALTY * Math.max(0, hintsUsed))
}

/**
 * Normaliza una respuesta libre: sin mayúsculas, sin tildes, sin espacios sobrantes
 * ni signos de puntuación. "  Arsenal F.C. " → "arsenal fc".
 */
export function normalizeAnswer(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function answersMatch(given: string, expected: string): boolean {
  const a = normalizeAnswer(given)
  return a.length > 0 && a === normalizeAnswer(expected)
}

/** Fecha YYYY-MM-DD en hora de Madrid. */
export function madridDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/**
 * Racha: días seguidos (hora de Madrid) con al menos un reto oficial completado el día de su desbloqueo.
 * Si hoy aún no se ha jugado, la racha de ayer sigue viva.
 */
export function computeStreak(playedDays: Iterable<string>, today: string): number {
  const days = new Set(playedDays)
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Tiempo hasta el próximo lunes 00:00 en Madrid (reinicio del ranking semanal). */
export function untilWeeklyReset(now: Date = new Date()): { hours: number; minutes: number; seconds: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayIdx = order.indexOf(parts.weekday)
  const elapsed = dayIdx * 86400 + Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)
  const left = 7 * 86400 - elapsed
  return { hours: Math.floor(left / 3600), minutes: Math.floor((left % 3600) / 60), seconds: left % 60 }
}

const nf = new Intl.NumberFormat('es-ES', { useGrouping: 'always' } as Intl.NumberFormatOptions)
/** Formato español con separador de miles siempre: 1.248, 4.920. */
export function formatNumber(n: number): string {
  return nf.format(n)
}

/** Segundos con un decimal como mucho, en formato español: 5, 10,4. */
export function formatSeconds(seconds: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(seconds)
}

/** Fecha de un reto (YYYY-MM-DD) como en el diseño: "03 Marzo". */
export function formatChallengeDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  const month = new Intl.DateTimeFormat('es-ES', { month: 'long', timeZone: 'UTC' }).format(date)
  return `${isoDate.slice(8, 10)} ${month.charAt(0).toUpperCase()}${month.slice(1)}`
}

/**
 * Huecos de pista que se muestran en un reto: las ya reveladas más las que
 * permite el saldo del día, sin pasar de las que tiene el reto.
 */
export function hintSlots(totalHints: number, revealed: number, hintsLeft: number): number {
  return Math.min(totalHints, revealed + Math.max(0, hintsLeft))
}
