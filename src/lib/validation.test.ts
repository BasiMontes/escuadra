import { describe, expect, it } from 'vitest'
import { validateEmail, validatePassword, validateUsername } from './validation'

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
