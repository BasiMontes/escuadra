# Plan de implementación: Escuadra sobre `project_template`

Diseño: [`docs/superpowers/specs/2026-11-26-migracion-plantilla-design.md`](../docs/superpowers/specs/2026-11-26-migracion-plantilla-design.md).
Lista de seguimiento: [`todo.md`](todo.md). Plantilla fijada en el commit `a377e29`.

Tres PR en orden: **salto 1** (Bun y Next), **salto 2a** (rutas) y **salto 2b** (capas).

## Excepción aprobada: dos cambios en los tests

El diseño dice que no se tocan aserciones. Se aprobaron el 2026-11-26 dos cambios en código de test
que no alteran ningún valor esperado:

| Cambio | Causa |
|--------|-------|
| El localizador de alertas excluye el anunciador de rutas de Next | Next añade un segundo elemento con `role="alert"` y Playwright rechaza la ambigüedad |
| `expectFullScreen` espera a que termine la carga antes de capturar | Con la app montada solo en cliente, `goto` resuelve antes de que haya contenido |

## Lo medido en un ensayo del salto 1

Copia desechable, fuera del repositorio, en macOS. Primero falla; con la corrección indicada pasa.

| Comprobación | Sin corregir | Corrección | Corregido |
|--------------|--------------|------------|-----------|
| Tipos y build | 2 errores | `lib` ES2023 y `setSystemTime` de `bun:test` | Verde |
| Unitarios (app completa) | 4 fallos | La de `setSystemTime` | 179 pasan |
| Flujos en Chromium | 16 fallos | Localizador de alertas | 514 pasan, 124 omitidos |
| Flujos en WebKit | Se corta a los 12 fallos | Sin `upgrade-insecure-requests` en HTTP | 512 pasan, 126 omitidos |
| Capturas visuales | 4 fallos | Espera de carga | 74 tests pasan (78 capturas), idénticas a la app actual |
| Oxlint | Verde | Ninguna | Verde |
| ESLint | 4230 problemas | Ignorar `src/spa`, `e2e` y `playwright.config.ts` | Queda 1 error, en `spa.tsx` |
| `format:check` | 2 archivos CSS | Ignorar `src/spa` en Prettier | Sin repetir |
| `knip:check` | Exportaciones sin usar | Excepciones en `knip.json` | Sin repetir |
| `docs:check` | 3 menciones de «hoy» | Reescribir las frases | Sin repetir |

El resto de comprobaciones de `repo:check` y los tests de herramientas (245) pasan sin cambios.

**Sin medir:** capturas en Linux (Docker o CI), los workflows en GitHub y los hooks de git.

## Orden y dependencias

```
1 base → 2 arranque → 3 tipos y unitarios → 4 navegador → 5 comprobaciones → 6 CI → 7 documentación → PR salto 1
                                                                                  ↓
                          8 estado de navegación → 9 adaptador → 10 rutas de Next → 11 limpieza → PR salto 2a
                                                                                  ↓
                               12 mapa de capas → 13 compartido → 14 pantallas → 15 formato → PR salto 2b
```

Los commits van en español y siguen Conventional Commits. Subir, abrir PR y fusionar: solo cuando se pida.

---

## Salto 1: herramientas y arranque

Rama `migracion/salto-1`, creada desde `docs/migracion-plantilla`. Las tareas 1 a 4 dejan la rama
incompleta: la primera revisión útil es el punto de control A.

### Tarea 1: traer la base de la plantilla

- **Hace:** extrae `a377e29` con `git archive` y resuelve los 8 choques según la tabla del diseño.
  Ejecuta `bun run project:name escuadra`. Conserva `LICENSE` y el crédito en el README, que la
  licencia MIT exige.
- **Aceptación:**
  - [ ] `bun install` termina y genera `bun.lock`; `package-lock.json` desaparece.
  - [ ] `package.json` suma `react-router`, `lucide-react`, las dos fuentes y `@axe-core/playwright`.
  - [ ] Quitados: `src/app/{page.tsx,page.test.tsx,account,login,signup,forgot-password,update-password,privacy,cookies,globals.css,icon.svg}`,
        el `e2e/` de la plantilla y los archivos de Vite (`index.html`, `vite.config.ts`, `tsconfig.app.json`, `tsconfig.node.json`).
- **Verificación:** `bun run test:tooling`.
- **Depende de:** nada. **Tamaño:** grande en archivos, mecánico.

### Tarea 2: montar la app en Next

- **Hace:** mueve `src/` de Escuadra a `src/spa/`, crea `src/app/[[...slug]]/{page,spa}.tsx` con
  `dynamic(() => import('../../spa/App'), { ssr: false })` y reescribe `src/app/layout.tsx`.
- **Aceptación:**
  - [ ] El layout tiene `lang="es"`, título, descripción, icono `/logo.svg`, `themeColor` `#100E0E`,
        las fuentes, `global.css` y `<div id="root">`.
  - [ ] El layout llama a `await connection()`: sin renderizado por petición, la política de seguridad
        bloquea los scripts.
  - [ ] `main.tsx` y `test-setup.ts` desaparecen; `supabaseClient.ts` lee `NEXT_PUBLIC_*`.
