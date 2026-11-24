# Rúbrica de evaluación — Calidad de Software

## 1. Propósito

Establecer los criterios verificables para alcanzar el nivel
Excelente de la rúbrica del curso Calidad de Software en el
proyecto Portal de Empleos.

La calificación objetivo es 20/20. El cumplimiento se demostrará
mediante pruebas reales, reproducibles, automatizadas y trazables.

La existencia de código, documentación o Pull Requests integrados
no acredita por sí sola el cumplimiento de un criterio.

## 2. Fuente académica

La planificación se basa en la rúbrica proporcionada por el docente
y en el requerimiento de entregar un APK Android.

Los identificadores RUB definidos en este documento son controles
internos del equipo y no representan puntuaciones independientes
asignadas por el docente.

## 3. Alcance tecnológico

| Componente | Tecnología |
|---|---|
| Backend | Laravel 12 |
| Frontend | Angular 19 |
| Base de datos | MySQL |
| Entorno local | Docker Compose |
| Aplicación web | Angular y PWA |
| Aplicación móvil | Android híbrida con Capacitor |
| Artefacto móvil | APK instalable |
| Pruebas API | Karate DSL |
| Pruebas de rendimiento | Apache JMeter |
| Automatización web | Selenium |
| Automatización móvil | Appium y UiAutomator2 |
| Gestión técnica | GitHub Projects |
| Trazabilidad y defectos | Jira |
| Integración continua | GitHub Actions |

Se reutilizará el frontend Angular para generar el APK mediante
Capacitor, sin desarrollar una aplicación móvil independiente.

Se mantienen los dos repositorios existentes.

## 4. Criterios de evaluación

### 4.1. Pruebas de API — Karate DSL

Puntuación máxima: 4 puntos.

#### Nivel Excelente

Validaciones exhaustivas de esquemas JSON, códigos de estado
y tiempos de respuesta. Uso avanzado de variables dinámicas
y reutilización de llamadas mediante call.

#### Controles de cumplimiento

| ID | Verificación | Issue |
|---|---|---|
| RUB-K01 | Validación exhaustiva de esquemas JSON | QA-15, QA-16, QA-17 |
| RUB-K02 | Validación de códigos HTTP | QA-15, QA-16, QA-17 |
| RUB-K03 | Validación de tiempos de respuesta | QA-15, QA-16 |
| RUB-K04 | Variables dinámicas y parametrización | QA-14, QA-15, QA-16 |
| RUB-K05 | Reutilización mediante call | QA-14, QA-16 |

#### Criterios técnicos obligatorios

- Validar esquemas, tipos, campos obligatorios y errores.
- Validar códigos HTTP según el contrato real.
- Validar tiempos de respuesta con umbrales documentados.
- Implementar Scenario Outline y datos parametrizados.
- Generar datos únicos y variables dinámicas.
- Extraer tokens e identificadores de las respuestas.
- Reutilizar features y helpers mediante call.
- Automatizar escenarios positivos y negativos.
- Verificar persistencia e integridad de datos.
- Generar reportes reproducibles.

#### Evidencias requeridas

- Proyecto Karate versionado.
- Archivos feature.
- Runner y configuración por ambiente.
- Helpers reutilizables.
- Esquemas JSON.
- Datos ficticios.
- Reportes HTML.
- Resultados de ejecución.
- Vinculación con Jira.

### 4.2. Pruebas de rendimiento — Apache JMeter

Puntuación máxima: 4 puntos.

#### Nivel Excelente

Thread Groups configurados con escenarios realistas y listeners
adecuados. Incluye aserciones de tiempos, uso de CSV para
Data-Driven Testing y reporte HTML generado.

#### Controles de cumplimiento

| ID | Verificación | Issue |
|---|---|---|
| RUB-J01 | Thread Groups realistas | QA-24 |
| RUB-J02 | Listeners adecuados | QA-24, QA-25 |
| RUB-J03 | Aserciones de respuesta y duración | QA-25 |
| RUB-J04 | CSV Data-Driven Testing | QA-24 |
| RUB-J05 | Reporte HTML generado | QA-25 |

#### Criterios técnicos obligatorios

