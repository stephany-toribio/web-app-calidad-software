import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cargarMetodos,
  solicitudControlada
} from '../qa06/harness.mjs';

const Harness = cargarMetodos(
  'src/app/screens/creo/candidate-applications/' +
  'candidate-applications.component.ts',
  'CandidateApplicationsComponent',
  [
    'cargarPostulaciones',
    'openWithdraw',
    'closeWithdraw',
    'confirmWithdraw',
    'viewJobDetail'
  ]
);

function preparar() {
  const componente = new Harness();

  const consultas = [];
  const retiros = [];
  const mensajes = [];
  const navegaciones = [];

  const app = {
    id: 100,
    estado: {
      codigo: 'recibido',
      nombre: 'Recibido'
    },
    retirada: false,
    retirada_en: null,
    puede_retirar: true,
    ver_vacante: 'disponible',
    vacante: {
      id: 10,
      titulo: 'Vacante QA'
    }
  };

  Object.assign(componente, {
    applications: [structuredClone(app)],
    withdrawTargetApp: null,
    submittingWithdraw: false,
    consultaVersion: 0,
    loading: false,
    errorMessage: '',

    subs: {
      add() {}
    },

    avisarCambios() {},

    postulacionesService: {
      misPostulaciones() {
        const consulta = solicitudControlada();

        consultas.push(consulta);

        return consulta;
      },

      retirar(id) {
        const solicitud = solicitudControlada();

        retiros.push({ id, solicitud });

        return solicitud;
      }
    },

    showToast(mensaje) {
      mensajes.push(mensaje);
    },

    router: {
      navigate(ruta, opciones) {
        navegaciones.push({
          ruta: structuredClone(ruta),
          opciones: structuredClone(opciones)
        });
      }
    }
  });

  return {
    componente,
    consultas,
    retiros,
    mensajes,
    navegaciones,
    app
  };
}

test('F21: refresco antiguo no sobrescribe retiro confirmado', () => {
  const {
    componente, consultas, retiros, app
  } = preparar();

  componente.cargarPostulaciones(true);

  assert.equal(consultas.length, 1);

  componente.openWithdraw(componente.applications[0]);
  componente.confirmWithdraw();

  retiros[0].solicitud.responder({
    id: app.id,
    estado: {
      codigo: 'entrevista',
      nombre: 'Entrevista'
    },
    retirada: true,
    retirada_en: '2026-11-25T12:00:00Z'
  });

  // Simulamos una respuesta antigua que llega tarde.
  consultas[0].responder([structuredClone(app)]);

  assert.equal(componente.applications[0].retirada, true);
  assert.equal(componente.applications[0].puede_retirar, false);
  assert.equal(componente.applications[0].estado.codigo, 'entrevista');
});

test('F22: consulta mas reciente prevalece', () => {
  const {
    componente, consultas, app
  } = preparar();

  componente.cargarPostulaciones(true);
  componente.cargarPostulaciones(true);

  consultas[1].responder([{
    ...app,
    estado: {
      codigo: 'entrevista',
      nombre: 'Entrevista'
    }
  }]);

  consultas[0].responder([app]);

  assert.equal(
    componente.applications[0].estado.codigo,
    'entrevista'
  );
});

test('F23: no refresca durante confirmacion o retiro', () => {
  const {
    componente, consultas
  } = preparar();

  componente.openWithdraw(componente.applications[0]);

  componente.cargarPostulaciones(true);

  assert.equal(consultas.length, 0);

  componente.confirmWithdraw();
  componente.cargarPostulaciones(true);

  assert.equal(consultas.length, 0);
});

test('F24: error de refresco silencioso conserva listado', () => {
  const {
    componente, consultas
  } = preparar();

  componente.cargarPostulaciones(true);

  consultas[0].fallar({
    status: 500
  });

  assert.equal(componente.applications.length, 1);
  assert.equal(componente.errorMessage, '');
  assert.equal(componente.loading, false);
});

test('F25: conflicto de retiro reconcilia estado con GET', () => {
  const {
    componente, consultas, retiros, app
  } = preparar();

  componente.openWithdraw(componente.applications[0]);
  componente.confirmWithdraw();

  retiros[0].solicitud.fallar({
    status: 409,
    error: {
      error_code: 'APPLICATION_NOT_WITHDRAWABLE'
    }
  });

  assert.equal(consultas.length, 1);

  consultas[0].responder([{
    ...app,
    estado: {
      codigo: 'contratado',
      nombre: 'Contratado'
    },
    puede_retirar: false
  }]);

  assert.equal(
    componente.applications[0].estado.codigo,
    'contratado'
  );

  assert.equal(
    componente.applications[0].puede_retirar,
    false
  );

  componente.openWithdraw(componente.applications[0]);
  componente.confirmWithdraw();

  assert.equal(retiros.length, 1);
});

test('F26: detalle disponible utiliza ID de vacante', () => {
  const {
    componente, app, navegaciones
  } = preparar();

  componente.viewJobDetail(app);

  assert.deepEqual(
    navegaciones[0].opciones.queryParams,
    { id: 10 }
  );
});

test('F27: detalle historico utiliza ID de postulacion', () => {
  const {
    componente, app, navegaciones
  } = preparar();

  componente.viewJobDetail({
    ...app,
    ver_vacante: 'historico'
  });

  assert.deepEqual(
    navegaciones[0].opciones.queryParams,
    { postulacionId: 100 }
  );
});

test('F28: detalle no autorizado no genera navegacion', () => {
  const {
    componente, app, navegaciones
  } = preparar();

  componente.viewJobDetail({
    ...app,
    ver_vacante: null
  });

  assert.equal(navegaciones.length, 0);
});
