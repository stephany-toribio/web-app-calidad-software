# Resultados de pruebas — QA-28

## Objetivo

Verificar la integracion continua del frontend
mediante GitHub Actions, Angular y Selenium.

## Ejecucion verificada

- Fecha: 25 de noviembre de 2026.
- Run ID: 45719731928.
- Job ID: 139574725786.
- Pull Request: #31.
- Modo: FULL.
- Resultado: SUCCESS.

## Versiones

Commit de la rama frontend:
4630cbea8beacebd9246ef9becb2a65f27912959.

Backend de referencia:
b6d13b5e909222b3a10ad5c725f24a044288a6d3.

Los commits efectivos del checkout se registran
en los artefactos de trazabilidad.

## Resultados Node

| Suite | Ejecutadas | Aprobadas |
|---|---:|---:|
| QA-05 | 12 | 12 |
| QA-06 | 49 | 49 |
| QA-07 | 14 | 14 |
| QA-08 | 28 | 28 |
| QA-09 | 32 | 32 |
| QA-11 | 24 | 24 |
| QA-12 | 12 | 12 |
| Total | 171 | 171 |

## Resultados Selenium

| Suite | Ejecutadas | Aprobadas |
|---|---:|---:|
| QA-18 | 1 | 1 |
| QA-19 | 10 | 10 |
| QA-20 | 9 | 9 |
| Total | 20 | 20 |

Total combinado: 191/191 ejecuciones aprobadas.

Este total corresponde a pruebas automatizadas
de distintos niveles, no a requisitos funcionales
unicos.

## Infraestructura

- Checkout de repositorios privados: PASS.
- Instalacion npm ci: PASS.
- Compilacion produccion: PASS.
- Compilacion QA: PASS.
- Laravel y MySQL: PASS.
- Selenium Grid: PASS.
- Limpieza de fixtures: PASS.
- Escaneo de credenciales: PASS.
- Limpieza Docker: PASS.

## Artefactos

- Reportes QA: 15071697576.
- Build Angular QA: 15072431249.
- Reportes JUnit sanitizados.
- Resumen JSON.
- Trazabilidad de commits.
- Manifiesto SHA256 del build.

## Incidencias

INC-QA28-01:
Acceso al backend privado corregido.

INC-QA28-02:
Incompatibilidad entre interceptor PWA y
validacion estricta de Laravel corregida.

El retest local y la regresion remota aprobaron.

## Limitaciones

La ejecucion FULL esta verificada.

La ejecucion consolidada DEMO requiere ensayo
adicional para la presentacion en vivo.

Las capturas autenticadas de fallos no se
conservan como artefactos remotos permanentes.

La compatibilidad efectiva del APK se verifica
mediante las actividades Appium correspondientes.

## Conclusion

La compilacion integrada y la regresion web
automatizada aprobaron satisfactoriamente.

No se eliminaron escenarios ni se redujeron
aserciones para obtener este resultado.


## Trazabilidad de integracion

| Referencia | Commit |
|---|---|
| Rama de implementacion | 4630cbea8beacebd9246ef9becb2a65f27912959 |
| Checkout efectivo probado en CI | d62784517161b2ddf601188e7220db09bad49c67 |
| Integracion en develop mediante PR #31 | bca1868471ac33177d9966d3b6b403c332917c93 |

La auditoria posterior verifico:

- Integridad SHA256 de los 71 archivos del build Angular.
- Nueve reportes JUnit.
- Veinte escenarios Selenium aprobados.
- Ausencia de fallos, errores y omisiones.
- Sanitizacion de reportes XML.
- Escaneo textual de credenciales.
- Limpieza de fixtures.
