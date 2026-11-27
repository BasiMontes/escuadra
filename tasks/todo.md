# Migración a `project_template`

Detalle y criterios de aceptación en [`plan.md`](plan.md).

## Estado a 2026-11-27

Rama `migracion/salto-1`, con commits locales. Sin commit queda solo `.github/`, que va con la tarea 6.
Nada subido: `main` sigue como estaba.

Los dos commits con código pasan tipos, tests unitarios y build cada uno por separado.

| Comprobación | Resultado |
|--------------|-----------|
| Tipos y build | Verdes |
| Unitarios de la app | 181 pasan |
| Flujos en Chromium | 514 pasan, 124 omitidos |
| Flujos en WebKit | 512 pasan, 126 omitidos |
| Capturas en Linux (Docker) | 74 pasan, sin regenerar |
| Comprobaciones del repositorio | `repo:check` en verde (2026-11-27) |
| Tests de herramientas | 244 pasan, **1 falla**: `ci.yml` usa acciones sin fijar a un commit (se resuelve en la tarea 6) |

### Para retomar

1. ~~Arreglar las 4 capturas~~ **Resuelto el 2026-11-27**: `expectFullScreen` medía la altura antes de
   que la app se montara; ahora espera un elemento dentro de `#root`.
2. ~~Decidir la configuración de agentes~~ **Resuelto el 2026-11-27: recortada, solo Claude.**
   `.claude/settings.json` mantiene las reglas `deny` y los hooks, sin lista `permissions.allow`
   (así `bun sync` no vuelve a añadir permisos) y sin activar servidores MCP; `.mcp.json` declara solo
   `context7`. `agents:compat:check` y `repo:check` en verde. Dejar `harnesses:` vacío no era una
   opción: se detecta por archivos y `CLAUDE.md` existe.
3. ~~Hacer los commits~~ **Hecho el 2026-11-27**, con los hooks `pre-commit` y `commit-msg` activos.
   `pre-commit` rechazaba commits cuyos scripts estaban todos ignorados por `oxlint`; corregido en
   `lint-staged` con `--no-error-on-unmatched-pattern`.
4. Punto de control A (revisión manual) y tarea 6 (CI).

Los hooks de git de la plantilla ya están activos en esta copia (`core.hooksPath=.husky/_`).

## Antes de empezar
- [x] Plan revisado
- [x] Aprobados los dos cambios en los tests (localizador de alertas y espera de carga)

## Salto 1: Bun y Next
- [x] 1. Traer la base de la plantilla (sin la configuración de agentes)
- [x] 2. Montar la app en Next (falta el recorrido manual)
- [x] 3. Tipos y tests unitarios
- [x] 4. Tests de navegador
- [ ] Punto de control A: la app funciona igual
- [ ] 5. Comprobaciones del repositorio: hooks probados; `check:all` no estará en verde hasta la tarea 6
- [ ] 6. CI
- [ ] 7. Documentación y contexto: escritos; falta `check:all` en verde
- [ ] Punto de control B: PR del salto 1

## Salto 2a: rutas
- [ ] 8. Estado de navegación fuera de React Router
- [ ] 9. Adaptador de navegación
- [ ] 10. Rutas de Next
- [ ] 11. Retirar React Router
- [ ] Punto de control C: PR del salto 2a

## Salto 2b: capas
- [ ] 12. Mapa de capas
- [ ] 13. Mover lo compartido
- [ ] 14. Mover las pantallas
- [ ] 15. Formato y comprobaciones completas
- [ ] Punto de control D: migración terminada
