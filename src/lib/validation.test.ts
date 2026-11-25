import { describe, expect, it } from 'vitest'
import {
  AVATAR_MAX_BYTES,
  validateAnswer,
  validateAvatar,
  validateBasePoints,
  validateBio,
  validateChallengeQuestion,
  validateChallengeTitle,
  validateEmail,
  validateHint,
  validatePassword,
  validateUsername,
} from './validation'

describe('validateUsername', () => {
  it('acepta nombres válidos', () => {
    expect(validateUsername('SQUAD_LEADER')).toBeNull()
    expect(validateUsername('Striker99')).toBeNull()
  })
  it('rechaza vacíos, cortos, largos y con espacios', () => {
    expect(validateUsername('  ')).toMatch(/Escribe/)
    expect(validateUsername('ab')).toMatch(/Mínimo/)
    expect(validateUsername('a'.repeat(21))).toMatch(/Máximo/)
    expect(validateUsername('con espacio')).toMatch(/solo letras/)
  })
})

describe('validateEmail', () => {
  it('acepta correos válidos y rechaza el resto', () => {
    expect(validateEmail('contacto@escuadra.app')).toBeNull()
    expect(validateEmail('')).toMatch(/Escribe/)
    expect(validateEmail('sin-arroba.com')).toMatch(/válido/)
  })
})

describe('validatePassword', () => {
  it('aplica las tres reglas del diseño', () => {
    expect(validatePassword('corta1!')).toMatch(/8 caracteres/)
    expect(validatePassword('sinnumero!')).toMatch(/número/)
    expect(validatePassword('sinespecial1')).toMatch(/especial/)
    expect(validatePassword('Valida123!')).toBeNull()
  })
})

describe('retos creados por usuarios', () => {
  it('exige título y pregunta con una longitud mínima', () => {
    expect(validateChallengeTitle('   ')).toBe('Escribe un título.')
    expect(validateChallengeTitle('ab')).toBe('Mínimo 3 caracteres.')
    expect(validateChallengeTitle('Mundiales 90s')).toBeNull()
    expect(validateChallengeQuestion('¿Quién?')).toBe('Mínimo 10 caracteres.')
    expect(validateChallengeQuestion('¿Quién ganó el Mundial de 1998?')).toBeNull()
  })

  it.each(['', '9', '201', '10.5', 'cien'])('rechaza "%s" como puntos base', (value) => {
    expect(validateBasePoints(value)).toBe('Escribe un número entero entre 10 y 200.')
  })

  it.each(['10', '100', '200'])('acepta %s puntos base', (value) => {
    expect(validateBasePoints(value)).toBeNull()
  })

  it('rechaza pistas vacías y respuestas sin letras ni números', () => {
    expect(validateHint('  ')).toBe('Escribe la pista o elimínala.')
    expect(validateHint('Juega en Londres.')).toBeNull()
    expect(validateAnswer(' ¡!? ')).toBe('Escribe una respuesta con letras o números.')
    expect(validateAnswer('Arsenal F.C.')).toBeNull()
  })
})

describe('perfil', () => {
  it('limita la biografía a 160 caracteres', () => {
    expect(validateBio('a'.repeat(160))).toBeNull()
    expect(validateBio('a'.repeat(161))).toBe('Máximo 160 caracteres.')
  })

  it('solo acepta fotos JPG, PNG o WebP de hasta 2 MB', () => {
    expect(validateAvatar({ type: 'image/png', size: AVATAR_MAX_BYTES })).toBeNull()
    expect(validateAvatar({ type: 'image/gif', size: 10 })).toBe('La foto debe ser JPG, PNG o WebP.')
    expect(validateAvatar({ type: 'image/jpeg', size: AVATAR_MAX_BYTES + 1 })).toBe('La foto no puede pesar más de 2 MB.')
  })
})
