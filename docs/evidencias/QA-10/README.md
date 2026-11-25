# QA-10 — Compilación y verificación

## Requisitos
- Node.js y npm compatibles con el proyecto.
- JDK y Android SDK compatibles con la configuración Gradle versionada.
- ADB disponible para instalar en un dispositivo Android.
- URL HTTPS de la API proporcionada por QA-13.

## Compilación web
npm ci
npm run build -- --configuration production
npm run build:qa

Salida web QA: dist/creo-angular-qa/browser.
Debe contener manifest.webmanifest, ngsw-worker.js y ngsw.json.

## Generación del APK desde PowerShell
Sustituir el marcador por la URL real antes de ejecutar:

$env:ANDROID_API_URL = "https://DOMINIO-QA/api/v1"
npm run build:android
npx cap sync android
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location

Detener el procedimiento si cualquier comando falla.

APK: android/app/build/outputs/apk/debug/app-debug.apk

## Identificación e instalación
Get-FileHash android/app/build/outputs/apk/debug/app-debug.apk -Algorithm SHA256
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -W -n edu.upch.creo.qa/.MainActivity

Si hay varios dispositivos, seleccionar uno mediante adb -s SERIAL.

## Evidencia disponible
- apk-dispositivo.txt: versión, hash, dispositivo, instalación y lanzamiento.
- apertura-tablet.png: captura del APK abierto.
- build-qa.txt: compilación QA completada.
- iconos.csv: dimensiones reales de los ocho iconos verificadas.
- Compilación de producción completada según salida de consola;
  falta conservar su log como evidencia versionada.

El APK registrado utilizó una URL ficticia.
La conectividad APK-API corresponde a QA-21.

## Pendientes de aceptación
- Instalación de la PWA desde el navegador Android bajo HTTPS.
- Apertura desde el lanzador y verificación del modo standalone.
- Navegación y enlaces dentro del alcance previsto.
- Revisión visual del recurso maskable.
- Registro completo de CP-24 y retest de la corrección del service worker.
- Confirmación de dependencias QA-03 y QA-13.
- Revisión cruzada e integración del PR.

La instalación del APK no sustituye la prueba de instalación de la PWA.
QA-10 permanece abierto.
