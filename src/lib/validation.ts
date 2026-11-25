/** Validaciones de formularios. Devuelven el mensaje de error o null si el valor es válido. */

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
