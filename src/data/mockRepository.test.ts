import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockRepository } from './mockRepository'

const RETO = 'balon-oro-2018'

describe('intento en marcha', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-03T10:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('volver a abrirlo no reinicia el reloj', async () => {
    const repo = createMockRepository()
    const first = await repo.startAttempt(RETO)
    vi.advanceTimersByTime(8000)
    const second = await repo.startAttempt(RETO)
    expect(second.startedAt).toBe(first.startedAt)
  })

  it('recuerda las pistas reveladas y no las vuelve a cobrar', async () => {
    const repo = createMockRepository()
    await repo.startAttempt(RETO)
    await repo.revealHint(RETO, 0)
    const again = await repo.revealHint(RETO, 0)

    expect(again?.hintsLeft).toBe(1)
    expect((await repo.startAttempt(RETO)).revealedHints).toEqual(['Ha jugado en el Real Madrid.'])
  })

  it('no revela pistas sin saldo', async () => {
    const repo = createMockRepository()
    await repo.startAttempt(RETO)
    await repo.revealHint(RETO, 0)
    await repo.revealHint(RETO, 1)
    expect(await repo.revealHint(RETO, 2)).toBeNull()
  })

  it('enviar la respuesta cierra el intento y el reintento no puntúa', async () => {
    const repo = createMockRepository()
    const first = await repo.startAttempt(RETO)
    const answer = { challengeId: RETO, answer: 'Luka Modrić', timeSeconds: 5, hintsUsed: 0 }
    expect((await repo.submitAttempt(answer)).points).toBe(60)

    vi.advanceTimersByTime(1000)
    expect((await repo.startAttempt(RETO)).startedAt).toBeGreaterThan(first.startedAt)
    const retry = await repo.submitAttempt(answer)
    expect(retry).toMatchObject({ isCorrect: true, isFirst: false, points: 0 })
  })
})

describe('siguiente reto', () => {
  it('salta los ya jugados y devuelve null al terminar los del día', async () => {
    const repo = createMockRepository()
    const played = new Set<string>()
    let current = RETO
    for (;;) {
      await repo.submitAttempt({ challengeId: current, answer: null, timeSeconds: 20, hintsUsed: 0 })
      played.add(current)
      const next = await repo.getNextChallengeId(current)
      if (!next) break
      expect(played.has(next)).toBe(false)
      current = next
    }
    expect(played.size).toBe(4)
  })
})
