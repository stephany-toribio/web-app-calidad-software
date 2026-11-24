# QA-03 — Resultados de validación del frontend

Fecha: 24/11/2026
Entorno: Windows 11, WSL2 y Docker Desktop.
Rama: feature/QA-03-configuracion-frontend-qa

## 1. Entorno

- Node.js: 22.22.1.
- npm: 9.2.0.
- Angular: 19.
- Dependencias instaladas mediante npm ci: 869 paquetes.
- API QA: localhost:8002.
- Frontend QA: localhost:4201.
- Nginx temporal: localhost:4203.

Se conserva el trabajo previo realizado sobre QA-03.

## 2. Compilaciones

| Compilación | Bundle inicial | Tiempo | Resultado |
| --- | ---: | ---: | --- |
| Estándar | 366.13 kB | 22.873 s | PASS |
| QA | 366.13 kB | 18.536 s | PASS |
| Angular Android | 366.15 kB | 18.716 s | PASS |

Se verificó la existencia de los tres artefactos.

Se comprobó la incorporación de la URL Android ficticia
en el JavaScript generado.

El archivo environment.android.generated.ts está
excluido de Git.

## 3. Validaciones negativas de Android

| Caso | Resultado |
| --- | --- |
| Variable ausente | PASS |
| URL relativa | PASS |
| HTTP sin cifrado | PASS |
| Localhost | PASS |
| IP loopback | PASS |
| Prefijo incorrecto | PASS |
| Credenciales en URL | PASS |
| Parámetros en URL | PASS |
| Fragmento en URL | PASS |

Resultado: 9/9 pruebas aprobadas.

## 4. Integración mediante proxy Angular

| Caso | Esperado | Obtenido | Resultado |
| --- | ---: | ---: | --- |
| Disponibilidad frontend | 200 | 200 | PASS |
| Perfil sin autenticación | 401 | 401 | PASS |
| Endpoint inexistente | 404 | 404 | PASS |
| Login sin campos | 422 | 422 | PASS |

Las tres respuestas negativas fueron JSON válidos.

## 5. Auditoría de dependencias

| Severidad | Completa | Producción |
| --- | ---: | ---: |
| Crítica | 2 | 0 |
| Alta | 14 | 4 |
| Moderada | 25 | 3 |
| Baja | 2 | 0 |
| Total | 43 | 7 |

Las alertas críticas corresponden a piscina y tar.

Las alertas altas de producción incluyen Angular common,
compiler, core y router.

La auditoría propone una actualización mayor de Angular.

No se ejecutó npm audit fix --force.

Las vulnerabilidades permanecen como riesgos residuales.
Su aplicabilidad y remediación requieren evaluación
antes de la publicación definitiva.

No se declara la aplicación libre de vulnerabilidades.

## 6. Alcance y limitaciones

- QA-03 prepara el frontend Angular para web y Android.
- No se ha generado todavía un APK.
- No se ha ejecutado Appium.
- No se ha acreditado conectividad HTTPS real desde Android.
- El dominio qa.example.test es ficticio.
- QA-10 implementará Capacitor y generará el APK.
- QA-13 preparará el despliegue HTTPS y CORS.
- QA-21 verificará la conexión real desde el APK.
- QA-32 verificará el despliegue definitivo.

## 7. Evidencias

- logs/npm-ci.log
- logs/build.log
- logs/build-qa.log
- logs/build-android.log
- logs/android-negativos.log
- logs/proxy-negativos.log
- logs/nginx-validacion.log

Los logs corresponden a las ejecuciones registradas
durante la validación de QA-03.


## 8. Artefacto estático servido mediante Nginx

| Caso | Resultado |
| --- | --- |
| SPA fallback | PASS |
| Perfil sin autenticación — 401 | PASS |
| Endpoint inexistente — 404 | PASS |
| Login sin campos — 422 | PASS |

El artefacto estándar conserva los estados HTTP y
las respuestas JSON mediante el reverse proxy local.

La publicación pública HTTPS permanece pendiente.
