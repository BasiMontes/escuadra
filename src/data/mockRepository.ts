import { answersMatch, scoreAttempt } from '../lib/game'
import * as db from './mock'
import type { RankingScope, Repository } from './repository'
import type { AttemptResult, OpenAttempt, Profile, UserSettings, UserStats } from './types'

/** Copia profunda para que las pantallas no muten los datos de ejemplo. */
const clone = <T,>(v: T): T => structuredClone(v)

/** Repositorio en memoria con los datos del diseño. Se reinicia al recargar la página. */
export function createMockRepository(): Repository {
  let profile: Profile = clone(db.me)
  let settings: UserSettings = clone(db.mySettings)
  const stats: UserStats = clone(db.myStats)
  const attempts: AttemptResult[] = []
  const openAttempts = new Map<string, OpenAttempt>()

  return {
    async signUp({ username, email }) {
      if (username.toLowerCase() === 'ocupado') throw new Error('Ese nombre de usuario ya existe.')
      profile = { ...profile, username, email }
    },
    async signIn({ email, password }) {
      if (password === 'incorrecta') throw new Error('Email o contraseña incorrectos.')
      profile = { ...profile, email }
    },
    async requestPasswordReset() {},
    async signOut() {},
    async getCompetitions() {
      return clone(db.competitions)
    },
    async getMe() {
      return clone(profile)
    },
    async updateMe(patch) {
      profile = { ...profile, ...patch }
      return clone(profile)
    },
    async getSettings() {
      return clone(settings)
    },
    async updateSettings(patch) {
      settings = { ...settings, ...patch }
      if (patch.hintsPerDay) stats.hintsLeft = patch.hintsPerDay
      return clone(settings)
    },
    async getStats() {
      return clone(stats)
    },
    async getTodayChallenges() {
      return clone(db.challenges.filter((c) => c.id !== 'gol-final-2005'))
    },
    async getDailyChallenge() {
      return clone(db.challenges.find((c) => c.id === 'gol-final-2005')!)
    },
    async getChallenge(id) {
      return clone(db.challenges.find((c) => c.id === id) ?? null)
    },
    async getNextChallengeId(currentId) {
      const today = db.challenges.filter((c) => c.kind === 'oficial' && c.unlockDate === db.TODAY)
      const from = today.findIndex((c) => c.id === currentId) + 1
      const ordered = [...today.slice(from), ...today.slice(0, from)]
      const next = ordered.find((c) => c.id !== currentId && !attempts.some((a) => a.challengeId === c.id))
      return next?.id ?? null
    },
    async startAttempt(challengeId) {
      if (!db.challenges.some((c) => c.id === challengeId)) throw new Error(`Reto desconocido: ${challengeId}`)
      let open = openAttempts.get(challengeId)
      if (!open) {
        open = { challengeId, startedAt: Date.now(), revealedHints: [] }
        openAttempts.set(challengeId, open)
      }
      return clone(open)
    },
    async revealHint(challengeId, alreadyRevealed) {
      const c = db.challenges.find((x) => x.id === challengeId)
      if (!c || alreadyRevealed >= c.hints.length) return null
      const open = openAttempts.get(challengeId)
      // Una pista ya revelada en este intento no se vuelve a cobrar
      const paid = open?.revealedHints[alreadyRevealed]
      if (paid) return { hint: paid, hintsLeft: stats.hintsLeft }
      if (stats.hintsLeft <= 0) return null
      stats.hintsLeft -= 1
      open?.revealedHints.push(c.hints[alreadyRevealed])
      return { hint: c.hints[alreadyRevealed], hintsLeft: stats.hintsLeft }
    },
    async submitAttempt({ challengeId, answer, timeSeconds, hintsUsed }) {
      const c = db.challenges.find((x) => x.id === challengeId)
      if (!c) throw new Error(`Reto desconocido: ${challengeId}`)
      const correctAnswer = db.correctAnswers[challengeId]
      const timedOut = answer === null
      const isCorrect = !timedOut && answersMatch(answer, correctAnswer)
      const isFirst = !attempts.some((a) => a.challengeId === challengeId)
      const points = isFirst
        ? scoreAttempt({ basePoints: c.basePoints, difficulty: c.difficulty, timeSeconds, hintsUsed, isCorrect })
        : 0
      const result: AttemptResult = { challengeId, isCorrect, timedOut, correctAnswer, timeSeconds, hintsUsed, points, isFirst }
      attempts.push(result)
      openAttempts.delete(challengeId)
      if (isFirst) {
        stats.matchesPlayed += 1
        stats.totalPoints += points
        stats.weeklyPoints += points
        if (attempts.filter((a) => a.isFirst).length === 1) stats.streak += 1
      }
      return clone(result)
    },
    async getRanking(scope: RankingScope) {
      if (scope === 'amigos') return []
      if (scope === 'global') {
        return db.weeklyRanking.map((r) => ({ ...r, points: r.points * 9 + 310 }))
      }
      return clone(db.weeklyRanking)
    },
    async getAchievements() {
      return clone(db.achievements)
    },
    async createChallenge() {
      stats.challengesCreated += 1
      return { id: `reto-${Date.now()}`, status: 'pendiente' as const }
    },
    async sendSupportTicket() {},
    async changePassword({ current }) {
      if (!current) throw new Error('Introduce tu contraseña actual.')
    },
  }
}
