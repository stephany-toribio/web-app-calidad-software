# Resultados de QA-06 - Frontend

## 1. Identificacion

- Tarea: QA-06.
- Epica: E02 - Flujo de negocio estable.
- Hito: M1.
- Responsable: stephany-toribio.
- Fecha: 2026-11-25.
- Rama: feature/QA-06-registro-perfiles.
- Ambiente: WSL2.
- Node.js: 22.22.1.
- npm: 9.2.0.

Issue:
https://github.com/stephany-toribio/web-app-calidad-software/issues/4

## 2. Objetivo

Estabilizar los formularios de registro y perfiles,
proteger los datos personales y completar la funcionalidad
de actualizacion del perfil empresarial.

## 3. Cambios implementados

### Perfil de candidato

- Redireccion de la ruta antigua al perfil funcional.
- Retiro de la pantalla simulada del flujo navegable.
- Proteccion de modales durante operaciones de guardado.

### Registro de candidato

- Borrador limitado a sessionStorage.
- Eliminacion de borradores persistentes anteriores.
- Exclusión de contrasenas del almacenamiento.
- Restauracion desde el primer paso.
- Prevencion de recreacion del borrador tras registro.
- Bloqueo de navegacion durante solicitudes pendientes.

### Perfil empresarial

- Nueva pantalla protegida mediante companyGuard.
- Integracion con el menu empresarial.
- Consulta y actualizacion mediante la API.
- Validaciones locales y mensajes por campo.
- Proteccion contra dobles envios.
- Conservacion de datos ante errores.
- Correo de solo lectura.
- Confirmacion de guardado tras respuesta exitosa.
- Catalogo de sectores compartido.

### Registro empresarial

- Bloqueo de registros duplicados.
- Proteccion ante fallo de login posterior al registro.
- Bloqueo de navegacion durante solicitudes.
- Indicadores de carga en botones.
- Redireccion al paso que contiene errores.

## 4. Resultados de pruebas

| Suite | Pruebas | Fallos | Duracion aproximada |
| --- | ---: | ---: | ---: |
| QA-05 | 12 | 0 | 0.904 s |
| QA-06 | 49 | 0 | 1.034 s |
| QA-07 | 14 | 0 | 0.762 s |
| Total | 75 | 0 | 2.700 s |

### Distribucion de QA-06

| Archivo | Pruebas |
| --- | ---: |
| candidate-profile.test.mjs | 11 |
| candidate-register.test.mjs | 9 |
| candidate-steps.test.mjs | 4 |
| company-profile.test.mjs | 17 |
| company-register.test.mjs | 8 |
| Total | 49 |

## 5. Compilaciones

| Configuracion | Resultado | Duracion | Bundle inicial |
| --- | --- | --- | --- |
| TypeScript | PASS | No medida | No aplica |
| Estandar | PASS | 10.747 s | 366.16 kB |
| QA | PASS | 10.647 s | 366.16 kB |
| Angular Android | PASS | 10.720 s | 366.19 kB |

La compilacion Android utiliza una URL HTTPS ficticia
para comprobar la configuracion de compilacion.

No corresponde a un APK instalado.

## 6. Trazabilidad

Familias: CP-01, CP-02 y CP-06.

Se incluyen pruebas auxiliares de validacion, navegacion,
persistencia del estado, privacidad y manejo de errores.

## 7. Metodologia

Node Test Runner y TypeScript.

Se extraen y ejecutan metodos reales de los componentes
mediante un harness con dependencias controladas.

Se incluyen dos comprobaciones estaticas de rutas.

Las pruebas no ejecutan el componente Angular completo
ni sustituyen las pruebas end-to-end.

## 8. Evidencias

- frontend/pruebas-qa06-01.txt
- frontend/pruebas-qa06-02.txt
- frontend/final/typescript.txt
- frontend/final/regresion-qa05.txt
- frontend/final/regresion-qa06.txt
- frontend/final/regresion-qa07.txt
- frontend/final/build-estandar.txt
- frontend/final/build-qa.txt
- frontend/final/build-android.txt
- SHA256SUMS.txt

## 9. Limitaciones y riesgos residuales

- Falta verificar los flujos completos en navegador
  mediante Selenium.
- Las pruebas auxiliares simulan las dependencias HTTP.
- sessionStorage reduce la persistencia, pero no cifra
  los datos ni protege frente a XSS.
- La eliminacion del borrador antiguo se realiza al
  cargar el formulario de registro.
- Falta verificar accesibilidad y comportamiento movil
  en las tareas correspondientes.
- No se acredita instalacion ni conectividad de APK.
- Las pruebas formales de Selenium y Appium
  permanecen pendientes.

## 10. Conclusion

Las 49 pruebas especificas de QA-06 y las 26 pruebas
de regresion anteriores finalizaron sin fallos.

Las tres configuraciones Angular compilaron correctamente.

El cierre administrativo requiere commit, push,
integracion de los PR y actualizacion del GitHub Project.
