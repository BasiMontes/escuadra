import { useState, type ReactNode } from 'react'
import { RepoContext } from './context'
import { createMockRepository } from './mockRepository'
import type { Repository } from './repository'

/**
 * Proporciona la fuente de datos a toda la app.
 * Por defecto usa los datos de ejemplo; los tests pueden pasar su propio repositorio.
 */
export function DataProvider({ children, repository }: { children: ReactNode; repository?: Repository }) {
  const [repo] = useState<Repository>(() => repository ?? createMockRepository())
  return <RepoContext.Provider value={repo}>{children}</RepoContext.Provider>
}