- **Verificación:** `bun run dev` y recorrido manual por splash, inicio y un reto.
- **Depende de:** 1. **Archivos:** `src/app/layout.tsx`, `src/app/[[...slug]]/*`, `src/spa/data/supabaseClient.ts`.

### Tarea 3: tipos y tests unitarios

- **Hace:** `tsconfig.json` con `"lib": ["ES2023", "dom", "dom.iterable"]`; los 4 tests importan de
  `bun:test`; `mockRepository.test.ts` usa `setSystemTime` en lugar de `vi.setSystemTime`.
- **Aceptación:**
  - [ ] `bun run types:check` sin errores.
  - [ ] `bun run test:app` en verde, con los 67 tests de Escuadra incluidos.
  - [ ] `bun run build` en verde.
- **Depende de:** 2. **Tamaño:** mediano.

### Tarea 4: tests de navegador

- **Hace:**
  - `playwright.config.ts`: `command: 'bun run build && bun run start --port 4173'`.
  - `package.json`: `test:e2e` pasa a `playwright test --grep-invert @visual`; se añaden
    `test:e2e:safari`, `test:visual` y `test:visual:update`.
  - `e2e/helpers.ts`: exporta el localizador de alertas y espera `networkidle` en `expectFullScreen`.
  - `csp.ts`: `upgrade-insecure-requests` solo cuando la petición llega por HTTPS (entrada nueva desde
    `proxy.ts`), con su test actualizado primero.
- **Aceptación:**
  - [ ] `bun run test:e2e` y `bun run test:e2e:safari` en verde.
  - [ ] El diff de `e2e/` solo cambia localizadores de alerta y la espera; ningún valor esperado.
  - [ ] Las capturas de Linux pasan en Docker sin regenerarse:
        `docker run --rm --platform linux/amd64 --ipc=host -v "$PWD":/work -v /work/node_modules -v /work/.next -w /work mcr.microsoft.com/playwright:v1.65.1-noble bash -c "npm i -g bun@1.4.4 && bun install --frozen-lockfile --ignore-scripts && bun run test:visual"`
- **Depende de:** 3. **Tamaño:** mediano.

#### Punto de control A: la app funciona igual
- [ ] Unitarios, flujos (Chromium y WebKit) y capturas en verde.
- [ ] Revisión manual en móvil y desktop antes de seguir.

### Tarea 5: comprobaciones del repositorio

- **Hace:** excluye `src/spa/**`, `e2e/**` y `playwright.config.ts` en `eslint.config.js`; corrige el
  error restante de `spa.tsx`; añade `src/spa` a `.prettierignore`; declara en `knip.json` las
  exportaciones dormidas; reescribe las frases con «hoy» de `docs/producto.md` y del diseño; añade el
  script `check` (`repo:check`, `test` y `build`).
- **Aceptación:**
  - [ ] `bun run check` en verde.
  - [ ] Cada exclusión lleva un comentario o nota que diga que se retira en el salto 2b.
  - [ ] Un commit de prueba pasa los hooks `pre-commit` y `commit-msg`.
- **Depende de:** 4. **Tamaño:** mediano.

### Tarea 6: CI

- **Hace:** sustituye `ci.yml` y `pr-check.yml` por un solo `pr-check.yml` con los trabajos `quality`,
  `e2e`, `safari` y `visual` sobre Bun, sin Supabase. Los nombres `quality` y `e2e` son los que
  declara `git_strategy.policy.required_checks`.
- **Workflows programados:** se eliminan `stale-branch-cleanup.yml` (borra ramas sin preguntar) y
  `map-staleness.yml` (aún no hay mapas). Se mantienen la auditoría de dependencias y el orden
  aleatorio de tests. Los de operación siguen apagados por variable.
- **Aceptación:**
  - [ ] Los cuatro trabajos en verde en el PR.
  - [ ] El trabajo visual instala Bun dentro de la imagen de Playwright y compara las 78 capturas.
- **Depende de:** 5. **Archivos:** `.github/workflows/*`.

### Tarea 7: documentación y contexto

- **Hace:** pasa el contenido de `CLAUDE.md` a `.agents/skills/escuadra-context/SKILL.md`, lo enlaza en
  la tabla de skills de proyecto de `.agents/instructions/agent-project.md` (a `AGENTS.md` casi no le
  queda margen), anota ahí la excepción de commits en español y actualiza el README.
- **Aceptación:**
  - [ ] `CLAUDE.md` es solo `@AGENTS.md`.
  - [ ] `bun run skills:registry` ejecutado y `bun run check` en verde.
  - [ ] README sin comandos de npm.
- **Depende de:** 5.

