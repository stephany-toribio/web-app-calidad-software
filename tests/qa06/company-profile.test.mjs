import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cargarMetodos,
  solicitudControlada
} from './harness.mjs';

const archivo =
  'src/app/screens/creo/company-profile/' +
  'company-profile.component.ts';

const Harness = cargarMetodos(
  archivo,
  'CompanyProfileComponent',
  [
    'cargarPerfil',
    'aplicarPerfil',
    'cancelar',
    'validar',
    'guardar',
    'mapearErrores'
  ]
);

const EMPRESA = {
  id: 10,
  correo: 'empresa@qa.example.test',
  encargado_empresa: 'Responsable QA',
  razon_social: 'Empresa Ficticia QA',
  sector: 'Tecnología e Informática',
  ruc: '20000000001',
  sitio_web: null,
  descripcion: null
};

function preparar() {
  const componente = new Harness();

  const consulta = solicitudControlada();
  const actualizacion = solicitudControlada();

  const peticiones = {
    get: 0,
    put: []
  };

  Object.assign(componente, {
    empresa: null,
    cargando: false,
    guardando: false,
    errorCarga: '',
    mensajeExito: '',
    errores: {},

    sectores: [
      'Tecnología e Informática',
      'Educación'
    ],

    subs: {
      add() {}
    },

    empresasService: {
      miEmpresa() {
        peticiones.get++;
        return consulta;
      },

      actualizarMiEmpresa(payload) {
        peticiones.put.push(
          structuredClone(payload)
        );

        return actualizacion;
      }
    }
  });

  return {
    componente,
    consulta,
    actualizacion,
    peticiones
  };
}

function perfilCargado() {
  const entorno = preparar();

  entorno.componente.cargarPerfil();
  entorno.consulta.responder(
    structuredClone(EMPRESA)
  );

  return entorno;
}

test('F10: carga del perfil mediante servicio', () => {
  const { componente, consulta, peticiones } =
    preparar();

  componente.cargarPerfil();

  assert.equal(peticiones.get, 1);
  assert.equal(componente.cargando, true);

  consulta.responder(EMPRESA);

  assert.equal(componente.cargando, false);
  assert.equal(componente.empresa.id, EMPRESA.id);

  assert.equal(
    componente.formulario.razon_social,
    EMPRESA.razon_social
  );

  assert.equal(componente.formulario.sitio_web, '');
  assert.equal(componente.formulario.descripcion, '');
});

test('F11: campos obligatorios', () => {
  const { componente, peticiones } = perfilCargado();

  componente.formulario.razon_social = ' ';
  componente.formulario.encargado_empresa = '';

  componente.guardar();

  assert.ok(componente.errores.razon_social);
  assert.ok(componente.errores.encargado_empresa);
  assert.equal(peticiones.put.length, 0);
});

test('F12: RUC invalido', () => {
  const { componente, peticiones } = perfilCargado();

  for (const ruc of ['123', '2000000000A', '']) {
    componente.formulario.ruc = ruc;
    componente.guardar();

    assert.ok(componente.errores.ruc);
  }

  assert.equal(peticiones.put.length, 0);
});

test('F13: sector fuera del catalogo', () => {
  const { componente, peticiones } = perfilCargado();

  componente.formulario.sector = 'Sector inexistente';

  componente.guardar();

  assert.ok(componente.errores.sector);
  assert.equal(peticiones.put.length, 0);
});

test('F14: URL invalida o protocolo no permitido', () => {
  const { componente, peticiones } = perfilCargado();

  for (const url of [
    'no-es-url',
    'javascript:alert(1)',
    'ftp://example.test'
  ]) {
    componente.formulario.sitio_web = url;
    componente.guardar();

    assert.ok(componente.errores.sitio_web);
  }

  assert.equal(peticiones.put.length, 0);
});

test('F15: descripcion mayor a 250 caracteres', () => {
  const { componente, peticiones } = perfilCargado();

  componente.formulario.descripcion =
    'A'.repeat(251);

  componente.guardar();

  assert.ok(componente.errores.descripcion);
  assert.equal(peticiones.put.length, 0);
});

