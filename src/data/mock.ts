/**
 * Datos de ejemplo. Reproducen el contenido del diseño (con las erratas corregidas)
 * y se usan hasta conectar Supabase, y siempre en los tests visuales.
 */
import type {
  Achievement,
  Challenge,
  CommunityChallenge,
  Competition,
  Profile,
  RankingRow,
  UserSettings,
  UserStats,
} from './types'

export const TODAY = '2026-03-03'

export const competitions: Competition[] = [
  { id: 'premier', slug: 'premier-league', name: 'Premier League', short: 'Premier League' },
  { id: 'laliga', slug: 'laliga', name: 'LaLiga', short: 'LaLiga' },
  { id: 'seriea', slug: 'serie-a', name: 'Serie A', short: 'Serie A' },
  { id: 'bundesliga', slug: 'bundesliga', name: 'Bundesliga', short: 'Bundesliga' },
  { id: 'ligue1', slug: 'ligue-1', name: 'Ligue 1', short: 'Ligue 1' },
  { id: 'uefa', slug: 'champions-uefa-conference', name: 'Champions, UEFA, Conference', short: 'Champions' },
  { id: 'internacional', slug: 'competiciones-internacionales', name: 'Competiciones internacionales', short: 'Internacional' },
]

export const me: Profile = {
  id: 'u-basimontes',
  username: 'BasiMontes',
  email: 'contacto@escuadra.app',
  bio: 'Fanático del buen fútbol y experto en trivia histórica. ¡Venga esa copa!',
  avatarUrl: '/img/avatar-basimontes.jpg',
  title: 'Goleador estrella',
  isPublic: true,
  showInRanking: true,
}

export const mySettings: UserSettings = {
  difficulty: 'medio',
  hintsPerDay: 2,
  competitions: ['laliga', 'uefa'],
  notifDaily: true,
  notifAchievements: false,
  notifFriends: true,
}

export const myStats: UserStats = {
  streak: 0,
  hintsLeft: 2,
  matchesPlayed: 128,
  challengesCreated: 15,
  topPercent: 5,
  totalPoints: 14250,
  globalRank: 42,
  weeklyRank: 1248,
  weeklyPoints: 850,
}

const balonDeOro: Challenge = {
  id: 'balon-oro-2018',
  kind: 'oficial',
  answerType: 'opciones',
  competitionId: 'internacional',
  difficulty: 'facil',
  basePoints: 80,
  title: 'Balón de Oro 2018',
  question: '¿Quién ganó el Balón de Oro en 2018?',
  imageUrl: '/img/estadio-balon.jpg',
  unlockDate: TODAY,
  options: [
    { label: 'A', text: 'Luka Modrić' },
    { label: 'B', text: 'Cristiano Ronaldo' },
    { label: 'C', text: 'Lionel Messi' },
    { label: 'D', text: 'Karim Benzema' },
  ],
  hints: ['Ha jugado en el Real Madrid.', 'Es el capitán de su selección.', 'Nació en Zadar.'],
  completedBy: 1240,
  status: 'aprobado',
  createdBy: null,
}

/** Reto creado por un usuario: respuesta libre y sin opciones */
function communityChallenge(
  data: Pick<Challenge, 'id' | 'competitionId' | 'difficulty' | 'title' | 'question' | 'hints'>,
): Challenge {
  return {
    ...data,
    kind: 'usuario',
    answerType: 'libre',
    basePoints: 80,
    imageUrl: '/img/estadio.jpg',
    unlockDate: TODAY,
    options: [],
    completedBy: 0,
    status: 'aprobado',
    createdBy: 'u2',
  }
}

