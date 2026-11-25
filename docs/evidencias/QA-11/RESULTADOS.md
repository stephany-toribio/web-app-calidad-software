# QA-11 — Resultados sobre la copia de codigo

Fecha: 25/11/2026. Base del ZIP: 3a70ad0e4b1cf978136500c6ec8ced4df3346c5b.
Ejecutor: asistente, sobre una copia aislada del archivo adjunto.
Entorno de comprobacion: Linux, Node.js 24.22.3, npm 11.19.1.
El entorno del equipo documenta Node.js 22: repetir las comprobaciones alli.
La copia recibida no incluye todos los archivos de configuracion de la raiz;
se entregan cambios de fuente, no estos bundles como distribucion final.

## Hallazgos de la base

- Cache de archivos estaticos ya configurada y SW desactivado en Capacitor.
- Sin gestion global encontrada de versionUpdates/unrecoverable ni vista offline.
- Sin bloqueo global de solicitudes API al detectar falta de red.
- Existian mensajes de resultado incierto para postulaciones y validaciones de sesion.
- No se observo una configuracion dataGroups que cacheara datos privados en la base.
  Se endurecieron exclusiones y bypass; no se afirma haber encontrado una filtracion.

## Ejecuciones realizadas

| Comprobacion | Resultado | Evidencia |
| --- | --- | --- |
| npm ci --ignore-scripts --no-audit --no-fund | Completado; 941 paquetes | Preparacion de esta copia |
| Regresiones existentes QA-05 a QA-09 | 135/135 PASS | logs/pruebas-node.txt |
| Nuevas pruebas QA-11 | 18/18 PASS | logs/pruebas-node.txt |
| Total Node | 153/153 PASS | logs/pruebas-node.txt |
| Build production | PASS | logs/build-production.txt |
| Build QA release A | PASS | logs/build-A.txt |
| Build QA release B | PASS | logs/build-B.txt |
| Angular Android, URL ficticia solo para compilar | PASS | logs/build-angular-android.txt |
| Publicacion A/B y archivos/hash del manifiesto | PASS local | logs/publicacion.txt |

La instalacion omitio scripts npm. No se modifico el lockfile ni se agregaron dependencias.
No se ejecutaron Gradle, ADB ni Appium en esta copia. El aviso npm http-proxy de
los logs pertenece al entorno del asistente. No se ejecutaron remediaciones de auditoria.

## Versiones de prueba generadas aqui

- A: `9df49bfc9a68c093c4d4770d09b161f7932430a3`
- B: `e5bfca5d507cf77ae89edb82049e1e150370ddee`

Estos hashes cambian al recompilar. Registrar los generados en la maquina del equipo.
Las etiquetas A/B cambian la etiqueta compilada, appData y el manifiesto;
no representan funcionalidades distintas ni una actualizacion observada en la tablet.
La etiqueta compilada identifica el codigo activo; la ultima version instalada
por el SW no se confunde con la version de una ventana anterior.

## Regresiones cubiertas

GET/POST/PUT/PATCH/DELETE offline; observable creado online y suscrito offline;
no reenvio al reconectar; fallo de transporte sin exito; preservacion de 422;
limites de origen/prefijo API; bypass NGSW sin un nuevo encabezado CORS;
contador de escrituras; cancelacion y aceptacion de recarga; bloqueo por escritura
y desconexion; VERSION_READY/INSTALLATION_FAILED/unrecoverable; estabilizacion
y fallo de comprobacion; SW deshabilitado en APK; aviso de salida por edicion;
configuracion NGSW generada sin API privada y con chunks precargados;
diferencia entre una version instalada por otra ventana y el codigo activo.
Los servicios Angular e interceptor se ejercitan con inyeccion real y dependencias
de navegador/SW simuladas; no son pruebas E2E del navegador.

## Aceptacion pendiente

| Familia | Estado |
| --- | --- |
| CP-26 — PWA offline, cache privada y recuperacion real | PENDIENTE en tablet |
| CP-27 — Postulacion, pago simulado y cambio de estado sin red, PWA/APK | PENDIENTE en tablet/API |
| CP-28 — A -> B, formulario, cancelacion y recuperacion real | PENDIENTE en PWA instalada |

Consultar PRUEBAS_MANUALES.md. Faltan las evidencias del ambiente del equipo,
la trazabilidad de casos/RUB/Jira cuando corresponda y la revision e integracion
exigidas por el issue. QA-11 permanece abierto; estos PASS no sustituyen la aceptacion.
