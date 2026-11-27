import { useRef, useState, type FormEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { BlockTitle } from '../../components/BlockTitle'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { SelectField, TextArea } from '../../components/Field'
import { ErrorNotice } from '../../components/States'
import { useRepository } from '../../data/hooks'
import { AppShell } from '../../layouts/AppShell'
import { SUPPORT_MESSAGE_MAX, validateSupportMessage } from '../../lib/validation'
import { SUPPORT_FAQ } from './faq'
import styles from './Soporte.module.css'

const SUBJECTS = ['Problema técnico', 'Error en una pregunta', 'Mi cuenta', 'Sugerencia'].map((s) => ({
  value: s,
  label: s,
}))

export function Soporte() {
  return (
    <AppShell tab="perfil" title="Soporte" narrow>
      <div className={styles.screen}>
        <Card className={styles.intro}>
          <h2>¿Problemas en el campo?</h2>
          <p>Nuestro VAR está listo para ayudarte. Envíanos un mensaje o revisa las tácticas comunes.</p>
        </Card>

        <section className={styles.faq} aria-labelledby="soporte-faq-titulo">
          <BlockTitle size="sm" id="soporte-faq-titulo">
            Preguntas frecuentes
          </BlockTitle>
          {SUPPORT_FAQ.map((item, i) => (
            <details key={item.id} open={i === 0} data-testid={`soporte-faq-${item.id}`}>
              <summary>
                {item.question}
                <ChevronDown aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>

        <Formulario />
      </div>
    </AppShell>
  )
}

function Formulario() {
  const repo = useRepository()
  const sending = useRef(false)
  const [subject, setSubject] = useState(SUBJECTS[0].value)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [sent, setSent] = useState(false)

  async function send() {
    if (sending.current) return
    sending.current = true
    setBusy(true)
    setFailed(false)
    try {
      await repo.sendSupportTicket({ subject, message: message.trim() })
      setMessage('')
      setSent(true)
    } catch {
      setFailed(true)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(false)
    const problem = validateSupportMessage(message)
    setError(problem)
    if (problem) {
      const form = e.currentTarget
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    void send()
  }

  return (
    <Card className={styles.contact}>
      {failed && <ErrorNotice message="No se ha podido enviar el mensaje." onRetry={() => void send()} />}
      <form onSubmit={onSubmit} noValidate>
        <h2>Habla con el capitán</h2>
        <SelectField
          label="Asunto del reporte"
          look="dark"
          options={SUBJECTS}
          value={subject}
          onValueChange={setSubject}
          data-testid="soporte-asunto"
        />
        <TextArea
          label="Tu mensaje"
          look="flat"
          placeholder="Escribe aquí lo que sucede en el campo..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            setError(null)
            setSent(false)
          }}
          error={error ?? undefined}
          maxLength={SUPPORT_MESSAGE_MAX}
          className={styles.message}
          data-testid="soporte-mensaje"
        />
        <Button type="submit" block disabled={busy} data-testid="soporte-enviar">
          Enviar
        </Button>
        <p role="status" className={styles.sent} data-testid="soporte-enviado">
          {sent ? 'Mensaje enviado. Te responderemos por correo.' : ''}
        </p>
      </form>
    </Card>
  )
}
