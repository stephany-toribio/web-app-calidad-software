import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cargarMetodos,
  solicitudControlada
} from '../qa06/harness.mjs';

const Detalle = cargarMetodos(
  'src/app/screens/creo/candidate-job-detail/' +
  'candidate-job-detail.component.ts',
  'CandidateJobDetailComponent',
  [
    'openApplyModal',
    'closeApplyModal',
    'confirmApply'
  ]
);

function prepararDetalle() {
  const componente = new Detalle();
  const solicitud = solicitudControlada();
  const peticiones = [];
  const mensajes = [];

  Object.assign(componente, {
    numericVacanteId: 10,
    applied: false,
    retirada: false,
    puedePostular: true,
    modoConsulta: 'disponible',
    loading: false,
    showApplyModal: false,
    submittingApply: false,
    applyError: '',
    applyRequestVersion: 0,
    detalleVersion: 0,

    subs: {
      add() {}
    },

    postulacionesService: {
      postular(id) {
        peticiones.push(id);
        return solicitud;
      }
    },

    showToast(mensaje) {
      mensajes.push(mensaje);
    }
  });

  return {
    componente,
    solicitud,
    peticiones,
    mensajes
  };
}

test('F01: cancelar antes de confirmar no envia solicitudes', () => {
  const { componente, peticiones } = prepararDetalle();

  componente.openApplyModal();
  componente.closeApplyModal();

  assert.equal(peticiones.length, 0);
  assert.equal(componente.showApplyModal, false);
});

test('F02: cierre durante POST conserva bloqueo', () => {
  const { componente, peticiones } = prepararDetalle();

  componente.openApplyModal();
  componente.confirmApply();
  componente.closeApplyModal();

  assert.equal(componente.submittingApply, true);
  assert.equal(componente.showApplyModal, true);

  componente.confirmApply();

  assert.equal(peticiones.length, 1);
});

test('F03: vacante no disponible impide confirmar', () => {
  const { componente, peticiones } = prepararDetalle();

  componente.openApplyModal();
  componente.puedePostular = false;

  componente.confirmApply();

  assert.equal(peticiones.length, 0);
});

test('F04: candidato retirado no puede volver a postular', () => {
  const { componente, peticiones } = prepararDetalle();

  componente.retirada = true;
  componente.applied = true;
  componente.showApplyModal = true;

  componente.confirmApply();

  assert.equal(peticiones.length, 0);
});

test('F05: exito solo tras respuesta del servidor', () => {
  const {
    componente, solicitud, mensajes
  } = prepararDetalle();

  componente.openApplyModal();
  componente.confirmApply();

  assert.equal(componente.applied, false);
  assert.equal(mensajes.length, 0);

  solicitud.responder({
    id: 100,
    estado: { codigo: 'recibido', nombre: 'Recibido' },
    retirada: false,
    vacante: { id: 10, titulo: 'Vacante QA' }
  });

  assert.equal(componente.applied, true);
  assert.equal(componente.puedePostular, false);
  assert.equal(componente.submittingApply, false);
  assert.equal(mensajes.length, 1);
});

test('F06: conflicto no permite nuevo envio', () => {
  const {
    componente, solicitud, peticiones
  } = prepararDetalle();

  componente.openApplyModal();
  componente.confirmApply();

  solicitud.fallar({
    status: 409,
    error: {
      error_code: 'DUPLICATE_APPLICATION',
      message: 'Postulacion duplicada'
    }
  });

  componente.confirmApply();

  assert.equal(peticiones.length, 1);
  assert.equal(componente.puedePostular, false);
});

test('F07: respuesta anterior no cambia otra vacante', () => {
  const { componente, solicitud, mensajes } = prepararDetalle();

  componente.openApplyModal();
  componente.confirmApply();

  componente.numericVacanteId = 20;
  componente.detalleVersion++;

  solicitud.responder({
    id: 100,
    estado: { codigo: 'recibido', nombre: 'Recibido' },
    retirada: false,
    vacante: { id: 10, titulo: 'Vacante anterior' }
  });

  assert.equal(componente.applied, false);
  assert.equal(componente.puedePostular, true);
  assert.equal(mensajes.length, 0);
});

