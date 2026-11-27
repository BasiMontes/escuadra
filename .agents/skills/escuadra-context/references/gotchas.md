# Trampas conocidas

- La app se monta solo en cliente: al volver de `page.goto` puede no haber contenido.
  `expectFullScreen` espera a que termine la carga antes de capturar.
- Next añade un anunciador de rutas con `role="alert"`. En los tests de navegador se usa `alerta(page)`
  de `e2e/helpers.ts`.
- WebKit aplica `upgrade-insecure-requests` también a `http://localhost`. La política de seguridad
  solo la envía en peticiones HTTPS.
- Las capturas de referencia son de Linux y se comparan en la imagen Docker de Playwright (ver README).
- Los datos de ejemplo viven en memoria: recargar la página los reinicia, así que los tests que
  necesitan conservarlos navegan sin recargar.
