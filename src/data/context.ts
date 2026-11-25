import { createContext } from 'react'
import type { Repository } from './repository'

export const RepoContext = createContext<Repository | null>(null)
