# Escuadra · contexto para Claude Code

Trivia de fútbol diaria (un reto al día, 20 s para responder, rachas, pistas, ranking).
Web app responsive en React 19 + Vite + TypeScript, con Supabase como backend (aún sin conectar).
El usuario trabaja en QA: cuida los tests, los `data-testid` y la accesibilidad.

Idioma: todo el texto de la interfaz, los commits y la comunicación con el usuario, en **español**.

## Fuentes de verdad

- **Diseño:** Figma, archivo *FrescoApp* (`Al2pK4ZunkZ8EWkfvIzbfp`), página Escuadra (`5869:2`).
  Cada pantalla existe en móvil (390 px) y desktop (1440×900). El usuario tiene un PDF exportado con
  las 63 páginas; el objetivo es replicarlo **tal cual**.
- **Decisiones:** documento "Escuadra · Análisis del diseño y decisiones para desarrollo"
  (https://claude.ai/artifact/1qnK9DWKYxUgGj12o83hPZ). Resumen de lo más importante:
  - Todo en español (Mis logros y Cambiar contraseña venían en inglés). Erratas corregidas:
    "Tu posición", "Fácil", "Competiciones internacionales", "Luka Modrić", "LaLiga".
  - Dificultad solo Fácil / Medio / Difícil ("PRO" → Difícil, "MEDIA" → Medio).
  - Números en formato español (`formatNumber` en `src/lib/game.ts`): 1.248.
  - Un usuario de ejemplo: BasiMontes. El registro pide también email.
  - Competiciones: selección múltiple. Un reto = una pregunta ("Siguiente reto", no "siguiente pregunta").
  - Retos oficiales con 4 opciones; retos de usuario con respuesta libre y moderación (pendiente/aprobado/rechazado).
  - Sin esquinas redondeadas; amarillo de marca #F5F37D en todos los botones.
  - Imágenes: no usar los avatares de Avatar ni la ilustración de Modrić; avatares genéricos.
  - En desktop se mantienen las sombras duras aunque el PDF de desktop no las muestre
    (se perdieron al convertir las pantallas en Figma).

## Comandos

```bash
npm run dev            # http://localhost:5173 (empieza en el splash; /componentes = catálogo)
npm run check          # lint + build + unitarios: ejecútalo antes de cada commit
npm run test:e2e       # Playwright: móvil 390, desktop 1440×900 y portátil 1280×680
```

## Cómo está organizado

- `src/styles/tokens.css`: colores, bordes, sombras, patrón. **Nunca** valores sueltos en los componentes.
- `src/components/`: Button, Card, Tag/DifficultyTag, TextField/TextArea/SelectField, Controls
  (Toggle, RadioDot, CheckSquare, ProgressBar, StepBar, IconBox), Logo (`bordered`, `shadow`).
- `src/layouts/AppShell.tsx`: pantallas con sesión (cabecera + barra inferior en móvil; barra lateral +
  cabecera con racha/pistas en desktop desde 1024 px). Props `tab`, `title`, `mobileBg` ('yellow' | 'game' | 'white').
- `src/layouts/OnboardingShell.tsx`: pantallas sin navegación (patrón de fondo, botón volver, barra de pasos)
  y `StickyAction` para el botón principal fijo abajo en móvil.
- `src/data/`: `types.ts`, contrato `repository.ts`, `mockRepository.ts` + `mock.ts` (datos de ejemplo),
  `hooks.ts` (`useRepository`, `useLoad`). Las pantallas solo usan el repositorio, nunca los mocks directamente.
- `src/lib/game.ts`: reglas de juego con tests (puntos = max(0, round(base × m × (20 − t)/20) − 30 × pistas),
  m = 1 / 1,5 / 2; racha; respuestas libres normalizadas; reinicio del ranking el lunes 00:00 de Madrid).
- `src/lib/validation.ts`: usuario, email y contraseña (8 caracteres, un número, un carácter especial).

## Cómo construir una pantalla nueva

1. Mira la página del PDF en móvil y en desktop (o el frame de Figma). Los tamaños de letra de Archivo Black
   suelen ser 30 (títulos), 20 (botones grandes), 18, 14 y 10–12 (etiquetas); el texto, Public Sans 14–18.
2. Reutiliza componentes y tokens; crea un `.module.css` por pantalla con móvil primero y
   `@media (min-width: 1024px)` para desktop.
3. Compacta para portátiles con `@media (min-width: 1024px) and (max-height: 899px)`: en 1280×680 el botón
   principal debe verse sin scroll.
4. Pon `data-testid` estable a todo lo interactivo con el patrón `pantalla-elemento`.
5. Añade su spec en `e2e/`: flujo, errores, accesibilidad con axe (sin violaciones serias o críticas),
   el caso `@portatil` si aplica y la captura `@visual`.
6. Compara tu captura con la del PDF antes de dar la pantalla por terminada.
7. Los textos con poco contraste (verde #16A34A o grises claros sobre blanco) usan la variante oscura
   (`--c-green-text`, #6B6B6B).

## Estado

- Hecho: base, tokens y componentes; Home; onboarding completo (Splash, Registro, Entrar, Recuperar,
  Competiciones, Configuración, Resumen), adaptado a portátiles.
- Hecho: bloque de juego (`src/screens/juego/`): Reto del día (`/retos/:id/intro`), Reto con
  temporizador y pistas (`/retos/:id/jugar`), Correcto / Incorrecto / Tiempo agotado
  (`/retos/:id/resultado`). El intento en marcha (`startAttempt`) conserva reloj y pistas.
- El juego admite opciones y respuesta libre. El reto propio no se puede jugar y solo los retos
  oficiales cuentan para la racha.
- Hecho: bloque de Retos (`src/screens/retos/`): Retos del día (`/retos`, filtro por liga con
  `?liga=`), Detalle (`/retos/:id`) y En curso (`/retos/en-curso`).
- Hecho: Crear reto (`src/screens/crear/`, `/crear/1` a `/crear/4`). La "Descripción" del paso 1
  es la pregunta del reto; el borrador vive mientras se está en `/crear`.
- Siguiente: Ranking, Perfil, Logros, Ajustes
  (Notificaciones, Privacidad, Soporte, Cambiar contraseña), landing pública y conexión con Supabase.
- Las capturas de referencia visuales aún no están en el repo: se generan con Docker (ver README).

## Decisiones de producto pendientes

No las resuelvas por tu cuenta: la columna "Hoy" es el comportamiento provisional.

| Pregunta | Hoy |
|---|---|
| ¿Los retos de la comunidad suman puntos al ranking? El creador elige puntos y dificultad, así que se podría inflar | Sí suman (no cuentan para la racha) |
| ¿Qué puntos base puede poner un usuario? | De 10 a 200 |
| ¿Puede alguien jugar su propio reto? | No |
| ¿La pregunta del reto necesita campo propio? | Se usa la "Descripción" del paso 1 |
| ¿Un reintento vuelve a gastar pistas? | Sí |
| ¿Dónde ve el creador sus retos y su estado? | Solo abriendo el enlace del reto |
| ¿Origen y licencia de las imágenes de estadio? | Sin confirmar |
| ¿Avatares por defecto con ilustraciones propias? | Sin decidir |

## Git

Commits pequeños por bloque, mensaje en español (título corto + lista de cambios). `npm run check` y
`npm run test:e2e` en verde antes de subir. El CI de GitHub Actions repite lint, build, unitarios y Playwright.
