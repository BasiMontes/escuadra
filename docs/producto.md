# Producto: decisiones pendientes y limitaciones

Lista única de lo que queda abierto en el producto. "Comportamiento" describe cómo se comporta la app con los
datos de ejemplo (revisado el 25 de noviembre de 2026). Cuando algo se resuelva, se borra de aquí.

## Decisiones pendientes

| Pregunta | Comportamiento |
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
| ¿Cómo debe verse en tablet vertical? No está en el diseño | La disposición de móvil estirada a todo el ancho |
| ¿Quién llega a la landing? | Solo quien abre `/bienvenida`; `/` lleva al registro |

## Diseño pendiente de revisar

Va en un PR propio, después de la migración a Next y Bun, que no cambia nada a la vista. Detectado en la
revisión del 27 de noviembre de 2026; los colores hay que contrastarlos con el diseño antes de tocarlos.

| Prioridad | Problema | Propuesta |
|---|---|---|
| Alta | Los desplegables abren la lista del navegador (`SelectField`: crear reto y soporte) | `Select` de `@base-ui/react` con los bordes y sombras propios; ajustar `crear.spec.ts` y `ajustes.spec.ts` |
| Alta | Los interruptores muestran el encendido a la izquierda | Encendido a la derecha, en amarillo |
| Alta | El texto de ejemplo de los campos no llega a 4,5:1: acceso (2,05:1) y formularios (2,56:1) | `--c-grey-text-soft` (5,33:1) |
| Media | Botones amarillos sobre fondo amarillo ("Ver resumen", "Guardar cambios" en preferencias) | Meterlos en una tarjeta blanca sin cambiar su color |
| Media | En crear reto, el título lleva borde fino gris y los demás campos borde negro grueso | Un solo estilo de campo |
| Media | Textos de 10 y 11 px en mayúsculas | Mínimo 12 px |
| Media | "Tipo de reto" es un desplegable con una sola opción | Texto fijo |
| Por decidir | En escritorio todas las pantallas tienen fondo amarillo; en móvil alterna con gris | Gris claro en las pantallas de datos |

Sin revisar: juego, resultado, detalle de reto, diálogos y estados al pasar el ratón o con foco.

## Limitaciones antes de tener usuarios reales

- **No hay autenticación.** Todas las pantallas se abren sin sesión y "Cerrar sesión" solo lleva a
  Entrar. Cambiar contraseña, recuperarla y eliminar la cuenta no hacen nada real.
- **Safari solo se ha probado con WebKit.** No se ha usado un iPhone real ni el simulador, así que
  faltan por ver el teclado y las barras de iOS.
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
- **Recuperar contraseña:** las pantallas existen, pero no se envía ningún correo ni hay enlace real. El
  enlace caducado se simula con `/nueva-contrasena?enlace=caducado`.
- **Amigos:** no existe en la primera versión.
