# Resultados frontend - QA-07

## Identificacion

- Proyecto: Portal de Empleos CREO+.
- Tarea: QA-07.
- Issue principal:
  stephany-toribio/recruitment-api-calidad-software#15.
- Fecha: 25/11/2026.
- Responsable: stephany-toribio.
- Rama: feature/QA-07-vacantes-disponibilidad.

## Ambiente

- WSL2.
- Node.js 22.22.1.
- npm 9.2.0.
- Angular.
- TypeScript.
- Node Test Runner.

## Hallazgos y correcciones

| ID | Hallazgo | Correccion | Evidencia |
|---|---|---|---|
| QA07-F01 | Nulabilidad incorrecta de ubicacion | string o null | TypeScript y builds |
| QA07-F02 | Datos residuales de tarjeta | Eliminacion de campos sin referencias | Inspeccion y builds |
| QA07-F03 | Confirmacion sin comprobar puedePagar | Guarda en el metodo | F03 |
| QA07-F04 | Datos de tarjeta retenidos en componente | Limpieza al cancelar y pagar | F01, F07, F08 |
| QA07-F05 | Autocompletado de tarjetas | Solicitud de desactivacion y advertencia | Inspeccion de plantilla y builds |
| QA07-F06 | Posibles respuestas tardias de resumen | Versionado de solicitudes | F10, F11, F12 |

## Pruebas auxiliares de QA-07

| ID | Escenario | Resultado |
|---|---|---|
| F01 | Formulario inicia limpio | PASS |
| F02 | Monto y permiso del servidor | PASS |
| F03 | Bloqueo de pago no autorizado | PASS |
| F04 | Datos incompletos | PASS |
| F05 | Payload sin monto ni moneda | PASS |
| F06 | Doble confirmacion | PASS |
| F07 | Limpieza al cancelar | PASS |
| F08 | Limpieza y actualizacion tras pago | PASS |
| F09 | Asignacion de error HTTP 422 | PASS |
| F10 | Descarte de respuesta antigua | PASS |
| F11 | Descarte de error antiguo | PASS |
| F12 | Descarte de respuesta tras cancelar | PASS |
| F13 | Bloqueo de otra apertura durante pago | PASS |
| F14 | Bloqueo de cancelacion durante pago | PASS |

Comando reproducible:

    npm run test:qa07

## Regresion final

| Verificacion | Resultado | Duracion |
|---|---|---|
| TypeScript | PASS | No registrada |
| QA-05 | 12/12 PASS | 1.277 s |
| QA-07 | 14/14 PASS | 0.771 s |
| Build estandar | PASS | 11.945 s |
| Build QA | PASS | 14.728 s |
| Build Angular Android | PASS | 11.223 s |

Total pruebas auxiliares: 26/26 PASS.

## Evidencias

- frontend/payment-flow.txt
- frontend/final/typescript.txt
- frontend/final/regresion-qa05.txt
- frontend/final/regresion-qa07.txt
- frontend/final/build-estandar.txt
- frontend/final/build-qa.txt
- frontend/final/build-android.txt
- tests/qa07/payment-flow.test.mjs

## Limitaciones

Las pruebas ejecutan metodos extraidos del componente
real mediante TypeScript, con servicios simulados.

No comprueban el DOM, el ciclo de vida completo de Angular,
la inyeccion de dependencias ni solicitudes HTTP reales.

La condicion de carrera fue identificada por inspeccion
y verificada mediante respuestas simuladas despues
de la correccion. No se conserva una ejecucion RED previa.

El atributo autocomplete=off no garantiza que todos
los navegadores deshabiliten el autocompletado.

La compilacion Android utiliza una URL ficticia de prueba.
No acredita instalacion de APK ni ejecucion de Appium.

Las pruebas Selenium y Appium se realizaran en las tareas
correspondientes. No se han abierto navegadores para
esta regresion local.

## Conclusion

Las pruebas auxiliares y las compilaciones finales
aprobaron sin fallos.

La integracion con develop permanece pendiente.
