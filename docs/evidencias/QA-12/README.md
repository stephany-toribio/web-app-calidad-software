# QA-12 — Diseño móvil, accesibilidad y selectores

Base recibida: archivo QA12-base.zip, commit 4b4a66a27175a36a8fca8c07714e7d60410ef9fe.
Fecha: 25/11/2026. Implementación preparada para una rama temporal desde develop.

## Correcciones

- Etiquetas vinculadas a inputs/selects compartidos; identificadores únicos y errores/hints asociados mediante aria-describedby y aria-invalid. Selectores explícitos en login y registro de candidato/empresa.
- Fecha de nacimiento: selectores flexibles que pueden encogerse en pantallas estrechas, con nombres accesibles individuales.
- Foco visible con teclado; los diálogos de filtros, postulación, rechazo e historial controlan Tab, Shift+Tab, Escape y recuperación del foco. Los diálogos de confirmación limitan su altura y permiten desplazamiento en horizontal y con teclado virtual.
- Búsqueda flexible en móvil; tablero con región horizontal identificada y accesible por teclado. No se oculta el desbordamiento de toda la página.
- Android solicita adjustResize para el teclado. Debe verificarse con el teclado real y orientación del dispositivo.
- Selector Android de habilidades del catálogo real: lista multiselección nativa desplazable, máximo tres habilidades, Aplicar y Cancelar. Cancelar/atrás no modifica filtros ni ejecuta la búsqueda. Aplicar usa los mismos IDs y consulta del filtro existente. La web conserva su selector original. No se agregan dependencias.

## Pruebas ejecutadas aquí

Linux, Node 24.22.3, Angular 19.2.25. Compilación `npm run build:qa`: PASS. Compilación Angular para Android con la URL temporal: PASS (no acredita Gradle ni conectividad).
Regresión Node: 166/166, cero fallos (154 anteriores y 12 QA-12).
Consultar resultados/build-qa.txt y resultados/regresion.txt.
Las pruebas QA-12 cubren identidad y asociación de controles, foco y cancelación, límites y validación de IDs, confirmación/cancelación del puente, errores y abandono de pantalla.

La compilación Gradle, interacción Android y pruebas visuales en navegador NO se ejecutaron aquí. La instalación del navegador de pruebas no estuvo disponible. Estos resultados automatizados no sustituyen CP-25 ni acreditan Appium.

## Verificación CP-25 pendiente en el equipo del ejecutor

| Flujo | 360×800 | 412×915 | 800×360 / 915×412 | Escritorio 1366×768 | Android real + teclado |
| --- | --- | --- | --- | --- | --- |
| Login y errores por campo | pendiente | pendiente | pendiente | pendiente | pendiente |
| Registro candidato y empresa | pendiente | pendiente | pendiente | pendiente | pendiente |
| Buscar, filtrar y abrir detalle | pendiente | pendiente | pendiente | pendiente | pendiente |
| Confirmar/cancelar postulación | pendiente | pendiente | pendiente | pendiente | pendiente |
| Kanban, avance y rechazo | pendiente | pendiente | pendiente | pendiente | pendiente |

Para cada tamaño: comprobar que no se desplaza horizontalmente toda la página; el tablero sí permite desplazamiento horizontal dentro de su región. Recorrer Tab/Shift+Tab/Enter/Escape, asociar errores al campo, probar rotación y teclado sin ocultar permanentemente acciones. Desplazarse hasta la acción debe seguir siendo posible. Usar datos de QA existentes y registrar resultados reales, sin declarar éxitos por ver una pantalla.

## Interacción nativa y evidencia

1. Compilar e instalar el APK nuevo; iniciar sesión como candidato, abrir Empleos y esperar el catálogo.
2. Pulsar «Elegir habilidades en Android». Confirmar que aparece una lista Android con casillas, Aplicar y Cancelar.
3. Desplazar la lista con swipe; marcar una habilidad con tap y pulsar Cancelar. Los filtros y el contador deben conservarse.
4. Reabrir, desplazar y marcar una habilidad. Aplicar debe cambiar el contador/filtro y consultar con ese ID.
5. Intentar seleccionar una cuarta: máximo tres. Verificar que Atrás equivale a Cancelar.
6. Capturar pantalla y, con el diálogo abierto, ejecutar `adb shell uiautomator dump /sdcard/qa12-native.xml` y `adb pull /sdcard/qa12-native.xml ...` para conservar el árbol de controles reales. El ejemplo Appium está en tests/qa12/native_appium.py; no se declara ejecutado.

Conservar capturas de escritorio/móvil, teclado abierto, diálogo nativo y sus resultados. Registrar commit, hash SHA256 y versión APK (`android/app/build.gradle`), dispositivo, URL, datos y resultado. La URL temporal sigue dependiendo de Docker y del túnel.

## Cierre

Revisar dependencias QA-06/QA-10 y controles de docs/RUBRICA_EVALUACION.md. Enlazar ticket Jira si corresponde, CP-25, defectos/retest y riesgos residuales. Cierre después de CP-25 real y revisión cruzada/integración del PR. No se marca completo con las pruebas unitarias solamente.
