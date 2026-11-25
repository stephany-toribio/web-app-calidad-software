# QA-19 — Casos de prueba Selenium del candidato

## 1. Objetivo

Validar el recorrido funcional del candidato en el portal
de empleos CREO+, utilizando un navegador Chrome real,
Selenium WebDriver, JUnit 5 y Page Object Model.

## 2. Alcance

- Autenticación.
- Autorización y protección de rutas.
- Validaciones del registro.
- Gestión del perfil.
- Búsqueda de vacantes.
- Consulta del detalle.
- Postulación.
- Prevención de postulaciones duplicadas.
- Seguimiento y retiro.
- Persistencia en MySQL.

## 3. Precondiciones generales

- Backend Laravel disponible en el puerto 8002.
- Base de datos MySQL de QA aislada.
- Frontend Angular QA disponible en el puerto 4202.
- Selenium Grid disponible en el puerto 4444.
- Chrome y ChromeDriver compatibles.
- Java 21, Maven y Python disponibles.
- Fixtures sintéticos identificados mediante UUID.
- Catálogos funcionales disponibles.
- No utilizar datos personales reales.

## 4. Casos de prueba

### SEL-CAND-01 — Inicio de sesión válido

- Clase: CandidateAuthTest.
- Método: loginValidoCandidato.
- Tipo: positivo.
- Prioridad: alta.
- Datos: candidato activo generado por fixture.
- Pasos:
  1. Abrir el portal.
  2. Introducir correo y contraseña válidos.
  3. Iniciar sesión.
- Resultado esperado: acceso al perfil del candidato.
- Resultado obtenido: PASS.
- Evidencia: candidate-login-success.png.
- Modo: full y demo.

### SEL-CAND-02 — Contraseña incorrecta

- Clase: CandidateAuthTest.
- Método: loginConPasswordIncorrecto.
- Tipo: negativo.
- Prioridad: alta.
- Datos: candidato sintético y contraseña incorrecta.
- Pasos:
  1. Abrir el formulario de autenticación.
  2. Introducir credenciales incorrectas.
  3. Intentar iniciar sesión.
- Resultado esperado: mensaje de error y permanencia
  en la pantalla de autenticación.
- Resultado obtenido: PASS.
- Evidencia: candidate-login-invalid.png.
- Modo: full.

### SEL-CAND-03 — Acceso sin autenticación

- Clase: CandidateAuthTest.
- Método: accesoSinSesionRedirigeAlLogin.
- Tipo: negativo.
- Prioridad: alta.
- Pasos:
  1. Abrir una sesión nueva del navegador.
  2. Acceder directamente a candidate-profile.
- Resultado esperado: redirección al formulario de login.
- Resultado obtenido: PASS.
- Evidencia: candidate-unauthenticated.png.
- Modo: full.

### SEL-CAND-04 — Restricción por rol

- Clase: CandidateAuthTest.
- Método: candidatoNoAccedeARutaEmpresarial.
- Tipo: negativo.
- Prioridad: alta.
- Pasos:
  1. Iniciar sesión como candidato.
  2. Intentar acceder a company-home.
- Resultado esperado: acceso empresarial denegado.
- Resultado obtenido: PASS.
- Evidencia: candidate-forbidden-company.png.
- Modo: full.

### SEL-CAND-05 — Búsqueda sin resultados

- Clase: CandidateBusinessTest.
- Método: busquedaSinResultados.
- Tipo: negativo.
- Prioridad: media.
- Datos: texto de búsqueda único asociado al UUID.
- Pasos:
  1. Iniciar sesión.
  2. Abrir la búsqueda de empleos.
  3. Buscar un título inexistente.
- Resultado esperado: mensaje Sin resultados.
- Resultado obtenido: PASS.
- Evidencia: candidate-search-empty.png.
- Modo: full.

### SEL-CAND-06 — Recorrido funcional de postulación

- Clase: CandidateBusinessTest.
- Método: recorridoCompletoCandidato.
- Tipo: positivo, negativo e integración E2E.
- Prioridad: crítica.
- Precondición: vacante aprobada y publicada mediante
  pago simulado; candidato sin postulaciones.
- Pasos:
  1. Iniciar sesión.
  2. Buscar la vacante sintética.
  3. Consultar el detalle.
  4. Cancelar la confirmación de postulación.
  5. Verificar cero postulaciones en MySQL.
  6. Confirmar la postulación.
  7. Verificar exactamente una postulación en MySQL.
  8. Comprobar que el botón impide una segunda postulación.
  9. Recargar y verificar la persistencia.
  10. Consultar Mis postulaciones.
  11. Desplegar el acordeón de la postulación.
  12. Confirmar el retiro.
  13. Recargar y verificar el retiro.
  14. Comprobar la identidad y estado del registro en MySQL.
