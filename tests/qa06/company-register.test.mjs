import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cargarMetodos,
  solicitudControlada
} from './harness.mjs';

const Harness = cargarMetodos(
  'src/app/screens/creo/creo-register-company/' +
  'creo-register-company.component.ts',
  'CreoRegisterCompanyComponent',
  [
    'handleSubmit',
    'buildPayload',
    'validateStep1',
    'validateStep2',
    'hasErrors',
    'mapBackendErrors',
    'iniciarSesionDespuesDelRegistro',
    'nextStep',
    'validarPrimerPaso',
    'validarSegundoPaso',
    'prevStep',
    'goToStep',
    'goToLanding'
  ]
);

function preparar() {
  const componente = new Harness();

  const registro = solicitudControlada();
  const login = solicitudControlada();
  const validacion = solicitudControlada();

  const peticiones = {
    registro: [],
    validacion: [],
    login: [],
    navegacion: []
  };

  Object.assign(componente, {
    currentStep: 2,
    isSubmitting: false,
    isValidating: false,
    registroCompletado: false,

    errors: {},
    rucStatus: 'idle',

    razSocial: 'Empresa Ficticia QA',
    descripcion: 'Empresa de prueba',
    ruc: '20000000001',
    sector: 'Tecnología e Informática',
    website: 'https://empresa.example.test',

    email: 'empresa@qa.example.test',
    password: 'SoloFixture#1',
    contactName: 'Responsable QA',

    MAX_CAMPO_CARACTERES: 255,
    MAX_DESCRIPCION_CARACTERES: 250,
    MAX_PASSWORD_CARACTERES: 120,

    passLength: true,
    passUppercase: true,
    passNumber: true,
    passSymbol: true,
    passMaxLength: true,

    scrollTop() {},

    empresasService: {
      registrar(payload) {
        peticiones.registro.push(
          structuredClone(payload)
        );

        return registro;
      },

      validarPaso(payload, campos) {
        peticiones.validacion.push({
          payload: structuredClone(payload),
          campos: structuredClone(campos)
        });

        return validacion;
      }
    },

    authService: {
      login(payload) {
        peticiones.login.push(
          structuredClone(payload)
        );

        return login;
      },

      saveSession() {}
    },

    router: {
      navigate(ruta) {
        peticiones.navegacion.push(ruta);
      }
    }
  });

  return {
    componente,
    registro,
    login,
    validacion,
    peticiones
  };
}

const evento = {
  preventDefault() {}
};

test('F31: impide doble registro empresarial', () => {
  const { componente, peticiones } = preparar();

  componente.handleSubmit(evento);
  componente.handleSubmit(evento);

  assert.equal(peticiones.registro.length, 1);
  assert.equal(componente.isSubmitting, true);
});

test('F32: conserva datos ante rechazo de registro', () => {
  const { componente, registro } = preparar();

  componente.handleSubmit(evento);

  registro.fallar({
    status: 422,
    error: {
      errors: {
        ruc: ['El RUC ya esta registrado.']
      }
    }
  });

  assert.equal(componente.currentStep, 0);
  assert.ok(componente.errors.ruc);
  assert.equal(componente.ruc, '20000000001');
  assert.equal(componente.razSocial, 'Empresa Ficticia QA');
  assert.equal(componente.isSubmitting, false);
});

test('F37: login fallido no permite registrar otra vez', () => {
  const {
    componente, registro, login, peticiones
  } = preparar();

  componente.handleSubmit(evento);

  registro.responder({ id: 1 });

  assert.equal(componente.registroCompletado, true);
  assert.equal(peticiones.login.length, 1);

  login.fallar({ status: 500 });

  assert.equal(componente.isSubmitting, false);
  assert.ok(componente.errors.api);

  componente.handleSubmit(evento);

  assert.equal(peticiones.registro.length, 1);
});

test('F38: error de correo vuelve al segundo paso', () => {
  const { componente, registro } = preparar();

  componente.handleSubmit(evento);

  registro.fallar({
    status: 422,
    error: {
      errors: {
        correo: ['El correo ya existe.']
      }
    }
  });

  assert.equal(componente.currentStep, 1);
  assert.equal(componente.errors.email, 'El correo ya existe.');
  assert.equal(componente.email, 'empresa@qa.example.test');
});

test('F39: bloquea navegacion durante el registro', () => {
  const { componente, peticiones } = preparar();

  componente.handleSubmit(evento);

  componente.prevStep();
  componente.goToStep(0);
  componente.goToLanding();

  assert.equal(componente.currentStep, 2);
  assert.equal(peticiones.navegacion.length, 0);
});

test('F40: Precognition empresarial avanza tras exito', () => {
  const {
    componente, validacion, peticiones
  } = preparar();

  componente.currentStep = 0;

  componente.nextStep();
  componente.nextStep();

  assert.equal(peticiones.validacion.length, 1);
  assert.equal(componente.currentStep, 0);
  assert.equal(componente.isValidating, true);

  validacion.responder(undefined);

  assert.equal(componente.currentStep, 1);
  assert.equal(componente.isValidating, false);
  assert.equal(peticiones.registro.length, 0);
});

test('F41: Precognition rechazado impide avanzar', () => {
  const { componente, validacion } = preparar();

  componente.currentStep = 0;
  componente.nextStep();

  validacion.fallar({
    status: 422,
    error: {
      errors: {
        ruc: ['El RUC ya esta registrado.']
      }
    }
  });

  assert.equal(componente.currentStep, 0);
  assert.equal(componente.isValidating, false);
  assert.ok(componente.errors.ruc);
  assert.equal(componente.ruc, '20000000001');
});

test('F42: segundo paso valida acceso sin registrar', () => {
  const {
    componente, validacion, peticiones
  } = preparar();

  componente.currentStep = 1;
  componente.nextStep();

  assert.deepEqual(
    peticiones.validacion[0].campos.sort(),
    ['correo', 'password', 'encargado_empresa'].sort()
  );

  validacion.responder(undefined);

  assert.equal(componente.currentStep, 2);
  assert.equal(peticiones.registro.length, 0);
});
