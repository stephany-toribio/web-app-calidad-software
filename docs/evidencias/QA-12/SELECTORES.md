# Convención de selectores QA-12

Web y contexto WEBVIEW de Appium: `[data-testid="identificador"]`. Campos compartidos reciben `testId` y lo trasladan al control HTML real; su id HTML es `creo-` + testId. Identificadores dinámicos usan la clave del registro, nunca la posición ni clases CSS. Las pruebas no usan los IDs automáticos de respaldo.

| Control | Identificador |
| --- | --- |
| Login | login-email, login-password, login-submit |
| Registro candidato | register-candidate-first-name, register-candidate-last-name, register-candidate-dni, register-candidate-email, register-candidate-phone, register-candidate-password, register-candidate-passwordConfirm, register-candidate-submit |
| Fecha de nacimiento | register-birthDay, register-birthMonth, register-birthYear |
| Empresa | register-company-raz-social, register-company-ruc, register-company-contact-name, register-company-email, register-company-password, register-company-submit |
| Buscar y filtros | jobs-search, jobs-filter-toggle |
| Tarjeta y acción de detalle | job-card-ID, job-open-ID |
| Postular | job-apply, confirm-apply, cancel-apply |
| Kanban | kanban-job-select, kanban-board, kanban-column-ID, kanban-card-ID |
| Acciones Kanban existentes | kanban-advance, kanban-history, kanban-reject-reason, kanban-confirm-reject |
| Abrir selector Android / resultado web | jobs-native-skills / jobs-native-selection |

Los submit de registro corresponden al paso actualmente visible. Para pasos posteriores se usa la misma acción semántica dentro del formulario visible.

En contexto NATIVE_APP:

| Control Android real | Localizador Appium |
| --- | --- |
| Lista desplazable | id: edu.upch.creo.qa:id/qa12_skill_list |
| Fila con casilla | Android UIAutomator: new UiSelector().className("android.widget.CheckedTextView").text("NOMBRE REAL") |
| Aplicar | id: android:id/button1 |
| Cancelar | id: android:id/button2 |

El nombre de fila identifica la habilidad del catálogo; no su posición. Swipe puede ejecutarse sobre los límites de la lista mediante mobile: scrollGesture; tap se realiza con click() sobre la fila y el botón. Volver a WEBVIEW para comprobar el filtro aplicado. El diálogo no es HTML ni un alert JavaScript.
