import test from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(
  new URL(
    '../../src/app/core/api/session-policy.ts',
    import.meta.url
  ),
  'utf8'
);

const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;

const moduleUrl =
  'data:text/javascript;base64,' +
  Buffer.from(output).toString('base64');

const { getSessionInvalidationReason } =
  await import(moduleUrl);

const current = {
  status: 401,
  payload: null,
  requestToken: 'token-prueba-actual',
  currentToken: 'token-prueba-actual',
  isLoginRequest: false
};

const suspended = {
  error_code: 'FORBIDDEN',
  reason: 'ACCOUNT_NOT_ACTIVE'
};

test('401 de sesion actual invalida sesion', () => {
  assert.equal(
    getSessionInvalidationReason(current),
    'sessionExpired'
  );
});

test('401 de sesion anterior conserva sesion nueva', () => {
  assert.equal(
    getSessionInvalidationReason({
      ...current,
      currentToken: 'token-prueba-nuevo'
    }),
    null
  );
});

test('401 sin token no invalida sesion', () => {
  assert.equal(
    getSessionInvalidationReason({
      ...current,
      requestToken: null,
      currentToken: null
    }),
    null
  );
});

test('401 durante login no invalida otra sesion', () => {
  assert.equal(
    getSessionInvalidationReason({
      ...current,
      isLoginRequest: true
    }),
    null
  );
});

test('403 de permisos conserva sesion', () => {
  assert.equal(
    getSessionInvalidationReason({
      ...current,
      status: 403,
      payload: {
        error_code: 'FORBIDDEN'
      }
    }),
    null
  );
});

test('403 de cuenta no activa invalida sesion actual', () => {
  assert.equal(
    getSessionInvalidationReason({
      ...current,
      status: 403,
      payload: suspended
    }),
    'accountSuspended'
  );
});

test('403 antiguo no invalida sesion nueva', () => {
  assert.equal(
    getSessionInvalidationReason({
      ...current,
      status: 403,
      payload: suspended,
      currentToken: 'token-prueba-nuevo'
    }),
    null
  );
});

test('403 durante login no elimina otra sesion', () => {
  assert.equal(
    getSessionInvalidationReason({
      ...current,
      status: 403,
      payload: suspended,
      isLoginRequest: true
    }),
    null
  );
});

test('403 sin token no invalida sesion', () => {
  assert.equal(
    getSessionInvalidationReason({
      ...current,
      status: 403,
      payload: suspended,
      requestToken: null,
      currentToken: null
    }),
    null
  );
});

test('403 con payload inesperado no produce errores', () => {
  const payloads = [
    null,
    undefined,
    '',
    'respuesta HTML',
    42,
    [],
    {},
    { message: {} },
    { error_code: 123 }
  ];

  for (const payload of payloads) {
    assert.equal(
      getSessionInvalidationReason({
        ...current,
        status: 403,
        payload
      }),
      null
    );
  }
});

test('mensaje de suspension sin codigo no elimina sesion', () => {
  assert.equal(
    getSessionInvalidationReason({
      ...current,
      status: 403,
      payload: {
        error_code: 'FORBIDDEN',
        message: 'La cuenta gestionada esta suspendida.'
      }
    }),
    null
  );
});

test('otros estados HTTP conservan sesion', () => {
  for (const status of [0, 200, 404, 422, 429, 500, 503]) {
    assert.equal(
      getSessionInvalidationReason({
        ...current,
        status,
        payload: suspended
      }),
      null
    );
  }
});
