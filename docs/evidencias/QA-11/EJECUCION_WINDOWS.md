# QA-11 — Ejecución real en Windows y Android

Fecha: 25/11/2026.
Ejecutor: Luis Valenzuela.
Dispositivo: Samsung SM-X900, Android 16, API 36.
Ambiente: https://maybe-partial-penguin-gadgets.trycloudflare.com

## Pruebas automatizadas
154 pruebas aprobadas, cero fallos:
135 regresiones existentes y 19 pruebas QA-11.
Evidencia: ejecucion-windows/regresion-completa.txt.

## PWA — Resultados confirmados por el ejecutor
- Sin red: vista offline y contenido privado oculto.
- Al reconectar sin recargar: formulario conservado.
- Recarga offline y recuperación de navegación: correctas.
- Cache Storage: 168 entradas revisadas, cero rutas API.
- Postulación, pago y tablero inaccesibles offline.
- Sin escrituras automáticas al reconectar.

## Actualización
- A activa: QA11-A.
- B preparada: aviso sin recarga automática.
- Cancelar actualización conservó el formulario.
- Aceptar actualización abrió QA11-B y permitió navegar.
- Ajuste posterior publicado y comprobado como QA11-B2.
- Actualización de prueba con hash inválido: aviso de descarga fallida.
- Tras restaurar B2: navegación correcta y etiqueta QA11-B2.

## APK evaluado
SHA256: D34FBE649271A763F4E25A462F17D4983F14993C90A7D0225AE39654437FFC81
Instalación: Success. Lanzamiento en frío: 941 ms.
- Vista offline, datos ocultos y recuperación: correctos.
- Postulación, pago y tablero inaccesibles offline.
- Sin escrituras automáticas al reconectar.
- Origen WebView: https://localhost.
- Controlador service worker: null.
- Control de actualización PWA: ausente.
El APK se compiló antes del ajuste posterior del aviso de actualización PWA.

## Datos
Vacantes publicadas: 9101 y 9102.
Vacante de pago: 9104, pendiente_pago, cero registros de pago.
Kanban: columnas conservadas según comprobación visual y Network.
El estado SQL posterior está en ejecucion-windows/estado-datos-posterior.txt;
no representa una comparación automática contra una instantánea SQL anterior.

## Límites
Las comprobaciones de tablet fueron manuales.
No se declara ejecución de Appium.
La URL temporal depende del túnel y Docker activos.
Revisión e integración del PR pendientes.
