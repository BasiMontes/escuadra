# Producto: decisiones pendientes y limitaciones

Lista única de lo que queda abierto en el producto. "Hoy" describe cómo se comporta la app con los
datos de ejemplo (revisado el 25 de noviembre de 2026). Cuando algo se resuelva, se borra de aquí.

## Decisiones pendientes

| Pregunta | Hoy |
|---|---|
| ¿Los retos de la comunidad suman puntos al ranking? El creador elige puntos y dificultad, así que se podría inflar | Sí suman (no cuentan para la racha) |
| ¿Qué puntos base puede poner un usuario? | De 10 a 200 |
| ¿Puede alguien jugar su propio reto? | No |
| ¿La pregunta del reto necesita campo propio? | Se usa la "Descripción" del paso 1 |
| ¿La respuesta libre debe aceptar variantes ("Francia" y "Selección francesa")? | Solo la respuesta escrita por el creador, sin distinguir mayúsculas, tildes, signos ni espacios sobrantes |
| ¿Qué texto lleva un fallo cuando la respuesta no es un jugador? | Siempre "Crack fallado" |
| ¿Un reintento vuelve a gastar pistas? | Sí |
| ¿El reto oficial del día debe salir también en "Retos del día"? | No: solo está en Inicio y en "Siguiente reto" |
| ¿Dónde ve el creador sus retos y su estado? | Solo abriendo el enlace del reto |
| ¿Origen y licencia de las imágenes de estadio? | Sin confirmar |
| ¿Avatares por defecto con ilustraciones propias? | Sin decidir |

## Limitaciones antes de tener usuarios reales

- **No hay autenticación.** Todas las pantallas se abren sin sesión y "Cerrar sesión" solo lleva a
  Entrar.
- **Los datos viven en memoria.** Al recargar se pierden intentos, pistas, retos creados, cambios de
  perfil y foto; los enlaces compartidos dejan de funcionar.
- **Se puede hacer trampa.** Las pistas y las respuestas llegan al navegador y el reloj de la partida
  se controla en el cliente. Con Supabase deben quedarse en el servidor.

## Reglas de juego aún sin aplicar

El documento de análisis las define, pero la app todavía no las cumple.

- La racha no cuenta días seguidos: sube una vez y no se rompe.
- Un reto oficial puntúa aunque no se juegue el día en que se desbloquea.
- El saldo de pistas no se recarga a las 00:00.
- Las competiciones y la dificultad elegidas no cambian qué retos se muestran.

## Funciones incompletas

- **En curso** (y "Mis retos" en Perfil) muestra tarjetas de ejemplo, no el progreso real.
- **Retos creados:** no aparecen en ninguna lista y la moderación se hace fuera de la app.
- **Logros:** son fijos; el aviso solo se abre con `/perfil/logros?nuevo=<código>`.
- **Cifras del perfil:** el rango global y el "Top 5 %" son fijos.
- **Crear reto:** el borrador se pierde al salir de `/crear` o al recargar.
- **Fecha de los retos:** fija en el 3 de marzo.
- **Campana de avisos:** lleva a "Página no encontrada".
- **Sin construir:** Ranking, Ajustes (y sus pantallas), panel de avisos y landing.
