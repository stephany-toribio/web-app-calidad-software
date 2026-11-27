import '@angular/compiler';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Injector, DestroyRef, ApplicationRef, runInInjectionContext } from '@angular/core';
import { HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { SwUpdate } from '@angular/service-worker';
import { Subject, of, throwError, firstValueFrom } from 'rxjs';
import { ConnectivityService } from '../../src/app/core/pwa/connectivity.service.ts';
import { PwaUpdatesService } from '../../src/app/core/pwa/pwa-updates.service.ts';
import { apiNetworkInterceptor } from '../../src/app/core/pwa/api-network.interceptor.ts';

function setup(enabled = true) {
  const win = new EventTarget();
  const doc = new EventTarget();
  doc.baseURI = 'https://qa.example.test/';
  let reloads = 0;
  let confirmations = 0;
  let accepted = false;
  win.location = { reload: () => reloads++ };
  win.confirm = () => { confirmations++; return accepted; };
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
  globalThis.window = win;
  globalThis.document = doc;
  const cleanup = [];
  const stable = new Subject();
  let checks = 0;
  const sw = {
    isEnabled: enabled,
    versionUpdates: new Subject(),
    unrecoverable: new Subject(),
    checkForUpdate: async () => { checks++; return false; }
  };
  const injector = Injector.create({ providers: [
    { provide: DestroyRef, useValue: { onDestroy: fn => cleanup.push(fn) } },
    { provide: ApplicationRef, useValue: { isStable: stable } },
    { provide: SwUpdate, useValue: sw },
    { provide: ConnectivityService, useFactory: () => new ConnectivityService() },
    { provide: PwaUpdatesService, useFactory: () => new PwaUpdatesService() }
  ] });
  const connection = injector.get(ConnectivityService);
  return {
    win, doc, sw, stable, connection, injector,
    updates: () => injector.get(PwaUpdatesService),
    offline: () => { navigator.onLine = false; win.dispatchEvent(new Event('offline')); },
    online: () => { navigator.onLine = true; win.dispatchEvent(new Event('online')); },
    accept: () => { accepted = true; },
    counts: () => ({ reloads, confirmations, checks }),
    request: (request, next) => runInInjectionContext(injector, () => apiNetworkInterceptor(request, next)),
    destroy: () => cleanup.forEach(fn => fn())
  };
}

for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
  test(`offline ${method}: fails explicitly without contacting API or replay on reconnect`, async () => {
    const env = setup();
    let calls = 0;
    const req = new HttpRequest(method, '/api/v1/vacantes/9101', null);
    const observable = env.request(req, () => { calls++; return of(new HttpResponse({ status: 200 })); });
    env.offline();
    await assert.rejects(firstValueFrom(observable), error => error.status === 0 && error.error.error_code === 'OFFLINE');
    env.online();
    assert.equal(calls, 0);
    assert.equal(env.connection.pendingWrites(), 0);
    env.destroy();
  });
}

test('API preserves payload and bypasses NGSW without modifying the query', async () => {
  const env = setup();
  let captured;
  const payload = { vacante_id: 9101 };
  await firstValueFrom(env.request(new HttpRequest('POST', '/api/v1/postulaciones', payload), req => {
    captured = req;
    assert.equal(env.connection.pendingWrites(), 1);
    return of(new HttpResponse({ status: 201 }));
  }));
  assert.equal(captured.params.has('ngsw-bypass'), false);
  assert.equal(captured.urlWithParams, '/api/v1/postulaciones');
  assert.deepEqual(captured.body, payload);
  assert.equal(captured.headers.get('ngsw-bypass'), 'true');
  assert.equal(env.connection.pendingWrites(), 0);
  env.destroy();
});

test('network failure after POST: no success, no replay, uncertain result explained', async () => {
  const env = setup();
  let calls = 0;
  let successes = 0;
  env.request(new HttpRequest('POST', '/api/v1/pagos', {}), () => {
    calls++;
    return throwError(() => new HttpErrorResponse({ status: 0 }));
  }).subscribe({ next: () => successes++, error: () => {} });
  env.offline(); env.online();
  assert.equal(calls, 1);
  assert.equal(successes, 0);
  assert.equal(env.connection.pendingWrites(), 0);
  assert.match(env.connection.message(), /No se reenviaron/);
  env.destroy();
});

test('HTTP 422 remains an error with validation details', async () => {
  const env = setup();
  const error = new HttpErrorResponse({ status: 422, error: { errors: { titulo: ['Obligatorio'] } } });
  await assert.rejects(firstValueFrom(env.request(new HttpRequest('POST', '/api/v1/empleos', {}),
    () => throwError(() => error))), received => received === error);
  assert.equal(env.connection.message(), '');
  env.destroy();
});

test('unrelated external origins and API prefix lookalikes are not intercepted', async () => {
  const env = setup(); env.offline();
  for (const url of ['https://otro.example.test/api/v1/empleos', '/api/v10/empleos', '/icons/icon-192x192.png']) {
    let forwarded;
    await firstValueFrom(env.request(new HttpRequest('GET', url), req => {
      forwarded = req; return of(new HttpResponse({ status: 200 }));
    }));
    assert.equal(forwarded.urlWithParams, url);
  }
  env.destroy();
});

