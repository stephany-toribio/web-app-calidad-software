# QA-11 — Ejecución real de CP-26, CP-27 y CP-28

Estado inicial: PENDIENTE. Este documento contiene pasos, no resultados aprobados.
Usar datos ficticios; no capturar contraseñas, tarjetas, tokens, HAR con sesiones ni dumps.

## Preparación

1. Confirmar rama QA-11 y registrar `git rev-parse HEAD` y `git status --short`.
2. Mantener API, MySQL, `creo-qa03-preview` y el mismo túnel HTTPS activos.
3. Nginx debe montar `dist/creo-angular-qa/browser` en `/usr/share/nginx/html`.
4. DevTools: desactivar Bypass for network y Disable cache. No limpiar SW ni
   Cache Storage entre A y B. Si se limpia, reiniciar la prueba completa.
5. Anotar Chrome/Android, dispositivo, fecha, URL y vacantes QA utilizadas.

## Construir dos versiones sin reemplazar el servidor en vivo

Desde PowerShell, raíz del frontend. Continuar solo si cada comando devuelve cero:

```powershell
node scripts/build-qa11-release.mjs QA11-A
node scripts/build-qa11-release.mjs QA11-B
Get-Content dist/qa11-releases/QA11-A/version.json
Get-Content dist/qa11-releases/QA11-B/version.json
```

El script restaura la configuración y etiqueta fuente al terminar. Cada etiqueta
se incorpora al bundle y al manifiesto: A y B tienen hashes diferentes, con la
misma funcionalidad. La etiqueta compilada permite identificar el código activo.

Publicar A:

```powershell
node scripts/publish-qa11-release.mjs QA11-A
```

El publicador conserva chunks anteriores y copia `ngsw.json` al final. No hace
falta recrear el contenedor ni reiniciar el túnel. No ejecutar builds/publish simultáneos.

Abrir la PWA, esperar el control del SW y cerrar TODAS las ventanas/pestañas
del portal antes de volver a abrir desde el lanzador. La versión antigua de QA-10
todavía no tenía el nuevo aviso; comprobar que aparece “Comprobar actualización”.
Pulsarlo. En Console de DevTools (no PowerShell):

```javascript
matchMedia('(display-mode: standalone)').matches
navigator.serviceWorker.controller?.scriptURL
document.querySelector('[data-active-release]')?.getAttribute('data-active-release')
```

La etiqueta activa debe ser `QA11-A`; registrar tambien los hashes de version.json.
No interpretar NO_NEW_VERSION_DETECTED como prueba del codigo activo en esta ventana.

## CP-26 — Shell, falta de conexión, privacidad y recuperación

1. Con A activa, iniciar sesión, abrir listado/detalle y un formulario. Escribir
   un valor ficticio reconocible sin enviarlo. Conservar captura del estado inicial.
2. En la tablet desactivar Wi-Fi y datos móviles, si existen. No apagar la red del PC.
3. Esperar el aviso “Sin conexión”. El panel privado y sus acciones deben quedar
   ocultos/inertes, no reemplazados por datos inventados ni mensajes de éxito.
4. Volver a habilitar red SIN recargar. El formulario abierto debe conservar su valor.
   Debe mostrarse el aviso de recuperación. No debe haber escrituras automáticas.
5. Repetir sin red y recargar: debe arrancar el shell cacheado y mostrar la vista offline.
   No se exige conservar el formulario después de esta recarga voluntaria.
6. En Application → Cache Storage inspeccionar entradas. Debe haber recursos
   estáticos/metadatos NGSW; no `/api/v1`, perfiles, tokens ni respuestas privadas.
   En Network comprobar solicitudes API con `ngsw-bypass=true`.
7. Recuperar red, usar “Recargar datos” y aceptar el aviso de pérdida de formulario
   solo si corresponde. Comprobar recarga y navegación/listado/detalle contra la API.

Resultado: PENDIENTE. Adjuntar capturas offline, recuperación, Cache Storage y Network
sin datos sensibles. Registrar también cualquier fallo o diferencia.

