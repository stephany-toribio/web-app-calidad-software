# Casos de prueba Selenium — QA-20

## Identificacion

- Proyecto: Portal de Empleos CREO+.
- Actividad: QA-20.
- Issue: #11 del repositorio frontend.
- Herramienta: Selenium WebDriver 4.29.0.
- Framework: JUnit 5.
- Entorno: Angular QA, Chrome Grid, Laravel y MySQL.
- Fecha: 25 de noviembre de 2026.
- Escenarios distintos: 9.

## Catalogo ejecutado

| ID | Clase | Metodo automatizado | Resultado |
|---|---|---|---|
| SEL-QA20-01 | AdminModerationTest | `rechazarVacanteConMotivoObligatorio` | PASS |
| SEL-QA20-02 | AdminModerationTest | `aprobarVacanteSinPublicacionAutomatica` | PASS |
| SEL-QA20-03 | CompanyAdminAuthTest | `loginEmpresaValido` | PASS |
| SEL-QA20-04 | CompanyAdminAuthTest | `adminNoAccedePerfilCandidato` | PASS |
| SEL-QA20-05 | CompanyAdminAuthTest | `loginAdminValido` | PASS |
| SEL-QA20-06 | CompanyAdminAuthTest | `empresaNoAccedeAdministracion` | PASS |
| SEL-QA20-07 | CompanyConflictTest | `impedirContratacionPorCupoAgotado` | PASS |
| SEL-QA20-08 | CompanyKanbanTest | `gestionarContratacionYRechazo` | PASS |
| SEL-QA20-09 | CompanyPaymentTest | `pagoSimuladoPublicaVacante` | PASS |

## Especificacion de los casos

### SEL-QA20-01 — rechazarVacanteConMotivoObligatorio

- Objetivo: Validar las decisiones de moderacion administrativa.
- Precondiciones: Vacantes pendientes de revision.
- Datos: Vacantes sinteticas y motivo de rechazo.
- Tecnica: Pruebas positivas y negativas.
- Herramienta: Selenium WebDriver.
- Resultado obtenido: PASS.
- Duracion FULL 01: 9.845 s.
- Implementacion: `qa/selenium/src/test/java/creo/tests/AdminModerationTest.java`.
- Evidencias: `reportes/full-01/` y `reportes/full-02/`.

### SEL-QA20-02 — aprobarVacanteSinPublicacionAutomatica

- Objetivo: Validar las decisiones de moderacion administrativa.
- Precondiciones: Vacantes pendientes de revision.
- Datos: Vacantes sinteticas y motivo de rechazo.
- Tecnica: Pruebas positivas y negativas.
- Herramienta: Selenium WebDriver.
- Resultado obtenido: PASS.
- Duracion FULL 01: 7.023 s.
- Implementacion: `qa/selenium/src/test/java/creo/tests/AdminModerationTest.java`.
- Evidencias: `reportes/full-01/` y `reportes/full-02/`.

### SEL-QA20-03 — loginEmpresaValido

- Objetivo: Validar autenticacion y autorizacion por rol.
- Precondiciones: Usuarios sinteticos activos y API disponible.
- Datos: Credenciales sinteticas de empresa y administrador.
- Tecnica: Prueba funcional y control de acceso.
- Herramienta: Selenium WebDriver.
- Resultado obtenido: PASS.
- Duracion FULL 01: 4.760 s.
- Implementacion: `qa/selenium/src/test/java/creo/tests/CompanyAdminAuthTest.java`.
- Evidencias: `reportes/full-01/` y `reportes/full-02/`.

### SEL-QA20-04 — adminNoAccedePerfilCandidato

- Objetivo: Validar autenticacion y autorizacion por rol.
- Precondiciones: Usuarios sinteticos activos y API disponible.
- Datos: Credenciales sinteticas de empresa y administrador.
- Tecnica: Prueba funcional y control de acceso.
- Herramienta: Selenium WebDriver.
- Resultado obtenido: PASS.
- Duracion FULL 01: 3.846 s.
- Implementacion: `qa/selenium/src/test/java/creo/tests/CompanyAdminAuthTest.java`.
- Evidencias: `reportes/full-01/` y `reportes/full-02/`.

### SEL-QA20-05 — loginAdminValido

- Objetivo: Validar autenticacion y autorizacion por rol.
- Precondiciones: Usuarios sinteticos activos y API disponible.
- Datos: Credenciales sinteticas de empresa y administrador.
- Tecnica: Prueba funcional y control de acceso.
- Herramienta: Selenium WebDriver.
- Resultado obtenido: PASS.
- Duracion FULL 01: 3.489 s.
- Implementacion: `qa/selenium/src/test/java/creo/tests/CompanyAdminAuthTest.java`.
- Evidencias: `reportes/full-01/` y `reportes/full-02/`.

