export function applyPatch<T extends Record<string, any>>(state: T, patch: Record<string, any>): T {
  return deepMerge(state, patch) as T;
}

function deepMerge(target: any, patch: any): any {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return patch;
  }

  const result = { ...(target || {}) };

  Object.keys(patch).forEach((key) => {
    const patchValue = patch[key];
    const targetValue = target ? target[key] : undefined;

    if (patchValue && typeof patchValue === 'object' && !Array.isArray(patchValue)) {
      result[key] = deepMerge(targetValue || {}, patchValue);
    } else {
      result[key] = patchValue;
    }
  });

  return result;
}
