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

describe('lista de retos', () => {
  it('solo incluye retos oficiales', async () => {
    const repo = createMockRepository()
    const list = await repo.getTodayChallenges()
    expect(list.map((c) => c.id)).toEqual(['balon-oro-2018', 'champions-2005', 'goleador-laliga'])
  })

  it('un reto abierto está en curso y al responderlo queda hecho', async () => {
    const repo = createMockRepository()
    expect(await repo.getChallengeStates()).toEqual({})

    await repo.startAttempt(RETO)
    await repo.revealHint(RETO, 0)
    expect((await repo.getChallengeStates())[RETO]).toEqual({ progress: 'en-curso', hintsUsed: 1 })

    await repo.submitAttempt({ challengeId: RETO, answer: null, timeSeconds: 20, hintsUsed: 1 })
    expect((await repo.getChallengeStates())[RETO]).toEqual({ progress: 'hecho', hintsUsed: 1 })
  })

  it('reintentar un reto hecho no lo devuelve a en curso', async () => {
    const repo = createMockRepository()
    await repo.submitAttempt({ challengeId: RETO, answer: null, timeSeconds: 20, hintsUsed: 0 })
    await repo.startAttempt(RETO)
    expect((await repo.getChallengeStates())[RETO]).toEqual({ progress: 'hecho', hintsUsed: 0 })
  })

  it('cada tarjeta de la comunidad apunta a un reto que existe', async () => {
    const repo = createMockRepository()
    const { inProgress, discover } = await repo.getCommunityChallenges()
    for (const card of [...inProgress, ...discover]) {
      expect(await repo.getChallenge(card.id)).toMatchObject({ kind: 'usuario', title: card.title })
    }
  })
})

describe('retos de usuario', () => {
  const draft = {
    title: 'Mi reto',
    description: '¿Qué equipo juega en el Emirates Stadium?',
    type: 'libre' as const,
    competitionId: 'premier',
    difficulty: 'medio' as const,
    basePoints: 100,
    hints: ['El equipo juega en Londres.'],
    answer: 'Arsenal FC',
  }

  it('nacen pendientes y no aparecen en los retos del día', async () => {
    const repo = createMockRepository()
    const { id, status } = await repo.createChallenge(draft)

    expect(status).toBe('pendiente')
    expect(await repo.getChallenge(id)).toMatchObject({ kind: 'usuario', status: 'pendiente', question: draft.description })
    expect((await repo.getTodayChallenges()).map((c) => c.id)).not.toContain(id)
    expect((await repo.getStats()).challengesCreated).toBe(16)
  })

  it('quien los crea no puede jugarlos', async () => {
    const repo = createMockRepository()
    const { id } = await repo.createChallenge(draft)
    await expect(repo.startAttempt(id)).rejects.toThrow('No puedes jugar tu propio reto.')
  })

  it('cada repositorio guarda sus propios retos', async () => {
    const { id } = await createMockRepository().createChallenge(draft)
    expect(await createMockRepository().getChallenge(id)).toBeNull()
  })

  it('la respuesta libre ignora mayúsculas, tildes y espacios', async () => {
    const repo = createMockRepository()
    const result = await repo.submitAttempt({ challengeId: 'mundiales-90s', answer: '  FRÁNCIA ', timeSeconds: 5, hintsUsed: 0 })
    expect(result).toMatchObject({ isCorrect: true, points: 60 })
  })

  it('no cuentan para la racha, que es solo de retos oficiales', async () => {
    const repo = createMockRepository()
    await repo.submitAttempt({ challengeId: 'mundiales-90s', answer: 'Francia', timeSeconds: 5, hintsUsed: 0 })
    expect((await repo.getStats()).streak).toBe(0)
    await repo.submitAttempt({ challengeId: RETO, answer: null, timeSeconds: 20, hintsUsed: 0 })
    expect((await repo.getStats()).streak).toBe(1)
  })
})

describe('perfil', () => {
  it('guarda los cambios', async () => {
    const repo = createMockRepository()
    await repo.updateMe({ username: 'NuevoNombre', bio: 'Hola' })
    expect(await repo.getMe()).toMatchObject({ username: 'NuevoNombre', bio: 'Hola' })
  })

  it('rechaza un nombre de usuario ocupado sin cambiar nada', async () => {
    const repo = createMockRepository()
    await expect(repo.updateMe({ username: 'Ocupado' })).rejects.toThrow('Ese nombre de usuario ya existe.')
    expect((await repo.getMe()).username).toBe('BasiMontes')
  })
})

describe('avisos', () => {
  it('solo incluye los tipos activados', async () => {
    const repo = createMockRepository()
    expect((await repo.getNotifications()).map((n) => n.kind)).toEqual(['reto'])

    await repo.updateSettings({ notifAchievements: true })
    expect((await repo.getNotifications()).map((n) => n.kind)).toEqual(['reto', 'logro'])

    await repo.updateSettings({ notifDaily: false, notifAchievements: false })
    expect(await repo.getNotifications()).toEqual([])
  })
})
