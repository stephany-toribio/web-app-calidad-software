# QA-11 — Aviso ante fallo silencioso de comprobacion

Se reviso el worker instalado de Angular 19: checkForUpdate puede resolver false
si no consigue leer el manifiesto, sin lanzar error ni emitir un evento de version.
La primera implementacion solo manejaba rechazo de la promesa.

Se detecta ahora false sin un resultado de version y se muestra un aviso de
comprobacion fallida. Los eventos de version conocida o instalacion fallida
conservan sus avisos especificos. No se modifica la politica de cache ni de escrituras.

Regresion nueva: false sin evento; false con version conocida; false con
VERSION_INSTALLATION_FAILED. Sin recarga automatica.

Verificacion del asistente en copia Linux, Node 24.22.3:
- 154/154 pruebas PASS: 135 existentes y 19 QA-11.
- Build QA completado.
- Logs adjuntos con sufijo ajuste-actualizacion.

Pendiente repetir este ajuste en Windows y comprobar el fallo/recuperacion real.
El resultado no sustituye las pruebas en la PWA instalada.

Chrome renombro Network request blocking a Request conditions.
El bloqueo debe verse como blocked:devtools para acreditar que se aplico;
no asumir que las reglas de la pagina interceptan las peticiones del worker.