const Aplicaciones = cargarMetodos(
  'src/app/screens/creo/candidate-applications/' +
  'candidate-applications.component.ts',
  'CandidateApplicationsComponent',
  [
    'openWithdraw',
    'closeWithdraw',
    'confirmWithdraw'
  ]
);

function prepararRetiro() {
  const componente = new Aplicaciones();
  const solicitud = solicitudControlada();
  const peticiones = [];
  const mensajes = [];

  const app = {
    id: 100,
    estado: {
      codigo: 'recibido',
      nombre: 'Recibido'
    },
    retirada: false,
    retirada_en: null,
    puede_retirar: true,
    vacante: {
      id: 10,
      titulo: 'Vacante QA'
    }
  };

  Object.assign(componente, {
    applications: [app],
    withdrawTargetApp: null,
    submittingWithdraw: false,
    consultaVersion: 0,
    loading: false,
    errorMessage: '',

    subs: {
      add() {}
    },

    postulacionesService: {
      retirar(id) {
        peticiones.push(id);
        return solicitud;
      }
    },

    cargarPostulaciones() {},

    showToast(mensaje) {
      mensajes.push(mensaje);
    }
  });

  return {
    componente,
    app,
    solicitud,
    peticiones,
    mensajes
  };
}

test('F08: cancelar retiro no genera solicitud', () => {
  const {
    componente, app, peticiones
  } = prepararRetiro();

  componente.openWithdraw(app);
  componente.closeWithdraw();

  assert.equal(componente.withdrawTargetApp, null);
  assert.equal(peticiones.length, 0);
});

test('F09: cierre durante PATCH conserva bloqueo', () => {
  const {
    componente, app, peticiones
  } = prepararRetiro();

  componente.openWithdraw(app);
  componente.confirmWithdraw();
  componente.closeWithdraw();

  assert.equal(componente.submittingWithdraw, true);
  assert.equal(componente.withdrawTargetApp.id, app.id);

  componente.confirmWithdraw();

  assert.equal(peticiones.length, 1);
});

test('F10: impide retirar postulacion no autorizada', () => {
  const {
    componente, app, peticiones
  } = prepararRetiro();

  app.puede_retirar = false;

  componente.openWithdraw(app);
  componente.confirmWithdraw();

  assert.equal(peticiones.length, 0);
});

test('F11: retiro conserva etapa confirmada por API', () => {
  const {
    componente, app, solicitud
  } = prepararRetiro();

  componente.openWithdraw(app);
  componente.confirmWithdraw();

  solicitud.responder({
    id: app.id,
    estado: {
      codigo: 'entrevista',
      nombre: 'Entrevista'
    },
    retirada: true,
    retirada_en: '2026-11-25T12:00:00Z'
  });

  const actualizada = componente.applications[0];

  assert.equal(actualizada.retirada, true);
  assert.equal(actualizada.puede_retirar, false);
  assert.equal(actualizada.estado.codigo, 'entrevista');
  assert.equal(
    actualizada.retirada_en,
    '2026-11-25T12:00:00Z'
  );
});

test('F12: error de retiro no simula exito', () => {
  const {
    componente, app, solicitud
  } = prepararRetiro();

  componente.openWithdraw(app);
  componente.confirmWithdraw();

  solicitud.fallar({
    status: 500,
    error: { message: 'Error del servidor' }
  });

  assert.equal(componente.submittingWithdraw, false);
  assert.equal(componente.applications[0].retirada, false);
  assert.equal(componente.applications[0].puede_retirar, true);
});

test('F13: vacante historica no permite postular', () => {
  const { componente, peticiones } = prepararDetalle();

  componente.modoConsulta = 'historico';

  componente.openApplyModal();
  componente.confirmApply();

  assert.equal(componente.showApplyModal, false);
  assert.equal(peticiones.length, 0);
});

