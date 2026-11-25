import { answersMatch, scoreAttempt } from '../lib/game'
import * as db from './mock'
import type { RankingScope, Repository } from './repository'
import type { AttemptResult, Profile, UserSettings, UserStats } from './types'

/** Copia profunda para que las pantallas no muten los datos de ejemplo. */
const clone = <T,>(v: T): T => structuredClone(v)

/** Repositorio en memoria con los datos del diseño. Se reinicia al recargar la página. */
export function createMockRepository(): Repository {
  let profile: Profile = clone(db.me)
  let settings: UserSettings = clone(db.mySettings)
  const stats: UserStats = clone(db.myStats)
  const attempts: AttemptResult[] = []

  return {
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
    async revealHint(challengeId, alreadyRevealed) {
      const c = db.challenges.find((x) => x.id === challengeId)
      if (!c || alreadyRevealed >= c.hints.length || stats.hintsLeft <= 0) return null
      stats.hintsLeft -= 1
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
