import { useRef, useState } from 'react'
import { useNavigate } from '../router'
import { useRepository } from './hooks'

/** Cierra la sesión una sola vez y lleva a la pantalla de entrada. */
export function useSignOut() {
  const repo = useRepository()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const leaving = useRef(false)

  async function signOut() {
    if (leaving.current) return
    leaving.current = true
    setFailed(false)
    try {
      await repo.signOut()
      navigate('/entrar')
    } catch {
      leaving.current = false
      setFailed(true)
    }
  }

  return { signOut: () => void signOut(), failed }
}
