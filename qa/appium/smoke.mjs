import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const home = dirname(fileURLToPath(import.meta.url));
const root = resolve(home, '../..');
const server = process.env.APPIUM_URL || 'http://127.0.0.1:4723';
assert(['127.0.0.1', 'localhost'].includes(new URL(server).hostname));
const sdk = process.env.ANDROID_HOME || join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
const adb = process.env.QA21_ADB || join(sdk, 'platform-tools', 'adb.exe');
const shell = args => execFileSync(adb, args, { encoding: 'utf8', timeout: 30000 }).trim();
const devices = shell(['devices']).split(/\r?\n/)
  .map(line => line.match(/^(\S+)\s+device$/)?.[1]).filter(Boolean);
const serial = process.env.ANDROID_SERIAL || (devices.length === 1 ? devices[0] : '');
assert(serial && devices.includes(serial), 'Selecciona el dispositivo mediante ANDROID_SERIAL');

const caps = JSON.parse(readFileSync(join(home, 'capabilities.apk.json'), 'utf8').replace(/^\uFEFF/, ''));
caps['appium:udid'] = serial;
caps['appium:chromedriverExecutableDir'] = join(home, '.tools', 'chromedrivers');
mkdirSync(caps['appium:chromedriverExecutableDir'], { recursive: true });

const controlled = process.argv.includes('--fail-controlled');
const out = join(root, 'docs/evidencias/QA-21/ejecucion-windows',
  (controlled ? 'fallo-' : 'apk-') + new Date().toISOString().replace(/[:.]/g, '-'));
mkdirSync(out, { recursive: true });
let session;
const report = { started: new Date().toISOString(), scope: 'APK', steps: [], controlled, outcome: 'FAIL' };

async function command(method, path, body) {
  const response = await fetch(server + path, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(180000)
  });
  const data = await response.json();
  if (!response.ok || data.value?.error) {
    const error = new Error((data.value?.message || response.statusText).replaceAll(serial, '<device>'));
    error.code = data.value?.error || String(response.status);
    throw error;
  }
  return data.value;
}
const route = suffix => '/session/' + session + suffix;

async function screenshot() {
  const data = await command('GET', route('/screenshot'));
  writeFileSync(join(out, 'pantalla.png'), Buffer.from(data, 'base64'));
}

