import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const archivo = new URL(
  '../../src/app/screens/creo/company-jobs/company-jobs.component.ts',
  import.meta.url
);

const source = fs.readFileSync(archivo, 'utf8');

const ast = ts.createSourceFile(
  'company-jobs.component.ts',
  source,
  ts.ScriptTarget.Latest,
  true
);

const nombres = [
  'openPayment',
  'limpiarDatosTarjeta',
  'validarTarjeta',
  'cancelPayment',
  'confirmJobPayment'
];

const clase = ast.statements.find(
  nodo => ts.isClassDeclaration(nodo)
    && nombres.every(nombre =>
      nodo.members.some(m => m.name?.getText(ast) === nombre)
    )
);

assert.ok(clase, 'Componente de pago no encontrado');

const metodos = nombres.map(nombre => {
  const metodo = clase.members.find(
    miembro => miembro.name?.getText(ast) === nombre
  );

  assert.ok(metodo, `Metodo ausente: ${nombre}`);

  return metodo.getText(ast);
});

const codigo = `
export class PaymentHarness {
  ${metodos.join('\n')}
}
`;

const js = ts.transpileModule(codigo, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext
  }
}).outputText;

const { PaymentHarness } = await import(
  'data:text/javascript;base64,' +
  Buffer.from(js).toString('base64')
);

function preparar() {
  const componente = new PaymentHarness();

  const resumenes = [];
  const pagos = [];
  const mensajes = [];
  const reemplazos = [];

  Object.assign(componente, {
    paymentRequestVersion: 0,
    paymentProcessing: false,
    puedePagar: false,
    payingJob: null,
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardErrors: {},
    paymentAmount: 0,
    pagoAviso: '',

    showToast: mensaje => mensajes.push(mensaje),

    reemplazarVacante: vacante =>
      reemplazos.push(vacante),

    vacantesService: {
      resumenPago(id) {
        return {
          subscribe(observador) {
            resumenes.push({ id, observador });
          }
        };
      },

      pagarVacante(id, payload) {
        return {
          subscribe(observador) {
            pagos.push({ id, payload, observador });
          }
        };
      }
    }
  });

  return {
    componente,
    resumenes,
    pagos,
    mensajes,
    reemplazos
  };
}

function abrir(contexto) {
  const { componente, resumenes } = contexto;

  componente.openPayment({
    id: '101',
    title: 'Vacante QA07'
  });

  resumenes[0].observador.next({
    monto: 100,
    puede_pagar: true,
    estado_pago: 'sin_pago'
  });
}

function tarjetaValida(componente) {
  const fecha = new Date();
  fecha.setFullYear(fecha.getFullYear() + 2);

  componente.cardName = 'Empresa ficticia QA';
  componente.cardNumber = '4111 1111 1111 1111';
  componente.cardExpiry =
    '12/' + String(fecha.getFullYear()).slice(-2);
  componente.cardCvv = '123';
}

function comprobarLimpieza(componente) {
  assert.equal(componente.cardName, '');
  assert.equal(componente.cardNumber, '');
  assert.equal(componente.cardExpiry, '');
  assert.equal(componente.cardCvv, '');
  assert.deepEqual(componente.cardErrors, {});
}

test('F01: formulario inicia sin datos de tarjeta', () => {
  const ctx = preparar();

  tarjetaValida(ctx.componente);

  ctx.componente.openPayment({
    id: '101',
    title: 'Vacante QA'
  });

  comprobarLimpieza(ctx.componente);

  assert.equal(ctx.componente.puedePagar, false);
});

test('F02: monto y permiso provienen del servidor', () => {
  const ctx = preparar();

  abrir(ctx);

  assert.equal(ctx.componente.paymentAmount, 100);
  assert.equal(ctx.componente.puedePagar, true);
});

test('F03: no envia pago sin autorizacion', () => {
  const ctx = preparar();

  abrir(ctx);
  tarjetaValida(ctx.componente);

  ctx.componente.puedePagar = false;
  ctx.componente.confirmJobPayment();

  assert.equal(ctx.pagos.length, 0);
});

test('F04: datos incompletos no generan solicitud', () => {
  const ctx = preparar();

  abrir(ctx);
  ctx.componente.confirmJobPayment();

  assert.equal(ctx.pagos.length, 0);
  assert.ok(ctx.componente.cardErrors.number);
  assert.ok(ctx.componente.cardErrors.cvv);
});

test('F05: payload no incluye monto ni moneda', () => {
  const ctx = preparar();

  abrir(ctx);
  tarjetaValida(ctx.componente);

  ctx.componente.confirmJobPayment();

  assert.equal(ctx.pagos.length, 1);

  assert.deepEqual(
    Object.keys(ctx.pagos[0].payload).sort(),
    ['titular', 'numero_tarjeta', 'vencimiento', 'cvv'].sort()
  );

  assert.equal(
    ctx.pagos[0].payload.numero_tarjeta,
    '4111111111111111'
  );
});

