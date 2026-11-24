# Contribución — Calidad de Software

## Ramas

- `main`: entrega estable coordinada de frontend y API.
- `develop`: integración del proyecto.
- `feature/QA-NN-descripcion`, `bugfix/QA-NN-descripcion` o `test/QA-NN-descripcion`: ramas temporales desde develop.

Puede haber una rama temporal por tarea activa de cada integrante. No hacen falta ramas permanentes de deploy o release. La rama documental actual es temporal y se elimina después de integrar su PR.

## Flujo de una tarea

1. Abrir la issue, comprobar dependencias y cumplir Definition of Ready.
2. Crear rama desde develop; relacionar requisito y casos CP.
3. Verificar primero el código existente, reproducir el fallo y cambiar solo lo necesario.
4. Ejecutar las comprobaciones apropiadas y conservar resultado/evidencia.
5. Abrir PR hacia develop, con issue, cambios, riesgos y pruebas realizadas.
6. Solicitar revisión de otro integrante; el autor no aprueba su propio cambio.
7. Resolver observaciones, hacer retest/regresión y registrar evidencia.
8. Integrar, cerrar conscientemente la issue cuando cumpla Done y eliminar la rama temporal.

Usar `Refs #N` mientras quede validación. Usar `Closes #N` solo si el merge realmente cumple todos los criterios de cierre de esa issue. La fusión de un PR no demuestra por sí sola que pasó el flujo de negocio.

## Commits

`tipo(QA-NN): descripción` con tipos `feat`, `fix`, `test`, `docs`, `refactor`, `chore`.

## Pruebas y documentación

Versionar las suites en las rutas previstas del README. Registrar comando, caso, commit, ambiente y resultado; distinguir no ejecutado de aprobado. No escribir pruebas que solo repitan la implementación ni rehacer módulos que ya cumplen con evidencia.

Las pruebas usan datos ficticios y un entorno aislado. Mantener fuera del repositorio credenciales reales, tokens y artefactos con datos privados. Los cambios de alcance se reflejan en ambos README, la matriz y el [plan maestro](https://github.com/stephany-toribio/recruitment-api-calidad-software/issues/3).

Consultar [docs/GESTION_PROYECTO.md](docs/GESTION_PROYECTO.md) para roles, hitos, estados, criterios y dependencias.