## CP-27 — Escrituras y pérdida de red, PWA y APK

Repetir con roles/datos que permitan postular, pagar de forma simulada y cambiar un
estado Kanban. La cuenta candidata por sí sola no cubre pagos ni cambios de estado.

1. Conservar el estado inicial de las entidades de prueba y sus IDs.
2. Desconectar la tablet antes de intentar la operación. La vista offline bloquea
   las acciones y las solicitudes API deben fallar explícitamente si se disparan.
3. Volver a conectar: confirmar en Network y mediante consulta de estado que no
   hubo escrituras/reenvíos automáticos. No repetir el seeder durante la prueba.
4. Probar corte DURANTE una solicitud usando throttling o bloqueo controlado de
   la API. No se puede asegurar que una operación enviada no llegó al backend.
   Debe avisar resultado incierto, no éxito local; consultar el estado antes de repetir.
5. Repetir desde APK NUEVO de QA-11. El APK de QA-10 no acredita este cambio.
   Compilar Angular Android con la URL HTTPS real, sincronizar y ejecutar Gradle
   con JDK 21 y Android SDK; instalar, anotar versión/hash/commit y repetir los cortes.
6. En WebView confirmar que no hay controlador NGSW y que los recursos proceden
   del paquete. Comprobar login y navegación otra vez al recuperar la conexión.

Resultado: PENDIENTE por operación y plataforma. Registrar peticiones y estado
posterior real, sin subir tokens, cuerpos de pago o contraseñas.

## CP-28 — Actualización A → B sin pérdida silenciosa

1. Mantener A activa con un formulario parcialmente editado.
2. Publicar B desde el PC SIN recargar la PWA:

```powershell
node scripts/publish-qa11-release.mjs QA11-B
```

3. En la PWA pulsar “Comprobar actualización”. Debe aparecer aviso de versión lista,
   sin recarga automática y sin modificar el formulario. En Console:

```javascript
document.querySelector('[data-active-version]')?.getAttribute('data-active-version')
document.querySelector('[data-ready-version]')?.getAttribute('data-ready-version')
```

Los hashes deben corresponder a A activa y B preparada cuando se recibe VERSION_READY.
La etiqueta compilada data-active-release debe seguir siendo QA11-A.
Si B ya se instalo desde otra ventana, puede faltar el hash activo; no inventarlo.
4. Pulsar “Actualizar y recargar”, CANCELAR la confirmación y verificar que el
   formulario sigue igual. Capturar aviso y valor ficticio, sin información privada.
5. Guardar o descartar conscientemente el formulario. Volver a pulsar actualizar
   y aceptar. Comprobar que data-active-release pasa a QA11-B, que el SW sigue controlando
   la pagina y que login/navegacion funcionan.
6. Con escritura en curso, la recarga debe estar deshabilitada. Con red ausente,
   tampoco debe iniciarse una recarga desde el control de actualización.
7. Interrumpir red durante la búsqueda/descarga de una versión nueva: debe haber
   aviso de fallo y poder continuar en la anterior. Recuperar red y volver a comprobar.
   Registrar la descarga fallida si se logra reproducir; el ensayo de servicio con
   evento simulado ya está en las pruebas Node y no sustituye esta ejecución.
8. Si se necesita retorno técnico, publicar A otra vez, comprobar actualización
   y confirmar recarga. Registrar el resultado; no afirmar recuperación sin ejecutarla.

Resultado: PENDIENTE. Adjuntar hashes A/B, aviso, cancelación, estado del formulario
y versión activa final. No borrar cachés para conseguir el resultado.

## Registro y cierre

Crear un registro por ejecución: caso, plataforma, commit, hash/build, origen,
dispositivo, datos ficticios, pasos, resultado esperado/real, PASS/FAIL y evidencia.
No convertir estas instrucciones en una tabla PASS sin ejecutarlas.
Relacionar defectos/retests y el ticket Jira cuando corresponda, y actualizar
la matriz de trazabilidad. Cumplir revisión e integración previstas por el issue.