test('F06: bloqueo de doble confirmacion', () => {
  const ctx = preparar();

  abrir(ctx);
  tarjetaValida(ctx.componente);

  ctx.componente.confirmJobPayment();
  ctx.componente.confirmJobPayment();

  assert.equal(ctx.pagos.length, 1);
});

test('F07: cancelacion limpia datos de tarjeta', () => {
  const ctx = preparar();

  abrir(ctx);
  tarjetaValida(ctx.componente);

  ctx.componente.cancelPayment();

  comprobarLimpieza(ctx.componente);

  assert.equal(ctx.componente.payingJob, null);
  assert.equal(ctx.componente.puedePagar, false);
});

test('F08: pago exitoso limpia datos y actualiza vacante', () => {
  const ctx = preparar();

  abrir(ctx);
  tarjetaValida(ctx.componente);

  ctx.componente.confirmJobPayment();

  const vacante = {
    id: 101,
    estado: { general: 'publicada' }
  };

  ctx.pagos[0].observador.next({
    pago: { monto: 100 },
    vacante
  });

  comprobarLimpieza(ctx.componente);

  assert.equal(ctx.componente.payingJob, null);
  assert.equal(ctx.componente.paymentProcessing, false);
  assert.equal(ctx.componente.puedePagar, false);
  assert.deepEqual(ctx.reemplazos, [vacante]);
});

test('F09: error 422 se asigna al campo correcto', () => {
  const ctx = preparar();

  abrir(ctx);
  tarjetaValida(ctx.componente);

  ctx.componente.confirmJobPayment();

  ctx.pagos[0].observador.error({
    status: 422,
    error: {
      message: 'Error de validacion',
      errors: {
        numero_tarjeta: ['El numero no es valido']
      }
    }
  });

  assert.equal(
    ctx.componente.cardErrors.number,
    'El numero no es valido'
  );

  assert.equal(ctx.componente.paymentProcessing, false);
  assert.ok(ctx.componente.payingJob);
  assert.equal(ctx.reemplazos.length, 0);
});

test('F10: respuesta antigua no sobrescribe otro pago', () => {
  const ctx = preparar();

  ctx.componente.openPayment({
    id: '101', title: 'Primera'
  });

  ctx.componente.cancelPayment();

  ctx.componente.openPayment({
    id: '102', title: 'Segunda'
  });

  ctx.resumenes[1].observador.next({
    monto: 200,
    puede_pagar: true
  });

  ctx.resumenes[0].observador.next({
    monto: 100,
    puede_pagar: false
  });

  assert.equal(ctx.componente.payingJob.id, '102');
  assert.equal(ctx.componente.paymentAmount, 200);
  assert.equal(ctx.componente.puedePagar, true);
});

test('F11: error antiguo no deshabilita el pago actual', () => {
  const ctx = preparar();

  ctx.componente.openPayment({
    id: '101', title: 'Primera'
  });

  ctx.componente.cancelPayment();

  ctx.componente.openPayment({
    id: '102', title: 'Segunda'
  });

  ctx.resumenes[1].observador.next({
    monto: 200,
    puede_pagar: true
  });

  ctx.resumenes[0].observador.error({
    error: { message: 'Error anterior' }
  });

  assert.equal(ctx.componente.puedePagar, true);
  assert.equal(ctx.componente.pagoAviso, '');
});

test('F12: respuesta posterior a cancelacion se ignora', () => {
  const ctx = preparar();

  ctx.componente.openPayment({
    id: '101', title: 'Vacante QA'
  });

  ctx.componente.cancelPayment();

  ctx.resumenes[0].observador.next({
    monto: 100,
    puede_pagar: true
  });

  assert.equal(ctx.componente.payingJob, null);
  assert.equal(ctx.componente.puedePagar, false);
});

test('F13: no abre otro pago durante procesamiento', () => {
  const ctx = preparar();

  abrir(ctx);
  tarjetaValida(ctx.componente);

  ctx.componente.confirmJobPayment();

  ctx.componente.openPayment({
    id: '102', title: 'Otra vacante'
  });

  assert.equal(ctx.componente.payingJob.id, '101');
  assert.equal(ctx.resumenes.length, 1);
  assert.equal(ctx.pagos.length, 1);
});

test('F14: no cancela un pago durante procesamiento', () => {
  const ctx = preparar();

  abrir(ctx);
  tarjetaValida(ctx.componente);

  ctx.componente.confirmJobPayment();
  ctx.componente.cancelPayment();

  assert.ok(ctx.componente.payingJob);
  assert.equal(ctx.componente.paymentProcessing, true);
});
