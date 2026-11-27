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
    'backendToFrontColumn',
    'frontToBackendColumn',
    'posicion',
    'etiquetaColumna',
    'isCandidateLocked',
    'puedeAvanzarA',
    'puedeRechazar',
    'getNextCol',
    'advanceCandidate',
    'ejecutarMovimiento',
    'onDrop',
    'onDragStart',
    'onDragEnd',
    'openRejectModal',
    'closeRejectModal',
    'confirmReject',
    'openProfile',
    'closeProfile',
    'cargarTablero'
  ]
);

function preparar() {
  const componente = new Harness();

  const llamadas = [];
  const consultas = [];
  const perfiles = [];
  const mensajes = [];

  const candidato = {
    id: '100',
    name: 'Candidato QA',
    column: 'received',
    jobId: '10'
  };

  const otro = {
    id: '200',
    name: 'Segundo candidato QA',
    column: 'interview',
    jobId: '10'
  };

  const orden = [
    'received',
    'review',
    'interview',
    'hired',
    'rejected'
  ];

  function operacion(tipo, ...args) {
    const solicitud = solicitudControlada();

    llamadas.push({
      tipo,
      args,
      solicitud
    });

    return solicitud;
  }

  Object.assign(componente, {
    selectedJobId: '10',
    selectedJob: {
      id: '10',
      title: 'Vacante QA',
      status: 'active',
      daysLeft: 30
    },

    candidates: [candidato, otro],
    tableroApi: null,
    selectedCandidate: null,
    perfilPostulante: null,
    perfilError: '',
    loadingPerfil: false,
    loadingJobs: false,
    loadingTablero: false,
    tableroError: '',
    isReadOnly: false,
    routeReadOnly: false,
    hireLimit: 1,
    hiredCount: 0,
    hiredCountState: 0,
    cuposDisponibles: 1,
    draggingId: null,
    dragOverCol: null,
    rejectTarget: null,
    rejectError: '',
    selectedMotivoId: null,
    motivosError: '',
    motivosRechazo: [
      { id: 1, motivo: 'Perfil no se ajusta' },
      { id: 2, motivo: 'Proceso cerrado' }
    ],

    procesandoMovimiento: false,
    tableroVersion: 0,
    perfilVersion: 0,

    ordenColumnas: orden,

    columns: orden.map(id => ({
      id,
      label: id
    })),

    subs: {
      add() {}
    },

    avisarNuevas() {},

    showToast(mensaje) {
      mensajes.push(mensaje);
    },

    kanbanService: {
      avanzar(...args) {
        return operacion('avanzar', ...args);
      },

      contratar(...args) {
        return operacion('contratar', ...args);
      },

      rechazar(...args) {
        return operacion('rechazar', ...args);
      },

      tablero(id) {
        const solicitud = solicitudControlada();

        consultas.push({ id, solicitud });

        return solicitud;
      },

      perfilPostulante(id) {
        const solicitud = solicitudControlada();

        perfiles.push({ id, solicitud });

        return solicitud;
      }
    }
  });

  return {
    componente,
    candidato,
    otro,
    llamadas,
    consultas,
    perfiles,
    mensajes
  };
}

function tablero(id, titulo, soloLectura = false) {
  return {
    vacante: {
      id,
      titulo,
      solo_lectura: soloLectura,
      max_contrataciones: 1,
      contratados: 0,
      cupos_disponibles: 1
    },
    columnas: []
  };
}

test('F01: doble avance genera una sola solicitud', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  componente.advanceCandidate(candidato);
  componente.advanceCandidate(candidato);

  assert.equal(llamadas.length, 1);
});

test('F02: doble confirmacion de rechazo genera una solicitud', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  candidato.column = 'review';

  componente.openRejectModal(candidato);
  componente.selectedMotivoId = 1;

  componente.confirmReject();
  componente.confirmReject();

  assert.equal(llamadas.length, 1);
});

test('F03: solo lectura impide avanzar desde el metodo', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  componente.isReadOnly = true;

  componente.advanceCandidate(candidato);

  assert.equal(llamadas.length, 0);
});

test('F04: respuesta antigua no reemplaza otra vacante', () => {
  const {
    componente, consultas
  } = preparar();

  componente.cargarTablero(10);

  componente.selectedJobId = '20';

  componente.cargarTablero(20);

  consultas[1].solicitud.responder(
    tablero(20, 'Vacante nueva')
  );

  consultas[0].solicitud.responder(
    tablero(10, 'Vacante anterior')
  );

  assert.equal(componente.tableroApi.vacante.id, 20);
  assert.equal(componente.jobTitle, 'Vacante nueva');
});

test('F05: respuesta de perfil anterior no expone datos de otro candidato', () => {
  const {
    componente, candidato, otro, perfiles
  } = preparar();

  componente.openProfile(candidato);
  componente.openProfile(otro);

  perfiles[1].solicitud.responder({
    nombre: 'Segundo candidato QA'
  });

  perfiles[0].solicitud.responder({
    nombre: 'Candidato QA'
  });

  assert.equal(
    componente.selectedCandidate.id,
    otro.id
  );

  assert.equal(
    componente.perfilPostulante.nombre,
    'Segundo candidato QA'
  );
});

test('F06: cerrar rechazo durante solicitud conserva contexto', () => {
  const {
    componente, candidato
  } = preparar();

  candidato.column = 'review';

  componente.openRejectModal(candidato);
  componente.selectedMotivoId = 1;

  componente.confirmReject();
  componente.closeRejectModal();

  assert.equal(
    componente.rejectTarget?.id,
    candidato.id
  );
});

