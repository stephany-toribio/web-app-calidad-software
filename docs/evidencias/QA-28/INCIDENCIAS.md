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

Estado: corregida y verificada en local y CI.


### Causa raiz confirmada — INC-QA28-02

El interceptor apiNetworkInterceptor de QA-11 agregaba
ngsw-bypass=true como parametro de consulta a todas
las solicitudes API.

PostularVacanteRequest de Laravel valida estrictamente
los campos de entrada y solo admite vacante_id.

La combinacion de ambos componentes provocaba HTTP 422.

### Prueba diferencial

| Solicitud | HTTP | Resultado |
|---|---:|---|
| POST original sin bypass | 201 | PASS |
| POST con ngsw-bypass en URL | 422 | VALIDATION_ERROR |
| POST con ngsw-bypass como cabecera | 201 | PASS |

El campo rechazado fue ngsw-bypass.

La limpieza automatica confirmo cero fixtures residuales.

### Correccion implementada

- Sustituir el parametro de consulta por una cabecera
  en solicitudes API del mismo origen.
- No introducir nuevas cabeceras en solicitudes
  dirigidas a API de origen externo.
- Conservar las restricciones del backend.
- Mantener el bloqueo de operaciones offline.
- Incorporar pruebas de regresion del contrato HTTP.
- Incorporar selectores estables y diagnosticos Selenium.

### Retest

Retest local: PASS.

- Run ID: 732833d7-79d1-4be8-9ca8-74623a488228.
- Regresion QA-11: 24/24.
- Selenium recorridoCompletoCandidato: 1/1.
- Duracion Selenium: 26.63 segundos.
- Fallos, errores y omisiones: 0.
- Escaneo de credenciales: PASS.
- Fixtures eliminados: 5.
- Fixtures restantes: 0.

Pendiente: regresion completa en GitHub Actions
y verificacion del APK mediante Appium.


### Retest remoto definitivo

- Run ID: 45719731928.
- Job ID: 139574725786.
- Resultado: SUCCESS.
- Node: 171/171.
- Selenium: 20/20.
- QA-19: 10/10.
- Limpieza y escaneo: PASS.

INC-QA28-02: cerrada para el entorno web.

La validacion Android se mantiene como actividad
de regresion movil independiente.
