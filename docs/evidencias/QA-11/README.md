# QA-11 — Caché, desconexión y actualización

Base revisada: `3a70ad0e4b1cf978136500c6ec8ced4df3346c5b`, merge de QA-10.
Rama prevista: `feature/QA-11-offline-cache-actualizacion`.

## Comportamiento implementado

- La PWA precarga el shell y los chunks JavaScript, incluidos los de rutas diferidas.
- La vista de desconexión forma parte del shell compilado. Se oculta e inhabilita
  el contenido de la ruta mientras `navigator.onLine` informa falta de conexión.
  La ruta no se destruye, por lo que los formularios se conservan en memoria.
- `dataGroups` está vacío. La API y Sanctum se excluyen del fallback de navegación.
  Cada solicitud de la API lleva `ngsw-bypass=true`, sin añadir encabezados CORS.
- No se guardan cuerpos de solicitudes, tokens, perfiles ni respuestas API en
  Cache Storage. La sesión existente sigue en sessionStorage: no es caché del SW.
- Las solicitudes API nuevas fallan con status 0 y código `OFFLINE` si el
  dispositivo informa falta de red. No se envían, encolan ni reintentan automáticamente.
- Un error de transporte con red aparentemente activa no se presenta como
  éxito. Para escrituras se avisa de resultado incierto: una solicitud enviada
  antes del corte podría haber sido procesada. Consultar estado antes de repetir.
- El retorno de red muestra un aviso y permite recargar o continuar sin recargar.
  No dispara escrituras. La conectividad indicada por el sistema no garantiza
  disponibilidad de la API; los errores de transporte/servidor también se muestran.
- `SwUpdate` avisa al encontrar una versión preparada o un estado irrecuperable.
  No recarga automáticamente. La recarga requiere confirmación explícita sobre
  pérdida de formularios y se bloquea mientras haya escrituras pendientes o no haya red.
- El aviso de salida es conservador: una edición activa la advertencia incluso si
  el formulario ya fue guardado. No se persisten valores adicionales de formularios.
- El APK mantiene el SW desactivado. Usa sus recursos empaquetados y comparte
  el control de conexión y errores. La actualización del APK requiere otro APK,
  no una actualización del service worker.

## Archivos principales

- `ngsw-config.json`: recursos estáticos, exclusiones y etiqueta de versión.
- `src/app/core/pwa/`: conexión, interceptor, actualizaciones y vista global.
- `src/app/app.component.ts`: conserva el router y oculta datos privados offline.
- `src/app/app.config.ts`: registra el interceptor antes del de autenticación.
- `tests/qa11/`: regresiones ejecutables sin servidor ni credenciales.
- `scripts/build-qa11-release.mjs`: construye A/B en directorios separados.
- `scripts/publish-qa11-release.mjs`: publica sobre el directorio montado por Nginx.

## Verificación automatizada

```powershell
npm run test:qa11
node --test tests/qa05/*.test.mjs tests/qa06/*.test.mjs tests/qa07/*.test.mjs tests/qa08/*.test.mjs tests/qa09/*.test.mjs
npm run build:qa
npm run build -- --configuration production
```

Consultar `RESULTADOS.md` y `logs/` para las ejecuciones realizadas sobre la copia recibida.
No se presentan como resultados de la tablet ni de un backend real.

## Pruebas de aceptación pendientes

Seguir `PRUEBAS_MANUALES.md`. CP-26/27/28 son las familias previstas en el issue;
contrastar su detalle con el catálogo vigente del backend antes de cerrar.
Registrar commit de QA-11, ambiente, hashes de A/B y del APK, datos, resultado real
y capturas. Actualizar matrices/ticket Jira conforme al flujo del equipo.
Los controles RUB de Appium no se consideran ejecutados por estas pruebas Node.

QA-11 no se cierra con la compilación: faltan las ejecuciones reales PWA/APK,
la evidencia de actualización A→B y las condiciones de integración del issue.

## Límites

- Sin una primera carga online y un SW activo no hay garantía de arranque offline.
- Los formularios solo permanecen en la ventana viva. Cerrar, recargar o terminar
  el proceso puede perderlos; la recarga controlada lo advierte antes de continuar.
- No se ofrece un catálogo de empleos offline ni se vuelve a mostrar información
  privada desde el SW. Los valores ya cargados siguen en memoria, ocultos offline.
- El túnel de QA es temporal. No cambiar de hostname durante la prueba A/B:
  es otro origen y no demostraría una actualización de la misma instalación.
- No se implementa una actualización automática del APK ni sincronización en segundo plano.

## Evidencia posterior en Windows y Android
El estado de las ejecuciones reales se encuentra en EJECUCION_WINDOWS.md.
Los pasos y estados pendientes del plan original se conservan como historial;
consultar ese registro para los resultados posteriores confirmados.
