# QA-21 — Resultados reales

Fecha: 25/11/2026, hora de Lima.
Ejecutor: Luis Valenzuela.
Dispositivo: Samsung SM-X900, Android 16, API 36.
Versiones y SHA256 del APK instalado: INVENTARIO.json.
Casos relacionados: CP-24 y CP-29.

## Resultados

- APK: NATIVE_APP → WEBVIEW_edu.upch.creo.qa → NATIVE_APP: PASS.
- APK: plataforma nativa y origen https://localhost: PASS.
- Preflight desde Windows: 204, origen y encabezados permitidos: PASS.
- POST HTTPS desde WebView: JSON 401 esperado, legible bajo CORS: PASS.
- PWA: apertura del WebAPK mediante Appium: PASS.
- PWA: NATIVE_APP → WEBVIEW_chrome → NATIVE_APP: PASS.
- PWA: standalone=true y controlador ngsw-worker.js: PASS.
- Fallo controlado: no such element, EXPECTED_FAILURE: correcto.
- Cierre de sesiones: PASS.

El login negativo utiliza una identidad ficticia.
Acredita conectividad y CORS; no autenticación válida.

## Evidencias

- [APK y HTTPS/CORS](ejecucion-windows/apk-2026-11-26T00-51-17-498Z/resultado.json).
- [PWA y retest](ejecucion-windows/pwa-2026-11-26T00-52-52-736Z/resultado.json).
- [Fallo controlado](ejecucion-windows/fallo-2026-11-26T00-31-31-682Z/resultado.json).

Los reportes usan UTC. Las carpetas incluyen las capturas generadas.

## Incidencias y límites

Play Protect bloqueó inicialmente la instalación del servidor UiAutomator2.
El ajuste exacto aplicado no quedó registrado; el retest en tablet pasó.

Chrome expuso inicialmente solo el service worker.
Abrir previamente una pestaña permitió conectar con la PWA.
La preparación está incorporada en pwa.mjs y su retest pasó.

La URL temporal requiere Docker y túnel activos.
La instalación de herramientas informó 14 vulnerabilidades moderadas;
su evaluación permanece pendiente.
No se acredita una suite completa de negocio Android.

Dependencias: QA-04, QA-13 y QA-10.
El inventario registra el commit base; esta entrega vincula código y evidencia.
R1 debe corroborar dependencias y resultados.
Revisión e integración del PR pendientes antes del cierre formal.
