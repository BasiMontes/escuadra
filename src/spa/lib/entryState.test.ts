import { beforeEach, describe, expect, test } from 'bun:test'
import { handOff, keepInEntry, readEntry } from './entryState'

/** Simula una entrada nueva del historial, como la que crea una navegación. */
const entradaNueva = (state: unknown = {}) => history.pushState(state, '')

beforeEach(() => {
  history.replaceState(null, '')
})

describe('datos de una entrada del historial', () => {
  test('la pantalla de destino lee lo que se le deja', () => {
    handOff('aviso', 'guardado')
    entradaNueva()
    expect(readEntry<string>('aviso')).toBe('guardado')
  })

  test('al guardarlo en la entrada sobrevive a una recarga y conserva lo que ya había', () => {
    handOff('resultado', { puntos: 30 })
    entradaNueva({ key: 'abc' })
    keepInEntry('resultado')
    // Tras recargar solo queda lo que guarda el navegador en la entrada
    expect(history.state.key).toBe('abc')
    expect(readEntry<{ puntos: number }>('resultado')).toEqual({ puntos: 30 })
  })

  test('una entrada nueva no hereda los datos', () => {
    handOff('aviso', 'guardado')
    entradaNueva()
    keepInEntry('aviso')
    entradaNueva()
    expect(readEntry('aviso')).toBeUndefined()
  })

  test('al volver a la entrada, el dato sigue en ella', () => {
    handOff('aviso', 'guardado')
    entradaNueva()
    keepInEntry('aviso')
    const guardada = history.state
    entradaNueva()
    // El navegador restaura el estado de la entrada al ir atrás
    history.replaceState(guardada, '')
    expect(readEntry<string>('aviso')).toBe('guardado')
  })

  test('el dato se entrega una sola vez', () => {
    handOff('aviso', 'guardado')
    entradaNueva()
    keepInEntry('aviso')
    entradaNueva()
    keepInEntry('aviso')
    expect(readEntry('aviso')).toBeUndefined()
  })

  test('varios datos conviven en la misma entrada', () => {
    handOff('uno', 1)
    handOff('dos', 2)
    entradaNueva()
    keepInEntry('uno')
    keepInEntry('dos')
    expect([readEntry<number>('uno'), readEntry<number>('dos')]).toEqual([1, 2])
  })
})