test('F14: HTTP 404 bloquea nueva postulacion', () => {
  const {
    componente, solicitud, peticiones, mensajes
  } = prepararDetalle();

  componente.openApplyModal();
  componente.confirmApply();

  solicitud.fallar({
    status: 404,
    error: {
      error_code: 'VACANCY_NOT_AVAILABLE'
    }
  });

  componente.confirmApply();

  assert.equal(componente.puedePostular, false);
  assert.equal(componente.applied, false);
  assert.equal(componente.submittingApply, false);
  assert.equal(peticiones.length, 1);
  assert.equal(mensajes.length, 0);
  assert.ok(componente.applyError);
});

test('F15: error de conexion no confirma postulacion', () => {
  const {
    componente, solicitud, mensajes
  } = prepararDetalle();

  componente.openApplyModal();
  componente.confirmApply();

  solicitud.fallar({ status: 0 });

  assert.equal(componente.applied, false);
  assert.equal(componente.submittingApply, false);
  assert.equal(mensajes.length, 0);

  assert.match(
    componente.applyError,
    /No se pudo confirmar/
  );
});

test('F16: error antiguo no modifica otra vacante', () => {
  const { componente, solicitud } = prepararDetalle();

  componente.openApplyModal();
  componente.confirmApply();

  componente.detalleVersion++;
  componente.numericVacanteId = 20;
  componente.submittingApply = false;

  solicitud.fallar({
    status: 409,
    error: {
      error_code: 'DUPLICATE_APPLICATION'
    }
  });

  assert.equal(componente.applied, false);
  assert.equal(componente.puedePostular, true);
  assert.equal(componente.applyError, '');
});

test('F17: no permite retirar un recurso fuera del listado', () => {
  const {
    componente, app, peticiones
  } = prepararRetiro();

  componente.openWithdraw({
    ...app,
    id: 999
  });

  componente.confirmWithdraw();

  assert.equal(componente.withdrawTargetApp, null);
  assert.equal(peticiones.length, 0);
});

test('F18: conflicto de retiro solicita estado actualizado', () => {
  const {
    componente, app, solicitud, mensajes
  } = prepararRetiro();

  let consultas = 0;

  componente.cargarPostulaciones = () => {
    consultas++;
  };

  componente.openWithdraw(app);
  componente.confirmWithdraw();

  solicitud.fallar({
    status: 409,
    error: {
      error_code: 'APPLICATION_ALREADY_WITHDRAWN',
      message: 'Ya te retiraste de esta postulacion.'
    }
  });

  assert.equal(componente.withdrawTargetApp, null);
  assert.equal(componente.submittingWithdraw, false);
  assert.equal(consultas, 1);

  assert.equal(
    componente.applications[0].retirada,
    false
  );

  assert.equal(
    mensajes[0],
    'Ya te retiraste de esta postulacion.'
  );
});

test('F19: error de conexion en retiro solicita reconciliacion', () => {
  const {
    componente, app, solicitud, mensajes
  } = prepararRetiro();

  let consultas = 0;

  componente.cargarPostulaciones = () => {
    consultas++;
  };

  componente.openWithdraw(app);
  componente.confirmWithdraw();

  solicitud.fallar({ status: 0 });

  assert.equal(consultas, 1);
  assert.equal(componente.submittingWithdraw, false);
  assert.equal(componente.withdrawTargetApp, null);

  assert.match(
    mensajes[0],
    /No se pudo confirmar/
  );
});

test('F20: retiro modifica solamente la postulacion objetivo', () => {
  const {
    componente, app, solicitud
  } = prepararRetiro();

  const otra = {
    ...structuredClone(app),
    id: 200
  };

  componente.applications.push(otra);

  componente.openWithdraw(app);
  componente.confirmWithdraw();

  solicitud.responder({
    id: app.id,
    estado: {
      codigo: 'recibido',
      nombre: 'Recibido'
    },
    retirada: true,
    retirada_en: '2026-11-25T12:00:00Z'
  });

  assert.equal(
    componente.applications[0].retirada,
    true
  );

  assert.equal(
    componente.applications[1].retirada,
    false
  );

  assert.equal(
    componente.applications[1].puede_retirar,
    true
  );
});
