# Registro de incidencias — QA-28

## INC-QA28-01 — Acceso al backend privado

- Run ID: 45714927303.
- Job ID: 139558430384.
- Resultado: FAIL.
- Error: HTTP 403 durante checkout backend.

Causa identificada:
El token tenia seleccionado el repositorio frontend
y no disponia de permisos Contents sobre el backend.

Correccion:
Seleccionar recruitment-api-calidad-software y
conceder Contents Read-only.

Retest:
Job 139560686576.
Checkout backend: PASS.

Estado: corregida y verificada.

## INC-QA28-02 — Recorrido completo del candidato

- Run ID: 45714927303.
- Job ID: 139560686576.
- Suite: QA-19.
- Clase: CandidateBusinessTest.
- Metodo: recorridoCompletoCandidato.
- Duracion: 21.014 segundos.
- Resultado: error de ejecucion.

Resultados del pipeline:

- Node: 166/166.
- Build produccion: PASS.
- Build QA: PASS.
- Backend y MySQL: PASS.
- Selenium QA-18: 1/1.
- Selenium QA-19: 9/10.
- Selenium QA-20: 9/9.
- Total Selenium: 19/20.
- Limpieza del entorno: PASS.

Se incorporan marcadores de ejecucion y diagnosticos
controlados para identificar la causa exacta.

No se eliminan escenarios ni se reducen aserciones.

Estado: en investigacion.
