/**
 * Valor Actual Neto (VAN / NPV).
 * Convención clásica del curso: cashflows[0] es el período 0 (inversión negativa),
 * cashflows[t] se descuenta dividiendo por (1+rate)^t.
 */
export function npv(cashflows: number[], rate: number): number {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}
