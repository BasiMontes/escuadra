# Producto: decisiones pendientes y limitaciones

Lista única de lo que queda abierto en el producto. "Hoy" describe cómo se comporta la app con los
datos de ejemplo (revisado el 25 de noviembre de 2026). Cuando algo se resuelva, se borra de aquí.

## Decisiones pendientes

| Pregunta | Hoy |
|---|---|
| ¿Qué puntos base puede poner un usuario? Solo sirven de marcador | De 10 a 200 |
| ¿Puede alguien jugar su propio reto? | No |
| ¿La pregunta del reto necesita campo propio? | Se usa la "Descripción" del paso 1 |
| ¿La respuesta libre debe aceptar variantes ("Francia" y "Selección francesa")? | Solo la respuesta escrita por el creador, sin distinguir mayúsculas, tildes, signos ni espacios sobrantes |
| ¿Qué texto lleva un fallo cuando la respuesta no es un jugador? | Siempre "Crack fallado" |
| ¿Un reintento vuelve a gastar pistas? | Sí |
| ¿El reto oficial del día debe salir también en "Retos del día"? | No: solo está en Inicio y en "Siguiente reto" |
| ¿Origen y licencia de las imágenes de estadio? | Sin confirmar |
| ¿Avatares por defecto con ilustraciones propias? | Iniciales sobre color |
| ¿Quién llega a la landing? | Solo quien abre `/bienvenida`; `/` lleva al registro |

## Limitaciones antes de tener usuarios reales

- **No hay autenticación.** Todas las pantallas se abren sin sesión y "Cerrar sesión" solo lleva a
  Entrar. Cambiar contraseña, recuperarla y eliminar la cuenta no hacen nada real.
- **Faltan los textos legales.** `/privacidad` y `/terminos` dicen que están en preparación.
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

- **En curso** muestra tarjetas de ejemplo, no el progreso real.
- **Retos creados:** se listan en Mis retos, pero la moderación se hace fuera de la app y no se pueden
  editar, reenviar ni borrar.
- **Logros:** son fijos; el aviso solo se abre con `/perfil/logros?nuevo=<código>`.
- **Cifras del perfil:** el rango global y el "Top 5 %" son fijos.
- **Crear reto:** el borrador se pierde al salir de `/crear` o al recargar.
- **Fecha de los retos:** fija en el 3 de marzo.
- **Ranking:** la lista es de ejemplo. "Aparecer en ranking" solo oculta tu propia posición.
- **Perfil público o privado:** se guarda, pero todavía no hay perfiles ajenos que ver.
- **Avisos:** son fijos y no se marcan como leídos. "Mensajes de amigos" no activa nada y el 75 %
  de las estadísticas es fijo.
- **Soporte:** el mensaje no se envía a ningún sitio, aunque la app lo confirme.
- **Descargar mis datos:** el PDF resume perfil y cifras; no incluye el historial de intentos.
- **Recuperar contraseña:** no hay pantalla para poner la nueva desde el enlace del correo.
- **Amigos:** no existe en la primera versión.
