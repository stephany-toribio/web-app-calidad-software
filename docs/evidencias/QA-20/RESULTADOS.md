# Resultados de pruebas — QA-20

## Objetivo

Validar mediante Selenium los flujos empresariales y
administrativos del Portal de Empleos CREO+.

## Resultados consolidados

| Corrida | Pruebas | PASS | FAIL | Errores | Duracion (s) | JSON |
|---|---:|---:|---:|---:|---:|---:|
| full-01 | 9 | 9 | 0 | 0 | 108.273 | 17 |
| full-02 | 9 | 9 | 0 | 0 | 112.897 | 17 |
| demo-01 | 3 | 3 | 0 | 0 | 67.611 | 12 |
| demo-02 | 3 | 3 | 0 | 0 | 65.485 | 12 |

- Escenarios distintos aprobados: 9/9.
- Ejecuciones acumuladas definitivas: 24/24.
- Tasa de aprobacion: 100%.
- Evidencias JSON verificadas: 58.
- Registros residuales: 0 en cada corrida.
- Dos ejecuciones FULL consecutivas satisfactorias.
- Dos ejecuciones DEMO consecutivas satisfactorias.
- Las pruebas DEMO son un subconjunto de FULL.

Las duraciones corresponden a los reportes Surefire,
no al tiempo total de preparacion y limpieza.

## Ejecucion reproducible

Desde la raiz del repositorio frontend:

```bash
qa/selenium/scripts/run-qa20.sh full
qa/selenium/scripts/run-qa20.sh demo
```

## Incidencias

| ID | Descripcion | Resultado |
|---|---|---|
| INC-QA20-01 | Renderizado interrumpido por valores nulos | Corregido y validado |
| INC-QA20-02 | Serializacion incorrecta de evidencia JSON | Corregido y validado |
| OBS-QA20-03 | Inconsistencia de nulabilidad TypeScript | Corregido y validado |

Consultar [INCIDENCIAS.md](INCIDENCIAS.md).

## Observaciones pendientes

- OBS-QA20-01: formulario administrativo independiente.
- OBS-QA20-02: atributo SVG invalido.
- Dependencia QA-12: verificar estado antes del cierre formal.
- La cobertura de concurrencia no se acredita con el bloqueo secuencial.
- La ausencia de errores de consola en todo el portal no ha sido certificada.

## Conclusion

Los nueve escenarios automatizados de QA-20 aprobaron
las regresiones definitivas. Las comprobaciones API y MySQL
respaldan la persistencia de las decisiones de negocio.

Resultado tecnico de la suite: PASS.

El cierre administrativo requiere revisar las dependencias,
consolidar la trazabilidad y publicar el PR.