test('update ready never reloads automatically; cancellation preserves edited state', () => {
  const env = setup(); const updates = env.updates();
  env.doc.dispatchEvent(new Event('input'));
  env.sw.versionUpdates.next({ type: 'VERSION_READY', currentVersion: { hash: 'A' }, latestVersion: { hash: 'B' } });
  assert.equal(updates.ready(), true);
  assert.equal(updates.version(), 'B');
  assert.equal(updates.activeVersion(), 'A');
  assert.equal(env.counts().reloads, 0);
  updates.reload();
  assert.equal(env.counts().confirmations, 1);
  assert.equal(env.counts().reloads, 0);
  assert.equal(env.connection.edited(), true);
  env.accept(); updates.reload();
  assert.equal(env.counts().reloads, 1);
  assert.equal(env.connection.edited(), false);
  env.destroy();
});

test('reload is blocked during a write and offline, even if user would accept', () => {
  const env = setup(); const updates = env.updates(); env.accept();
  env.connection.beginWrite(); updates.reload();
  env.connection.endWrite(); env.offline(); updates.reload();
  assert.deepEqual(env.counts(), { reloads: 0, confirmations: 0, checks: 0 });
  env.destroy();
});

test('failed download and unrecoverable version produce notices without forced reload', () => {
  const env = setup(); const updates = env.updates();
  env.sw.versionUpdates.next({ type: 'VERSION_INSTALLATION_FAILED', version: { hash: 'B' }, error: 'offline' });
  assert.match(updates.notice(), /no pudo descargarse/);
  env.sw.unrecoverable.next({ reason: 'missing chunk' });
  assert.equal(updates.unrecoverable(), true);
  assert.equal(env.counts().reloads, 0);
  env.destroy();
});

test('latest installed in another tab is not mislabeled as this tab current version', () => {
  const env = setup(); const updates = env.updates();
  env.sw.versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED', version: { hash: 'C-hash', appData: { release: 'QA11-C' } } });
  assert.equal(updates.release, 'QA11-B');
  assert.equal(updates.activeVersion(), ''); // unknown, not the latest installed hash
  assert.equal(updates.ready(), true);
  assert.equal(updates.version(), 'C-hash');
  assert.equal(env.counts().reloads, 0);
  env.destroy();
});

test('APK with SW disabled never calls checkForUpdate, including after reconnection', async () => {
  const env = setup(false); const updates = env.updates();
  env.stable.next(true); env.offline(); env.online(); await updates.check();
  assert.equal(updates.enabled, false);
  assert.equal(env.counts().checks, 0);
  env.destroy();
});

test('update checks wait for stabilization and handle check failure', async () => {
  const env = setup(); const updates = env.updates();
  env.stable.next(false); assert.equal(env.counts().checks, 0);
  env.stable.next(true); await Promise.resolve();
  assert.equal(env.counts().checks, 1);
  env.sw.checkForUpdate = async () => { throw new Error('network'); };
  await updates.check();
  assert.equal(updates.checking(), false);
  assert.match(updates.notice(), /No se pudo comprobar/);
  env.destroy();
});

test('beforeunload warns on edited forms without reading or persisting their values', () => {
  const env = setup();
  env.doc.dispatchEvent(new Event('input'));
  const event = new Event('beforeunload', { cancelable: true });
  env.win.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  env.destroy();
});


test('false without an event is a failed check, while actual version events keep their own notices', async () => {
  const env = setup(); const updates = env.updates();
  env.sw.checkForUpdate = async () => false;
  await updates.check();
  assert.match(updates.notice(), /No se pudo comprobar/);
  env.sw.checkForUpdate = async () => {
    env.sw.versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED', version: { hash: 'B-hash', appData: { release: 'QA11-B' } } });
    return false;
  };
  await updates.check();
  assert.equal(updates.notice(), 'No hay una nueva versión disponible.');
  env.sw.checkForUpdate = async () => {
    env.sw.versionUpdates.next({ type: 'VERSION_INSTALLATION_FAILED', version: { hash: 'C-hash' }, error: 'hash mismatch' });
    return false;
  };
  await updates.check();
  assert.match(updates.notice(), /no pudo descargarse/);
  assert.equal(env.counts().reloads, 0);
  env.destroy();
});

// INC-QA28-02: strict backend validation must not receive
// service-worker control parameters as API input.
for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
  test(`QA28 regression: ${method} preserves API contract`, async () => {
    const env = setup();

    try {
      const payload = method === 'GET' ? null : { vacante_id: 9101 };

      const original = new HttpRequest(
        method,
        '/api/v1/candidatos/me/postulaciones',
        payload,
        {
          params: new (await import('@angular/common/http')).HttpParams()
            .set('pagina', '1'),
          headers: new (await import('@angular/common/http')).HttpHeaders()
            .set('Accept', 'application/json')
        }
      );

      let captured;

      await firstValueFrom(env.request(original, req => {
        captured = req;
        return of(new HttpResponse({ status: 200 }));
      }));

      assert.equal(captured.urlWithParams, original.urlWithParams);
      assert.equal(captured.params.has('ngsw-bypass'), false);
      assert.deepEqual(captured.body, original.body);
      assert.equal(captured.headers.get('ngsw-bypass'), 'true');
      assert.equal(captured.headers.get('Accept'), 'application/json');
      assert.equal(env.connection.pendingWrites(), 0);
    } finally {
      env.destroy();
    }
  });
}
