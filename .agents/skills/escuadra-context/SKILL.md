---
name: escuadra-context
description: "Escuadra product and UI rules for this football trivia app. Use when building or changing a screen, game rules, mock data or browser tests."
license: MIT
compatibility: [claude-code, codex, opencode, pi]
compact_rules: |
  - Interface text, commits and chat replies are in Spanish from Spain. The reference design is the Figma file and the screens are replicated as they are.
  - Screens use only `useRepository()` / `useLoad()`; they never import mock data or Supabase directly.
  - Colors, borders and shadows come from `src/spa/styles/tokens.css`. Everything interactive has a `data-testid` shaped `pantalla-elemento`.
  - Only official challenges count for the ranking and the streak.
  - Screenshots are compared with zero tolerance. Never regenerate them to make a change pass without comparing with the design first.
metadata:
  kind: context
---

# escuadra-context

## What this skill knows

Escuadra es una trivia de fútbol diaria (un reto al día, 20 segundos para responder, rachas, pistas y
ranking): web responsive en React sobre Next.js, con datos de ejemplo mientras Supabase no esté
conectado. El usuario trabaja en QA: importan los tests, los `data-testid` y la accesibilidad.

## Sources of truth (cited, never copied)

- Diseño: Figma, archivo *FrescoApp* (`Al2pK4ZunkZ8EWkfvIzbfp`), página Escuadra (`5869:2`). Cada
  pantalla existe en móvil (390 px) y desktop (1440×900). El usuario tiene un PDF exportado.
- Decisiones: [Escuadra · Análisis del diseño y decisiones para desarrollo](https://claude.ai/artifact/1qnK9DWKYxUgGj12o83hPZ).
- `docs/producto.md`: decisiones pendientes y limitaciones conocidas. No resolverlas por cuenta propia
  y actualizar el archivo cuando un cambio abra o cierre alguna.
- `references/pantallas.md`: organización del código y pantallas construidas.
- `references/gotchas.md`: trampas conocidas.

## Rules (judgment, dated)

Diseño:

- 2026-11-26 · Todo en español, con las erratas del diseño corregidas: "Tu posición", "Fácil",
  "Competiciones internacionales", "Luka Modrić", "LaLiga".
- 2026-11-26 · Dificultad solo Fácil, Medio y Difícil ("PRO" es Difícil, "MEDIA" es Medio).
- 2026-11-26 · Números en formato español con `formatNumber` (`src/spa/lib/game.ts`): 1.248.
- 2026-11-26 · Un usuario de ejemplo, BasiMontes. El registro pide también email.
- 2026-11-26 · Competiciones con selección múltiple. Un reto es una pregunta ("Siguiente reto").
- 2026-11-26 · Retos oficiales con 4 opciones; retos de usuario con respuesta libre y moderación
  (pendiente, aprobado, rechazado).
- 2026-11-26 · Sin esquinas redondeadas; amarillo de marca `#F5F37D` en todos los botones.
- 2026-11-26 · No usar los avatares de Avatar ni la ilustración de Modrić; avatares genéricos.
- 2026-11-26 · En desktop se mantienen las sombras duras aunque el PDF de desktop no las muestre.

Juego:

- 2026-11-26 · Las reglas viven en `src/spa/lib/game.ts`, con tests: puntos = max(0,
  round(base × m × (20 − t)/20) − 30 × pistas), con m = 1, 1,5 o 2; racha; respuestas libres
  normalizadas; el ranking se reinicia el lunes a las 00:00 de Madrid.
- 2026-11-26 · Solo los retos oficiales cuentan para el ranking y la racha (`countsForRanking`). Los de
  la comunidad son entretenimiento: muestran puntos como marcador y avisan de que no suman.
- 2026-11-26 · El reto propio no se puede jugar. El intento en marcha (`startAttempt`) conserva reloj y
  pistas.

Cómo construir una pantalla:

- 2026-11-26 · Mirar la página del PDF en móvil y desktop. Archivo Black: 30 (títulos), 20 (botones
  grandes), 18, 14 y 10–12 (etiquetas); Public Sans 14–18.
- 2026-11-26 · Reutilizar componentes y tokens; un `.module.css` por pantalla, móvil primero y
  `@media (min-width: 1024px)` para desktop.
- 2026-11-26 · En portátiles compactar con `@media (min-width: 1024px) and (max-height: 899px)`: en
  1280×680 el botón principal se ve sin scroll.
- 2026-11-26 · Cada pantalla tiene su spec en `e2e/`: flujo, errores, accesibilidad con axe (sin
  violaciones serias o críticas), caso `@portatil` si aplica y captura `@visual`, comparada con el PDF.
- 2026-11-26 · Texto con poco contraste (verde `#16A34A` o grises claros sobre blanco) usa la variante
  oscura (`--c-green-text`, `#6B6B6B`).
- 2026-11-26 · Cada ruta nueva se añade a `e2e/anchos.spec.ts` (nada desborda a 320, 768 y 1024 px).
  Corregir con `@media (max-width: 359px)` o `(min-width: 1024px) and (max-width: 1279px)`.

Trabajo:

- 2026-11-26 · Commits pequeños por bloque, en español (título corto y lista de cambios). Antes de
  subir: `bun run check:all`, `bun run test:e2e` y `bun run test:e2e:safari` en verde.

## Not here

- Cómo funciona la base (cuentas, seguridad, módulos): `docs/app-base.md`.
- Plan de la migración desde Vite: `tasks/plan.md`.
