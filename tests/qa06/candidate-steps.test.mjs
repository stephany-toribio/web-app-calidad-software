import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cargarMetodos,
  solicitudControlada
} from './harness.mjs';

const Harness = cargarMetodos(
  'src/app/screens/creo/creo-register-candidate/' +
  'creo-register-candidate.component.ts',
  'CreoRegisterCandidateComponent',
  [
    'handleNext',
    'llamarApi',
    'registrar',
    'goToStep',
    'hasErrors'
  ],
  {
    CAMPOS_PASO: {
      0: ['nombre', 'dni']
    },

    PASO_DE_ERROR: {
      firstName: 0,
      dni: 0,
      carreras: 1,
      skills: 3
    },

    erroresDesdeApi(error) {
      return error.erroresSimulados ?? {};
    },

    payloadCompleto() {
      return { nombre: 'Candidato QA' };
    },

    window: {
      scrollTo() {}
    }
  }
);

function preparar() {
  const componente = new Harness();

  const validacion = solicitudControlada();
  const registro = solicitudControlada();

  const peticiones = {
    validacion: [],
    registro: []
  };

  Object.assign(componente, {
    step: 0,
    enviando: false,
    registroCompletado: false,

    errors: {},

    firstName: 'Candidato QA',
    dni: '00000099',
    email: 'qa@example.test',

    _carreras: [],
    _educacionSuperior: [],
    estudios: [],
    idiomas: [],
    experiencias: [],
    skills: [],
    softSkills: [],

    erroresLocales() {
      return {};
    },

    payloadDelPaso() {
      return {
        nombre: this.firstName,
        dni: this.dni
      };
    },

    guardarBorrador() {},
    cargarHabilidades() {},
    corregirCatalogosRechazados() {},

    iniciarSesion() {
      this.registroCompletado = true;
    },

    candidatosService: {
      validarPaso(payload, campos) {
        peticiones.validacion.push({
          payload: structuredClone(payload),
          campos: structuredClone(campos)
        });

        return validacion;
      },

      registrar(payload) {
        peticiones.registro.push(
          structuredClone(payload)
        );

        return registro;
      }
    }
  });

  return {
    componente,
    validacion,
    registro,
    peticiones
  };
}

const evento = {
  preventDefault() {}
};

test('F33: Precognition exitoso permite avanzar', () => {
  const {
    componente, validacion, peticiones
  } = preparar();

  componente.handleNext(evento);
  componente.handleNext(evento);

  assert.equal(peticiones.validacion.length, 1);
  assert.equal(componente.step, 0);
  assert.equal(componente.enviando, true);

  validacion.responder(undefined);

  assert.equal(componente.step, 1);
  assert.equal(componente.enviando, false);
  assert.equal(peticiones.registro.length, 0);
});

test('F34: Precognition rechazado impide avanzar', () => {
  const { componente, validacion } = preparar();

  componente.handleNext(evento);

  validacion.fallar({
    status: 422,
    erroresSimulados: {
      dni: 'DNI duplicado'
    }
  });

  assert.equal(componente.step, 0);
  assert.equal(componente.enviando, false);
  assert.equal(componente.errors.dni, 'DNI duplicado');
});

test('F35: conserva datos personales ante error 422', () => {
  const { componente, validacion } = preparar();

  componente.handleNext(evento);

  validacion.fallar({
    status: 422,
    erroresSimulados: {
      dni: 'DNI duplicado'
    }
  });

  assert.equal(componente.firstName, 'Candidato QA');
  assert.equal(componente.dni, '00000099');
  assert.equal(componente.email, 'qa@example.test');
});

test('F36: registro definitivo vuelve al paso con error', () => {
  const {
    componente, registro, peticiones
  } = preparar();

  componente.step = 4;

  componente.handleNext(evento);

  assert.equal(peticiones.registro.length, 1);

  registro.fallar({
    status: 422,
    erroresSimulados: {
      carreras: 'Catalogo invalido'
    }
  });

  assert.equal(componente.step, 1);
  assert.equal(componente.enviando, false);
  assert.equal(componente.errors.carreras, 'Catalogo invalido');
});
