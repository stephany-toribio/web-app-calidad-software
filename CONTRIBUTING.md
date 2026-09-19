# Guía de contribución

Este repositorio forma parte del proyecto Portal de Empleos — 2026-II.

## Estrategia de ramas

El proyecto utiliza Gitflow.

### Ramas permanentes

- `main`: contiene versiones estables.
- `develop`: integra el trabajo del equipo durante el desarrollo.

### Ramas temporales

- `feature/*`: desarrollo de nuevas funcionalidades.
- `bugfix/*`: correcciones durante el desarrollo.
- `release/*`: preparación de versiones o entregas.
- `hotfix/*`: correcciones urgentes sobre una versión estable.

## Creación de ramas

Las ramas `feature/*` y `bugfix/*` deben crearse desde `develop`.

Formato:

`tipo/ID-descripcion-corta`

Ejemplos:

`feature/HU-01-registro-candidato`

`feature/D1-07-angular-base`

`bugfix/HU-03-validacion-vacante`

## Convención de commits

Se utilizará el formato:

`tipo(ID): descripción`

Tipos principales:

- `feat`: nueva funcionalidad.
- `fix`: corrección de errores.
- `docs`: documentación.
- `test`: pruebas.
- `refactor`: refactorización.
- `chore`: tareas de mantenimiento.

Ejemplos:

`feat(HU-01): add candidate registration`

`fix(HU-05): prevent duplicate applications`

`docs(D1-02): document gitflow workflow`

## Pull Requests

Todo cambio debe integrarse mediante Pull Request.

Flujo normal:

`feature/* → develop`

Reglas:

- No desarrollar directamente sobre `main`.
- No desarrollar directamente sobre `develop`.
- Relacionar el Pull Request con el Issue correspondiente.
- Solicitar revisión de al menos otro integrante.
- No integrar cambios con errores conocidos.
- El autor no debe considerar su propia revisión como aprobación.
- Eliminar la rama temporal después del merge.

## Releases

Las entregas se preparan mediante ramas:

`release/*`

Las correcciones urgentes de una versión estable utilizan:

`hotfix/*`