- Resultado esperado:
  - Cancelar no genera registros.
  - Postular genera un único registro.
  - La interfaz impide volver a postular.
  - La recarga conserva la identidad de la postulación.
  - El retiro registra retirada_en.
  - El historial y estado original se conservan.
- Resultado obtenido: PASS.
- Evidencias:
  - candidate-search-result.png
  - candidate-job-detail.png
  - candidate-apply-cancel.png
  - candidate-apply-confirmation.png
  - candidate-applied.png
  - candidate-applied-persisted.png
  - candidate-application-listed.png
  - candidate-withdraw-confirmation.png
  - candidate-withdraw-success.png
  - candidate-withdraw-persisted.png
  - mysql-cancelada.json
  - mysql-creada.json
  - mysql-persistida.json
  - mysql-retirada.json
- Modo: full y demo.

### SEL-CAND-07 — Campos obligatorios vacíos

- Clase: CandidateProfileRegistrationTest.
- Método: registroCamposObligatoriosVacios.
- Tipo: negativo.
- Prioridad: alta.
- Pasos:
  1. Abrir el registro de candidato.
  2. Intentar continuar sin completar los campos.
- Resultado esperado: mensajes de campos obligatorios
  y permanencia en el primer paso.
- Resultado obtenido: PASS.
- Evidencia: candidate-register-required.png.
- Modo: full.

### SEL-CAND-08 — Datos de registro inválidos

- Clase: CandidateProfileRegistrationTest.
- Método: registroDatosInvalidos.
- Tipo: negativo.
- Prioridad: alta.
- Datos: DNI incompleto, correo inválido y contraseñas
  diferentes.
- Pasos:
  1. Abrir el registro.
  2. Introducir datos inválidos.
  3. Intentar continuar.
- Resultado esperado: mensajes de validación específicos.
- Resultado obtenido: PASS.
- Evidencia: candidate-register-invalid.png.
- Modo: full.

### SEL-CAND-09 — Doble envío del primer paso

- Clase: CandidateProfileRegistrationTest.
- Método: registroDobleEnvioNoAvanzaDosPasos.
- Tipo: negativo.
- Prioridad: alta.
- Pasos:
  1. Completar el primer paso con datos sintéticos válidos.
  2. Realizar doble clic en Continuar.
  3. Verificar que únicamente se accede al paso Educación.
  4. Consultar MySQL.
- Resultado esperado: un único avance de pantalla
  y ninguna cuenta creada por el registro parcial.
- Resultado obtenido: PASS.
- Evidencias:
  - candidate-register-valid-step.png
  - candidate-register-single-advance.png
  - mysql-registro-no-creado.json
- Modo: full.

### SEL-CAND-10 — Edición y persistencia del perfil

- Clase: CandidateProfileRegistrationTest.
- Método: editarPerfilYPersistirCambios.
- Tipo: positivo e integración.
- Prioridad: alta.
- Pasos:
  1. Iniciar sesión como candidato.
  2. Consultar el perfil.
  3. Abrir la edición.
  4. Verificar que el correo no es editable.
  5. Modificar el nombre.
  6. Guardar los cambios.
  7. Recargar la página.
  8. Verificar el nombre persistido en MySQL.
- Resultado esperado: actualización del nombre,
  conservación del correo y persistencia.
- Resultado obtenido: PASS.
- Evidencias:
  - candidate-profile-before.png
  - candidate-profile-edit.png
  - candidate-profile-saved.png
  - candidate-profile-persisted.png
  - mysql-perfil.json
- Modo: full.

## 5. Técnica de automatización

- Page Object Model.
- Selectores CSS y XPath relativos semánticos.
- Esperas explícitas mediante WebDriverWait.
- Esperas fluidas para elementos dinámicos.
- Relocalización ante StaleElementReferenceException.
- Capturas automáticas de evidencia y de fallos.
- Fixtures independientes por ejecución.
- Verificaciones directas de persistencia en MySQL.
- Limpieza automática al finalizar.

## 6. Delimitaciones

- El registro positivo completo se prepara mediante API.
- El doble clic se verifica en el primer paso del registro;
  no constituye una prueba concurrente del envío final.
- La prevención visual de postulaciones duplicadas se
  complementa con los escenarios de conflicto de Karate.
- No se realizan pagos financieros reales.
- Las pruebas móviles corresponden a Appium.
- Las pruebas de carga y concurrencia corresponden a JMeter.
- Los identificadores SEL-CAND son locales de Selenium.
  Su vinculación con los CP oficiales se consolida en
  la matriz general de trazabilidad.
