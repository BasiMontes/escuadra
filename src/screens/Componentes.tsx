import { useState } from 'react'
import { ArrowRight, Bell, Flame, Lock, Trophy } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CheckSquare, IconBox, ProgressBar, RadioDot, StepBar, Toggle } from '../components/Controls'
import { SelectField, TextArea, TextField } from '../components/Field'
import { Logo } from '../components/Logo'
import { DifficultyTag, Tag } from '../components/Tag'
import styles from './Componentes.module.css'

/** Catálogo visual de componentes. Ruta: /componentes (solo desarrollo). */
export function Componentes() {
  const [on, setOn] = useState(true)
  return (
    <div className={`bg-pattern ${styles.page}`}>
      <h1 className={styles.h1}>Escuadra · componentes</h1>

      <section className={styles.section}>
        <h2>Logo</h2>
        <div className={styles.row}>
          <Logo size={48} shadow />
          <Logo size={96} shadow />
          <Logo size={160} shadow />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Botones</h2>
        <div className={styles.stack}>
          <Button block>Continuar</Button>
          <Button variant="secondary" block>
            Ver otros retos
          </Button>
          <Button variant="dark" block>
            Guardar cambios
          </Button>
          <Button variant="danger" block>
            Cerrar sesión
          </Button>
          <Button variant="disabled" block>
            Continuar
          </Button>
          <Button variant="secondary" size="md" block iconRight={<ArrowRight />}>
            Crear reto personalizado
          </Button>
          <div className={styles.row}>
            <Button size="sm">Unirse</Button>
            <Button size="sm" variant="dark" iconRight={<ArrowRight />}>
              Jugar
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Etiquetas</h2>
        <div className={styles.row}>
          <DifficultyTag level="facil" />
          <DifficultyTag level="medio" />
          <DifficultyTag level="dificil" />
          <Tag>Reto oficial del día</Tag>
          <Tag tone="yellow">Nuevo reto</Tag>
          <Tag tone="slate">LaLiga</Tag>
          <Tag tone="green">Desbloqueado</Tag>
          <Tag tone="blue">80 % completado</Tag>
          <Tag tone="locked">Bloqueado</Tag>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Tarjetas</h2>
        <div className={styles.grid}>
          <Card>
            <h3>Blanca</h3>
            <p>Sombra grande, borde de 3 px.</p>
          </Card>
          <Card tone="cream" shadow="sm">
            <h3>Crema</h3>
          </Card>
          <Card tone="black">
            <h3>Negra</h3>
          </Card>
          <Card tone="green" tilt={-1.5}>
            <h3>¡Correcto!</h3>
          </Card>
          <Card tone="coral" tilt={-1}>
            <h3>¡Incorrecto!</h3>
          </Card>
          <Card tone="locked">
            <h3>Bloqueada</h3>
          </Card>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Campos</h2>
        <div className={styles.stack}>
          <TextField label="Nombre de usuario" placeholder="Ej: SQUAD_LEADER" look="flat" />
          <TextField label="Contraseña" type="password" placeholder="********" />
          <TextField label="Con error" defaultValue="ab" error="Mínimo 3 caracteres." />
          <TextArea label="Descripción" placeholder="Describe de qué trata tu reto..." />
          <SelectField
            label="Liga"
            options={[
              { value: 'uefa', label: 'UEFA Champions League' },
              { value: 'laliga', label: 'LaLiga' },
            ]}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Controles</h2>
        <div className={styles.row}>
          <Toggle checked={on} onChange={setOn} label="Ejemplo" />
          <Toggle checked={!on} onChange={(v) => setOn(!v)} label="Ejemplo 2" />
          <RadioDot checked />
          <RadioDot checked={false} />
          <CheckSquare checked />
          <CheckSquare checked={false} />
          <IconBox>
            <Trophy />
          </IconBox>
          <IconBox tone="black">
            <Bell />
          </IconBox>
          <IconBox tone="orange">
            <Flame />
          </IconBox>
          <IconBox tone="locked">
            <Lock />
          </IconBox>
        </div>
        <div className={styles.stack}>
          <ProgressBar value={0.6} label="Tiempo restante" height="lg" />
          <ProgressBar value={0.25} label="Paso 1 de 4" />
          <ProgressBar value={0.8} tone="blue" height="sm" label="Progreso" divider={false} />
          <StepBar current={1} />
        </div>
      </section>
    </div>
  )
}
