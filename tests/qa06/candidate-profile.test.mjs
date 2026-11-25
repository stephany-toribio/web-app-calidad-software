import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

import { cargarMetodos } from './harness.mjs';

const fuente = fs.readFileSync(
  'src/app/core/api/mappers/errores-api.mapper.ts',
  'utf8'
);

const compilado = ts.transpileModule(fuente, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS
  }
});

const contexto = {
  exports: {}
};

vm.runInNewContext(
  compilado.outputText,
  contexto
);

const erroresDesdeApi =
  contexto.exports.erroresDesdeApi;

test('F23-A: errores de duplicidad durante registro', () => {
  const errores = erroresDesdeApi({
    status: 422,

    error: {
      errors: {
        dni: ['El DNI ya existe en la base de datos.'],
        celular: ['El número de teléfono ya está registrado.'],
        correo: ['Este correo ya pertenece a una cuenta registrada.']
      }
    }
  });

  assert.equal(errores.dniTaken, 'duplicate');
  assert.equal(errores.phoneTaken, 'duplicate');
  assert.equal(errores.emailTaken, 'duplicate');
});

test('F23-B: errores de duplicidad durante edicion', () => {
  const errores = erroresDesdeApi({
    status: 422,

    error: {
      errors: {
        dni: ['El DNI ya pertenece a otro candidato registrado.'],
        celular: ['El número de teléfono ya pertenece a otro candidato registrado.']
      }
    }
  });

  assert.equal(
    errores.dni,
    'El DNI ya pertenece a otro candidato registrado.'
  );

  assert.equal(
    errores.phone,
    'El número de teléfono ya pertenece a otro candidato registrado.'
  );
});

test('F23-C: error de maximo de habilidades', () => {
  const errores = erroresDesdeApi({
    status: 400,

    error: {
      error_code: 'MAX_HABILIDADES_EXCEDIDO',
      message: 'Limite excedido'
    }
  });

  assert.equal(errores.skills, 'Limite excedido');
});

const modales = [
  'openEditModal',
  'openExpModal',
  'openEduModal',
  'openSkillsModal',
  'closeEditModal',
  'closeExpModal',
  'closeEduModal',
  'closeSkillsModal'
];

const Harness = cargarMetodos(
  'src/app/screens/creo/candidate-profile/' +
  'candidate-profile.component.ts',
  'CandidateProfileComponent',
  modales
);

for (const metodo of modales) {
  test(`F24: ${metodo} bloqueado durante guardado`, () => {
    const componente = new Harness();

    componente.guardando = true;

    componente.abrirModal = () => {
      assert.fail('No debe abrir otro modal');
    };

    componente.cerrarModal = () => {
      assert.fail('No debe cerrar el modal');
    };

    componente.recargarHabilidadesPerfil = () => {
      assert.fail('No debe recargar habilidades');
    };

    componente[metodo]();
  });
}