### SEL-QA20-06 — empresaNoAccedeAdministracion

- Objetivo: Validar autenticacion y autorizacion por rol.
- Precondiciones: Usuarios sinteticos activos y API disponible.
- Datos: Credenciales sinteticas de empresa y administrador.
- Tecnica: Prueba funcional y control de acceso.
- Herramienta: Selenium WebDriver.
- Resultado obtenido: PASS.
- Duracion FULL 01: 4.534 s.
- Implementacion: `qa/selenium/src/test/java/creo/tests/CompanyAdminAuthTest.java`.
- Evidencias: `reportes/full-01/` y `reportes/full-02/`.

### SEL-QA20-07 — impedirContratacionPorCupoAgotado

- Objetivo: Impedir contrataciones superiores al limite.
- Precondiciones: Vacante con un cupo y dos candidatos en entrevista.
- Datos: Dos postulaciones independientes.
- Tecnica: Prueba negativa y valor limite.
- Herramienta: Selenium WebDriver.
- Resultado obtenido: PASS.
- Duracion FULL 01: 17.882 s.
- Implementacion: `qa/selenium/src/test/java/creo/tests/CompanyConflictTest.java`.
- Evidencias: `reportes/full-01/` y `reportes/full-02/`.

### SEL-QA20-08 — gestionarContratacionYRechazo

- Objetivo: Validar decisiones empresariales y resultados del candidato.
- Precondiciones: Vacante publicada y dos postulaciones recibidas.
- Datos: Candidatos Alfa y Beta con perfiles sinteticos.
- Tecnica: Transicion de estados y regresion.
- Herramienta: Selenium WebDriver.
- Resultado obtenido: PASS.
- Duracion FULL 01: 43.795 s.
- Implementacion: `qa/selenium/src/test/java/creo/tests/CompanyKanbanTest.java`.
- Evidencias: `reportes/full-01/` y `reportes/full-02/`.

### SEL-QA20-09 — pagoSimuladoPublicaVacante

- Objetivo: Validar el pago simulado y la publicacion.
- Precondiciones: Vacante aprobada sin pago.
- Datos: Tarjeta ficticia y tarifa simulada de S/ 100.
- Tecnica: Prueba funcional E2E.
- Herramienta: Selenium WebDriver.
- Resultado obtenido: PASS.
- Duracion FULL 01: 13.013 s.
- Implementacion: `qa/selenium/src/test/java/creo/tests/CompanyPaymentTest.java`.
- Evidencias: `reportes/full-01/` y `reportes/full-02/`.

## Cobertura funcional comprobada

### Moderacion administrativa

1. Autenticar administrador.
2. Consultar una vacante pendiente.
3. Aprobar o rechazar segun el escenario.
4. Verificar las restricciones y mensajes de interfaz.
5. Comprobar estado persistido mediante API y MySQL.

**Resultado esperado:** decision registrada correctamente;
rechazo con motivo y aprobacion sin publicacion automatica.

### Pago simulado

1. Autenticar empresa.
2. Consultar una vacante aprobada sin pago.
3. Abrir y cancelar el formulario de pago.
4. Completar el pago utilizando datos ficticios.
5. Recargar y verificar la publicacion.

**Resultado esperado:** pago unico de 100 PEN y vacante publicada.

### Kanban empresarial

1. Autenticar empresa y abrir el tablero.
2. Consultar los perfiles de ambos postulantes.
3. Verificar el renderizado de un perfil academico incompleto.
4. Avanzar Alfa desde Recibido hasta Contratado.
5. Avanzar Beta a Revision y rechazar con motivo.
6. Comprobar bloqueo de los estados finales.
7. Consultar historial y recargar.
8. Consultar resultados desde las cuentas de los candidatos.

**Resultado esperado:** estados e historial consistentes
entre interfaz, API y MySQL.

### Limite de contratacion

1. Preparar una vacante con un unico cupo.
2. Preparar dos candidatos en Entrevista.
3. Contratar al primer candidato desde la interfaz.
4. Intentar contratar al segundo candidato.
5. Comprobar el mensaje de limite alcanzado.
6. Recargar y verificar ambos historiales.

**Resultado esperado:** un contratado, cero cupos y segundo
candidato en Entrevista sin movimientos adicionales.

## Delimitaciones

- No se realizan pagos reales.
- Los fixtures contienen exclusivamente datos sinteticos.
- El bloqueo por cupos se verifica secuencialmente desde la UI.
- No constituye una prueba de concurrencia simultanea.
- Las consultas directas API/MySQL complementan Selenium.
- Las pruebas moviles y de rendimiento pertenecen a otras suites.

