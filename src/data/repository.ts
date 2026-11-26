/**
 * Contrato de acceso a datos. Las pantallas solo usan esta interfaz,
 * así se cambia de datos de ejemplo a Supabase sin tocarlas.
 */
import type {
  Achievement,
  AttemptResult,
  Challenge,
  ChallengeState,
  CommunityChallenge,
  Competition,
  NewChallengeDraft,
  NotificationItem,
  OpenAttempt,
  Profile,
  RankingRow,
  UserSettings,
  UserStats,
} from './types'

export type RankingScope = 'semanal' | 'global' | 'amigos'

export interface Repository {
  /** Crea la cuenta. Lanza un Error con mensaje para el usuario si falla. */
  signUp(input: { username: string; email: string; password: string }): Promise<void>
  signIn(input: { email: string; password: string }): Promise<void>
  /** Envía el enlace para restablecer la contraseña */
  requestPasswordReset(email: string): Promise<void>
  /** Indica si sirve el enlace del correo para poner una contraseña nueva */
  checkResetLink(link: string | null): Promise<boolean>
  /** Guarda la contraseña nueva. Lanza un Error con mensaje para el usuario si no se puede */
  resetPassword(input: { link: string | null; password: string }): Promise<void>
  signOut(): Promise<void>
  getCompetitions(): Promise<Competition[]>
  getMe(): Promise<Profile>
  /** Lanza un Error con mensaje para el usuario si no se puede guardar */
  updateMe(
    patch: Partial<Pick<Profile, 'username' | 'email' | 'bio' | 'avatarUrl' | 'isPublic' | 'showInRanking'>>,
  ): Promise<Profile>
  getSettings(): Promise<UserSettings>
  updateSettings(patch: Partial<UserSettings>): Promise<UserSettings>
  getStats(): Promise<UserStats>
  getTodayChallenges(): Promise<Challenge[]>
  getDailyChallenge(): Promise<Challenge>
  getChallenge(id: string): Promise<Challenge | null>
  /** Estado del usuario en cada reto que ha abierto; los que no aparecen están sin empezar */
  getChallengeStates(): Promise<Record<string, ChallengeState>>
  getCommunityChallenges(): Promise<{ inProgress: CommunityChallenge[]; discover: CommunityChallenge[] }>
  /** Retos creados por el usuario, los más recientes primero */
  getMyChallenges(): Promise<Challenge[]>
  /** Siguiente reto oficial de hoy sin jugar; null si no queda ninguno */
  getNextChallengeId(currentId: string): Promise<string | null>
  /** Abre el intento de un reto o devuelve el que ya está en marcha */
  startAttempt(challengeId: string): Promise<OpenAttempt>
  /** Revela la siguiente pista de un reto y descuenta una del saldo diario */
  revealHint(challengeId: string, alreadyRevealed: number): Promise<{ hint: string; hintsLeft: number } | null>
  submitAttempt(input: { challengeId: string; answer: string | null; timeSeconds: number; hintsUsed: number }): Promise<AttemptResult>
  getRanking(scope: RankingScope): Promise<RankingRow[]>
  getAchievements(): Promise<Achievement[]>
  createChallenge(draft: NewChallengeDraft): Promise<{ id: string; status: 'pendiente' }>
  sendSupportTicket(input: { subject: string; message: string }): Promise<void>
  changePassword(input: { current: string; next: string }): Promise<void>
  /** Avisos pendientes, solo de los tipos que el usuario tiene activados */
  getNotifications(): Promise<NotificationItem[]>
  /** Borra la cuenta y sus datos. No se puede deshacer */
  deleteAccount(): Promise<void>
}