#### Punto de control B: PR del salto 1 listo
- [ ] `bun run check`, flujos, WebKit y capturas en verde en CI.
- [ ] Revisión y aprobación antes de fusionar.

---

## Salto 2a: rutas

### Tarea 8: estado de navegación fuera de React Router

- **Hace:** el resultado de la partida (`usePartida`, `RetoResultado`) y el aviso de perfil guardado
  (`EditarPerfil`, `Perfil`) pasan a un almacén en memoria con su test unitario.
- **Aceptación:**
  - [ ] No queda ningún `state` en `navigate` ni en `useLocation().state`.
  - [ ] El almacén decide qué pasa al recargar y al volver atrás igual que el comportamiento actual,
        con un test para cada caso.
- **Verificación:** `bun run test:app` y los specs de juego y perfil. **Depende de:** salto 1.

### Tarea 9: adaptador de navegación

- **Hace:** crea `src/spa/router.ts`, que reexporta lo que se usa de React Router, y hace que los 29
  archivos importen de ahí. Sin cambio de comportamiento.
- **Aceptación:**
  - [ ] Solo `router.ts` y `App.tsx` importan `react-router`.
  - [ ] Flujos en verde.
- **Depende de:** 8. **Tamaño:** grande en archivos, mecánico.

### Tarea 10: rutas de Next

- **Hace:** una página por ruta, layouts para onboarding y crear reto, `redirect` en lugar de
  `Navigate` de ruta, `not-found.tsx` para la 404, y el adaptador pasa a `next/navigation` y
  `next/link`. Se elimina la ruta comodín. Es un cambio indivisible: los dos routers no conviven sin
  recargar y perder los datos en memoria.
- **Aceptación:**
  - [ ] Flujos en Chromium y WebKit y capturas en verde.
  - [ ] Sin errores de hidratación en consola; las pantallas que dependan de la hora o del navegador
        se renderizan solo en cliente.
  - [ ] Los datos simulados se conservan al navegar y se reinician al recargar, como ahora.
- **Depende de:** 9. **Tamaño:** grande.

### Tarea 11: retirar React Router

- **Hace:** quita la dependencia, `App.tsx` y `ScrollToTop`.
- **Aceptación:**
  - [ ] `rg react-router` sin resultados en `src` y `package.json`.
  - [ ] Al navegar, la pantalla nueva empieza arriba; al volver atrás se recupera la posición.
- **Depende de:** 10.

#### Punto de control C: PR del salto 2a listo
- [ ] Todo en verde en CI y revisión manual.

---

## Salto 2b: orden

### Tarea 12: mapa de capas

- **Hace:** lee `.agents/skills/agentic-dev-core/references/guard-architecture.md` y fija a qué capa
  va cada carpeta. Propuesta de partida: `screens/<bloque>` a `features/<bloque>`; componentes,
  estilos y reglas de juego a `platform`; repositorio y datos simulados a `adapters`.
- **Aceptación:** [ ] Mapa revisado y aprobado antes de mover archivos.
- **Depende de:** salto 2a.

### Tarea 13: mover lo compartido

- **Hace:** componentes, layouts, estilos, `lib` y datos a sus capas.
- **Aceptación:** [ ] Tipos, unitarios, flujos y capturas en verde.
- **Depende de:** 12. **Nota:** no usar `platform/ui`, que la plantilla excluye de ESLint.

### Tarea 14: mover las pantallas

- **Hace:** un commit por bloque (acceso, juego, retos, crear, perfil, ranking, ajustes, landing),
  cada uno con su `index.ts` como puerta de entrada.
- **Aceptación:**
  - [ ] Tras cada commit, tipos y el spec del bloque en verde.
  - [ ] `src/spa/` desaparece.
  - [ ] Ningún archivo de `features` pasa de 400 líneas.
- **Depende de:** 13.

### Tarea 15: formato y comprobaciones completas

- **Hace:** retira las exclusiones de ESLint, Prettier y `knip`; autocorrige en un commit aparte,
  incluidos los tests.
- **Aceptación:**
  - [ ] `bun run check` en verde sin exclusiones temporales.
  - [ ] El commit de autocorrección no cambia aserciones ni capturas.
  - [ ] Las rutas y comandos de `escuadra-context` y el README están al día.
- **Depende de:** 14.

#### Punto de control D: migración terminada
- [ ] CI en verde, revisión manual y PR aprobado.

---

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Las capturas de Linux difieren aunque las de macOS coincidan | Medio | Tarea 4 las compara en Docker antes de seguir |
| Renderizar en servidor en el salto 2a provoca diferencias de hidratación | Alto | Renderizado solo en cliente donde haga falta; consola vigilada en los tests |
| Un test de herramientas espera el `test:e2e` original | Bajo | `test:tooling` en la tarea 4 |
| `bun run sync` pisa archivos modificados (`csp.ts`, workflows) | Medio | Añadirlos a `updater.protected_paths` en la tarea 7 |
| `main` avanza durante la migración | Medio | No añadir funcionalidades hasta fusionar el salto 2b |
