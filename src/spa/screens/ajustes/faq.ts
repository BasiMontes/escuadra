import { CHALLENGE_SECONDS, DIFFICULTY_MULTIPLIER, HINT_PENALTY, formatNumber } from '../../lib/game'

const { facil, medio, dificil } = DIFFICULTY_MULTIPLIER

/** Preguntas frecuentes de Soporte. Las cifras salen de las reglas del juego. */
export const SUPPORT_FAQ = [
  {
    id: 'pistas',
    question: '¿Cómo funcionan las pistas?',
    answer: `Cada reto tiene de 1 a 3 pistas y tú tienes un saldo diario según tu configuración. Cada pista que revelas gasta una y resta ${HINT_PENALTY} puntos.`,
  },
  {
    id: 'ranking',
    question: 'Error en el ranking',
    answer:
      'El ranking semanal suma los puntos de los retos oficiales de lunes a domingo y se reinicia los lunes a las 00:00. Solo puntúa tu primer intento de cada reto; los retos de la comunidad son para divertirse y no suman. Si ves algo raro, escríbenos con este formulario.',
  },
  {
    id: 'reglas',
    question: 'Reglas del torneo',
    answer: `Tienes ${CHALLENGE_SECONDS} segundos por reto y cuanto antes aciertes, más puntos sumas. La dificultad multiplica la puntuación: Fácil ×${formatNumber(facil)}, Medio ×${formatNumber(medio)} y Difícil ×${formatNumber(dificil)}.`,
  },
]
