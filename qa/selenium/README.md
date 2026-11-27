# Selenium — CREO+

## Tecnologías

- Java 21.
- Maven.
- Selenium 4.29.0.
- JUnit 5.11.4.
- Chrome y ChromeDriver 134.0.6998.35.
- Docker Compose.
- Angular QA servido mediante Nginx.

## Preparación

Desde la raíz del repositorio:

    npm ci
    npm run build:qa
    docker compose -f qa/selenium/compose.yaml up -d

La API Laravel y MySQL QA deben estar operativos.

## Servicios

- Frontend: http://127.0.0.1:4202
- WebDriver: http://127.0.0.1:4444
- Selenium Grid: http://127.0.0.1:4444/ui/
- Visualización del navegador: http://127.0.0.1:7900

## Ejecución

    qa/selenium/scripts/run.sh smoke
    qa/selenium/scripts/run.sh full

El modo demo se habilitará con las pruebas funcionales.

Diagnóstico de fallo intencional:

    qa/selenium/scripts/run.sh diagnostic

El diagnóstico debe finalizar con código distinto de cero.

## Arquitectura

- BaseTest: sesiones independientes de navegador.
- BasePage: operaciones y esperas explícitas.
- LoginPage: autenticación mediante la interfaz.
- FailureEvidence: captura automática de fallos.
- tests: escenarios JUnit.

No se utilizan XPath absolutos ni pausas fijas
como mecanismo principal de sincronización.

## Evidencias

- Reportes JUnit: target/surefire-reports/.
- Capturas: target/qa-evidence/.
- Evidencias versionadas: docs/evidencias/QA-18/.

Las credenciales no se versionan.
Revisar las capturas autenticadas antes de publicarlas.

## Detener servicios

    docker compose -f qa/selenium/compose.yaml down

Este comando no elimina los servicios de la API QA.

## QA-19 — Automatización funcional del candidato

La suite implementa diez escenarios funcionales mediante
Selenium WebDriver y JUnit 5, organizados con Page Objects.

### Ejecución completa

Desde la raíz del repositorio:

    qa/selenium/scripts/run-qa19.sh full

### Demostración en vivo

    qa/selenium/scripts/run-qa19.sh demo

La demostración ejecuta dos escenarios reales:

1. Autenticación válida del candidato.
2. Recorrido completo de búsqueda, postulación y retiro,
   con comprobaciones de persistencia en MySQL.

### Visualización del navegador

Abrir en el navegador del equipo anfitrión:

    http://127.0.0.1:7900

### Ejecución selectiva

    QA19_TESTS='CandidateBusinessTest#recorridoCompletoCandidato' \
        qa/selenium/scripts/run-qa19.sh

### Gestión de datos

Cada ejecución utiliza un UUID, candidatos sintéticos,
una empresa, un administrador y una vacante publicada
mediante pago simulado.

El runner reutiliza los fixtures protegidos de QA-15,
QA-16 y QA-17 del repositorio backend.

Por defecto, el backend debe estar disponible en:

    ~/projects/recruitment-api-calidad-software

La ruta puede configurarse mediante QA_BACKEND_DIR.

Las credenciales se generan temporalmente y no deben
versionarse. La limpieza se ejecuta automáticamente
al finalizar, incluso ante errores.

Ejecutar las suites de manera coordinada para evitar que
otros procesos modifiquen los fixtures de una corrida.

### Documentación y evidencias

- [Casos de prueba](../../docs/evidencias/QA-19/CASOS_DE_PRUEBA.md)
- [Resultados](../../docs/evidencias/QA-19/RESULTADOS.md)
- [Incidencias](../../docs/evidencias/QA-19/INCIDENCIAS.md)

## QA-20 — Empresa y administrador

Suite de autenticacion, autorizacion, moderacion,
pago simulado, Kanban, historial y limite de contrataciones.

### Regresion completa

    qa/selenium/scripts/run-qa20.sh full

Ejecuta nueve escenarios funcionales.

### Demostracion en vivo

    qa/selenium/scripts/run-qa20.sh demo

Ejecuta tres escenarios del conjunto completo:

- Aprobacion administrativa.
- Pago simulado y publicacion.
- Contratacion y rechazo empresarial.

### Precondiciones

- Backend QA: puerto 8002.
- Frontend QA: puerto 4202.
- Selenium Grid: puerto 4444.
- Java 21, Maven y Python 3.
- Catalogos y build QA disponibles.

### Gestion de datos

Fixtures sinteticos por UUID, preflight,
validaciones API/MySQL y limpieza automatica.

No se utilizan cuentas personales ni pagos reales.

### Documentacion

- [Casos de prueba](../../docs/evidencias/QA-20/CASOS_DE_PRUEBA.md)
- [Resultados](../../docs/evidencias/QA-20/RESULTADOS.md)
- [Incidencias](../../docs/evidencias/QA-20/INCIDENCIAS.md)
- [Resumen JSON](../../docs/evidencias/QA-20/resumen-resultados.json)

Resultado: dos FULL de 9/9 y dos DEMO de 3/3.
