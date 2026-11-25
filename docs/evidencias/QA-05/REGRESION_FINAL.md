# QA-05 — Regresión frontend

## Objetivo

Verificar autenticación, autorización, gestión de sesiones
y navegación protegida de candidato, empresa y administrador.

## Trazabilidad

- QA-05: recruitment-api-calidad-software#14.
- PR backend: recruitment-api-calidad-software#33.
- PR frontend: web-app-calidad-software#19.
- Familias: CP-03, CP-04, CP-05, CP-06 y CP-15.

## Cambios

- Mensajes específicos de cuentas suspendidas.
- Política centralizada de invalidación de sesión.
- Tratamiento diferenciado de 401 y 403.
- Uso de reason ACCOUNT_NOT_ACTIVE.
- Protección frente a respuestas de sesiones anteriores.
- Manejo seguro de respuestas de error inesperadas.
- Protección de limpieza y navegación posterior al logout.

## Resultados

| Suite | Resultado |
|---|---|
| Política de sesiones | 12/12 PASS |
| Regresión HTTP | 24/24 PASS |
| Regresión funcional Chromium | 12/12 PASS |
| Compilación estándar | PASS |
| Compilación QA | PASS |
| Compilación Angular Android | PASS |

## Casos funcionales

| Caso | Escenario | Resultado |
|---|---|---|
| W01 | Login candidato | PASS |
| W02 | Login empresa | PASS |
| W03 | Login administrador | PASS |
| W04 | Persistencia tras recarga | PASS |
| W05 | Token inválido | PASS |
| W06 | Cuenta suspendida | PASS |
| W07 | Navegación restringida | PASS |
| W08 | Logout candidato | PASS |
| W09 | Logout empresa | PASS |
| W10 | Logout administrador | PASS |
| W11 | Suspensión y aislamiento admin | PASS |
| W12 | Reactivación y nuevo login | PASS |

## Evidencias

Consultar el directorio regresion-wsl:

- Logs de compilación.
- Pruebas de política de sesiones.
- Reporte HTTP JSON.
- Reporte Playwright JSON.
- Capturas del navegador.
- Versiones de herramientas.
- SHA256SUMS.txt.

## Reproducibilidad

Utilizar el ambiente QA-02 y la configuración QA-03.

Ejecutar npm run test:qa05.

Los scripts auxiliares se encuentran en tests/qa05.
Playwright se instala en un entorno virtual independiente.

## Limitaciones

- Playwright es una herramienta auxiliar de regresión QA-05.
- No sustituye Selenium ni las suites exigidas por la rúbrica.
- El build Angular Android no constituye un APK instalado.
- La condición de carrera de logout tiene protección de
  código, pero no una prueba específica de concurrencia.
- Las vulnerabilidades de dependencias requieren
  tratamiento antes de la release.
- La trazabilidad Jira se completa mediante QA-29.
- No se exige revisión cruzada formal.

## Limpieza

La cuenta ficticia utilizada para suspensión se reactiva.
Los tokens emitidos durante las pruebas se revocan.
No se publican credenciales reales.
