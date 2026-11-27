import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cargarMetodos,
  solicitudControlada
} from '../qa06/harness.mjs';

const Harness = cargarMetodos(
  'src/app/screens/creo/company-kanban/' +
  'company-kanban.component.ts',
  'CompanyKanbanComponent',
  [
    'abrirHistorial',
    'cerrarHistorial'
  ]
);

function preparar() {
  const componente = new Harness();
  const llamadas = [];

  Object.assign(componente, {
    selectedJobId: '10',
    procesandoMovimiento: false,
    mostrarHistorial: false,
    cargandoHistorial: false,
    historialError: '',
    historial: null,
    historialVersion: 0,

    kanbanService: {
      historial(id) {
        const solicitud = solicitudControlada();

        llamadas.push({
          id,
          solicitud
        });

        return solicitud;
      }
    }
  });

  return { componente, llamadas };
}

function datos(id = 10) {
  return {
    vacante: {
      id,
      titulo: 'Vacante QA',
      solo_lectura: false,
      max_contrataciones: 1,
      contratados: 0,
      cupos_disponibles: 1
    },

    postulaciones: [
      {
        id: 100,
        candidato: {
          nombre: 'Candidato',
          apellidos: 'QA'
        },
        estado: {
          codigo: 'rechazado',
          nombre: 'Rechazado'
        },
        retirada: false,
        movimientos: [
          {
            id: 1,
            estado: {
              codigo: 'en_revision',
              nombre: 'En revisión'
            },
            motivo_rechazo: null,
            fecha_cambio: '2026-11-25T10:00:00Z'
          },
          {
            id: 2,
            estado: {
              codigo: 'rechazado',
              nombre: 'Rechazado'
            },
            motivo_rechazo: 'Perfil no se ajusta',
            fecha_cambio: '2026-11-25T11:00:00Z'
          }
        ]
      }
    ]
  };
}

test('H01: historial consulta vacante seleccionada', () => {
  const { componente, llamadas } = preparar();

  componente.abrirHistorial();

  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].id, 10);
  assert.equal(componente.mostrarHistorial, true);
  assert.equal(componente.cargandoHistorial, true);
});

test('H02: historial conserva movimientos y motivo', () => {
  const { componente, llamadas } = preparar();

  componente.abrirHistorial();

  llamadas[0].solicitud.responder(datos());

  assert.equal(componente.cargandoHistorial, false);

  assert.equal(
    componente.historial.postulaciones[0].movimientos.length,
    2
  );

  assert.equal(
    componente.historial.postulaciones[0]
      .movimientos[1].motivo_rechazo,
    'Perfil no se ajusta'
  );
});

test('H03: historial incluye postulaciones retiradas', () => {
  const { componente, llamadas } = preparar();

  const respuesta = datos();

  respuesta.postulaciones.push({
    id: 200,
    retirada: true,
    retirada_en: '2026-11-25T12:00:00Z',
    estado: {
      codigo: 'entrevista',
      nombre: 'Entrevista'
    },
    movimientos: []
  });

  componente.abrirHistorial();

  llamadas[0].solicitud.responder(respuesta);

  assert.equal(
    componente.historial.postulaciones[1].retirada,
    true
  );

  assert.equal(
    componente.historial.postulaciones[1].estado.codigo,
    'entrevista'
  );
});

test('H04: historial vacio no inventa postulaciones', () => {
  const { componente, llamadas } = preparar();

  componente.abrirHistorial();

  llamadas[0].solicitud.responder({
    ...datos(),
    postulaciones: []
  });

  assert.equal(
    componente.historial.postulaciones.length,
    0
  );
});

test('H05: error 403 no conserva informacion previa', () => {
  const { componente, llamadas } = preparar();

  componente.historial = datos();

  componente.abrirHistorial();

  llamadas[0].solicitud.fallar({
    status: 403,
    error: {
      message: 'Acceso denegado'
    }
  });

  assert.equal(componente.historial, null);
  assert.equal(componente.cargandoHistorial, false);
  assert.equal(componente.historialError, 'Acceso denegado');
});

test('H06: cerrar historial invalida respuesta pendiente', () => {
  const { componente, llamadas } = preparar();

  componente.abrirHistorial();
  componente.cerrarHistorial();

  llamadas[0].solicitud.responder(datos());

  assert.equal(componente.mostrarHistorial, false);
  assert.equal(componente.historial, null);
});

test('H07: respuesta antigua no sobrescribe otra vacante', () => {
  const { componente, llamadas } = preparar();

  componente.abrirHistorial();

  componente.selectedJobId = '20';

  componente.abrirHistorial();

  llamadas[1].solicitud.responder(datos(20));
  llamadas[0].solicitud.responder(datos(10));

  assert.equal(componente.historial.vacante.id, 20);
});

test('H08: movimiento pendiente impide abrir historial', () => {
  const { componente, llamadas } = preparar();

  componente.procesandoMovimiento = true;

  componente.abrirHistorial();

  assert.equal(llamadas.length, 0);
  assert.equal(componente.mostrarHistorial, false);
});

test('H09: reintento recupera historial despues de error', () => {
  const { componente, llamadas } = preparar();

  componente.abrirHistorial();

  llamadas[0].solicitud.fallar({ status: 500 });

  assert.ok(componente.historialError);

  componente.abrirHistorial();

  llamadas[1].solicitud.responder(datos());

  assert.equal(componente.historialError, '');
  assert.equal(componente.historial.vacante.id, 10);
});

test('H10: identificador invalido no genera solicitud', () => {
  const { componente, llamadas } = preparar();

  for (const id of ['', 'abc', '-1', '1.5']) {
    componente.selectedJobId = id;

    componente.abrirHistorial();
  }

  assert.equal(llamadas.length, 0);
});
