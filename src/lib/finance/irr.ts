import { npv } from './npv';

/**
 * Tasa Interna de Retorno por Newton-Raphson.
 * Robustez: si Newton-Raphson no converge en 100 iteraciones, cae a bisección
 * sobre [-0.99, 10] como fallback. Devuelve NaN si no hay raíz (todos los flujos
 * del mismo signo) o si la búsqueda falla.
 */
export function irr(cashflows: number[], guess: number = 0.1): number {
  if (cashflows.length < 2) return NaN;
  const hasPositive = cashflows.some((c) => c > 0);
  const hasNegative = cashflows.some((c) => c < 0);
  if (!hasPositive || !hasNegative) return NaN;

  // Newton-Raphson
  let rate = guess;
  const maxIter = 100;
  const tol = 1e-7;
  for (let i = 0; i < maxIter; i += 1) {
    const f = npv(cashflows, rate);
    if (Math.abs(f) < tol) return rate;
    // Derivada del NPV respecto a la tasa
    let dF = 0;
    for (let t = 1; t < cashflows.length; t += 1) {
      dF -= (t * cashflows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (dF === 0) break;
    const next = rate - f / dF;
    if (next <= -1) {
      rate = (rate - 0.99) / 2;
      continue;
    }
    if (Math.abs(next - rate) < tol) return next;
    rate = next;
  }

  // Fallback: bisección
  let lo = -0.99;
  let hi = 10;
  let fLo = npv(cashflows, lo);
  let fHi = npv(cashflows, hi);
  if (fLo * fHi > 0) return NaN;
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    const fMid = npv(cashflows, mid);
    if (Math.abs(fMid) < tol) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}