export const challenges: Challenge[] = [
  balonDeOro,
  communityChallenge({
    id: 'mundiales-90s',
    competitionId: 'premier',
    difficulty: 'facil',
    title: 'Mundiales 90s',
    question: '¿Qué selección ganó el Mundial de 1998?',
    hints: ['Jugaba en casa.'],
  }),
  communityChallenge({
    id: 'leyendas-madrid',
    competitionId: 'laliga',
    difficulty: 'dificil',
    title: 'Leyendas Real Madrid',
    question: '¿Quién es el máximo goleador histórico del Real Madrid?',
    hints: ['Llevó el dorsal 7.'],
  }),
  communityChallenge({
    id: 'estrellas-italianas',
    competitionId: 'seriea',
    difficulty: 'medio',
    title: 'Estrellas italianas',
    question: '¿Qué delantero italiano ganó el Balón de Oro en 1993?',
    hints: ['Le apodaban "Il Divin Codino".'],
  }),
  {
    id: 'champions-2005',
    kind: 'oficial',
    answerType: 'opciones',
    competitionId: 'uefa',
    difficulty: 'medio',
    basePoints: 100,
    title: 'Final de Estambul',
    question: '¿Quién ganó la Champions League en 2005?',
    imageUrl: '/img/estadio.jpg',
    unlockDate: TODAY,
    options: [
      { label: 'A', text: 'AC Milan' },
      { label: 'B', text: 'Liverpool' },
      { label: 'C', text: 'Chelsea' },
      { label: 'D', text: 'Barcelona' },
    ],
    hints: ['Remontó un 3-0 en la segunda parte.', 'Su capitán era Steven Gerrard.'],
    completedBy: 0,
    status: 'aprobado',
    createdBy: null,
  },
  {
    id: 'goleador-laliga',
    kind: 'oficial',
    answerType: 'opciones',
    competitionId: 'laliga',
    difficulty: 'dificil',
    basePoints: 80,
    title: 'Máximo goleador',
    question: '¿Quién es el máximo goleador histórico de LaLiga?',
    imageUrl: '/img/estadio.jpg',
    unlockDate: TODAY,
    options: [
      { label: 'A', text: 'Cristiano Ronaldo' },
      { label: 'B', text: 'Telmo Zarra' },
      { label: 'C', text: 'Lionel Messi' },
      { label: 'D', text: 'Hugo Sánchez' },
    ],
    hints: ['Jugó toda su carrera en LaLiga con un solo club.', 'Marcó 474 goles.'],
    completedBy: 0,
    status: 'aprobado',
    createdBy: null,
  },
  {
    id: 'gol-final-2005',
    kind: 'oficial',
    answerType: 'opciones',
    competitionId: 'uefa',
    difficulty: 'dificil',
    basePoints: 80,
    title: 'Reto oficial del día',
    question: '¿Quién marcó el gol de la victoria en la final de la Champions 2005?',
    imageUrl: '/img/estadio.jpg',
    unlockDate: TODAY,
    options: [
      { label: 'A', text: 'Steven Gerrard' },
      { label: 'B', text: 'Xabi Alonso' },
      { label: 'C', text: 'Vladimír Šmicer' },
      { label: 'D', text: 'Andriy Shevchenko' },
    ],
    hints: ['La final se decidió en los penaltis.', 'Tiró el último penalti de su equipo.'],
    completedBy: 0,
    status: 'aprobado',
    createdBy: null,
  },
]

/** Respuestas correctas (en Supabase nunca se envían al navegador). */
export const correctAnswers: Record<string, string> = {
  'balon-oro-2018': 'Luka Modrić',
  'champions-2005': 'Liverpool',
  'goleador-laliga': 'Lionel Messi',
  'gol-final-2005': 'Vladimír Šmicer',
}

/** Retos "En curso" y "Descubrir" (creados por la comunidad) */
export const inProgress: Array<Pick<CommunityChallenge, 'id' | 'icon' | 'action'>> = [
  { id: 'mundiales-90s', icon: 'trophy', action: 'jugar' },
  { id: 'leyendas-madrid', icon: 'shield', action: 'seguir' },
]
export const discover: typeof inProgress = [{ id: 'estrellas-italianas', icon: 'ball', action: 'empezar' }]

export const weeklyRanking: RankingRow[] = [
  { rank: 1, userId: 'u1', username: 'GOLAZO_MASTER', avatarUrl: null, titles: 12, points: 4920 },
  { rank: 2, userId: 'u2', username: 'STRIKER_99', avatarUrl: null, titles: 8, points: 4750 },
  { rank: 3, userId: 'u3', username: 'VAR_CHECK', avatarUrl: null, titles: 5, points: 4610 },
  { rank: 4, userId: 'u4', username: 'TIKITAKA', avatarUrl: null, titles: 4, points: 4485 },
]

export const achievements: Achievement[] = [
  { code: 'rey-del-gol', name: 'Rey del gol', description: 'Marca 50 goles en partidos de trivia.', icon: 'trophy', state: 'desbloqueado', progress: 1 },
  { code: 'maestro-trivia', name: 'Maestro de la trivia', description: 'Consigue 100 puntuaciones perfectas.', icon: 'medal', state: 'en-progreso', progress: 0.8 },
  { code: 'campeon-liga', name: 'Campeón de liga', description: 'Gana 10 ligas online seguidas.', icon: 'lock', state: 'bloqueado', progress: 0.15 },
  { code: 'heroe-hat-trick', name: 'Héroe del hat-trick', description: '3 respuestas correctas en 5 segundos.', icon: 'star', state: 'en-progreso', progress: 0.3 },
  { code: 'porteria-cero', name: 'Portería a cero', description: 'Termina un día sin errores.', icon: 'shield', state: 'desbloqueado', progress: 1 },
  { code: 'bota-de-oro', name: 'Bota de oro', description: 'Máxima puntuación mensual de tu región.', icon: 'award', state: 'bloqueado', progress: 0 },
]
