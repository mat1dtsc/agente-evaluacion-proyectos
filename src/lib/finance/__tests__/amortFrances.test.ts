import { describe, it, expect } from 'vitest';
import { amortFrances } from '../amortFrances';

describe('amortFrances', () => {
  it('Suma de amortizaciones = principal', () => {
    const rows = amortFrances(1_000_000, 0.10, 5);
    const totalAmort = rows.reduce((s, r) => s + r.amortizacion, 0);
    expect(totalAmort).toBeCloseTo(1_000_000, 0);
  });

  it('Cuota constante en todos los períodos', () => {
    const rows = amortFrances(500_000, 0.08, 4);
    const cuota = rows[0].cuota;
    for (const r of rows) {
      expect(r.cuota).toBeCloseTo(cuota, 5);
    }
  });

  it('Saldo final es cero', () => {
    const rows = amortFrances(2_000_000, 0.12, 6);
    expect(rows[rows.length - 1].saldo).toBeCloseTo(0, 0);
  });

  it('Tasa cero: cuota = principal / plazo', () => {
    const rows = amortFrances(1000, 0, 4);
    expect(rows[0].cuota).toBe(250);
    expect(rows.every((r) => r.intereses === 0)).toBe(true);
  });

  it('Caso clásico: 1M a 10% por 5 años, cuota ≈ 263.797', () => {
    const rows = amortFrances(1_000_000, 0.10, 5);
    expect(rows[0].cuota).toBeCloseTo(263_797.48, 2);
  });
});
