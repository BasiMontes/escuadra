import { describe, expect, it } from 'vitest'
import {
  answersMatch,
  computeStreak,
  formatChallengeDate,
  formatNumber,
  formatSeconds,
  hintSlots,
  normalizeAnswer,
  scoreAttempt,
  untilWeeklyReset,
} from './game'

describe('scoreAttempt', () => {
  it('reproduce el ejemplo del diseño: base 80, fácil, 5 s, 1 pista = +30', () => {
    expect(scoreAttempt({ basePoints: 80, difficulty: 'facil', timeSeconds: 5, hintsUsed: 1, isCorrect: true })).toBe(30)
  })

  it('da 0 si la respuesta es incorrecta', () => {
    expect(scoreAttempt({ basePoints: 120, difficulty: 'dificil', timeSeconds: 2, hintsUsed: 0, isCorrect: false })).toBe(0)
  })

  it('da 0 si se agota el tiempo', () => {
    expect(scoreAttempt({ basePoints: 120, difficulty: 'medio', timeSeconds: 20, hintsUsed: 0, isCorrect: true })).toBe(0)
  })

  it('aplica el multiplicador de dificultad', () => {
    expect(scoreAttempt({ basePoints: 100, difficulty: 'medio', timeSeconds: 0, hintsUsed: 0, isCorrect: true })).toBe(150)
    expect(scoreAttempt({ basePoints: 100, difficulty: 'dificil', timeSeconds: 0, hintsUsed: 0, isCorrect: true })).toBe(200)
  })

  it('nunca devuelve puntos negativos', () => {
    expect(scoreAttempt({ basePoints: 80, difficulty: 'facil', timeSeconds: 18, hintsUsed: 3, isCorrect: true })).toBe(0)
  })
})

describe('respuestas libres', () => {
  it('ignora mayúsculas, tildes, puntuación y espacios', () => {
    expect(normalizeAnswer('  Arsenal F.C. ')).toBe('arsenal fc')
    expect(answersMatch('luka modric', 'Luka Modrić')).toBe(true)
    expect(answersMatch('ARSENAL FC', 'Arsenal fc')).toBe(true)
  })

  it('no acepta respuestas vacías', () => {
    expect(answersMatch('   ', '')).toBe(false)
  })

  it('distingue respuestas diferentes', () => {
    expect(answersMatch('Chelsea', 'Arsenal FC')).toBe(false)
  })
})

describe('computeStreak', () => {
  it('cuenta días seguidos hasta hoy', () => {
    expect(computeStreak(['2026-11-23', '2026-11-24', '2026-11-25'], '2026-11-25')).toBe(3)
  })

  it('mantiene la racha de ayer si hoy aún no se ha jugado', () => {
    expect(computeStreak(['2026-11-23', '2026-11-24'], '2026-11-25')).toBe(2)
  })

  it('se rompe tras un día sin jugar', () => {
    expect(computeStreak(['2026-11-20', '2026-11-21', '2026-11-25'], '2026-11-25')).toBe(1)
    expect(computeStreak(['2026-11-22'], '2026-11-25')).toBe(0)
  })

  it('cruza cambios de mes', () => {
    expect(computeStreak(['2026-10-31', '2026-11-01'], '2026-11-01')).toBe(2)
  })
})

describe('untilWeeklyReset', () => {
  it('cuenta hasta el lunes 00:00 de Madrid', () => {
    // Domingo 29/11/2026 23:00 en Madrid (22:00 UTC) → falta 1 hora
    expect(untilWeeklyReset(new Date('2026-11-29T22:00:00Z'))).toEqual({ hours: 1, minutes: 0, seconds: 0 })
    // Lunes 30/11/2026 00:00 en Madrid → semana completa
    expect(untilWeeklyReset(new Date('2026-11-29T23:00:00Z'))).toEqual({ hours: 168, minutes: 0, seconds: 0 })
  })
})

describe('formatNumber', () => {
  it('usa punto como separador de miles', () => {
    expect(formatNumber(1248)).toBe('1.248')
    expect(formatNumber(14250)).toBe('14.250')
  })
})

describe('formatos del juego', () => {
  it('escribe los segundos en formato español con un decimal como mucho', () => {
    expect(formatSeconds(5)).toBe('5')
    expect(formatSeconds(10.4)).toBe('10,4')
  })

  it('escribe la fecha del reto como en el diseño', () => {
    expect(formatChallengeDate('2026-03-03')).toBe('03 Marzo')
  })
})

describe('hintSlots', () => {
  it('muestra las reveladas más las que permite el saldo', () => {
    expect(hintSlots(3, 0, 2)).toBe(2)
    expect(hintSlots(3, 1, 1)).toBe(2)
  })

  it('no pasa de las pistas que tiene el reto', () => {
    expect(hintSlots(1, 0, 3)).toBe(1)
  })

  it('sin saldo solo quedan las ya reveladas', () => {
    expect(hintSlots(3, 1, 0)).toBe(1)
    expect(hintSlots(3, 0, 0)).toBe(0)
  })
})
