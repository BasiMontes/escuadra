/** Validaciones de formularios. Devuelven el mensaje de error o null si el valor es válido. */
import { normalizeAnswer } from './game'

export function validateUsername(v: string): string | null {
  const t = v.trim()
  if (!t) return 'Escribe un nombre de usuario.'
  if (t.length < 3) return 'Mínimo 3 caracteres.'
  if (t.length > 20) return 'Máximo 20 caracteres.'
  if (!/^[\p{Letter}\p{Number}_.-]+$/u.test(t)) return 'Usa solo letras, números, guion o guion bajo.'
  return null
}

export function validateEmail(v: string): string | null {
  const t = v.trim()
  if (!t) return 'Escribe tu correo electrónico.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Ese correo no parece válido.'
  return null
}

/** Reglas de contraseña del diseño (Cambiar contraseña) */
export const PASSWORD_RULES = [
  { id: 'longitud', label: 'Al menos 8 caracteres', test: (v: string) => v.length >= 8 },
  { id: 'numero', label: 'Al menos un número', test: (v: string) => /\d/.test(v) },
  { id: 'especial', label: 'Al menos un carácter especial', test: (v: string) => /[^\p{Letter}\p{Number}\s]/u.test(v) },
] as const

export function validatePassword(v: string): string | null {
  if (!v) return 'Escribe una contraseña.'
  const failed = PASSWORD_RULES.find((r) => !r.test(v))
  return failed ? `${failed.label}.` : null
}

/** Límites de los retos creados por usuarios */
export const CHALLENGE_LIMITS = {
  titleMin: 3,
  titleMax: 60,
  questionMin: 10,
  questionMax: 200,
  pointsMin: 10,
  pointsMax: 200,
  hintsMax: 3,
  hintMax: 120,
  answerMax: 60,
} as const

function validateText(v: string, empty: string, min: number, max: number): string | null {
  const t = v.trim()
  if (!t) return empty
  if (t.length < min) return `Mínimo ${min} caracteres.`
  if (t.length > max) return `Máximo ${max} caracteres.`
  return null
}

export function validateChallengeTitle(v: string): string | null {
  const { titleMin, titleMax } = CHALLENGE_LIMITS
  return validateText(v, 'Escribe un título.', titleMin, titleMax)
}

export function validateChallengeQuestion(v: string): string | null {
  const { questionMin, questionMax } = CHALLENGE_LIMITS
  return validateText(v, 'Escribe la pregunta de tu reto.', questionMin, questionMax)
}

export function validateBasePoints(v: string): string | null {
  const { pointsMin, pointsMax } = CHALLENGE_LIMITS
  const n = Number(v)
  if (!v.trim() || !Number.isInteger(n) || n < pointsMin || n > pointsMax) {
    return `Escribe un número entero entre ${pointsMin} y ${pointsMax}.`
  }
  return null
}

export function validateHint(v: string): string | null {
  return validateText(v, 'Escribe la pista o elimínala.', 1, CHALLENGE_LIMITS.hintMax)
}

export function validateAnswer(v: string): string | null {
  // Una respuesta hecha solo de signos quedaría vacía al comparar
  if (!normalizeAnswer(v)) return 'Escribe una respuesta con letras o números.'
  if (v.trim().length > CHALLENGE_LIMITS.answerMax) return `Máximo ${CHALLENGE_LIMITS.answerMax} caracteres.`
  return null
}

export const BIO_MAX = 160
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateBio(v: string): string | null {
  return v.trim().length > BIO_MAX ? `Máximo ${BIO_MAX} caracteres.` : null
}

export function validateAvatar(file: { type: string; size: number }): string | null {
  if (!AVATAR_TYPES.includes(file.type)) return 'La foto debe ser JPG, PNG o WebP.'
  if (file.size > AVATAR_MAX_BYTES) return 'La foto no puede pesar más de 2 MB.'
  return null
}

export const SUPPORT_MESSAGE_MIN = 10
export const SUPPORT_MESSAGE_MAX = 1000

export function validateSupportMessage(v: string): string | null {
  return validateText(v, 'Escribe tu mensaje.', SUPPORT_MESSAGE_MIN, SUPPORT_MESSAGE_MAX)
}
