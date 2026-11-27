import { useLayoutEffect } from 'react'
import { useLocation } from '../router'

/**
 * Datos que una pantalla deja a la siguiente. Viajan en memoria y se guardan en la entrada del
 * historial de destino, así sobreviven a una recarga y reaparecen al volver atrás.
 */
const FIELD = 'escuadra'
const pending = new Map<string, unknown>()

const stored = (): Record<string, unknown> => history.state?.[FIELD] ?? {}

/** Se llama justo antes de navegar. */
export function handOff(key: string, value: unknown) {
  pending.set(key, value)
}

export function readEntry<T>(key: string): T | undefined {
  return (pending.has(key) ? pending.get(key) : stored()[key]) as T | undefined
}

export function keepInEntry(key: string) {
  if (!pending.has(key)) return
  history.replaceState({ ...history.state, [FIELD]: { ...stored(), [key]: pending.get(key) } }, '')
  pending.delete(key)
}

export function useEntryState<T>(key: string): T | undefined {
  // Vuelve a leer al cambiar de entrada aunque la pantalla siga montada
  useLocation()
  const value = readEntry<T>(key)
  useLayoutEffect(() => keepInEntry(key))
  return value
}
