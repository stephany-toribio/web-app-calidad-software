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