test('F07: conflicto de contratacion actualiza tablero', () => {
  const {
    componente, otro, llamadas, consultas
  } = preparar();

  componente.advanceCandidate(otro);

  llamadas[0].solicitud.fallar({
    status: 409,
    error: {
      error_code: 'HIRING_LIMIT_REACHED',
      message: 'Limite alcanzado'
    }
  });

  assert.equal(consultas.length, 1);
  assert.equal(consultas[0].id, 10);
});

test('F08: respuesta API no elimina solo lectura de la ruta', () => {
  const {
    componente, consultas
  } = preparar();

  componente.routeReadOnly = true;
  componente.isReadOnly = true;

  componente.cargarTablero(10);

  consultas[0].solicitud.responder(
    tablero(10, 'Vacante QA', false)
  );

  assert.equal(componente.isReadOnly, true);
});

test('F09: rechazo exige seleccion explicita de motivo', () => {
  const {
    componente, candidato
  } = preparar();

  candidato.column = 'review';

  componente.openRejectModal(candidato);

  assert.equal(componente.selectedMotivoId, null);
});

test('F10: no contratar cuando no existen cupos', () => {
  const {
    componente, otro, llamadas
  } = preparar();

  componente.cuposDisponibles = 0;

  componente.advanceCandidate(otro);

  assert.equal(llamadas.length, 0);
});

test('F11: no permite saltar de recibido a contratado', () => {
  const {
    componente, candidato
  } = preparar();

  assert.equal(
    componente.puedeAvanzarA(candidato, 'hired'),
    false
  );
});

test('F12: estados finales no permiten avanzar', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  candidato.column = 'hired';
  componente.advanceCandidate(candidato);

  candidato.column = 'rejected';
  componente.advanceCandidate(candidato);

  assert.equal(llamadas.length, 0);
});

test('F13: rechazo sin motivo no genera solicitud', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  candidato.column = 'review';

  componente.openRejectModal(candidato);

  componente.selectedMotivoId = null;

  componente.confirmReject();

  assert.equal(llamadas.length, 0);
});

test('F14: motivo fuera del catalogo no genera rechazo', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  candidato.column = 'review';

  componente.openRejectModal(candidato);

  componente.selectedMotivoId = 999;

  componente.confirmReject();

  assert.equal(llamadas.length, 0);
});

test('F15: candidato de otra vacante no puede avanzar', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  candidato.jobId = '999';

  componente.advanceCandidate(candidato);

  assert.equal(llamadas.length, 0);
});

test('F16: cerrar perfil impide que respuesta tardia lo restaure', () => {
  const {
    componente, candidato, perfiles
  } = preparar();

  componente.openProfile(candidato);

  componente.closeProfile();

  perfiles[0].solicitud.responder({
    nombre: candidato.name
  });

  assert.equal(componente.selectedCandidate, null);
  assert.equal(componente.perfilPostulante, null);
});

test('F17: avance no simula exito antes de respuesta', () => {
  const {
    componente, candidato, llamadas, mensajes
  } = preparar();

  componente.advanceCandidate(candidato);

  assert.equal(llamadas.length, 1);
  assert.equal(componente.procesandoMovimiento, true);
  assert.equal(candidato.column, 'received');
  assert.equal(mensajes.length, 0);
});

test('F18: avance confirmado solicita tablero actualizado', () => {
  const {
    componente, candidato, llamadas, consultas, mensajes
  } = preparar();

  componente.advanceCandidate(candidato);

  llamadas[0].solicitud.responder({
    id: 100,
    estado: {
      codigo: 'en_revision',
      nombre: 'En revisión'
    },
    motivo_rechazo: null
  });

  assert.equal(componente.procesandoMovimiento, false);
  assert.equal(consultas.length, 1);
  assert.equal(consultas[0].id, 10);
  assert.equal(mensajes.length, 1);
});

test('F19: error de conexion no simula contratacion', () => {
  const {
    componente, otro, llamadas, consultas, mensajes
  } = preparar();

  componente.advanceCandidate(otro);

  llamadas[0].solicitud.fallar({
    status: 0
  });

  assert.equal(componente.procesandoMovimiento, false);
  assert.equal(otro.column, 'interview');
  assert.equal(consultas.length, 1);

  assert.ok(
    mensajes.some(m => m.includes('No se pudo confirmar'))
  );

  assert.ok(
    mensajes.every(m => !m.includes('correctamente'))
  );
});

test('F20: arrastre invalido no genera solicitud', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  componente.draggingId = candidato.id;

  componente.onDrop('hired', {
    preventDefault() {}
  });

  assert.equal(llamadas.length, 0);
});

test('F21: arrastre y boton comparten bloqueo', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  componente.advanceCandidate(candidato);

  componente.draggingId = candidato.id;

  componente.onDrop('review', {
    preventDefault() {}
  });

  assert.equal(llamadas.length, 1);
});

test('F22: rechazo confirmado envia motivo seleccionado', () => {
  const {
    componente, candidato, llamadas
  } = preparar();

  candidato.column = 'review';

  componente.openRejectModal(candidato);
  componente.selectedMotivoId = 2;

  componente.confirmReject();

  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].tipo, 'rechazar');

  assert.deepEqual(
    llamadas[0].args,
    [10, 100, 2]
  );
});
