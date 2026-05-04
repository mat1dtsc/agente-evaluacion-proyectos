/**
 * Payback (período de recuperación) en años, con interpolación lineal
 * dentro del año en que el acumulado pasa de negativo a positivo.
 * Asume cashflows[0] es la inversión negativa.
 * Devuelve Infinity si nunca se recupera dentro del horizonte.
 */
export function payback(cashflows: number[]): number {
  let acumulado = 0;
  for (let t = 0; t < cashflows.length; t += 1) {
    const previo = acumulado;
    acumulado += cashflows[t];
    if (previo < 0 && acumulado >= 0) {
      const fraccion = -previo / cashflows[t];
      return (t - 1) + fraccion;
    }
  }
  return Number.POSITIVE_INFINITY;
}
