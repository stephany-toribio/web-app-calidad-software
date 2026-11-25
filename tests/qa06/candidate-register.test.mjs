import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  cargarMetodos,
  almacenamiento
} from './harness.mjs';

const archivo =
  'src/app/screens/creo/creo-register-candidate/' +
  'creo-register-candidate.component.ts';

const KEY = 'creo_candidate_register_draft';

function preparar() {
  const localStorage = almacenamiento();
  const sessionStorage = almacenamiento();

  const Harness = cargarMetodos(
    archivo,
    'CreoRegisterCandidateComponent',
    [
      'guardarBorrador',
      'cargarBorrador',
      'limpiarBorrador',
      'goBack',
      'goToStep',
      'goToLogin',
      'handleNext',
      'iniciarSesion'
    ],
    {
      localStorage,
      sessionStorage,

      window: {
        scrollTo() {}
      },

      CAMPOS_PASO: {
        0: ['nombre']
      }
    }
  );

  const componente = new Harness();
  const llamadas = [];

  Object.assign(componente, {
    DRAFT_KEY: KEY,
    registroCompletado: false,
    enviando: false,
    step: 4,

    firstName: 'Candidato',
    lastName: 'Ficticio',
    dni: '00000099',
    email: 'candidato@qa.example.test',
    phone: '900000099',
    password: 'SoloFixture#1',
    passwordConfirm: 'SoloFixture#1',

    _carreras: [],
    _educacionSuperior: [],
    idiomas: [],
    experiencias: [],
    skills: [],
    softSkills: [],

    errors: {},

    router: {
      navigate(ruta) {
        llamadas.push(ruta);
      }
    },

    authService: {
      login() {
        return {
          subscribe(callbacks) {
            callbacks.next({});
          }
        };
      },

      saveSession() {}
    },

    cargarHabilidades() {},

    erroresLocales() {
      return {};
    },

    hasErrors() {
      return false;
    },

    registrar() {
      llamadas.push('registro');
      componente.enviando = true;
    }
  });

  return {
    componente,
    localStorage,
    sessionStorage,
    llamadas
  };
}

test('F03: borrador solo en sessionStorage', () => {
  const {
    componente, localStorage, sessionStorage
  } = preparar();

  componente.guardarBorrador();

  assert.equal(localStorage.getItem(KEY), null);
  assert.ok(sessionStorage.getItem(KEY));
});

test('F04: no persiste contrasenas', () => {
  const { componente, sessionStorage } = preparar();

  componente.guardarBorrador();

  const borrador = JSON.parse(
    sessionStorage.getItem(KEY)
  );

  assert.equal('password' in borrador, false);
  assert.equal('passwordConfirm' in borrador, false);

  assert.equal(
    sessionStorage.getItem(KEY).includes('SoloFixture#1'),
    false
  );
});

test('F05: elimina borrador antiguo persistente', () => {
  const { componente, localStorage } = preparar();

  localStorage.setItem(
    KEY,
    JSON.stringify({ dni: '00000099' })
  );

  componente.cargarBorrador();

  assert.equal(localStorage.getItem(KEY), null);
});

test('F06: restauracion obliga a revalidar credenciales', () => {
  const { componente, sessionStorage } = preparar();

  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      step: 4,
      firstName: 'Restaurado',
      email: 'qa@example.test',
      dni: '00000099'
    })
  );

  componente.cargarBorrador();

  assert.equal(componente.step, 0);
  assert.equal(componente.password, '');
  assert.equal(componente.passwordConfirm, '');
  assert.equal(componente.firstName, 'Restaurado');
  assert.equal(componente.email, 'qa@example.test');
  assert.equal(componente.dni, '00000099');
});

test('F07: no recrea borrador despues del registro', () => {
  const { componente, sessionStorage } = preparar();

  componente.guardarBorrador();
  assert.ok(sessionStorage.getItem(KEY));

  componente.iniciarSesion();

  assert.equal(componente.registroCompletado, true);
  assert.equal(sessionStorage.getItem(KEY), null);

  componente.guardarBorrador();

  assert.equal(sessionStorage.getItem(KEY), null);
});

test('F08: bloquea navegacion mientras envia', () => {
  const { componente, llamadas } = preparar();

  componente.enviando = true;

  componente.goBack();
  componente.goToLogin();
  componente.goToStep(0);

  assert.equal(componente.step, 4);
  assert.equal(llamadas.length, 0);
});

test('F09: handleNext bloquea segundo envio', () => {
  const { componente, llamadas } = preparar();

  const evento = {
    preventDefault() {}
  };

  componente.handleNext(evento);
  componente.handleNext(evento);

  assert.deepEqual(llamadas, ['registro']);
});

test('F29: ruta antigua redirige al perfil real protegido', () => {
  const rutas = fs.readFileSync(
    'src/app/app.routes.ts',
    'utf8'
  );

  assert.match(
    rutas,
    /path:\s*'edit-profile',\s*redirectTo:\s*'candidate-profile',\s*pathMatch:\s*'full'/
  );

  assert.match(
    rutas,
    /path:\s*'candidate-profile',\s*canActivate:\s*\[candidatoGuard\]/
  );
});

test('F30: ruta empresarial usa companyGuard', () => {
  const rutas = fs.readFileSync(
    'src/app/app.routes.ts',
    'utf8'
  );

  assert.match(
    rutas,
    /path:\s*'company-profile',\s*canActivate:\s*\[companyGuard\]/
  );
});
