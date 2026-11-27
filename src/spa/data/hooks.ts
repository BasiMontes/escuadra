import { useCallback, useContext, useEffect, useState } from 'react'
import { RepoContext } from './context'
import type { Repository } from './repository'

export function useRepository(): Repository {
  const repo = useContext(RepoContext)
  if (!repo) throw new Error('useRepository debe usarse dentro de <DataProvider>')
  return repo
}

type LoadState<T> = { data: T | null; error: Error | null; loading: boolean }

/** Carga asíncrona sencilla. `reload` vuelve a pedir los datos. */
export function useLoad<T>(load: (repo: Repository) => Promise<T>, deps: unknown[] = []) {
  const repo = useRepository()
  const [state, setState] = useState<LoadState<T>>({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    load(repo)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error: Error) => alive && setState({ data: null, error, loading: false }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, tick, ...deps])

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    setTick((t) => t + 1)
  }, [])

  return { ...state, reload }
}
