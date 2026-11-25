/**
 * Contrato de acceso a datos. Las pantallas solo usan esta interfaz,
 * así se cambia de datos de ejemplo a Supabase sin tocarlas.
 */
import type {
  Achievement,
  AttemptResult,
  Challenge,
  Competition,
  NewChallengeDraft,
  Profile,
  RankingRow,
  UserSettings,
  UserStats,
} from './types'

export type RankingScope = 'semanal' | 'global' | 'amigos'

export interface Repository {
  getCompetitions(): Promise<Competition[]>
  getMe(): Promise<Profile>
  updateMe(patch: Partial<Pick<Profile, 'username' | 'email' | 'bio' | 'isPublic' | 'showInRanking'>>): Promise<Profile>
  getSettings(): Promise<UserSettings>
  updateSettings(patch: Partial<UserSettings>): Promise<UserSettings>
  getStats(): Promise<UserStats>
  getTodayChallenges(): Promise<Challenge[]>
  getDailyChallenge(): Promise<Challenge>
  getChallenge(id: string): Promise<Challenge | null>
  /** Revela la siguiente pista de un reto y descuenta una del saldo diario */
  revealHint(challengeId: string, alreadyRevealed: number): Promise<{ hint: string; hintsLeft: number } | null>
  submitAttempt(input: { challengeId: string; answer: string | null; timeSeconds: number; hintsUsed: number }): Promise<AttemptResult>
  getRanking(scope: RankingScope): Promise<RankingRow[]>
  getAchievements(): Promise<Achievement[]>
  createChallenge(draft: NewChallengeDraft): Promise<{ id: string; status: 'pendiente' }>
  sendSupportTicket(input: { subject: string; message: string }): Promise<void>
  changePassword(input: { current: string; next: string }): Promise<void>
}
