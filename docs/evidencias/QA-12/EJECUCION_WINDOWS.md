# QA-12 — Ejecución Windows y Android

Fecha: 2026-11-25T17:08:18.2618694-05:00
Ejecutor: Luis Valenzuela.
Commit base: 4b4a66a27175a36a8fca8c07714e7d60410ef9fe
Implementación: commit que contiene este registro.
Dispositivo: Samsung SM-X900, Android 16, API 36.
Paquete: edu.upch.creo.qa
SHA256 APK: E4E74B09B6DD858947CD8CAF40CE8C315237189A1FE0365DA82B0AFD613EB7E2

## Resultados verificados
- Windows: 12 pruebas QA-12 aprobadas, cero fallos.
- Compilación QA completada.
- APK abierto en Android: origen https://localhost, plataforma android.
- Cancelar descarta cambios y conserva la selección anterior.
- Aplicar actualiza los filtros y la búsqueda.
- Límite de tres habilidades comprobado.
- Desplazamiento y selección de habilidades comprobados manualmente.
- XML confirma android.widget.ListView y botones Android Aplicar/Cancelar.
- Evidencias: native-habilidades.png y native-habilidades.xml.
- Captura adicional de Kanban conservada en esta carpeta.
- El ejecutor indicó haber realizado la revisión en Chrome.

## Alcance y pendientes
- Interacción Android comprobada manualmente; Appium no ejecutado.
- Falta confirmar y registrar resultados detallados por flujo en
  360x800 y 412x915, teclado, foco y orientación.
- Revisar dependencias QA-06/QA-10 y trazabilidad aplicable.
- Revisión cruzada e integración del PR pendientes.
- El túnel HTTPS es temporal.
- QA-12 permanece abierto hasta completar su condición de cierre.

## Confirmación final de CP-25

El ejecutor confirma resultados satisfactorios:
- 360x800 y 412x915: registro, login, búsqueda, detalle,
  postulación y Kanban utilizables, sin desbordamiento global.
- Android: rotación y teclado virtual permiten acceder
  a los campos y acciones principales.
- PC: foco visible con Tab, activación con Enter
  y cierre de diálogos con Escape.
- Selector nativo: Cancelar, Aplicar, máximo tres habilidades
  y desplazamiento con selección funcionan correctamente.

Esta actualización sustituye los pendientes anteriores
de confirmación manual de tamaños, teclado, foco y orientación.
Las comprobaciones fueron manuales; no se declara Appium ejecutado.
La revisión cruzada e integración se registrarán en el PR.