- Configurar Thread Groups por escenario.
- Definir usuarios virtuales, ramp-up y duración.
- Utilizar escenarios de carga realistas.
- Implementar CSV Data Set Config.
- Utilizar HTTP Request Defaults.
- Utilizar HTTP Header Manager.
- Extraer tokens e identificadores dinámicos.
- Implementar Response Assertion.
- Implementar Duration Assertion.
- Configurar listeners adecuados.
- Incorporar timers cuando corresponda.
- Ejecutar pruebas en modo no gráfico.
- Generar archivos JTL y reportes HTML.
- Analizar percentiles, throughput y errores.
- Verificar integridad de datos después de la carga.

Las pruebas de carga se realizarán exclusivamente sobre
un entorno QA autorizado y aislado.

#### Escenarios previstos

- Autenticación concurrente.
- Búsqueda y consulta de vacantes.
- Postulaciones concurrentes.
- Prevención de postulaciones duplicadas.
- Contrataciones concurrentes con cupos limitados.

#### Evidencias requeridas

- Archivos JMX.
- Archivos CSV con datos ficticios.
- Configuración de carga.
- Resultados JTL.
- Dashboard HTML.
- Análisis de resultados.
- Evidencia de integridad posterior.
- Vinculación con Jira.

### 4.3. Automatización web — Selenium

Puntuación máxima: 4 puntos.

#### Nivel Excelente

Selectores robustos que eviten XPath absolutos.
Implementación de esperas explícitas o fluidas.
Cobertura exitosa de flujos críticos end-to-end.

#### Controles de cumplimiento

| ID | Verificación | Issue |
|---|---|---|
| RUB-S01 | Selectores robustos | QA-12, QA-18 |
| RUB-S02 | Evitar XPath absolutos | QA-18 |
| RUB-S03 | Esperas explícitas o fluidas | QA-18 |
| RUB-S04 | Flujos end-to-end exitosos | QA-19, QA-20 |

#### Criterios técnicos obligatorios

- Implementar Page Object Model.
- Utilizar selectores por ID, CSS o atributos estables.
- Incorporar atributos data-testid cuando corresponda.
- Evitar XPath absolutos.
- Utilizar WebDriverWait y condiciones explícitas.
- Utilizar FluentWait cuando el escenario lo requiera.
- Evitar pausas estáticas como mecanismo de sincronización.
- Automatizar recorridos funcionales completos.
- Ejecutar escenarios repetidamente para detectar inestabilidad.
- Capturar evidencias ante fallos.
- Generar reportes de ejecución.

#### Flujos críticos

- Registro e inicio de sesión.
- Registro y aprobación de vacantes.
- Pago simulado.
- Búsqueda y detalle de vacantes.
- Postulación de candidatos.
- Revisión de postulaciones.
- Entrevista y contratación.
- Rechazo con motivo.
- Seguimiento e historial.
- Cierre de sesión.

#### Evidencias requeridas

- Proyecto Selenium versionado.
- Page Objects.
- Configuración de navegador.
- Scripts de prueba.
- Reportes de ejecución.
- Capturas de pantalla.
- Evidencia de persistencia.
- Vinculación con Jira.

### 4.4. Automatización móvil — Appium

Puntuación máxima: 4 puntos.

#### Nivel Excelente

Configuración correcta de Capabilities.
Interacción fluida con elementos nativos mediante swipe y tap.
Flujo funcional end-to-end validado.

#### Requerimiento adicional del docente

Entregar una aplicación Android mediante un APK instalable.

#### Controles de cumplimiento

| ID | Verificación | Issue |
|---|---|---|
| RUB-A01 | Capabilities correctas | QA-21 |
| RUB-A02 | Dispositivo Android operativo | QA-21 |
| RUB-A03 | APK instalable | QA-10, QA-21 |
| RUB-A04 | Interacciones nativas swipe y tap | QA-22 |
| RUB-A05 | Sincronización estable | QA-21, QA-23 |
| RUB-A06 | Flujo end-to-end | QA-22 |

#### Arquitectura móvil

Se utilizará Capacitor para empaquetar el frontend Angular
existente como una aplicación Android híbrida.

El APK consumirá la misma API Laravel del entorno QA.

La aplicación web PWA y el APK compartirán la lógica funcional,
pero tendrán mecanismos diferenciados de instalación,
actualización y recuperación.

#### Criterios técnicos obligatorios

