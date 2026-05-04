import type { AmortizationRow } from './types';

/**
 * Tabla de amortización francesa (cuota constante).
 * principal: monto del préstamo
 * tasa: tasa periódica (anual si plazo en años)
 * plazo: número de períodos
 */
export function amortFrances(
  principal: number,
  tasa: number,
  plazo: number,
): AmortizationRow[] {
  if (principal <= 0 || plazo <= 0) return [];
  const cuota = tasa === 0
    ? principal / plazo
    : (principal * tasa) / (1 - Math.pow(1 + tasa, -plazo));

  const rows: AmortizationRow[] = [];
  let saldo = principal;
  for (let p = 1; p <= plazo; p += 1) {
    const intereses = saldo * tasa;
    const amortizacion = cuota - intereses;
    saldo = Math.max(0, saldo - amortizacion);
    rows.push({ periodo: p, cuota, intereses, amortizacion, saldo });
  }
  return rows;
}
