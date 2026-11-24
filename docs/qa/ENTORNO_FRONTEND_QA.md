# Entorno frontend QA — QA-03

## Configuraciones

| Configuración | API | Ejecución |
| --- | --- | --- |
| development | http://localhost:8002/api/v1 | npm.cmd start |
| qa | /api/v1, relativa al origen del frontend | npm.cmd run start:qa |

La configuración production utiliza /api/v1. El servidor debe enrutar este prefijo hacia la API. La compatibilidad del despliegue productivo queda pendiente de verificación.
Para generar el artefacto de QA se debe usar expresamente build:qa.

## Preparación reproducible

1. Usar Node.js 22 y npm 10. Verificar las versiones en cada terminal.
2. Instalar las dependencias del lockfile: npm.cmd ci.
3. Preparar la API siguiendo su documentación de QA-02.
4. Mantener Docker y la API disponibles en http://127.0.0.1:8002.
5. Compilar: npm.cmd run build:qa.
6. Iniciar: npm.cmd run start:qa.
7. Abrir http://127.0.0.1:4201.

Las credenciales de fixtures se configuran en el entorno local de la API.
No incluir contraseñas, tokens ni archivos .env en evidencias o commits.

## Artefacto y publicación

El build QA se genera en dist/creo-angular-qa.
Los archivos que se publiquen deben corresponder al directorio que contiene index.html.

proxy.qa.json funciona únicamente con el servidor de desarrollo.
No se incorpora como un proxy ejecutable dentro del artefacto compilado.

La publicación debe proporcionar:
- HTTPS para el frontend.
- Enrutamiento de /api/v1 hacia la API QA correspondiente.
- Resolución de rutas internas de Angular mediante index.html.
- Respuestas de la API conservadas, sin convertir errores API en index.html.

El artefacto QA usa /api/v1 y no incorpora localhost como destino de la API.
Esto permite preparar su acceso desde Android cuando exista la publicación.
La publicación y la verificación en Android siguen pendientes.

## Validación local realizada — 24/11/2026

Resultados observados por el integrante que ejecutó las comprobaciones:

| Comprobación | Resultado |
| --- | --- |
| npm ci con Node 22.23.5 y npm 10.9.9 | Instalación completada |
| npm run build:qa | Completado con Node 22.23.5 y npm 10.9.9; bundle inicial 366.13 kB |
| npm run start:qa | Servidor disponible en 127.0.0.1:4201 |
| POST /api/v1/auth/login mediante proxy QA | 200 OK |
| GET /api/v1/candidatos/me mediante proxy QA | 200 OK |
| GET /api/v1/candidatos/me después de F5 en Mi perfil | 200 OK |
| git diff --check antes de añadir este documento | Sin errores de espacios; avisos LF/CRLF |

La recarga se comprobó mediante ng serve. No acredita todavía el
enrutamiento de un servidor que publique el artefacto estático.

Las pruebas previas del entorno development incluyeron un login inválido
con respuesta 401. Ese caso no se ha repetido mediante el proxy QA.

## Dependencias y pendientes

La auditoría inicial reportó 52 vulnerabilidades.
Se ejecutó npm audit fix sin --force y se actualizaron 11 paquetes.

La auditoría posterior reportó 43 vulnerabilidades:
2 bajas, 25 moderadas, 14 altas y 2 críticas.
Permanecen alertas críticas en piscina y tar, y alertas en Angular.
Su aplicabilidad y remediación siguen pendientes de revisión.
No se realizó una migración mayor de Angular.

Después de actualizar:
- npm run build:qa completó correctamente.
- Login y consulta del perfil respondieron 200 OK en el artefacto servido.
- La recarga con F5 en Mi perfil funcionó correctamente.

Pendientes de verificación:
- Instalación del entorno y ejecución de las comprobaciones en otra máquina.
- Verificación del clon remoto de GitHub después de publicar la rama.
- Revisión cruzada de la configuración y las evidencias.
- Publicación HTTPS y conexión con la API QA.
- Acceso desde Android.
- Implementación y pruebas de instalación, actualización y offline de la PWA
  en las tareas correspondientes.

Estas comprobaciones locales no declaran QA-03 completamente aprobada.

## Verificación del artefacto estático

Se sirvió dist/creo-angular-qa/browser con Nginx en Docker,
mediante http://127.0.0.1:4202.

Configuración: docker/qa/nginx.conf.
Red Docker: calidad_software_calidad_network.
Destino interno de /api/: http://app:8000.

| Comprobación | Resultado observado |
| --- | --- |
| POST /api/v1/auth/login | 200 OK |
| GET /api/v1/candidatos/me | 200 OK |
| F5 en Mi perfil | Página funcional y consulta del perfil con 200 OK |

Esta prueba verifica el artefacto compilado y la recarga de rutas
internas con la configuración local de Nginx. HTTPS y Android
permanecen pendientes.
## Reproducir la prueba del artefacto con Docker Desktop

Con la API encendida y después de ejecutar npm.cmd run build:qa,
ejecutar desde la raíz del frontend en PowerShell:

