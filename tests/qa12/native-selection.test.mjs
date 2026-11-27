import '@angular/compiler';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSkillSelection } from '../../src/app/core/native/skill-selection.ts';
import { cargarMetodos } from '../qa06/harness.mjs';
const options = [1, 2, 3, 4].map(id => ({ id, label: 'Habilidad ' + id }));
test('cancelar conserva la selección; aplicar vacío elimina los filtros', () => {
  assert.equal(validateSkillSelection({ confirmed: false, selectedIds: [2] }, options), null);
  assert.deepEqual(validateSkillSelection({ confirmed: true, selectedIds: [] }, options), []);
});
test('rechaza IDs ajenos, duplicados, más de tres y tipos incorrectos', () => {
  for (const selectedIds of [[99], [1, 1], [1, 2, 3, 4], ['1'], undefined]) {
    assert.throws(() => validateSkillSelection({ confirmed: true, selectedIds }, options));
  }
});
test('la confirmación devuelve una copia independiente', () => {
  const source = [1, 3]; const result = validateSkillSelection({ confirmed: true, selectedIds: source }, options);
  source.push(4); assert.deepEqual(result, [1, 3]);
});
const Harness = cargarMetodos('src/app/screens/creo/candidate-jobs/candidate-jobs.component.ts', 'CandidateJobsComponent', ['chooseNativeSkills'], { navigator: { onLine: true }, validateSkillSelection });
function setup(result, reject = false) {
  const h = new Harness(); let requests = 0;
  Object.assign(h, { nativeSkillsBusy: false, destroyed: false, nativeSkillsError: '', skillOptions: options, selectedSkills: new Set([1]), nativeSkills: { available: true, choose: async () => { if (reject) throw Error('bridge'); return result; } }, aplicarFiltros: () => requests++ });
  return { h, requests: () => requests };
}
test('cancelación nativa no dispara búsquedas ni modifica filtros', async () => {
  const { h, requests } = setup({ confirmed: false }); await h.chooseNativeSkills();
  assert.deepEqual([...h.selectedSkills], [1]); assert.equal(requests(), 0); assert.equal(h.nativeSkillsBusy, false);
});
test('confirmar aplica los IDs reales y consulta una sola vez', async () => {
  const { h, requests } = setup({ confirmed: true, selectedIds: [2, 3] }); await h.chooseNativeSkills();
  assert.deepEqual([...h.selectedSkills], [2, 3]); assert.equal(requests(), 1);
});
for (const [name, result, reject] of [['fallo del puente', null, true], ['resultado inválido', { confirmed: true, selectedIds: [999] }, false]]) {
  test(name + ': conserva filtros y comunica el error', async () => {
    const { h, requests } = setup(result, reject); await h.chooseNativeSkills();
    assert.deepEqual([...h.selectedSkills], [1]); assert.equal(requests(), 0); assert.ok(h.nativeSkillsError);
  });
}
test('no aplica resultados de un diálogo después de abandonar la pantalla', async () => {
  const { h, requests } = setup({ confirmed: true, selectedIds: [2] }); h.destroyed = true;
  await h.chooseNativeSkills(); assert.equal(requests(), 0); assert.deepEqual([...h.selectedSkills], [1]);
});
