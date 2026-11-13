# Portal de Empleos PWA — Frontend — Calidad de Software

Angular 19, TypeScript 5.7 y Tailwind CSS 4.

API del mismo proyecto: [recruitment-api-calidad-software](https://github.com/stephany-toribio/recruitment-api-calidad-software).

## Objetivo y delimitación

Este proyecto del curso Calidad de Software evalúa el Portal de Empleos CREO+ con datos persistentes, flujos de aprobación, permisos y pruebas reproducibles. La entrega incluye una **PWA instalable en Android** y automatización con **Karate, JMeter, Selenium y Appium**.

La base de trabajo es `develop`. `main` se reserva para las entregas estables y ahora conserva una base anterior. El código ya existente se verifica antes de modificarlo: una pantalla, endpoint o test versionado no acredita por sí solo una ejecución aprobada.

### Requisitos incluidos

| ID | Alcance |
| --- | --- |
| RF-01 | Registro real de candidatos y empresas, validación y unicidad |
| RF-02 | Autenticación, roles, sesión, bloqueo/suspensión y logout |
| RF-03 | Consulta y actualización del perfil propio |
| RF-04 | Registro y gestión de vacantes de la empresa propietaria |
| RF-05 | Aprobación/no aprobación administrativa y pago simulado |
| RF-06 | Búsqueda, detalle y reglas de disponibilidad |
| RF-07 | Postulación persistente y prevención de duplicados |
| RF-08 | Revisión, entrevista, contratación/rechazo y cupos |
| RF-09 | Seguimiento y retiro propio en estados permitidos |
| RF-10 | Historial de decisiones, fechas y motivos |
| PWA-01 | PWA instalable y apertura en Android |
| PWA-02 | Caché pública, vista offline y escrituras solo en línea |
| PWA-03 | Actualización, reapertura y recuperación de la PWA |
| PWA-04 | Diseño móvil, accesibilidad y selectores estables |
| RNF-01 | Autorización del servidor y protección de sesiones/datos |
| RNF-02 | Integridad transaccional y concurrencia |
| RNF-03 | Rendimiento bajo carga controlada |
| RNF-04 | Reproducibilidad, CI y trazabilidad de la entrega |

### Fuera del alcance de esta entrega

- Matching con IA, rediseño del algoritmo o integración con un tercer servicio Python.
- Aplicación nativa Android/iOS, publicación en tiendas y soporte específico de iOS.
- Pasarela bancaria, cobros reales y datos reales de tarjetas.
- Postulaciones, pagos o decisiones sin conexión y colas automáticas de escrituras.
- Nuevos módulos de analítica, lector de CV, auditoría avanzada o ampliación de catálogos que no sean necesarios para el flujo evaluado.

Las funciones adicionales ya presentes —por ejemplo, vacantes guardadas o recuperación de contraseña— se conservan. Se revisará su regresión cuando una modificación las afecte, sin ampliar por ello el flujo obligatorio de la entrega.

## Flujo completo del sistema

| Paso | Actor | Operación y resultado | Condiciones o alternativa |
| --- | --- | --- | --- |
| 1 | Candidato y empresa | Se registran y se comprueba persistencia de sus perfiles | Campos y formatos válidos; correo/DNI/RUC únicos según contrato |
| 2 | Los tres roles | Inician sesión y acceden a su área | El rol y la autorización los decide la API; errores, bloqueo y suspensión se verifican |
| 3 | Empresa | Registra una vacante propia | Datos de la oferta, vigencia y número de puestos válidos |
| 4 | Administrador | Revisa y aprueba o no aprueba la vacante | Una vacante no aprobada se corrige antes de volver a revisión según el comportamiento vigente |
| 5 | Empresa propietaria | Completa el pago simulado de una vacante aprobada | Datos inválidos o un pago repetido se rechazan; no hay cobro real |
| 6 | Sistema | Publica una vacante disponible | Aprobación vigente, pago exitoso, empresa activa, estado activo, vigencia, sin eliminar y con puestos sin contratar |
| 7 | Candidato | Busca, filtra y consulta el detalle de una vacante | Las ofertas no disponibles no admiten nuevas postulaciones |
| 8 | Candidato | Postula y obtiene confirmación del servidor | El candidato sale del token; una sola postulación por candidato y empleo, incluso con concurrencia |
| 9 | Empresa propietaria | Consulta postulaciones y revisa el perfil del postulante | Otra empresa o un rol no autorizado no puede gestionar el recurso |
| 10 | Empresa propietaria | Avanza, entrevista, contrata o rechaza con motivo | Solo transiciones permitidas; contratar no puede exceder los puestos disponibles |
| 11 | Candidato | Consulta el resultado y puede retirar cuando corresponda | El retiro conserva el último estado y el historial; no habilita repostular al mismo empleo |
| 12 | Empresa y candidato | Consultan su seguimiento e historial permitido y cierran sesión | Fechas y motivos persistentes; logout revoca el token y limpia la sesión local |

### Transiciones de postulación

| Origen | Acción | Resultado |
| --- | --- | --- |
| Recibido | Avanzar | En revisión |
| En revisión | Avanzar | Entrevista |
| En revisión o Entrevista | Rechazar con motivo válido | Rechazado |
| Entrevista | Contratar, con puesto disponible | Contratado |
| Recibido, En revisión o Entrevista | Retiro por el candidato propietario | Marca de retiro; se conserva el último estado |

Contratado y Rechazado son estados finales. Se rechazan los saltos y las operaciones no permitidas sobre postulaciones retiradas. El número de puestos limita las **contrataciones**, no la cantidad de candidatos que pueden postular mientras la oferta siga disponible.

## PWA y comportamiento móvil

La PWA forma parte confirmada del alcance; todavía debe implementarse y demostrarse con evidencia.

| ID | Cambio previsto | Comprobación de aceptación |
| --- | --- | --- |
| PWA-01 | Manifiesto, nombre, iconos 192/512, start_url, scope y modo standalone | Instalación y apertura desde el lanzador en Android bajo HTTPS |
| PWA-02 | Service worker para recursos estáticos y vista sin conexión | No cachear tokens, perfiles ni respuestas API privadas; explicar la falta de red |
| PWA-02 | Escrituras en línea y prevención de dobles envíos | Sin éxito ficticio ni reenvío automático de postulaciones, pagos o decisiones |
| PWA-03 | Actualización y recuperación entre builds | Aviso y navegación coherentes; sin pérdida silenciosa de formularios |
| PWA-04 | Diseño móvil y accesibilidad | Recorrido usable al menos en 360×800 y 412×915, con orientación y teclado virtual |

Si se pierde la respuesta durante una postulación, el resultado puede ser incierto: se debe consultar el estado persistente antes de reintentar y conservar la protección de unicidad de la API.

Appium se ejecutará en un dispositivo o emulador Android y documentará el modo de apertura de la PWA instalada y el contexto usado. La vista móvil del escritorio no sustituye esa prueba. La instalación manual, cuando exista, se identificará como tal; no se presentará como paso automatizado.

## Plan de pruebas y evidencias

Todos los casos de la siguiente matriz están **planificados**. Su resultado se registrará al ejecutarlos; esta documentación no afirma que ya pasaron.

| Caso | Requisitos | Prueba | Resultado esperado | Herramienta |
| --- | --- | --- | --- | --- |
| CP-01 | RF-01 | Registro de candidato válido y datos inválidos o repetidos | Persistencia del perfil y errores por campo; sin registros parciales | Karate, Selenium |
| CP-02 | RF-01 | Registro de empresa y RUC/correo duplicados | Alta válida y rechazo de datos inválidos según contrato | Karate, Selenium |
| CP-03 | RF-02 | Login de candidato, empresa y administrador | Token y rol del servidor; navegación al área autorizada | Karate, Selenium, Appium |
| CP-04 | RF-02, RNF-01 | Credenciales incorrectas, bloqueo y cuenta suspendida | Rechazo y mensaje del contrato; acceso no concedido | Karate, Selenium |
| CP-05 | RF-02, RNF-01 | Logout y reutilización de token revocado/inválido | Revocación en API y limpieza de sesión; ruta protegida rechazada | Karate, Selenium, Appium |
| CP-06 | RF-03, RNF-01 | Consulta/edición propia y acceso a perfil ajeno | Persisten datos permitidos; autorización del servidor en todos los casos | Karate, Selenium |
| CP-07 | RF-04 | Creación de vacante con campos y fechas válidos/incorrectos | Validación, propiedad y persistencia sin publicación prematura | Karate, Selenium |
| CP-08 | RF-05, RNF-01 | Aprobación/no aprobación y rol incorrecto | Decisión del administrador y rechazo del actor no autorizado | Karate, Selenium |
| CP-09 | RF-05 | Pago simulado válido, inválido o duplicado | Se registra solo el intento permitido; no existe cobro bancario real | Karate, Selenium |
| CP-10 | RF-06 | Vacante sin aprobar/pagar, pausada, vencida, eliminada o completa | No admite nuevas postulaciones; listado y detalle aplican las reglas previstas | Karate |
| CP-11 | RF-06 | Búsqueda, filtros y detalle de vacante disponible | Resultados coherentes y datos de la API visibles | Karate, Selenium, Appium |
| CP-12 | RF-07 | Primera postulación de candidato autenticado | Una creación en recibido, asociada al candidato del token | Karate, Selenium, Appium |
| CP-13 | RF-07, RNF-02 | Postulación duplicada secuencial y carrera del mismo candidato | Una sola fila; en la carrera, una respuesta 201 y otra 409 | Karate, PHPUnit/MySQL, JMeter |
| CP-14 | RF-07, RNF-02 | Postulaciones simultáneas de candidatos diferentes | Se admiten si la vacante está disponible; el cupo no limita postulantes | PHPUnit/MySQL, JMeter |
| CP-15 | RNF-01 | Token ausente, rol incorrecto y recursos de otra empresa/candidato | 401/403 o respuesta del contrato sin mutaciones ni exposición indebida | Karate, Selenium |
| CP-16 | RF-08 | Recibido→En revisión→Entrevista→Contratado | Solo transiciones permitidas, cupo respetado y UI sincronizada | Karate, Selenium |
| CP-17 | RF-08 | Rechazo desde revisión/entrevista con motivo válido o ausente | Motivo validado y resultado persistente con historial | Karate, Selenium |
| CP-18 | RF-08 | Salto de estado, estado final y postulación retirada | Operación rechazada; no se altera estado ni historial | Karate |
| CP-19 | RF-08, RNF-02 | Contrataciones concurrentes al último puesto | No se supera numero_vacantes y se informa el conflicto | PHPUnit/MySQL, JMeter |
| CP-20 | RF-09 | Retiro propio, retiro ajeno o estado no permitido | Marca de retiro solo cuando corresponde; no permite repostular al mismo empleo | Karate, Selenium |
| CP-21 | RF-09 | Mis postulaciones y consulta de su vacante histórica | El candidato conserva seguimiento propio ante cambios de la vacante | Karate, Selenium |
| CP-22 | RF-10 | Consulta de historial tras decisiones y retiro | Movimientos, fechas y motivo cuando corresponde; sin pérdida de registros | Karate, Selenium |
| CP-23 | RF-01 a RF-10 | Recorrido integrado de los tres roles en web | El resultado final visible coincide con la API y la base | Selenium |
| CP-24 | PWA-01 | Instalación y apertura desde el lanzador Android | Manifiesto/iconos correctos y apertura instalada en modo standalone | Android, Appium |
| CP-25 | PWA-04 | Pantallas móviles, orientación, teclado y foco | Acciones accesibles y sin desbordamientos que bloqueen el recorrido | Selenium, Appium |
| CP-26 | PWA-02, RNF-01 | Apertura sin red y revisión de caché | Shell/vista offline; sin tokens, perfiles ni respuestas privadas en caché SW | Android/DevTools, Appium |
| CP-27 | PWA-02, RF-07 | Corte de red antes/durante una escritura y recuperación | Sin éxito ficticio, cola automática ni duplicación; resultado incierto se consulta | Appium, API |
| CP-28 | PWA-03 | Actualización instalada entre dos builds | Nueva versión usable, aviso/recuperación y formularios sin pérdida silenciosa | Android, Appium |
| CP-29 | PWA-01, RF-02, RF-06, RF-07 | Login, búsqueda, detalle y postulación desde PWA Android | Ejecución Appium y persistencia demostradas en dispositivo/emulador | Appium |
| CP-30 | PWA-02, PWA-03, RF-02 | Sesión inválida, logout y reapertura móvil | Reautenticación y mensajes coherentes; datos privados no expuestos | Appium |
| CP-31 | RNF-03 | Carga de búsqueda/listado/detalle | p95, throughput y errores medidos frente al objetivo aprobado | JMeter |
| CP-32 | RF-02, RNF-03 | Login concurrente con credenciales únicas | Correlación correcta de tokens, respuestas y tiempos | JMeter |
| CP-33 | RF-07, RF-08, RNF-02, RNF-03 | Carga de postulaciones y decisiones | Sin pérdida, duplicación ni sobrecontratación; integridad verificada al finalizar | JMeter, PHPUnit/MySQL |
| CP-34 | RNF-04 | Reproducción desde copia limpia y CI con reportes | Comandos repetibles, fallos visibles y evidencia completa sin secretos | CI, Karate, Selenium, Appium, JMeter |

### Suites previstas

| Herramienta | Repositorio y ruta prevista | Entregable |
| --- | --- | --- |
| Karate | API: `qa/karate/` | Features positivos/negativos, Scenario Outline, runner, fixtures y reporte |
| JMeter | API: `qa/jmeter/` | Planes JMX, CSV ficticio, correlación, assertions, JTL y reporte HTML |
| Selenium | Frontend: `qa/selenium/` | Page Objects, esperas explícitas, recorridos por rol, capturas y reporte |
| Appium | Frontend: `qa/appium/` | Capabilities, versiones, pruebas Android/PWA, capturas y reporte |
| PHPUnit | API: `tests/Unit/`, `tests/Feature/`, `tests/MySql/` | Regresiones y pruebas de integridad/concurrencia; complementan las cuatro herramientas |

Las rutas `qa/*` son ubicaciones de implementación previstas; no se describen como suites ya incorporadas. Los reportes deben indicar commit, fecha, ambiente, datos y resultado, y excluir tokens, contraseñas y datos personales reales.

### Rendimiento

En QA-24 se medirá la línea base y se fijarán los umbrales de aceptación antes de ejecutar la carga de aceptación. Como objetivos iniciales de planificación: 25 usuarios virtuales, p95 de lecturas ≤2 s, p95 de login/escrituras ≤3 s, errores inesperados <1% y cero pérdida, duplicación o sobrecontratación.

La exploración de 10/25/50 usuarios se hará solo en un entorno QA aislado, con ramp-up, duración y condiciones de parada documentados. Se separarán los 4xx esperados de los errores inesperados y se informará tamaño de muestra y límites del alojamiento. Los objetivos no son resultados medidos ni promesas de capacidad.

## Gestión y reparto para tres integrantes

El [plan maestro](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/3) contiene las ocho épicas, las 31 tareas nuevas, sus dependencias y los dos tickets documentales QA-01 de ambos repositorios.

| Rol de trabajo | Responsabilidad principal | Revisión cruzada | Puntos relativos de tareas nuevas |
| --- | --- | --- | --- |
| R1 | API y Karate | R2 | 35 |
| R2 | Web, PWA y Selenium | R3 | 33 |
| R3 | Integración, Appium y JMeter | R1 | 34 |

Los roles deben asociarse a los usuarios reales del equipo; no equivalen todavía a asignaciones nominales de GitHub. Los puntos expresan tamaño relativo, no horas. Las fechas se fijarán con el plazo real y la disponibilidad del equipo.

Consultar [GESTION_PROYECTO.md](docs/GESTION_PROYECTO.md) para los hitos, estados, reglas de trabajo, índice de issues, riesgos y criterios de cierre.

### Criterios de entrega

- Los requisitos incluidos tienen casos y evidencia trazables.
- El flujo completo funciona con datos persistentes y permisos del servidor.
- Las cuatro suites se ejecutan y reportan resultados; la PWA se instala y se prueba en Android.
- Los casos P0/P1 están aprobados, sin bloqueos ni defectos Sev1/Sev2 pendientes dentro del alcance.
- Los resultados de rendimiento se comparan con los objetivos definidos, incluida la integridad posterior a la carga.
- Hay revisión de otro integrante, CI y regresión cuando corresponda, manual, informe y demostración reproducibles.

## Ramas y Pull Requests

`main` y `develop` son las dos ramas permanentes. Crear una rama temporal por tarea desde `develop`, abrir PR hacia `develop`, revisar y verificar el resultado y eliminarla después de integrarla. La rama actual `feature/QA-01-alcance-calidad-software` es temporal.

Al trabajar tres personas puede haber varias ramas temporales a la vez. No se necesita conservar ramas `deploy/*` para separar ambientes: la configuración de entorno se versiona y documenta. La entrega coordinada pasa de `develop` a `main` solo después de superar los criterios de cierre.

Seguir [CONTRIBUTING.md](CONTRIBUTING.md) y la plantilla de PR para relacionar issue, requisito, caso y evidencia.

## Instalación y configuración del frontend

Requisitos: Git, Node.js 22.x y npm. Angular CLI ya está declarado en el proyecto.

```bash
git clone --branch develop https://github.com/stephany-toribio/web-app-calidad-software.git
cd web-app-calidad-software
npm ci
npm run start
```

La interfaz local se abre en `http://localhost:4200`. La API debe estar levantada y preparada con los catálogos y datos de QA.

En `develop`, `src/environments/environment.development.ts` se usa en desarrollo y `src/environments/environment.ts` en la compilación de producción. Ambos apuntan actualmente a `http://localhost:8000/api/v1`. QA-03 debe dejar una configuración de QA explícita y accesible desde Android; los ajustes de las ramas de despliegue eliminadas no se incorporan automáticamente.

```bash
npm run build
```

La salida del navegador se genera en `dist/creo-angular/browser`. El alojamiento debe resolver las rutas de Angular hacia `index.html`. Dentro de Android, `localhost` apunta al propio dispositivo.

### Estado observado y primera verificación

En la base revisada hay servicios HTTP, guards por rol, interceptor de tokens, sesión en `sessionStorage` y pantallas del flujo. Existe `npm run build`, pero no hay script `npm test`, suites Selenium/Appium ni recursos PWA incorporados en `develop` al iniciar este plan.

La primera ejecución debe comprobar dependencias, TypeScript, plantillas, consola/red y el recorrido real con la API. Después se implementan los cambios pendientes y las suites; no se espera al despliegue para buscar errores.

## Referencias técnicas

- [Angular: service worker y recursos PWA](https://angular.dev/ecosystem/service-workers/getting-started).
- [Appium UiAutomator2: Android y contextos web](https://github.com/appium/appium-uiautomator2-driver).