- Configurar Capacitor con versiones compatibles.
- Generar el proyecto Android.
- Configurar Android SDK y herramientas de compilación.
- Generar un APK instalable.
- Instalar el APK en un emulador o dispositivo físico.
- Configurar Appium y UiAutomator2.
- Versionar las capabilities.
- Identificar los contextos NATIVE_APP y WebView disponibles.
- Implementar esperas para sincronizar los elementos.
- Ejecutar gestos táctiles swipe y tap.
- Demostrar interacción con elementos realmente nativos.
- Incorporar una interacción nativa funcional.
- Automatizar un flujo end-to-end completo.
- Verificar persistencia de los resultados en la API.
- Validar pérdida y recuperación de conexión.
- Generar reportes y evidencias de ejecución.

La generación de un APK no implica automáticamente que
los componentes HTML se conviertan en controles nativos.

Se deberá demostrar la interacción nativa real, por ejemplo,
mediante un diálogo de confirmación y otros controles o gestos
verificables en el contexto NATIVE_APP.

Los gestos sobre HTML en WebView no sustituyen la demostración de swipe y tap sobre elementos realmente nativos en NATIVE_APP.

#### Flujo móvil mínimo

1. Instalar el APK.
2. Abrir la aplicación.
3. Iniciar sesión como candidato.
4. Buscar vacantes.
5. Desplazarse mediante swipe.
6. Seleccionar una vacante mediante tap.
7. Consultar el detalle.
8. Iniciar una postulación.
9. Interactuar con la confirmación nativa.
10. Verificar la postulación registrada.
11. Consultar Mis postulaciones.
12. Cerrar sesión.

#### Evidencias requeridas

- Configuración Capacitor.
- Proyecto Android versionado.
- APK identificado por versión.
- Configuración Appium.
- Capabilities.
- Scripts de automatización.
- Capturas de ejecución.
- Evidencia de interacciones nativas.
- Reporte del flujo end-to-end.
- Verificación de persistencia.
- Vinculación con Jira.

### 4.5. Trazabilidad y reportes — Jira

Puntuación máxima: 4 puntos.

#### Nivel Excelente

Evidencia completa y vinculación documentada de los casos
de prueba automatizados con tickets en Jira o Azure Boards.

#### Decisión del proyecto

Se utilizará Jira como herramienta obligatoria para la
trazabilidad académica de pruebas y gestión de defectos.

GitHub Projects conservará la gestión técnica del desarrollo.

#### Controles de cumplimiento

| ID | Verificación | Issue |
|---|---|---|
| RUB-T01 | Tickets reales en Jira | QA-04, QA-29 |
| RUB-T02 | Casos automatizados vinculados | QA-29 |
| RUB-T03 | Reportes y evidencias completas | QA-29, QA-31 |
| RUB-T04 | Defectos y retests trazables | QA-29, QA-30 |

#### Criterios técnicos obligatorios

- Configurar un proyecto Jira.
- Registrar historias o requisitos relacionados.
- Registrar identificadores de casos de prueba.
- Vincular los casos automatizados con tickets reales.
- Relacionar tickets Jira e issues GitHub.
- Registrar scripts, commits y versiones.
- Adjuntar o enlazar reportes de ejecución.
- Registrar defectos con severidad y prioridad.
- Documentar pasos de reproducción.
- Registrar resultados esperados y obtenidos.
- Vincular correcciones mediante Pull Requests.
- Registrar retest y regresión.
- Mantener estados coherentes entre las plataformas.

#### Cadena de trazabilidad

Requisito -> Ticket Jira -> Caso de prueba -> Script
-> Ejecución -> Reporte -> Defecto -> Corrección -> Retest.

Cuando una ejecución no genere un defecto, se registrará
su resultado sin crear artificialmente una incidencia.

#### Evidencias requeridas

- Proyecto Jira.
- Tickets reales.
- Matriz de trazabilidad.
- Enlaces a scripts.
- Reportes de Karate.
- Reportes de JMeter.
- Reportes de Selenium.
- Reportes de Appium.
- Registro de defectos.
- Evidencias de retest y regresión.

## 5. Matriz general de cumplimiento

| Criterio | Puntuación máxima | Estado inicial |
|---|---:|---|
| Karate DSL | 4 | Planificado |
| Apache JMeter | 4 | Planificado |
| Selenium | 4 | Planificado |
| Appium | 4 | Planificado |
| Jira y reportes | 4 | Planificado |
| Total objetivo | 20 | Pendiente de evaluación |

Los estados iniciales corresponden a la planificación de
esta actualización documental y no a pruebas aprobadas.