try {
  const status = await command('GET', '/status');
  assert(status.ready, 'Servidor no disponible');
  report.appium = status.build?.version;
  report.android = shell(['-s', serial, 'shell', 'getprop', 'ro.build.version.release']);
  report.apiLevel = shell(['-s', serial, 'shell', 'getprop', 'ro.build.version.sdk']);

  const created = await command('POST', '/session', {
    capabilities: { alwaysMatch: caps, firstMatch: [{}] }
  });
  session = created.sessionId;
  assert(session, 'No se recibio sessionId');
  assert.equal(await command('GET', route('/appium/context')), 'NATIVE_APP');
  report.steps.push('NATIVE_APP');

  let web;
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    const contexts = await command('GET', route('/appium/contexts'));
    report.contexts = contexts.filter(name =>
      name === 'NATIVE_APP' || name.includes(caps['appium:appPackage']));
    web = contexts.find(name =>
      name.startsWith('WEBVIEW_') && name.includes(caps['appium:appPackage']));
    if (web) break;
    await new Promise(done => setTimeout(done, 1000));
  }
  assert(web, 'No aparece el WebView del APK; revisar depuracion y log de Appium');

  await command('POST', route('/appium/context'), { name: web });
  report.web = await command('POST', route('/execute/sync'), {
    script: "return {origin:location.origin,path:location.pathname,title:document.title,native:globalThis.Capacitor?.isNativePlatform?.()===true,userAgent:navigator.userAgent}",
    args: []
  });
  assert.equal(report.web.origin, 'https://localhost');
  assert.equal(report.web.native, true);
  report.steps.push(web);
  if (process.argv.includes('--api-probe')) {
    const api = new URL(process.env.QA21_API_URL);
    assert.equal(api.protocol, 'https:');
    assert(!api.username && !api.password && !api.search && !api.hash);
    const target = api.href.replace(/\/+$/, '') + '/auth/login';

    const preflight = await fetch(target, {
      method:'OPTIONS',
      headers:{
        Origin:report.web.origin,
        'Access-Control-Request-Method':'POST',
        'Access-Control-Request-Headers':'content-type'
      },
      signal:AbortSignal.timeout(30000)
    });
    report.api = {
      url:api.href,
      hostPreflight:{
        status:preflight.status,
        origin:preflight.headers.get('access-control-allow-origin'),
        methods:preflight.headers.get('access-control-allow-methods'),
        headers:preflight.headers.get('access-control-allow-headers')
      }
    };
    assert([200,204].includes(preflight.status),'Preflight HTTP incorrecto');
    assert.equal(report.api.hostPreflight.origin,report.web.origin);
    assert((report.api.hostPreflight.methods || '').split(',')
      .some(v=>v.trim()==='POST'),'CORS no permite POST');
    assert((report.api.hostPreflight.headers || '').toLowerCase().split(',')
      .some(v=>v.trim()==='content-type'),'CORS no permite Content-Type');

    await command('POST',route('/timeouts'),{script:45000});
    report.api.fromWebview = await command('POST',route('/execute/async'),{
      script:`const endpoint=arguments[0],done=arguments[arguments.length-1];
        const ctrl=new AbortController();
        const timer=setTimeout(()=>ctrl.abort(),25000);
        fetch(endpoint,{
          method:'POST',mode:'cors',credentials:'omit',cache:'no-store',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify({
            correo:'qa21-noexiste-'+Date.now()+'-'+Math.random().toString(16).slice(2)+'@qa.example.test',
            password:'Incorrecta-QA21#2026'
          }),
          signal:ctrl.signal
        })
        .then(async r=>{
          const body=await r.json();
          done({status:r.status,json:body!==null&&typeof body==='object',
            origin:location.origin});
        })
        .catch(e=>done({error:e.name,message:e.message}))
        .finally(()=>clearTimeout(timer));`,
      args:[target]
    });
    assert.equal(report.api.fromWebview.status,401,
      'El APK no obtuvo el 401 esperado');
    assert.equal(report.api.fromWebview.json,true);
    assert.equal(report.api.fromWebview.origin,'https://localhost');
    report.api.outcome='PASS';
  }

  await command('POST', route('/appium/context'), { name: 'NATIVE_APP' });
  assert.equal(await command('GET', route('/appium/context')), 'NATIVE_APP');
  report.steps.push('NATIVE_APP');
  await screenshot();

  if (controlled) {
    try {
      await command('POST', route('/element'), {
        using: 'id', value: 'edu.upch.creo.qa:id/qa21_elemento_inexistente'
      });
      throw new Error('El elemento inexistente aparecio inesperadamente');
    } catch (error) {
      if (error.code !== 'no such element') throw error;
      await screenshot();
      report.diagnostic = {
        expected: true, error: error.code,
        selector: 'edu.upch.creo.qa:id/qa21_elemento_inexistente'
      };
      report.outcome = 'EXPECTED_FAILURE';
      process.exitCode = 1;
    }
  } else report.outcome = 'PASS';
} catch (error) {
  report.error = { code: error.code || error.name, message: error.message.slice(0, 1800) };
  process.exitCode = 1;
  if (session) {
    try {
      await command('POST', route('/appium/context'), { name: 'NATIVE_APP' });
      await screenshot();
    } catch {}
  }
} finally {
  if (session) {
    try {
      await command('DELETE', route(''));
      report.sessionClosed = true;
    } catch (error) {
      report.sessionClosed = false;
      report.cleanupError = error.code || error.name;
      process.exitCode = 1;
    }
  }
  report.finished = new Date().toISOString();
  writeFileSync(join(out, 'resultado.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  console.log('EVIDENCIA:', out);
}
