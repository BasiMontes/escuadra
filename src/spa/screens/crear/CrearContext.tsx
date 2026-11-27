import { useState, type ReactNode } from 'react'
import { CrearCtx, EMPTY_DRAFT, type CrearDraft, type PublishedChallenge } from './crearState'

/** Conserva el borrador mientras se recorren los pasos. */
export function CrearProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CrearDraft>(EMPTY_DRAFT)
  const [published, setPublished] = useState<PublishedChallenge | null>(null)

  return (
    <CrearCtx.Provider
      value={{
        draft,
        update: (patch) => setDraft((d) => ({ ...d, ...patch })),
        published,
        publish: (result) => {
          setPublished(result)
          setDraft(EMPTY_DRAFT)
        },
      }}
    >
      {children}
    </CrearCtx.Provider>
  )
}
