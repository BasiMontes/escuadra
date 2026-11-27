# Escuadra

Trivia de fútbol diaria: un reto al día, 20 segundos para responder, rachas, pistas y ranking.
Web app responsive (móvil y desktop) hecha con React, Next.js y TypeScript sobre Bun, con Supabase como backend (aún sin conectar).
La base viene de [`project_template`](https://github.com/BasiMontes/project_template): ver
[`docs/app-base.md`](docs/app-base.md).

El diseño de referencia está en Figma (archivo *FrescoApp*, página Escuadra) y las decisiones sobre
erratas, reglas de juego y modelo de datos están en el documento
[Escuadra · Análisis del diseño y decisiones para desarrollo](https://claude.ai/artifact/1qnK9DWKYxUgGj12o83hPZ).

## Empezar

Hace falta Bun en la versión de `.bun-version`.

```bash
bun install
bun run dev          # http://localhost:3000
```

Sin configurar nada, la app usa **datos de ejemplo** (`src/spa/data/mock.ts`).
Para conectar Supabase copia `.env.example` como `.env` y rellena `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Rutas útiles en desarrollo:

- `/inicio` — Home
- `/componentes` — catálogo de componentes y tokens

## Scripts

| Comando | Qué hace |
| --- | --- |
| `bun run dev` | Servidor de desarrollo |
| `bun run build` | Build de producción |
| `bun run check:all` | Comprobaciones del repositorio, tests unitarios y build |
| `bun run test:app` | Tests unitarios de la app |
| `bun run test:e2e` | Flujos y accesibilidad con Playwright (móvil 390 px, desktop 1440×900 y portátil 1280×680; desbordes a 320, 768 y 1024) |
| `bun run test:e2e:safari` | Lo mismo en WebKit, el motor de Safari (antes: `bunx playwright install webkit`) |
| `bun run test:visual` | Comparación visual con las capturas de referencia |
| `bun run test:visual:update` | Regenera las capturas de referencia |

Para usar un Chrome ya instalado en lugar del de Playwright: `CHROME_PATH=/ruta/a/chrome bun run test:e2e`.

### Capturas de referencia

Las capturas cambian ligeramente entre sistemas operativos, así que se generan siempre dentro de la
imagen Docker oficial de Playwright, la misma que usa el CI:

```bash
docker run --rm --platform linux/amd64 --ipc=host \
  -v "$PWD":/work -v /work/node_modules -v /work/.next -w /work \
  mcr.microsoft.com/playwright:v1.65.1-noble \
  bash -c "npm i -g bun@$(cat .bun-version) && bun install --frozen-lockfile --ignore-scripts && bun run test:visual:update"
```

- `--platform linux/amd64`: la arquitectura del CI. Sin él, un Mac con Apple Silicon genera en arm64.
- `-v /work/node_modules` y `-v /work/.next`: las dependencias y el build de Linux van en volúmenes
  aparte y no pisan los tuyos.
- La versión de la imagen debe coincidir con la de `@playwright/test` (aquí y en el CI).

La comparación no admite ninguna diferencia, así que cualquier cambio visual obliga a regenerar las
capturas afectadas. El comando solo reescribe las que cambian: si quitas o renombras un test, borra
antes `e2e/__screenshots__` para no dejar capturas huérfanas.

Antes de aprobar una captura nueva, compárala con la pantalla correspondiente del PDF del diseño.

## Estructura

```
src/
  app/          Rutas de Next (la app se monta en `app/[[...slug]]`)
  spa/          Escuadra: components, layouts, screens, data, lib y styles
  features/     Base de la plantilla: cuentas, consentimiento y salud (sin usar todavía)
  adapters/     Llamadas a servicios externos
  platform/     Entorno, seguridad y observabilidad
e2e/            Tests de Playwright
```

`src/spa/` se repartirá en las capas de la plantilla (ver [`tasks/plan.md`](tasks/plan.md)).

## Convenciones

- **Tokens:** ningún color, borde o sombra suelto en los componentes; todo sale de `src/spa/styles/tokens.css`.
- **Responsive:** por debajo de 1024 px se usa el layout móvil (barra inferior); desde 1024 px, el de
  desktop (barra lateral y cabecera).
- **`data-testid`:** todo elemento interactivo lleva uno estable con el patrón `pantalla-elemento`
  (`home-comenzar-reto`, `nav-ranking`, `sidebar-crear-reto`…).
- **Datos:** las pantallas solo usan `useRepository()` / `useLoad()`; nunca importan los datos de ejemplo
  ni Supabase directamente.
- **Reglas de juego:** viven en `src/spa/lib/game.ts` y tienen tests; la función de servidor de Supabase debe
  dar los mismos resultados.

## Licencia y crédito

La base viene de [`upex-galaxy/agentic-dev-boilerplate`](https://github.com/upex-galaxy/agentic-dev-boilerplate)
a través de `project_template`. Licencia MIT: ver [`LICENSE`](LICENSE).
