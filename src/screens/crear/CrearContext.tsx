import { useState } from 'react'
import { Outlet } from 'react-router'
import { CrearCtx, EMPTY_DRAFT, type CrearDraft, type PublishedChallenge } from './crearState'

/** Conserva el borrador mientras se recorren los pasos. */
export function CrearProvider() {
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
      <Outlet />
    </CrearCtx.Provider>
  )
}
