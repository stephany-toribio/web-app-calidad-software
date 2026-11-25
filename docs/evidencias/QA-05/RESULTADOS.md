# QA-05 — Verificación del frontend

Fecha de ejecución reportada: 24/11/2026 (America/Lima).
Rama: `feature/QA-05-autenticacion-permisos`.
Base: `origin/develop`, commit `e08f2ac` al crear la rama.
Issue principal: https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14

## Entorno

- Node.js 22.23.5; npm 10.9.9; Angular 19.
- API local en Docker, puerto 8002.
- Artefacto `dist/creo-angular-qa/browser`, servido por Nginx en puerto 4202.
- API del artefacto: `/api/v1`, enrutada por Nginx hacia esta copia de la API.
- Usuarios ficticios y contraseña definida localmente en QA_FIXTURE_PASSWORD.
- La API manual usa `portal_empleos_calidad_qa`, separada de las bases de los
  tests automatizados.
- Los resultados son ejecuciones manuales reportadas por el implementador,
  sobre los cambios sin commit final. Los PR identificarán los commits probados.

## Defecto QA05-F01 y corrección

La API respondía 403 con el mensaje de cuenta suspendida, pero el login general
mostraba «Esta cuenta no tiene permiso para acceder». El formulario administrativo
también reemplazaba cualquier 403 con su mensaje genérico.

Ambos formularios muestran ahora `error.error.message` cuando es un texto no
vacío. Conservan sus mensajes genéricos como alternativa cuando no hay un texto
válido. No se modificaron los tratamientos de 401, 422 y 429.

Archivos:
- `src/app/screens/creo/creo-landing/creo-landing.component.ts`.
- `src/app/screens/creo/creo-admin-login/creo-admin-login.component.ts`.

## Resultados observados

| Comprobación | Evidencia reportada | Estado |
| --- | --- | --- |
| Build QA después de la corrección | npm run build:qa, 366.13 kB, 21.882 s | PASS |
| diff --check frontend | Sin errores de espacios; avisos LF/CRLF | PASS |
| Token inválido al recargar Mi perfil | GET candidatos/me 401, aviso de sesión expirada, URL /creo/landing?sessionExpired=true y claves token/creo_user eliminadas, según confirmación del implementador | PASS |
| Cuenta con sesión activa suspendida por administrador | Consulta posterior del perfil 401; nuevo login 403 y JSON de suspensión | PASS para respuestas HTTP |
| Login general de fixture suspendido después de corregir | 403 y confirmación del mensaje «Su cuenta se encuentra suspendida. Comuníquese con el administrador.» | PASS |
| Formulario administrativo con fixture suspendido | 403, JSON y texto visible de suspensión confirmados | PASS |
| Login de candidato1 reactivado | 200, rol candidato y perfil visible confirmado | PASS |
| Login de administrador | 200, rol admin y panel utilizable confirmado en la última reproducción | PASS |
| Bloqueo temporal en formulario general | candidato2: 429 y aviso de bloqueo; recuperación posterior confirmada | PASS |
| Sesión admin después de suspender otra cuenta | PATCH /admin/usuarios/4/suspender 200; el implementador confirmó que el panel sigue funcionando en el último intento | PASS en la última reproducción |

Los logins 200 se complementan con las confirmaciones visuales del implementador.
No se guardan sus cuerpos porque incluían tokens.

### Reporte de pérdida de sesión del administrador

Inicialmente se reportó que el administrador perdía la sesión al suspender otra
cuenta. Se solicitó repetir con sesiones separadas, admin en incógnito y candidato
en ventana normal. En el último intento se aportó la suspensión HTTP 200 y se
confirmó que todo seguía funcionando. El problema inicial queda como **no
reproducido en el último intento**, sin causa atribuida ni corrección adicional.
Si reaparece, registrar la primera petición fallida, la navegación y el estado
de sesión, sin exportar tokens.

## Reproducción manual y regresión

1. Con API y Nginx disponibles, ejecutar `npm.cmd run build:qa` en el frontend.
2. Abrir http://127.0.0.1:4202 y recargar sin caché.
3. Login general con suspendido@qa.example.test y contraseña correcta: comprobar
   403 y mensaje de suspensión.
4. Repetir desde el formulario administrativo. Comprobar el mensaje en pantalla.
5. Login válido de administrador: comprobar acceso efectivo al panel.
6. Reactivar candidato1 si quedó suspendido por la prueba y verificar login y
   perfil. No ejecutar QaSeeder para restablecer globalmente otros fixtures.
7. Para sesión inválida, iniciar sesión como candidato, sustituir únicamente
   el valor `token` de Session Storage por un texto inválido y recargar:
   comprobar 401, aviso, URL y eliminación de token/creo_user.
8. Para bloqueo, utilizar una cuenta ficticia dedicada. Enviar intentos erróneos
   uno a uno y detenerse al recibir 429. Comprobar aviso y recuperación después
   del plazo, sin seguir aumentando intentos.
9. Cerrar las sesiones utilizadas y no exportar contraseñas ni tokens.

## Límites y pasos de cierre

- Las verificaciones de URL de sesión expirada, limpieza de Session Storage,
  texto de suspensión en el formulario administrativo, perfil reactivado y
  recuperación de candidato2 fueron confirmadas por el implementador.
- La última reproducción de suspensión conservó el funcionamiento del admin;
  no se simuló por separado un 403 de entidad durante una sesión admin.
- No se declara ejecutada una simulación de 403 sin message válido: la
  alternativa genérica se conserva en el código.
- Tras la última reproducción, reactivar candidato1 si quedó suspendido y
  cerrar las sesiones utilizadas. No restaurar globalmente todos los fixtures.
- Identificar commits coordinados de API/frontend e incorporar evidencias
  adicionales sin secretos cuando se disponga de ellas.
- Solicitar revisión e integración; este documento no acredita aprobación.

La regresión backend relacionada pasó con 259 pruebas Unit/Feature y 19 pruebas
MySQL de propiedad. Los detalles están en el informe QA-05 del repositorio API.
No se exige despliegue ni APK para estas comprobaciones locales.
