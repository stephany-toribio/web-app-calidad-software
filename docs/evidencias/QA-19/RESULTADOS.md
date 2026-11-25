# QA-19 — Resultados de automatización Selenium

Fecha: 25 de noviembre de 2026.

## Objetivo

Validar el recorrido funcional web del candidato.

## Resultados finales

| Ejecución | Pruebas | Fallos | Errores | Omitidas | Tiempo de suites (s) | Residuos | Resultado |
|---|---:|---:|---:|---:|---:|---:|---|
| full-01 | 10 | 0 | 0 | 0 | 61.834 | 0 | PASS |
| full-02 | 10 | 0 | 0 | 0 | 67.317 | 0 | PASS |
| demo-01 | 2 | 0 | 0 | 0 | 27.834 | 0 | PASS |
| demo-02 | 2 | 0 | 0 | 0 | 26.912 | 0 | PASS |

## Conclusiones

- Diez escenarios funcionales distintos aprobados.
- Dos regresiones completas consecutivas aprobadas.
- Dos demostraciones consecutivas aprobadas.
- Veinticuatro ejecuciones de casos aprobadas.
- Sin fallos, errores ni pruebas omitidas.
- Persistencia verificada directamente en MySQL.
- Limpieza automática sin residuos.
- Escaneo automatizado de credenciales aprobado.

## Incidencias

Consultar [INCIDENCIAS.md](INCIDENCIAS.md).

## Casos de prueba

Consultar [CASOS_DE_PRUEBA.md](CASOS_DE_PRUEBA.md).

## Evidencias

Los reportes XML, capturas PNG y comprobaciones JSON
se encuentran en el directorio reportes/.

## Limitaciones

Los tiempos corresponden a las suites de prueba,
no al tiempo total del runner incluyendo preparación
y limpieza de fixtures.

El registro positivo completo mediante interfaz y
la concurrencia del envío final no fueron evaluados
por esta suite.

Las pruebas de empresa y administrador corresponden
a QA-20.
