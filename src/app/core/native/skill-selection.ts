export interface NativeSkillOption { id: number; label: string; }
export interface NativeSkillResult { confirmed: boolean; selectedIds?: number[]; }
/** Cancellation is distinct from applying an empty filter. Never trust bridge IDs. */
export function validateSkillSelection(result: NativeSkillResult, allowed: NativeSkillOption[]): number[] | null {
  if (!result || result.confirmed !== true) return null;
  const ids = result.selectedIds;
  const valid = new Set(allowed.map(option => option.id));
  if (!Array.isArray(ids) || ids.length > 3 || new Set(ids).size !== ids.length ||
      ids.some(id => !Number.isSafeInteger(id) || !valid.has(id))) {
    throw new Error('Selección de habilidades inválida. No se modificaron los filtros.');
  }
  return [...ids];
}
