import { ArrowRight, Check, ChevronDown, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Logo } from '../../components/Logo'
import { cx } from '../../components/cx'
import { formatNumber } from '../../lib/game'
import { DEMO_OPTIONS, FAQ, FEATURES, FIGURES, LEAGUES, NAV, SAMPLE_RANKING, STEPS } from './content'
import styles from './Bienvenida.module.css'

/** Página pública de presentación. */
export function Bienvenida() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <span className={styles.brand}>
            <Logo size={40} bordered={false} />
            Escuadra
          </span>
          <nav aria-label="Secciones">
            {NAV.map((item) => (
              <a key={item.id} href={`#${item.id}`} data-testid={`landing-nav-${item.id}`}>
                {item.label}
              </a>
            ))}
          </nav>
          <Link to="/entrar" className={styles.enter} data-testid="landing-entrar">
            Entrar
          </Link>
          <Button to="/registro" size="md" className={styles.headerCta} data-testid="landing-cabecera-registro">
            Empieza gratis
          </Button>
        </div>
      </header>

      <main>
        <section className={styles.yellow}>
          <div className={cx(styles.inner, styles.hero)}>
            <div className={styles.pitch}>
              <p className={styles.badge}>
                <Clock aria-hidden="true" />
                Trivia de fútbol diaria
              </p>
              <h1>Un reto al día. ¿Cuánto sabes de fútbol?</h1>
              <p className={styles.lead}>
                Cada día recibes una pregunta de tu competición favorita. Tienes 20 segundos para responder, mantener tu
                racha y escalar en el ranking.
              </p>
              <div className={styles.buttons}>
                <Button to="/registro" iconRight={<ArrowRight />} data-testid="landing-registro">
                  Empieza gratis
                </Button>
                <a href="#como-funciona" className={styles.secondary} data-testid="landing-como-funciona">
                  Cómo funciona
                </a>
              </div>
              <p className={styles.check}>
                <Check aria-hidden="true" />
                Gratis para empezar · Retos nuevos cada día
              </p>
            </div>

            {/* Muestra estática de una pregunta: no se puede jugar */}
            <figure className={styles.demo} aria-label="Ejemplo de pregunta">
              <span className={styles.demoTag}>Pregunta del día</span>
              <p className={styles.demoTimer}>
                <span>Tiempo restante</span>
                <strong>12s</strong>
              </p>
              <span className={styles.demoBar} aria-hidden="true">
                <span />
              </span>
              <p className={styles.demoQuestion}>¿Qué selección ganó el Mundial de 2010?</p>
              <ol>
                {DEMO_OPTIONS.map((option, i) => (
                  <li key={option} className={cx(option === 'España' && styles.demoPicked)}>
                    <span>{'ABCD'[i]}</span>
                    {option}
                  </li>
                ))}
              </ol>
              <figcaption>+120 puntos · Dificultad difícil</figcaption>
            </figure>
          </div>
        </section>

        <section className={styles.black} aria-label="En cifras">
          <dl className={cx(styles.inner, styles.figures)}>
            {FIGURES.map((figure) => (
              <div key={figure.label}>
                <dt>{figure.label}</dt>
                <dd>{figure.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="como-funciona" className={styles.white}>
          <div className={styles.inner}>
            <p className={styles.kicker}>Cómo funciona</p>
            <h2>Tres pasos y a jugar</h2>
            <ol className={styles.steps}>
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <span aria-hidden="true">0{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="funcionalidades" className={styles.yellow}>
          <div className={styles.inner}>
            <p className={styles.kicker}>Por qué engancha</p>
            <h2>Más que una trivia</h2>
            <p className={styles.sub}>Pensado para jugar en un minuto y volver mañana.</p>
            <ul className={styles.features}>
              {FEATURES.map((feature) => (
                <li key={feature.title}>
                  <span aria-hidden="true">{feature.icon}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="competiciones" className={styles.white}>
          <div className={cx(styles.inner, styles.split)}>
            <div>
              <p className={styles.kicker}>Competiciones</p>
              <h2>Tu liga, tus retos</h2>
              <p className={styles.sub}>Elige tu competición favorita y recibe preguntas de esa liga cada semana.</p>
            </div>
            <ul className={styles.leagues}>
              {LEAGUES.map((league) => (
                <li key={league}>{league}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="ranking" className={styles.black}>
          <div className={cx(styles.inner, styles.split)}>
            <div>
              <p className={styles.kicker}>Ranking global</p>
              <h2>Escala hasta el top</h2>
              <p className={styles.sub}>
                Cuanto antes aciertes, más puntos sumas.
                <span className={styles.wide}> Compite cada semana contra aficionados de todo el mundo.</span>
              </p>
              <Button to="/ranking" size="md" iconRight={<ArrowRight />} className={styles.rankingCta} data-testid="landing-ver-ranking">
                Ver ranking
              </Button>
            </div>
            <div className={styles.board}>
              <p>
                <span>Esta semana</span>
                <span>Puntos</span>
              </p>
              <ul>
                {SAMPLE_RANKING.map((row) => (
                  <li key={row.rank} className={cx(row.name === 'TÚ' && styles.you)}>
                    <span>{row.rank}</span>
                    <strong>{row.name}</strong>
                    <em>{formatNumber(row.points)} pts</em>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="faq" className={styles.white}>
          <div className={cx(styles.inner, styles.split)}>
            <div>
              <p className={styles.kicker}>Dudas</p>
              <h2>Preguntas frecuentes</h2>
              <p className={cx(styles.sub, styles.wide)}>¿No encuentras tu respuesta? Escríbenos desde la app.</p>
            </div>
            <div className={styles.faq}>
              {FAQ.map((item, i) => (
                <details key={item.question} open data-testid={`landing-faq-${i + 1}`}>
                  <summary>
                    {item.question}
                    <ChevronDown aria-hidden="true" />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.yellow}>
          <div className={styles.inner}>
            <div className={styles.cta}>
              <div>
                <h2>¿Listo para el reto de hoy?</h2>
                <p>Crea tu escuadra en menos de un minuto y responde tu primera pregunta hoy mismo.</p>
              </div>
              <Button to="/registro" iconRight={<ArrowRight />} data-testid="landing-final-registro">
                Empieza gratis
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.inner}>
          <span className={styles.brand}>
            <Logo size={32} bordered={false} />
            Escuadra
          </span>
          <nav aria-label="Legal y contacto">
            <Link to="/privacidad" data-testid="landing-privacidad">
              Privacidad
            </Link>
            <Link to="/terminos" data-testid="landing-terminos">
              Términos
            </Link>
            <Link to="/ajustes/soporte" data-testid="landing-contacto">
              Contacto
            </Link>
          </nav>
          <p>© 2026 Escuadra. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
