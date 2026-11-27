import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera } from 'lucide-react'
import { useNavigate } from '../../router'
import { Button } from '../../components/Button'
import { TextArea, TextField } from '../../components/Field'
import { ErrorNotice, Skeleton } from '../../components/States'
import { useLoad, useRepository } from '../../data/hooks'
import type { Profile } from '../../data/types'
import { AppShell } from '../../layouts/AppShell'
import { handOff } from '../../lib/entryState'
import { BIO_MAX, validateAvatar, validateBio, validateEmail, validateUsername } from '../../lib/validation'
import styles from './EditarPerfil.module.css'

export function EditarPerfil() {
  const { data, error, loading, reload } = useLoad((r) => r.getMe())

  return (
    <AppShell tab="perfil" title="Editar perfil" parent="/perfil">
      {error && <ErrorNotice message="No se ha podido cargar tu perfil." onRetry={reload} />}
      {loading && <Skeleton height={480} />}
      {data && <Formulario profile={data} />}
    </AppShell>
  )
}

type Errors = { username?: string; email?: string; bio?: string; avatar?: string }

function Formulario({ profile }: { profile: Profile }) {
  const repo = useRepository()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const sending = useRef(false)
  const [values, setValues] = useState({
    username: profile.username,
    email: profile.email,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (key: 'username' | 'email' | 'bio') => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    setErrors((x) => ({ ...x, [key]: undefined }))
    setFormError(null)
  }

  function pickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Permite volver a elegir el mismo archivo
    e.target.value = ''
    if (!file) return
    const problem = validateAvatar(file)
    setErrors((x) => ({ ...x, avatar: problem ?? undefined }))
    if (problem) return
    const reader = new FileReader()
    reader.onload = () => setValues((v) => ({ ...v, avatarUrl: String(reader.result) }))
    reader.onerror = () => setErrors((x) => ({ ...x, avatar: 'No se ha podido leer la foto.' }))
    reader.readAsDataURL(file)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending.current) return
    const form = e.currentTarget
    const next: Errors = {
      username: validateUsername(values.username) ?? undefined,
      email: validateEmail(values.email) ?? undefined,
      bio: validateBio(values.bio) ?? undefined,
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    sending.current = true
    setSaving(true)
    setFormError(null)
    try {
      await repo.updateMe({
        username: values.username.trim(),
        email: values.email.trim(),
        bio: values.bio.trim(),
        avatarUrl: values.avatarUrl,
      })
      handOff('perfil-guardado', true)
      navigate('/perfil')
    } catch (err) {
      setFormError((err as Error).message)
      setSaving(false)
      sending.current = false
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.photo}>
        <div className={styles.avatar}>
          <img src={values.avatarUrl ?? '/img/avatar-generico.jpg'} alt="" data-testid="editar-foto" />
          <span aria-hidden="true">
            <Camera />
          </span>
        </div>
        <button
          type="button"
          className={styles.change}
          onClick={() => fileInput.current?.click()}
          aria-describedby={errors.avatar ? 'editar-foto-error' : undefined}
          data-testid="editar-cambiar-foto"
        >
          Cambiar foto
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={pickPhoto}
          hidden
          data-testid="editar-archivo"
        />
        {errors.avatar && (
          <p id="editar-foto-error" className={styles.error} role="alert">
            {errors.avatar}
          </p>
        )}
      </div>

      <div className={styles.fields}>
        <TextField
          label="Nombre de usuario"
          value={values.username}
          onChange={set('username')}
          error={errors.username}
          autoComplete="username"
          data-testid="editar-usuario"
        />
        <TextField
          label="Correo electrónico"
          type="email"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
          autoComplete="email"
          data-testid="editar-email"
        />
        <TextArea
          label="Biografía"
          value={values.bio}
          onChange={set('bio')}
          error={errors.bio}
          maxLength={BIO_MAX}
          rows={3}
          className={styles.bio}
          data-testid="editar-biografia"
        />
        {formError && (
          <p className={styles.formError} role="alert" data-testid="editar-error">
            {formError}
          </p>
        )}
        <div className={styles.actions}>
          <Button type="submit" variant="dark" block disabled={saving} data-testid="editar-guardar">
            Guardar cambios
          </Button>
          <Button to="/perfil" variant="secondary" block data-testid="editar-cancelar">
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  )
}
