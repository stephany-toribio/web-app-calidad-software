# Registro de incidencias QA-19

## INC-QA19-01 — Contrato de registro empresarial

- Tipo: defecto del preparador de fixtures.
- Error: KeyError usuario_id.
- Causa: diferencia entre los contratos de registro
  de candidato y empresa.
- Corrección: procesamiento diferenciado por tipo de usuario.
- Retest: PASS.
- Limpieza de fixtures: PASS.
- Registros residuales: 0.

## INC-QA19-02 — Referencia obsoleta de Selenium

- Tipo: defecto de sincronización de automatización.
- Excepción: StaleElementReferenceException.
- Componente: CandidateJobsPage.
- Escenario: recorridoCompletoCandidato.
- Reproducibilidad: dos ejecuciones consecutivas.
- Causa probable: actualización dinámica del DOM de Angular.
- Corrección: espera fluida con relocalización de elementos,
  sondeo de 200 ms y tratamiento específico de referencias
  obsoletas.
- No se utilizan pausas estáticas.
- Retest: PASS. Recorrido E2E completo aprobado.
- Limpieza de fixtures: PASS en ambas ejecuciones.

## INC-QA19-03 — Acordeón de postulaciones

- Tipo: defecto del recorrido automatizado.
- Excepción: TimeoutException.
- Componente: CandidateApplicationsPage.
- Causa: el botón de retiro solo se renderiza
  cuando se despliega la postulación.
- Corrección: localizar la postulación por su título
  y desplegar el acordeón antes de retirar.
- Verificación adicional: volver a desplegar después
  de recargar para comprobar la persistencia.
- Retest: PASS. Ejecución E2E aprobada en 14.80 segundos.
- Limpieza de fixtures: PASS.

## Resultado de los retests

- Run ID: 469f25b8-5ae9-4e19-b32a-ee2da085f791.
- Escenarios: 1.
- Aprobados: 1.
- Fallos: 0.
- Errores: 0.
- Omitidos: 0.
- Duración: 14.80 segundos.
- Usuarios eliminados: 5.
- Registros residuales: 0.
