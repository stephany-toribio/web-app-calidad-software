# Gestión integral — Portal de Empleos PWA

Este plan organiza la entrega de Calidad de Software para tres integrantes. El índice operativo estable es el [issue maestro](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/3). Los README de ambos repositorios delimitan los requisitos y las 34 familias de casos planificadas.

## Organización del trabajo

| Rol | Frente principal | Revisor por defecto | Tareas nuevas | Puntos relativos |
| --- | --- | --- | --- | --- |
| R1 | API y Karate | R2 | 10 | 35 |
| R2 | Web, PWA y Selenium | R3 | 11 | 33 |
| R3 | Integración, Appium y JMeter | R1 | 10 | 34 |

Las asignaciones son por rol. Se deben sustituir por los usuarios reales del equipo en Assignees; no se han inventado identidades. Las ocho épicas y el issue maestro no suman puntos para evitar doble conteo. Las dos issues QA-01 documentales preexistentes tampoco están incluidas en los 102 puntos de las 31 tareas nuevas.

Los puntos son tamaño relativo y se revisan tras la línea base. No son horas ni fechas comprometidas. El calendario se fijará con el plazo real y la disponibilidad de los tres integrantes.

## Hitos y criterios de salida

| Hito | Entrega | Criterio de salida |
| --- | --- | --- |
| M0 | Alcance y línea base | README de ambos repositorios delimitados; ambiente reproducible, datos ficticios y línea base registrada. |
| M1 | Flujo de negocio estable | Registro, permisos, publicación, postulación, retiro, decisiones e historial verificados sin defectos graves abiertos. |
| M2 | PWA y entorno QA | PWA instalada y actualizable en Android, falta de red controlada y entorno QA accesible. |
| M3 | API automatizada | Karate positivo, negativo y de flujo integral ejecutado con reportes y fixtures. |
| M4 | Web y Android automatizados | Selenium y Appium ejecutados; PWA instalada y recorrido Android demostrado. |
| M5 | Rendimiento, regresión y entrega | Carga medida, integridad comprobada, regresión aprobada, CI/evidencias/informe y release coordinada. |

Los hitos son puertas de verificación, no una secuencia que impida trabajar en paralelo. Una tarea de PWA o de automatización puede empezar en cuanto sus dependencias estén listas. La viabilidad de Appium con la PWA debe comprobarse temprano con QA-10, QA-13 y QA-21.

Primer reparto después de revisar/integrar los PR documentales: R1 comienza QA-02, R2 QA-03 y R3 QA-04. Luego cada rol toma una tarea desbloqueada de mayor prioridad; nadie espera a que termine toda una épica si sus dependencias ya están cumplidas.

## Épicas e índice de issues

| Épica | Resultado | Coordinación |
| --- | --- | --- |
| [E01](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/4) — Preparación, alcance y entorno reproducible | Disponer de una base verificable, datos aislados y un entorno de QA accesible desde Android. | R3 |
| [E02](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/5) — Flujo de negocio, permisos e integridad | Verificar y corregir el recorrido de registro, publicación, postulación y decisión sin rehacer lo que ya funciona. | R1 |
| [E03](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/6) — PWA instalable y experiencia móvil | Entregar PWA Android con manifiesto, instalación, actualización y comportamiento honesto sin conexión. | R2 |
| [E04](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/7) — Automatización API con Karate | Automatizar contratos, validaciones, permisos y flujo integral con reportes y datos repetibles. | R1 |
| [E05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/8) — Automatización web con Selenium | Demostrar los recorridos de candidato, empresa y administrador desde la interfaz web. | R2 |
| [E06](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/9) — Automatización Android con Appium | Instalar, abrir y probar la PWA en Android con evidencia del contexto y persistencia. | R3 |
| [E07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/10) — Rendimiento y concurrencia con JMeter | Medir cargas controladas, comprobar integridad y tratar cuellos de botella demostrados. | R3 |
| [E08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/11) — CI, trazabilidad, evidencias y entrega | Mantener el seguimiento, ejecutar regresión, preparar el informe y publicar una release coordinada. | R3 |

