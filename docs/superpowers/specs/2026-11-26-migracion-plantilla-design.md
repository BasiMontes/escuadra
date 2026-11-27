# Migrar Escuadra a la base de `project_template`

Escuadra pasa de Vite + React Router + npm a la base de
[`BasiMontes/project_template`](https://github.com/BasiMontes/project_template) (Next.js + Supabase + Bun),
para que todos los proyectos compartan la misma base. La migración es **solo de paridad**: mismas
pantallas, mismos flujos y mismos datos simulados.

Fecha: 2026-11-26. Estado: diseño y [plan de implementación](../../../tasks/plan.md) aprobados.

## Resumen

| Paso | PR | Qué cambia | Qué no cambia |
|------|----|------------|---------------|
| Salto 1 | 1 | Herramientas y arranque: Bun y Next | Código de la app y React Router |
| Salto 2a | 1 | Rutas: de React Router a Next | Ubicación del código |
| Salto 2b | 1 | Orden: capas de la plantilla y ESLint | Comportamiento |

## Decisiones

| Tema | Decisión | Motivo |
|------|----------|--------|
| Cómo unir | Migrar Escuadra a la plantilla | `project-adoption` solo admite Next.js y Bun (`V1_SUPPORTED`, ADR-0008 de la plantilla) |
| Alcance | Solo paridad | Cambiar plataforma y autenticación a la vez impide saber qué rompió qué |
| Enfoque | Dos saltos | Es el orden de la [guía oficial de Next para migrar desde Vite](https://nextjs.org/docs/app/guides/migrating/from-vite) |
| Repositorio | El mismo `escuadra`, en ramas | Conserva historial; `main` no cambia hasta estar en verde |
| Estilos | CSS Modules y tokens actuales | Tailwind y shadcn cambiarían el diseño |
| Idioma | Interfaz y commits en español | La plantilla pide commits en inglés: se anota como excepción del proyecto |

## Estructura

La plantilla se trae desde el commit `a377e29` (`git archive`), y después se nombra el proyecto con
`bun run project:name escuadra`.

### Archivos que chocan

| Archivo | Resultado |
|---------|-----------|
| `package.json`, `tsconfig.json`, `.oxlintrc.json` | Los de la plantilla, sumando las dependencias de Escuadra |
| `.gitignore`, `.env.example` | Se combinan |
| `README.md` | El de Escuadra, con los comandos nuevos |
| `playwright.config.ts` | El de Escuadra (móvil, desktop, portátil, WebKit y capturas), adaptado al arranque nuevo |
| `CLAUDE.md` | El de la plantilla; el contexto de Escuadra pasa a la skill `escuadra-context` |

### Código

- La app actual va a `src/spa/`, sin reorganizar en el salto 1.
- `platform`, `adapters` y `features` de la plantilla se conservan dormidos hasta el bloque de cuentas.
- Se quitan las páginas de ejemplo (inicio, login, registro, cuenta y legales) y sus tests de
  navegador. Se mantienen `api/health` y `auth/confirm`.
- Se quitan del layout el Tailwind global y el pie legal.

## Salto 1: herramientas y arranque

1. Base de la plantilla con los choques resueltos.
2. App montada en `app/[[...slug]]`, solo en cliente (`ssr: false`).
3. `index.html` y `main.tsx` pasan al layout de Next: idioma, título, metadatos, icono, fuentes y estilos.
4. `import.meta.env` pasa a variables `NEXT_PUBLIC_*` (solo lo usa `data/supabaseClient.ts`).
5. Tests unitarios de Vitest a `bun test` (cuatro archivos).
6. ESLint ignora `src/spa/`. Oxlint y la comprobación de tipos siguen revisando.

## Salto 2a: rutas

- Cada ruta pasa a ser una página de Next.
- Los proveedores de onboarding y de crear reto pasan a layouts.
- El resultado de la partida y el aviso de «perfil guardado» viajan en el estado de navegación de
  React Router, que Next no tiene: pasan a memoria de la app.
- Se elimina React Router.

## Salto 2b: orden

- El código se reparte en las capas `app`, `features`, `adapters` y `platform`.
- ESLint se activa en todo. La autocorrección de formato va en un commit aparte.
- Desaparece `src/spa/`.

## Verificación

**Regla:** durante la migración no se regeneran capturas ni se tocan aserciones. Si algo difiere, se
corrige el código. Excepción aprobada, sin cambiar ningún valor esperado: el localizador de alertas y
la espera de carga antes de capturar, descritos en el plan.

Cada PR pasa:

- [ ] `repo:check`, tests unitarios y build.
- [ ] Playwright en móvil, desktop y portátil.
- [ ] Los mismos flujos en WebKit.
- [ ] Capturas visuales en Docker, con tolerancia cero.
- [ ] Revisión manual antes de fusionar.

### CI y ramas

- Los cuatro trabajos actuales (tipos y unitarios, flujos, Safari y visual) pasan a Bun y se suman
  las comprobaciones de la plantilla.
- Playwright no arranca Supabase ni espera por `/api/health`, que responde 503 sin él.
- Los PR siguen yendo contra `main`. La rama `staging` y la promoción quedan para después.
- Los workflows de operación quedan apagados.

## Riesgos

| Riesgo | Control |
|--------|---------|
| Next ordena distinto los CSS Modules y cambian píxeles | Las capturas lo detectan; se corrige el CSS |
| La política de seguridad bloquea los scripts de una página generada estática | El layout fuerza el renderizado por petición |
| Temporizadores falsos distintos en `bun test` | Verificar con `mockRepository.test.ts` |
| TypeScript baja de la versión 7 a la 5.9 | Comprobación de tipos en el salto 1 |
| Reglas de Oxlint de la plantilla marcan código de Escuadra | Se mide en el salto 1 y se ajusta sin cambiar comportamiento |
| Las comprobaciones de código sin usar fallan por la parte dormida | Excepción declarada y anotada |

## Por comprobar en el salto 1

- Qué workflows de la plantilla se ejecutan sin configuración y cuáles hay que desactivar.
- Qué comprobaciones de `repo:check` y de los hooks de git afectan a `src/spa/`.

## Fuera de alcance

Cuentas reales y base de datos, Stripe, notificaciones push, Sentry y analítica, rama `staging`,
Jira, rediseño con Tailwind y shadcn, y las decisiones abiertas de [`docs/producto.md`](../../producto.md).
