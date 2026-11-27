# Resultados de QA-09 - Frontend Kanban

## 1. Identificacion

- Tarea: QA-09.
- Issue: stephany-toribio/web-app-calidad-software#5.
- Epica: E02.
- Hito: M1.
- Responsable: stephany-toribio.
- Fecha: 2026-11-25.
- Rama: feature/QA-09-kanban-decisiones.
- Ambiente: WSL2, Angular y Node Test Runner.

## 2. Objetivo

Garantizar la consistencia de las decisiones
empresariales y la consulta del historial de
postulaciones.

## 3. Correcciones implementadas

- Centralizacion de movimientos de Kanban.
- Bloqueo de solicitudes duplicadas.
- Guardas de solo lectura.
- Validacion de pertenencia a la vacante.
- Control de respuestas desactualizadas del tablero.
- Aislamiento de respuestas de perfiles.
- Bloqueo de cierre durante operaciones pendientes.
- Reconciliacion ante conflictos.
- Seleccion explicita de motivo de rechazo.
- Validacion del motivo contra el catalogo.
- Gestion de suscripciones.
- Eliminacion de mensajeria simulada.

## 4. Historial empresarial

Se incorpora un panel conectado al endpoint:

GET /api/v1/empresas/me/vacantes/{vacante}/postulaciones/historial

El panel presenta:

- Numero de postulantes.
- Contrataciones y cupos disponibles.
- Estado actual y ultima etapa.
- Movimientos cronologicos.
- Motivos de rechazo.
- Fecha de retiro.
- Estados de carga, error y listado vacio.

Se incorporan interfaces TypeScript para reemplazar
el contrato generico Observable<any> del historial.

## 5. Evidencia RED-GREEN

| Ejecucion | Pruebas | Aprobadas | Fallidas |
| --- | ---: | ---: | ---: |
| RED | 16 | 4 | 12 |
| GREEN | 16 | 16 | 0 |
| Historial ampliado | 26 | 26 | 0 |
| Suite final QA-09 | 32 | 32 | 0 |

## 6. Regresion final

| Suite | Pruebas | Fallos |
| --- | ---: | ---: |
| QA-05 | 12 | 0 |
| QA-06 | 49 | 0 |
| QA-07 | 14 | 0 |
| QA-08 | 28 | 0 |
| QA-09 | 32 | 0 |
| Total | 135 | 0 |

## 7. Compilaciones

| Configuracion | Resultado | Duracion | Bundle inicial |
| --- | --- | ---: | ---: |
| TypeScript | PASS | No medida | No aplica |
| Angular estandar | PASS | 13.849 s | 366.39 kB |
| Angular QA | PASS | 15.275 s | 366.39 kB |
| Angular Android | PASS | 15.777 s | 366.41 kB |

## 8. Pruebas incorporadas

- tests/qa09/kanban.test.mjs: 22 pruebas.
- tests/qa09/historial.test.mjs: 10 pruebas.

Comando reproducible:

npm run test:qa09

## 9. Preparacion para automatizacion

Selectores estables:

- kanban-advance.
- kanban-confirm-reject.
- kanban-reject-reason.
- kanban-history.
- kanban-history-panel.
- kanban-close-history.
- history-application-{id}.
- history-movement-{id}.

## 10. Evidencias

- frontend/red/
- frontend/green/
- frontend/historial/
- frontend/complementarias/
- frontend/final/
- SHA256SUMS.txt

## 11. Limitaciones

Las pruebas auxiliares ejecutan metodos reales
con dependencias controladas.

No acreditan la ejecucion completa de Angular
en un navegador ni la interaccion real del DOM.

El arrastre real, accesibilidad, navegacion por
teclado y visualizacion del historial quedan
pendientes de validacion E2E.

La compilacion Android utiliza una URL HTTPS
ficticia y no acredita instalacion de APK.

## 12. Conclusion

Las 32 pruebas nuevas y las 103 anteriores
aprobaron sin fallos.

Las tres configuraciones Angular compilaron
satisfactoriamente.
