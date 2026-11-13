# Portal de Empleos — Frontend para Calidad de Software

Frontend del portal CREO+, desarrollado con Angular 19, TypeScript 5.7 y Tailwind CSS 4. Esta copia se utiliza para preparar y evaluar los flujos web y móviles del curso.

Backend del mismo proyecto: [recruitment-api-calidad-software](https://github.com/stephany-toribio/recruitment-api-calidad-software).

## Alcance para Calidad de Software

El objetivo de esta copia del Portal de Empleos es evaluar un proceso completo con datos persistentes, permisos y decisiones de aprobación. La base de trabajo es `develop`; `main` conserva una versión anterior y las ramas `deploy/*` tienen ajustes de despliegue que deben revisarse antes de publicar una entrega.

### Flujo que se evaluará

1. Registrar candidatos y empresas e iniciar y cerrar sesión.
2. Registrar una vacante desde la cuenta de empresa.
3. Aprobar o no aprobar la vacante desde administración y completar el pago simulado cuando corresponda.
4. Buscar una vacante disponible, consultar su detalle y postular como candidato.
5. Revisar postulaciones desde la empresa propietaria y avanzar por Recibido, En revisión y Entrevista, hasta Contratado o Rechazado, según las transiciones permitidas.
6. Consultar el resultado y el historial; comprobar el retiro de una postulación cuando el estado lo permita.

### Reglas que deben tener evidencia

- Validación de campos, datos duplicados y persistencia después de volver a consultar.
- Autenticación, sesión y permisos por rol y por propietario del recurso.
- Publicación y disponibilidad de la vacante: aprobación, pago simulado exitoso, empresa activa, vigencia, estado y puestos aún disponibles.
- Una sola postulación por candidato y vacante, incluso ante solicitudes concurrentes.
- Transiciones válidas, motivo de rechazo cuando corresponda e historial de cambios.
- Integridad de los datos ante errores, retiros y solicitudes simultáneas.

### Herramientas y entregables previstos

| Herramienta | Qué se comprobará | Evidencia esperada |
| --- | --- | --- |
| Karate | Contratos API, validaciones, permisos, postulaciones y decisiones | Escenarios `.feature`, datos de prueba y reporte de ejecución |
| JMeter | Consultas, autenticación y postulaciones bajo concurrencia controlada | Plan `.jmx`, datos CSV cuando correspondan, resultados y reporte HTML |
| Selenium | Flujo web del candidato y de la empresa | Código, resultados y capturas de los casos ejecutados |
| Appium | Inicio de sesión, búsqueda, detalle y postulación en Android | Código, capabilities, versiones del dispositivo o emulador y resultados |
| Jira | Relación entre requisitos, casos, ejecuciones y defectos | Tickets y enlaces a las evidencias |

Estas evidencias están previstas para el curso. Los archivos o pantallas presentes en el repositorio no equivalen a una ejecución aprobada de las pruebas.

### Móvil y PWA

La prueba móvil debe ejecutarse con Appium en un dispositivo o emulador Android. La vista adaptable de un navegador de escritorio no sustituye esa ejecución.

La PWA es la opción propuesta para una entrega instalable. Su aceptación como producto móvil debe contrastarse con el requisito del profesor. Appium también permite automatizar Chrome en Android; técnicamente no requiere convertir primero la web en PWA. Si se elige PWA, habrá que implementar y verificar manifiesto, iconos, instalación, navegación, sesión y servicio de actualización o caché. No se presenta como funcionalidad terminada.

### Límites de esta entrega

El matching y la integración con servicios Python son complementarios: no bloquean el flujo principal ni las cuatro automatizaciones. Los pagos se simulan; no se integra una pasarela bancaria real. Los paneles y catálogos se incluirán en las pruebas cuando sean necesarios para preparar o completar el flujo elegido.

Las pruebas deben usar datos ficticios y una base de QA aislada. Antes de cada ejecución se registrarán las versiones del frontend y la API, la configuración utilizada, los datos y el resultado esperado. Un despliegue que abre correctamente no acredita por sí solo el cumplimiento del alcance.

## Estado de la base revisada

En `develop` existen servicios HTTP, interceptación de tokens, controles de navegación por rol y pantallas para registro, autenticación, vacantes, postulaciones y Kanban. Esta revisión del código no certifica todavía su funcionamiento de principio a fin.

| Elemento | Estado observado |
| --- | --- |
| Integración con API | Configurada mediante `src/environments/` y servicios en `src/app/core/api/` |
| Sesión | Token y usuario almacenados en `sessionStorage`; revocación mediante la API al cerrar sesión |
| Compilación | Hay un script `npm run build`; su resultado debe registrarse al ejecutar la línea base |
| Pruebas del frontend | No hay script `npm test` ni una suite Selenium o Appium versionada en la base revisada |
| PWA | No hay manifiesto, configuración de service worker ni dependencia `@angular/service-worker` en la base revisada |
| Despliegue | `deploy/frontend` incorpora una configuración de producción propia; debe revisarse junto con la API de QA |

## Requisitos

- Git con acceso al repositorio privado.
- Node.js 22.x y npm.

Angular CLI ya está declarado en las dependencias del proyecto; no hace falta instalar globalmente una versión diferente.

## Instalación local

```bash
git clone --branch develop https://github.com/stephany-toribio/web-app-calidad-software.git
cd web-app-calidad-software
npm ci
npm run start
```

La interfaz estará disponible en `http://localhost:4200`. La API debe estar levantada y contar con las migraciones y catálogos necesarios.

## Configuración de la API y compilación

En desarrollo se utiliza `src/environments/environment.development.ts`. En `develop`, la compilación de producción utiliza `src/environments/environment.ts`; ambos archivos apuntan actualmente a `http://localhost:8000/api/v1`.

Antes de generar una entrega de QA, establecer la URL de la API correspondiente al entorno de pruebas:

```bash
npm run build
```

La salida del navegador se genera en `dist/creo-angular/browser`. El alojamiento debe resolver las rutas de Angular hacia `index.html`.

La rama `deploy/frontend` añade `environment.production.ts` y el reemplazo de archivo para producción. La URL observada allí es `https://recruitment-api-empleo.onrender.com/api/v1`; su nombre no confirma que corresponda al entorno de esta copia. Verificar esa asociación antes de probar con escrituras o carga. Los ajustes de una rama de despliegue no se aplican automáticamente a `develop`.

Para Android, la URL del frontend y la API debe ser accesible desde el dispositivo o emulador. `localhost` dentro de Android identifica al propio dispositivo. Si se implementa la PWA, verificar también el contexto seguro necesario para el service worker.

## Cómo detectar errores antes del despliegue

1. Ejecutar `npm ci` y `npm run build` para detectar problemas de dependencias, TypeScript y plantillas.
2. Levantar frontend y API localmente y recorrer el flujo con cuentas ficticias de cada rol.
3. Revisar consola y red del navegador: URL, código HTTP, respuesta, token y mensajes de validación.
4. Ejecutar las pruebas API y web y comprobar en la base de QA los registros y estados esperados.
5. Repetir los casos móviles con Appium en Android y después hacer una prueba breve del despliegue de QA.

La compilación comprueba una parte de la aplicación. Las reglas de negocio, los permisos y el funcionamiento móvil requieren sus propias pruebas.

## Ramas y contribución

Crear las ramas de trabajo desde `develop` y presentar los cambios mediante Pull Request hacia esa rama. Seguir las convenciones de [CONTRIBUTING.md](CONTRIBUTING.md). Mantener separados el cambio funcional, el caso que lo verifica y su evidencia de ejecución.

## Referencias técnicas

- [Appium UiAutomator2: automatización Android y contexto web](https://github.com/appium/appium-uiautomator2-driver).
- [Angular: incorporación del service worker y recursos de PWA](https://angular.dev/ecosystem/service-workers/getting-started).