test('F16: payload sin identificadores ni credenciales', () => {
  const { componente, peticiones } = perfilCargado();

  componente.formulario.razon_social =
    ' Empresa actualizada ';

  componente.formulario.id = 999;
  componente.formulario.usuario_id = 999;
  componente.formulario.correo = 'otro@example.test';
  componente.formulario.password = 'SoloFixture#1';

  componente.guardar();

  const payload = peticiones.put[0];

  assert.deepEqual(
    Object.keys(payload).sort(),
    [
      'encargado_empresa',
      'razon_social',
      'sector',
      'ruc',
      'sitio_web',
      'descripcion'
    ].sort()
  );

  assert.equal(
    payload.razon_social,
    'Empresa actualizada'
  );

  assert.equal(payload.sitio_web, null);
  assert.equal(payload.descripcion, null);
});

test('F17: bloqueo de doble guardado', () => {
  const { componente, peticiones } = perfilCargado();

  componente.guardar();
  componente.guardar();

  assert.equal(componente.guardando, true);
  assert.equal(peticiones.put.length, 1);
});

test('F18: exito solamente despues de respuesta', () => {
  const { componente, actualizacion } =
    perfilCargado();

  componente.formulario.razon_social =
    'Empresa Nueva';

  componente.guardar();

  assert.equal(componente.mensajeExito, '');
  assert.equal(
    componente.empresa.razon_social,
    EMPRESA.razon_social
  );

  actualizacion.responder({
    ...EMPRESA,
    razon_social: 'Empresa Nueva'
  });

  assert.equal(componente.guardando, false);
  assert.ok(componente.mensajeExito);

  assert.equal(
    componente.empresa.razon_social,
    'Empresa Nueva'
  );
});

test('F19: error 422 asociado al campo RUC', () => {
  const { componente, actualizacion } =
    perfilCargado();

  componente.guardar();

  actualizacion.fallar({
    status: 422,
    error: {
      errors: {
        ruc: ['El RUC ya esta registrado.']
      }
    }
  });

  assert.equal(
    componente.errores.ruc,
    'El RUC ya esta registrado.'
  );

  assert.equal(componente.guardando, false);
  assert.equal(componente.mensajeExito, '');
});

test('F20: conserva datos ante error del servidor', () => {
  const { componente, actualizacion } =
    perfilCargado();

  componente.formulario.razon_social =
    'Cambio pendiente';

  componente.guardar();

  actualizacion.fallar({
    status: 500,
    error: {}
  });

  assert.equal(
    componente.formulario.razon_social,
    'Cambio pendiente'
  );

  assert.equal(
    componente.empresa.razon_social,
    EMPRESA.razon_social
  );

  assert.ok(componente.errores.api);
  assert.equal(componente.guardando, false);
});

test('F21: cancelar restaura el ultimo perfil confirmado', () => {
  const { componente, peticiones } = perfilCargado();

  componente.formulario.razon_social =
    'Cambio no guardado';

  componente.cancelar();

  assert.equal(
    componente.formulario.razon_social,
    EMPRESA.razon_social
  );

  assert.equal(peticiones.put.length, 0);
});

test('F22: error de conexion durante guardado', () => {
  const { componente, actualizacion } =
    perfilCargado();

  componente.guardar();

  actualizacion.fallar({ status: 0 });

  assert.equal(
    componente.errores.api,
    'No se pudo conectar con el servidor.'
  );

  assert.equal(componente.guardando, false);
});

test('F25: carga fallida permite reintentar', () => {
  const { componente, consulta, peticiones } =
    preparar();

  componente.cargarPerfil();

  consulta.fallar({ status: 500 });

  assert.equal(componente.cargando, false);
  assert.ok(componente.errorCarga);
  assert.equal(componente.empresa, null);

  componente.cargarPerfil();

  assert.equal(peticiones.get, 2);
  assert.equal(componente.errorCarga, '');

  consulta.responder(EMPRESA);

  assert.equal(componente.empresa.id, EMPRESA.id);
});

test('F26: no guarda perfil que todavia no fue cargado', () => {
  const { componente, peticiones } = preparar();

  componente.guardar();

  assert.equal(peticiones.put.length, 0);
});

test('F27: cancelar bloqueado durante guardado', () => {
  const { componente } = perfilCargado();

  componente.formulario.razon_social =
    'Cambio en proceso';

  componente.guardar();
  componente.cancelar();

  assert.equal(
    componente.formulario.razon_social,
    'Cambio en proceso'
  );
});

test('F28: evita recargas simultaneas', () => {
  const { componente, peticiones } = preparar();

  componente.cargarPerfil();
  componente.cargarPerfil();

  assert.equal(peticiones.get, 1);
});