## Trazabilidad con el catalogo maestro

| Caso Selenium | Catalogo maestro | Requisito |
|---|---|---|
| SEL-QA20-01 | CP-08 | RF-05 |
| SEL-QA20-02 | CP-08 | RF-05 |
| SEL-QA20-03 | CP-03 | RF-02 |
| SEL-QA20-04 | CP-15 | RNF-01 |
| SEL-QA20-05 | CP-03 | RF-02 |
| SEL-QA20-06 | CP-15 | RNF-01 |
| SEL-QA20-07 | CP-16 | RF-08 |
| SEL-QA20-08 | CP-16, CP-17, CP-22, CP-23 | RF-08, RF-10 |
| SEL-QA20-09 | CP-09 | RF-05 |

CP-23 tiene cobertura parcial mediante el recorrido Kanban.
La relacion con el catalogo maestro no implica que todos
los subcasos de cada familia CP hayan sido ejecutados.

## Procedimientos y resultados esperados por caso

### Procedimiento SEL-QA20-01

- Pasos: Autenticar administrador; abrir vacante pendiente; intentar rechazar sin motivo; ingresar motivo; confirmar y verificar persistencia.
- Resultado esperado: Rechazo sin motivo impedido; rechazo valido registrado.
- Resultado obtenido: conforme al esperado.
- Estado: PASS.
- Evidencias: reportes XML FULL 01 y FULL 02.

### Procedimiento SEL-QA20-02

- Pasos: Autenticar administrador; abrir vacante pendiente; aprobar; consultar estado y recargar.
- Resultado esperado: Vacante aprobada, sin pago ni publicacion automatica.
- Resultado obtenido: conforme al esperado.
- Estado: PASS.
- Evidencias: reportes XML FULL 01 y FULL 02.

### Procedimiento SEL-QA20-03

- Pasos: Abrir login; ingresar credenciales de empresa; autenticar y comprobar inicio empresarial.
- Resultado esperado: Acceso correcto a la interfaz empresarial.
- Resultado obtenido: conforme al esperado.
- Estado: PASS.
- Evidencias: reportes XML FULL 01 y FULL 02.

### Procedimiento SEL-QA20-04

- Pasos: Autenticar administrador; intentar acceder a la ruta del perfil del candidato.
- Resultado esperado: Navegacion no autorizada impedida.
- Resultado obtenido: conforme al esperado.
- Estado: PASS.
- Evidencias: reportes XML FULL 01 y FULL 02.

### Procedimiento SEL-QA20-05

- Pasos: Abrir login; ingresar credenciales de administrador; autenticar y comprobar dashboard administrativo.
- Resultado esperado: Acceso correcto a la interfaz administrativa.
- Resultado obtenido: conforme al esperado.
- Estado: PASS.
- Evidencias: reportes XML FULL 01 y FULL 02.

### Procedimiento SEL-QA20-06

- Pasos: Autenticar empresa; intentar acceder a una ruta reservada para administracion.
- Resultado esperado: Navegacion no autorizada impedida.
- Resultado obtenido: conforme al esperado.
- Estado: PASS.
- Evidencias: reportes XML FULL 01 y FULL 02.

### Procedimiento SEL-QA20-07

- Pasos: Abrir vacante con un cupo; contratar Alfa; intentar contratar Beta; recargar y consultar historial.
- Resultado esperado: Un contratado, cero cupos y Beta permanece en Entrevista.
- Resultado obtenido: conforme al esperado.
- Estado: PASS.
- Evidencias: reportes XML FULL 01 y FULL 02.

### Procedimiento SEL-QA20-08

- Pasos: Consultar perfiles; avanzar Alfa hasta Contratado; rechazar Beta con motivo; verificar estados finales, historial y resultados desde cuentas de candidatos.
- Resultado esperado: Estados persistidos y consistentes entre UI, API y MySQL.
- Resultado obtenido: conforme al esperado.
- Estado: PASS.
- Evidencias: reportes XML FULL 01 y FULL 02.

### Procedimiento SEL-QA20-09

- Pasos: Autenticar empresa; abrir pago; cancelar; realizar pago simulado; recargar.
- Resultado esperado: Pago unico de 100 PEN y vacante publicada.
- Resultado obtenido: conforme al esperado.
- Estado: PASS.
- Evidencias: reportes XML FULL 01 y FULL 02.

## Trazabilidad Jira

Identificadores Selenium preparados para su vinculacion
con los casos de prueba de Jira mediante QA-29.
La vinculacion efectiva en Jira queda pendiente de verificacion.
