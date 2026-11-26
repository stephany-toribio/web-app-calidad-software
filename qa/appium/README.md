# Appium — QA-21

## Preparación

Desde la raíz: npm ci --prefix qa/appium.

Configurar ANDROID_HOME con la ruta del SDK y JAVA_HOME con JDK 21.
Agregar platform-tools y el bin de Java al PATH.
Instalar el APK CREO QA y la PWA; mantener API HTTPS y CORS operativos.

## Servidor

En una terminal, entrar en qa/appium.
Crear .runtime si no existe y quitar APPIUM_HOME del entorno para usar
las dependencias locales del proyecto.

Ejecutar:

    ./node_modules/.bin/appium.cmd server --address 127.0.0.1 --port 4723 --allow-insecure uiautomator2:chromedriver_autodownload --log-level info --log .runtime/appium.log

Mantener el servidor abierto. No publicar el log bruto.
La descarga automática de Chromedriver requiere Internet.

## Configuración de ejecución

En otra terminal, desde la raíz, configurar:

- ANDROID_SERIAL: serial obtenido mediante adb devices.
- QA21_PWA_PACKAGE: WebAPK obtenido con adb shell pm list packages org.chromium.webapk.
- QA21_PWA_URL: origen HTTPS del frontend QA.
- QA21_API_URL: URL HTTPS de la API, terminada en /api/v1.

No versionar credenciales, tokens ni identificadores del dispositivo.

## Comandos

    node qa/appium/smoke.mjs
    node qa/appium/smoke.mjs --api-probe
    node qa/appium/pwa.mjs
    node qa/appium/smoke.mjs --fail-controlled

El fallo controlado termina con código 1 y EXPECTED_FAILURE.
Un resultado FAIL corresponde a otro problema.

pwa.mjs abre Chrome y activa el WebAPK mediante Appium.
Exige origen QA, standalone=true y service worker controlador.

Capabilities APK: capabilities.apk.json.
Variaciones PWA: Object.assign(caps, ...) en pwa.mjs.
Se usa noReset=true para conservar los datos existentes.

## Compatibilidad comprobada

- Appium 4.0.1 y UiAutomator2 10.4.0.
- Servidor UiAutomator2 11.6.1.
- Android 16, API 36.
- WebView 157.0.8103.50 / Chromedriver 157.0.8103.78.
- Chrome 158.0.8127.42 / Chromedriver 158.0.8127.88.

Inventario y hashes: docs/evidencias/QA-21/INVENTARIO.json.
Resultados: docs/evidencias/QA-21/RESULTADOS.md.
