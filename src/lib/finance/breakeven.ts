import { buildPureFlow } from './puroFlow';
import type { ProjectInputs } from './types';

/**
 * Encuentra la demanda mínima diaria (combos/día) para que VAN = 0
 * usando búsqueda binaria sobre el flujo puro. Útil para responder
 * "¿cuántos combos al día necesito vender para que el proyecto deje de
 * destruir valor?".
 */
export function breakeven(
  inputs: ProjectInputs,
  options: { lo?: number; hi?: number; tol?: number } = {},
): number {
  const lo0 = options.lo ?? 0;
  const hi0 = options.hi ?? 5000;
  const tol = options.tol ?? 0.5; // 0.5 combos de tolerancia

  let lo = lo0;
  let hi = hi0;
  const vanAt = (combos: number) =>
    buildPureFlow({ ...inputs, combosPorDiaBase: combos }).van;

  // Si VAN(lo) >= 0, el proyecto ya es rentable con cero combos (improbable)
  if (vanAt(lo) >= 0) return lo;
  // Si VAN(hi) < 0, expandimos hi
  let attempts = 0;
  while (vanAt(hi) < 0 && attempts < 20) {
    hi *= 2;
    attempts += 1;
  }
  if (vanAt(hi) < 0) return Number.POSITIVE_INFINITY;

  for (let i = 0; i < 100; i += 1) {
    const mid = (lo + hi) / 2;
    if (hi - lo < tol) return mid;
    if (vanAt(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
