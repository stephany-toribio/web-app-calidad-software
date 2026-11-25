# QA-20 — Registro de incidencias y dependencias

## OBS-QA20-01 — Formulario administrativo

Durante la inspección del código se identificó que el
componente creo-admin-login no presenta un campo de
contraseña, aunque su lógica TypeScript lo exige.

Estado: hallazgo de inspección, pendiente de verificación
funcional y corrección si corresponde.

La suite utiliza inicialmente el formulario principal
de autenticación.

## DEP-QA20-01 — Dependencia QA-12

QA-12 permanece abierta al inicio de QA-20.

Se permite avanzar con la automatización Selenium de
escritorio sobre la infraestructura existente.

La dependencia no se considera satisfecha hasta
verificar su implementación y evidencias.

## Base de trabajo

- Rama: feature/QA-20-selenium-empresa-admin.
- Commit base: 0cbf595.
- QA-19 integrado mediante PR #26.
- QA-07, QA-09 y QA-18 cerradas.

## INC-QA20-01 — Timeout en primera transición Kanban

- Herramienta: Selenium WebDriver 4.29.0.
- Clase: CompanyKanbanTest.
- Método: gestionarContratacionYRechazo.
- Run ID: 8b658501-73d8-4f0d-b0dc-3351b74199f8.
- Resultado inicial: ERROR.
- Duración: 21.81 segundos.
- Excepción: TimeoutException.
- Método afectado: CompanyKanbanPage.esperarAccion.
- Acción esperada: Mover a Revisión.
- Precondiciones: ambas postulaciones en estado Recibido,
  verificadas mediante API y MySQL.
- Limpieza: cuatro usuarios eliminados, cero residuos.
- Diagnóstico: la acción esperada no estuvo disponible
  durante la espera explícita de 15 segundos.
- Causa raíz: pendiente de confirmación.
- Acción realizada: instrumentación del diagnóstico del
  Page Object sin reducir las comprobaciones funcionales.
- Retest: pendiente.

### Primer retest de INC-QA20-01

- Run ID: 51f0aa32-837e-40a1-b838-c7348fa251be.
- Resultado: ERROR.
- Duración: 22.45 segundos.
- Excepción: TimeoutException.
- Botones de avance encontrados: 1.
- Botón visible: sí.
- Botón habilitado: sí.
- Texto obtenido mediante getText(): vacío.
- Postulaciones iniciales verificadas: 2.
- Registros residuales: 0.

### Corrección propuesta

- Recuperar el contenido textual mediante
  getDomProperty("textContent").
- Normalizar los espacios del contenido.
- Mantener la comparación exacta de la acción esperada.
- Desplazar el botón hasta la zona visible del panel.
- Conservar el clic mediante Selenium WebDriver.
- Reforzar la lectura del historial.

No se modifican las reglas de negocio de Angular,
los estados permitidos ni las restricciones de contratación.

Segundo retest: pendiente.

### Segundo y tercer retest de INC-QA20-01

| Run ID | Duracion | Resultado |
|---|---:|---|
| 4ca86f7e-d706-4655-9a29-0748cb1230ac | 22.01 s | ERROR |
| 1e5f3fd1-ed01-49ca-b2f0-a6df0d36d0c3 | 22.11 s | ERROR |

### Hallazgo funcional confirmado

El boton de avance Kanban existe y esta habilitado,
pero su contenido HTML se encuentra vacio.

- getText(): vacio.
- textContent: vacio.
- innerText: vacio.
- outerHTML: boton sin contenido textual.
- Selector: data-testid="kanban-advance".

Clasificacion: defecto de interfaz y accesibilidad.
Impacto: dificultad para identificar la accion disponible
durante el proceso de seleccion empresarial.

### Correccion funcional propuesta

- Vinculacion explicita de textContent en Angular.
- Incorporacion de aria-label dinamico.
- Reconstruccion del frontend QA.
- Verificacion de contenido y nombre accesible con Selenium.
- Conservacion de las reglas de negocio originales.

La causa tecnica subyacente del renderizado vacio
todavia no ha sido determinada completamente.

Estado: pendiente de retest.

### Identificacion de la causa raiz

- Run ID: d9f7b305-8bbc-4cee-8c96-62209807dec0.
- Resultado: ERROR.
- Duracion: 22.14 segundos.
- Excepcion interna de Angular:
  TypeError: Cannot read properties of null (reading 'nombre').

El contrato API devuelve registros academicos con
carrera, institucion y estado nulos.

La plantilla Angular accedia directamente a propiedades
de estos objetos sin comprobar su nulabilidad.

Esto interrumpia el renderizado del perfil y dejaba
el boton de avance sin contenido.

### Correccion de causa raiz

