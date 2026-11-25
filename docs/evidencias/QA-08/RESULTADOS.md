# Resultados de QA-08 - Frontend

## 1. Identificacion

- Tarea: QA-08.
- Issue: stephany-toribio/recruitment-api-calidad-software#16.
- Epica: E02.
- Hito: M1.
- Responsable: stephany-toribio.
- Fecha: 2026-11-25.
- Rama: feature/QA-08-postulaciones-retiro.
- Ambiente: WSL2, Angular y Node Test Runner.

## 2. Objetivo

Garantizar la consistencia de los flujos de postulacion,
retiro, seguimiento y consulta de vacantes historicas.

## 3. Correcciones implementadas

### Postulacion

- Bloqueo del modal durante solicitudes pendientes.
- Revalidacion de elegibilidad antes de confirmar.
- Prevencion de solicitudes duplicadas.
- Restriccion de postulacion en modo historico.
- Manejo de conflictos y vacantes no disponibles.
- Proteccion frente a respuestas de detalles anteriores.
- Gestion de suscripciones vinculada al componente.
- Mensajes prudentes ante errores de conexion.

### Retiro y seguimiento

- Bloqueo de confirmaciones duplicadas.
- Validacion de pertenencia al listado local.
- Revalidacion de puede_retirar.
- Conservacion de la etapa devuelta por la API.
- Actualizacion exclusiva de la postulacion objetivo.
- Invalidacion de consultas anteriores.
- Reconciliacion del estado ante conflictos.
- Conservacion del listado ante fallos de refresco.

### Preparacion para automatizacion

- data-testid="confirm-apply".
- data-testid="confirm-withdraw".
- Estados disabled asociados al procesamiento.

## 4. Evidencia RED-GREEN

| Ejecucion | Pruebas | Aprobadas | Fallidas |
| --- | ---: | ---: | ---: |
| RED | 12 | 4 | 8 |
| GREEN | 12 | 12 | 0 |
| Suite ampliada | 28 | 28 | 0 |

Los ocho fallos iniciales fueron reproducidos antes
de aplicar las correcciones y superaron el retest.

## 5. Regresion final

| Suite | Pruebas | Fallos |
| --- | ---: | ---: |
| QA-05 | 12 | 0 |
| QA-06 | 49 | 0 |
| QA-07 | 14 | 0 |
| QA-08 | 28 | 0 |
| Total | 103 | 0 |

## 6. Compilaciones

| Configuracion | Resultado | Duracion | Bundle inicial |
| --- | --- | ---: | ---: |
| TypeScript | PASS | No medida | No aplica |
| Angular estandar | PASS | 16.908 s | 366.16 kB |
| Angular QA | PASS | 15.280 s | 366.16 kB |
| Angular Android | PASS | 15.175 s | 366.19 kB |

## 7. Pruebas

- tests/qa08/postulaciones.test.mjs: 20 casos.
- tests/qa08/seguimiento.test.mjs: 8 casos.

Comando reproducible:

npm run test:qa08

Se reutiliza el harness de QA-06 para ejecutar
metodos reales con dependencias controladas.

## 8. Trazabilidad

Familias CP-12, CP-13, CP-14, CP-20 y CP-21.

## 9. Evidencias

- frontend/red/
- frontend/green/
- frontend/complementarias/
- frontend/final/
- SHA256SUMS.txt

## 10. Limitaciones y riesgos residuales

Las pruebas auxiliares no ejecutan el componente
Angular completo en un navegador.

La navegacion y las interacciones visuales deben
verificarse mediante Selenium.

Las interrupciones de red pueden dejar operaciones
confirmadas por el servidor sin respuesta al cliente.
Debe consultarse el estado antes de reintentar.

La navegacion fuera de una vacante y el retorno
mientras una solicitud sigue pendiente requiere
validacion E2E complementaria.

El build Android utiliza una URL HTTPS ficticia.
No acredita instalacion ni funcionamiento de APK.

## 11. Conclusion

Las 28 pruebas nuevas y las 75 pruebas anteriores
aprobaron sin fallos.

Las tres configuraciones Angular compilaron
correctamente.
