# Verificación manual APK con API real

Fecha de registro: 2026-11-25T13:22:14.7184612-05:00
Commit frontend: fd0224a77e4e2e0ffd3b79e693e51022f4b87d91
Dispositivo: Samsung SM-X900, Android 16, API 36.
Paquete: edu.upch.creo.qa
SHA256 APK: 83F72D1050EDC40D5DA6C3B2B4EBEC58305B750D6BECF7537D66321DBCB3C8A5
API: https://maybe-partial-penguin-gadgets.trycloudflare.com/api/v1

## Resultados
- Gradle: BUILD SUCCESSFUL.
- Instalacion ADB: Success.
- Lanzamiento en frio: Status ok, 748 ms.
- Preflight CORS: permite https://localhost, POST y los encabezados solicitados.
- Registro y login: correctos, confirmados manualmente por el ejecutor.
- Listado y detalle de vacantes: correctos, confirmados por el ejecutor.
- Postulacion y visualizacion en Mis postulaciones: correctas, confirmadas por el ejecutor.
- Datos: vacantes publicadas 9101 y 9102, PostulacionesPruebaSeeder.
- Evidencia visual: apk-postulacion.png.

## Limites
Verificacion manual; no acredita ejecucion de Appium ni la suite Android completa.
La URL HTTPS es temporal y depende del tunel y Docker activos.
Pendientes de QA-10: instalacion PWA bajo HTTPS, standalone, alcance de navegacion,
revision maskable, completar CP-24 y revision e integracion del PR.