## 6. Estados de verificación

| Estado | Definición |
|---|---|
| PLANIFICADO | Verificación definida, sin ejecución |
| EN IMPLEMENTACIÓN | Verificación en desarrollo |
| NO EJECUTADO | Implementada, pero sin resultados |
| PASS | Resultado esperado demostrado |
| FAIL | Resultado diferente del esperado |
| BLOCKED | Ejecución impedida por un bloqueo documentado |

No se registrarán resultados PASS sin evidencia real.

## 7. Información mínima de cada ejecución

Cada evidencia deberá registrar:

- Identificador del requisito.
- Identificador del caso de prueba.
- Identificador RUB aplicable.
- Ticket Jira.
- Issue GitHub.
- Herramienta y versión.
- Commit o build probado.
- Ambiente.
- Configuración.
- Precondiciones.
- Datos de prueba.
- Resultado esperado.
- Resultado obtenido.
- Estado de ejecución.
- Fecha.
- Responsable.
- Enlace al reporte.
- Defecto y retest cuando corresponda.

No almacenar contraseñas, tokens, credenciales ni datos
personales reales en los reportes o repositorios.

## 8. Definition of Done

Una tarea podrá considerarse completada cuando:

- Cumpla sus criterios de aceptación.
- Cumpla los controles RUB que le correspondan.
- Existan pruebas y evidencias apropiadas.
- Los resultados estén documentados correctamente.
- La trazabilidad esté registrada cuando corresponda.
- Los riesgos y defectos pendientes estén identificados.
- Otro integrante haya revisado el entregable.
- El Pull Request esté integrado cuando corresponda.
- El issue y el estado del Project sean coherentes.

No se cerrará una tarea únicamente por tener código
implementado o un Pull Request integrado.

## 9. Entregables finales

- Backend Laravel operativo.
- Frontend Angular operativo.
- PWA instalable.
- APK Android instalable.
- Suite Karate DSL.
- Reportes Karate.
- Planes JMX de JMeter.
- Datos CSV.
- Resultados JTL.
- Dashboard HTML.
- Suite Selenium.
- Reportes Selenium.
- Suite Appium.
- Reportes Appium.
- Proyecto Jira con trazabilidad.
- Matriz de requisitos y casos.
- Matriz de cumplimiento de la rúbrica.
- Registro de riesgos.
- Registro de defectos y retests.
- Pipelines de integración continua.
- Manual de instalación y pruebas.
- Informe final.
- Guion de demostración.
- Release coordinada.

## 10. Restricciones del proyecto

Se conserva el alcance funcional del Portal de Empleos.

No se incorporarán:

- Matching mediante inteligencia artificial.
- Servicios Python adicionales.
- Pasarelas bancarias reales.
- Aplicaciones móviles con frontend independiente.
- Publicación obligatoria en tiendas de aplicaciones.
- Soporte específico para iOS.
- Escrituras funcionales sin conexión.

## 11. Conservación del trabajo existente

Se conservará la infraestructura de QA-02:

- Docker independiente.
- Bases de datos aisladas.
- Configuración PHPUnit.
- Fixtures reproducibles.
- Catálogos inicializados.
- Limpieza controlada.
- Evidencias registradas.

La línea base obtenida en QA-02 comprende 564 pruebas,
546 aprobadas y 18 fallidas.

Los 18 hallazgos se mantienen documentados para su
investigación y corrección en QA-07.

Se conservarán también los documentos de QA-04:

- docs/qa/MATRIZ_TRAZABILIDAD.md
- docs/qa/CATALOGO_CASOS_PRUEBA.md
- docs/qa/CATALOGO_DATOS_PRUEBA.md
- docs/qa/REGISTRO_RIESGOS.md

Estos documentos deberán ampliarse para incorporar
la trazabilidad con la rúbrica, Jira y el APK Android.

## 12. Control de cambios

Esta actualización amplía la planificación original de QA-01.

Se mantienen los identificadores de issues, requisitos,
casos de prueba y épicas existentes.

Los nuevos criterios se incorporarán a los issues
correspondientes, evitando duplicar tareas.

Las estimaciones y dependencias deberán revisarse
considerando el esfuerzo adicional del APK.

El cumplimiento final de la rúbrica solo podrá acreditarse
mediante las evidencias reales de ejecución y la evaluación
del docente.
