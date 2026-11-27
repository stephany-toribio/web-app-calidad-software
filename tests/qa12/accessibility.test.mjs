import '@angular/compiler';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ElementRef, Injector, runInInjectionContext } from '@angular/core';
import { CreoFieldComponent } from '../../src/app/components/creo-design-system/creo-field/creo-field.component.ts';
import { CreoSelectComponent } from '../../src/app/components/creo-design-system/creo-select/creo-select.component.ts';
import { AccessibleDialogDirective } from '../../src/app/core/accessibility/accessible-dialog.directive.ts';
for (const Type of [CreoFieldComponent, CreoSelectComponent]) {
  test(Type.name + ': identidad única y errores asociados al control estable', () => {
    const first = new Type(); const second = new Type(); assert.notEqual(first.controlId, second.controlId);
    first.testId = 'login-email'; assert.equal(first.controlId, 'creo-login-email');
    first.error = 'Campo inválido'; assert.equal(first.descriptionId, 'creo-login-email-error');
    first.error = undefined; assert.equal(first.descriptionId, null);
  });
}
function dialog() {
  const doc = { activeElement: null }; const attributes = {};
  const control = () => ({ hidden: false, isConnected: true, getClientRects: () => [1], focus() { doc.activeElement = this; } });
  const trigger = control(); trigger.focus(); const first = control(); const last = control();
  const element = { ownerDocument: doc, querySelectorAll: () => [first,last], setAttribute: (k,v) => attributes[k]=v, focus() { doc.activeElement=this; } };
  const injector = Injector.create({ providers: [{ provide: ElementRef, useValue: new ElementRef(element) }] });
  const directive = runInInjectionContext(injector, () => new AccessibleDialogDirective());
  return { directive, doc, attributes, first, last, trigger };
}
function key(key, shiftKey=false) { return {key,shiftKey,prevented:false,preventDefault(){this.prevented=true;}}; }
test('diálogo establece semántica, captura foco y lo devuelve al disparador', () => {
  const d=dialog();d.directive.ngAfterViewInit();assert.equal(d.attributes.role,'dialog');assert.equal(d.doc.activeElement,d.first);
  d.directive.ngOnDestroy();assert.equal(d.doc.activeElement,d.trigger);
});
test('Tab y Shift+Tab permanecen dentro del diálogo; Escape solicita cancelar', () => {
  const d=dialog();d.directive.ngAfterViewInit();
  const backward=key('Tab',true);d.directive.onKey(backward);assert.equal(d.doc.activeElement,d.last);assert.ok(backward.prevented);
  const forward=key('Tab');d.directive.onKey(forward);assert.equal(d.doc.activeElement,d.first);assert.ok(forward.prevented);
  let cancelled=0;d.directive.dialogDismiss.subscribe(()=>cancelled++);d.directive.onKey(key('Escape'));assert.equal(cancelled,1);
});
