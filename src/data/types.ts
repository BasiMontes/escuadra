/** Tipos del dominio. Coinciden con las tablas propuestas para Supabase. */

export type Difficulty = 'facil' | 'medio' | 'dificil'

export type Competition = {
  id: string
  slug: string
  name: string
  /** Nombre corto para etiquetas ("Champions", "LaLiga") */
  short: string
}

export type Profile = {
  id: string
  username: string
  email: string
  bio: string
  avatarUrl: string | null
  title: string
  isPublic: boolean
  showInRanking: boolean
}

export type UserSettings = {
  difficulty: Difficulty
  hintsPerDay: 1 | 2 | 3
  competitions: string[]
  notifDaily: boolean
  notifAchievements: boolean
  notifFriends: boolean
}

export type UserStats = {
  streak: number
  hintsLeft: number
  matchesPlayed: number
  challengesCreated: number
  /** Percentil en el ranking global (5 = Top 5 %) */
  topPercent: number
  totalPoints: number
  globalRank: number
  weeklyRank: number
  weeklyPoints: number
  /** Parte de las notificaciones respondidas esta semana (0 a 1) */
  notificationResponseRate: number
}

export type ChallengeOption = { label: 'A' | 'B' | 'C' | 'D'; text: string }

export type ChallengeStatus = 'pendiente' | 'aprobado' | 'rechazado'

export type Challenge = {
  id: string
  kind: 'oficial' | 'usuario'
  answerType: 'opciones' | 'libre'
  competitionId: string
  difficulty: Difficulty
  basePoints: number
  title: string
  question: string
  imageUrl: string | null
  /** Fecha de desbloqueo (YYYY-MM-DD, hora de Madrid) */
  unlockDate: string
  options: ChallengeOption[]
  hints: string[]
  completedBy: number
  status: ChallengeStatus
  createdBy: string | null
}

/** Estado del usuario frente a un reto en la lista de Retos */
export type ChallengeProgress = 'nuevo' | 'en-curso' | 'hecho'

export type ChallengeState = {
  progress: ChallengeProgress
  /** Pistas usadas en el intento que cuenta (el primero) o en el que está en marcha */
  hintsUsed: number
}

/** Tarjeta de un reto de la comunidad en la pantalla En curso */
export type CommunityChallenge = {
  id: string
  competitionId: string
  title: string
  difficulty: Difficulty
  icon: 'trophy' | 'shield' | 'ball'
  action: 'jugar' | 'seguir' | 'empezar'
}

/** Intento en marcha: el reloj y las pistas reveladas sobreviven a salir de la pantalla */
export type OpenAttempt = {
  challengeId: string
  /** Momento de inicio en milisegundos (Date.now) */
  startedAt: number
  revealedHints: string[]
}

export type AttemptResult = {
  challengeId: string
  isCorrect: boolean
  timedOut: boolean
  correctAnswer: string
  /** Segundos empleados */
  timeSeconds: number
  hintsUsed: number
  points: number
  isFirst: boolean
}

export type RankingRow = {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  titles: number
  points: number
}

export type AchievementState = 'desbloqueado' | 'en-progreso' | 'bloqueado'

export type Achievement = {
  code: string
  name: string
  description: string
  icon: 'trophy' | 'medal' | 'lock' | 'star' | 'shield' | 'award'
  state: AchievementState
  /** 0 a 1 */
  progress: number
  /** Felicitación del aviso "¡Logro desbloqueado!" */
  unlockedMessage?: string
}

export type NewChallengeDraft = {
  title: string
  description: string
  type: 'libre'
  competitionId: string
  difficulty: Difficulty
  basePoints: number
  hints: string[]
  answer: string
}

/** Aviso del panel de la campana */
export type NotificationItem = {
  id: string
  kind: 'reto' | 'logro'
  title: string
  text: string
  /** Pantalla a la que lleva */
  to: string
}