```powershell
$qaBuild = (Resolve-Path "dist/creo-angular-qa/browser").Path
$qaNginx = (Resolve-Path "docker/qa/nginx.conf").Path

docker run --detach --rm `
    --name creo-qa03-preview `
    --network calidad_software_calidad_network `
    --publish 127.0.0.1:4202:80 `
    --mount "type=bind,source=$qaBuild,target=/usr/share/nginx/html,readonly" `
    --mount "type=bind,source=$qaNginx,target=/etc/nginx/conf.d/default.conf,readonly" `
    nginx:stable-alpine
```

Abrir http://127.0.0.1:4202.
El nombre del contenedor debe estar disponible.
Para detener esta vista previa: docker stop creo-qa03-preview.

Imagen usada en la comprobación:
nginx:stable-alpine
Digest: sha256:8eb2b5540eae779603cc3db84b3986a15ecb5308b54303146eee9837c137b51a

La etiqueta puede cambiar; para reproducir la misma imagen se puede usar
nginx@sha256:8eb2b5540eae779603cc3db84b3986a15ecb5308b54303146eee9837c137b51a.

## Instalación desde clon limpio local

Se verificó el commit d53b832 mediante un clon local independiente,
sin reutilizar node_modules ni la caché Angular del directorio original.

- Node.js: 22.23.5.
- npm: 10.9.9.
- npm ci: completado; 865 paquetes instalados.
- npm run build:qa: completado; bundle inicial de 366.13 kB.
- git ls-files .angular: sin archivos versionados.
- git status --short después de instalar y compilar: sin cambios.
- Auditoría: 43 alertas; 2 bajas, 25 moderadas, 14 altas y 2 críticas.

Esta prueba se realizó en la misma máquina mediante clon local.
No acredita todavía la reproducción en otra máquina ni desde GitHub.

## Ampliación del alcance — Android y Capacitor

### Configuraciones vigentes

| Ambiente | API | Comando |
| --- | --- | --- |
| Desarrollo | localhost:8002/api/v1 | npm start |
| Web QA | /api/v1 | npm run build:qa |
| Producción web | /api/v1 | npm run build |
| Android QA | URL absoluta HTTPS | npm run build:android |

### Compilación Android

La variable ANDROID_API_URL es obligatoria.

El script scripts/build-android.mjs genera la configuración
environment.android.generated.ts y ejecuta Angular con
la configuración android.

El archivo generado está excluido de Git.

El artefacto se genera en dist/creo-angular-android/browser.

Ejemplo de validación del build desde WSL:

    ANDROID_API_URL=https://qa.example.test/api/v1 npm run build:android

El dominio utilizado es ficticio y sirve exclusivamente
para comprobar la compilación, no la conectividad.

La URL definitiva será proporcionada mediante QA-13.

### Integración con Capacitor

QA-10 utilizará el artefacto Android como base para
configurar el webDir de Capacitor.

Los proxies de Angular y Nginx no se incorporan como
servidores dentro del APK.

El APK requiere una URL absoluta de la API.

### Origen WebView y CORS

El origen previsto es https://localhost si se conserva
la configuración habitual de Capacitor para Android.

El origen efectivo deberá confirmarse en QA-10.

QA-13 configurará HTTPS, los orígenes CORS autorizados,
los métodos y los encabezados necesarios.

No se desactivarán globalmente las protecciones CORS.

QA-21 comprobará la conectividad real desde el APK,
incluyendo solicitudes preflight cuando correspondan.

### Distribución de responsabilidades

| Tarea | Responsabilidad |
| --- | --- |
| QA-03 | Configuración y compilación Angular |
| QA-10 | Capacitor, PWA y generación APK |
| QA-13 | Despliegue HTTPS y CORS |
| QA-21 | Conectividad APK y preparación Appium |
| QA-22 | Automatización Android E2E |

QA-03 no acredita todavía la generación del APK
ni la ejecución de Appium.

### Seguridad de dependencias

Evaluar las vulnerabilidades según su aplicabilidad,
distinguiendo dependencias de desarrollo y producción.

No ejecutar npm audit fix --force sin evaluar el impacto.

### Validaciones adicionales

- Compilación estándar.
- Compilación web QA.
- Compilación Angular Android parametrizada.
- Rechazo de configuraciones Android inválidas.
- Respuestas negativas de la API mediante proxy QA.
- Auditoría actualizada de dependencias.

Los resultados se registrarán después de ejecutar
las comprobaciones correspondientes.


## Resultados de la ampliación QA-03

Las tres configuraciones Angular fueron compiladas
correctamente desde WSL2.

Se aprobaron nueve pruebas negativas de configuración
Android y las comprobaciones HTTP 401, 404 y 422
mediante el proxy de desarrollo.

El detalle de las ejecuciones adicionales, los logs,
los riesgos de seguridad y las limitaciones se encuentra
en [RESULTADOS QA-03](../evidencias/QA-03/RESULTADOS.md).

La revisión cruzada formal no constituye un requisito
de cierre según la decisión vigente del equipo.
Se mantienen la validación técnica, las evidencias
reproducibles y la integración en develop.
