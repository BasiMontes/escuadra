# Escuadra

Trivia de fútbol diaria: un reto al día, 20 segundos para responder, rachas, pistas y ranking.
Web app responsive (móvil y desktop) hecha con React, Vite y TypeScript, con Supabase como backend.

El diseño de referencia está en Figma (archivo *FrescoApp*, página Escuadra) y las decisiones sobre
erratas, reglas de juego y modelo de datos están en el documento
[Escuadra · Análisis del diseño y decisiones para desarrollo](https://claude.ai/artifact/1qnK9DWKYxUgGj12o83hPZ).

## Empezar

```bash
npm install
npm run dev          # http://localhost:5173
```

Sin configurar nada, la app usa **datos de ejemplo** (`src/data/mock.ts`).
Para conectar Supabase copia `.env.example` como `.env.local` y rellena la URL y la clave publicable.

Rutas útiles en desarrollo:

- `/inicio` — Home
- `/componentes` — catálogo de componentes y tokens

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprobación de tipos y build de producción |
| `npm run lint` | Lint con oxlint |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Flujos y accesibilidad con Playwright (móvil 390 px, desktop 1440×900 y portátil 1280×680; desbordes a 320, 768 y 1024) |
| `npm run test:e2e:safari` | Lo mismo en WebKit, el motor de Safari (antes: `npx playwright install webkit`) |
| `npm run test:visual` | Comparación visual con las capturas de referencia |
| `npm run test:visual:update` | Regenera las capturas de referencia |
| `npm run check` | Lint + build + unitarios |

Para usar un Chrome ya instalado en lugar del de Playwright: `CHROME_PATH=/ruta/a/chrome npm run test:e2e`.

### Capturas de referencia

Las capturas cambian ligeramente entre sistemas operativos, así que se generan siempre dentro de la
imagen Docker oficial de Playwright, la misma que usa el CI:

```bash
docker run --rm --platform linux/amd64 --ipc=host \
  -v "$PWD":/work -v /work/node_modules -w /work \
  mcr.microsoft.com/playwright:v1.65.1-noble \
  bash -c "npm ci && npm run test:visual:update"
```

- `--platform linux/amd64`: la arquitectura del CI. Sin él, un Mac con Apple Silicon genera en arm64.
- `-v /work/node_modules`: instala las dependencias de Linux en un volumen aparte y no pisa las tuyas.
- La versión de la imagen debe coincidir con la de `@playwright/test` (aquí y en el CI).

La comparación no admite ninguna diferencia, así que cualquier cambio visual obliga a regenerar las
capturas afectadas. El comando solo reescribe las que cambian: si quitas o renombras un test, borra
antes `e2e/__screenshots__` para no dejar capturas huérfanas.

Antes de aprobar una captura nueva, compárala con la pantalla correspondiente del PDF del diseño.

## Estructura

```
src/
  components/   Componentes reutilizables (Button, Card, Field, Tag, Controls, Logo…)
  layouts/      AppShell (navegación móvil y desktop) y OnboardingShell
  screens/      Una pantalla por archivo
  data/         Tipos, repositorio (contrato), datos de ejemplo y cliente de Supabase
  lib/          Reglas de juego (puntos, racha, respuestas) y utilidades
  styles/       tokens.css (colores, bordes, sombras, patrón) y estilos globales
e2e/            Tests de Playwright
```

## Convenciones

- **Tokens:** ningún color, borde o sombra suelto en los componentes; todo sale de `src/styles/tokens.css`.
- **Responsive:** por debajo de 1024 px se usa el layout móvil (barra inferior); desde 1024 px, el de
  desktop (barra lateral y cabecera).
- **`data-testid`:** todo elemento interactivo lleva uno estable con el patrón `pantalla-elemento`
  (`home-comenzar-reto`, `nav-ranking`, `sidebar-crear-reto`…).
- **Datos:** las pantallas solo usan `useRepository()` / `useLoad()`; nunca importan los datos de ejemplo
  ni Supabase directamente.
- **Reglas de juego:** viven en `src/lib/game.ts` y tienen tests; la función de servidor de Supabase debe
  dar los mismos resultados.