QA-01 tiene dos tickets documentales: [API](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/1) y [Frontend](https://github.com/stephany-toribio/web-app-calidad-software/issues/1). Se revisan mediante los PR #2 de sus respectivos repositorios.

| Tarea | Repositorio | Hito | Rol | Prioridad | Puntos | Depende de |
| --- | --- | --- | --- | --- | --- | --- |
| [QA-02](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/12) — Reproducir API y preparar base y datos aislados | API | M0 | R1 | P0 | 3 | [QA-01](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/1) |
| [QA-03](https://github.com/stephany-toribio/web-app-calidad-software/issues/3) — Compilar frontend y separar configuración local y de QA | Frontend | M0 | R2 | P0 | 2 | [QA-01](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/1) |
| [QA-04](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/13) — Definir matriz de requisitos, riesgos, casos y datos de prueba | API | M0 | R3 | P0 | 3 | [QA-01](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/1) |
| [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14) — Verificar autenticación, sesiones y permisos de los tres roles | API | M1 | R1 | P0 | 3 | [QA-02](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/12) |
| [QA-06](https://github.com/stephany-toribio/web-app-calidad-software/issues/4) — Estabilizar registro y perfiles de candidato y empresa | Frontend | M1 | R2 | P1 | 3 | [QA-02](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/12), [QA-03](https://github.com/stephany-toribio/web-app-calidad-software/issues/3) |
| [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15) — Validar publicación, moderación, pago simulado y disponibilidad | API | M1 | R1 | P0 | 5 | [QA-02](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/12), [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14) |
| [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16) — Verificar postulación, duplicados, retiro y concurrencia | API | M1 | R1 | P0 | 5 | [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14), [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15) |
| [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5) — Validar Kanban, decisiones, cupos e historial de extremo a extremo | Frontend | M1 | R2 | P0 | 5 | [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14), [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15), [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16) |
| [QA-10](https://github.com/stephany-toribio/web-app-calidad-software/issues/6) — Implementar manifiesto, iconos e instalación de la PWA | Frontend | M2 | R2 | P1 | 3 | [QA-03](https://github.com/stephany-toribio/web-app-calidad-software/issues/3) |
| [QA-11](https://github.com/stephany-toribio/web-app-calidad-software/issues/7) — Implementar actualización, caché y comportamiento sin conexión | Frontend | M2 | R2 | P0 | 3 | [QA-10](https://github.com/stephany-toribio/web-app-calidad-software/issues/6) |
| [QA-12](https://github.com/stephany-toribio/web-app-calidad-software/issues/8) — Ajustar diseño móvil, accesibilidad y selectores de prueba | Frontend | M2 | R2 | P1 | 3 | [QA-06](https://github.com/stephany-toribio/web-app-calidad-software/issues/4), [QA-10](https://github.com/stephany-toribio/web-app-calidad-software/issues/6) |
| [QA-13](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/17) — Preparar despliegue de QA con HTTPS y datos reproducibles | API | M2 | R3 | P0 | 3 | [QA-02](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/12), [QA-03](https://github.com/stephany-toribio/web-app-calidad-software/issues/3) |
| [QA-14](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/18) — Preparar runner Karate, configuración y fixtures | API | M3 | R1 | P1 | 2 | [QA-02](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/12), [QA-04](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/13) |
| [QA-15](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/19) — Automatizar registros, autenticación y validaciones con Karate | API | M3 | R1 | P1 | 3 | [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14), [QA-06](https://github.com/stephany-toribio/web-app-calidad-software/issues/4), [QA-14](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/18) |
| [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20) — Automatizar flujo de vacante, postulación y decisión con Karate | API | M3 | R1 | P0 | 5 | [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15), [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-14](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/18) |
| [QA-17](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/21) — Automatizar autorización, conflictos y errores con Karate | API | M3 | R3 | P0 | 3 | [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14), [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-14](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/18) |
| [QA-18](https://github.com/stephany-toribio/web-app-calidad-software/issues/9) — Preparar Selenium con Page Objects y evidencias | Frontend | M4 | R2 | P1 | 2 | [QA-03](https://github.com/stephany-toribio/web-app-calidad-software/issues/3), [QA-04](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/13) |
| [QA-19](https://github.com/stephany-toribio/web-app-calidad-software/issues/10) — Automatizar el recorrido web del candidato con Selenium | Frontend | M4 | R2 | P0 | 3 | [QA-06](https://github.com/stephany-toribio/web-app-calidad-software/issues/4), [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-12](https://github.com/stephany-toribio/web-app-calidad-software/issues/8), [QA-18](https://github.com/stephany-toribio/web-app-calidad-software/issues/9) |
| [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11) — Automatizar moderación y decisiones de empresa con Selenium | Frontend | M4 | R3 | P0 | 3 | [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15), [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-12](https://github.com/stephany-toribio/web-app-calidad-software/issues/8), [QA-18](https://github.com/stephany-toribio/web-app-calidad-software/issues/9) |
| [QA-21](https://github.com/stephany-toribio/web-app-calidad-software/issues/12) — Preparar Appium y Android con capacidades reproducibles | Frontend | M4 | R3 | P1 | 3 | [QA-04](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/13), [QA-13](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/17), [QA-10](https://github.com/stephany-toribio/web-app-calidad-software/issues/6) |
| [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13) — Automatizar la PWA instalada y la postulación en Android | Frontend | M4 | R3 | P0 | 5 | [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-10](https://github.com/stephany-toribio/web-app-calidad-software/issues/6), [QA-11](https://github.com/stephany-toribio/web-app-calidad-software/issues/7), [QA-12](https://github.com/stephany-toribio/web-app-calidad-software/issues/8), [QA-13](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/17), [QA-21](https://github.com/stephany-toribio/web-app-calidad-software/issues/12) |
| [QA-23](https://github.com/stephany-toribio/web-app-calidad-software/issues/14) — Probar sesión, actualización y falta de red en Android | Frontend | M4 | R2 | P1 | 3 | [QA-11](https://github.com/stephany-toribio/web-app-calidad-software/issues/7), [QA-21](https://github.com/stephany-toribio/web-app-calidad-software/issues/12), [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13) |
| [QA-24](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/22) — Diseñar cargas, CSV y objetivos de rendimiento con JMeter | API | M5 | R3 | P1 | 3 | [QA-02](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/12), [QA-04](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/13) |
| [QA-25](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/23) — Ejecutar cargas y concurrencia controlada con JMeter | API | M5 | R3 | P0 | 5 | [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-13](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/17), [QA-24](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/22) |
| [QA-26](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/24) — Analizar rendimiento y corregir cuellos de botella demostrados | API | M5 | R1 | P1 | 3 | [QA-25](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/23) |
| [QA-27](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/25) — Configurar CI de API, PHPUnit, MySQL y Karate | API | M5 | R1 | P1 | 3 | [QA-14](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/18), [QA-15](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/19), [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20), [QA-17](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/21) |
| [QA-28](https://github.com/stephany-toribio/web-app-calidad-software/issues/15) — Configurar CI de frontend y regresión web | Frontend | M5 | R2 | P1 | 3 | [QA-18](https://github.com/stephany-toribio/web-app-calidad-software/issues/9), [QA-19](https://github.com/stephany-toribio/web-app-calidad-software/issues/10), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11) |
| [QA-29](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/26) — Mantener trazabilidad en Jira y ciclo de defectos | API | M0 | R3 | P1 | 3 | [QA-04](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/13) |
| [QA-30](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/27) — Ejecutar regresión integrada y cerrar criterios de entrega | API | M5 | R3 | P0 | 3 | [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20), [QA-17](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/21), [QA-19](https://github.com/stephany-toribio/web-app-calidad-software/issues/10), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11), [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13), [QA-23](https://github.com/stephany-toribio/web-app-calidad-software/issues/14), [QA-25](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/23), [QA-26](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/24), [QA-27](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/25), [QA-28](https://github.com/stephany-toribio/web-app-calidad-software/issues/15) |
| [QA-31](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/28) — Preparar informe, manual y demostración de la entrega | API | M5 | R1 | P1 | 3 | [QA-29](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/26), [QA-30](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/27) |
| [QA-32](https://github.com/stephany-toribio/web-app-calidad-software/issues/16) — Preparar release coordinada y cierre del proyecto | Frontend | M5 | R2 | P1 | 3 | [QA-13](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/17), [QA-30](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/27), [QA-31](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/28) |

Cada issue contiene criterios de aceptación verificables, casos asociados, evidencia esperada y condición de cierre. Si la funcionalidad ya cumple, se registra la ejecución y se conserva el código; no se reimplementa por el solo hecho de existir una tarea.

## Configuración del GitHub Project

Usar un solo Project para las issues de los dos repositorios. La creación de issues en un repositorio y su incorporación a un Project son operaciones distintas; verificar la presencia de los elementos en el tablero.

| Campo | Valores o uso |
| --- | --- |
| Status | Backlog, Ready, In progress, In review, In validation, Blocked, Done |
| Tipo | Plan, Épica, Tarea, Defecto |
| Rol | R1, R2, R3; puente provisional hasta las asignaciones nominales |
| Assignees | Usuarios reales verificados; un responsable principal por tarea |
| Prioridad | P0, P1, P2 |
| Hito | M0, M1, M2, M3, M4, M5 |
| Épica | E01 a E08 |
| Puntos | Estimación relativa de la tarea; vacía para épicas/plan |
| Fechas | Inicio/fin reales, una vez acordado el plazo; no inventarlas |

Vistas previstas: Ejecución (tablero por estado), Backlog (tabla ordenada por prioridad/dependencia), Por integrante (agrupación por rol/asignación), Hitos (agrupación por M0–M5), Épicas (resumen y checklists) y Defectos (filtrado por tipo/severidad). Un roadmap con fechas se configura cuando exista calendario real.

Si el Project admite las automatizaciones necesarias, configurar entrada de issues de ambos repositorios en Backlog y movimiento a Done al cerrar una issue. No tratar la fusión de un PR como aprobación automática de las pruebas. Las reaperturas deben volver a revisión del responsable.

## Estados, límites y reuniones

| Estado | Qué significa y cómo salir |
| --- | --- |
| Backlog | Trabajo identificado; dependencias o preparación todavía pendientes |
| Ready | Dependencias verificadas, criterio claro, datos/ambiente disponibles y responsable definido |
| In progress | Una persona está implementando, verificando o ejecutando el caso |
| In review | PR o entregable listo para revisión de otro integrante |
| In validation | Revisión resuelta; faltan ejecución, retest o comprobación integrada |
| Blocked | Hay impedimento explícito, responsable de resolverlo y dependencia/enlace |
| Done | Criterios, evidencia y revisión cumplidos; issue cerrada conscientemente |

Límite inicial: una tarea activa por persona y una revisión pendiente por persona. Si hay un bloqueo, registrarlo y tomar otra tarea Ready; no abrir muchas tareas simultáneas para ocultar la espera.

Revisión breve del equipo al comenzar cada jornada: qué se terminó con evidencia, qué sigue y qué bloquea. Al cerrar un hito, demostrar el resultado, ajustar estimaciones y registrar decisiones.

## Definition of Ready

- Requisito y alcance claros, sin cambio de funcionalidad oculto.
- Dependencias resueltas o trabajo parcial explícitamente delimitado.
- Responsable por rol/usuario y revisor identificados.
- Criterios, datos, entorno y casos esperados definidos.
- Tamaño revisado; dividir si excede lo que una persona puede entregar y verificar de forma manejable.

## Definition of Done

- Criterios de aceptación cumplidos con resultado comprobable.
- Cambio revisado por otra persona y PR integrado cuando corresponda.
- Pruebas apropiadas ejecutadas, incluidos retest y regresión del defecto.
- Evidencia con caso, commit/build, fecha, ambiente, datos, esperado y obtenido.
- Documentación/contratos actualizados y sin secretos en artefactos.
- Sin Sev1/Sev2 del alcance; los menores quedan registrados con impacto y decisión.
- Issue cerrada y estado del Project coherente. Un commit, PR o captura aislada no basta.

## Gestión de defectos y prioridad

| Severidad | Impacto |
| --- | --- |
| Sev1 | Pérdida/corrupción de datos, bypass de autorización o fallo crítico de integridad |
| Sev2 | Bloquea el flujo principal, instalación PWA o una herramienta obligatoria sin alternativa aceptada |
| Sev3 | Función degradada con alternativa y sin pérdida de integridad |
| Sev4 | Detalle visual/editorial que no bloquea el proceso |

P0 atiende bloqueos y riesgos críticos; P1 es necesario para el alcance; P2 es mejora opcional que no desplaza lo obligatorio. Severidad y prioridad no son la misma medida.

Registrar defecto con pasos mínimos, caso, versión, entorno, datos ficticios, esperado/obtenido y evidencia. El responsable reproduce, corrige y vincula PR; otra persona hace retest y la regresión afectada. Si falla, reabrir con el nuevo resultado.

## Trazabilidad y evidencia

Cadena mínima: requisito RF/PWA/RNF → caso CP → ejecución → defecto si existe → PR/commit → retest → evidencia → hito. El Project es el seguimiento operativo; Jira conserva las relaciones/evidencias requeridas para la evaluación y referencia los IDs de GitHub, evitando estados contradictorios.

| Caso | Issues de implementación y verificación |
| --- | --- |
| CP-01 — RF-01 | [QA-06](https://github.com/stephany-toribio/web-app-calidad-software/issues/4), [QA-15](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/19), [QA-19](https://github.com/stephany-toribio/web-app-calidad-software/issues/10) |
| CP-02 — RF-01 | [QA-06](https://github.com/stephany-toribio/web-app-calidad-software/issues/4), [QA-15](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/19) |
| CP-03 — RF-02 | [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14), [QA-15](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/19), [QA-19](https://github.com/stephany-toribio/web-app-calidad-software/issues/10), [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13) |
| CP-04 — RF-02, RNF-01 | [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14), [QA-15](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/19) |
| CP-05 — RF-02, RNF-01 | [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14), [QA-15](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/19), [QA-23](https://github.com/stephany-toribio/web-app-calidad-software/issues/14) |
| CP-06 — RF-03, RNF-01 | [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14), [QA-06](https://github.com/stephany-toribio/web-app-calidad-software/issues/4), [QA-17](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/21) |
| CP-07 — RF-04 | [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15), [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11) |
| CP-08 — RF-05, RNF-01 | [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15), [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11) |
| CP-09 — RF-05 | [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15), [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11) |
| CP-10 — RF-06 | [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15), [QA-17](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/21) |
| CP-11 — RF-06 | [QA-07](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/15), [QA-19](https://github.com/stephany-toribio/web-app-calidad-software/issues/10), [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13) |
| CP-12 — RF-07 | [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20), [QA-19](https://github.com/stephany-toribio/web-app-calidad-software/issues/10), [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13) |
| CP-13 — RF-07, RNF-02 | [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-17](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/21), [QA-25](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/23) |
| CP-14 — RF-07, RNF-02 | [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-25](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/23) |
| CP-15 — RNF-01 | [QA-05](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/14), [QA-17](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/21), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11) |
| CP-16 — RF-08 | [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11) |
| CP-17 — RF-08 | [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11) |
| CP-18 — RF-08 | [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-17](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/21) |
| CP-19 — RF-08, RNF-02 | [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-25](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/23) |
| CP-20 — RF-09 | [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-17](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/21), [QA-19](https://github.com/stephany-toribio/web-app-calidad-software/issues/10) |
| CP-21 — RF-09 | [QA-08](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/16), [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20) |
| CP-22 — RF-10 | [QA-09](https://github.com/stephany-toribio/web-app-calidad-software/issues/5), [QA-16](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/20), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11) |
| CP-23 — RF-01 a RF-10 | [QA-19](https://github.com/stephany-toribio/web-app-calidad-software/issues/10), [QA-20](https://github.com/stephany-toribio/web-app-calidad-software/issues/11), [QA-30](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/27) |
| CP-24 — PWA-01 | [QA-10](https://github.com/stephany-toribio/web-app-calidad-software/issues/6), [QA-21](https://github.com/stephany-toribio/web-app-calidad-software/issues/12), [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13) |
| CP-25 — PWA-04 | [QA-12](https://github.com/stephany-toribio/web-app-calidad-software/issues/8), [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13) |
| CP-26 — PWA-02, RNF-01 | [QA-11](https://github.com/stephany-toribio/web-app-calidad-software/issues/7), [QA-23](https://github.com/stephany-toribio/web-app-calidad-software/issues/14) |
| CP-27 — PWA-02, RF-07 | [QA-11](https://github.com/stephany-toribio/web-app-calidad-software/issues/7), [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13), [QA-23](https://github.com/stephany-toribio/web-app-calidad-software/issues/14) |
| CP-28 — PWA-03 | [QA-11](https://github.com/stephany-toribio/web-app-calidad-software/issues/7), [QA-23](https://github.com/stephany-toribio/web-app-calidad-software/issues/14) |
| CP-29 — PWA-01, RF-02, RF-06, RF-07 | [QA-21](https://github.com/stephany-toribio/web-app-calidad-software/issues/12), [QA-22](https://github.com/stephany-toribio/web-app-calidad-software/issues/13) |
| CP-30 — PWA-02, PWA-03, RF-02 | [QA-23](https://github.com/stephany-toribio/web-app-calidad-software/issues/14) |
| CP-31 — RNF-03 | [QA-24](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/22), [QA-25](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/23), [QA-26](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/24) |
| CP-32 — RF-02, RNF-03 | [QA-24](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/22), [QA-25](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/23), [QA-26](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/24) |
| CP-33 — RF-07, RF-08, RNF-02, RNF-03 | [QA-24](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/22), [QA-25](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/23), [QA-26](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/24) |
| CP-34 — RNF-04 | [QA-27](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/25), [QA-28](https://github.com/stephany-toribio/web-app-calidad-software/issues/15), [QA-30](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/27), [QA-31](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/28) |

Organizar evidencias por herramienta y ejecución. Versionar código de pruebas y resúmenes; publicar reportes voluminosos como artefactos de CI o en la ubicación de entrega acordada. No guardar tokens, contraseñas, correos/DNI reales o datos de tarjetas en capturas y reportes.

## Riesgos iniciales

| Riesgo | Tratamiento | Rol / issue |
| --- | --- | --- |
| Confundir main con la base completa | Trabajar desde develop y registrar commits probados | R1/R2 — QA-02, QA-03 |
| API local o despliegue del portal original usado por QA | URL explícita, conectividad Android y datos aislados | R3 — QA-13 |
| PWA instalada no expone el contexto esperado para Appium | Comprobar apertura/contexto temprano; registrar bloqueo real | R3 — QA-21 |
| Caché conserva datos privados o una escritura parece exitosa sin red | Caché estática, error explícito y consulta del resultado incierto | R2 — QA-11 |
| Limpieza o pruebas MySQL sobre una base ajena | Protecciones de nombre/ambiente y fixtures restringidos | R1 — QA-02 |
| Rendimiento afectado por alojamiento variable | Medir recursos, calentamiento, muestra y límites del entorno | R3 — QA-24 |
| Sobrecarga de una persona o ampliación de alcance | Revisar puntos, WIP y cambio de alcance antes de empezar | Equipo — issue maestro |

## Gestión de cambios y cierre

Para ampliar el alcance, registrar motivo, resultado esperado, impacto en pruebas/dependencias, esfuerzo y decisión del equipo. Actualizar los dos README, matriz y backlog; no añadir matching, aplicaciones nativas o pagos reales de forma implícita.

La release requiere los casos P0/P1 aprobados, PWA Android demostrada, cuatro herramientas con reporte, integridad posterior a carga, ausencia de Sev1/Sev2 y manual/informe/guion reproducibles. Coordinar frontend/API, revisar PR hacia main, registrar versión y prueba posterior. Después cerrar issues/épicas, conservar riesgos residuales y hacer retrospectiva.

Este plan organiza trabajo pendiente; no certifica que se hayan implementado la PWA, las suites o el despliegue de QA.