- Navegacion segura para objetos academicos opcionales.
- Mensajes alternativos cuando faltan datos.
- Proteccion del estado academico nulo.
- Conservacion de las restricciones funcionales.
- Prueba de regresion con el mismo perfil incompleto.
- Verificacion de la etiqueta y nombre accesible.
- Comprobacion de transiciones mediante API y MySQL.

Retest de la correccion: PASS.

### Hallazgo adicional OBS-QA20-02

Chrome informa un atributo SVG path con una instruccion
de arco invalida.

Se registra como defecto visual independiente.
No se ha demostrado que bloquee el flujo empresarial.
Pendiente de correccion y verificacion.

### Resultado satisfactorio de INC-QA20-01

- Run ID: eba1385a-97e3-400f-b3ef-5c1444857094.
- Resultado: PASS.
- Duracion: 35.43 segundos.
- Escenarios: 1.
- Fallos: 0.
- Errores: 0.
- Omitidos: 0.
- Comprobaciones API y MySQL: 9 satisfactorias.
- Evidencias JSON de persistencia: 7.
- Usuarios eliminados: 4.
- Registros residuales: 0.
- Escaneo de credenciales y tokens: PASS.

Se reprodujo la precondicion original del defecto
mediante datos academicos incompletos.

El perfil renderizo correctamente y permitio completar
las transiciones empresariales, la contratacion,
el rechazo y la consulta del historial.

Estado funcional: correccion validada.
Regresion integrada preliminar: PASS, 8/8.

### OBS-QA20-03 — Contrato TypeScript

El compilador emitio advertencias NG8107 porque las
interfaces academicas no representaban la nulabilidad
real de determinados campos de la API.

Se ajustan los tipos de EstudioPostulante de acuerdo
con la respuesta observada.

Compilacion sin NG8107 y regresion integrada: PASS.

### Regresion integrada posterior a INC-QA20-01

- Run ID: 0ef94886-32ec-4b0f-a437-931230aea7b9.
- Escenarios: 8.
- Aprobados: 8.
- Fallos: 0.
- Errores: 0.
- Omitidos: 0.
- Registros residuales: 0.
- Escaneo de credenciales: PASS.
- Compilacion Angular sin advertencias NG8107: PASS.

INC-QA20-01: correccion y regresion satisfactorias.
OBS-QA20-03: contrato TypeScript corregido y validado.

## INC-QA20-02 — Serializacion de evidencia JSON

### Ejecucion inicial

- Run ID: addb24f9-e97a-40d5-a03e-5afb47ab2d5d.
- Escenario: impedirContratacionPorCupoAgotado.
- Resultado: FAIL.
- Duracion: 16.67 segundos.
- Excepcion: JSONDecodeError: Extra data.
- Fase afectada: verificacion del conflicto bloqueado.
- Registros residuales: 0.

### Causa raiz

El generador de evidencias agregaba una secuencia literal
de escape al final de los archivos JSON.

Python no podia interpretar posteriormente la evidencia
de la primera contratacion.

Clasificacion: defecto del codigo de automatizacion,
no defecto funcional confirmado del portal.

### Correccion

- Escritura de JSON con salto de linea mediante chr(10).
- Conservacion de las comprobaciones API y MySQL.
- Ajuste del manejo de salida del subproceso para evitar
  interferencias con Maven Surefire.

### Retest

- Run ID: 44bc0f51-b1c4-41be-89bb-ed64eb2ca8c8.
- Resultado: PASS.
- Duracion: 19.27 segundos.
- Escenarios aprobados: 1/1.
- Evidencias JSON validas: 3/3.
- Contrataciones maximas: 1.
- Contrataciones finales: 1.
- Cupos disponibles: 0.
- Registros residuales: 0.

El segundo candidato conserva el estado Entrevista
y su historial no presenta movimientos adicionales.

La correccion JSON se encuentra validada.
El ajuste de salida Surefire se verificara en la
regresion definitiva.

## INC-QA20-03 — Detector de tokens

Durante la auditoria previa a la publicacion se encontro
una expresion regular con escapes incorrectos.

El detector original no identificaba correctamente
un token sintetico con el formato esperado.

### Correccion

- Ajuste de la expresion regular del runner QA-20.
- Autoprueba con token sintetico.
- Comprobacion negativa con texto ordinario.
- Nuevo escaneo de las evidencias consolidadas.
- Validacion de archivos JSON.
- Verificacion SHA256 de 218 archivos antes de actualizar
  esta documentacion.

Resultado del escaneo posterior: PASS.

Las regresiones funcionales anteriores conservan sus
resultados, pero su escaneo original no constituye
evidencia suficiente del funcionamiento del detector.

La correccion no altera las pruebas funcionales.
La revision visual de capturas es independiente.
