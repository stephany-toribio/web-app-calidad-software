import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const home = dirname(fileURLToPath(import.meta.url));
const server = process.env.APPIUM_URL || 'http://127.0.0.1:4723';
assert(['localhost','127.0.0.1'].includes(new URL(server).hostname));
const serial = process.env.ANDROID_SERIAL;
const pkg = process.env.QA21_PWA_PACKAGE;
assert(serial && /^org\.chromium\.webapk\.[\w.]+$/.test(pkg || ''));
const origin = new URL(process.env.QA21_PWA_URL).origin;
assert(origin.startsWith('https://'));

const sdk = process.env.ANDROID_HOME ||
  join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
const adb = join(sdk, 'platform-tools', 'adb.exe');
const installed = execFileSync(adb,
  ['-s',serial,'shell','pm','path',pkg], {encoding:'utf8'});
assert(installed.includes('package:'), 'WebAPK no instalado');

const caps = JSON.parse(readFileSync(
  join(home,'capabilities.apk.json'),'utf8').replace(/^\uFEFF/,''));
Object.assign(caps, {
  'appium:udid': serial,
  'appium:appPackage': 'com.android.chrome',
  'appium:appActivity':
    'org.chromium.chrome.browser.webapps.SameTaskWebApkActivity',
  'appium:autoLaunch': false,
  'appium:forceAppLaunch': false,
  'appium:chromeUseRunningApp': true,
  'appium:chromedriverExecutableDir': join(home,'.tools','chromedrivers')
});
mkdirSync(caps['appium:chromedriverExecutableDir'], {recursive:true});

const out = resolve(home,'../../docs/evidencias/QA-21/ejecucion-windows',
  'pwa-'+new Date().toISOString().replace(/[:.]/g,'-'));
mkdirSync(out,{recursive:true});
const report = {
  started:new Date().toISOString(), scope:'PWA',
  launchPackage:pkg, expectedOrigin:origin, steps:[], outcome:'FAIL'
};
let session;
async function cmd(method,path,body) {
  const r = await fetch(server+path,{
    method, headers:{'Content-Type':'application/json'},
    body:body===undefined?undefined:JSON.stringify(body),
    signal:AbortSignal.timeout(180000)
  });
  const data = await r.json();
  if (!r.ok || data.value?.error)
    throw new Error((data.value?.message || r.statusText)
      .replaceAll(serial,'<device>'));
  return data.value;
}
const route = p => '/session/'+session+p;
try {
  const status = await cmd('GET','/status');
  assert(status.ready);
  report.appium = status.build?.version;
  const created = await cmd('POST','/session',{
    capabilities:{alwaysMatch:caps,firstMatch:[{}]}
  });
  session = created.sessionId;
  assert(session);
  assert.equal(await cmd('GET',route('/appium/context')),'NATIVE_APP');
  report.steps.push('NATIVE_APP');

  execFileSync(adb, [
    '-s',serial,'shell','am','start','-W',
    '-a','android.intent.action.VIEW',
    '-d',origin+'/creo/landing',
    '-p','com.android.chrome'
  ], {encoding:'utf8',timeout:30000});
  report.chromeBootstrap = true;
  await cmd('POST',route('/appium/device/activate_app'),{appId:pkg});
  report.launchedByAppium = true;
  let context;
  const deadline = Date.now()+90000;
  while(Date.now()<deadline) {
    const contexts = await cmd('GET',route('/appium/contexts'));
    report.contexts = contexts.filter(c =>
      c==='NATIVE_APP' || /chrome|chromium/i.test(c));
    context = contexts.find(c => c!=='NATIVE_APP' &&
      /chrome|chromium/i.test(c));
    if(context) break;
    await new Promise(r=>setTimeout(r,1000));
  }
  assert(context,'No aparece el contexto de Chrome');
  await cmd('POST',route('/appium/context'),{name:context});
  report.steps.push(context);

  const windowDeadline = Date.now()+45000;
  while(!report.web && Date.now()<windowDeadline) {
    const handles = await cmd('GET',route('/window/handles'));
    for(const handle of handles) {
      try {
        await cmd('POST',route('/window'),{handle});
        const result = await cmd('POST',route('/execute/sync'),{
          script: `return {
            origin:location.origin, path:location.pathname,
            title:document.title,
            standalone:matchMedia('(display-mode: standalone)').matches,
            serviceWorker:navigator.serviceWorker?.controller?.scriptURL ?? null,
            native:globalThis.Capacitor?.isNativePlatform?.()===true,
            userAgent:navigator.userAgent
          }`, args:[]
        });
        if(result.origin===origin && result.standalone) {
          report.web=result;
          break;
        }
      } catch {}
    }
    if(!report.web) await new Promise(r=>setTimeout(r,1000));
  }
  assert(report.web,'No se encontro CREO en modo standalone');
  assert.equal(report.web.native,false);
  assert.equal(report.web.serviceWorker,origin+'/ngsw-worker.js');
  await cmd('POST',route('/appium/context'),{name:'NATIVE_APP'});
  assert.equal(await cmd('GET',route('/appium/context')),'NATIVE_APP');
  report.steps.push('NATIVE_APP');
  report.outcome='PASS';
} catch(error) {
  report.error=error.message.slice(0,1800);
  process.exitCode=1;
} finally {
  if(session) {
    try {
      await cmd('POST',route('/appium/context'),{name:'NATIVE_APP'});
      const png=await cmd('GET',route('/screenshot'));
      writeFileSync(join(out,'pantalla.png'),Buffer.from(png,'base64'));
    } catch {}
    try {
      await cmd('DELETE',route(''));
      report.sessionClosed=true;
    } catch {
      report.sessionClosed=false;
      report.outcome='FAIL';
      process.exitCode=1;
    }
  }
  report.finished=new Date().toISOString();
  writeFileSync(join(out,'resultado.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  console.log('EVIDENCIA:',out);
}
