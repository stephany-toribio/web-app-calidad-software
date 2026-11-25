# QA-18 — Infraestructura Selenium

Fecha: 25 de noviembre de 2026.
Issue: #9.

## Objetivo

Preparar un entorno reproducible de automatización
web mediante Selenium y Chrome real.

## Resultados

| Verificación | Resultado |
| --- | --- |
| Compilación Angular QA | PASS |
| Frontend HTTP 200 | PASS |
| Proxy API HTTP 401 sin token | PASS |
| Disponibilidad Selenium Grid | PASS |
| Smoke inicial | 1/1 PASS - 6.569 s |
| Smoke repetido | 1/1 PASS - 3.031 s |
| Regresión final | 1/1 PASS - 2.804 s |
| Captura de fallo controlado | PASS |
| Exclusión de fallo controlado en full | PASS |
| Compilación LoginPage | PASS |

## Versiones

- Selenium: 4.29.0.
- Chrome: 134.0.6998.35.
- ChromeDriver: 134.0.6998.35.
- Java: 21.
- JUnit: 5.11.4.

## Criterios técnicos

- Runner reproducible.
- Page Object Model.
- Selectores CSS.
- Esperas explícitas.
- Capturas automáticas ante errores de prueba.
- Reportes JUnit.
- Credenciales separadas del código.

## Evidencias

- smoke-01.txt
- regresion.txt
- smoke-frontend.png
- TEST-creo.tests.SmokeTest.xml
- fallo-controlado/

El fallo controlado es intencional y verifica
el mecanismo de diagnóstico.

## Limitaciones

La infraestructura está operativa.
La autenticación y los flujos funcionales E2E
se verificarán en QA-19 y QA-20.

El modo demo funcional todavía está pendiente.
Las credenciales se configurarán mediante fixtures
aislados del backend.

La primera ejecución smoke fue repetida y su log
original fue reemplazado por el segundo.
