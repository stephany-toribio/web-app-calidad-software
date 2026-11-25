# Integracion continua frontend — QA-28

## Objetivo

Automatizar la compilacion Angular y la regresion
Selenium del Portal de Empleos CREO+.

## Infraestructura

- GitHub Actions Ubuntu 24.04.
- Node.js 22.22.1.
- Angular 19.
- Java 21 y Maven.
- Selenium Grid 4.29.0.
- Nginx.
- Laravel 12 y MySQL 8.

## Backend de referencia

Repositorio recruitment-api-calidad-software.

Commit:
b6d13b5e909222b3a10ad5c725f24a044288a6d3

Se reutiliza el bootstrap de QA-27.

El acceso al repositorio privado se realiza mediante
el secreto QA_BACKEND_READ_TOKEN, con permisos
exclusivos de lectura.

## Ejecucion

El workflow se activa mediante pull requests,
pushes a develop y main, o ejecucion manual.

## Suites Selenium

| Suite | FULL | DEMO |
|---|---:|---:|
| QA-18 | 1 | 1 |
| QA-19 | 10 | 2 |
| QA-20 | 9 | 3 |
| Total | 20 | 6 |

## Ejecucion local equivalente

Con el backend, frontend y Selenium Grid preparados:

    qa/ci/run-selenium.sh full

    qa/ci/run-selenium.sh demo

## Evidencias

- Commit frontend.
- Commit backend.
- Reportes JUnit sanitizados.
- Resumen JSON por suite.
- Resumen consolidado Selenium.
- Captura smoke sin autenticacion.
- Artefacto Angular QA.
- Manifiesto SHA256 del build QA.

Las capturas autenticadas se conservan inicialmente
para revision privada durante la ejecucion.
No se publican automaticamente.

## Criterio de aprobacion

Todas las suites deben aprobar, sin omisiones,
errores ni fallos.

La publicacion del artefacto Angular requiere
la aprobacion de las etapas anteriores.

## Delimitaciones

La integracion continua complementa la demostracion
en vivo. No sustituye Appium, JMeter ni Jira.

## Estado

Implementacion inicial.
Ejecucion remota pendiente de verificacion.
