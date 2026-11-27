# Código y pantallas

## Organización

La app vive en `src/spa/` hasta que se reparta en capas (ver `tasks/plan.md`).

- `src/spa/styles/tokens.css`: colores, bordes, sombras y patrón. Nunca valores sueltos en componentes.
- `src/spa/components/`: Button, Card, Tag y DifficultyTag, TextField, TextArea y SelectField,
  Controls (Toggle, RadioDot, CheckSquare, ProgressBar, StepBar, IconBox), Logo (`border`, `shadow`).
- `src/spa/layouts/AppShell.tsx`: pantallas con sesión (cabecera y barra inferior en móvil; barra
  lateral y cabecera con racha y pistas desde 1024 px). Props `tab`, `title`, `mobileBg`
  (`yellow`, `game`, `white`).
- `src/spa/layouts/OnboardingShell.tsx`: pantallas sin navegación (patrón de fondo, botón volver, barra
  de pasos) y `StickyAction` para el botón principal fijo abajo en móvil.
- `src/spa/data/`: `types.ts`, contrato `repository.ts`, `mockRepository.ts` y `mock.ts` (datos de
  ejemplo), `hooks.ts` (`useRepository`, `useLoad`).
- `src/spa/lib/game.ts`: reglas de juego. `src/spa/lib/validation.ts`: usuario, email y contraseña
  (8 caracteres, un número y un carácter especial).

## Pantallas

| Bloque | Rutas | Carpeta |
|--------|-------|---------|
| Onboarding | Splash, registro, entrar, recuperar, competiciones, configuración y resumen | `screens/onboarding` |
| Juego | `/retos/:id/intro`, `/retos/:id/jugar`, `/retos/:id/resultado` | `screens/juego` |
| Retos | `/retos` (filtro `?liga=`), `/retos/:id`, `/retos/en-curso` | `screens/retos` |
| Crear reto | `/crear/1` a `/crear/4`; la "Descripción" del paso 1 es la pregunta y el borrador vive mientras se está en `/crear` | `screens/crear` |
| Perfil | Perfil, editar y logros; el aviso de logro se abre con `/perfil/logros?nuevo=<código>` y nada lo lanza solo | `screens/perfil` |
| Ranking | `/ranking` | `screens/ranking` |
| Ajustes | Ajustes y sus pantallas, y el panel de avisos de la campana | `screens/ajustes` |
| Públicas | Home, catálogo `/componentes`, landing `/bienvenida`, legales y 404 | `screens` |

Fuera del diseño:

- Preferencias de juego (`/ajustes/juego`), con selectores compartidos con el registro
  (`components/GamePickers.tsx`). Cambiar el límite de pistas no devuelve las usadas en el día
  (`hintsBalance`).
- Mis retos (`/perfil/retos`), con el estado de revisión y el motivo del rechazo; desde ella se llega a
  En curso.
- Contraseña nueva (`/nueva-contrasena`), destino del enlace del correo.
