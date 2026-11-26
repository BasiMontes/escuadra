import { answersMatch, countsForRanking, hintsBalance, scoreAttempt } from '../lib/game'
import * as db from './mock'
import type { RankingScope, Repository } from './repository'
import type {
  AttemptResult,
  ChallengeState,
  CommunityChallenge,
  NotificationItem,
  OpenAttempt,
  Profile,
  UserSettings,
  UserStats,
} from './types'

/** Copia profunda para que las pantallas no muten los datos de ejemplo. */
const clone = <T,>(v: T): T => structuredClone(v)

// Las tarjetas de En curso son fijas en los datos de ejemplo
function toCommunityCard({ id, icon, action }: (typeof db.inProgress)[number]): CommunityChallenge {
  const { competitionId, title, difficulty } = db.challenges.find((c) => c.id === id)!
  return { id, competitionId, title, difficulty, icon, action }
}

/** Repositorio en memoria con los datos del diseño. Se reinicia al recargar la página. */
export function createMockRepository(): Repository {
  let profile: Profile = clone(db.me)
  let settings: UserSettings = clone(db.mySettings)
  const stats: UserStats = clone(db.myStats)
  let hintsUsedToday = settings.hintsPerDay - stats.hintsLeft
  const attempts: AttemptResult[] = []
  const openAttempts = new Map<string, OpenAttempt>()
  // Copias propias: los retos creados no deben tocar los datos de ejemplo compartidos
  const challenges = clone(db.challenges)
  const answers: Record<string, string> = { ...db.correctAnswers }
  const find = (id: string) => challenges.find((c) => c.id === id)
  // En la lista, los creados después van detrás
  const mine = () => challenges.filter((c) => c.createdBy === profile.id).reverse()

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
      if (patch.username?.toLowerCase() === 'ocupado') throw new Error('Ese nombre de usuario ya existe.')
      profile = { ...profile, ...patch }
      return clone(profile)
    },
    async getSettings() {
      return clone(settings)
    },
    async updateSettings(patch) {
      settings = { ...settings, ...patch }
      if (patch.hintsPerDay) stats.hintsLeft = hintsBalance(patch.hintsPerDay, hintsUsedToday)
      return clone(settings)
    },
    async getStats() {
      return clone({ ...stats, challengesCreated: mine().length })
    },
    async getMyChallenges() {
      return clone(mine())
    },
    async getTodayChallenges() {
      return clone(challenges.filter((c) => c.kind === 'oficial' && c.id !== 'gol-final-2005'))
    },
    async getDailyChallenge() {
      return clone(find('gol-final-2005')!)
    },
    async getChallenge(id) {
      return clone(find(id) ?? null)
    },
    async getChallengeStates() {
      const states: Record<string, ChallengeState> = {}
      for (const open of openAttempts.values()) {
        states[open.challengeId] = { progress: 'en-curso', hintsUsed: open.revealedHints.length }
      }
      // Un reto ya completado sigue "hecho" aunque se esté reintentando
      for (const a of attempts.filter((x) => x.isFirst)) {
        states[a.challengeId] = { progress: 'hecho', hintsUsed: a.hintsUsed }
      }
      return states
    },
    async getCommunityChallenges() {
      return { inProgress: db.inProgress.map(toCommunityCard), discover: db.discover.map(toCommunityCard) }
    },
    async getNextChallengeId(currentId) {
      const today = challenges.filter((c) => c.kind === 'oficial' && c.unlockDate === db.TODAY)
      const from = today.findIndex((c) => c.id === currentId) + 1
      const ordered = [...today.slice(from), ...today.slice(0, from)]
      const next = ordered.find((c) => c.id !== currentId && !attempts.some((a) => a.challengeId === c.id))
      return next?.id ?? null
    },
    async startAttempt(challengeId) {
      const challenge = find(challengeId)
      if (!challenge) throw new Error(`Reto desconocido: ${challengeId}`)
      if (challenge.createdBy === profile.id) throw new Error('No puedes jugar tu propio reto.')
      let open = openAttempts.get(challengeId)
      if (!open) {
        open = { challengeId, startedAt: Date.now(), revealedHints: [] }
        openAttempts.set(challengeId, open)
      }
      return clone(open)
    },
    async revealHint(challengeId, alreadyRevealed) {
      const c = find(challengeId)
      if (!c || alreadyRevealed >= c.hints.length) return null
      const open = openAttempts.get(challengeId)
      // Una pista ya revelada en este intento no se vuelve a cobrar
      const paid = open?.revealedHints[alreadyRevealed]
      if (paid) return { hint: paid, hintsLeft: stats.hintsLeft }
      if (stats.hintsLeft <= 0) return null
      stats.hintsLeft -= 1
      hintsUsedToday += 1
      open?.revealedHints.push(c.hints[alreadyRevealed])
      return { hint: c.hints[alreadyRevealed], hintsLeft: stats.hintsLeft }
    },
    async submitAttempt({ challengeId, answer, timeSeconds, hintsUsed }) {
      const c = find(challengeId)
      if (!c) throw new Error(`Reto desconocido: ${challengeId}`)
      const correctAnswer = answers[challengeId]
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
        // En los retos de la comunidad los puntos son solo un marcador: no suman ni dan racha
        if (countsForRanking(c.kind)) {
          stats.totalPoints += points
          stats.weeklyPoints += points
          // La racha sube una vez al día
          const officialDone = attempts.filter((a) => a.isFirst && find(a.challengeId)?.kind === 'oficial')
          if (officialDone.length === 1) stats.streak += 1
        }
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
    async createChallenge(draft) {
      const id = `reto-propio-${challenges.length + 1}`
      challenges.push({
        id,
        kind: 'usuario',
        answerType: draft.type,
        competitionId: draft.competitionId,
        difficulty: draft.difficulty,
        basePoints: draft.basePoints,
        title: draft.title,
        question: draft.description,
        imageUrl: '/img/estadio.jpg',
        unlockDate: db.TODAY,
        options: [],
        hints: [...draft.hints],
        completedBy: 0,
        status: 'pendiente',
        createdBy: profile.id,
      })
      answers[id] = draft.answer
      return { id, status: 'pendiente' as const }
    },
    async sendSupportTicket() {},
    async changePassword({ current }) {
      if (!current) throw new Error('Introduce tu contraseña actual.')
      if (current === 'incorrecta') throw new Error('La contraseña actual no es correcta.')
    },
    async getNotifications() {
      const items: NotificationItem[] = []
      if (settings.notifDaily) {
        items.push({
          id: 'reto-del-dia',
          kind: 'reto',
          title: 'Retos diarios',
          text: 'El reto oficial de hoy te está esperando.',
          to: '/retos/gol-final-2005/intro',
        })
      }
      if (settings.notifAchievements) {
        items.push({
          id: 'logro-rey-del-gol',
          kind: 'logro',
          title: 'Nuevos logros',
          text: 'Has desbloqueado «Rey del gol».',
          to: '/perfil/logros?nuevo=rey-del-gol',
        })
      }
      return items
    },
    async deleteAccount() {},
  }
}
